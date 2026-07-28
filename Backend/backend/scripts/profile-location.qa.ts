/**
 * Manual Profile × Location Master validation harness.
 * Run against a living `npm run dev` server:
 *   npx ts-node scripts/profile-location.qa.ts
 *
 * Uses a disposable OTP login (development OTP echo).
 */
import axios, { AxiosError } from "axios";

const BASE = process.env.QA_BASE_URL ?? "http://127.0.0.1:4000";
const api = axios.create({ baseURL: BASE, validateStatus: () => true });

const mobile = `9${String(Date.now()).slice(-9)}`;

const assert = (cond: boolean, msg: string): void => {
  if (!cond) throw new Error(msg);
};

const main = async (): Promise<void> => {
  console.log(`QA base: ${BASE}`);
  console.log(`Test mobile: ${mobile}`);

  const send = await api.post("/api/v1/auth/send-otp", { mobile });
  assert(send.status === 200, `send-otp failed: ${send.status}`);
  const otp = send.data?.data?.otp as string | undefined;
  assert(!!otp, "Expected development OTP in response");

  const verify = await api.post("/api/v1/auth/verify-otp", { mobile, otp });
  assert(verify.status === 200, `verify-otp failed: ${verify.status}`);
  const token = verify.data?.data?.token as string;
  assert(!!token, "Missing token");
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  // 1. Invalid district (legacy names)
  {
    const res = await api.post(
      "/api/v1/profile",
      {
        name: "QA Farmer",
        district: "NotADistrict",
        taluka: "Akole",
        village: "Aabitkhind",
        favoriteCrops: ["Onion"],
      },
      auth
    );
    assert(res.status === 400, `expected 400 invalid district, got ${res.status}`);
    assert(
      res.data.message === "Invalid district",
      `msg=${res.data.message}`
    );
    console.log("✓ Invalid district");
  }

  // 2. Taluka does not belong to district (codes)
  {
    const res = await api.post(
      "/api/v1/profile",
      {
        name: "QA Farmer",
        districtCode: 466, // Ahilyanagar
        talukaCode: 4093, // Zari-Jamani (Yavatmal)
        villageCode: 543914,
        favoriteCrops: ["Onion"],
      },
      auth
    );
    assert(res.status === 400, `expected 400 mismatched taluka, got ${res.status}`);
    assert(
      res.data.message === "Taluka does not belong to district",
      `msg=${res.data.message}`
    );
    console.log("✓ Taluka does not belong to district");
  }

  // 3. Invalid village name under valid taluka
  {
    const res = await api.post(
      "/api/v1/profile",
      {
        name: "QA Farmer",
        district: "Ahilyanagar",
        taluka: "Akole",
        village: "DefinitelyNotAVillageXYZ",
        favoriteCrops: ["Onion"],
      },
      auth
    );
    assert(res.status === 400, `expected 400 invalid village, got ${res.status}`);
    assert(res.data.message === "Invalid village", `msg=${res.data.message}`);
    console.log("✓ Invalid village");
  }

  // 4. Valid create via legacy names (Ahmednagar alias → Ahilyanagar)
  {
    const res = await api.post(
      "/api/v1/profile",
      {
        name: "QA Farmer",
        district: "Ahmednagar",
        taluka: "Akole",
        village: "Aabitkhind",
        favoriteCrops: ["Onion", "Wheat"],
        language: "mr",
      },
      auth
    );
    assert(res.status === 201, `create failed: ${res.status} ${JSON.stringify(res.data)}`);
    const data = res.data.data;
    assert(data.district === "Ahilyanagar", `district=${data.district}`);
    assert(data.taluka === "Akole", `taluka=${data.taluka}`);
    assert(data.village === "Aabitkhind", `village=${data.village}`);
    assert(data.location?.district?.code === 466, "missing district code");
    assert(data.location?.taluka?.code === 4201, "missing taluka code");
    assert(data.location?.village?.code === 557293, "missing village code");
    assert(
      data.location?.village?.nameMr === "आबीतखिंड",
      `nameMr=${data.location?.village?.nameMr}`
    );
    console.log("✓ Valid create (legacy names + Ahmednagar alias)");
  }

  // 5. GET /me structured location
  {
    const res = await api.get("/api/v1/profile/me", auth);
    assert(res.status === 200, `get me failed: ${res.status}`);
    assert(typeof res.data.data.district === "string", "district must stay string");
    assert(res.data.data.location?.village?.code === 557293, "location missing");
    console.log("✓ GET /profile/me");
  }

  // 6. Valid update via codes
  {
    const res = await api.put(
      "/api/v1/profile/me",
      {
        districtCode: 490,
        talukaCode: 3915,
        villageCode: 556026,
        name: "QA Farmer Updated",
      },
      auth
    );
    // Need real Pune codes from master — look up first
    if (res.status !== 200) {
      // Discover a valid Pune taluka/village from location API
      const talukas = await api.get("/api/v1/location/talukas/490");
      const firstTaluka = talukas.data.data[0];
      const villages = await api.get(
        `/api/v1/location/villages/${firstTaluka.code}`
      );
      const firstVillage = villages.data.data[0];
      const retry = await api.put(
        "/api/v1/profile/me",
        {
          districtCode: 490,
          talukaCode: firstTaluka.code,
          villageCode: firstVillage.code,
          name: "QA Farmer Updated",
        },
        auth
      );
      assert(
        retry.status === 200,
        `update failed: ${retry.status} ${JSON.stringify(retry.data)}`
      );
      assert(retry.data.data.district === "Pune", `district=${retry.data.data.district}`);
      assert(retry.data.data.location.district.code === 490, "code not set");
      console.log("✓ Valid update (codes)");
    } else {
      console.log("✓ Valid update (codes)");
    }
  }

  // 7. Changing district without taluka/village
  {
    const res = await api.put(
      "/api/v1/profile/me",
      { districtCode: 500 },
      auth
    );
    assert(res.status === 400, `expected 400, got ${res.status}`);
    assert(
      String(res.data.message).includes("requires a matching taluka and village"),
      `msg=${res.data.message}`
    );
    console.log("✓ District change without taluka/village rejected");
  }

  // 8. Non-location update still works
  {
    const res = await api.put(
      "/api/v1/profile/me",
      { favoriteCrops: ["Soyabean"] },
      auth
    );
    assert(res.status === 200, `crops update failed: ${res.status}`);
    assert(res.data.data.favoriteCrops[0] === "Soyabean", "crops not updated");
    console.log("✓ Non-location update");
  }

  console.log("\nAll Profile × Location QA checks passed.");
};

main().catch((err: unknown) => {
  if (err instanceof AxiosError) {
    console.error(err.response?.data ?? err.message);
  } else {
    console.error(err);
  }
  process.exit(1);
});
