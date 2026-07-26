import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "pocketmoneyhelp129@gmail.com",
    pass: "lgikcpkichikrelg" // Gmail App password
  }
});

const defaultHtmlTemplate = (title: string, bodyContent: string) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pocket Money</title>
</head>
<body bgcolor="#000000" style="margin: 0; padding: 0; background-color: #000000; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#000000" style="background-color: #000000; width: 100%; margin: 0; padding: 25px 10px;">
    <tr>
      <td align="center" bgcolor="#000000" style="background-color: #000000;">
        
        <!-- Main Dark Red Noir Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#0d0d10" style="max-width: 560px; width: 100%; background-color: #0d0d10; border: 1px solid #ef233c; border-radius: 16px; overflow: hidden; color: #ffffff;">
          
          <!-- Header Bar -->
          <tr>
            <td align="center" bgcolor="#150507" style="background-color: #150507; padding: 24px 20px; border-bottom: 1px solid #ef233c;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; width: 38px; height: 38px; line-height: 38px; background-color: #ef233c; color: #ffffff; font-weight: 900; font-size: 20px; border-radius: 10px; text-align: center; margin-bottom: 6px;">P</div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <div style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Pocket<span style="color: #ef233c;">Money</span></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body Content -->
          <tr>
            <td bgcolor="#0d0d10" style="background-color: #0d0d10; padding: 30px 24px; color: #e4e4e7; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              <h2 style="font-size: 18px; font-weight: 800; margin-top: 0; margin-bottom: 16px; color: #ffffff;">${title}</h2>
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" bgcolor="#050505" style="background-color: #050505; padding: 20px; color: #71717a; font-size: 11px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; border-top: 1px solid #1c1c21;">
              <p style="margin: 0 0 4px 0; color: #71717a;">© ${new Date().getFullYear()} Pocket Money Financial Platform. All rights reserved.</p>
              <p style="margin: 0; color: #52525b;">Automated operational notification. Please do not reply directly to this email.</p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`;

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: '"Pocket Money" <pocketmoneyhelp129@gmail.com>',
      to,
      subject,
      html
    });
    console.log("Email sent successfully to", to, info.messageId);
    return true;
  } catch (error) {
    console.error("Nodemailer transmission error:", error);
    return false;
  }
};

export const sendOtpEmail = async (email: string, otp: string) => {
  const title = "Verify Your Email Address";
  const body = `
    <p style="color: #d4d4d8;">Thank you for initiating your registration on Pocket Money. Enter the 6-digit One-Time Password (OTP) below to complete your account verification:</p>
    <div style="background-color: #18181b; border: 2px dashed #ef233c; padding: 18px; font-size: 32px; font-weight: 900; text-align: center; letter-spacing: 8px; color: #ef233c; border-radius: 14px; margin: 20px auto; max-width: 250px;">${otp}</div>
    <p style="color: #a1a1aa; font-size: 12px; font-style: italic;">Valid for 10 minutes. If you did not request this, please ignore this email.</p>
  `;
  return sendEmail(email, "Pocket Money - Email Verification Code", defaultHtmlTemplate(title, body));
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  const title = `Welcome to Pocket Money, ${name}! 🎉`;
  const body = `
    <p style="color: #d4d4d8;">Your email verification is successful and your account registration is complete!</p>
    <p style="color: #d4d4d8;">You can now choose a passive income plan starting from ₹499 to start earning daily ROI and up to Level 6 downline referral commissions.</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="http://localhost:3000/login" style="display: inline-block; padding: 14px 28px; background-color: #ef233c; color: #ffffff !important; text-decoration: none; font-weight: 800; border-radius: 12px; font-size: 13px; letter-spacing: 0.5px;">Log In to Dashboard</a>
    </div>
  `;
  return sendEmail(email, "Pocket Money - Welcome to Platform!", defaultHtmlTemplate(title, body));
};

export const sendPlanPurchaseEmail = async (email: string, name: string, packageName: string, price: number) => {
  const title = "Plan Activated Successfully! 🚀";
  const body = `
    <p style="color: #d4d4d8;">Hello ${name},</p>
    <p style="color: #d4d4d8;">Your package subscription has been activated by the system administrator.</p>
    <div style="background-color: #18181b; border: 1px solid #27272a; padding: 18px 20px; border-radius: 14px; margin: 20px 0; color: #ffffff;">
      <p style="margin: 0 0 8px 0;"><strong>Activated Plan:</strong> <span style="color: #ef233c; font-weight: bold;">${packageName}</span></p>
      <p style="margin: 0 0 8px 0;"><strong>Purchase Price:</strong> ₹${price.toLocaleString()}</p>
      <p style="margin: 0 0 8px 0;"><strong>Status:</strong> <span style="display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; background-color: #064e3b; color: #34d399; border: 1px solid #059669; text-transform: uppercase;">ACTIVE</span></p>
      <p style="margin: 0;"><strong>Date Activated:</strong> ${new Date().toLocaleDateString("en-IN")}</p>
    </div>
    <p style="color: #d4d4d8;">Daily returns will now be credited directly to your account. Copy your unique referral code from your dashboard to start building your downline network!</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="http://localhost:3000/dashboard" style="display: inline-block; padding: 14px 28px; background-color: #ef233c; color: #ffffff !important; text-decoration: none; font-weight: 800; border-radius: 12px; font-size: 13px; letter-spacing: 0.5px;">Go to Dashboard</a>
    </div>
  `;
  return sendEmail(email, `Pocket Money - ${packageName} Plan Activated`, defaultHtmlTemplate(title, body));
};

export const sendDailyRoiEmail = async (
  email: string,
  name: string,
  packageName: string,
  dailyRoi: number,
  totalIncome: number,
  walletBalance: number
) => {
  const title = `Today's Income Credited: ₹${dailyRoi.toLocaleString()} 💰`;
  const body = `
    <p style="color: #d4d4d8;">Hello ${name},</p>
    <p style="color: #d4d4d8;">Great news! Today's daily return for your <strong>${packageName}</strong> plan has been credited to your Pocket Money wallet.</p>
    <div style="background-color: #18181b; border: 1px solid #27272a; padding: 18px 20px; border-radius: 14px; margin: 20px 0; color: #ffffff;">
      <p style="margin: 0 0 8px 0;"><strong>Today's ROI Income:</strong> <span style="color: #34d399; font-weight: 900; font-size: 16px;">+₹${dailyRoi.toLocaleString()}</span></p>
      <p style="margin: 0 0 8px 0;"><strong>Plan Tier:</strong> ${packageName}</p>
      <p style="margin: 0 0 8px 0;"><strong>Current Wallet Balance:</strong> ₹${walletBalance.toLocaleString()}</p>
      <p style="margin: 0 0 8px 0;"><strong>Lifetime Total Income:</strong> ₹${totalIncome.toLocaleString()}</p>
      <p style="margin: 0;"><strong>Date Credited:</strong> ${new Date().toLocaleDateString("en-IN")}</p>
    </div>
    <p style="color: #d4d4d8;">Share your referral link with friends to earn direct sponsor bonuses and multi-level team commissions every day!</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="http://localhost:3000/dashboard" style="display: inline-block; padding: 14px 28px; background-color: #ef233c; color: #ffffff !important; text-decoration: none; font-weight: 800; border-radius: 12px; font-size: 13px; letter-spacing: 0.5px;">View Account Dashboard</a>
    </div>
  `;
  return sendEmail(email, `Pocket Money - Today's Income Added (+₹${dailyRoi})`, defaultHtmlTemplate(title, body));
};

