import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/providers";
import { fonts } from "@/components/chrome/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Backend engineering map", template: "%s · Backend engineering map" },
  description:
    "Backend and distributed systems as a map. One researched article per concept, laid out in the order you can read them. Pick a concept to see what it needs and what it unlocks.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fonts} h-full`} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
