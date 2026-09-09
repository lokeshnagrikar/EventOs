/**
 * EventOS WhatsApp Dispatch & Formatting Utilities
 * Supports direct wa.me deep links and official Meta WhatsApp Cloud API dispatch.
 */

export interface WhatsAppPayload {
  toPhone: string;
  templateType: "PROPOSAL_LINK" | "INVOICE_RECEIPT" | "RUN_OF_SHOW_ALERT" | "LEAD_CONFIRMATION";
  variables: {
    clientName?: string;
    agencyName?: string;
    eventTitle?: string;
    quoteNumber?: string;
    amount?: string;
    dueDate?: string;
    portalUrl?: string;
    cueTime?: string;
    stageLocation?: string;
  };
}

/**
 * Format message body text based on event context
 */
export function formatWhatsAppMessage(payload: WhatsAppPayload): string {
  const { templateType, variables } = payload;
  const agency = variables.agencyName || "EventOS Agency";
  const client = variables.clientName || "Valued Client";

  switch (templateType) {
    case "PROPOSAL_LINK":
      return (
        `✨ *Hello ${client}!*\n\n` +
        `Your personalized digital event proposal for *${variables.eventTitle || "Upcoming Event"}* is ready for your review.\n\n` +
        `📄 *Quote Ref:* ${variables.quoteNumber || "N/A"}\n` +
        `💰 *Estimated Total:* ${variables.amount || "N/A"}\n\n` +
        `🔗 *Review & Approve Online:*\n${variables.portalUrl || ""}\n\n` +
        `_Warm regards,_\n*${agency} Team*`
      );

    case "INVOICE_RECEIPT":
      return (
        `🧾 *Payment Confirmation — ${agency}*\n\n` +
        `Dear *${client}*,\n` +
        `We have successfully received your payment of *${variables.amount}* for *${variables.eventTitle}*.\n\n` +
        `View your updated payment receipt and download tax invoice:\n` +
        `🔗 ${variables.portalUrl || ""}\n\n` +
        `Thank you for trusting us with your celebration!`
      );

    case "RUN_OF_SHOW_ALERT":
      return (
        `⏱️ *RUN-OF-SHOW STAGE CUE ALERT*\n\n` +
        `📍 *Location:* ${variables.stageLocation || "Main Ballroom"}\n` +
        `⏰ *Cue Time:* ${variables.cueTime || "Immediate"}\n` +
        `📌 *Sequence:* ${variables.eventTitle || "Scheduled Task"}\n\n` +
        `Please report to your designated station and confirm readiness over comms.`
      );

    case "LEAD_CONFIRMATION":
    default:
      return (
        `🎉 *Greetings from ${agency}!* \n\n` +
        `Thank you for reaching out to us, *${client}*. We have registered your event inquiry for *${variables.eventTitle || "your celebration"}*.\n\n` +
        `Our senior planner will connect with you within 2 hours to walk through your requirements and custom package options.\n\n` +
        `Have a wonderful day!`
      );
  }
}

/**
 * Generate a 1-click WhatsApp deep link (works on both mobile & WhatsApp Web)
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  // Strip all non-digit characters except leading plus
  let cleanPhone = phone.replace(/[^0-9]/g, "");
  // If no country code and 10 digits, assume India (+91)
  if (cleanPhone.length === 10) {
    cleanPhone = "91" + cleanPhone;
  }
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Dispatch message via Meta WhatsApp Cloud API directly
 */
export async function sendMetaWhatsAppMessage(
  metaConfig: { phoneNumberId: string; accessToken: string },
  toPhone: string,
  messageText: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  let cleanPhone = toPhone.replace(/[^0-9]/g, "");
  if (cleanPhone.length === 10) {
    cleanPhone = "91" + cleanPhone;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${metaConfig.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${metaConfig.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: { preview_url: true, body: messageText },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data?.error?.message || "Failed to send message via Meta Cloud API",
      };
    }

    return {
      success: true,
      messageId: data?.messages?.[0]?.id,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
