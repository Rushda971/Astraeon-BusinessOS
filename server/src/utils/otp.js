import crypto from "node:crypto";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_COOLDOWN_MS = 60 * 1000;

export const generateOtp = () => crypto.randomInt(100000, 1000000).toString();
export const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");
export const otpMatches = (otp, hash) => hash
  ? crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(hashOtp(otp), "hex"))
  : false;
