import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { cn } from "@/lib/utils"
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Secret Share - Secure One-Time Secret Sharing",
  description: "Share secrets securely with end-to-end encryption and one-time viewing",
  robots: "index",
  referrer: "no-referrer",
  other: {
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; object-src 'none'; frame-src 'none';",
  },
}

export default function RootLayout({
  children,
}:{
  readonly children: React.ReactNode
}) {
  return (
    <html lang="en"  className={cn(inter.className)} suppressHydrationWarning>
      <head>
        <meta name="robots" content="index" />
        <meta name="referrer" content="no-referrer" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="no-referrer" />
        <link rel="icon" type="image/svg+xml" href="/ologo.png"/>
        <style
          dangerouslySetInnerHTML={{
            __html: `
            * {
              -webkit-user-select: none !important;
              -moz-user-select: none !important;
              -ms-user-select: none !important;
              user-select: none !important;
            }
            @media print {
              * { display: none !important; }
              body::before {
                content: "Printing is not allowed for security reasons." !important;
                display: block !important;
                font-size: 24px !important;
                text-align: center !important;
                margin-top: 50vh !important;
              }
            }
          `,
          }}
        />
      </head>
      <body>
        {children}
        <Toaster position="bottom-right" richColors closeButton />
        <Analytics />
      </body>
    </html>
  )
}
