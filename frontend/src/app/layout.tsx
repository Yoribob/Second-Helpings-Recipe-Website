import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/auth-context";
import { BookmarksProvider } from "@/lib/bookmark-context";
import { getServerSession } from "@/lib/auth-server";
import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: {
    default: "Second Helpings",
    template: "%s · Second Helpings",
  },
  description: "A cozy place for your recipes.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  return (
    <html lang="en" className={fontVariables}>
      <body>
        <AuthProvider initialSession={session}>
          <BookmarksProvider>
            <Header />
            <main>{children}</main>
            <Footer />
          </BookmarksProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
