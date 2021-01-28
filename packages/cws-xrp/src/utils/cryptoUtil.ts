import crypto from "crypto";

export function sha256(data: Buffer): Buffer {
  return crypto.createHash("sha256").update(data).digest();
}

export function ripemd160(data: Buffer): Buffer {
  return crypto.createHash("rmd160").update(data).digest();
}
