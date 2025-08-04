{/* Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: scale(0.95);
          }
          to { 
            opacity: 1; 
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>// pages/home/luxlings.js - LUXLINGS™ COLLECTION PAGE
import Layout from '../../components/Layout'
import Link from 'next/link'
import { useState } from 'react'

export default function Luxlings() {
  const [activeFilter, setActiveFilter] = useState('common')
  const [selectedSeries, setSelectedSeries] = useState('all')

  return (
    <Layout 
      title="Luxlings™ Collection - 234 Saints to Discover" 
      description="Collect all 234 Luxlings™ saints! Vinyl chibi-style figures earned through reading achievements. Each saint includes feast days, virtues, and inspiring stories."
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20" style={{background: 'linear-gradient(to bottom, #FFF5F0, #F5EBDC)'}}>
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="mb-6">
            <span className="inline-block bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              ✨ Exclusive Collectibles ✨
            </span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold mb-6"
              style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.02em', color: '#223848'}}>
            Meet the
            <span style={{
              background: 'linear-gradient(to right, #FFAB91, #ADD4EA, #A1E5DB)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {" "}Luxlings™
            </span>
          </h2>
          
          <p className="text-xl max-w-3xl mx-auto mb-8 leading-relaxed" style={{color: '#223848'}}>
            234 adorable chibi-style saints waiting to join your collection! 
            Each Luxling™ brings faith to life with stories, feast days, and virtues 
            that inspire young readers on their journey.
          </p>

          {/* Collection Stats */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <StatBubble number="234" label="Total Saints" color="amber" />
            <StatBubble number="17" label="Series" color="mint" />
            <StatBubble number="4" label="Rarity Levels" color="blue" />
            <StatBubble number="5" label="Years to Complete" color="purple" />
          </div>
        </div>
      </section>

      {/* How to Collect Section */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
              How to Collect Luxlings™
            </h3>
            <p className="text-lg max-w-2xl mx-auto" style={{color: '#223848'}}>
              Every reading achievement brings you closer to completing your heavenly collection!
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CollectionMethod
              icon="📚"
              title="Reading Streaks"
              description="Build consistent reading habits"
              rewards={[
                { days: "14 days", reward: "Common Saint", color: "#34d399" },
                { days: "30 days", reward: "Rare Saint", color: "#60a5fa" },
                { days: "90 days", reward: "Legendary Saint", color: "#a78bfa" }
              ]}
            />
            
            <CollectionMethod
              icon="🎯"
              title="Book Milestones"
              description="Complete books in your grade"
              rewards={[
                { days: "First Book", reward: "Grade Saint", color: "#fbbf24" },
                { days: "Program End", reward: "Mini Marian", color: "#f472b6" }
              ]}
            />
            
            <CollectionMethod
              icon="📅"
              title="Seasonal Saints"
              description="Special saints for each grade level"
              rewards={[
                { days: "Grade 4", reward: "St. Nicholas (Dec)", color: "#fbbf24" },
                { days: "Grade 5", reward: "St. George (Feb-Mar)", color: "#60a5fa" },
                { days: "Grade 6", reward: "Our Lady of the Rosary (Oct)", color: "#a78bfa" },
                { days: "Grade 7", reward: "St. Christopher (Nov)", color: "#34d399" },
                { days: "Grade 8", reward: "St. Michael (Sep)", color: "#ef4444" }
              ]}
            />
            
            <CollectionMethod
              icon="🏆"
              title="Ultimate Goal"
              description="Complete the 5-year journey"
              rewards={[
                { days: "100 Books", reward: "???", color: "#6b7280" },
                { days: "All Saints", reward: "Ultimate Reward", color: "#6b7280" },
                { days: "True Reader", reward: "Eternal Glory", color: "#6b7280" }
              ]}
            />
          </div>
        </div>
      </section>

      {/* Series Showcase */}
      <section className="py-20" style={{background: 'linear-gradient(to bottom right, #C3E0DE, #B6DFEB)'}}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
              Luxlings™ Series
            </h3>
            <p className="text-lg max-w-2xl mx-auto mb-8" style={{color: '#223848'}}>
              Seventeen unique series, each with its own artistic style and charm
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
              />
              <SeriesButton
                active={selectedSeries === 'halo-hatchlings'}
                onClick={() => setSelectedSeries('halo-hatchlings')}
                label="Halo Hatchlings"
              />
              <SeriesButton
                active={selectedSeries === 'super-sancti'}
                onClick={() => setSelectedSeries('super-sancti')}
                label="Super Sancti"
              />
              <SeriesButton
                active={selectedSeries === 'pocket-patrons'}
                onClick={() => setSelectedSeries('pocket-patrons')}
                label="Pocket Patrons"
              />
            </div>
          </div>

          {/* Series Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            <SeriesCard
              title="Mini Marians"
              description="All the beloved appearances and titles of Our Lady from around the world"
              badgeImage="/luxlings_series/mini_marians.png"
            />
            
            <SeriesCard
              title="Halo Hatchlings"
              description="Young saints who lived holy lives and inspired others before reaching adulthood"
              badgeImage="/luxlings_series/halo_hatchlings.png"
            />
            
            <SeriesCard
              title="Super Sancti"
              description="Heroic martyrs, missionaries, and miracle-workers who changed the world"
              badgeImage="/luxlings_series/super_sancti.png"
            />
            
            <SeriesCard
              title="Sacred Circle"
              description="Jesus' chosen twelve disciples plus Mary Magdalene - the original followers"
              badgeImage="/luxlings_series/sacred_circle.png"
            />
            
            <SeriesCard
              title="Pocket Patrons"
              description="Your everyday protectors for life's daily needs and challenges"
              badgeImage="/luxlings_series/pocket_patrons.png"
            />
            
            <SeriesCard
              title="Cherub Chibis"
              description="The mighty archangels - heaven's warrior messengers in adorable form"
              badgeImage="/luxlings_series/cherub_chibis.png"
            />
          </div>
          
          {/* More Series Teaser */}
          <div className="mt-8 text-center">
            <p className="mb-4" style={{color: '#223848'}}>
              Plus 11 more amazing series to discover!
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <span className="bg-slate-100 px-3 py-1 rounded-full" style={{color: '#223848'}}>Faithful Families</span>
              <span className="bg-slate-100 px-3 py-1 rounded-full" style={{color: '#223848'}}>Apostolic All-Stars</span>
              <span className="bg-slate-100 px-3 py-1 rounded-full" style={{color: '#223848'}}>Contemplative Cuties</span>
              <span className="bg-slate-100 px-3 py-1 rounded-full" style={{color: '#223848'}}>Founder Flames</span>
              <span className="bg-slate-100 px-3 py-1 rounded-full" style={{color: '#223848'}}>Desert Disciples</span>
              <span className="bg-slate-100 px-3 py-1 rounded-full" style={{color: '#223848'}}>Regal Royals</span>
              <span className="bg-slate-100 px-3 py-1 rounded-full" style={{color: '#223848'}}>Culture Carriers</span>
              <span className="bg-slate-100 px-3 py-1 rounded-full" style={{color: '#223848'}}>Learning Legends</span>
              <span className="bg-slate-100 px-3 py-1 rounded-full" style={{color: '#223848'}}>Heavenly Helpers</span>
              <span className="bg-slate-100 px-3 py-1 rounded-full" style={{color: '#223848'}}>Virtue Vignettes</span>
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-semibold">Ultimate Redeemer ✨</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Saints Gallery */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
              Sample Collection
            </h3>
            <p className="text-lg max-w-2xl mx-auto" style={{color: '#223848'}}>
              Click each rarity type below to see an example saint from that collection tier
            </p>
          </div>

          {/* Rarity Filters */}
          <div className="flex justify-center gap-3 mb-8">
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

          {/* Saints Display - Single Card Based on Filter */}
          <div className="flex justify-center min-h-[500px] items-center">
            <div key={activeFilter} className="animate-fadeIn">
              {activeFilter === 'common' && (
                <SaintCard
                  name="St. Patrick"
                  series="Culture Carriers"
                  rarity="common"
                  number="030"
                  feastDay="March 17"
                  patronage="Ireland, Missionaries"
                  fact="Used the shamrock to explain the Trinity"
                  image="/saints/saint_patrick.png"
                  isLarge
                />
              )}
              
              {activeFilter === 'rare' && (
                <SaintCard
                  name="St. Faustina Kowalska"
                  series="Heavenly Helpers"
                  rarity="rare"
                  number="027"
                  feastDay="October 5"
                  patronage="Divine Mercy"
                  fact="Received visions of Jesus and spread Divine Mercy devotion"
                  image="/saints/saint_faustina.png"
                  isLarge
                />
              )}
              
              {activeFilter === 'legendary' && (
                <SaintCard
                  name="Bl. Carlo Acutis"
                  series="Halo Hatchlings"
                  rarity="legendary"
                  number="101"
                  feastDay="October 12"
                  patronage="Youth, the Internet"
                  fact="Built online database of Eucharistic miracles before dying at 15"
                  image="/saints/saint_carlo.png"
                  isLarge
                />
              )}
              
              {activeFilter === 'special' && (
                <SaintCard
                  name="St. Elizabeth Ann Seton"
                  series="Learning Legends"
                  rarity="special"
                  number="015"
                  feastDay="January 4"
                  patronage="Catholic Schools"
                  fact="First American-born saint; founded Catholic schools in the US"
                  image="/saints/saint_elizabeth.png"
                  specialNote="Grade 5 First Book Saint"
                  isLarge
                />
              )}
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-sm mt-6" style={{color: '#223848'}}>
              Click the filters above to see samples of each rarity type!
            </p>
            <p className="text-sm mt-2" style={{color: '#223848'}}>
              234 total saints to discover in the app!
            </p>
          </div>
        </div>
      </section>

      {/* Saint Features */}
      <section className="py-20" style={{backgroundColor: '#F5EBDC'}}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
              Every Saint Includes
            </h3>
            <p className="text-lg max-w-2xl mx-auto" style={{color: '#223848'}}>
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

              <div className="rounded-2xl p-8 text-center" style={{background: 'linear-gradient(to br, #A1E5DB, #ADD4EA)'}}>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden" style={{background: 'linear-gradient(to br, #ADD4EA, #A1E5DB)'}}>
                    <img src="/saints/saint_carlo.png" alt="St. Carlo Acutis" className="w-full h-full object-cover" />
                  </div>
                  <h4 className="font-bold mb-2" style={{color: '#223848'}}>St. Carlo Acutis</h4>
                  <p className="text-sm mb-3" style={{color: '#223848'}}>Halo Hatchlings #112</p>
                  <div className="text-xs space-y-1" style={{color: '#223848'}}>
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
      <section className="py-20 text-white" style={{background: 'linear-gradient(to right, #8b5cf6, #6366f1)'}}>
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
          <h3 className="text-3xl font-bold mb-6" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
            Ready to Start Your Collection?
          </h3>
          <p className="text-xl mb-8 max-w-2xl mx-auto" style={{color: '#223848'}}>
            Join Lux Libris today and begin your journey to collect all 234 saints 
            while building a lifelong love of reading.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/role-selector" 
              className="text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg inline-block"
              style={{backgroundColor: '#A1E5DB'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#8BC4BC'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#A1E5DB'}
            >
              Start Collecting
            </Link>
            
            <Link 
              href="/home/lux-libris-award" 
              className="border-2 hover:text-white px-8 py-4 rounded-full text-lg font-semibold transition-all inline-block"
              style={{borderColor: '#A1E5DB', color: '#A1E5DB'}}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#A1E5DB'
                e.target.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent'
                e.target.style.color = '#A1E5DB'
              }}
            >
              Learn About Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: scale(0.95);
          }
          to { 
            opacity: 1; 
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </Layout>
  )
}

