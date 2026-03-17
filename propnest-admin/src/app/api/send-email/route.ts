import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

function createTransporter() {
  const password = process.env.GMAIL_APP_PASSWORD;
  if (!password) {
    throw new Error(
      "GMAIL_APP_PASSWORD environment variable is not set. " +
      "Please set it in your .env.local file. " +
      "Generate an App Password at https://myaccount.google.com/apppasswords"
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "softspring777@gmail.com",
      pass: password,
    },
  });
}

async function sendWithRetry(
  transporter: nodemailer.Transporter,
  mailOptions: nodemailer.SendMailOptions,
  retries = 3
): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully on attempt ${attempt}:`, info.messageId);
      return;
    } catch (err) {
      console.error(`Email attempt ${attempt}/${retries} failed:`, err);
      if (attempt === retries) throw err;
      // Exponential backoff: 2s, 4s
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, ownerName, listingTitle, action, listingId } = body;

    console.log("Email request received:", { to, listingTitle, action, listingId });

    if (!to || !listingTitle || !action) {
      console.error("Missing required fields:", { to: !!to, listingTitle: !!listingTitle, action: !!action });
      return NextResponse.json({ error: "Missing required fields: to, listingTitle, and action are required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.error("Invalid email format:", to);
      return NextResponse.json({ error: `Invalid email format: ${to}` }, { status: 400 });
    }

    let transporter: nodemailer.Transporter;
    try {
      transporter = createTransporter();
    } catch (configError) {
      console.error("Email configuration error:", configError);
      return NextResponse.json(
        { error: configError instanceof Error ? configError.message : "Email configuration error" },
        { status: 500 }
      );
    }

    // Verify SMTP connection before sending
    try {
      await transporter.verify();
      console.log("SMTP connection verified successfully");
    } catch (verifyError) {
      console.error("SMTP verification failed:", verifyError);
      return NextResponse.json(
        {
          error: "SMTP connection failed. Please check GMAIL_APP_PASSWORD. " +
            "Make sure 2-Step Verification is enabled and you're using an App Password, not your regular password. " +
            (verifyError instanceof Error ? verifyError.message : "Unknown error"),
        },
        { status: 500 }
      );
    }

    const isApproved = action === "approved";
    const refId = listingId ? `BT-${String(listingId).substring(0, 8).toUpperCase()}` : "";

    const subject = isApproved
      ? `Your listing "${listingTitle}" is now live on BhoomiTayi! ✅`
      : `Update on your listing "${listingTitle}" - BhoomiTayi`;

    const html = isApproved
      ? `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0;">
          <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">BhoomiTayi</h1>
            <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">India's Trusted Online Marketplace</p>
          </div>
          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none;">
            <div style="background: linear-gradient(135deg, #dcfce7, #d1fae5); border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
              <p style="margin: 0; color: #065f46; font-weight: 700; font-size: 18px;">✅ Payment Verified & Listing Approved!</p>
            </div>
            <p style="color: #374151; line-height: 1.8; font-size: 15px;">Dear <strong>${ownerName || "User"}</strong>,</p>
            <p style="color: #374151; line-height: 1.8; font-size: 15px;">
              Great news! Your payment has been successfully verified and your listing
              <strong>"${listingTitle}"</strong> has been approved by our admin team.
            </p>
            ${refId ? `
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Reference ID</td>
                  <td style="padding: 6px 0; color: #111827; font-weight: 600; font-size: 13px; text-align: right;">${refId}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Approved On</td>
                  <td style="padding: 6px 0; color: #111827; font-weight: 600; font-size: 13px; text-align: right;">${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Status</td>
                  <td style="padding: 6px 0; color: #059669; font-weight: 700; font-size: 13px; text-align: right;">✅ APPROVED</td>
                </tr>
              </table>
            </div>
            ` : ""}
            <div style="background: #eff6ff; border-radius: 12px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af; font-weight: 600; font-size: 14px;">🎉 Your listing is now LIVE and visible to all users on BhoomiTayi!</p>
            </div>
            <p style="color: #374151; line-height: 1.8; font-size: 15px;">
              Thank you for choosing BhoomiTayi. We wish you the best with your listing!
            </p>
          </div>
          <div style="background: #f9fafb; padding: 24px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated message from BhoomiTayi. Please do not reply to this email.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0;">
              If you have any questions, contact support@bhoomitayi.com
            </p>
          </div>
        </div>
      `
      : `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0;">
          <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">BhoomiTayi</h1>
            <p style="color: #fecaca; margin: 8px 0 0; font-size: 14px;">India's Trusted Online Marketplace</p>
          </div>
          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #dc2626; margin-top: 0; font-size: 20px;">Listing Update</h2>
            <p style="color: #374151; line-height: 1.8; font-size: 15px;">Dear <strong>${ownerName || "User"}</strong>,</p>
            <p style="color: #374151; line-height: 1.8; font-size: 15px;">
              We regret to inform you that your listing <strong>"${listingTitle}"</strong> has been rejected by our admin team.
            </p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #991b1b; font-weight: 600; font-size: 14px;">Please review and re-submit your listing, or contact our support team if you have any questions.</p>
            </div>
          </div>
          <div style="background: #f9fafb; padding: 24px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated message from BhoomiTayi. Please do not reply to this email.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0;">
              If you have any questions, contact support@bhoomitayi.com
            </p>
          </div>
        </div>
      `;

    const mailOptions = {
      from: '"BhoomiTayi" <softspring777@gmail.com>',
      to,
      subject,
      html,
    };

    await sendWithRetry(transporter, mailOptions, 3);

    console.log(`✅ Email sent successfully to ${to} for action: ${action}`);
    return NextResponse.json({ success: true, message: `Email sent to ${to}` });
  } catch (error) {
    console.error("❌ Email send failed after all retries:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to send email: ${message}` },
      { status: 500 }
    );
  }
}
