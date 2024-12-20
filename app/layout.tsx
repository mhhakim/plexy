import type { Metadata } from "next";
import "./globals.css";
import { Appbar } from "@/components/appbar";
import { ReactNode } from "react";
import Providers from "@/components/providers";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({ subsets: ["latin"] });

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
    <html lang="en">
      <head>
        <link rel="icon" href="/plexicon.png" />
      </head>
      <body className={`${quicksand.className} antialiased bg-background`}>
        <Providers>
          <Appbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
