import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon - consistent .png usage */}
        <link rel="icon" href="/images/lux_libris_logo.png" />
        <link rel="shortcut icon" href="/images/lux_libris_logo.png" />
        
        {/* PWA Configuration */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/images/lux_libris_logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/lux_libris_logo.png" />
        
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#223848" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Lux Libris" />
        <meta name="description" content="Transform your reading journey with saint achievements and interactive book tracking" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        
        {/* Additional PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Lux Libris" />
        <meta name="msapplication-TileColor" content="#223848" />
        <meta name="msapplication-TileImage" content="/images/lux_libris_logo.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}