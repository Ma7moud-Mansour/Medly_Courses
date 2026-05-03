import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "dotenv";
import nodemailer from "nodemailer";

type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let cachedEnvFileValues: Record<string, string> | null = null;
const currentFileDir = path.dirname(fileURLToPath(import.meta.url));

function findNearestEnvFile(startDir: string) {
  let cursor = path.resolve(startDir);

  for (let index = 0; index < 8; index += 1) {
    const candidate = path.join(cursor, ".env");

    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = path.dirname(cursor);

    if (parent === cursor) {
      break;
    }

    cursor = parent;
  }

  return null;
}

function loadEnvFileValues() {
  if (cachedEnvFileValues) {
    return cachedEnvFileValues;
  }

  const candidates = [
    process.cwd(),
    currentFileDir,
    path.join(currentFileDir, ".."),
    path.join(currentFileDir, "..", ".."),
  ];

  for (const baseDir of candidates) {
    const envPath = findNearestEnvFile(baseDir);

    if (!envPath) {
      continue;
    }

    cachedEnvFileValues = parse(readFileSync(envPath, "utf8"));
    return cachedEnvFileValues;
  }

  cachedEnvFileValues = {};
  return cachedEnvFileValues;
}

function getEnvValue(key: string) {
  const runtimeValue = process.env[key]?.trim();

  if (runtimeValue) {
    return runtimeValue;
  }

  return loadEnvFileValues()[key]?.trim();
}

function getMailerConfig() {
  const host = getEnvValue("SMTP_HOST");
  const port = Number(getEnvValue("SMTP_PORT") || "465");
  const secure = (getEnvValue("SMTP_SECURE") || "true").toLowerCase() !== "false";
  const user = getEnvValue("SMTP_USER");
  const pass = getEnvValue("SMTP_PASS");
  const from = getEnvValue("SMTP_FROM") || user;

  return {
    host,
    port,
    secure,
    user,
    pass,
    from,
  };
}

export function assertMailerConfigured() {
  const config = getMailerConfig();

  if (!config.host || !config.user || !config.pass || !config.from) {
    throw new Error(
      "Email delivery is not configured yet. Add Gmail SMTP settings (SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM) to .env.",
    );
  }

  return config;
}

export async function sendMail(payload: MailPayload) {
  const config = assertMailerConfigured();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  await transporter.sendMail({
    from: config.from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
}
