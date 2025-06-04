import type { Metadata } from "next";
import "../styles/globals.css";
import { Work_Sans } from "next/font/google";
import { SocketProvider } from "@/provider/socketClient";

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-work-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Scrapd_Ine",
  description: "Semi Automated Linkedin Scraping",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <SocketProvider>
        <body className={`${workSans.variable} antialiased`}>{children}</body>
      </SocketProvider>
    </html>
  );
}
