// pages/luxlings.js - LUXLINGS™ COLLECTION PAGE
import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

export default function Luxlings() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedSeries, setSelectedSeries] = useState('all')

  return (
    <>
      <Head>
        <title>Luxlings™ Collection - 234 Saints to Discover</title>
        <meta name="description" content="Collect all 234 Luxlings™ saints! Vinyl chibi-style figures earned through reading achievements. Each saint includes feast days, virtues, and inspiring stories." />
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-teal-50 to-blue-50" style={{fontFamily: 'Avenir, -apple-system, BlinkMacSystemFont, system-ui, sans-serif', letterSpacing: '0.12em'}}>
        
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-sm shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <img
                src="/images/lux_libris_logo.png"
                alt="Lux Libris"
                width={50}
                height={50}
                className="rounded-full"
              />
              <h1 className="text-2xl font-bold text-slate-800" style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.05em'}}>
                Lux Libris
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6 items-center">
              <Link href="/features" className="text-slate-600 hover:text-teal-600 transition-colors">
                Features
              </Link>
              <Link href="/for-schools" className="text-slate-600 hover:text-teal-600 transition-colors">
                For Schools
              </Link>
              <Link href="/contact" className="text-slate-600 hover:text-teal-600 transition-colors">
                Contact
              </Link>
              <Link href="/sign-in" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full text-sm font-semibold transition-all">
                Sign In
              </Link>
            </nav>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center space-x-3">
              <Link href="/sign-in" className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all">
                Sign In
              </Link>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-600 hover:text-teal-600 transition-colors p-2"
                aria-label="Toggle mobile menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-slate-200">
              <div className="px-6 py-4 space-y-3">
                <Link 
                  href="/features" 
                  className="block text-slate-600 hover:text-teal-600 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  href="/for-schools" 
                  className="block text-slate-600 hover:text-teal-600 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  For Schools
                </Link>
                <Link 
                  href="/contact" 
                  className="block text-slate-600 hover:text-teal-600 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
              </div>
            </div>
          )}
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-amber-50 via-teal-50 to-white py-20">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <div className="mb-6">
              <span className="inline-block bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                ✨ Exclusive Collectibles ✨
              </span>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6"
                style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.02em'}}>
              Meet the
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-teal-600">
                {" "}Luxlings™
              </span>
            </h2>
            
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              234 adorable chibi-style saints waiting to join your collection! 
              Each Luxling™ brings faith to life with stories, feast days, and virtues 
              that inspire young readers on their journey.
            </p>

            {/* Collection Stats */}
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              <StatBubble number="234" label="Total Saints" color="amber" />
              <StatBubble number="17" label="Series" color="teal" />
              <StatBubble number="4" label="Rarity Levels" color="blue" />
              <StatBubble number="5" label="Years to Complete" color="purple" />
            </div>
          </div>
        </section>

        {/* How to Collect Section */}
        <section className="bg-white py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
                How to Collect Luxlings™
              </h3>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Every reading achievement brings you closer to completing your heavenly collection!
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <CollectionMethod
                icon="📚"
                title="Reading Streaks"
                description="Build consistent reading habits"
                rewards={[
                  { days: "14 days", reward: "Common Saint", color: "green" },
                  { days: "30 days", reward: "Rare Saint", color: "blue" },
                  { days: "90 days", reward: "Legendary Saint", color: "purple" }
                ]}
              />
              
              <CollectionMethod
                icon="🎯"
                title="Book Milestones"
                description="Complete books in your grade"
                rewards={[
                  { days: "First Book", reward: "Grade Saint", color: "amber" },
                  { days: "Program End", reward: "Mini Marian", color: "pink" },
                  { days: "All 20 Books", reward: "Special Edition", color: "red" }
                ]}
              />
              
              <CollectionMethod
                icon="📅"
                title="Seasonal Saints"
                description="Celebrate the liturgical year"
                rewards={[
                  { days: "Advent", reward: "Advent Saint", color: "purple" },
                  { days: "Lent", reward: "Lenten Saint", color: "indigo" },
                  { days: "Easter", reward: "Easter Saint", color: "yellow" }
                ]}
              />
              
              <CollectionMethod
                icon="🏆"
                title="Ultimate Goal"
                description="Complete the 5-year journey"
                rewards={[
                  { days: "100 Books", reward: "???", color: "slate" },
                  { days: "All Saints", reward: "Ultimate Reward", color: "slate" },
                  { days: "True Reader", reward: "Eternal Glory", color: "slate" }
                ]}
              />
            </div>
          </div>
        </section>

        {/* Series Showcase */}
        <section className="bg-gradient-to-br from-teal-50 to-blue-50 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
                Luxlings™ Series
              </h3>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
                Seven unique series, each with its own artistic style and charm
              </p>

              {/* Series Filter */}
              <div className="flex flex-wrap justify-center gap-3">
                <SeriesButton
                  active={selectedSeries === 'all'}
                  onClick={() => setSelectedSeries('all')}
                  label="All Series"
                />
                <SeriesButton
                  active={selectedSeries === 'mini-marians'}
                  onClick={() => setSelectedSeries('mini-marians')}
                  label="Mini Marians"
                  color="blue"
                />
                <SeriesButton
                  active={selectedSeries === 'halo-hatchlings'}
                  onClick={() => setSelectedSeries('halo-hatchlings')}
                  label="Halo Hatchlings"
                  color="pink"
                />
                <SeriesButton
                  active={selectedSeries === 'super-sancti'}
                  onClick={() => setSelectedSeries('super-sancti')}
                  label="Super Sancti"
                  color="amber"
                />
                <SeriesButton
                  active={selectedSeries === 'pocket-patrons'}
                  onClick={() => setSelectedSeries('pocket-patrons')}
                  label="Pocket Patrons"
                  color="green"
                />
              </div>
            </div>

            {/* Series Cards */}
            <div className="grid md:grid-cols-3 gap-8">
              <SeriesCard
                title="Mini Marians"
                description="All the beloved appearances and titles of Our Lady from around the world"
                saintCount="15"
                color="blue"
                icon="👑"
                features={["Marian apparitions", "Cultural titles", "Beautiful imagery"]}
              />
              
              <SeriesCard
                title="Halo Hatchlings"
                description="Young saints who lived holy lives and inspired others before reaching adulthood"
                saintCount="20"
                color="pink"
                icon="👶"
                features={["Child saints", "Young martyrs", "Inspiring stories"]}
              />
              
              <SeriesCard
                title="Super Sancti"
                description="Heroic martyrs, missionaries, and miracle-workers who changed the world"
                saintCount="25"
                color="amber"
                icon="⚡"
                features={["Epic heroes", "Miracle workers", "World changers"]}
              />
              
              <SeriesCard
                title="Sacred Circle"
                description="Jesus' chosen twelve disciples plus Mary Magdalene - the original followers"
                saintCount="13"
                color="purple"
                icon="⭕"
                features={["The Apostles", "First followers", "Foundation stones"]}
              />
              
              <SeriesCard
                title="Pocket Patrons"
                description="Your everyday protectors for life's daily needs and challenges"
                saintCount="30"
                color="green"
                icon="🎒"
                features={["Daily helpers", "Special needs", "Practical saints"]}
              />
              
              <SeriesCard
                title="Cherub Chibis"
                description="The mighty archangels - heaven's warrior messengers in adorable form"
                saintCount="7"
                color="indigo"
                icon="👼"
                features={["Archangels", "Heavenly warriors", "Divine messengers"]}
              />
            </div>
            
            {/* More Series Teaser */}
            <div className="mt-8 text-center">
              <p className="text-slate-600 mb-4">
                Plus 11 more amazing series to discover!
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-sm">
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Faithful Families</span>
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Apostolic All-Stars</span>
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Contemplative Cuties</span>
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Founder Flames</span>
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Desert Disciples</span>
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Regal Royals</span>
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Culture Carriers</span>
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Learning Legends</span>
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Heavenly Helpers</span>
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Virtue Vignettes</span>
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-semibold">Ultimate Redeemer ✨</span>
              </div>
            </div>
          </div>
        </section>

        {/* Sample Saints Gallery */}
        <section className="bg-white py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
                Sample Collection
              </h3>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Here's a sneak peek at some of the saints you can collect!
              </p>
            </div>

            {/* Rarity Filters */}
            <div className="flex justify-center gap-3 mb-8">
              <RarityFilter
                active={activeFilter === 'all'}
                onClick={() => setActiveFilter('all')}
                label="All"
              />
              <RarityFilter
                active={activeFilter === 'common'}
                onClick={() => setActiveFilter('common')}
                label="Common"
                color="green"
              />
              <RarityFilter
                active={activeFilter === 'rare'}
                onClick={() => setActiveFilter('rare')}
                label="Rare"
                color="blue"
              />
              <RarityFilter
                active={activeFilter === 'legendary'}
                onClick={() => setActiveFilter('legendary')}
                label="Legendary"
                color="purple"
              />
              <RarityFilter
                active={activeFilter === 'special'}
                onClick={() => setActiveFilter('special')}
                label="Special"
                color="amber"
              />
            </div>

            {/* Saints Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <SaintCard
                name="St. Josephine Bakhita"
                series="Heavenly Helpers"
                rarity="rare"
                number="001"
                feastDay="Feb 8"
                image="/saints/saint_bakhita.png"
              />
              
              <SaintCard
                name="St. Frances Cabrini"
                series="Founder Flames"
                rarity="legendary"
                number="045"
                feastDay="Nov 13"
                image="/saints/saint_cabrini.png"
              />
              
              <SaintCard
                name="St. Carlo Acutis"
                series="Halo Hatchlings"
                rarity="special"
                number="112"
                feastDay="Oct 12"
                image="/saints/saint_carlo.png"
              />
              
              <SaintCard
                name="St. Dominic Savio"
                series="Halo Hatchlings"
                rarity="common"
                number="M-03"
                feastDay="Mar 9"
                image="/saints/saint_dominicsavio.png"
              />
              
              <SaintCard
                name="St. Patrick"
                series="Culture Carriers"
                rarity="common"
                number="S-17"
                feastDay="Mar 17"
                image=""
              />
              
              <SaintCard
                name="St. Michael"
                series="Cherub Chibis"
                rarity="legendary"
                number="150"
                feastDay="Sep 29"
                image=""
              />
            </div>

            <div className="text-center mt-8">
              <p className="text-slate-500 text-sm">
                And 228 more saints to discover in the app!
              </p>
            </div>
          </div>
        </section>

        {/* Saint Features */}
        <section className="bg-gradient-to-br from-amber-50 to-teal-50 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-slate-800 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
                Every Saint Includes
              </h3>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                More than just collectibles - each Luxling™ is a gateway to faith and learning
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <FeatureItem
                    icon="📅"
                    title="Feast Day Celebrations"
                    description="Learn when to celebrate each saint throughout the liturgical year"
                  />
                  
                  <FeatureItem
                    icon="📖"
                    title="Saint Biography"
                    description="Age-appropriate stories that bring each saint's life to vivid reality"
                  />
                  
                  <FeatureItem
                    icon="✨"
                    title="Virtues & Values"
                    description="Discover the special virtues each saint exemplified"
                  />
                  
                  <FeatureItem
                    icon="🎯"
                    title="Fun Facts"
                    description="Interesting tidbits that make saints relatable to young readers"
                  />
                  
                  <FeatureItem
                    icon="🙏"
                    title="Simple Prayers"
                    description="Short prayers inspired by each saint's spirituality"
                  />
                </div>

                <div className="bg-gradient-to-br from-teal-100 to-blue-100 rounded-2xl p-8 text-center">
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-blue-50 to-teal-50">
                      <img src="/saints/saint_carlo.png" alt="St. Carlo Acutis" className="w-full h-full object-cover" />
                    </div>
                    <h4 className="font-bold text-slate-800 mb-2">St. Carlo Acutis</h4>
                    <p className="text-sm text-slate-600 mb-3">Halo Hatchlings #112</p>
                    <div className="text-xs text-slate-500 space-y-1">
                      <p>⭐ Special Edition</p>
                      <p>📅 Feast: October 12</p>
                      <p>✨ Virtue: Digital Evangelization</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ultimate Goal Teaser */}
        <section className="bg-gradient-to-r from-purple-900 to-indigo-900 py-20 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="mb-8">
              <span className="text-6xl">🏆</span>
            </div>
            <h3 className="text-3xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
              The Ultimate Collection Goal
            </h3>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Complete all 5 years of the Lux Libris journey. Read 100 books. 
              Collect every saint. And unlock the greatest reward of all...
            </p>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 max-w-md mx-auto">
              <p className="text-6xl mb-4">❓</p>
              <p className="text-lg font-semibold mb-2">The Ultimate Redeemer</p>
              <p className="text-purple-200 text-sm">
                Only the most dedicated readers will discover this final, most precious Luxling™
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-white py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h3 className="text-3xl font-bold text-slate-800 mb-6" style={{fontFamily: 'Didot, Georgia, serif'}}>
              Ready to Start Your Collection?
            </h3>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Join Lux Libris today and begin your journey to collect all 234 saints 
              while building a lifelong love of reading.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/role-selector" 
                className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg inline-block"
              >
                Start Collecting
              </Link>
              
              <Link 
                href="/programs" 
                className="border-2 border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white px-8 py-4 rounded-full text-lg font-semibold transition-all inline-block"
              >
                Learn About Programs
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-800 text-white py-12">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              {/* Brand */}
              <div>
                <Link href="/" className="flex items-center space-x-3 mb-4">
                  <img
                    src="/images/lux_libris_logo.png"
                    alt="Lux Libris"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <h3 className="text-xl font-bold" style={{fontFamily: 'Didot, Georgia, serif'}}>
                    Lux Libris
                  </h3>
                </Link>
                <p className="text-slate-400 text-sm">
                  Forming saints, one book at a time.
                </p>
              </div>
              
              {/* Programs */}
              <div>
                <h4 className="font-semibold mb-4">Programs</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="/programs#lux-libris-award" className="hover:text-teal-400">The Lux Libris Award</Link></li>
                  <li><Link href="/programs#classroom-reading" className="hover:text-teal-400">Classroom Reading</Link></li>
                </ul>
              </div>
              
              {/* About */}
              <div>
                <h4 className="font-semibold mb-4">About</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="/features" className="hover:text-teal-400">Features</Link></li>
                  <li><Link href="/luxlings" className="hover:text-teal-400">Luxlings™ Saints</Link></li>
                  <li><Link href="/how-it-works" className="hover:text-teal-400">How It Works</Link></li>
                </ul>
              </div>
              
              {/* Support & Get Started */}
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-slate-400 mb-4">
                  <li><Link href="/contact" className="hover:text-teal-400">Contact Us</Link></li>
                  <li><a href="mailto:support@luxlibris.org" className="hover:text-teal-400">Help Center</a></li>
                </ul>
                <h4 className="font-semibold mb-2">Get Started</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="/for-schools" className="hover:text-teal-400">For Schools</Link></li>
                  <li><a href="mailto:inquiries@luxlibris.org" className="hover:text-teal-400">School Inquiries</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-slate-700 pt-8 text-center text-sm text-slate-400">
              <p>&copy; 2025 Lux Libris. All rights reserved. Luxlings™ is a trademark of Lux Libris.</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}

