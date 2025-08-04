// components/Footer.js
import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{backgroundColor: '#223848'}}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-4 gap-6 text-sm">
          {/* Programs */}
          <div>
            <h4 className="font-semibold mb-3 text-white">Programs</h4>
            <ul className="space-y-2">
              <li><Link href="/lux-libris-award" className="text-white/80 hover:text-white transition-colors">The Lux Libris Award</Link></li>
              <li><Link href="/classroom-reading" className="text-white/80 hover:text-white transition-colors">Classroom Reading</Link></li>
            </ul>
          </div>
          
          {/* About */}
          <div>
            <h4 className="font-semibold mb-3 text-white">About</h4>
            <ul className="space-y-2">
              <li><Link href="/features" className="text-white/80 hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/luxlings" className="text-white/80 hover:text-white transition-colors">Luxlings™ Saints</Link></li>
              <li><Link href="/demo" className="text-white/80 hover:text-white transition-colors">How It Works</Link></li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h4 className="font-semibold mb-3 text-white">Support</h4>
            <ul className="space-y-2">
              <li><Link href="/contact" className="text-white/80 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/help-center" className="text-white/80 hover:text-white transition-colors">Help Center</Link></li>
            </ul>
          </div>
          
          {/* Connect */}
          <div>
            <h4 className="font-semibold mb-3 text-white">Get Started</h4>
            <ul className="space-y-2">
              <li><Link href="/for-schools" className="text-white/80 hover:text-white transition-colors">For Schools</Link></li>
              <li><Link href="/licensing-inquiries" className="text-white/80 hover:text-white transition-colors">Licensing Inquiries</Link></li>
              <li><Link href="/partnerships" className="text-white/80 hover:text-white transition-colors">Partnerships</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/20 text-center text-sm text-white/60">
          <p>&copy; 2025 Lux Libris. All rights reserved. Made with ❤️ for Catholic schools.</p>
        </div>
      </div>
    </footer>
  )
}