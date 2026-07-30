import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { GovApiResponse, GovMarketRecord } from "./market.types";

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_CONCURRENT_GOV_REQUESTS = 2;
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [2_000, 5_000] as const;
const GOV_API_URL = `${env.marketApiBaseUrl}/resource/${env.marketDatasetId}`;

/**
 * Fields required by MarketPriceDTO / intelligence. Benchmark showed dropping
 * Variety/Grade shrinks payload ~17% but would blank DTO fields — keep all.
 */
const DISTRICT_FIELDS =
  "State,District,Market,Commodity,Variety,Grade,Arrival_Date,Min_Price,Max_Price,Modal_Price";

/**
 * Benchmark (Nashik, MARKET_RECENT_DAYS=20): limit 1500 already matches 5000
 * for normalized rows (147) and commodities (50). 2000 adds headroom for
 * busier districts without downloading ~1.9MB of mostly discarded history.
 * Override via MARKET_DISTRICT_LIMIT if needed.
 */
const resolveDistrictLimit = (): number => {
  const raw = Number(process.env.MARKET_DISTRICT_LIMIT);
  if (Number.isInteger(raw) && raw >= 100 && raw <= 5000) return raw;
  return 2000;
};

const DISTRICT_LIMIT = resolveDistrictLimit();
const IS_DEV = process.env.NODE_ENV !== "production";

export interface GovFetchContext {
  state: string;
  district: string;
}

export interface GovFetchTiming {
  totalMs: number;
  ttfbMs: number;
  downloadMs: number;
  parseMs: number;
  bytes: number;
  attempt: number;
}

const marketLog = {
  info: (message: string, meta?: Record<string, unknown>): void => {
    // eslint-disable-next-line no-console
    console.log(`[market] ${message}`, meta ?? "");
  },
  warn: (message: string, meta?: Record<string, unknown>): void => {
    // eslint-disable-next-line no-console
    console.warn(`[market] ${message}`, meta ?? "");
  },
  error: (message: string, meta?: Record<string, unknown>): void => {
    // eslint-disable-next-line no-console
    console.error(`[market] ${message}`, meta ?? "");
  },
};

export { marketLog };

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Simple semaphore — at most MAX_CONCURRENT_GOV_REQUESTS in flight. */
class GovConcurrencyGate {
  private active = 0;
  private readonly waiters: Array<() => void> = [];

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    if (this.active < MAX_CONCURRENT_GOV_REQUESTS) {
      this.active += 1;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.waiters.push(() => {
        this.active += 1;
        resolve();
      });
    });
  }

  private release(): void {
    this.active -= 1;
    const next = this.waiters.shift();
    if (next) next();
  }
}

const govGate = new GovConcurrencyGate();

const buildGovApiUrl = (params: Record<string, string | number>): string => {
  const url = new URL(GOV_API_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, String(value));
  }
  return url.toString();
};

export const extractErrorMeta = (error: unknown): Record<string, unknown> => {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }

  const meta: Record<string, unknown> = {
    name: error.name,
    message: error.message,
  };

  const withCode = error as Error & { code?: string; cause?: unknown };
  if (withCode.code) meta.code = withCode.code;
  if (withCode.cause instanceof Error) {
    meta.cause = withCode.cause.message;
    meta.causeName = withCode.cause.name;
    const causeCode = (withCode.cause as Error & { code?: string }).code;
    if (causeCode) meta.causeCode = causeCode;
  } else if (withCode.cause != null) {
    meta.cause = String(withCode.cause);
  }

  if (IS_DEV && error.stack) {
    meta.stack = error.stack;
  }

  return meta;
};

/** Prefer nested Undici/cause details when present (e.g. ConnectTimeoutError). */
const describeGovFailure = (
  error: unknown
): { errorName: string; errorCode?: string; message: string } => {
  if (!(error instanceof Error)) {
    return { errorName: "Unknown", message: String(error) };
  }

  const withCause = error as Error & { code?: string; cause?: unknown };
  const cause =
    withCause.cause instanceof Error
      ? (withCause.cause as Error & { code?: string })
      : null;

  return {
    errorName: cause?.name || error.name,
    errorCode: cause?.code || withCause.code,
    message: error.message,
  };
};

class RetryableGovError extends Error {
  readonly httpStatus?: number;

  constructor(message: string, httpStatus?: number, cause?: unknown) {
    super(message);
    this.name = "RetryableGovError";
    this.httpStatus = httpStatus;
    if (cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = cause;
    }
  }
}

const isRetryableError = (error: unknown): boolean => {
  if (error instanceof RetryableGovError) return true;
  if (!(error instanceof Error)) return false;
  if (error.name === "AbortError") return false;

  const code = (error as Error & { code?: string }).code ?? "";
  const message = error.message.toLowerCase();

  if (error.name === "TypeError" && message.includes("fetch failed")) return true;
  if (code === "ETIMEDOUT" || code === "ECONNRESET" || code === "ECONNREFUSED") return true;
  if (code === "UND_ERR_CONNECT_TIMEOUT" || message.includes("connect timeout")) return true;
  if (message.includes("network") && message.includes("unreachable")) return true;

  return false;
};

const mapGovApiError = (error: unknown, context: GovFetchContext): AppError => {
  if (error instanceof AppError) return error;

  if (error instanceof Error && error.name === "AbortError") {
    marketLog.error("Government API timeout", {
      ...extractErrorMeta(error),
      district: context.district,
    });
    return new AppError("Government market data service timed out", 504);
  }

  if (error instanceof Error) {
    marketLog.error("Government API unavailable", {
      ...extractErrorMeta(error),
      district: context.district,
    });
    return new AppError("Government market data service is unavailable", 503);
  }

  return new AppError("Unexpected error while fetching market prices", 500);
};

