import './globals.css'

export const metadata = {
  title: 'Lux Libris - Illuminating the World Through Stories',
  description: 'A Catholic reading program that forms the whole child through gamified reading experiences, saint achievements, and meaningful book engagement.',
  icons: {
    icon: '/images/lux_libris_logo.jpg',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}