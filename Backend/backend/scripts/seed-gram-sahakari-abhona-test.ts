/**
 * One-off dev seed: paid Gram Sahakari representative at Abhona / Kalwan / Nashik
 * for mobile discovery API testing.
 *
 * Usage:
 *   npx ts-node scripts/seed-gram-sahakari-abhona-test.ts
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { AuthUser } from "../src/modules/auth/auth.model";
import { FarmerProfile } from "../src/modules/profile/profile.model";
import { GramSahakariApplication } from "../src/modules/gram-sahakari/gram-sahakari.model";
import { generateApplicationNumber } from "../src/modules/gram-sahakari/service/application-number.service";
import { discoverRepresentativesForFarmer } from "../src/modules/gram-sahakari/service/representative.service";
import {
  PAYMENT_CURRENCY,
  REGISTRATION_FEE_PAISE,
} from "../src/modules/payment/payment.constants";

dotenv.config();

const TEST_TAG = "gram-sahakari-discovery-abhona-v1";

const LOCATION = {
  district: "Nashik",
  taluka: "Kalwan",
  village: "Abhona",
  districtCode: 487,
  talukaCode: 4143,
  villageCode: 549878,
  villageNameMr: "अभोणा",
} as const;

const GS_USER_MOBILE = "+919000012345";
const FARMER_USER_MOBILE = "+91900009999";

const DUMMY_DOC = {
  url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
  publicId: "test/gram-sahakari-abhona-dummy",
};

const paidAt = new Date("2026-08-20T10:30:00.000Z");
const submittedAt = new Date("2026-08-20T10:35:00.000Z");
const dob = new Date("1995-08-15T00:00:00.000Z");

const run = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/kisan-katta";
  await mongoose.connect(uri);
  // eslint-disable-next-line no-console
  console.log("Connected to MongoDB for Abhona Gram Sahakari test seed...\n");

  const mahesh = await AuthUser.findOne({ mobile: "+917741075483" }).lean();
  if (mahesh) {
    // eslint-disable-next-line no-console
    console.log(`Mahesh account present (untouched): ${mahesh._id}`);
  }

  const gsUser = await AuthUser.findOneAndUpdate(
    { mobile: GS_USER_MOBILE },
    {
      $set: {
        role: "GRAM_SAHAKARI",
        isVerified: true,
        isProfileCompleted: true,
        lastLoginAt: new Date(),
      },
      $setOnInsert: { mobile: GS_USER_MOBILE },
    },
    { upsert: true, new: true }
  );

  const farmerUser = await AuthUser.findOneAndUpdate(
    { mobile: FARMER_USER_MOBILE },
    {
      $set: {
        role: "FARMER",
        isVerified: true,
        isProfileCompleted: true,
        lastLoginAt: new Date(),
      },
      $setOnInsert: { mobile: FARMER_USER_MOBILE },
    },
    { upsert: true, new: true }
  );

  await FarmerProfile.findOneAndUpdate(
    { userId: farmerUser._id },
    {
      $set: {
        name: "Test Farmer Abhona",
        district: LOCATION.district,
        taluka: LOCATION.taluka,
        village: LOCATION.village,
        districtCode: LOCATION.districtCode,
        talukaCode: LOCATION.talukaCode,
        villageCode: LOCATION.villageCode,
        villageNameMr: LOCATION.villageNameMr,
        favoriteCrops: ["onion"],
        language: "mr",
      },
      $setOnInsert: { userId: farmerUser._id },
    },
    { upsert: true, new: true }
  );

  const existingGsApp = await GramSahakariApplication.findOne({
    userId: gsUser._id,
  }).lean();

  let applicationNumber: string;

  if (existingGsApp) {
    applicationNumber = existingGsApp.applicationNumber;
    // eslint-disable-next-line no-console
    console.log(`Updating existing GS application: ${applicationNumber}`);
    await GramSahakariApplication.updateOne(
      { _id: existingGsApp._id },
      {
        $set: {
          status: "SUBMITTED",
          fullName: "Rohit Dattatray Patil",
          phone: "9000012345",
          email: "rohit.patil.test@example.com",
          gender: "MALE",
          dob,
          district: LOCATION.district,
          taluka: LOCATION.taluka,
          village: LOCATION.village,
          address: "Abhona, Kalwan, Nashik, Maharashtra",
          pincode: "423502",
          aadhaarNumber: "999988887777",
          aadhaarFront: DUMMY_DOC,
          aadhaarBack: DUMMY_DOC,
          cancelledChequeImage: DUMMY_DOC,
          photo: DUMMY_DOC,
          bankAccountHolder: "Rohit Dattatray Patil",
          bankAccountNumber: "123456789012",
          bankIFSC: "SBIN0001234",
          bankName: "State Bank of India (TEST)",
          paymentStatus: "PAID",
          paymentAmount: REGISTRATION_FEE_PAISE,
          paymentCurrency: PAYMENT_CURRENCY,
          paymentVerified: true,
          paymentAttemptCount: 1,
          paidAt,
          submittedAt,
          paymentMethod: "TEST_SEED",
          razorpayOrderId: "test_order_gs_abhona_seed_001",
          razorpayPaymentId: "test_pay_gs_abhona_seed_001",
          metadata: { testData: true, purpose: TEST_TAG },
        },
      }
    );
  } else {
    const generated = await generateApplicationNumber(submittedAt);
    applicationNumber = generated.applicationNumber;
    await GramSahakariApplication.create({
      applicationNumber,
      userId: gsUser._id,
      status: "SUBMITTED",
      fullName: "Rohit Dattatray Patil",
      phone: "9000012345",
      email: "rohit.patil.test@example.com",
      gender: "MALE",
      dob,
      district: LOCATION.district,
      taluka: LOCATION.taluka,
      village: LOCATION.village,
      address: "Abhona, Kalwan, Nashik, Maharashtra",
      pincode: "423502",
      aadhaarNumber: "999988887777",
      aadhaarFront: DUMMY_DOC,
      aadhaarBack: DUMMY_DOC,
      cancelledChequeImage: DUMMY_DOC,
      photo: DUMMY_DOC,
      bankAccountHolder: "Rohit Dattatray Patil",
      bankAccountNumber: "123456789012",
      bankIFSC: "SBIN0001234",
      bankName: "State Bank of India (TEST)",
      paymentStatus: "PAID",
      paymentAmount: REGISTRATION_FEE_PAISE,
      paymentCurrency: PAYMENT_CURRENCY,
      paymentVerified: true,
      paymentAttemptCount: 1,
      paidAt,
      submittedAt,
      paymentMethod: "TEST_SEED",
      razorpayOrderId: "test_order_gs_abhona_seed_001",
      razorpayPaymentId: "test_pay_gs_abhona_seed_001",
      metadata: { testData: true, purpose: TEST_TAG },
    });
    // eslint-disable-next-line no-console
    console.log(`Created GS application: ${applicationNumber}`);
  }

  const saved = await GramSahakariApplication.findOne({ userId: gsUser._id }).lean();
  // eslint-disable-next-line no-console
  console.log("\n--- Saved GS record ---");
  // eslint-disable-next-line no-console
  console.log({
    applicationNumber: saved?.applicationNumber,
    userId: String(saved?.userId),
    fullName: saved?.fullName,
    village: saved?.village,
    taluka: saved?.taluka,
    district: saved?.district,
    paymentStatus: saved?.paymentStatus,
    status: saved?.status,
    paidAt: saved?.paidAt,
  });

  const discovery = await discoverRepresentativesForFarmer(String(farmerUser._id));
  // eslint-disable-next-line no-console
  console.log("\n--- Representative API (service) result ---");
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(discovery, null, 2));

  await mongoose.disconnect();
  // eslint-disable-next-line no-console
  console.log("\nAbhona Gram Sahakari test seed completed.");
};

run().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error("Seed failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
