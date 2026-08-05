import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
export const metadata: Metadata = {
  title: "recipe-app",
  description: "A recipe website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header
          appName="recipe-app"
          links={[{ label: "Browse", href: "/recipes" }]}
        />
        <main>{children}</main>
      </body>
    </html>
  );
}
