import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PASSWORD_HASH_OPTIONS = {
  algorithm: 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const;

const FORBIDDEN_DEMO_VALUES = new Set([
  "admin@medly.com",
  "support@medly.com",
  "salma@student.medly.app",
  "Admin@123456",
  "Support@123456",
  "Student@123456",
]);

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for the production seed.`);
  }

  if (FORBIDDEN_DEMO_VALUES.has(value)) {
    throw new Error(`${name} is still using a demo/default value. Replace it before running production seed.`);
  }

  return value;
}

function getOptionalEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    return undefined;
  }

  if (FORBIDDEN_DEMO_VALUES.has(value)) {
    throw new Error(`${name} is still using a demo/default value. Replace it before running production seed.`);
  }

  return value;
}

async function buildPasswordHash(password: string) {
  return hash(password, PASSWORD_HASH_OPTIONS);
}

async function main() {
  const adminEmail = getRequiredEnv("SEED_ADMIN_EMAIL");
  const adminPassword = getRequiredEnv("SEED_ADMIN_PASSWORD");
  const supportEmail = getOptionalEnv("SEED_SUPPORT_EMAIL");
  const supportPassword = getOptionalEnv("SEED_SUPPORT_PASSWORD");

  const adminPasswordHash = await buildPasswordHash(adminPassword);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Production Admin",
      role: "admin",
      status: "active",
      passwordHash: adminPasswordHash,
      emailVerified: true,
      lastLoginAt: new Date(),
    },
    create: {
      name: "Production Admin",
      email: adminEmail,
      role: "admin",
      status: "active",
      passwordHash: adminPasswordHash,
      emailVerified: true,
      lastLoginAt: new Date(),
    },
  });

  if (supportEmail && supportPassword) {
    const supportPasswordHash = await buildPasswordHash(supportPassword);

    await prisma.user.upsert({
      where: { email: supportEmail },
      update: {
        name: "Production Support",
        role: "support",
        status: "active",
        passwordHash: supportPasswordHash,
        emailVerified: true,
        lastLoginAt: new Date(),
      },
      create: {
        name: "Production Support",
        email: supportEmail,
        role: "support",
        status: "active",
        passwordHash: supportPasswordHash,
        emailVerified: true,
        lastLoginAt: new Date(),
      },
    });
  }

  console.log(`Production seed completed. Admin account: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
