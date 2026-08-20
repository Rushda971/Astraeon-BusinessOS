export const buildOtpEmail = (otp, purpose) => ({
  subject: purpose === "verification" ? "Verify your Astraeon account" : "Reset your Astraeon password",
  text: purpose === "verification"
    ? `Your Astraeon verification code is ${otp}. It expires in 10 minutes.`
    : `Your Astraeon password reset code is ${otp}. It expires in 10 minutes.`,
});
