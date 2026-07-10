const url =
  "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24?api-key=579b464db66ec23bdd0000017b143b014d884b8d622949f62c07b1aa&format=json&limit=100&offset=0&filters%5BState%5D=Maharashtra&filters%5BDistrict%5D=Sangli&filters%5BCommodity%5D=Onion&sort%5BArrival_Date%5D=desc";

const TOTAL_RUNS = 5;

const results = [];

async function runOnce(runNumber) {
  const start = Date.now();

  try {
    const response = await fetch(url);
    const data = await response.json();
    const elapsedMs = Date.now() - start;

    const records = Array.isArray(data.records) ? data.records : [];
    const firstDate = records[0]?.Arrival_Date ?? "N/A";

    console.log(`Run ${runNumber}`);
    console.log(`Status: ${response.status}`);
    console.log(`Time: ${elapsedMs} ms`);
    console.log(`Records: ${records.length}`);
    console.log(`Count: ${data.count ?? "N/A"}`);
    console.log(`Total: ${data.total ?? "N/A"}`);
    console.log(`First Date: ${firstDate}`);
    console.log("---");

    results.push({
      success: true,
      elapsedMs,
      status: response.status,
      recordsLength: records.length,
    });
  } catch (error) {
    const elapsedMs = Date.now() - start;

    console.log(`Run ${runNumber}`);
    console.log("FAILED");
    console.log(`Error name: ${error.name}`);
    console.log(`Error message: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
    console.log(`Time before failure: ${elapsedMs} ms`);
    console.log("---");

    results.push({
      success: false,
      elapsedMs,
    });
  }
}

(async () => {
  for (let run = 1; run <= TOTAL_RUNS; run += 1) {
    await runOnce(run);
  }

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const elapsedTimes = results.map((r) => r.elapsedMs);

  const average =
    elapsedTimes.length > 0
      ? Math.round(elapsedTimes.reduce((sum, t) => sum + t, 0) / elapsedTimes.length)
      : 0;

  console.log("=========================");
  console.log("SUMMARY");
  console.log("=========================");
  console.log(`Total Runs: ${TOTAL_RUNS}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log("");
  console.log(`Average Response Time: ${average} ms`);
  console.log(`Fastest: ${elapsedTimes.length > 0 ? Math.min(...elapsedTimes) : 0} ms`);
  console.log(`Slowest: ${elapsedTimes.length > 0 ? Math.max(...elapsedTimes) : 0} ms`);
})();
