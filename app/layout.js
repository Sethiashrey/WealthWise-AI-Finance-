import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "WealthWise AI",
  description: "One Stop Finance Platform",
};

export default function RootLayout({ children }) {
  const currentYear = new Date().getFullYear(); // safer to compute once here

  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <ClerkProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Toaster richColors />
          <footer className="bg-blue-50 py-12">
            <div className="container mx-auto px-4 text-center text-sm text-gray-600">
              <p>
                &copy; {currentYear} WealthWise AI. All rights reserved. (Shrey Sethia)
              </p>
            </div>
          </footer>
        </ClerkProvider>
      </body>
    </html>
  );
}