export const sendInactiveUserReminderEmail = async (email: string, name: string, referralCode?: string) => {
  const title = `Start Earning Passive Income Today! ⚡`;
  const body = `
    <p style="color: #d4d4d8;">Hello ${name},</p>
    <p style="color: #d4d4d8;">You registered on Pocket Money, but you haven't activated an earning plan yet!</p>
    <p style="color: #d4d4d8;">Our platform offers guaranteed daily returns + high level downline referral commissions:</p>
    <div style="background-color: #18181b; border: 1px solid #27272a; padding: 18px 20px; border-radius: 14px; margin: 20px 0; color: #ffffff;">
      <p style="margin: 0 0 8px 0;">🔥 <strong>Plans Start At:</strong> Just ₹499 (Starter Plan)</p>
      <p style="margin: 0 0 8px 0;">📈 <strong>Daily Returns:</strong> Credited automatically every day</p>
      <p style="margin: 0 0 8px 0;">👥 <strong>Direct Sponsor Commission:</strong> High commission on direct referrals</p>
      <p style="margin: 0 0 8px 0;">🌐 <strong>Level Downline Income:</strong> Rewards up to Level 6</p>
      ${referralCode ? `<p style="margin: 0;">🔑 <strong>Your Referral Code:</strong> <span style="color: #ef233c; font-weight: bold;">${referralCode}</span></p>` : ""}
    </div>
    <p style="color: #d4d4d8;">Don't leave your earnings behind. Select a plan today and activate your account!</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="http://localhost:3000/dashboard/deposit" style="display: inline-block; padding: 14px 28px; background-color: #ef233c; color: #ffffff !important; text-decoration: none; font-weight: 800; border-radius: 12px; font-size: 13px; letter-spacing: 0.5px;">Choose a Package & Start</a>
    </div>
  `;
  return sendEmail(email, "Pocket Money - Activate Your Account & Start Earning Daily!", defaultHtmlTemplate(title, body));
};

