import { hash, verify } from "@node-rs/argon2";

const PASSWORD_HASH_OPTIONS = {
  algorithm: 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const;

export async function hashPassword(password: string) {
  return hash(password, PASSWORD_HASH_OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string) {
  return verify(passwordHash, password, PASSWORD_HASH_OPTIONS);
}
