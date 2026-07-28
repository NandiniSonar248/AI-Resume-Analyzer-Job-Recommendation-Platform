import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function testEmail() {
  console.log("\n" + "=".repeat(60));
  console.log("📧 TESTING EMAIL CONFIGURATION");
  console.log("=".repeat(60));
  
  console.log("\nEmail User:", process.env.EMAIL_USER);
  console.log("Email Pass:", process.env.EMAIL_PASS ? "****" + process.env.EMAIL_PASS.slice(-4) : "NOT SET");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log("\n🔄 Connecting to Gmail SMTP...");
    await transporter.verify();
    console.log("✅ SMTP Connection Successful!\n");

    console.log("📤 Sending test email...");
    
    const info = await transporter.sendMail({
      from: `"JobMatch Pro" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "🎯 Test Email from JobMatch Pro",
      html: "<h1 style='color: green;'>✅ Email is Working!</h1><p>Your email configuration is correct.</p>",
    });

    console.log("\n✅ TEST EMAIL SENT SUCCESSFULLY!");
    console.log("   Message ID:", info.messageId);
    console.log("\n📬 Check your inbox at:", process.env.EMAIL_USER);
    
  } catch (error) {
    console.log("\n❌ EMAIL TEST FAILED!");
    console.log("Error:", error.message);
  }
}

testEmail();