export const sendWithdrawEmail = async (email: string, name: string, amount: number, status: string, remarks?: string) => {
  const title = `Withdrawal Request ${status.toUpperCase()}`;
  const isApproved = status === "approved";
  const body = `
    <p style="color: #d4d4d8;">Hello ${name},</p>
    <p style="color: #d4d4d8;">Your withdrawal payout request of <strong>₹${amount.toLocaleString()}</strong> has been processed by the administrator.</p>
    <div style="background-color: #18181b; border: 1px solid #27272a; padding: 18px 20px; border-radius: 14px; margin: 20px 0; color: #ffffff;">
      <p style="margin: 0 0 8px 0;"><strong>Requested Amount:</strong> ₹${amount.toLocaleString()}</p>
      <p style="margin: 0 0 8px 0;"><strong>Status:</strong> <span style="display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; background-color: ${isApproved ? "#064e3b" : "#450a0a"}; color: ${isApproved ? "#34d399" : "#fca5a5"}; border: 1px solid ${isApproved ? "#059669" : "#dc2626"}; text-transform: uppercase;">${status}</span></p>
      <p style="margin: 0 0 8px 0;"><strong>Date Processed:</strong> ${new Date().toLocaleDateString("en-IN")}</p>
      ${remarks ? `<p style="margin: 0;"><strong>Admin Remarks:</strong> ${remarks}</p>` : ""}
    </div>
    ${
      isApproved 
        ? "<p style='color: #d4d4d8;'>The net amount has been successfully sent to your registered bank account / UPI ID. Please check your bank statement.</p>" 
        : "<p style='color: #d4d4d8;'>The withdrawal request was rejected. The amount has been safely refunded back to your wallet balance.</p>"
    }
  `;
  return sendEmail(email, `Pocket Money - Withdrawal Payout ${status.toUpperCase()}`, defaultHtmlTemplate(title, body));
};

