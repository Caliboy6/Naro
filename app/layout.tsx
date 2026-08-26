import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://naro-ai-vault.davidtheevanoob.chatgpt.site"),
  title: "Naro — AI-Native Bluechip Asset Vaults",
  description: "Bluechip assets optimized across approved DeFi venues by AI, bound by mandate and verified before execution.",
  openGraph: {
    title: "Naro — AI-Native Bluechip Asset Vaults",
    description: "Bluechip assets. Optimized by AI. Bound by mandate.",
    images: [{ url: "/og.jpg", width: 1536, height: 1024, alt: "Naro AI-native bluechip asset vault infrastructure" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Naro — AI-Native Bluechip Asset Vaults",
    description: "Bluechip assets. Optimized by AI. Bound by mandate.",
    images: ["/og.jpg"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en"><body>{children}</body></html>
  );
}
