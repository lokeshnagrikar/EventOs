package com.eventos.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@SuppressWarnings("null")
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:support@eventosapp.in}")
    private String fromAddress;

    @Value("${app.mail.admin:${FOUNDER_ALERT_EMAIL:devloperonly@gmail.com}}")
    private String adminAlertEmail;

    @Value("${app.frontend-url:https://eventosapp.in}")
    private String frontendUrl;

    // CDN 3D Emoji Assets (Microsoft Fluent 3D rendered, universally supported by Gmail & Apple Mail)
    private static final String ICON_LOCK = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Locked.png";
    private static final String ICON_HANDSHAKE = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People/Handshake.png";
    private static final String ICON_SHIELD = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Shield.png";
    private static final String ICON_PARTY = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Party%20Popper.png";
    private static final String ICON_ROCKET = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Rocket.png";
    private static final String ICON_CROWN = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Crown.png";
    private static final String ICON_CHECK = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/Check%20Mark%20Button.png";
    private static final String ICON_FIRE = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Fire.png";
    private static final String LOGO_URL = "https://www.eventosapp.in/icon-192.png";

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    private String getSenderEmail() {
        return (fromAddress != null && !fromAddress.trim().isEmpty()) ? fromAddress : "support@eventosapp.in";
    }

    /* ========================================================================== */
    /* SHARED STYLES & LUXURY BASE SHELL (Stripe / Linear Dark-Mode Aesthetic)    */
    /* ========================================================================== */
    private String wrapInLuxuryShell(String title, String badgeText, String badgeTextColor, 
                                     String heroGradient, String heroIconUrl, String contentBody, String contextFooterNote) {
        return "<!DOCTYPE html>" +
                "<html lang=\"en\" xmlns=\"http://www.w3.org/1999/xhtml\">" +
                "<head>" +
                "  <meta charset=\"UTF-8\">" +
                "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                "  <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">" +
                "  <title>" + title + "</title>" +
                "</head>" +
                "<body style=\"margin:0; padding:32px 12px; background-color:#070709; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; color:#E4E4E7;\">" +
                "  <table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">" +
                "    <tr>" +
                "      <td align=\"center\">" +
                "        <!-- MAIN WRAPPER CARD -->" +
                "        <table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:560px; background-color:#0F1015; border:1px solid #27272E; border-radius:24px; overflow:hidden; box-shadow:0 25px 50px -12px rgba(0,0,0,0.6);\">" +
                "          " +
                "          <!-- TOP BRAND LOGO BAR -->" +
                "          <tr>" +
                "            <td style=\"padding:24px 32px; background-color:#090A0D; border-bottom:1px solid #1C1D24;\">" +
                "              <table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">" +
                "                <tr>" +
                "                  <td align=\"left\" style=\"vertical-align:middle;\">" +
                "                    <table border=\"0\" cellspacing=\"0\" cellpadding=\"0\">" +
                "                      <tr>" +
                "                        <td style=\"vertical-align:middle; padding-right:10px;\">" +
                "                          <img src=\"" + LOGO_URL + "\" width=\"30\" height=\"30\" alt=\"EventOS Logo\" style=\"display:block; border-radius:8px; border:1px solid #3F3F46;\" />" +
                "                        </td>" +
                "                        <td style=\"vertical-align:middle;\">" +
                "                          <span style=\"font-size:16px; font-weight:900; letter-spacing:-0.5px; color:#FFFFFF;\">Event<span style=\"color:#A855F7;\">OS</span></span>" +
                "                        </td>" +
                "                      </tr>" +
                "                    </table>" +
                "                  </td>" +
                "                  <td align=\"right\" style=\"vertical-align:middle;\">" +
                "                    <span style=\"display:inline-block; padding:4px 10px; border-radius:999px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); font-size:10px; font-weight:700; color:" + badgeTextColor + "; text-transform:uppercase; letter-spacing:1px;\">" + badgeText + "</span>" +
                "                  </td>" +
                "                </tr>" +
                "              </table>" +
                "            </td>" +
                "          </tr>" +
                "          " +
                "          <!-- HERO BANNER -->" +
                "          <tr>" +
                "            <td align=\"center\" style=\"padding:36px 32px 30px; background:" + heroGradient + "; text-align:center;\">" +
                "              <img src=\"" + heroIconUrl + "\" width=\"84\" height=\"84\" alt=\"Icon\" style=\"display:block; margin:0 auto 14px; filter:drop-shadow(0 12px 24px rgba(0,0,0,0.45));\" />" +
                "              <h1 style=\"margin:0; font-size:24px; font-weight:900; letter-spacing:-0.5px; color:#FFFFFF; line-height:1.25;\">" + title + "</h1>" +
                "            </td>" +
                "          </tr>" +
                "          " +
                "          <!-- MAIN BODY CONTENT -->" +
                "          <tr>" +
                "            <td style=\"padding:36px 32px; background-color:#0F1015;\">" +
                contentBody +
                "            </td>" +
                "          </tr>" +
                "          " +
                "          <!-- FOOTER -->" +
                "          <tr>" +
                "            <td style=\"padding:24px 32px; background-color:#08090C; border-top:1px solid #1C1D24; text-align:center;\">" +
                "              <p style=\"margin:0 0 10px; font-size:11px; font-weight:600; color:#71717A; line-height:1.6;\">" +
                (contextFooterNote != null && !contextFooterNote.isEmpty() ? contextFooterNote + "<br/>" : "") +
                "                EventOS Technologies • All-in-One Operations Platform for Event Agencies" +
                "              </p>" +
                "              <p style=\"margin:0 0 12px; font-size:10px; color:#52525B;\">" +
                "                SAI Colony, Ward No. 6, Deori, Gondia, Maharashtra - 441901, India" +
                "              </p>" +
                "              <table border=\"0\" cellspacing=\"0\" cellpadding=\"0\" align=\"center\">" +
                "                <tr>" +
                "                  <td style=\"padding:0 8px;\"><a href=\"https://www.eventosapp.in\" style=\"color:#A855F7; font-size:11px; text-decoration:none; font-weight:600;\">Website</a></td>" +
                "                  <td style=\"color:#3F3F46; font-size:10px;\">•</td>" +
                "                  <td style=\"padding:0 8px;\"><a href=\"https://www.eventosapp.in/terms\" style=\"color:#A1A1AA; font-size:11px; text-decoration:none;\">Terms</a></td>" +
                "                  <td style=\"color:#3F3F46; font-size:10px;\">•</td>" +
                "                  <td style=\"padding:0 8px;\"><a href=\"https://www.eventosapp.in/privacy\" style=\"color:#A1A1AA; font-size:11px; text-decoration:none;\">Privacy</a></td>" +
                "                  <td style=\"color:#3F3F46; font-size:10px;\">•</td>" +
                "                  <td style=\"padding:0 8px;\"><a href=\"https://www.eventosapp.in/security\" style=\"color:#A1A1AA; font-size:11px; text-decoration:none;\">Security</a></td>" +
                "                </tr>" +
                "              </table>" +
                "            </td>" +
                "          </tr>" +
                "        </table>" +
                "      </td>" +
                "    </tr>" +
                "  </table>" +
                "</body>" +
                "</html>";
    }

    /* -------------------------------------------------------------------------- */
    /* 1. VERIFICATION OTP EMAIL (3D Glowing Security Lock)                       */
    /* -------------------------------------------------------------------------- */
    @Async
    public void sendVerificationEmail(String toEmail, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(getSenderEmail(), "EventOS Security");
            helper.setTo(toEmail);
            helper.setSubject("🔒 Your EventOS Security Verification Code: " + token);

            String body = "<p style=\"margin:0 0 20px; font-size:14px; line-height:1.7; color:#A1A1AA; text-align:center;\">" +
                    "  Please use the 6-digit one-time security code below to verify your email address and activate your workspace." +
                    "</p>" +
                    "<!-- CODE BOX -->" +
                    "<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin:24px 0 28px;\">" +
                    "  <tr>" +
                    "    <td align=\"center\">" +
                    "      <div style=\"display:inline-block; padding:18px 36px; background:#14121E; border:1px solid #581C87; border-radius:18px; box-shadow:0 0 30px rgba(168,85,247,0.15);\">" +
                    "        <span style=\"font-size:38px; font-weight:900; letter-spacing:10px; color:#C084FC; font-family:'SF Mono',Consolas,Menlo,monospace;\">" + token + "</span>" +
                    "      </div>" +
                    "    </td>" +
                    "  </tr>" +
                    "</table>" +
                    "<!-- NOTICE CALLOUT -->" +
                    "<div style=\"padding:14px 18px; background:#12131A; border:1px solid #27272A; border-radius:14px; margin-bottom:18px;\">" +
                    "  <table border=\"0\" cellspacing=\"0\" cellpadding=\"0\" width=\"100%\">" +
                    "    <tr>" +
                    "      <td width=\"24\" style=\"vertical-align:top; font-size:14px;\">⏱️</td>" +
                    "      <td style=\"font-size:12px; line-height:1.6; color:#9CA3AF;\">" +
                    "        This verification code is strictly valid for <strong style=\"color:#FFFFFF;\">15 minutes</strong>. If you did not request this verification, please safely disregard this email." +
                    "      </td>" +
                    "    </tr>" +
                    "  </table>" +
                    "</div>" +
                    "<p style=\"margin:0; font-size:11px; color:#52525B; text-align:center;\">" +
                    "  Security tip: EventOS engineers will never ask for your verification code." +
                    "</p>";

            String htmlContent = wrapInLuxuryShell(
                    "Verify Your Email Address",
                    "Security Verification",
                    "#E9D5FF",
                    "linear-gradient(135deg, #4C1D95 0%, #7E22CE 50%, #A21CAF 100%)",
                    ICON_LOCK,
                    body,
                    "Sent to " + toEmail + " for account authentication"
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[EMAIL_SENT] Verification OTP email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("[EMAIL_ERROR] Failed to send verification email to: {}", toEmail, e);
        }
    }

    /* -------------------------------------------------------------------------- */
    /* 2. TEAM INVITATION EMAIL (3D Handshake Illustration)                       */
    /* -------------------------------------------------------------------------- */
    @Async
    public void sendInvitationEmail(String toEmail, String inviteToken, String inviteeName, String senderName,
                                    String roleName, String workspaceName, String frontendBaseUrl) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(getSenderEmail(), "EventOS Workspaces");
            helper.setTo(toEmail);
            helper.setSubject("🤝 You're invited to join EventOS — " + (senderName != null ? senderName : "A Team") + " wants you aboard");

            String acceptUrl = (frontendBaseUrl != null ? frontendBaseUrl : frontendUrl) + "/accept-invite?token=" + inviteToken;
            String displayName = (inviteeName != null && !inviteeName.trim().isEmpty()) ? inviteeName : toEmail.split("@")[0];
            String roleDisplay = roleName != null
                    ? roleName.substring(0, 1).toUpperCase() + roleName.substring(1).toLowerCase()
                    : "Team Member";
            String inviterDisplay = (senderName != null && !senderName.trim().isEmpty()) ? senderName : "Your Administrator";
            String workspaceDisplay = (workspaceName != null && !workspaceName.trim().isEmpty()) ? workspaceName : "Your Agency Workspace";

            String body = "<p style=\"margin:0 0 16px; font-size:15px; color:#F4F4F5; font-weight:700;\">" +
                    "  Hi " + displayName + " 👋" +
                    "</p>" +
                    "<p style=\"margin:0 0 24px; font-size:14px; line-height:1.75; color:#A1A1AA;\">" +
                    "  <strong style=\"color:#FFFFFF;\">" + inviterDisplay + "</strong> has officially invited you to collaborate in " +
                    "  <strong style=\"color:#C084FC;\">" + workspaceDisplay + "</strong> as " +
                    "  <strong style=\"color:#F472B6;\">" + roleDisplay + "</strong>." +
                    "</p>" +
                    "<!-- WORKSPACE INFO CARD -->" +
                    "<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin-bottom:28px; background:#12131A; border:1px solid #27272A; border-radius:16px; padding:18px;\">" +
                    "  <tr><td>" +
                    "    <table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"6\">" +
                    "      <tr>" +
                    "        <td style=\"font-size:12px; color:#71717A;\">Workspace:</td>" +
                    "        <td align=\"right\" style=\"font-size:13px; font-weight:700; color:#FFFFFF;\">" + workspaceDisplay + "</td>" +
                    "      </tr>" +
                    "      <tr>" +
                    "        <td style=\"font-size:12px; color:#71717A;\">Assigned Role:</td>" +
                    "        <td align=\"right\" style=\"font-size:13px; font-weight:700; color:#C084FC;\">" + roleDisplay + "</td>" +
                    "      </tr>" +
                    "      <tr>" +
                    "        <td style=\"font-size:12px; color:#71717A;\">Invited By:</td>" +
                    "        <td align=\"right\" style=\"font-size:13px; font-weight:700; color:#F472B6;\">" + inviterDisplay + "</td>" +
                    "      </tr>" +
                    "    </table>" +
                    "  </td></tr>" +
                    "</table>" +
                    "<!-- CTA BUTTON -->" +
                    "<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin:28px 0;\">" +
                    "  <tr><td align=\"center\">" +
                    "    <a href=\"" + acceptUrl + "\" style=\"display:inline-block; padding:16px 42px; border-radius:14px; background:linear-gradient(135deg, #7C3AED 0%, #DB2777 100%); color:#FFFFFF; font-size:14px; font-weight:800; text-decoration:none; box-shadow:0 8px 24px rgba(124,58,237,0.4);\">" +
                    "      🚀 Accept Invitation & Join" +
                    "    </a>" +
                    "  </td></tr>" +
                    "</table>" +
                    "<p style=\"margin:0; font-size:11px; color:#71717A; text-align:center;\">" +
                    "  This secure invite link is single-use and expires in 48 hours." +
                    "</p>";

            String htmlContent = wrapInLuxuryShell(
                    "You're Invited to EventOS",
                    "Team Invitation",
                    "#FBCFE8",
                    "linear-gradient(135deg, #6D28D9 0%, #BE185D 50%, #1D4ED8 100%)",
                    ICON_HANDSHAKE,
                    body,
                    "Invitation dispatched by " + inviterDisplay
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[EMAIL_SENT] Invitation email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("[EMAIL_ERROR] Failed to send invitation email to: {}", toEmail, e);
        }
    }

    /* -------------------------------------------------------------------------- */
    /* 3. PASSWORD RESET EMAIL (3D Holographic Security Shield)                   */
    /* -------------------------------------------------------------------------- */
    @Async
    public void sendPasswordResetEmail(String toEmail, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(getSenderEmail(), "EventOS Security");
            helper.setTo(toEmail);
            helper.setSubject("🛡️ Reset Your EventOS Password");

            String resetUrl = frontendUrl + "/reset-password?token=" + token;

            String body = "<p style=\"margin:0 0 20px; font-size:14px; line-height:1.75; color:#A1A1AA;\">" +
                    "  We received an authenticated request to reset the password for your EventOS account. Click the button below to establish a new secure password." +
                    "</p>" +
                    "<!-- CTA BUTTON -->" +
                    "<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin:26px 0;\">" +
                    "  <tr><td align=\"center\">" +
                    "    <a href=\"" + resetUrl + "\" style=\"display:inline-block; padding:16px 42px; border-radius:14px; background:linear-gradient(135deg, #DC2626 0%, #D97706 100%); color:#FFFFFF; font-size:14px; font-weight:800; text-decoration:none; box-shadow:0 8px 24px rgba(220,38,38,0.35);\">" +
                    "      🔑 Reset My Password" +
                    "    </a>" +
                    "  </td></tr>" +
                    "</table>" +
                    "<!-- MANUAL TOKEN BOX -->" +
                    "<div style=\"padding:16px 20px; background:#12131A; border:1px solid #27272A; border-radius:14px; margin-bottom:24px;\">" +
                    "  <div style=\"font-size:10px; font-weight:800; color:#9CA3AF; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;\">" +
                    "    Manual Reset Token:" +
                    "  </div>" +
                    "  <div style=\"font-family:'SF Mono',Consolas,Menlo,monospace; font-size:12px; color:#C084FC; word-break:break-all; background:#08090C; padding:10px 14px; border-radius:8px; border:1px solid #3F3F46;\">" +
                    token +
                    "  </div>" +
                    "</div>" +
                    "<p style=\"margin:0; font-size:11px; line-height:1.6; color:#71717A; text-align:center;\">" +
                    "  This recovery link will expire in <strong style=\"color:#FFFFFF;\">30 minutes</strong>.<br/>" +
                    "  If you didn't request this change, you can safely ignore this message — your account is safe." +
                    "</p>";

            String htmlContent = wrapInLuxuryShell(
                    "Reset Password Request",
                    "Password Recovery",
                    "#FDE68A",
                    "linear-gradient(135deg, #991B1B 0%, #B45309 50%, #D97706 100%)",
                    ICON_SHIELD,
                    body,
                    "Requested from IP security context for " + toEmail
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[EMAIL_SENT] Password reset email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("[EMAIL_ERROR] Failed to send password reset email to: {}", toEmail, e);
        }
    }

    /* -------------------------------------------------------------------------- */
    /* 4. WELCOME EMAIL (3D Party Popper & Celebration)                           */
    /* -------------------------------------------------------------------------- */
    @Async
    public void sendWelcomeEmail(String toEmail, String inviteeName, String workspaceName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(getSenderEmail(), "EventOS");
            helper.setTo(toEmail);
            helper.setSubject("🎉 Welcome to EventOS — Account Activated!");

            String displayName = (inviteeName != null && !inviteeName.trim().isEmpty()) ? inviteeName : toEmail.split("@")[0];
            String workspaceDisplay = (workspaceName != null && !workspaceName.trim().isEmpty()) ? workspaceName : "Your Agency Workspace";
            String consoleUrl = frontendUrl + "/dashboard";

            String body = "<p style=\"margin:0 0 16px; font-size:15px; color:#F4F4F5; font-weight:700;\">" +
                    "  Hi " + displayName + " 👋" +
                    "</p>" +
                    "<p style=\"margin:0 0 24px; font-size:14px; line-height:1.75; color:#A1A1AA;\">" +
                    "  Your EventOS workspace <strong style=\"color:#34D399;\">" + workspaceDisplay + "</strong> is now officially provisioned and ready for your events." +
                    "</p>" +
                    "<!-- FEATURE GRID -->" +
                    "<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin-bottom:28px;\">" +
                    "  <tr>" +
                    "    <td style=\"padding:14px 16px; background:#12131A; border:1px solid #27272A; border-radius:14px; margin-bottom:10px;\">" +
                    "      <div style=\"font-size:13px; font-weight:700; color:#FFFFFF; margin-bottom:4px;\">⚡ Automated Quotes & Invoicing</div>" +
                    "      <div style=\"font-size:12px; color:#9CA3AF;\">Generate GST-compliant proposals with instant PDF exports in seconds.</div>" +
                    "    </td>" +
                    "  </tr>" +
                    "  <tr><td height=\"10\"></td></tr>" +
                    "  <tr>" +
                    "    <td style=\"padding:14px 16px; background:#12131A; border:1px solid #27272A; border-radius:14px;\">" +
                    "      <div style=\"font-size:13px; font-weight:700; color:#FFFFFF; margin-bottom:4px;\">📅 Real-Time Run-of-Show Timelines</div>" +
                    "      <div style=\"font-size:12px; color:#9CA3AF;\">Coordinate vendors, emcees, and staging staff with live cue-sheet syncing.</div>" +
                    "    </td>" +
                    "  </tr>" +
                    "</table>" +
                    "<!-- CTA -->" +
                    "<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin:28px 0;\">" +
                    "  <tr><td align=\"center\">" +
                    "    <a href=\"" + consoleUrl + "\" style=\"display:inline-block; padding:16px 42px; border-radius:14px; background:linear-gradient(135deg, #059669 0%, #2563EB 100%); color:#FFFFFF; font-size:14px; font-weight:800; text-decoration:none; box-shadow:0 8px 24px rgba(5,150,105,0.35);\">" +
                    "      🚀 Launch Workspace Console" +
                    "    </a>" +
                    "  </td></tr>" +
                    "</table>";

            String htmlContent = wrapInLuxuryShell(
                    "Welcome to EventOS!",
                    "Account Activated",
                    "#A7F3D0",
                    "linear-gradient(135deg, #065F46 0%, #0D9488 50%, #2563EB 100%)",
                    ICON_PARTY,
                    body,
                    "Provisioned for " + toEmail
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[EMAIL_SENT] Welcome email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("[EMAIL_ERROR] Failed to send welcome email to: {}", toEmail, e);
        }
    }

    /* -------------------------------------------------------------------------- */
    /* 5. 1-CLICK MAGIC LINK EMAIL (3D Rocket Launching)                          */
    /* -------------------------------------------------------------------------- */
    @Async
    public void sendMagicLinkEmail(String toEmail, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(getSenderEmail(), "EventOS Authentication");
            helper.setTo(toEmail);
            helper.setSubject("⚡ 1-Click Magic Link — Sign In to EventOS");

            String loginUrl = frontendUrl + "/login?magicToken=" + token;

            String body = "<p style=\"margin:0 0 20px; font-size:14px; line-height:1.75; color:#A1A1AA; text-align:center;\">" +
                    "  Click the button below to sign in instantly to your EventOS dashboard without entering your password." +
                    "</p>" +
                    "<!-- CTA BUTTON -->" +
                    "<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin:26px 0;\">" +
                    "  <tr><td align=\"center\">" +
                    "    <a href=\"" + loginUrl + "\" style=\"display:inline-block; padding:16px 42px; border-radius:14px; background:linear-gradient(135deg, #7C3AED 0%, #DB2777 100%); color:#FFFFFF; font-size:14px; font-weight:800; text-decoration:none; box-shadow:0 8px 24px rgba(124,58,237,0.4);\">" +
                    "      ⚡ Sign In to EventOS" +
                    "    </a>" +
                    "  </td></tr>" +
                    "</table>" +
                    "<div style=\"padding:14px 18px; background:#12131A; border:1px solid #27272A; border-radius:14px; margin-bottom:16px;\">" +
                    "  <div style=\"font-size:11px; color:#9CA3AF; line-height:1.6;\">" +
                    "    ⏱️ This magic link is valid for <strong style=\"color:#FFFFFF;\">15 minutes</strong> and will expire once used." +
                    "  </div>" +
                    "</div>";

            String htmlContent = wrapInLuxuryShell(
                    "1-Click Instant Sign In",
                    "Passwordless Auth",
                    "#F472B6",
                    "linear-gradient(135deg, #581C87 0%, #9D174D 50%, #4338CA 100%)",
                    ICON_ROCKET,
                    body,
                    "Requested for " + toEmail
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[EMAIL_SENT] Magic Link email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("[EMAIL_ERROR] Failed to send Magic Link email to: {}", toEmail, e);
        }
    }

    /* -------------------------------------------------------------------------- */
    /* 6. SUBSCRIPTION PLAN CONFIRMATION EMAIL (3D Golden Crown Trophy)           */
    /* -------------------------------------------------------------------------- */
    @Async
    public void sendSubscriptionReceiptEmail(String toEmail, String ownerName, String planName, String amount,
                                            String currency, String invoiceNum, String pdfUrl) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(getSenderEmail(), "EventOS Billing");
            helper.setTo(toEmail);
            helper.setSubject("👑 Subscription Confirmed — " + planName + " Plan Active for EventOS");

            String displayName = (ownerName != null && !ownerName.trim().isEmpty()) ? ownerName : "Agency Founder";
            String invoiceRef = (invoiceNum != null && !invoiceNum.trim().isEmpty()) ? invoiceNum : "INV-" + System.currentTimeMillis();
            String downloadUrl = (pdfUrl != null && !pdfUrl.trim().isEmpty()) ? pdfUrl : frontendUrl + "/settings/billing";

            String body = "<p style=\"margin:0 0 16px; font-size:15px; color:#F4F4F5; font-weight:700;\">" +
                    "  Hi " + displayName + " 👋" +
                    "</p>" +
                    "<p style=\"margin:0 0 24px; font-size:14px; line-height:1.75; color:#A1A1AA;\">" +
                    "  Thank you for subscribing to <strong style=\"color:#FBBF24;\">EventOS " + planName + "</strong>! Your payment has been processed successfully and your tier quotas are now fully unlocked." +
                    "</p>" +
                    "<!-- STRIPE-STYLE INVOICE BREAKDOWN TABLE -->" +
                    "<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin-bottom:28px; background:#12131A; border:1px solid #27272A; border-radius:18px; overflow:hidden;\">" +
                    "  <tr>" +
                    "    <td style=\"padding:16px 20px; background:#181822; border-bottom:1px solid #27272A;\">" +
                    "      <table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">" +
                    "        <tr>" +
                    "          <td style=\"font-size:11px; font-weight:800; color:#FBBF24; text-transform:uppercase; letter-spacing:1px;\">INVOICE RECEIPT</td>" +
                    "          <td align=\"right\" style=\"font-size:11px; font-weight:700; color:#34D399;\">PAID ✔️</td>" +
                    "        </tr>" +
                    "      </table>" +
                    "    </td>" +
                    "  </tr>" +
                    "  <tr>" +
                    "    <td style=\"padding:20px;\">" +
                    "      <table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"8\">" +
                    "        <tr>" +
                    "          <td style=\"font-size:13px; color:#9CA3AF;\">Subscription Tier:</td>" +
                    "          <td align=\"right\" style=\"font-size:13px; font-weight:700; color:#FFFFFF;\">" + planName + "</td>" +
                    "        </tr>" +
                    "        <tr>" +
                    "          <td style=\"font-size:13px; color:#9CA3AF;\">Invoice Number:</td>" +
                    "          <td align=\"right\" style=\"font-size:13px; font-family:'SF Mono',Consolas,Menlo,monospace; color:#E4E4E7;\">" + invoiceRef + "</td>" +
                    "        </tr>" +
                    "        <tr>" +
                    "          <td style=\"font-size:13px; color:#9CA3AF;\">Payment Gateway:</td>" +
                    "          <td align=\"right\" style=\"font-size:13px; font-weight:700; color:#A78BFA;\">Razorpay & Stripe Verified</td>" +
                    "        </tr>" +
                    "        <tr style=\"border-top:1px solid #27272A;\">" +
                    "          <td style=\"font-size:14px; font-weight:700; color:#FFFFFF; padding-top:12px;\">Amount Paid:</td>" +
                    "          <td align=\"right\" style=\"font-size:16px; font-weight:900; color:#FBBF24; padding-top:12px;\">" + currency + " " + amount + "</td>" +
                    "        </tr>" +
                    "      </table>" +
                    "    </td>" +
                    "  </tr>" +
                    "</table>" +
                    "<!-- CTA -->" +
                    "<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin:28px 0;\">" +
                    "  <tr><td align=\"center\">" +
                    "    <a href=\"" + downloadUrl + "\" style=\"display:inline-block; padding:16px 42px; border-radius:14px; background:linear-gradient(135deg, #D97706 0%, #7C3AED 100%); color:#FFFFFF; font-size:14px; font-weight:800; text-decoration:none; box-shadow:0 8px 24px rgba(217,119,6,0.35);\">" +
                    "      📄 Download Tax Invoice & Manage Billing" +
                    "    </a>" +
                    "  </td></tr>" +
                    "</table>";

            String htmlContent = wrapInLuxuryShell(
                    planName + " Plan Active",
                    "Payment Confirmed",
                    "#FDE68A",
                    "linear-gradient(135deg, #78350F 0%, #B45309 50%, #6D28D9 100%)",
                    ICON_CROWN,
                    body,
                    "Tax Invoice Ref: " + invoiceRef
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[EMAIL_SENT] Subscription confirmation email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("[EMAIL_ERROR] Failed to send subscription receipt email to: {}", toEmail, e);
        }
    }

    /* -------------------------------------------------------------------------- */
    /* 7. SMTP DIAGNOSTIC EMAIL (3D Checkmark Health Indicator)                   */
    /* -------------------------------------------------------------------------- */
    public void sendTestEmail(String toEmail) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(getSenderEmail(), "EventOS Diagnostic");
            helper.setTo(toEmail);
            helper.setSubject("✅ EventOS SMTP Diagnostic — Email Delivery Verified!");

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) + " IST";

            String body = "<p style=\"margin:0 0 20px; font-size:14px; line-height:1.75; color:#A1A1AA;\">" +
                    "  This diagnostic confirms that your EventOS mail sender subsystem, Resend API routing, and SPF/DKIM validation contexts are <strong style=\"color:#34D399;\">100% operational</strong>." +
                    "</p>" +
                    "<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin-bottom:24px; background:#12131A; border:1px solid #27272A; border-radius:16px; padding:18px;\">" +
                    "  <tr><td>" +
                    "    <table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"6\">" +
                    "      <tr><td style=\"font-size:12px; color:#71717A;\">Delivery Target:</td><td align=\"right\" style=\"font-size:13px; font-weight:700; color:#FFFFFF;\">" + toEmail + "</td></tr>" +
                    "      <tr><td style=\"font-size:12px; color:#71717A;\">Timestamp:</td><td align=\"right\" style=\"font-size:12px; color:#A1A1AA; font-family:monospace;\">" + timestamp + "</td></tr>" +
                    "      <tr><td style=\"font-size:12px; color:#71717A;\">Status:</td><td align=\"right\" style=\"font-size:12px; font-weight:800; color:#34D399;\">HEALTHY ✔️</td></tr>" +
                    "    </table>" +
                    "  </td></tr>" +
                    "</table>";

            String htmlContent = wrapInLuxuryShell(
                    "Email Delivery Verified!",
                    "SMTP Health Check",
                    "#A7F3D0",
                    "linear-gradient(135deg, #065F46 0%, #047857 50%, #0E7490 100%)",
                    ICON_CHECK,
                    body,
                    "EventOS Diagnostic Pipeline"
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[TEST_EMAIL_SENT] Diagnostic test email successfully sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("[TEST_EMAIL_ERROR] SMTP diagnostic failed for: {}", toEmail, e);
            throw new RuntimeException("SMTP send failed: " + e.getMessage(), e);
        }
    }

    /* -------------------------------------------------------------------------- */
    /* 8. INBOUND INQUIRY NOTIFICATION TO FOUNDER (3D Fire & Lead Alert)          */
    /* -------------------------------------------------------------------------- */
    @Async
    public void sendInquiryNotificationToFounder(String name, String email, String teamSize, String messageText) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(getSenderEmail(), "EventOS Inquiries");
            helper.setTo(adminAlertEmail);
            helper.setSubject("🔥 New EventOS Inbound Lead: " + name + " (" + email + ")");

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy • hh:mm a")) + " IST";

            // Extract phone number from message if present for instant WhatsApp button
            String phoneFound = null;
            if (messageText != null) {
                Pattern phonePattern = Pattern.compile("(\\+?[0-9]{10,13})");
                Matcher matcher = phonePattern.matcher(messageText.replaceAll("[\\s-]", ""));
                if (matcher.find()) {
                    phoneFound = matcher.group(1).replace("+", "");
                }
            }

            String body = "<p style=\"margin:0 0 20px; font-size:14px; line-height:1.7; color:#A1A1AA;\">" +
                    "  A new client enquiry was just submitted through your EventOS platform portal." +
                    "</p>" +
                    "<!-- LEAD DETAILS TABLE -->" +
                    "<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin-bottom:24px; background:#12131A; border:1px solid #27272A; border-radius:16px; padding:18px;\">" +
                    "  <tr><td>" +
                    "    <table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"6\">" +
                    "      <tr><td style=\"font-size:12px; color:#71717A;\">Prospect Name:</td><td align=\"right\" style=\"font-size:14px; font-weight:800; color:#FFFFFF;\">" + (name != null ? name : "N/A") + "</td></tr>" +
                    "      <tr><td style=\"font-size:12px; color:#71717A;\">Contact Email:</td><td align=\"right\"><a href=\"mailto:" + email + "\" style=\"font-size:13px; font-weight:700; color:#38BDF8; text-decoration:none;\">" + email + "</a></td></tr>" +
                    "      <tr><td style=\"font-size:12px; color:#71717A;\">Sector / Scope:</td><td align=\"right\" style=\"font-size:13px; font-weight:700; color:#C084FC;\">" + (teamSize != null ? teamSize : "General Inquiry") + "</td></tr>" +
                    "      <tr><td style=\"font-size:12px; color:#71717A;\">Captured At:</td><td align=\"right\" style=\"font-size:12px; color:#9CA3AF;\">" + timestamp + "</td></tr>" +
                    "    </table>" +
                    "  </td></tr>" +
                    "</table>" +
                    "<!-- INQUIRY MESSAGE BOX -->" +
                    "<div style=\"padding:18px; background:#0B0C10; border:1px solid #27272A; border-left:4px solid #A855F7; border-radius:12px; margin-bottom:26px;\">" +
                    "  <div style=\"font-size:10px; font-weight:800; color:#71717A; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;\">Client Message:</div>" +
                    "  <div style=\"font-size:13px; line-height:1.7; color:#E4E4E7; white-space:pre-wrap;\">" + (messageText != null ? messageText : "") + "</div>" +
                    "</div>" +
                    "<!-- ACTION BUTTONS -->" +
                    "<table width=\"100%\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin:20px 0;\">" +
                    "  <tr>" +
                    "    <td align=\"center\">" +
                    "      <a href=\"mailto:" + email + "?subject=Re:%20EventOS%20Inquiry%20from%20" + name + "\" style=\"display:inline-block; margin:4px 6px; padding:12px 28px; border-radius:12px; background:linear-gradient(135deg, #7C3AED, #2563EB); color:#FFFFFF; font-size:13px; font-weight:800; text-decoration:none;\">" +
                    "        ✉️ Reply via Email" +
                    "      </a>" +
                    (phoneFound != null ?
                    "      <a href=\"https://wa.me/" + phoneFound + "\" style=\"display:inline-block; margin:4px 6px; padding:12px 28px; border-radius:12px; background:#10B981; color:#FFFFFF; font-size:13px; font-weight:800; text-decoration:none;\">" +
                    "        💬 Chat on WhatsApp" +
                    "      </a>" : "") +
                    "    </td>" +
                    "  </tr>" +
                    "</table>";

            String htmlContent = wrapInLuxuryShell(
                    "New Inbound Lead Received",
                    "Lead Capture",
                    "#FDE68A",
                    "linear-gradient(135deg, #991B1B 0%, #B45309 50%, #7C3AED 100%)",
                    ICON_FIRE,
                    body,
                    "Delivered to Founder Desk: " + adminAlertEmail
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[INQUIRY_ALERT_SENT] Dispatched inbound inquiry notification for: {}", email);
        } catch (Exception e) {
            log.warn("[INQUIRY_ALERT_WARN] Could not send inquiry alert email for {}: {}", email, e.getMessage());
        }
    }
}