export const sendDepositEmail = async (email: string, name: string, amount: number, status: string, remarks?: string) => {
  const title = `Deposit Request ${status.toUpperCase()}`;
  const isApproved = status === "approved";
  const body = `
    <p style="color: #d4d4d8;">Hello ${name},</p>
    <p style="color: #d4d4d8;">Your deposit request of <strong>₹${amount.toLocaleString()}</strong> has been reviewed by the administrator.</p>
    <div style="background-color: #18181b; border: 1px solid #27272a; padding: 18px 20px; border-radius: 14px; margin: 20px 0; color: #ffffff;">
      <p style="margin: 0 0 8px 0;"><strong>Amount:</strong> ₹${amount.toLocaleString()}</p>
      <p style="margin: 0 0 8px 0;"><strong>Status:</strong> <span style="display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; background-color: ${isApproved ? "#064e3b" : "#450a0a"}; color: ${isApproved ? "#34d399" : "#fca5a5"}; border: 1px solid ${isApproved ? "#059669" : "#dc2626"}; text-transform: uppercase;">${status}</span></p>
      <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString("en-IN")}</p>
      ${remarks ? `<p style="margin: 0;"><strong>Admin Remarks:</strong> ${remarks}</p>` : ""}
    </div>
    ${
      isApproved 
        ? "<p style='color: #d4d4d8;'>Your payment receipt is approved and your plan / wallet balance has been activated!</p>" 
        : "<p style='color: #d4d4d8;'>The deposit request was rejected. If you uploaded an incorrect UTR or screenshot, please submit a new request.</p>"
    }
  `;
  return sendEmail(email, `Pocket Money - Payment Verification ${status.toUpperCase()}`, defaultHtmlTemplate(title, body));
};

export const sendForgetPasswordEmail = async (email: string, code: string) => {
  const title = "Password Recovery Code";
  const body = `
    <p style="color: #d4d4d8;">Enter the 6-digit verification code below to reset your password:</p>
    <div style="background-color: #18181b; border: 2px dashed #ef233c; padding: 18px; font-size: 32px; font-weight: 900; text-align: center; letter-spacing: 8px; color: #ef233c; border-radius: 14px; margin: 20px auto; max-width: 250px;">${code}</div>
    <p style="color: #a1a1aa; font-size: 12px; font-style: italic;">Valid for 15 minutes. If you did not request a password reset, please ignore this message.</p>
  `;
  return sendEmail(email, "Pocket Money - Password Reset Code", defaultHtmlTemplate(title, body));
};

export const sendSupportReplyEmail = async (email: string, name: string, subject: string) => {
  const title = "Support Ticket Update";
  const body = `
    <p style="color: #d4d4d8;">Hello ${name},</p>
    <p style="color: #d4d4d8;">An administrator has replied to your support ticket: <strong>"${subject}"</strong>.</p>
    <p style="color: #d4d4d8;">Log in to your account and open the Support Center to view the reply.</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="http://localhost:3000/dashboard/support" style="display: inline-block; padding: 14px 28px; background-color: #ef233c; color: #ffffff !important; text-decoration: none; font-weight: 800; border-radius: 12px; font-size: 13px; letter-spacing: 0.5px;">View Response</a>
    </div>
  `;
  return sendEmail(email, "Pocket Money - New Support Reply", defaultHtmlTemplate(title, body));
};

export const sendContactEmail = async (contactData: { name: string; email: string; subject: string; message: string }) => {
  const title = "New Contact Form Submission";
  const body = `
    <p style="color: #d4d4d8;">A new query has been submitted from the landing page contact form:</p>
    <div style="background-color: #18181b; border: 1px solid #27272a; padding: 18px 20px; border-radius: 14px; margin: 20px 0; color: #ffffff;">
      <p style="margin: 0 0 8px 0;"><strong>Sender Name:</strong> ${contactData.name}</p>
      <p style="margin: 0 0 8px 0;"><strong>Sender Email:</strong> ${contactData.email}</p>
      <p style="margin: 0 0 8px 0;"><strong>Subject:</strong> ${contactData.subject}</p>
      <p style="margin: 0 0 8px 0;"><strong>Message:</strong> ${contactData.message}</p>
      <p style="margin: 0;"><strong>Date:</strong> ${new Date().toLocaleString("en-IN")}</p>
    </div>
  `;
  return sendEmail("pocketmoneyhelp129@gmail.com", `Pocket Money Query - ${contactData.subject}`, defaultHtmlTemplate(title, body));
};

