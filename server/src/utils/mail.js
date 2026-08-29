import nodemailer from "nodemailer";
import { AppError } from "./app-error.js";

const requiredMailSettings = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "MAIL_FROM"];
const missingMailSettings = requiredMailSettings.filter((name) => !process.env[name]);

let transporter;
let mailAvailable = false;
if (missingMailSettings.length === 0) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  console.log("Email transporter initialized");
  try {
    await transporter.verify();
    mailAvailable = true;
    console.log("Email transporter verified");
  } catch (error) {
    console.error("Email transporter verification failed.", {
      code: error.code,
      responseCode: error.responseCode,
      command: error.command,
    });
    console.error("Email delivery is unavailable until the SMTP configuration is corrected.");
  }
} else {
  console.warn(`Email delivery is unavailable. Missing configuration: ${missingMailSettings.join(", ")}`);
}

export const sendAuthEmail = async ({ to, subject, text }) => {
  if (!transporter || !mailAvailable) {
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
