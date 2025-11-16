import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Minecraft Enchantment Ordering Tool",
  description: "Find the optimal order for combining enchantments in Minecraft to minimize XP cost and avoid 'Too Expensive!' errors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
