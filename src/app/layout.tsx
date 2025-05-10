import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "../../public/globals.css";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Lens App",
  description: "Future of decentralized social",
  icons: [{ rel: "icon", url: "/favicon.svg" }],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased m-0 p-0 overflow-hidden`}>
        <Providers>
          <div>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
