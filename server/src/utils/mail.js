import nodemailer from "nodemailer";

const requiredMailSettings = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "MAIL_FROM"];
const missingMailSettings = requiredMailSettings.filter((name) => !process.env[name]);

let transporter;
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
    console.log("Email transporter verified");
  } catch (error) {
    console.error(`Email transporter verification failed: ${error.message}`);
  }
} else if (process.env.NODE_ENV !== "production") {
  console.warn(`Email configuration incomplete. Missing: ${missingMailSettings.join(", ")}`);
}

export const sendAuthEmail = async ({ to, subject, text }) => {
  if (!transporter) {
    throw new Error("Email service is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and MAIL_FROM.");
  }

  console.log(`Email send attempted for ${to}`);
  try {
    const result = await transporter.sendMail({ from: process.env.MAIL_FROM, to, subject, text });
    console.log(`Email send successful for ${to}: ${result.messageId}`);
  } catch (error) {
    console.error(`Email send failed for ${to}: ${error.message}`);
    throw error;
  }
};
