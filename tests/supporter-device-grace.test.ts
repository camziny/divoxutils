import test from "node:test";
import assert from "node:assert/strict";
import {
  createSupporterDeviceGraceValue,
  SUPPORTER_DEVICE_GRACE_COOKIE_NAME,
  SUPPORTER_DEVICE_GRACE_TTL_MS,
  verifySupporterDeviceGraceValue,
} from "../src/server/supporterDeviceGrace";

test("supporter device grace cookie constants are stable", () => {
  assert.equal(SUPPORTER_DEVICE_GRACE_COOKIE_NAME, "du_supporter_grace_v1");
  assert.equal(SUPPORTER_DEVICE_GRACE_TTL_MS, 14 * 24 * 60 * 60 * 1000);
});

test("verifySupporterDeviceGraceValue accepts valid unexpired values", () => {
  const now = Date.UTC(2026, 3, 29, 12, 0, 0);
  const value = createSupporterDeviceGraceValue({
    expiresAt: now + 1000,
    secret: "test-secret",
  });

  assert.equal(
    verifySupporterDeviceGraceValue({
      value,
      secret: "test-secret",
      now,
    }),
    true
  );
});

test("verifySupporterDeviceGraceValue rejects expired, tampered, and unsigned values", () => {
  const now = Date.UTC(2026, 3, 29, 12, 0, 0);
  const value = createSupporterDeviceGraceValue({
    expiresAt: now + 1000,
    secret: "test-secret",
  });
  const tampered = value.replace("v1.", "v1.9");
  const expired = createSupporterDeviceGraceValue({
    expiresAt: now,
    secret: "test-secret",
  });

  assert.equal(
    verifySupporterDeviceGraceValue({
      value: tampered,
      secret: "test-secret",
      now,
    }),
    false
  );
  assert.equal(
    verifySupporterDeviceGraceValue({
      value: expired,
      secret: "test-secret",
      now,
    }),
    false
  );
  assert.equal(
    verifySupporterDeviceGraceValue({
      value,
      secret: "wrong-secret",
      now,
    }),
    false
  );
  assert.equal(
    verifySupporterDeviceGraceValue({
      value,
      secret: null,
      now,
    }),
    false
  );
});
