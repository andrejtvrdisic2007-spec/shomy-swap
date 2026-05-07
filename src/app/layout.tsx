import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { Toaster } from "react-hot-toast";
import { SHOP_NAME } from "@/lib/constants";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: `${SHOP_NAME} — Appointment Swap`,
  description: "Trade your barber appointment with another client easily and safely.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <SessionProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1a1a1a",
                color: "#e3e3e3",
                border: "1px solid #383838",
                borderRadius: "10px",
              },
              success: {
                iconTheme: { primary: "#D4AF37", secondary: "#0f0f0f" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#0f0f0f" },
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
