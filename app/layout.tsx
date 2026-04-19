import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Eval — Control Conf After Party",
  description: "A live AI control evaluation party game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteNav />
        <div className="flex-1 flex flex-col">{children}</div>
        <SiteFooter />
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
