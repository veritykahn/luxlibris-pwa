import { useState, useEffect } from 'react'
import Head from 'next/head'
import { db } from '../../lib/firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'

export default function GodModeAdmin() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [schools, setSchools] = useState([
    { id: 1, name: 'Holy Family Catholic School', city: 'Austin', state: 'TX', students: 45, active: true },
  ])
  
  const [globalStats, setGlobalStats] = useState({
    totalSchools: 1,
    activeSchools: 1,
    totalStudents: 45,
    booksRead: 0,
    saintsEarned: 0,
    activeReadingSessions: 0
  })

  const [nominees, setNominees] = useState([])

  // Fetch nominees from Firebase
  useEffect(() => {
    fetchNominees()
  }, [])

  const fetchNominees = async () => {
    setLoading(true)
    try {
      const nomineesRef = collection(db, 'masterNominees')
      const snapshot = await getDocs(nomineesRef)
      const nomineesData = []
      
      snapshot.forEach((doc) => {
        nomineesData.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      setNominees(nomineesData)
      setGlobalStats(prev => ({
        ...prev,
        totalNominees: nomineesData.length
      }))
    } catch (error) {
      console.error('Error fetching nominees:', error)
    }
    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>GOD MODE - Lux Libris Master Admin</title>
        <meta name="description" content="Master Admin Control Center for Lux Libris" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        
        {/* Header */}
        <header style={{
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(168, 85, 247, 0.3)',
          padding: '1rem 0'
        }}>
          <div style={{
            maxWidth: '80rem',
            margin: '0 auto',
            padding: '0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                👑
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: 0,
                  fontFamily: 'Georgia, serif'
                }}>
                  GOD MODE
                </h1>
                <p style={{
                  color: '#c084fc',
                  fontSize: '0.875rem',
                  margin: 0
                }}>
                  Master Admin Control Center
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{
                  color: 'white',
                  fontWeight: '600',
                  margin: 0,
                  fontFamily: 'Georgia, serif'
                }}>
                  Dr. Verity Kahn
                </p>
                <p style={{
                  color: '#c084fc',
                  fontSize: '0.875rem',
                  margin: 0
                }}>
                  Supreme Administrator
                </p>
              </div>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                background: 'linear-gradient(135deg, #14b8a6, #3b82f6)',
                borderRadius: '50%'
              }}></div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '2rem 1.5rem'
        }}>
          
          {/* Global Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <StatCard 
              title="Schools" 
              value={globalStats.totalSchools} 
              subtitle={`${globalStats.activeSchools} active`}
              icon="🏫" 
              color="linear-gradient(135deg, #3b82f6, #06b6d4)"
            />
            <StatCard 
              title="Students" 
              value={globalStats.totalStudents} 
              subtitle="Total enrolled"
              icon="👥" 
              color="linear-gradient(135deg, #10b981, #059669)"
            />
            <StatCard 
              title="Nominees" 
              value={nominees.length} 
              subtitle="2025-26 list"
              icon="📚" 
              color="linear-gradient(135deg, #a855f7, #8b5cf6)"
            />
            <StatCard 
              title="Books Read" 
              value={globalStats.booksRead} 
              subtitle="This year"
              icon="📖" 
              color="linear-gradient(135deg, #059669, #047857)"
            />
            <StatCard 
              title="Saints Earned" 
              value={globalStats.saintsEarned} 
              subtitle="Total achievements"
              icon="⭐" 
              color="linear-gradient(135deg, #f59e0b, #d97706)"
            />
            <StatCard 
              title="Active Sessions" 
              value={globalStats.activeReadingSessions} 
              subtitle="Reading now"
              icon="🔥" 
              color="linear-gradient(135deg, #ef4444, #dc2626)"
            />
          </div>

          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '2rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '0.5rem',
            padding: '0.5rem'
          }}>
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'schools', label: 'Schools', icon: '🏫' },
              { id: 'nominees', label: 'Nominees', icon: '📚' },
              { id: 'saints', label: 'Saints', icon: '👼' },
              { id: 'analytics', label: 'Analytics', icon: '📈' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  background: activeTab === tab.id 
                    ? 'linear-gradient(135deg, #a855f7, #ec4899)' 
                    : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#c084fc',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.875rem'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.background = 'rgba(168, 85, 247, 0.2)'
                    e.target.style.color = 'white'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.background = 'transparent'
                    e.target.style.color = '#c084fc'
                  }
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(168, 85, 247, 0.3)'
          }}>
            {loading && (
              <div style={{ textAlign: 'center', color: 'white', padding: '2rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                <p>Loading your empire data...</p>
              </div>
            )}
            
            {!loading && activeTab === 'overview' && <OverviewTab nominees={nominees} />}
            {!loading && activeTab === 'schools' && <SchoolsTab schools={schools} setSchools={setSchools} />}
            {!loading && activeTab === 'nominees' && <NomineesTab nominees={nominees} setNominees={setNominees} />}
            {!loading && activeTab === 'saints' && <SaintsTab />}
            {!loading && activeTab === 'analytics' && <AnalyticsTab />}
            {!loading && activeTab === 'settings' && <SettingsTab />}
          </div>
        </div>
      </div>
    </>
  )
}

function StatCard({ title, value, subtitle, icon, color }) {
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(8px)',
      borderRadius: '0.5rem',
      padding: '1rem',
      border: '1px solid rgba(168, 85, 247, 0.3)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.5rem'
      }}>
        <div style={{
          width: '2rem',
          height: '2rem',
          borderRadius: '50%',
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.875rem'
        }}>
          {icon}
        </div>
      </div>
      <div style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: 'white',
        marginBottom: '0.25rem'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: '#c084fc'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: '#a78bfa'
      }}>
        {subtitle}
      </div>
    </div>
  )
}

function OverviewTab({ nominees }) {
  return (
    <div style={{ color: 'white' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          fontFamily: 'Georgia, serif'
        }}>
          Welcome to GOD MODE
        </h2>
        <p style={{
          color: '#c084fc',
          fontSize: '1.125rem'
        }}>
          Complete control over the Lux Libris reading revolution
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid rgba(168, 85, 247, 0.3)'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            fontFamily: 'Georgia, serif'
          }}>
            🚀 Your Empire Status
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <StatusRow label="Master Nominees" value={`${nominees.length} loaded`} />
            <StatusRow label="Firebase" value="✅ Connected" />
            <StatusRow label="Domain" value="✅ luxlibris.org LIVE!" />
            <StatusRow label="Pilot School" value="Holy Family ready" />
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2))',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            fontFamily: 'Georgia, serif'
          }}>
            📈 System Health
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <StatusRow label="Server Status" value="✅ Online" />
            <StatusRow label="Database" value="✅ Connected" />
            <StatusRow label="Domain DNS" value="✅ Propagated" />
            <StatusRow label="Ready for Launch" value="🚀 September 1st" />
          </div>
        </div>
      </div>
    </div>
  )
}

function SchoolsTab({ schools, setSchools }) {
  return (
    <div style={{ color: 'white' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          fontFamily: 'Georgia, serif'
        }}>
          School Management
        </h2>
        <ActionButton text="+ Add School" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {schools.map(school => (
          <div key={school.id} style={{
            background: 'rgba(168, 85, 247, 0.2)',
            borderRadius: '0.5rem',
            padding: '1rem',
            border: '1px solid rgba(168, 85, 247, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 'bold',
                  marginBottom: '0.25rem'
                }}>
                  {school.name}
                </h3>
                <p style={{ color: '#c084fc', margin: '0.25rem 0' }}>
                  {school.city}, {school.state}
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#a78bfa',
                  margin: 0
                }}>
                  {school.students} students enrolled
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  background: school.active ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                  color: school.active ? '#86efac' : '#fca5a5'
                }}>
                  {school.active ? 'Active' : 'Inactive'}
                </span>
                <button style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#c084fc',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}>
                  ⚙️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NomineesTab({ nominees, setNominees }) {
  return (
    <div style={{ color: 'white' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          fontFamily: 'Georgia, serif'
        }}>
          Master Nominee List 2025-26
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <ActionButton text="+ Add Book" />
          <ActionButton text="🔄 Refresh" />
        </div>
      </div>

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1rem'
      }}>
        {nominees.map(book => (
          <div key={book.id} style={{
            background: 'rgba(59, 130, 246, 0.2)',
            borderRadius: '0.5rem',
            padding: '1rem',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              gap: '1rem'
            }}>
              {book.coverImageUrl && (
                <img 
                  src={book.coverImageUrl} 
                  alt={book.title}
                  style={{
                    width: '60px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '4px'
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  marginBottom: '0.25rem'
                }}>
                  {book.title}
                </h3>
                <p style={{ color: '#93c5fd', margin: '0.25rem 0', fontSize: '0.875rem' }}>
                  by {book.authors}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    background: 'rgba(59, 130, 246, 0.3)',
                    color: '#93c5fd',
                    fontSize: '0.75rem',
                    borderRadius: '0.25rem'
                  }}>
                    {book.displayCategory?.replace('📚 ', '')}
                  </span>
                  {book.isAudiobook && (
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      background: 'rgba(34, 197, 94, 0.3)',
                      color: '#86efac',
                      fontSize: '0.75rem',
                      borderRadius: '0.25rem'
                    }}>
                      🔊 Audiobook
                    </span>
                  )}
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    background: 'rgba(168, 85, 247, 0.3)',
                    color: '#c084fc',
                    fontSize: '0.75rem',
                    borderRadius: '0.25rem'
                  }}>
                    {book.gradeLevels}
                  </span>
                </div>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#a78bfa',
                  marginTop: '0.5rem',
                  lineHeight: '1.4'
                }}>
                  {book.luxLibrisReview?.substring(0, 100)}...
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {nominees.length === 0 && (
        <div style={{ textAlign: 'center', color: '#c084fc', padding: '2rem' }}>
          <p>No nominees found. Check your Firebase connection.</p>
        </div>
      )}
    </div>
  )
}

function SaintsTab() {
  return (
    <div style={{ color: 'white' }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
        fontFamily: 'Georgia, serif'
      }}>
        Saint Achievement System
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        <div style={{
          background: 'rgba(245, 158, 11, 0.2)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid rgba(245, 158, 11, 0.3)'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}>
            📊 Saint Statistics
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <StatusRow label="Total Saints" value="137" />
            <StatusRow label="Ultimate Unlock" value="Jesus ✨" />
            <StatusRow label="Trophy Shelves" value="23 shelves" />
            <StatusRow label="Categories" value="Common, Rare, Liturgical" />
          </div>
        </div>

        <div style={{
          background: 'rgba(34, 197, 94, 0.2)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid rgba(34, 197, 94, 0.3)'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}>
            🏆 Achievement Tiers
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <StatusRow label="7-day streak" value="Common Saint" />
            <StatusRow label="30-day streak" value="Rare Saint" />
            <StatusRow label="5/10/15/20 books" value="Liturgical Saints" />
            <StatusRow label="100 books total" value="Jesus ✨" />
          </div>
        </div>
      </div>
    </div>
  )
}

function AnalyticsTab() {
  return (
    <div style={{ color: 'white', textAlign: 'center' }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
        fontFamily: 'Georgia, serif'
      }}>
        Global Analytics
      </h2>
      <div style={{ color: '#c084fc' }}>
        <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
          📊 Analytics dashboard coming next!
        </p>
        <p style={{ fontSize: '0.875rem' }}>
          Real-time reading data, engagement metrics, and school comparisons
        </p>
      </div>
    </div>
  )
}

function SettingsTab() {
  return (
    <div style={{ color: 'white', textAlign: 'center' }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
        fontFamily: 'Georgia, serif'
      }}>
        System Settings
      </h2>
      <div style={{ color: '#c084fc' }}>
        <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
          ⚙️ Global system configuration
        </p>
        <p style={{ fontSize: '0.875rem' }}>
          Backup settings, notification preferences, and system maintenance
        </p>
      </div>
    </div>
  )
}

function ActionButton({ text, onClick }) {
  return (
    <button 
      onClick={onClick}
      style={{
        background: '#7c3aed',
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.875rem',
        transition: 'background 0.2s'
      }}
      onMouseEnter={(e) => e.target.style.background = '#6d28d9'}
      onMouseLeave={(e) => e.target.style.background = '#7c3aed'}
    >
      {text}
    </button>
  )
}

function StatusRow({ label, value }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '0.875rem'
    }}>
      <span style={{ color: '#c084fc' }}>{label}</span>
      <span style={{ color: '#60a5fa' }}>{value}</span>
    </div>
  )
}