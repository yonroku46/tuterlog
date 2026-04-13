import type { Metadata } from "next";
import { Inter, Roboto } from "next/font/google";
import "@/styles/globals.scss";
import "@/styles/layout/sidebar.scss";
import { AuthProvider } from "@/context/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { GoogleOAuthProvider } from '@react-oauth/google';

import { generatePageMetadata } from "@/common/utils/metaUtils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-roboto" });

export const metadata = generatePageMetadata('home');

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // If NEXT_PUBLIC_GOOGLE_CLIENT_ID is undefined, fallback to an empty string to prevent crashing
  // (the OAuth login will fail gracefully instead)
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  return (
    <html lang="ko">
      <body className={`${inter.variable} ${roboto.variable}`}>
        <GoogleOAuthProvider clientId={googleClientId}>
          <AuthProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
