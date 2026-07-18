/**
 * Seeds Gram Sahakari onboarding test users and a sample draft application.
 *
 * Usage:
 *   npx ts-node scripts/gram-sahakari.seed.ts
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { AuthUser } from "../src/modules/auth/auth.model";
import { GramSahakariApplication } from "../src/modules/gram-sahakari/gram-sahakari.model";
import { generateApplicationNumber } from "../src/modules/gram-sahakari/service/application-number.service";

dotenv.config();

const SEED_USERS = [
  { mobile: "+919900000001", role: "FARMER" as const, label: "Farmer applicant (draft)" },
  { mobile: "+919900000005", role: "FARMER" as const, label: "Farmer applicant (submitted)" },
  { mobile: "+919900000002", role: "GRAM_SAHAKARI" as const, label: "Gram Sahakari member" },
  { mobile: "+919900000003", role: "TEAM" as const, label: "Team support" },
  { mobile: "+919900000004", role: "ADMIN" as const, label: "Admin" },
];

const run = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/kisan-katta";
  await mongoose.connect(uri);

  // eslint-disable-next-line no-console
  console.log("Connected to MongoDB for Gram Sahakari seed...");

  const createdUsers: Record<string, string> = {};

  for (const seed of SEED_USERS) {
    const user = await AuthUser.findOneAndUpdate(
      { mobile: seed.mobile },
      {
        $set: {
          role: seed.role,
          isVerified: true,
          isProfileCompleted: seed.role === "FARMER",
        },
        $setOnInsert: {
          mobile: seed.mobile,
          lastLoginAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    createdUsers[seed.mobile] = String(user._id);
    // eslint-disable-next-line no-console
    console.log(`Seeded ${seed.label}: ${seed.mobile} (${seed.role})`);
  }

  const farmerId = createdUsers["+919900000001"];
  const submittedFarmerId = createdUsers["+919900000005"];
  const teamId = createdUsers["+919900000003"];
  const gsId = createdUsers["+919900000002"];

  // Idempotent, collision-free: only creates when absent, and draws the
  // applicationNumber from the same atomic counter used in production so
  // seeded numbers never clash with live ones.
  const seedApplication = async (
    label: string,
    data: Record<string, unknown> & { userId: string }
  ): Promise<void> => {
    const exists = await GramSahakariApplication.findOne({ userId: data.userId }).lean();
    if (exists) {
      // eslint-disable-next-line no-console
      console.log(`Application already exists (${label}); skipping.`);
      return;
    }

    const { applicationNumber } = await generateApplicationNumber();
    await GramSahakariApplication.create({ ...data, applicationNumber });
    // eslint-disable-next-line no-console
    console.log(`Seeded application (${label}): ${applicationNumber}`);
  };

  if (farmerId) {
    await seedApplication("FARMER draft", {
      userId: farmerId,
      status: "DRAFT",
      fullName: "Seed Farmer Applicant",
      phone: "9900000001",
      email: "farmer.seed@example.com",
      paymentStatus: "NOT_REQUIRED",
      languages: ["mr", "hi"],
    });
  }

  if (submittedFarmerId && teamId) {
    await seedApplication("SUBMITTED assigned to TEAM", {
      userId: submittedFarmerId,
      status: "SUBMITTED",
      fullName: "Seed Submitted Applicant",
      phone: "9900000005",
      email: "submitted.seed@example.com",
      district: "Pune",
      taluka: "Haveli",
      village: "Seed Village",
      paymentStatus: "PENDING",
      languages: ["mr"],
      assignedTo: teamId,
      submittedAt: new Date(),
    });
  }

  if (gsId) {
    await seedApplication("ACTIVE GRAM_SAHAKARI", {
      userId: gsId,
      status: "ACTIVE",
      fullName: "Seed Gram Sahakari Member",
      phone: "9900000002",
      email: "gs.seed@example.com",
      district: "Pune",
      taluka: "Haveli",
      village: "Seed Village",
      paymentStatus: "PAID",
      languages: ["mr", "en"],
      approvedAt: new Date(),
      submittedAt: new Date(),
    });
  }

  await mongoose.disconnect();
  // eslint-disable-next-line no-console
  console.log("Gram Sahakari seed completed.");
};

run().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error("Gram Sahakari seed failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
