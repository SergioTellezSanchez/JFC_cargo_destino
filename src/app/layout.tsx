import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from 'next-themes';
import { LanguageProvider } from "@/lib/LanguageContext";
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
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <LanguageProvider>
                        <Header />
                        {children}
                    </LanguageProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
