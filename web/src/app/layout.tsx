import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import Providers from "./providers";
import ToastContainer from "@/components/ToastContainer";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});


export const metadata: Metadata = {
  title: "EventOS | The Operating System for Event Businesses",
  description: "Centralize your leads, events, quotes, and invoice payments on the premium operating system designed specifically for event agencies, planners, and coordinators.",
  keywords: [
    "event management saas",
    "event planner CRM",
    "wedding planners dashboard",
    "event coordinator software",
    "multi-tenant event app",
    "client portal event billing"
  ],
  authors: [{ name: "EventOS Team" }],
  metadataBase: new URL("https://eventos.io"),
  openGraph: {
    title: "EventOS | The Operating System for Event Businesses",
    description: "Centralize client proposals, contracts, timelines, payments, and high-res media galleries in one premium, secure tenant workspace.",
    url: "https://eventos.io",
    siteName: "EventOS",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "EventOS Command Center Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EventOS | The Operating System for Event Businesses",
    description: "Manage client contracts, invoices, timelines, and galleries within a modern, unified SaaS platform.",
    images: ["/og-image.jpg"],
    creator: "@eventos_hq",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value || "dark";

  // Structured Data (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "EventOS",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "All",
    "description": "Multi-tenant Event Management SaaS operating system featuring client portals, invoicing, task workflows, and photo galleries.",
    "offers": {
      "@type": "Offer",
      "price": "49.00",
      "priceCurrency": "USD"
    }
  };

  return (
    <html lang="en" className={cn(theme, inter.variable, outfit.variable)}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
        <Providers>
          {children}
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
