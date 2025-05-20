import { Geist, Geist_Mono, Open_Sans, Roboto, Roboto_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from 'sonner';
import "../../public/globals.css";
import { AccountProvider } from "@/contexts/account-context";
import GlobalMenu from "@/components/global-menu";
import Header from "@/components/header";

const geistSans = Open_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Bad Art",
  description: "A serious place for unserious art",
  icons: [{ rel: "icon", url: "/favicon.svg" }],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} h-screen w-screen antialiased m-0 p-0 overflow-hidden`}>
        <Providers>
          <>
            <Toaster position="top-center" />
            <Header />
            <GlobalMenu />
            <div className="h-full w-full">
              {children}
            </div>
          </>
        </Providers>
      </body>
    </html>
  );
}
