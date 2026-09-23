import { createCipheriv, pbkdf2Sync, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(root, "app/team-data.json");
const outputPath = resolve(root, "public/team-data.enc.json");
const password = process.env.DASHBOARD_PASSWORD;
const iterations = 600_000;
const aad = "loveyue-lol-team-data-v1";

if (!password || password.length < 16) {
  throw new Error("DASHBOARD_PASSWORD must contain at least 16 characters.");
}

const plaintext = await readFile(sourcePath);
const salt = randomBytes(16);
const iv = randomBytes(12);
const key = pbkdf2Sync(password, salt, iterations, 32, "sha256");
const cipher = createCipheriv("aes-256-gcm", key, iv);
cipher.setAAD(Buffer.from(aad));
const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
const payload = {
  version: 1,
  algorithm: "AES-GCM",
  kdf: "PBKDF2-SHA-256",
  iterations,
  salt: salt.toString("base64"),
  iv: iv.toString("base64"),
  aad,
  ciphertext: encrypted.toString("base64"),
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload)}\n`, { mode: 0o600 });
console.log(`Encrypted ${plaintext.length.toLocaleString()} bytes to ${outputPath}`);
