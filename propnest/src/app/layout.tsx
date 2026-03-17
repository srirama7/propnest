import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccessibilityToolbar } from "@/components/accessibility/accessibility-toolbar";
import { BellaAssistant } from "@/components/ai/bella-assistant";
import { TommyGuide } from "@/components/ai/tommy-guide";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BhoomiTayi - Online Marketplace | Buy, Sell & Rent Services",
    template: "%s | BhoomiTayi",
  },
  description:
    "BhoomiTayi is India's trusted online marketplace helping you buy, sell, and rent across categories including homes, vehicles, commercial spaces, and more.",
  keywords: [
    "real estate",
    "buy property",
    "sell property",
    "rent house",
    "PG accommodation",
    "commercial space",
    "vehicles",
    "India marketplace",
    "BhoomiTayi",
  ],
  openGraph: {
    title: "BhoomiTayi - Online Marketplace | Buy, Sell & Rent Services",
    description:
      "BhoomiTayi is India's trusted online marketplace helping you buy, sell, and rent across categories including homes, vehicles, commercial spaces, and more.",
    type: "website",
    siteName: "BhoomiTayi",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* Skip to main content link for keyboard/screen reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <TooltipProvider>
                <LayoutWrapper><div id="main-content">{children}</div></LayoutWrapper>
                <BellaAssistant />
                <TommyGuide />
                <AccessibilityToolbar />
                <Toaster richColors position="top-right" />
              </TooltipProvider>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
