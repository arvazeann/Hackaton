import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "RuangLagi | Marketplace Preloved",
  description: "Fondasi marketplace preloved RuangLagi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
