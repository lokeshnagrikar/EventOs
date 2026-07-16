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
    public void sendInvitationEmail(String toEmail, String inviteToken, String inviteeName, String senderName, String roleName, String frontendBaseUrl) {
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

            String htmlContent =
                "<div style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; background-color: #0a0a0b; border-radius: 20px; overflow: hidden; border: 1px solid #27272a;\">" +

                // Header banner
                "  <div style=\"background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%); padding: 36px 32px; text-align: center;\">" +
                "    <div style=\"font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;\">Event<span style=\"opacity:0.75;\">OS</span></div>" +
                "    <div style=\"margin-top: 16px; width: 52px; height: 52px; background: rgba(255,255,255,0.15); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;\">" +
                "      <span style=\"font-size: 24px;\">📨</span>" +
                "    </div>" +
                "    <h1 style=\"color: #ffffff; font-size: 22px; font-weight: 800; margin: 12px 0 4px; letter-spacing: -0.5px;\">You're Invited!</h1>" +
                "    <p style=\"color: rgba(255,255,255,0.75); font-size: 13px; margin: 0;\">Join " + inviterDisplay + "'s workspace on EventOS</p>" +
                "  </div>" +

                // Body
                "  <div style=\"padding: 32px;\">" +
                "    <p style=\"color: #a1a1aa; font-size: 13px; line-height: 1.7; margin: 0 0 20px;\">Hi <strong style=\"color:#e4e4e7;\">" + displayName + "</strong>,</p>" +
                "    <p style=\"color: #a1a1aa; font-size: 13px; line-height: 1.7; margin: 0 0 24px;\">" +
                "      <strong style=\"color:#e4e4e7;\">" + inviterDisplay + "</strong> has invited you to join their team on <strong style=\"color:#e4e4e7;\">EventOS</strong> as a <strong style=\"color:#a78bfa;\">" + roleDisplay + "</strong>. " +
                "      Click the button below to set your password and activate your account." +
                "    </p>" +

                // Role Badge
                "    <div style=\"background: #18181b; border: 1px solid #3f3f46; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px; display: flex; align-items: center; gap: 12px;\">" +
                "      <div style=\"width: 36px; height: 36px; background: linear-gradient(135deg, #7c3aed, #db2777); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;\">" +
                "        <span style=\"font-size: 16px;\">🎯</span>" +
                "      </div>" +
                "      <div>" +
                "        <div style=\"color: #71717a; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;\">Your Role</div>" +
                "        <div style=\"color: #e4e4e7; font-size: 14px; font-weight: 700;\">" + roleDisplay + "</div>" +
                "      </div>" +
                "    </div>" +

                // CTA Button
                "    <div style=\"text-align: center; margin-bottom: 28px;\">" +
                "      <a href=\"" + acceptUrl + "\" style=\"display: inline-block; background: linear-gradient(135deg, #7c3aed, #db2777); color: #ffffff; font-size: 14px; font-weight: 800; padding: 14px 36px; border-radius: 12px; text-decoration: none; letter-spacing: -0.2px;\">Accept Invitation →</a>" +
                "    </div>" +

                // Expiry notice
                "    <div style=\"background: #18181b; border: 1px solid #27272a; border-radius: 10px; padding: 12px 16px; text-align: center; margin-bottom: 24px;\">" +
                "      <p style=\"color: #71717a; font-size: 11px; margin: 0;\">⏳ This invitation expires in <strong style=\"color:#a78bfa;\">48 hours</strong></p>" +
                "    </div>" +

                // Fallback URL
                "    <p style=\"color: #52525b; font-size: 11px; line-height: 1.6; margin: 0;\">Or copy this link into your browser:<br/>" +
                "      <span style=\"color: #7c3aed; word-break: break-all;\">" + acceptUrl + "</span>" +
                "    </p>" +
                "  </div>" +

                // Footer
                "  <div style=\"border-top: 1px solid #18181b; padding: 20px 32px; text-align: center;\">" +
                "    <p style=\"color: #3f3f46; font-size: 10px; margin: 0;\">EventOS · The Operating System for Event Businesses · If you didn't expect this email, please ignore it.</p>" +
                "  </div>" +
                "</div>";

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
}
