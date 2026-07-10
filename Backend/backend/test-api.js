const axios = require("axios");

const FINAL_GOV_URL =
  "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24?api-key=579b464db66ec23bdd0000017b143b014d884b8d622949f62c07b1aa&format=json&limit=100&offset=0&filters%5BState%5D=Maharashtra&filters%5BDistrict%5D=Sangli&filters%5BCommodity%5D=Onion&sort%5BArrival_Date%5D=desc";

const REQUEST_TIMEOUT_MS = 30_000;

async function runOnce(runNumber) {
  const start = Date.now();
  let success = false;
  let httpStatus = null;
  let recordCount = null;

  try {
    const response = await axios.get(FINAL_GOV_URL, {
      timeout: REQUEST_TIMEOUT_MS,
    });
    const elapsedMs = Date.now() - start;
    success = true;
    httpStatus = response.status;
    recordCount = Array.isArray(response.data?.records)
      ? response.data.records.length
      : null;

    console.log("Run number:", runNumber);
    console.log("Elapsed milliseconds:", elapsedMs);
    console.log("Success/Failure:", "Success");
    console.log("HTTP status:", httpStatus);
    console.log("Number of records:", recordCount);
    console.log("---");
  } catch (error) {
    const elapsedMs = Date.now() - start;
    httpStatus = error.response?.status ?? null;
    recordCount = Array.isArray(error.response?.data?.records)
      ? error.response.data.records.length
      : null;

    console.log("Run number:", runNumber);
    console.log("Elapsed milliseconds:", elapsedMs);
    console.log("Success/Failure:", "Failure");
    console.log("HTTP status:", httpStatus);
    console.log("Number of records:", recordCount);
    console.log("Error code:", error.code);
    console.log("Error message:", error.message);
    console.log("---");
  }
}

(async () => {
  for (let run = 1; run <= 3; run += 1) {
    await runOnce(run);
  }
})();