interface DistrictFetchResult {
  records: GovMarketRecord[];
  timing: GovFetchTiming;
}

/**
 * Single Government HTTP call for an entire district (no commodity filter).
 * Arrival_Date range filters are NOT supported by OGD — exact match only —
 * so recent-window filtering stays client-side after sort[Arrival_Date]=desc.
 */
const fetchDistrictOnce = async (
  context: GovFetchContext
): Promise<DistrictFetchResult> => {
  if (!env.marketApiKey) {
    throw new AppError("Government market data API key is not configured", 500);
  }

  const params: Record<string, string | number> = {
    "api-key": env.marketApiKey,
    format: "json",
    limit: DISTRICT_LIMIT,
    offset: 0,
    fields: DISTRICT_FIELDS,
    "filters[State]": context.state.trim(),
    "filters[District]": context.district.trim(),
    "sort[Arrival_Date]": "desc",
  };

  const finalUrl = buildGovApiUrl(params);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const t0 = Date.now();
  let response: Response;
  try {
    try {
      response = await fetch(finalUrl, { signal: controller.signal });
    } catch (error) {
      if (isRetryableError(error)) {
        throw new RetryableGovError(
          error instanceof Error ? error.message : "fetch failed",
          undefined,
          error
        );
      }
      throw error;
    }
  } finally {
    clearTimeout(timeoutId);
  }
  const ttfbMs = Date.now() - t0;

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new AppError("Government market data API key is invalid", 500);
    }
    if (response.status === 404) {
      throw new AppError("Government market data resource not found", 404);
    }
    if (response.status === 400) {
      throw new AppError("Government market data request was invalid", 400);
    }
    if (response.status === 429) {
      throw new RetryableGovError("Government API rate limited", 429);
    }
    throw new AppError("Government market data service is unavailable", 503);
  }

  const tDownload0 = Date.now();
  const rawText = await response.text();
  const downloadMs = Date.now() - tDownload0;
  const bytes = Buffer.byteLength(rawText, "utf8");

  const tParse0 = Date.now();
  let responseData: GovApiResponse;
  try {
    responseData = JSON.parse(rawText) as GovApiResponse;
  } catch {
    throw new AppError("Unexpected response from government market data API", 502);
  }
  const parseMs = Date.now() - tParse0;

  if (!Array.isArray(responseData.records)) {
    throw new AppError("Unexpected response from government market data API", 502);
  }

  return {
    records: responseData.records,
    timing: {
      totalMs: Date.now() - t0,
      ttfbMs,
      downloadMs,
      parseMs,
      bytes,
      attempt: 1,
    },
  };
};

/**
 * Fetch district rows with concurrency limit + retry (429 / fetch failed / connect).
 */
export const fetchDistrictRecordsFromGov = async (
  context: GovFetchContext
): Promise<GovMarketRecord[]> => {
  marketLog.info(`Fetching Government data: ${context.district}`, {
    state: context.state,
    district: context.district,
    limit: DISTRICT_LIMIT,
    fields: DISTRICT_FIELDS,
  });

  const started = Date.now();

  return govGate.run(async () => {
    let lastError: unknown;
    let lastAttempt = 0;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      lastAttempt = attempt;
      const attemptStarted = Date.now();
      try {
        const { records, timing } = await fetchDistrictOnce(context);
        const totalElapsedMs = Date.now() - started;

        if (attempt > 1) {
          marketLog.info("Government request recovered", {
            state: context.state,
            district: context.district,
            recoveredOnAttempt: attempt,
            totalAttempts: attempt,
            totalElapsedMs,
          });
        }

        marketLog.info(
          `Government request completed in ${totalElapsedMs} ms`,
          {
            state: context.state,
            district: context.district,
            records: records.length,
            attempt,
            ttfbMs: timing.ttfbMs,
            downloadMs: timing.downloadMs,
            parseMs: timing.parseMs,
            bytes: timing.bytes,
            wallMs: timing.totalMs,
          }
        );
        return records;
      } catch (error) {
        lastError = error;
        const elapsedMs = Date.now() - attemptStarted;
        const failure = describeGovFailure(error);

        if (error instanceof AppError && !isRetryableError(error)) {
          throw error;
        }

        const willRetry = isRetryableError(error) && attempt < MAX_ATTEMPTS;
        if (willRetry) {
          const retryInMs = RETRY_DELAYS_MS[attempt - 1] ?? 5_000;
          marketLog.warn("Government request failed", {
            state: context.state,
            district: context.district,
            attempt,
            maxAttempts: MAX_ATTEMPTS,
            retryInMs,
            elapsedMs,
            errorName: failure.errorName,
            errorCode: failure.errorCode,
            message: failure.message,
          });
          await sleep(retryInMs);
          continue;
        }

        break;
      }
    }

    const finalFailure = describeGovFailure(lastError);
    marketLog.error("Government request permanently failed", {
      state: context.state,
      district: context.district,
      totalAttempts: lastAttempt,
      totalElapsedMs: Date.now() - started,
      finalErrorName: finalFailure.errorName,
      finalErrorCode: finalFailure.errorCode,
      message: finalFailure.message,
    });

    throw mapGovApiError(lastError, context);
  });
};

export const getConfiguredDistrictLimit = (): number => DISTRICT_LIMIT;
