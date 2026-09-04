import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LocationProvider } from "@/context/LocationContext";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "7Cheese Pizza | Order Hot & Cheesy Pizzas Online",
  description: "Order handcrafted pizzas, starters, and desserts online with 30-min fast delivery.",
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍕</text></svg>',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#002855',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#f4f6f8] selection:bg-[#e31837] selection:text-white">
        <LocationProvider>
          <AuthProvider>{children}</AuthProvider>
        </LocationProvider>
      </body>
    </html>
  );
}
