import "./globals.css";
import { type Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "RESCASH",
  description: "Ordering your food",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

// กำหนด font-family เป็น Noto Sans Thai
const noto_sans_thai = Noto_Sans_Thai({
  subsets: ["thai"],
  display: "swap", // ช่วยให้โหลด font ได้เร็วขึ้น
  variable: "--font-noto-sans-thai",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={noto_sans_thai.variable}>
      <body className={`${noto_sans_thai.className} flex justify-center items-center min-h-screen bg-gray-100`}>
        <Toaster position="top-center" />
        <div className="relative w-full max-w-sm h-screen overflow-hidden shadow-lg bg-white">
          {children}
        </div>
      </body>
    </html>
  );
}