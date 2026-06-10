import './globals.css'
import type { Metadata } from 'next'
import { ViewTransitions } from 'next-view-transitions';

// import "@ibm/plex-sans-sc/css/ibm-plex-sans-sc-all.min.css";

export const metadata: Metadata = {
  title: "Island Search",
  description: "nmbxd1.com 的第三方搜索",
  metadataBase: new URL('https://www.nmbxd1.com'),
  openGraph: {
    images: {
      url: "/preview.png",
      type: "image/png",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <head>
        <meta name="theme-color" content="#c24812" />
      </head>
      <body>
        <ViewTransitions>
          {children}
        </ViewTransitions>
      </body>
    </html>
  )
}
