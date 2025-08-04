// components/Layout.js
import Head from 'next/head'
import Header from './Header'
import Footer from './Footer'

export default function Layout({ children, title, description }) {
  return (
    <>
      <Head>
        <title>{title || 'Lux Libris - Forming Saints, One Book at a Time'}</title>
        <meta 
          name="description" 
          content={description || 'Transform Catholic school reading with gamified learning. Students collect Luxlings™ saints while building lifelong reading habits.'} 
        />
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <main className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex flex-col" 
            style={{fontFamily: 'Avenir, -apple-system, BlinkMacSystemFont, system-ui, sans-serif', letterSpacing: '0.12em'}}>
        <Header />
        
        <div className="flex-1">
          {children}
        </div>
        
        <Footer />
      </main>
    </>
  )
}