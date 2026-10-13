import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "@/app/globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif-display",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RuangLagi | Marketplace Preloved",
  description: "Fondasi marketplace preloved RuangLagi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${dmSerifDisplay.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
