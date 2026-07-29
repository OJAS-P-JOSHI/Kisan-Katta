/**
 * Ensures Web Crypto (`globalThis.crypto`) is available before any MongoDB
 * driver code runs.
 *
 * MongoDB Node driver ≥7.2 uses the Web Crypto API (`crypto.getRandomValues`,
 * `crypto.subtle`) via the unbound global `crypto` → `globalThis.crypto`.
 *
 * Node.js exposes that global by default from v19+. If a host boots an older
 * Node, `globalThis.crypto` is missing and SCRAM auth fails with:
 *   ReferenceError: crypto is not defined
 *
 * On Node 22 this is a no-op. Assignment uses Node's `webcrypto` export only
 * when the global is entirely absent — never overwrites an existing crypto.
 */
import { webcrypto } from "node:crypto";

const ensureWebCrypto = (): void => {
  // Never replace a runtime-provided Web Crypto implementation.
  if (typeof globalThis.crypto !== "undefined") {
    return;
  }

  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    writable: false,
    configurable: true,
    enumerable: true,
  });
};

ensureWebCrypto();

export {};
