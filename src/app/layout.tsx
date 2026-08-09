import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = { title: { default: "Risknote", template: "%s · Risknote" }, description: "A focused visual trading journal." };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en" className="h-full antialiased" suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}<Analytics /><SpeedInsights /></body>
    </html>
  );
}
