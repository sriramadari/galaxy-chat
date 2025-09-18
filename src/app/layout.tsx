import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Galaxy Chat",
  description: "AI-powered chat platform by Vercel AI SDK",
};

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full" suppressHydrationWarning>
        <body className={`${inter.className} h-full`} suppressHydrationWarning>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  function setTheme() {
                    try {
                      const theme = localStorage.getItem('theme');
                      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                      if (theme === 'dark' || (!theme && systemPrefersDark)) {
                        document.documentElement.classList.add('dark');
                      } else {
                        document.documentElement.classList.remove('dark');
                      }
                    } catch (e) {
                      // Fallback for when localStorage is not available
                    }
                  }
                  setTheme();
                })();
              `,
            }}
          />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
