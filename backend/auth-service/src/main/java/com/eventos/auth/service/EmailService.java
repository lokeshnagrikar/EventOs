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

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendVerificationEmail(String toEmail, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromAddress);
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
    public void sendPasswordResetEmail(String toEmail, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Reset your EventOS Password");
            
            String resetUrl = "http://localhost:3500/reset-password?token=" + token; // using port or dev URL
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
