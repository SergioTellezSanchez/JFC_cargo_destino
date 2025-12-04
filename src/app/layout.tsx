import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { LanguageProvider } from "@/lib/LanguageContext";
import { UserProvider } from "@/lib/UserContext";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Logistics App",
    description: "Efficient delivery management",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <LanguageProvider>
                    <UserProvider>
                        <Header />
                        {children}
                    </UserProvider>
                </LanguageProvider>
            </body>
        </html>
    );
}
