import { Router } from "express";
import { sendEmail } from "../../services/email.service.js";

const router = Router();
router.post("/test-email", async (req, res) => {
  await sendEmail(
    "charanraju925@gmail.com",
    "Mailgun Test",
    "<h1>Hello from Bezon</h1>",
  );

  res.json({ success: true });
});

export default router;