export const sendAdminNewUserAlert = async (
  userEmail: string,
  userName: string,
  username: string,
  phone: string
) => {
  const adminEmail = "pocketmoneyhelp129@gmail.com";
  const body = `
    <p style="margin: 0 0 16px 0; color: #a1a1aa;">A new user has just registered on the Pocket Money platform:</p>
    
    <table width="100%" border="0" cellspacing="0" cellpadding="10" bgcolor="#15151b" style="background-color: #15151b; border-radius: 12px; margin-bottom: 20px; border: 1px solid #27272a; color: #ffffff;">
      <tr>
        <td style="color: #a1a1aa; font-weight: bold; font-size: 13px;">Full Name:</td>
        <td style="color: #ffffff; font-weight: 800; text-align: right;">${userName}</td>
      </tr>
      <tr>
        <td style="color: #a1a1aa; font-weight: bold; font-size: 13px;">Username:</td>
        <td style="color: #ef233c; font-weight: 800; font-family: monospace; text-align: right;">@${username}</td>
      </tr>
      <tr>
        <td style="color: #a1a1aa; font-weight: bold; font-size: 13px;">Email:</td>
        <td style="color: #ffffff; font-weight: 800; text-align: right;">${userEmail}</td>
      </tr>
      <tr>
        <td style="color: #a1a1aa; font-weight: bold; font-size: 13px;">Phone:</td>
        <td style="color: #ffffff; font-weight: 800; text-align: right;">${phone || "N/A"}</td>
      </tr>
    </table>
    
    <p style="margin: 0; color: #71717a; font-size: 12px;">You can view and manage user status from the Admin Panel Users Directory.</p>
  `;

  return sendEmail(adminEmail, `🚨 [Admin Alert] New User Registered: ${userName} (@${username})`, defaultHtmlTemplate("New User Registration Alert", body));
};

export const sendAdminSupportTicketAlert = async (
  userEmail: string,
  userName: string,
  ticketSubject: string,
  ticketMessage: string
) => {
  const adminEmail = "pocketmoneyhelp129@gmail.com";
  const body = `
    <p style="margin: 0 0 16px 0; color: #a1a1aa;">A new support help ticket has been submitted by a user:</p>
    
    <table width="100%" border="0" cellspacing="0" cellpadding="10" bgcolor="#15151b" style="background-color: #15151b; border-radius: 12px; margin-bottom: 20px; border: 1px solid #27272a; color: #ffffff;">
      <tr>
        <td style="color: #a1a1aa; font-weight: bold; font-size: 13px;">User:</td>
        <td style="color: #ffffff; font-weight: 800; text-align: right;">${userName} (${userEmail})</td>
      </tr>
      <tr>
        <td style="color: #a1a1aa; font-weight: bold; font-size: 13px;">Subject:</td>
        <td style="color: #ef233c; font-weight: 800; text-align: right;">${ticketSubject}</td>
      </tr>
    </table>

    <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 10px; padding: 16px; margin-bottom: 20px; color: #e4e4e7;">
      <span style="font-size: 11px; font-weight: 800; color: #ef233c; text-transform: uppercase; display: block; margin-bottom: 8px;">Message Content:</span>
      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #ffffff;">${ticketMessage}</p>
    </div>
    
    <p style="margin: 0; color: #71717a; font-size: 12px;">Reply to this ticket directly from the Admin Panel Support Desk.</p>
  `;

  return sendEmail(adminEmail, `📩 [Support Alert] New Help Ticket: ${ticketSubject} (from ${userName})`, defaultHtmlTemplate("New Support Ticket Received", body));
};

