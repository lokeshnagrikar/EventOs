package com.eventos.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

@Service
@SuppressWarnings("null")
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${app.mail.from:support@eventosapp.in}")
    private String fromAddress;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:https://eventosapp.in}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /* -------------------------------------------------------------------------- */
    /* 1. VERIFICATION OTP EMAIL (3D ANIMATED LOCK & KEY) */
    /* -------------------------------------------------------------------------- */
    @Async
    public void sendVerificationEmail(String toEmail, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String sender = (fromAddress != null && !fromAddress.trim().isEmpty()) ? fromAddress
                    : "support@eventosapp.in";
            helper.setFrom(sender, "EventOS");
            helper.setTo(toEmail);
            helper.setSubject("🔒 Your EventOS Security Verification Code: " + token);

            String htmlContent = "<!DOCTYPE html>" +
                    "<html lang=\"en\">" +
                    "<head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"></head>"
                    +
                    "<body style=\"margin:0; padding:30px 15px; background-color:#050507; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;\">"
                    +
                    "<table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\"><tr><td align=\"center\">" +
                    "  <table width=\"520\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#0C0C0F; border:1px solid #27272A; border-radius:28px; overflow:hidden;\">"
                    +
                    "    <tr><td align=\"center\" style=\"padding:40px 30px; background:linear-gradient(135deg, #4C1D95 0%, #831843 100%);\">"
                    +
                    "      <!-- 3D ANIMATED LOCK EMBLEM -->" +
                    "      <img src=\"https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Locked.png\" width=\"96\" height=\"96\" style=\"display:block; margin:0 auto 16px; filter:drop-shadow(0 10px 20px rgba(0,0,0,0.4));\" alt=\"Security Lock\" />"
                    +
                    "      <div style=\"font-size:11px; font-weight:800; color:#F472B6; letter-spacing:2px; text-transform:uppercase;\">SECURITY VERIFICATION</div>"
                    +
                    "      <h1 style=\"margin:8px 0 0; font-size:24px; color:#FFFFFF; font-weight:900;\">Verify Your Email Address</h1>"
                    +
                    "    </td></tr>" +
                    "    <tr><td style=\"padding:36px; text-align:center;\">" +
                    "      <p style=\"color:#A1A1AA; font-size:14px; line-height:1.7; margin-bottom:28px;\">Please enter the 6-digit verification code below to activate your EventOS workspace:</p>"
                    +
                    "      <div style=\"background:#18181B; border:1px solid #3F3F46; padding:20px; border-radius:20px; margin-bottom:28px;\">"
                    +
                    "        <span style=\"font-size:38px; font-weight:900; letter-spacing:8px; color:#A78BFA; font-family:monospace;\">"
                    + token + "</span>" +
                    "      </div>" +
                    "      <p style=\"color:#71717A; font-size:12px; margin-bottom:0;\">This code is valid for 15 minutes. If you did not request this code, you can safely ignore this email.</p>"
                    +
                    "    </td></tr>" +
                    "    <tr><td align=\"center\" style=\"padding:20px; background:#08080A; border-top:1px solid #27272A; font-size:11px; color:#52525B;\">"
                    +
                    "      EventOS Business Suite • Tenant-Isolated & Encrypted" +
                    "    </td></tr>" +
                    "  </table>" +
                    "</td></tr></table>" +
                    "</body></html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[EMAIL_SENT] Verification OTP email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("[EMAIL_ERROR] Failed to send verification email to: {}", toEmail, e);
        }
    }

    /* -------------------------------------------------------------------------- */
    /* 2. TEAM INVITATION EMAIL (3D ANIMATED HANDSHAKE) */
    /* -------------------------------------------------------------------------- */
    @Async
    public void sendInvitationEmail(String toEmail, String inviteToken, String inviteeName, String senderName,
            String roleName, String workspaceName, String frontendBaseUrl) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String sender = (fromAddress != null && !fromAddress.trim().isEmpty()) ? fromAddress
                    : "support@eventosapp.in";
            helper.setFrom(sender, "EventOS");
            helper.setTo(toEmail);
            helper.setSubject("🤝 You're invited to join EventOS — " + (senderName != null ? senderName : "A Team")
                    + " wants you aboard");

            String acceptUrl = (frontendBaseUrl != null ? frontendBaseUrl : frontendUrl) + "/accept-invite?token="
                    + inviteToken;
            String displayName = (inviteeName != null && !inviteeName.trim().isEmpty()) ? inviteeName
                    : toEmail.split("@")[0];
            String roleDisplay = roleName != null
                    ? roleName.substring(0, 1).toUpperCase() + roleName.substring(1).toLowerCase()
                    : "Team Member";
            String inviterDisplay = (senderName != null && !senderName.trim().isEmpty()) ? senderName : "Your admin";
            String workspaceDisplay = (workspaceName != null && !workspaceName.trim().isEmpty()) ? workspaceName
                    : "Your Workspace";

            String htmlContent = "<!DOCTYPE html>" +
                    "<html lang=\"en\">" +
                    "<head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"></head>"
                    +
                    "<body style=\"margin:0; padding:30px 15px; background-color:#050507; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;\">"
                    +
                    "<table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\"><tr><td align=\"center\">" +
                    "  <table width=\"560\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#0C0C0F; border:1px solid #27272A; border-radius:28px; overflow:hidden;\">"
                    +
                    "    <tr><td align=\"center\" style=\"padding:45px 35px; background:linear-gradient(135deg,#7C3AED 0%,#DB2777 50%,#2563EB 100%);\">"
                    +
                    "      <!-- 3D ANIMATED HANDSHAKE ILLUSTRATION -->" +
                    "      <img src=\"https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People/Handshake.png\" width=\"96\" height=\"96\" style=\"display:block; margin:0 auto 16px; filter:drop-shadow(0 10px 20px rgba(0,0,0,0.4));\" alt=\"Handshake\" />"
                    +
                    "      <div style=\"font-size:11px; font-weight:800; color:#FBCFE8; letter-spacing:2px; text-transform:uppercase;\">✨ TEAM INVITATION</div>"
                    +
                    "      <h1 style=\"margin:8px 0 0; font-size:28px; color:#FFFFFF; font-weight:900;\">You're Invited</h1>"
                    +
                    "      <p style=\"margin-top:8px; font-size:15px; color:rgba(255,255,255,0.9);\">Join <strong>"
                    + inviterDisplay + "</strong> in <strong>" + workspaceDisplay + "</strong></p>" +
                    "    </td></tr>" +
                    "    <tr><td style=\"padding:40px;\">" +
                    "      <p style=\"font-size:15px; color:#E4E4E7; font-weight:600;\">Hi " + displayName + " 👋</p>" +
                    "      <p style=\"font-size:14px; line-height:1.8; color:#A1A1AA;\">" +
                    "        <strong style=\"color:white;\">" + inviterDisplay
                    + "</strong> has invited you to join <strong style=\"color:#C4B5FD;\">" + workspaceDisplay
                    + "</strong> as <strong style=\"color:#EC4899;\">" + roleDisplay
                    + "</strong>. Accept the invite to start collaborating." +
                    "      </p>" +
                    "      <!-- CTA BUTTON -->" +
                    "      <table width=\"100%\" style=\"margin:30px 0;\"><tr><td align=\"center\">" +
                    "        <a href=\"" + acceptUrl
                    + "\" style=\"display:inline-block; padding:18px 45px; border-radius:50px; background:linear-gradient(135deg,#8B5CF6,#EC4899); color:white; font-size:15px; font-weight:800; text-decoration:none; box-shadow:0 10px 20px rgba(139,92,246,0.3);\">🚀 Join Workspace</a>"
                    +
                    "      </td></tr></table>" +
                    "      <p style=\"font-size:12px; color:#71717A;\">This invitation expires in 48 hours.</p>" +
                    "    </td></tr>" +
                    "    <tr><td align=\"center\" style=\"padding:20px; background:#08080A; border-top:1px solid #27272A; font-size:11px; color:#52525B;\">"
                    +
                    "      EventOS Business Suite • Team Collaboration Engine" +
                    "    </td></tr>" +
                    "  </table>" +
                    "</td></tr></table>" +
                    "</body></html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[EMAIL_SENT] Invitation email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("[EMAIL_ERROR] Failed to send invitation email to: {}", toEmail, e);
        }
    }

    /* -------------------------------------------------------------------------- */
    /* 3. PASSWORD RESET EMAIL (3D ANIMATED SHIELD & SECURITY) */
    /* -------------------------------------------------------------------------- */
    @Async
    public void sendPasswordResetEmail(String toEmail, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String sender = (fromAddress != null && !fromAddress.trim().isEmpty()) ? fromAddress
                    : "support@eventosapp.in";
            helper.setFrom(sender, "EventOS Security");
            helper.setTo(toEmail);
            helper.setSubject("🛡️ Reset Your EventOS Password");

            String resetUrl = frontendUrl + "/reset-password?token=" + token;
            String htmlContent = "<!DOCTYPE html>" +
                    "<html lang=\"en\">" +
                    "<head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"></head>"
                    +
                    "<body style=\"margin:0; padding:30px 15px; background-color:#050507; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;\">"
                    +
                    "<table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\"><tr><td align=\"center\">" +
                    "  <table width=\"520\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#0C0C0F; border:1px solid #27272A; border-radius:28px; overflow:hidden;\">"
                    +
                    "    <tr><td align=\"center\" style=\"padding:40px 30px; background:linear-gradient(135deg,#991B1B 0%,#D97706 100%);\">"
                    +
                    "      <!-- 3D ANIMATED SHIELD ILLUSTRATION -->" +
                    "      <img src=\"https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Shield.png\" width=\"96\" height=\"96\" style=\"display:block; margin:0 auto 16px; filter:drop-shadow(0 10px 20px rgba(0,0,0,0.4));\" alt=\"Shield Security\" />"
                    +
                    "      <div style=\"font-size:11px; font-weight:800; color:#FDE68A; letter-spacing:2px; text-transform:uppercase;\">PASSWORD RECOVERY</div>"
                    +
                    "      <h1 style=\"margin:8px 0 0; font-size:24px; color:#FFFFFF; font-weight:900;\">Reset Password Request</h1>"
                    +
                    "    </td></tr>" +
                    "    <tr><td style=\"padding:36px; text-align:center;\">" +
                    "      <p style=\"color:#A1A1AA; font-size:14px; line-height:1.7; margin-bottom:28px;\">We received a request to reset your password. Click below to choose a new password:</p>"
                    +
                    "      <div style=\"margin-bottom:28px;\">" +
                    "        <a href=\"" + resetUrl
                    + "\" style=\"display:inline-block; padding:16px 36px; border-radius:16px; background:linear-gradient(135deg,#DC2626,#F59E0B); color:white; font-size:15px; font-weight:800; text-decoration:none; box-shadow:0 10px 20px rgba(220,38,38,0.3);\">🔑 Reset Password</a>"
                    +
                    "      </div>" +
                    "      <p style=\"color:#71717A; font-size:12px; margin-bottom:0;\">This link expires in 15 minutes. If you did not request this change, please ignore this email.</p>"
                    +
                    "    </td></tr>" +
                    "    <tr><td align=\"center\" style=\"padding:20px; background:#08080A; border-top:1px solid #27272A; font-size:11px; color:#52525B;\">"
                    +
                    "      EventOS Security Desk" +
                    "    </td></tr>" +
                    "  </table>" +
                    "</td></tr></table>" +
                    "</body></html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[EMAIL_SENT] Password reset email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("[EMAIL_ERROR] Failed to send password reset email to: {}", toEmail, e);
        }
    }

    /* -------------------------------------------------------------------------- */
    /* 4. WELCOME EMAIL (3D ANIMATED PARTY POPPER) */
    /* -------------------------------------------------------------------------- */
    @Async
    public void sendWelcomeEmail(String toEmail, String inviteeName, String workspaceName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String sender = (fromAddress != null && !fromAddress.trim().isEmpty()) ? fromAddress
                    : "support@eventosapp.in";
            helper.setFrom(sender, "EventOS");
            helper.setTo(toEmail);
            helper.setSubject("🎉 Welcome to EventOS — Account Activated!");

            String displayName = (inviteeName != null && !inviteeName.trim().isEmpty()) ? inviteeName
                    : toEmail.split("@")[0];
            String workspaceDisplay = (workspaceName != null && !workspaceName.trim().isEmpty()) ? workspaceName
                    : "Your Workspace";
            String consoleUrl = frontendUrl + "/dashboard";

            String htmlContent = "<!DOCTYPE html>" +
                    "<html lang=\"en\">" +
                    "<head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"></head>"
                    +
                    "<body style=\"margin:0; padding:30px 15px; background-color:#050507; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;\">"
                    +
                    "<table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\"><tr><td align=\"center\">" +
                    "  <table width=\"560\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#0C0C0F; border:1px solid #27272A; border-radius:28px; overflow:hidden;\">"
                    +
                    "    <tr><td align=\"center\" style=\"padding:45px 35px; background:linear-gradient(135deg,#059669 0%,#10B981 50%,#3B82F6 100%);\">"
                    +
                    "      <!-- 3D ANIMATED PARTY POPPER ILLUSTRATION -->" +
                    "      <img src=\"https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Party%20Popper.png\" width=\"96\" height=\"96\" style=\"display:block; margin:0 auto 16px; filter:drop-shadow(0 10px 20px rgba(0,0,0,0.4));\" alt=\"Party Popper\" />"
                    +
                    "      <div style=\"font-size:11px; font-weight:800; color:#A7F3D0; letter-spacing:2px; text-transform:uppercase;\">✨ WELCOME ABOARD</div>"
                    +
                    "      <h1 style=\"margin:8px 0 0; font-size:28px; color:#FFFFFF; font-weight:900;\">Account Activated!</h1>"
                    +
                    "      <p style=\"margin-top:8px; font-size:15px; color:rgba(255,255,255,0.9);\">Welcome to <strong>"
                    + workspaceDisplay + "</strong></p>" +
                    "    </td></tr>" +
                    "    <tr><td style=\"padding:40px;\">" +
                    "      <p style=\"font-size:15px; color:#E4E4E7; font-weight:600;\">Hi " + displayName + " 👋</p>" +
                    "      <p style=\"font-size:14px; line-height:1.8; color:#A1A1AA;\">" +
                    "        Your EventOS profile is now fully activated. You are ready to start creating smart quotes, organizing lead pipelines, and delivering 4K galleries."
                    +
                    "      </p>" +
                    "      <!-- CTA -->" +
                    "      <table width=\"100%\" style=\"margin:30px 0;\"><tr><td align=\"center\">" +
                    "        <a href=\"" + consoleUrl
                    + "\" style=\"display:inline-block; padding:18px 45px; border-radius:50px; background:linear-gradient(135deg,#10B981,#3B82F6); color:white; font-size:15px; font-weight:800; text-decoration:none; box-shadow:0 10px 20px rgba(16,185,129,0.3);\">🚀 Open Console</a>"
                    +
                    "      </td></tr></table>" +
                    "    </td></tr>" +
                    "    <tr><td align=\"center\" style=\"padding:20px; background:#08080A; border-top:1px solid #27272A; font-size:11px; color:#52525B;\">"
                    +
                    "      EventOS Operating System for Event Businesses" +
                    "    </td></tr>" +
                    "  </table>" +
                    "</td></tr></table>" +
                    "</body></html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[EMAIL_SENT] Welcome email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("[EMAIL_ERROR] Failed to send welcome email to: {}", toEmail, e);
        }
    }

    /* -------------------------------------------------------------------------- */
    /* 5. 1-CLICK MAGIC LINK EMAIL (3D ANIMATED ROCKET) */
    /* -------------------------------------------------------------------------- */
    @Async
    public void sendMagicLinkEmail(String toEmail, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String sender = (fromAddress != null && !fromAddress.trim().isEmpty()) ? fromAddress
                    : "support@eventosapp.in";
            helper.setFrom(sender, "EventOS");
            helper.setTo(toEmail);
            helper.setSubject("⚡ 1-Click Magic Link — Sign In to EventOS");

            String loginUrl = frontendUrl + "/login?magicToken=" + token;

            String htmlContent = "<!DOCTYPE html>" +
                    "<html lang=\"en\">" +
                    "<head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"></head>"
                    +
                    "<body style=\"margin:0; padding:30px 15px; background-color:#050507; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;\">"
                    +
                    "<table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\"><tr><td align=\"center\">" +
                    "  <table width=\"520\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#0C0C0F; border:1px solid #27272A; border-radius:28px; overflow:hidden;\">"
                    +
                    "    <tr><td align=\"center\" style=\"padding:40px 30px; background:linear-gradient(135deg,#6D28D9 0%,#BE185D 100%);\">"
                    +
                    "      <!-- 3D ANIMATED ROCKET LAUNCH ILLUSTRATION -->" +
                    "      <img src=\"https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Rocket.png\" width=\"96\" height=\"96\" style=\"display:block; margin:0 auto 16px; filter:drop-shadow(0 10px 20px rgba(0,0,0,0.4));\" alt=\"Rocket Launch\" />"
                    +
                    "      <div style=\"font-size:11px; font-weight:800; color:#F472B6; letter-spacing:2px; text-transform:uppercase;\">INSTANT SIGN IN</div>"
                    +
                    "      <h1 style=\"margin:8px 0 0; font-size:24px; color:#FFFFFF; font-weight:900;\">1-Click Magic Link</h1>"
                    +
                    "    </td></tr>" +
                    "    <tr><td style=\"padding:36px; text-align:center;\">" +
                    "      <p style=\"color:#A1A1AA; font-size:14px; line-height:1.7; margin-bottom:28px;\">Click the button below to log in instantly without entering your password:</p>"
                    +
                    "      <div style=\"margin-bottom:28px;\">" +
                    "        <a href=\"" + loginUrl
                    + "\" style=\"display:inline-block; padding:18px 42px; border-radius:18px; background:linear-gradient(135deg,#8B5CF6,#EC4899); color:white; font-size:15px; font-weight:800; text-decoration:none; box-shadow:0 10px 20px rgba(139,92,246,0.35);\">🚀 Sign In to EventOS</a>"
                    +
                    "      </div>" +
                    "      <p style=\"color:#71717A; font-size:12px; margin-bottom:0;\">This magic link expires in 15 minutes.</p>"
                    +
                    "    </td></tr>" +
                    "    <tr><td align=\"center\" style=\"padding:20px; background:#08080A; border-top:1px solid #27272A; font-size:11px; color:#52525B;\">"
                    +
                    "      EventOS 1-Click Authentication Engine" +
                    "    </td></tr>" +
                    "  </table>" +
                    "</td></tr></table>" +
                    "</body></html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[EMAIL_SENT] Magic Link email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("[EMAIL_ERROR] Failed to send Magic Link email to: {}", toEmail, e);
        }
    }

    /* -------------------------------------------------------------------------- */
    /* 6. SUBSCRIPTION PLAN CONFIRMATION EMAIL (3D ANIMATED CROWN TROPHY) */
    /* -------------------------------------------------------------------------- */
    @Async
    public void sendSubscriptionReceiptEmail(String toEmail, String ownerName, String planName, String amount,
            String currency, String invoiceNum, String pdfUrl) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String sender = (fromAddress != null && !fromAddress.trim().isEmpty()) ? fromAddress
                    : "billing@eventosapp.in";
            helper.setFrom(sender, "EventOS Billing");
            helper.setTo(toEmail);
            helper.setSubject("👑 Subscription Confirmed — " + planName + " Plan Active for EventOS");

            String displayName = (ownerName != null && !ownerName.trim().isEmpty()) ? ownerName : "Agency Owner";

            String htmlContent = "<!DOCTYPE html>" +
                    "<html lang=\"en\">" +
                    "<head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"></head>"
                    +
                    "<body style=\"margin:0; padding:30px 15px; background-color:#050507; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;\">"
                    +
                    "<table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\"><tr><td align=\"center\">" +
                    "  <table width=\"560\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#0C0C0F; border:1px solid #27272A; border-radius:28px; overflow:hidden;\">"
                    +
                    "    <tr><td align=\"center\" style=\"padding:45px 35px; background:linear-gradient(135deg,#D97706 0%,#B45309 50%,#7C3AED 100%);\">"
                    +
                    "      <!-- 3D ANIMATED CROWN TROPHY ILLUSTRATION -->" +
                    "      <img src=\"https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Crown.png\" width=\"96\" height=\"96\" style=\"display:block; margin:0 auto 16px; filter:drop-shadow(0 10px 20px rgba(0,0,0,0.4));\" alt=\"Crown Trophy\" />"
                    +
                    "      <div style=\"font-size:11px; font-weight:800; color:#FDE68A; letter-spacing:2px; text-transform:uppercase;\">👑 PAYMENT CONFIRMED</div>"
                    +
                    "      <h1 style=\"margin:8px 0 0; font-size:28px; color:#FFFFFF; font-weight:900;\">" + planName
                    + " Plan Active</h1>" +
                    "      <p style=\"margin-top:8px; font-size:14px; color:rgba(255,255,255,0.9);\">Receipt #"
                    + invoiceNum + "</p>" +
                    "    </td></tr>" +
                    "    <tr><td style=\"padding:40px;\">" +
                    "      <p style=\"font-size:15px; color:#E4E4E7; font-weight:600;\">Hi " + displayName + " 👋</p>" +
                    "      <p style=\"font-size:14px; line-height:1.8; color:#A1A1AA;\">" +
                    "        Thank you for subscribing to <strong style=\"color:#FBBF24;\">EventOS " + planName
                    + "</strong>! Your payment of <strong style=\"color:white;\">" + currency + " " + amount
                    + "</strong> has been processed successfully." +
                    "      </p>" +
                    "      <!-- RECEIPT SUMMARY -->" +
                    "      <table width=\"100%\" cellpadding=\"20\" style=\"margin-top:20px; background:linear-gradient(145deg, #15151A, #101014); border:1px solid #27272A; border-radius:18px;\">"
                    +
                    "        <tr><td>" +
                    "          <div style=\"color:#71717A; font-size:11px; letter-spacing:1px; text-transform:uppercase;\">INVOICE BREAKDOWN</div>"
                    +
                    "          <h3 style=\"margin:6px 0 14px; color:white; font-size:18px;\">" + planName
                    + " Plan Subscription</h3>" +
                    "          <table width=\"100%\" cellpadding=\"6\">" +
                    "            <tr><td style=\"color:#A1A1AA; font-size:13px;\">Invoice Ref:</td><td align=\"right\" style=\"color:white; font-size:13px; font-family:monospace;\">"
                    + invoiceNum + "</td></tr>" +
                    "            <tr><td style=\"color:#A1A1AA; font-size:13px;\">Amount Paid:</td><td align=\"right\" style=\"color:#FBBF24; font-weight:800; font-size:14px;\">"
                    + currency + " " + amount + "</td></tr>" +
                    "            <tr><td style=\"color:#A1A1AA; font-size:13px;\">Status:</td><td align=\"right\" style=\"color:#10B981; font-weight:700; font-size:13px;\">PAID ✔️</td></tr>"
                    +
                    "          </table>" +
                    "        </td></tr>" +
                    "      </table>" +
                    "      <!-- CTA -->" +
                    "      <table width=\"100%\" style=\"margin:30px 0;\"><tr><td align=\"center\">" +
                    "        <a href=\"" + (pdfUrl != null ? pdfUrl : frontendUrl + "/settings/billing")
                    + "\" style=\"display:inline-block; padding:18px 45px; border-radius:50px; background:linear-gradient(135deg,#F59E0B,#7C3AED); color:white; font-size:15px; font-weight:800; text-decoration:none; box-shadow:0 10px 20px rgba(245,158,11,0.3);\">📄 Download Tax Invoice</a>"
                    +
                    "      </td></tr></table>" +
                    "    </td></tr>" +
                    "    <tr><td align=\"center\" style=\"padding:20px; background:#08080A; border-top:1px solid #27272A; font-size:11px; color:#52525B;\">"
                    +
                    "      EventOS Enterprise Billing • 0% Platform Fee Guarantee" +
                    "    </td></tr>" +
                    "  </table>" +
                    "</td></tr></table>" +
                    "</body></html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[EMAIL_SENT] Subscription confirmation email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("[EMAIL_ERROR] Failed to send subscription receipt email to: {}", toEmail, e);
        }
    }

    /* -------------------------------------------------------------------------- */
    /* DIAGNOSTIC: Synchronous test email (NOT @Async — throws on failure) */
    /* -------------------------------------------------------------------------- */
    public void sendTestEmail(String toEmail) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String sender = (fromAddress != null && !fromAddress.trim().isEmpty()) ? fromAddress
                    : "support@eventosapp.in";
            helper.setFrom(sender, "EventOS Diagnostic");
            helper.setTo(toEmail);
            helper.setSubject("✅ EventOS SMTP Diagnostic — Email is Working!");

            String htmlContent = "<!DOCTYPE html>" +
                    "<html lang=\"en\">" +
                    "<head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"></head>"
                    +
                    "<body style=\"margin:0; padding:30px 15px; background-color:#050507; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;\">"
                    +
                    "<table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\"><tr><td align=\"center\">" +
                    "  <table width=\"520\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#0C0C0F; border:1px solid #27272A; border-radius:28px; overflow:hidden;\">"
                    +
                    "    <tr><td align=\"center\" style=\"padding:40px 30px; background:linear-gradient(135deg,#059669 0%,#10B981 100%);\">"
                    +
                    "      <div style=\"font-size:48px; margin-bottom:12px;\">✅</div>" +
                    "      <div style=\"font-size:11px; font-weight:800; color:#A7F3D0; letter-spacing:2px; text-transform:uppercase;\">SMTP DIAGNOSTIC</div>"
                    +
                    "      <h1 style=\"margin:8px 0 0; font-size:24px; color:#FFFFFF; font-weight:900;\">Email Delivery Working!</h1>"
                    +
                    "    </td></tr>" +
                    "    <tr><td style=\"padding:36px; text-align:center;\">" +
                    "      <p style=\"color:#A1A1AA; font-size:14px; line-height:1.7;\">If you are reading this, your EventOS SMTP configuration is correctly set up and emails are being delivered successfully.</p>"
                    +
                    "      <p style=\"color:#71717A; font-size:12px; margin-top:16px;\">Sent at: "
                    + java.time.Instant.now().toString() + "</p>" +
                    "    </td></tr>" +
                    "    <tr><td align=\"center\" style=\"padding:20px; background:#08080A; border-top:1px solid #27272A; font-size:11px; color:#52525B;\">"
                    +
                    "      EventOS SMTP Diagnostic Test" +
                    "    </td></tr>" +
                    "  </table>" +
                    "</td></tr></table>" +
                    "</body></html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[TEST_EMAIL_SENT] Diagnostic test email successfully sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("[TEST_EMAIL_ERROR] SMTP diagnostic failed for: {}", toEmail, e);
            throw new RuntimeException("SMTP send failed: " + e.getMessage(), e);
        }
    }
}
