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

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username}")
    private String fromAddress;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendVerificationEmail(String toEmail, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            String sender = (fromAddress != null && !fromAddress.trim().isEmpty()) ? fromAddress : "no-reply@eventos.co";
            helper.setFrom(sender);
            helper.setTo(toEmail);
            helper.setSubject("Your EventOS Verification Code: " + token);
            
            String htmlContent = "<div style=\"font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);\">" +
                                 "  <div style=\"margin-bottom: 20px;\">" +
                                 "    <span style=\"font-size: 20px; font-weight: 800; color: #09090b;\">Event<span style=\"color:#8B5CF6;\">OS</span></span>" +
                                 "  </div>" +
                                 "  <h2 style=\"color: #09090b; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 8px;\">Verify Your Email Address</h2>" +
                                 "  <p style=\"color: #71717a; font-size: 14px; line-height: 1.5; margin-bottom: 24px;\">Please enter the 6-digit verification code below in your registration screen to activate your account and access your workspace:</p>" +
                                 "  <div style=\"background: #faf5ff; border: 1px solid #f3e8ff; padding: 18px; text-align: center; border-radius: 12px; margin-bottom: 24px;\">" +
                                 "    <span style=\"font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #8B5CF6; font-family: monospace;\">" + token + "</span>" +
                                 "  </div>" +
                                 "  <p style=\"color: #71717a; font-size: 12px; line-height: 1.5; margin-top: 16px;\">This code is valid for 15 minutes. If you didn't request this email, you can safely ignore it.</p>" +
                                 "  <hr style=\"border: none; border-top: 1px solid #f4f4f5; margin: 24px 0;\">" +
                                 "  <p style=\"color: #a1a1aa; font-size: 10px; margin: 0;\">The Operating System for Event Businesses</p>" +
                                 "</div>";
            
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[EMAIL_SENT] Verification OTP email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("[EMAIL_ERROR] Failed to send verification email to: {}", toEmail, e);
        }
    }

    @Async
    public void sendInvitationEmail(String toEmail, String inviteToken, String inviteeName, String senderName, String roleName, String workspaceName, String frontendBaseUrl) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String sender = (fromAddress != null && !fromAddress.trim().isEmpty()) ? fromAddress : "no-reply@eventos.co";
            helper.setFrom(sender);
            helper.setTo(toEmail);
            helper.setSubject("You're invited to join EventOS — " + (senderName != null ? senderName : "A Team") + " wants you aboard");

            String acceptUrl = (frontendBaseUrl != null ? frontendBaseUrl : frontendUrl) + "/accept-invite?token=" + inviteToken;
            String displayName = (inviteeName != null && !inviteeName.trim().isEmpty()) ? inviteeName : toEmail.split("@")[0];
            String roleDisplay = roleName != null ? roleName.substring(0, 1).toUpperCase() + roleName.substring(1).toLowerCase() : "Team Member";
            String inviterDisplay = (senderName != null && !senderName.trim().isEmpty()) ? senderName : "Your admin";
            String workspaceDisplay = (workspaceName != null && !workspaceName.trim().isEmpty()) ? workspaceName : "Your Workspace";

            String initials = "OS";
            if (senderName != null && !senderName.trim().isEmpty()) {
                String[] parts = senderName.trim().split("\\s+");
                if (parts.length > 1) {
                    initials = (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
                } else if (parts.length == 1 && !parts[0].isEmpty()) {
                    initials = parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
                }
            }

            String htmlContent =
                "<!DOCTYPE html>" +
                "<html lang=\"en\">" +
                "<head>" +
                "<meta charset=\"UTF-8\">" +
                "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                "<title>EventOS Invitation</title>" +
                "</head>" +
                "<body style=\"margin:0; padding:30px 15px; background:#050507; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;\">" +
                "<table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">" +
                "<tr>" +
                "<td align=\"center\">" +
                "<!-- MAIN CONTAINER -->" +
                "<table width=\"560\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#0C0C0F; border:1px solid #27272A; border-radius:28px; overflow:hidden;\">" +
                "<!-- HERO -->" +
                "<tr>" +
                "<td align=\"center\" style=\"padding:55px 35px; background: linear-gradient(135deg,#7C3AED 0%,#DB2777 50%,#2563EB 100%);\">" +
                "  <table width=\"100%\">" +
                "    <tr>" +
                "      <td align=\"center\">" +
                "        <div style=\"display:inline-block; padding:7px 18px; border-radius:50px; background:rgba(255,255,255,.15); color:white; font-size:11px; font-weight:700; letter-spacing:1px;\">✨ TEAM INVITATION</div>" +
                "        <div style=\"margin-top:25px; font-size:30px; font-weight:900; color:white; letter-spacing:-1px;\">EVENT<span style=\"color:#FBCFE8;\">OS</span></div>" +
                "        <div style=\"margin:25px auto; width:80px; height:80px; border-radius:50%; background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.3); font-size:38px; line-height:80px;\">🚀</div>" +
                "        <h1 style=\"margin:0; font-size:30px; color:white; font-weight:800;\">You're Invited</h1>" +
                "        <p style=\"margin-top:12px; font-size:15px; color:rgba(255,255,255,.85);\">Join <strong>" + inviterDisplay + "</strong>'s EventOS workspace</p>" +
                "      </td>" +
                "    </tr>" +
                "  </table>" +
                "</td>" +
                "</tr>" +
                "<!-- BODY -->" +
                "<tr>" +
                "<td style=\"padding:40px;\">" +
                "  <p style=\"font-size:15px; color:#E4E4E7; font-weight:600;\">Hi " + displayName + " 👋</p>" +
                "  <p style=\"font-size:14px; line-height:1.8; color:#A1A1AA;\">" +
                "    <strong style=\"color:white;\">" + inviterDisplay + "</strong> has invited you to join <strong style=\"color:#C4B5FD;\">" + workspaceDisplay + "</strong> on EventOS. Your account is ready. Accept the invitation and start managing events." +
                "  </p>" +
                "  <!-- INVITER CARD -->" +
                "  <table width=\"100%\" cellpadding=\"18\" style=\"margin-top:30px; background:#131316; border:1px solid #27272A; border-radius:18px;\">" +
                "    <tr>" +
                "      <td width=\"60\">" +
                "        <div style=\"width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg,#8B5CF6,#EC4899); color:white; text-align:center; line-height:48px; font-weight:800; font-size:16px;\">" + initials + "</div>" +
                "      </td>" +
                "      <td>" +
                "        <div style=\"color:#71717A; font-size:11px; text-transform:uppercase; letter-spacing:1px;\">Invited By</div>" +
                "        <div style=\"color:white; font-size:16px; font-weight:700; margin-top:5px;\">" + inviterDisplay + "</div>" +
                "      </td>" +
                "    </tr>" +
                "  </table>" +
                "  <!-- WORKSPACE CARD -->" +
                "  <table width=\"100%\" cellpadding=\"20\" style=\"margin-top:20px; background: linear-gradient(145deg, #15151A, #101014); border:1px solid #27272A; border-radius:18px;\">" +
                "    <tr>" +
                "      <td>" +
                "        <div style=\"color:#71717A; font-size:11px; letter-spacing:1px;\">WORKSPACE ACCESS</div>" +
                "        <h2 style=\"margin:8px 0; color:white; font-size:20px;\">🏢 " + workspaceDisplay + "</h2>" +
                "        <table width=\"100%\" cellpadding=\"8\">" +
                "          <tr>" +
                "            <td style=\"color:#A1A1AA; font-size:13px; padding: 4px 0;\">🎯 Role</td>" +
                "            <td align=\"right\" style=\"color:#C4B5FD; font-weight:700; font-size:13px; padding: 4px 0;\">" + roleDisplay + "</td>" +
                "          </tr>" +
                "          <tr>" +
                "            <td style=\"color:#A1A1AA; font-size:13px; padding: 4px 0;\">📅 Invitation</td>" +
                "            <td align=\"right\" style=\"color:white; font-size:13px; padding: 4px 0;\">48 Hours</td>" +
                "          </tr>" +
                "        </table>" +
                "      </td>" +
                "    </tr>" +
                "  </table>" +
                "  <!-- CTA -->" +
                "  <table width=\"100%\" style=\"margin:35px 0;\">" +
                "    <tr>" +
                "      <td align=\"center\">" +
                "        <a href=\"" + acceptUrl + "\" style=\"display:inline-block; padding:18px 45px; border-radius:50px; background:linear-gradient(135deg,#8B5CF6,#EC4899); color:white; font-size:15px; font-weight:800; text-decoration:none; box-shadow: 0 10px 20px rgba(139,92,246,0.25);\">🚀 Join Workspace</a>" +
                "      </td>" +
                "    </tr>" +
                "  </table>" +
                "  <!-- JOURNEY -->" +
                "  <table width=\"100%\" cellpadding=\"18\" style=\"background:#111113; border:1px solid #27272A; border-radius:18px;\">" +
                "    <tr>" +
                "      <td>" +
                "        <h3 style=\"margin:0 0 15px; color:white; font-size:16px;\">Your EventOS Journey</h3>" +
                "        <div style=\"color:#A1A1AA; font-size:13px; line-height: 2;\">" +
                "          ① Create Password<br>" +
                "          ② Complete Profile<br>" +
                "          ③ Enter Workspace<br>" +
                "          ④ Manage Events 🚀" +
                "        </div>" +
                "      </td>" +
                "    </tr>" +
                "  </table>" +
                "  <!-- SECURITY -->" +
                "  <table width=\"100%\" cellpadding=\"18\" style=\"margin-top:25px; background:#15100F; border:1px solid rgba(245,158,11,.2); border-radius:16px;\">" +
                "    <tr>" +
                "      <td>" +
                "        <div style=\"color:#FBBF24; font-weight:700; font-size:14px;\">🔐 Secure Invitation</div>" +
                "        <p style=\"color:#A1A1AA; font-size:12px; line-height:1.7; margin-bottom:0;\">" +
                "          This invitation is unique to your email. For security reasons it expires after 48 hours." +
                "        </p>" +
                "      </td>" +
                "    </tr>" +
                "  </table>" +
                "  <p style=\"margin-top:30px; font-size:12px; color:#71717A; line-height:1.8;\">" +
                "    Button not working?<br>" +
                "    Copy this link:<br>" +
                "    <a href=\"" + acceptUrl + "\" style=\"color:#A78BFA; word-break:break-all;\">" + acceptUrl + "</a>" +
                "  </p>" +
                "</td>" +
                "</tr>" +
                "<!-- FOOTER -->" +
                "<tr>" +
                "<td align=\"center\" style=\"padding:30px; background:#08080A; border-top:1px solid #27272A;\">" +
                "  <div style=\"font-size:12px; color:#52525B; line-height:1.8;\">" +
                "    <strong style=\"color:#E4E4E7;\">EventOS</strong><br>" +
                "    The Operating System for Event Businesses<br><br>" +
                "    Built for creators. Designed for unforgettable events.<br><br>" +
                "    © 2026 EventOS" +
                "  </div>" +
                "</td>" +
                "</tr>" +
                "</table>" +
                "</td>" +
                "</tr>" +
                "</table>" +
                "</body>" +
                "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[EMAIL_SENT] Invitation email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("[EMAIL_ERROR] Failed to send invitation email to: {} — {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String sender = (fromAddress != null && !fromAddress.trim().isEmpty()) ? fromAddress : "no-reply@eventos.co";
            helper.setFrom(sender);
            helper.setTo(toEmail);
            helper.setSubject("Reset your EventOS Password");

            String resetUrl = frontendUrl + "/reset-password?token=" + token;
            String htmlContent = "<h3>Reset your EventOS Password</h3>" +
                                 "<p>You requested a password reset for your EventOS account. Please click the button below to set a new password:</p>" +
                                 "<div style=\"margin: 24px 0;\">" +
                                 "  <a href=\"" + resetUrl + "\" style=\"background:#EC4899;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;\">Reset Password</a>" +
                                 "</div>" +
                                 "<p>Or copy and paste this link into your browser:</p>" +
                                 "<p style=\"word-break:break-all;color:#EC4899;\">" + resetUrl + "</p>" +
                                 "<p style=\"font-size:11px;color:#666;\">This link will expire in 15 minutes.</p>" +
                                 "<p style=\"font-size:11px;color:#999;\">If you did not request this, you can safely ignore this email.</p>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[EMAIL_SENT] Password reset email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("[EMAIL_ERROR] Failed to send password reset email to: {}", toEmail, e);
        }
    }

    @Async
    public void sendWelcomeEmail(String toEmail, String inviteeName, String workspaceName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String sender = (fromAddress != null && !fromAddress.trim().isEmpty()) ? fromAddress : "no-reply@eventos.co";
            helper.setFrom(sender);
            helper.setTo(toEmail);
            helper.setSubject("Welcome to EventOS — Account Successfully Activated! 🚀");

            String displayName = (inviteeName != null && !inviteeName.trim().isEmpty()) ? inviteeName : toEmail.split("@")[0];
            String workspaceDisplay = (workspaceName != null && !workspaceName.trim().isEmpty()) ? workspaceName : "Your Workspace";
            String consoleUrl = frontendUrl + "/dashboard";

            String htmlContent =
                "<!DOCTYPE html>" +
                "<html lang=\"en\">" +
                "<head>" +
                "<meta charset=\"UTF-8\">" +
                "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                "<title>Welcome to EventOS</title>" +
                "</head>" +
                "<body style=\"margin:0; padding:30px 15px; background:#050507; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;\">" +
                "<table width=\"100%\" cellspacing=\"0\" cellpadding=\"0\">" +
                "<tr>" +
                "<td align=\"center\">" +
                "<!-- MAIN CONTAINER -->" +
                "<table width=\"560\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#0C0C0F; border:1px solid #27272A; border-radius:28px; overflow:hidden;\">" +
                "<!-- HERO -->" +
                "<tr>" +
                "<td align=\"center\" style=\"padding:55px 35px; background: linear-gradient(135deg,#7C3AED 0%,#DB2777 50%,#2563EB 100%);\">" +
                "  <table width=\"100%\">" +
                "    <tr>" +
                "      <td align=\"center\">" +
                "        <div style=\"display:inline-block; padding:7px 18px; border-radius:50px; background:rgba(255,255,255,.15); color:white; font-size:11px; font-weight:700; letter-spacing:1px;\">✨ ACCOUNT ACTIVATED</div>" +
                "        <div style=\"margin-top:25px; font-size:30px; font-weight:900; color:white; letter-spacing:-1px;\">EVENT<span style=\"color:#FBCFE8;\">OS</span></div>" +
                "        <div style=\"margin:25px auto; width:80px; height:80px; border-radius:50%; background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.3); font-size:38px; line-height:80px;\">🎉</div>" +
                "        <h1 style=\"margin:0; font-size:30px; color:white; font-weight:800;\">Welcome Aboard!</h1>" +
                "        <p style=\"margin-top:12px; font-size:15px; color:rgba(255,255,255,.85);\">Your account has been opened successfully</p>" +
                "      </td>" +
                "    </tr>" +
                "  </table>" +
                "</td>" +
                "</tr>" +
                "<!-- BODY -->" +
                "<tr>" +
                "<td style=\"padding:40px;\">" +
                "  <p style=\"font-size:15px; color:#E4E4E7; font-weight:600;\">Hi " + displayName + " 👋</p>" +
                "  <p style=\"font-size:14px; line-height:1.8; color:#A1A1AA;\">" +
                "    We are thrilled to welcome you to <strong style=\"color:#C4B5FD;\">" + workspaceDisplay + "</strong> on EventOS. Your profile is now fully active, and you are ready to begin creating, planning, and managing outstanding events." +
                "  </p>" +
                "  <!-- SUCCESS CARD -->" +
                "  <table width=\"100%\" cellpadding=\"20\" style=\"margin-top:20px; background: linear-gradient(145deg, #15151A, #101014); border:1px solid #27272A; border-radius:18px;\">" +
                "    <tr>" +
                "      <td>" +
                "        <div style=\"color:#71717A; font-size:11px; letter-spacing:1px;\">WORKSPACE CONFIRMATION</div>" +
                "        <h2 style=\"margin:8px 0; color:white; font-size:20px;\">🏢 " + workspaceDisplay + "</h2>" +
                "        <table width=\"100%\" cellpadding=\"8\">" +
                "          <tr>" +
                "            <td style=\"color:#A1A1AA; font-size:13px; padding: 4px 0;\">✔️ Email Verified</td>" +
                "            <td align=\"right\" style=\"color:#C4B5FD; font-weight:700; font-size:13px; padding: 4px 0;\">Yes</td>" +
                "          </tr>" +
                "          <tr>" +
                "            <td style=\"color:#A1A1AA; font-size:13px; padding: 4px 0;\">✔️ Account Status</td>" +
                "            <td align=\"right\" style=\"color:white; font-size:13px; padding: 4px 0;\">Active</td>" +
                "          </tr>" +
                "        </table>" +
                "      </td>" +
                "    </tr>" +
                "  </table>" +
                "  <!-- CTA -->" +
                "  <table width=\"100%\" style=\"margin:35px 0;\">" +
                "    <tr>" +
                "      <td align=\"center\">" +
                "        <a href=\"" + consoleUrl + "\" style=\"display:inline-block; padding:18px 45px; border-radius:50px; background:linear-gradient(135deg,#8B5CF6,#EC4899); color:white; font-size:15px; font-weight:800; text-decoration:none; box-shadow: 0 10px 20px rgba(139,92,246,0.25);\">🚀 Go to Console</a>" +
                "      </td>" +
                "    </tr>" +
                "  </table>" +
                "  <!-- JOURNEY -->" +
                "  <table width=\"100%\" cellpadding=\"18\" style=\"background:#111113; border:1px solid #27272A; border-radius:18px;\">" +
                "    <tr>" +
                "      <td>" +
                "        <h3 style=\"margin:0 0 15px; color:white; font-size:16px;\">Next Steps to Launch</h3>" +
                "        <div style=\"color:#A1A1AA; font-size:13px; line-height: 2;\">" +
                "          ① Explore CRM & Leads Pipeline<br>" +
                "          ② Configure Brand Customizations<br>" +
                "          ③ Connect Cloudinary Storage<br>" +
                "          ④ Invite team and create your first booking! 🎉" +
                "        </div>" +
                "      </td>" +
                "    </tr>" +
                "  </table>" +
                "</td>" +
                "</tr>" +
                "<!-- FOOTER -->" +
                "<tr>" +
                "<td align=\"center\" style=\"padding:30px; background:#08080A; border-top:1px solid #27272A;\">" +
                "  <div style=\"font-size:12px; color:#52525B; line-height:1.8;\">" +
                "    <strong style=\"color:#E4E4E7;\">EventOS</strong><br>" +
                "    The Operating System for Event Businesses<br><br>" +
                "    Built for creators. Designed for unforgettable events.<br><br>" +
                "    © 2026 EventOS" +
                "  </div>" +
                "</td>" +
                "</tr>" +
                "</table>" +
                "</td>" +
                "</tr>" +
                "</table>" +
                "</body>" +
                "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[EMAIL_SENT] Welcome email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("[EMAIL_ERROR] Failed to send welcome email to: {} — {}", toEmail, e.getMessage());
        }
    }
}
