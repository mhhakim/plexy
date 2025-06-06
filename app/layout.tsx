import type { Metadata } from "next";
import "./globals.css";
import { Appbar } from "@/components/appbar";
import { ReactNode, Suspense } from "react";
import Providers from "@/components/providers";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Plexy",
  description: "Alternative plex ui",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/plexicon.png" />
      </head>
      <body className={`antialiased bg-background pb-20`}>
        <Suspense>
          <Providers>
            <Appbar />
            {children}
          </Providers>
          <Analytics />
          <SpeedInsights />
        </Suspense>
      </body>
    </html>
  );
}
