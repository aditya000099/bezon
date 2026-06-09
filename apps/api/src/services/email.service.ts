import FormData from "form-data";
import Mailgun from "mailgun.js";

const mailgun = new Mailgun(FormData);

const mg = mailgun.client({
  username: "api",
  key: process.env.MAIL_GUN_API!,
  url: process.env.MAIL_GUN_BASE_URL,
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  return mg.messages.create(process.env.MAILGUN_DOMAIN!, {
    from: process.env.MAIL_FROM!,
    to,
    subject,
    html,
  });
};
