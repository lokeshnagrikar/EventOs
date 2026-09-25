/**
 * Razorpay Checkout SDK Loader & Modal Trigger
 * Integrates official Razorpay Checkout for Indian UPI (GPay, PhonePe, Paytm),
 * Debit/Credit Cards, and Netbanking payments in INR.
 */

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay Checkout script");
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export interface RazorpayPaymentOptions {
  orderId: string;
  amount: number; // in paise
  currency?: string;
  keyId?: string;
  planName: string;
  planCode: string;
  interval?: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  onSuccess: (paymentData: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onFailure?: (error: any) => void;
}

export async function openRazorpayCheckout(options: RazorpayPaymentOptions): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error("Unable to load Razorpay payment modal. Please check your internet connection.");
  }

  const key = options.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TgKHPSNur6OkpY";

  const rzpOptions = {
    key: key,
    amount: options.amount,
    currency: options.currency || "INR",
    name: "EventOS Business Suite",
    description: `${options.planName} Plan (${options.interval || "Monthly"})`,
    image: "https://www.eventosapp.in/icon.png",
    order_id: options.orderId,
    handler: function (response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) {
      options.onSuccess(response);
    },
    prefill: {
      name: options.userName || "",
      email: options.userEmail || "",
      contact: options.userPhone || "",
    },
    notes: {
      platform: "EventOS SaaS",
      planCode: options.planCode,
    },
    theme: {
      color: "#8B5CF6", // Signature EventOS Purple
      backdrop_color: "rgba(9, 9, 11, 0.85)",
    },
    modal: {
      ondismiss: function () {
        if (options.onFailure) {
          options.onFailure(new Error("Payment cancelled by user."));
        }
      },
    },
  };

  const razorpayInstance = new window.Razorpay(rzpOptions);
  razorpayInstance.on("payment.failed", function (response: any) {
    if (options.onFailure) {
      options.onFailure(response.error);
    }
  });
  razorpayInstance.open();
}
