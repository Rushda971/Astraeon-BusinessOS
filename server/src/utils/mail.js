import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { fileURLToPath } from "node:url";
import { AppError } from "./app-error.js";

dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

const requiredMailSettings = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "MAIL_FROM"];
const missingMailSettings = requiredMailSettings.filter((name) => !process.env[name]?.trim());
const smtpPort = Number(process.env.SMTP_PORT);
const portIsValid = Number.isInteger(smtpPort) && smtpPort > 0 && smtpPort < 65536;
const smtpSecure = process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE.trim().toLowerCase() === "true"
  : smtpPort === 465;

let transporter;
let verification;
if (missingMailSettings.length === 0 && portIsValid) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST.trim(),
    port: smtpPort,
    secure: smtpSecure,
    auth: { user: process.env.SMTP_USER.trim(), pass: process.env.SMTP_PASSWORD },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  console.log("Email transporter initialized", { host: process.env.SMTP_HOST.trim(), port: smtpPort, secure: smtpSecure });
} else {
  const issues = [...missingMailSettings];
  if (!portIsValid && !issues.includes("SMTP_PORT")) issues.push("SMTP_PORT (must be a valid port number)");
  console.warn(`Email delivery is unavailable. Check configuration: ${issues.join(", ")}`);
}

const verifyTransporter = async () => {
  if (!transporter) return false;
  if (!verification) {
    verification = transporter.verify().then(() => {
      console.log("Email transporter verified");
      return true;
    }).catch((error) => {
      console.error("Email transporter verification failed.", {
        code: error.code,
        responseCode: error.responseCode,
        command: error.command,
      });
      // Permit the next mail request to retry after a temporary network or SMTP outage.
      verification = undefined;
      return false;
    });
  }
  return verification;
};

export const sendAuthEmail = async ({ to, subject, text }) => {
  if (!(await verifyTransporter())) {
    throw new AppError("Email delivery is temporarily unavailable. Please try again later.", 503);
  }

  try {
    const result = await transporter.sendMail({ from: process.env.MAIL_FROM, to, subject, text });
    console.log("Authentication email sent.", { messageId: result.messageId });
  } catch (error) {
    console.error("Authentication email send failed.", {
      code: error.code,
      responseCode: error.responseCode,
      command: error.command,
    });
    throw new AppError("Email delivery is temporarily unavailable. Please try again later.", 503);
  }
};
