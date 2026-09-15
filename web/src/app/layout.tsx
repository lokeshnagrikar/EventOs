import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import Providers from "./providers";
import ToastContainer from "@/components/ToastContainer";
import { cn } from "@/lib/utils";
import { FloatingDock } from "@/components/landing/FloatingDock";
import { CookieConsentBanner } from "@/components/shared/CookieConsentBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B0F19" },
    { media: "(prefers-color-scheme: light)", color: "#FAF9F6" },
  ],
};

export const metadata: Metadata = {
  title: "EventOS | Event Management & Wedding Planner Software for Agencies",
  description: "EventOS is the all-in-one event management software and CRM built for Indian wedding planners and boutique event agencies. Manage leads, quotations, milestone payments, timelines, and client portals from one workspace.",
  keywords: [
    "event management software",
    "event management software India",
    "wedding planner software",
    "wedding management software",
    "event agency management software",
    "wedding agency CRM",
    "event planning CRM",
    "event management CRM India",
    "Indian wedding planning software",
    "client portal for event planners"
  ],
  authors: [{ name: "EventOS Team" }],
  metadataBase: new URL("https://eventos.io"),
  alternates: {
    canonical: "https://eventos.io",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "EventOS | Event Management & Wedding Planner Software for Agencies",
    description: "Centralize leads, proposals, milestone payments, event timelines, and client portals in one premium workspace designed for wedding planners and event agencies in India.",
    url: "https://eventos.io",
    siteName: "EventOS",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "EventOS Event Management & Wedding Planner Software",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EventOS | Event Management & Wedding Planner Software for Agencies",
    description: "Manage client contracts, invoices, timelines, and client portals within a unified SaaS platform built for event agencies.",
    images: ["/og-image.jpg"],
    creator: "@eventos_hq",
  },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
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
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": "https://eventos.io/#software",
        "name": "EventOS",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web, iOS, Android (PWA)",
        "description": "Event management software and CRM for Indian wedding planners and event agencies. Manages lead pipelines, proposal generation, milestone payments, timelines, and client portals.",
        "offers": {
          "@type": "AggregateOffer",
          "priceCurrency": "INR",
          "lowPrice": "1599.00",
          "highPrice": "9999.00",
          "offerCount": "3"
        }
      },
      {
        "@type": "Organization",
        "@id": "https://eventos.io/#organization",
        "name": "EventOS",
        "url": "https://eventos.io",
        "logo": "https://eventos.io/logo/logo.png",
        "founder": {
          "@type": "Person",
          "name": "Lokesh Nagrikar"
        },
        "sameAs": [
          "https://www.instagram.com/solo.founder.ai/"
        ]
      }
    ]
  };

  return (
    <html lang="en" className={cn(theme, inter.variable, plusJakartaSans.variable)}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EventOS" />
        <link rel="apple-touch-icon" href="data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%238B5CF6%22/><text y=%220.8em%22 x=%220.1em%22 font-size=%2260%22 fill=%22white%22 font-family=%22sans-serif%22 font-weight=%22bold%22>OS</text></svg>" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${plusJakartaSans.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          Skip to main content
        </a>
        <Providers>
          {children}
          <FloatingDock />
          <ToastContainer />
          <CookieConsentBanner />
        </Providers>
      </body>
    </html>
  );
}
