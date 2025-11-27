import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Logistics App",
    description: "Delivery management system",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className} suppressHydrationWarning>
                <LanguageProvider>
                    <Header />
                    {children}
                </LanguageProvider>
            </body>
        </html>
    );
}
