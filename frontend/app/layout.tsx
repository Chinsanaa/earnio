import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ApplePlatformBootstrap } from "@/components/native/ApplePlatformBootstrap";
import { EARNIO_SLOGAN } from "@/lib/brand/earnio";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const jetbrains = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: "Earnio",
  description: `${EARNIO_SLOGAN} — Monetization platform for Mongolian creators and brands`,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Earnio",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    icon: [{ url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }],
  },
  other: {
    'tiktok-developers-site-verification': 'akfWgxdDMgxSGHl48nI4wf231VYm4XLd',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F3EE" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1220" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${plusJakarta.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='ct-theme',t=localStorage.getItem(k),d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="mesh-bg flex min-h-full flex-col">
        <LanguageProvider>
          <ThemeProvider>
            <ErrorBoundary>
              <AuthProvider>
                <ApplePlatformBootstrap />
                <OfflineBanner />
                {children}
              </AuthProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