// Supporting Components
function StatBubble({ number, label, color }) {
  const colorClasses = {
    amber: 'bg-amber-100 text-amber-700',
    teal: 'bg-teal-100 text-teal-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700'
  }
  
  return (
    <div className={`${colorClasses[color]} rounded-2xl px-6 py-4 text-center`}>
      <div className="text-3xl font-bold" style={{fontFamily: 'Didot, Georgia, serif'}}>
        {number}
      </div>
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

function CollectionMethod({ icon, title, description, rewards }) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6">
      <div className="text-3xl mb-3">{icon}</div>
      <h4 className="text-lg font-bold text-slate-800 mb-2">{title}</h4>
      <p className="text-sm text-slate-600 mb-4">{description}</p>
      <div className="space-y-2">
        {rewards.map((reward, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-slate-600">{reward.days}</span>
            <span className={`font-semibold text-${reward.color}-600`}>
              {reward.reward}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SeriesButton({ active, onClick, label, color = 'slate' }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full font-semibold transition-all ${
        active 
          ? 'bg-teal-600 text-white shadow-lg' 
          : 'bg-white text-slate-600 hover:bg-slate-50 shadow'
      }`}
    >
      {label}
    </button>
  )
}

function SeriesCard({ title, description, saintCount, color, icon, features }) {
  const colorClasses = {
    pink: 'from-pink-100 to-pink-200',
    blue: 'from-blue-100 to-blue-200',
    amber: 'from-amber-100 to-amber-200',
    purple: 'from-purple-100 to-purple-200',
    green: 'from-green-100 to-green-200',
    indigo: 'from-indigo-100 to-indigo-200'
  }
  
  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl p-6`}>
      <div className="text-4xl mb-3">{icon}</div>
      <h4 className="text-xl font-bold text-slate-800 mb-2" style={{fontFamily: 'Didot, Georgia, serif'}}>
        {title}
      </h4>
      <p className="text-sm text-slate-600 mb-3">{description}</p>
      <p className="font-semibold text-slate-700 mb-4">{saintCount} Saints</p>
      <ul className="space-y-1">
        {features.map((feature, index) => (
          <li key={index} className="text-sm text-slate-600 flex items-start">
            <span className="text-teal-500 mr-1">•</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}

function RarityFilter({ active, onClick, label, color = 'slate' }) {
  const colorClasses = {
    slate: 'text-slate-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    amber: 'text-amber-600'
  }
  
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full font-semibold transition-all ${
        active 
          ? `bg-${color}-100 ${colorClasses[color]} shadow` 
          : 'bg-white text-slate-400 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  )
}

function SaintCard({ name, series, rarity, number, feastDay, image }) {
  const rarityColors = {
    common: 'border-green-300 bg-green-50',
    rare: 'border-blue-300 bg-blue-50',
    legendary: 'border-purple-300 bg-purple-50',
    special: 'border-amber-300 bg-amber-50'
  }
  
  return (
    <div className={`${rarityColors[rarity]} border-2 rounded-xl p-4 text-center hover:scale-105 transition-transform cursor-pointer`}>
      {image ? (
        <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-white">
          <img src={image} alt={name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="text-4xl mb-2">⛪</div>
      )}
      <p className="text-xs font-mono text-slate-500 mb-1">#{number}</p>
      <h5 className="font-semibold text-sm text-slate-800 mb-1">{name}</h5>
      <p className="text-xs text-slate-600 mb-2">{series}</p>
      <p className="text-xs text-slate-500">📅 {feastDay}</p>
    </div>
  )
}

function FeatureItem({ icon, title, description }) {
  return (
    <div className="flex items-start space-x-4">
      <div className="text-2xl mt-1">{icon}</div>
      <div>
        <h4 className="font-semibold text-slate-800 mb-1">{title}</h4>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </div>
  )
}