// Supporting Components
function StatBubble({ number, label, color }) {
  const colorClasses = {
    amber: 'bg-amber-100 text-amber-700',
    mint: 'text-white',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700'
  }
  
  const customStyle = color === 'mint' ? { backgroundColor: '#A1E5DB' } : {}
  
  return (
    <div className={`${colorClasses[color]} rounded-2xl px-6 py-4 text-center`} style={customStyle}>
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
      <h4 className="text-lg font-bold mb-2" style={{color: '#223848'}}>{title}</h4>
      <p className="text-sm mb-4" style={{color: '#223848'}}>{description}</p>
      <div className="space-y-2">
        {rewards.map((reward, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span style={{color: '#223848'}}>{reward.days}</span>
            <span className="font-semibold" style={{color: reward.color}}>
              {reward.reward}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SeriesButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full font-semibold transition-all ${
        active 
          ? 'text-white shadow-lg' 
          : 'bg-white shadow hover:bg-slate-50'
      }`}
      style={active ? {backgroundColor: '#A1E5DB'} : {color: '#223848'}}
    >
      {label}
    </button>
  )
}

function SeriesCard({ title, description, badgeImage }) {
  // Map badges to their characteristic colors
  const badgeColors = {
    'mini_marians': 'from-blue-700 to-white',
    'halo_hatchlings': 'from-amber-50 to-white',
    'super_sancti': 'from-red-500 to-blue-500',
    'sacred_circle': 'from-yellow-400 to-blue-500',
    'pocket_patrons': 'from-green-300 to-green-700',
    'cherub_chibis': 'from-gray-400 via-gray-200 to-amber-50',
    'contemplative_cuties': 'from-purple-200 to-purple-500',
    'founder_flames': 'from-orange-300 to-orange-600',
    'apostolic_allstars': 'from-red-300 to-red-600',
    'heavenly_helpers': 'from-sky-200 to-sky-500',
    'learning_legends': 'from-teal-200 to-teal-600',
    'culture_carriers': 'from-emerald-200 to-emerald-600',
    'desert_disciples': 'from-yellow-200 to-yellow-600',
    'regal_royals': 'from-violet-300 to-violet-600',
    'faithful_families': 'from-rose-200 to-rose-500',
    'virtue_vignettes': 'from-lime-200 to-lime-600'
  }
  
  // Extract series name from badge path
  const seriesKey = badgeImage.split('/').pop().replace('.png', '')
  const colorClass = badgeColors[seriesKey] || 'from-gray-100 to-gray-200'
  
  return (
    <div className={`bg-gradient-to-br ${colorClass} rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow`}>
      <div className="mb-4">
        <img 
          src={badgeImage} 
          alt={`${title} badge`}
          className="w-24 h-24 mx-auto object-contain"
        />
      </div>
      <h4 className="text-xl font-bold mb-3" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
        {title}
      </h4>
      <p className="text-sm leading-relaxed" style={{color: '#223848'}}>{description}</p>
    </div>
  )
}

function RarityFilter({ active, onClick, label, color = 'slate' }) {
  const activeClasses = {
    green: 'bg-green-100 text-green-600 shadow-lg scale-105',
    blue: 'bg-blue-100 text-blue-600 shadow-lg scale-105',
    purple: 'bg-purple-100 text-purple-600 shadow-lg scale-105',
    amber: 'bg-amber-100 text-amber-600 shadow-lg scale-105',
    slate: 'bg-slate-100 text-slate-600 shadow-lg scale-105'
  }
  
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full font-semibold transition-all ${
        active 
          ? activeClasses[color]
          : 'bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600'
      }`}
    >
      {label}
    </button>
  )
}

function SaintCard({ name, series, rarity, number, feastDay, patronage, fact, image, specialNote, isLarge }) {
  const rarityColors = {
    common: 'border-green-300 bg-gradient-to-b from-green-50 to-green-100',
    rare: 'border-blue-300 bg-gradient-to-b from-blue-50 to-blue-100',
    legendary: 'border-purple-300 bg-gradient-to-b from-purple-50 to-purple-100',
    special: 'border-amber-300 bg-gradient-to-b from-amber-50 to-amber-100'
  }
  
  const rarityLabels = {
    common: 'Common',
    rare: 'Rare',
    legendary: 'Legendary',
    special: 'Special Edition'
  }
  
  const cardSize = isLarge ? 'max-w-md p-8' : 'p-6'
  const imageSize = isLarge ? 'w-48 h-48' : 'w-36 h-36'
  const textSize = isLarge ? 'text-2xl' : 'text-lg'
  
  return (
    <div className={`${rarityColors[rarity]} border-2 rounded-xl ${cardSize} text-center hover:scale-105 transition-transform cursor-pointer shadow-lg`}>
      <div className="mb-3">
        <span className={`${isLarge ? 'text-sm' : 'text-xs'} font-semibold px-3 py-1 rounded-full ${
          rarity === 'common' ? 'bg-green-200 text-green-800' :
          rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
          rarity === 'legendary' ? 'bg-purple-200 text-purple-800' :
          'bg-amber-200 text-amber-800'
        }`}>
          {rarityLabels[rarity]}
        </span>
      </div>
      
      {specialNote && (
        <div className="mb-2">
          <span className={`${isLarge ? 'text-sm' : 'text-xs'} font-bold px-2 py-1 rounded bg-white/50`} style={{color: '#223848'}}>
            {specialNote}
          </span>
        </div>
      )}
      
      {image ? (
        <img 
          src={image} 
          alt={name} 
          className={`${imageSize} mx-auto mb-4 object-contain`}
          style={{imageRendering: 'crisp-edges'}}
        />
      ) : (
        <div className="text-6xl mb-4">⛪</div>
      )}
      
      <p className={`${isLarge ? 'text-sm' : 'text-xs'} font-mono mb-1`} style={{color: '#223848'}}>#{number}</p>
      <h5 className={`font-bold ${textSize} mb-1`} style={{color: '#223848'}}>{name}</h5>
      <p className={`${isLarge ? 'text-base' : 'text-sm'} italic mb-2`} style={{color: '#223848'}}>{series}</p>
      
      <div className={`${isLarge ? 'text-sm' : 'text-xs'} space-y-1 mt-3 pt-3 border-t`} style={{borderColor: 'rgba(0,0,0,0.1)'}}>
        <p style={{color: '#223848'}}>📅 <strong>Feast:</strong> {feastDay}</p>
        <p style={{color: '#223848'}}>🛡️ <strong>Patron of:</strong> {patronage}</p>
        <p className={`mt-2 ${isLarge ? 'text-sm' : 'text-xs'} leading-relaxed`} style={{color: '#223848'}}>{fact}</p>
      </div>
    </div>
  )
}

function FeatureItem({ icon, title, description }) {
  return (
    <div className="flex items-start space-x-4">
      <div className="text-2xl mt-1">{icon}</div>
      <div>
        <h4 className="font-semibold mb-1" style={{color: '#223848'}}>{title}</h4>
        <p className="text-sm" style={{color: '#223848'}}>{description}</p>
      </div>
    </div>
  )
}