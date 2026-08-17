import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({ subsets: ["latin"] });

function AppShellClient({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AppShell>{children}</AppShell>
    </ToastProvider>
  );
}

export const metadata: Metadata = {
  title: "Invoice Analytics AI",
  description: "Analisis invoice dengan AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <AppShellClient>{children}</AppShellClient>
      </body>
    </html>
  );
}
