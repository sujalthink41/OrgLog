import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import {
  QueryProvider,
  ProjectProvider,
  LiveLogsProvider,
  SidebarProvider,
} from "@/lib/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OrgLog - Centralized Logging Platform",
  description:
    "Production-grade multi-tenant logging platform with real-time streaming and analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased bg-slate-50 text-slate-900">
        <QueryProvider>
          <ProjectProvider>
            <SidebarProvider>
              <LiveLogsProvider>{children}</LiveLogsProvider>
            </SidebarProvider>
          </ProjectProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
