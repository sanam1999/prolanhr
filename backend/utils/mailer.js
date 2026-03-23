const nodemailer = require('nodemailer');
require('dotenv').config();
const { getSriLankaTime } = require('./srilankantime')
const transporter = nodemailer.createTransport({
  host: 'mail.prolabr.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const WEBSITE_URL = process.env.WEBSITE_URL || "https://hr.prolabr.com";
const ADMIN_URL = process.env.ADMIN_URL || "https://admin.hr.prolabr.com";
// ─────────────────────────────────────────────
// SINGLE EMAIL FOR LEAVE APPROVAL & REJECTION
// ─────────────────────────────────────────────
async function sendLeaveStatusEmail(toEmail, employeeName, leaveType, fromDate, toDate, status, adminName, reason = null) {

  // Determine subject and styling based on status
  let subject, headerBgColor, headerTextColor, headerIcon, headerTitle, mainMessage, buttonText, buttonColor, statusText, statusColor;

  if (status === "approved") {
    subject = `Your Leave Request Has Been Approved — ${leaveType}`;
    headerBgColor = "#f0fdf4";
    headerTextColor = "#166534";
    headerIcon = "";
    headerTitle = "Leave Request Approved";
    mainMessage = `Great news! Your leave request has been <strong>approved</strong> by the HR team. Your time off has been confirmed and is now in the system.`;
    buttonText = "View Leave Details";
    buttonColor = "#22c55e";
    statusText = " Approved";
    statusColor = "#22c55e";
  } else {
    subject = `Your Leave Request Has Been Rejected — ${leaveType}`;
    headerBgColor = "#fef2f2";
    headerTextColor = "#991b1b";
    headerIcon = "";
    headerTitle = "Leave Request Rejected";
    mainMessage = `Unfortunately, your leave request has been <strong>rejected</strong> by the HR team. Please review the rejection reason below and contact HR if you have any questions.`;
    buttonText = "View Leave Requests";
    buttonColor = "#ef4444";
    statusText = " Rejected";
    statusColor = "#ef4444";
  }

  const formattedFromDate = new Date(fromDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedToDate = new Date(toDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const durationDays = Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)) + 1;

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;
                border:1px solid #e5e7eb;border-radius:12px;background:#fff">
      
      <!-- Header Logo -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
        <img src="https://media.licdn.com/dms/image/v2/D560BAQEC7pY4xqu_tA/company-logo_200_200/B56Zq0GE1GIsAI-/0/1763958087788/prolabr_logo?e=2147483647&v=beta&t=v20-6SX0FrXcDIInu2joNl6khaoMygjW3L9ZmfBwUhI" 
             alt="Prolab R" width="36" height="36" style="border-radius:8px;display:block;"/>
        <span style="font-size:18px;font-weight:700;color:#111">Prolab R</span>
      </div>
 
      <!-- Status Banner -->
      <div style="background:${headerBgColor};border-left:4px solid ${statusColor};border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="margin:0;font-size:15px;font-weight:600;color:${headerTextColor}">${headerIcon} ${headerTitle}</p>
      </div>
 
      <!-- Main Content -->
      <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 8px">Hi ${employeeName},</h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px">${mainMessage}</p>
 
      <!-- Details Table -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 12px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">
          ${status === "approved" ? "Approved" : "Rejected"} Leave Details
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr>
            <td style="color:#6b7280;padding:8px 0;width:40%">Leave Type</td>
            <td style="color:#111;font-weight:600;padding:8px 0">${leaveType}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:8px 0">From Date</td>
            <td style="color:#111;font-weight:600;padding:8px 0">${formattedFromDate}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:8px 0">To Date</td>
            <td style="color:#111;font-weight:600;padding:8px 0">${formattedToDate}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:8px 0">Duration</td>
            <td style="color:#111;font-weight:600;padding:8px 0">${durationDays} Days</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:8px 0">${status === "approved" ? "Approved" : "Rejected"} By</td>
            <td style="color:#111;font-weight:600;padding:8px 0">${adminName}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:8px 0">Status</td>
            <td style="color:${statusColor};font-weight:600;padding:8px 0">${statusText}</td>
          </tr>
        </table>
      </div>
 
      ${status === "rejected" && reason ? `
      <!-- Rejection Reason (only for rejected) -->
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px;margin-bottom:24px">
        <p style="margin:0 0 6px;font-size:12px;color:#92400e;font-weight:600;text-transform:uppercase">Rejection Reason</p>
        <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6">${reason}</p>
      </div>
      ` : ""}
 
      <!-- Info Box -->
      ${status === "approved" ? `
      <div style="background:#f0faf9;border:1px solid #e0f2fe;border-radius:8px;padding:14px;margin-bottom:24px">
        <p style="margin:0;font-size:13px;color:#0c4a6e">
          <strong>Heads up:</strong> Please ensure you've handed over your work and notified 
          your team members about your absence.
        </p>
      </div>
      ` : `
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:14px;margin-bottom:24px">
        <p style="margin:0;font-size:13px;color:#0c4a6e">
          <strong>Next Steps:</strong> You can submit a new leave request for different dates 
          or contact the HR team to discuss this decision.
        </p>
      </div>
      `}
 
      <!-- Action Button -->
      <a href="https://hr.prolabr.com/leaves" 
         style="display:block;text-align:center;background:${buttonColor};color:#fff;font-weight:700;font-size:15px;padding:14px 24px;border-radius:8px;text-decoration:none;margin-bottom:24px">
        ${buttonText}
      </a>
 
      <!-- Footer -->
      <hr style="border:none;border-top:1px solid #e5e7eb;margin-bottom:16px" />
      <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center">
        ${status === "approved" ? "Your leave has been confirmed. Enjoy your well-deserved break! 🎉" : "For more information, please contact the HR department."}
      </p>
    </div>`;

  const recipients = Array.isArray(toEmail) ? toEmail.join(',') : toEmail;

  const info = await transporter.sendMail({
    from: `"Prolab R" <${process.env.MAIL_USER}>`,
    to: recipients,
    subject,
    html,
  });

  console.log(`[${subject}] -> ${recipients} | id: ${info.messageId}`);
  return info;
}
// ─────────────────────────────────────────────
// EMAIL FUNCTIONS - SEND TO EMPLOYEE
// ─────────────────────────────────────────────
async function sendLeaveRequestConfirmationEmail(toEmail, employeeName, leaveType, fromDate, toDate, reason) {
  const subject = "Leave Request Submitted — Waiting for Approval";

  const formattedFromDate = new Date(fromDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedToDate = new Date(toDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;
                border:1px solid #e5e7eb;border-radius:12px;background:#fff">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
        <img src="https://media.licdn.com/dms/image/v2/D560BAQEC7pY4xqu_tA/company-logo_200_200/B56Zq0GE1GIsAI-/0/1763958087788/prolabr_logo?e=2147483647&v=beta&t=v20-6SX0FrXcDIInu2joNl6khaoMygjW3L9ZmfBwUhI" alt="Prolab R" width="36" height="36" style="border-radius:8px;display:block;"/>
        <span style="font-size:18px;font-weight:700;color:#111">Prolab R</span>
      </div>
 
      <div style="background:#f0faf9;border-left:4px solid #1F8278;border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="margin:0;font-size:15px;font-weight:600;color:#1F8278">Leave Request Submitted</p>
      </div>
 
      <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 8px">Hi ${employeeName},</h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
        Your leave request has been successfully submitted and is now pending approval from the HR team. Below are the details of your request.
      </p>
 
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 12px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Leave Request Details</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr>
            <td style="color:#6b7280;padding:8px 0;width:40%">Leave Type</td>
            <td style="color:#111;font-weight:600;padding:8px 0">${leaveType}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:8px 0">From Date</td>
            <td style="color:#111;font-weight:600;padding:8px 0">${formattedFromDate}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:8px 0">To Date</td>
            <td style="color:#111;font-weight:600;padding:8px 0">${formattedToDate}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:8px 0">Status</td>
            <td style="color:#f59e0b;font-weight:600;padding:8px 0">⏳ Pending</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:8px 0;vertical-align:top">Reason</td>
            <td style="color:#111;font-weight:600;padding:8px 0;word-break:break-word">${reason || "N/A"}</td>
          </tr>
        </table>
      </div>
 
      <div style="background:#fef9ec;border:1px solid #fed7aa;border-radius:8px;padding:14px;margin-bottom:24px">
        <p style="margin:0;font-size:13px;color:#92400e">
          <strong>What's next?</strong> The HR team will review your request and notify you of the decision via email.
        </p>
      </div>
 
      <a href="${WEBSITE_URL}/leaves" style="display:block;text-align:center;background:#1F8278;color:#fff;font-weight:700;font-size:15px;padding:14px 24px;border-radius:8px;text-decoration:none;margin-bottom:24px">
        View My Leave Requests
      </a>
 
      <hr style="border:none;border-top:1px solid #e5e7eb;margin-bottom:16px" />
      <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center">You will receive an update once your leave request is approved or rejected.</p>
    </div>`;

  const recipients = Array.isArray(toEmail) ? toEmail.join(',') : toEmail;

  const info = await transporter.sendMail({
    from: `"Prolab R" <${process.env.MAIL_USER}>`,
    to: recipients,
    subject,
    html,
  });

  console.log(`[${subject}] -> ${recipients} | id: ${info.messageId}`);
  return info;
}

// ─────────────────────────────────────────────
// EMAIL FUNCTIONS - SEND TO ADMIN
// ─────────────────────────────────────────────
async function sendAdminLeaveNotificationEmail(adminEmails, employeeName, leaveType, fromDate, toDate) {
  const subject = `New Leave Request — ${employeeName} (${leaveType})`;

  const formattedFromDate = new Date(fromDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedToDate = new Date(toDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;
                border:1px solid #e5e7eb;border-radius:12px;background:#fff">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
        <img src="https://media.licdn.com/dms/image/v2/D560BAQEC7pY4xqu_tA/company-logo_200_200/B56Zq0GE1GIsAI-/0/1763958087788/prolabr_logo?e=2147483647&v=beta&t=v20-6SX0FrXcDIInu2joNl6khaoMygjW3L9ZmfBwUhI" alt="Prolab R" width="36" height="36" style="border-radius:8px;display:block;"/>
        <span style="font-size:18px;font-weight:700;color:#111">Prolab R</span>
      </div>
 
      <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="margin:0;font-size:15px;font-weight:600;color:#991b1b"> New Leave Request Pending Review</p>
      </div>
 
      <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 8px">Leave Request from ${employeeName}</h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
        A new leave request has been submitted and requires your attention. Please review the details and approve or reject the request.
      </p>
 
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 12px;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Request Details</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr>
            <td style="color:#6b7280;padding:8px 0;width:40%">Employee Name</td>
            <td style="color:#111;font-weight:600;padding:8px 0">${employeeName}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:8px 0">Leave Type</td>
            <td style="color:#111;font-weight:600;padding:8px 0">${leaveType}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:8px 0">From Date</td>
            <td style="color:#111;font-weight:600;padding:8px 0">${formattedFromDate}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:8px 0">To Date</td>
            <td style="color:#111;font-weight:600;padding:8px 0">${formattedToDate}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:8px 0">Duration</td>
            <td style="color:#111;font-weight:600;padding:8px 0">${Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)) + 1} Days</td>
          </tr>
        </table>
      </div>
 
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;margin-bottom:24px">
        <p style="margin:0;font-size:13px;color:#166534">
          <strong>Action Required:</strong> Log in to the admin panel to review, approve, or reject this leave request.
        </p>
      </div>
 
      <a href="${ADMIN_URL}/leaves" style="display:block;text-align:center;background:#ef4444;color:#fff;font-weight:700;font-size:15px;padding:14px 24px;border-radius:8px;text-decoration:none;margin-bottom:24px">
        Review Leave Requests
      </a>
 
      <hr style="border:none;border-top:1px solid #e5e7eb;margin-bottom:16px" />
      <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center">This is an automated notification. Please do not reply to this email.</p>
    </div>`;

  const recipients = Array.isArray(adminEmails) ? adminEmails.join(',') : adminEmails;

  const info = await transporter.sendMail({
    from: `"Prolab R" <${process.env.MAIL_USER}>`,
    to: recipients,
    subject,
    html,
  });

  console.log(`[${subject}] -> ${recipients} | id: ${info.messageId}`);
  return info;
}

// ─────────────────────────────────────────────
// 1. LOGIN OTP EMAIL
// ─────────────────────────────────────────────
async function sendLoginOTPEmail(toEmail, otp) {
  const subject = "Your Prolab R Login Code";

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;
                border:1px solid #e5e7eb;border-radius:12px;background:#fff">
      ${_header()}
      <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 8px">
        Your login verification code
      </h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 28px">
        Enter this code to complete your sign-in to Prolab R.
      </p>
      <div style="background:#f0faf9;border:2px dashed #1F8278;border-radius:10px;
                  padding:24px;text-align:center;margin-bottom:24px">
        <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#1F8278">
          ${otp}
        </div>
      </div>
      <p style="color:#6b7280;font-size:13px;margin:0 0 8px">
        This code expires in <strong>1 minute</strong>.
      </p>
      <p style="color:#6b7280;font-size:13px;margin:0 0 24px">
        Never share this code with anyone, including Prolab R staff.
      </p>
      ${_footer("If you did not try to log in, please secure your account immediately.")}
    </div>`;

  return _send(toEmail, subject, html);
}

// ─────────────────────────────────────────────
// 2. PASSWORD RESET OTP EMAIL
// ─────────────────────────────────────────────
async function sendPasswordResetOTPEmail(toEmail, otp) {
  const subject = "Reset Your Prolab R Password";

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;
                border:1px solid #e5e7eb;border-radius:12px;background:#fff">
      ${_header()}
      <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 8px">
        Reset your password
      </h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 28px">
        We received a password reset request for your account.
        Use the code below to proceed.
      </p>
      <div style="background:#fff5f5;border:2px dashed #ef4444;border-radius:10px;
                  padding:24px;text-align:center;margin-bottom:24px">
        <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#ef4444">
          ${otp}
        </div>
      </div>
      <p style="color:#6b7280;font-size:13px;margin:0 0 8px">
        This code expires in <strong>1 minute</strong>.
      </p>
      <p style="color:#6b7280;font-size:13px;margin:0 0 24px">
        If you did not request a password reset, ignore this email —
        your password will not be changed.
      </p>
      ${_footer("For your security, this code is valid for one use only.")}
    </div>`;

  return _send(toEmail, subject, html);
}

// ─────────────────────────────────────────────
// 3. WELCOME EMAIL
// ─────────────────────────────────────────────
async function sendWelcomeEmail(toEmail, name, tempPassword) {
  const subject = "Welcome to Prolab R — Your Account Details";

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;
                border:1px solid #e5e7eb;border-radius:12px;background:#fff">
      ${_header()}
      <h2 style="font-size:22px;font-weight:700;color:#111;margin:0 0 8px">
        Welcome aboard, ${name}!
      </h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
        Your Prolab R employee account has been created.
        Here are your login credentials — please keep them safe.
      </p>

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;
                  padding:20px;margin-bottom:24px">
        <p style="margin:0 0 12px;font-size:13px;color:#6b7280;font-weight:600;
                  text-transform:uppercase;letter-spacing:0.5px">Your Login Credentials</p>
        <div style="margin-bottom:12px">
          <p style="margin:0 0 2px;font-size:12px;color:#9ca3af">Email</p>
          <p style="margin:0;font-size:15px;font-weight:600;color:#111">${toEmail}</p>
        </div>
        <div>
          <p style="margin:0 0 2px;font-size:12px;color:#9ca3af">Temporary Password</p>
          <p style="margin:0;font-size:15px;font-weight:600;color:#1F8278;
                    font-family:monospace;letter-spacing:1px">${tempPassword}</p>
        </div>
      </div>

     

      

      <a href="${WEBSITE_URL}/login"
         style="display:block;text-align:center;background:#1F8278;color:#fff;
                font-weight:700;font-size:15px;padding:14px 24px;
                border-radius:8px;text-decoration:none;margin-bottom:24px">
        Log In Now
      </a>

      ${_footer("This email was sent because an account was created for you on Prolab R.")}
    </div>`;

  return _send(toEmail, subject, html);
}

// ─────────────────────────────────────────────
// 4. LOGIN NOTIFICATION EMAIL
// ─────────────────────────────────────────────
async function sendLoginNotificationEmail(toEmail, userName) {
  const subject = "New Login to Your Prolab R Account";

  const loginTime = getSriLankaTime().toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;
                border:1px solid #e5e7eb;border-radius:12px;background:#fff">
      ${_header()}

      <div style="background:#f0faf9;border-left:4px solid #1F8278;border-radius:8px;
                  padding:16px;margin-bottom:24px">
        <p style="margin:0;font-size:15px;font-weight:600;color:#1F8278">
          Successful Login Detected
        </p>
      </div>

      <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 8px">
        Welcome back, ${userName}!
      </h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
        We noticed a new login to your Prolab R account. Here are the details:
      </p>

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;
                  padding:20px;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr>
            <td style="color:#6b7280;padding:6px 0;width:40%">Time</td>
            <td style="color:#111;font-weight:600;padding:6px 0">${loginTime}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:6px 0">Account</td>
            <td style="color:#111;font-weight:600;padding:6px 0">${toEmail}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;padding:6px 0">Platform</td>
            <td style="color:#111;font-weight:600;padding:6px 0">Prolab R System</td>
          </tr>
        </table>
      </div>

      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;
                  padding:16px;margin-bottom:24px">
        <p style="margin:0;font-size:13px;color:#92400e">
          <strong>Not you?</strong> If you did not log in, please reset your password
          immediately and contact our support team.
        </p>
      </div>

      <a href="${WEBSITE_URL}/dashboard"
         style="display:block;text-align:center;background:#1F8278;color:#fff;
                font-weight:700;font-size:15px;padding:14px 24px;
                border-radius:8px;text-decoration:none;margin-bottom:24px">
        Go to Dashboard
      </a>

      ${_footer("This is an automated security notification. Please do not reply to this email.")}
    </div>`;

  return _send(toEmail, subject, html);
}

// ─────────────────────────────────────────────
// 5. PROJECT ASSIGNMENT EMAIL
// ─────────────────────────────────────────────
async function sendProjectAssignmentEmail(toEmail, employeeName, projectName) {
  const subject = `You've Been Assigned to a New Project — ${projectName}`;

  const html = `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;
                    border:1px solid #e5e7eb;border-radius:12px;background:#fff">
          ${_header()}

          <div style="background:linear-gradient(135deg,#1F8278,#2aa99b);
                      border-radius:10px;padding:24px;margin-bottom:24px;text-align:center">
            <p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,0.75);
                      text-transform:uppercase;letter-spacing:1px;font-weight:600">
              New Project Assignment
            </p>
            <h1 style="margin:0;font-size:24px;font-weight:800;color:#fff">
              ${projectName}
            </h1>
          </div>

          <h2 style="font-size:18px;font-weight:700;color:#111;margin:0 0 8px">
            Hi ${employeeName}, you have been assigned to a new project.
          </h2>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
            You have been added as a team member on <strong>${projectName}</strong>.
          </p>

          <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;
                      padding:14px;margin-bottom:24px">
            <p style="margin:0;font-size:13px;color:#92400e">
              Please log in to Prolab R to view full project details.
            </p>
          </div>

          <a href="${WEBSITE_URL}/dashboard"
             style="display:block;text-align:center;background:#1F8278;color:#fff;
                    font-weight:700;font-size:15px;padding:14px 24px;
                    border-radius:8px;text-decoration:none;margin-bottom:24px">
            View Project
          </a>

          ${_footer()}
        </div>`;

  return _send(toEmail, subject, html);
}

// ─────────────────────────────────────────────
// 6. CHECK-IN REMINDER (7:15 AM)
// ─────────────────────────────────────────────
async function sendCheckInReminderEmail(toEmail, userName) {
  const subject = "Check-In Reminder — Mark Your Attendance";

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;
                border:1px solid #e5e7eb;border-radius:12px;background:#fff">
      ${_header()}

      <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 8px">
        Good Morning, ${userName}!
      </h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
        Please mark your attendance for today before the deadline.
      </p>

      <div style="background:#fef9ec;border-left:4px solid #f59e0b;
                  border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="margin:0;font-size:14px;color:#92400e;font-weight:600">
          Attendance marked after 8:30 AM will be recorded as <strong>LATE</strong>.
        </p>
      </div>

      <a href="${WEBSITE_URL}/attendance"
         style="display:block;text-align:center;background:#1F8278;color:#fff;
                font-weight:700;font-size:15px;padding:14px 24px;
                border-radius:8px;text-decoration:none;margin-bottom:24px">
        Mark Attendance
      </a>

      ${_footer("Please check in before 8:30 AM to avoid being marked late.")}
    </div>`;

  return _send(toEmail, subject, html);
}

// ─────────────────────────────────────────────
// 7. TASK REMINDER — 10:00 AM
// ─────────────────────────────────────────────
async function sendTaskReminder10AM(toEmail, userName) {
  const subject = "Task Reminder — Submission Closes at 10:30 AM";

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;
                border:1px solid #e5e7eb;border-radius:12px;background:#fff">
      ${_header()}

      <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 8px">
        Add Your Morning Tasks, ${userName}
      </h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
        It is 10:00 AM. Please log the tasks you are working on this morning.
      </p>

      <div style="background:#f0fdf4;border-left:4px solid #22c55e;
                  border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="margin:0;font-size:14px;color:#166534;font-weight:600">
          Task submission window closes in <strong>30 minutes</strong> at 10:30 AM.
        </p>
      </div>

      <a href="${WEBSITE_URL}/attendance"
         style="display:block;text-align:center;background:#1F8278;color:#fff;
                font-weight:700;font-size:15px;padding:14px 24px;
                border-radius:8px;text-decoration:none;margin-bottom:24px">
        Add Tasks
      </a>

      ${_footer("Task submission closes at 10:30 AM.")}
    </div>`;

  return _send(toEmail, subject, html);
}

// ─────────────────────────────────────────────
// 8. TASK REMINDER — 12:00 PM
// ─────────────────────────────────────────────
async function sendTaskReminder12PM(toEmail, userName) {
  const subject = "Task Reminder — Submission Closes at 12:30 PM";

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;
                border:1px solid #e5e7eb;border-radius:12px;background:#fff">
      ${_header()}

      <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 8px">
        Midday Task Update, ${userName}
      </h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
        It is 12:00 PM. Please log your afternoon tasks before the window closes.
      </p>

      <div style="background:#f0fdf4;border-left:4px solid #22c55e;
                  border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="margin:0;font-size:14px;color:#166534;font-weight:600">
          Task submission window closes in <strong>30 minutes</strong> at 12:30 PM.
        </p>
      </div>


      <a href="${WEBSITE_URL}/attendance"
         style="display:block;text-align:center;background:#1F8278;color:#fff;
                font-weight:700;font-size:15px;padding:14px 24px;
                border-radius:8px;text-decoration:none;margin-bottom:24px">
        Add Afternoon Tasks
      </a>

      ${_footer("Task submission closes at 12:30 PM.")}
    </div>`;

  return _send(toEmail, subject, html);
}

// ─────────────────────────────────────────────
// 9. TASK REMINDER — 2:00 PM
// ─────────────────────────────────────────────
async function sendTaskReminder2PM(toEmail, userName) {
  const subject = "Task Reminder — Submission Closes at 2:30 PM";

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;
                border:1px solid #e5e7eb;border-radius:12px;background:#fff">
      ${_header()}

      <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 8px">
        Afternoon Task Reminder, ${userName}
      </h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
        It is 2:00 PM. Please make sure your tasks are up to date.
      </p>

      <div style="background:#f0fdf4;border-left:4px solid #22c55e;
                  border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="margin:0;font-size:14px;color:#166534;font-weight:600">
          Task submission window closes in <strong>30 minutes</strong> at 2:30 PM.
        </p>
      </div>

      <a href="${WEBSITE_URL}/attendance"
         style="display:block;text-align:center;background:#1F8278;color:#fff;
                font-weight:700;font-size:15px;padding:14px 24px;
                border-radius:8px;text-decoration:none;margin-bottom:24px">
        Update Tasks
      </a>

      ${_footer("Task submission closes at 2:30 PM.")}
    </div>`;

  return _send(toEmail, subject, html);
}

// ─────────────────────────────────────────────
// 10. CHECK-OUT REMINDER (4:00 PM)
// ─────────────────────────────────────────────
async function sendCheckOutReminderEmail(toEmail, userName) {
  const subject = "Check-Out Reminder — Office Closes at 5:00 PM";

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;
                border:1px solid #e5e7eb;border-radius:12px;background:#fff">
      ${_header()}

      <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 8px">
        Please Check Out Before Leaving, ${userName}
      </h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
        The office closes at <strong>5:00 PM</strong>. Please check out before you leave.
      </p>

      <div style="background:#fef2f2;border-left:4px solid #ef4444;
                  border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="margin:0;font-size:14px;color:#991b1b;font-weight:600">
          Check-out closes at <strong>5:00 PM (17:00)</strong>. Do not miss it.
        </p>
      </div>

     
      <a href="${WEBSITE_URL}/attendance"
         style="display:block;text-align:center;background:#ef4444;color:#fff;
                font-weight:700;font-size:15px;padding:14px 24px;
                border-radius:8px;text-decoration:none;margin-bottom:24px">
        Check Out
      </a>

      ${_footer("Check-out window closes at 5:00 PM (17:00).")}
    </div>`;

  return _send(toEmail, subject, html);
}

// ─────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────
function _header() {
  return `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
      <img
        src="https://media.licdn.com/dms/image/v2/D560BAQEC7pY4xqu_tA/company-logo_200_200/B56Zq0GE1GIsAI-/0/1763958087788/prolabr_logo?e=2147483647&v=beta&t=v20-6SX0FrXcDIInu2joNl6khaoMygjW3L9ZmfBwUhI"
        alt="Prolab R"
        width="36"
        height="36"
        style="border-radius:8px;display:block;"
      />
      <span style="font-size:18px;font-weight:700;color:#111">Prolab R</span>
    </div>`;
}

function _footer(note = "") {
  return `
    <hr style="border:none;border-top:1px solid #e5e7eb;margin-bottom:16px" />
    <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center">${note}</p>`;
}

function _step(num, title, desc) {
  return `
    <div style="display:flex;gap:14px;margin-bottom:16px;align-items:flex-start">
      <div style="background:#1F8278;color:#fff;font-weight:800;font-size:13px;
                  min-width:28px;height:28px;border-radius:50%;
                  display:flex;align-items:center;justify-content:center">${num}</div>
      <div>
        <div style="font-weight:600;color:#111;font-size:14px">${title}</div>
        <div style="color:#6b7280;font-size:13px">${desc}</div>
      </div>
    </div>`;
}

async function _send(toEmail, subject, html) {
  const recipients = Array.isArray(toEmail) ? toEmail.join(',') : toEmail;

  const info = await transporter.sendMail({
    from: `"Prolab R" <${process.env.MAIL_USER}>`,
    to: recipients,
    subject,
    html,
  });

  console.log(`[${subject}] -> ${recipients} | id: ${info.messageId}`);
  return info;
}

// EXPORTS

module.exports = {
  sendLoginOTPEmail,
  sendPasswordResetOTPEmail,
  sendWelcomeEmail,
  sendLoginNotificationEmail,
  sendProjectAssignmentEmail,
  sendCheckInReminderEmail,
  sendTaskReminder10AM,
  sendTaskReminder12PM,
  sendTaskReminder2PM,
  sendCheckOutReminderEmail,
  sendLeaveRequestConfirmationEmail,
  sendAdminLeaveNotificationEmail,
  sendLeaveStatusEmail
};

// chage password 
// <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;
//             padding:14px;margin-bottom:24px">
//   <p style="margin:0;font-size:13px;color:#92400e">
//     <strong>Please change your password</strong> after your first login
//     for security purposes.
//   </p>
// </div>