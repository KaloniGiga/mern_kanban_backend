import nodemailer from "nodemailer";
// create a transporter

interface mailOptionsType {
  from?: string;
  to?: string;
  subject?: string;
  html?: string;
}

export const SendEmail = async (mailOptions: mailOptionsType) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  await transporter.sendMail(mailOptions).catch((err) => console.log(err));
};
