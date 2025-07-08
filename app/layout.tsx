import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerProvider } from "@/src/providers/ServiceWorkerProvider";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { TouchFeedbackProvider } from "@/src/providers/TouchFeedbackProvider";
import { NavigationProvider } from "@/src/providers/NavigationProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Thrive - Holistic Healing",
  description: "Your personalized AI-powered wellness journey",
  manifest: "/manifest.json",
};

export const viewport: Viewport & { interactiveWidget?: string } = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
  // Prevents 300ms delay on older browsers
  viewportFit: "cover",
  // Prevents keyboard from pushing header out of viewport
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen overscroll-none`}
      >
        <ServiceWorkerProvider>
          <NavigationProvider>
            <TouchFeedbackProvider>
              <OfflineIndicator />
              {children}
            </TouchFeedbackProvider>
          </NavigationProvider>
        </ServiceWorkerProvider>
      </body>
    </html>
  );
}