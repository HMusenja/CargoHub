import nodemailer from "nodemailer";

export default async function sendEmail({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"CargoHub Support" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
