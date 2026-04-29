import crypto from "crypto";

export const SUPPORTER_DEVICE_GRACE_COOKIE_NAME = "du_supporter_grace_v1";
export const SUPPORTER_DEVICE_GRACE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
export const SUPPORTER_DEVICE_GRACE_MAX_AGE_SECONDS = SUPPORTER_DEVICE_GRACE_TTL_MS / 1000;

type CreateSupporterDeviceGraceValueInput = {
  expiresAt: number;
  secret: string;
};

type VerifySupporterDeviceGraceValueInput = {
  value: string | null | undefined;
  secret: string | null | undefined;
  now?: number;
};

function signPayload(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function getSupporterDeviceGraceSecret() {
  return (
    process.env.SUPPORTER_DEVICE_COOKIE_SECRET ??
    process.env.CLERK_SECRET_KEY ??
    process.env.JWT_SECRET ??
    null
  );
}

export function createSupporterDeviceGraceValue({
  expiresAt,
  secret,
}: CreateSupporterDeviceGraceValueInput) {
  const payload = `v1.${expiresAt}`;
  return `${payload}.${signPayload(payload, secret)}`;
}

export function createSupporterDeviceGraceCookieValue(now = Date.now()) {
  const secret = getSupporterDeviceGraceSecret();
  if (!secret) return null;
  return createSupporterDeviceGraceValue({
    expiresAt: now + SUPPORTER_DEVICE_GRACE_TTL_MS,
    secret,
  });
}

export function verifySupporterDeviceGraceValue({
  value,
  secret,
  now = Date.now(),
}: VerifySupporterDeviceGraceValueInput) {
  if (!value || !secret) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [version, expiresAtRaw, signature] = parts;
  if (version !== "v1") return false;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return false;
  const payload = `${version}.${expiresAtRaw}`;
  const expectedSignature = signPayload(payload, secret);
  return safeEqual(signature, expectedSignature);
}
