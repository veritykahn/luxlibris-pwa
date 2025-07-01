import { useState, useEffect } from 'react'
import Head from 'next/head'
import { db } from '../../lib/firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore'

export default function GodModeAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  
  // Diocese and School Management
  const [dioceses, setDioceses] = useState([])
  const [schools, setSchools] = useState([])
  const [showCreateDiocese, setShowCreateDiocese] = useState(false)
  const [showCreateSchool, setShowCreateSchool] = useState(false)
  
  const [newDiocese, setNewDiocese] = useState({
    name: '',
    location: '',
    adminCode: ''
  })
  
  const [newSchool, setNewSchool] = useState({
    name: '',
    city: '',
    state: '',
    email: '',
    dioceseId: '',
    adminEmail: '',
    adminPassword: ''
  })
  
  const [globalStats, setGlobalStats] = useState({
    totalDioceses: 0,
    totalSchools: 0,
    activeSchools: 0,
    totalStudents: 0,
    booksRead: 0,
    saintsEarned: 0,
    activeReadingSessions: 0
  })

  const [nominees, setNominees] = useState([])

  // God Mode Password Protection
  const handleLogin = () => {
    if (password === 'LUXLIBRIS-GOD-2025') {
      setIsAuthenticated(true)
    } else {
      alert('Invalid God Mode password')
    }
  }

  // Fetch data from Firebase
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData()
    }
  }, [isAuthenticated])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchDioceses(),
        fetchNominees()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
    setLoading(false)
  }

  const fetchDioceses = async () => {
    try {
      const diocesesRef = collection(db, 'dioceses')
      const snapshot = await getDocs(diocesesRef)
      const diocesesData = []
      
      for (const dioceseDoc of snapshot.docs) {
        const dioceseData = {
          id: dioceseDoc.id,
          ...dioceseDoc.data()
        }
        
        // Fetch schools for this diocese
        const schoolsRef = collection(db, `dioceses/${dioceseDoc.id}/schools`)
        const schoolsSnapshot = await getDocs(schoolsRef)
        dioceseData.schools = schoolsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        diocesesData.push(dioceseData)
      }
      
      setDioceses(diocesesData)
      
      // Update global stats
      const totalSchools = diocesesData.reduce((sum, diocese) => sum + diocese.schools.length, 0)
      setGlobalStats(prev => ({
        ...prev,
        totalDioceses: diocesesData.length,
        totalSchools: totalSchools,
        activeSchools: totalSchools // For now, assume all are active
      }))
    } catch (error) {
      console.error('Error fetching dioceses:', error)
    }
  }

  const fetchNominees = async () => {
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
    } catch (error) {
      console.error('Error fetching nominees:', error)
    }
  }

  // Generate unique admin code
  const generateAdminCode = (dioceseName, location) => {
    const diocesePrefix = dioceseName.substring(0, 3).toUpperCase()
    const locationPrefix = location.substring(0, 3).toUpperCase()
    const year = new Date().getFullYear()
    return `${diocesePrefix}-${locationPrefix}-ADMIN-${year}`
  }

  // Create new diocese
  const handleCreateDiocese = async () => {
    if (!newDiocese.name || !newDiocese.location) {
      alert('Please fill in all fields')
      return
    }

    const adminCode = generateAdminCode(newDiocese.name, newDiocese.location)
    
    try {
      setLoading(true)
      const dioceseData = {
        name: newDiocese.name,
        location: newDiocese.location,
        adminCode: adminCode,
        createdAt: new Date(),
        createdBy: 'Dr. Verity Kahn',
        status: 'active'
      }
      
      await addDoc(collection(db, 'dioceses'), dioceseData)
      
      alert(`Diocese created successfully!\nAdmin Code: ${adminCode}`)
      setNewDiocese({ name: '', location: '', adminCode: '' })
      setShowCreateDiocese(false)
      fetchDioceses()
    } catch (error) {
      console.error('Error creating diocese:', error)
      alert('Error creating diocese')
    }
    setLoading(false)
  }

  // Generate school codes
  const generateSchoolCodes = (schoolName) => {
    const schoolPrefix = schoolName.replace(/[^A-Za-z]/g, '').substring(0, 4).toUpperCase()
    const year = new Date().getFullYear()
    
    return {
      studentAccessCode: `${schoolPrefix}-STUDENT-${year}`,
      parentQuizCode: `${schoolPrefix}-PARENT-${year}`
    }
  }

  // Create new school
  const handleCreateSchool = async () => {
    if (!newSchool.name || !newSchool.dioceseId || !newSchool.adminEmail || !newSchool.adminPassword) {
      alert('Please fill in all required fields')
      return
    }

    const codes = generateSchoolCodes(newSchool.name)
    
    try {
      setLoading(true)
      const schoolData = {
        name: newSchool.name,
        city: newSchool.city,
        state: newSchool.state,
        email: newSchool.email,
        adminEmail: newSchool.adminEmail,
        adminPassword: newSchool.adminPassword, // In production, this should be hashed
        studentAccessCode: codes.studentAccessCode,
        parentQuizCode: codes.parentQuizCode,
        createdAt: new Date(),
        status: 'active',
        selectedNominees: [], // Will be filled during admin onboarding
        achievementTiers: {}, // Will be configured during admin onboarding
        submissionOptions: [] // Will be configured during admin onboarding
      }
      
      // Add school to the specific diocese's schools subcollection
      const schoolRef = collection(db, `dioceses/${newSchool.dioceseId}/schools`)
      await addDoc(schoolRef, schoolData)
      
      alert(`School created successfully!\nStudent Access Code: ${codes.studentAccessCode}\nParent Quiz Code: ${codes.parentQuizCode}\nAdmin Email: ${newSchool.adminEmail}\nAdmin Password: ${newSchool.adminPassword}`)
      
      setNewSchool({ name: '', city: '', state: '', email: '', dioceseId: '', adminEmail: '', adminPassword: '' })
      setShowCreateSchool(false)
      fetchDioceses()
    } catch (error) {
      console.error('Error creating school:', error)
      alert('Error creating school')
    }
    setLoading(false)
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>GOD MODE - Authentication Required</title>
        </Head>
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            textAlign: 'center',
            minWidth: '400px'
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1rem'
            }}>
              👑
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 0.5rem',
              fontFamily: 'Georgia, serif'
            }}>
              GOD MODE
            </h1>
            <p style={{
              color: '#c084fc',
              marginBottom: '2rem'
            }}>
              Supreme Administrator Access Required
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="password"
                placeholder="Enter God Mode Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>
            <button
              onClick={handleLogin}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🚀 ENTER GOD MODE
            </button>
            <p style={{
              color: '#6b7280',
              fontSize: '0.75rem',
              marginTop: '1rem'
            }}>
              For Dr. Verity Kahn only
            </p>
          </div>
        </div>
      </>
    )
  }

  // Main God Mode Interface (same header as before)
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
              title="Dioceses" 
              value={globalStats.totalDioceses} 
              subtitle="Active regions"
              icon="⛪" 
              color="linear-gradient(135deg, #8b5cf6, #a855f7)"
            />
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
              { id: 'dioceses', label: 'Dioceses', icon: '⛪' },
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
            
            {!loading && activeTab === 'overview' && <OverviewTab nominees={nominees} dioceses={dioceses} />}
            {!loading && activeTab === 'dioceses' && <DiocesesTab dioceses={dioceses} showCreateDiocese={showCreateDiocese} setShowCreateDiocese={setShowCreateDiocese} newDiocese={newDiocese} setNewDiocese={setNewDiocese} handleCreateDiocese={handleCreateDiocese} />}
            {!loading && activeTab === 'schools' && <SchoolsTab dioceses={dioceses} showCreateSchool={showCreateSchool} setShowCreateSchool={setShowCreateSchool} newSchool={newSchool} setNewSchool={setNewSchool} handleCreateSchool={handleCreateSchool} />}
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

// Enhanced component functions with new functionality
function DiocesesTab({ dioceses, showCreateDiocese, setShowCreateDiocese, newDiocese, setNewDiocese, handleCreateDiocese }) {
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
          Diocese Management
        </h2>
        <ActionButton text="+ Create Diocese" onClick={() => setShowCreateDiocese(true)} />
      </div>

      {showCreateDiocese && (
        <div style={{
          background: 'rgba(168, 85, 247, 0.2)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(168, 85, 247, 0.3)'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Create New Diocese
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Diocese Name (e.g., Diocese of Test)"
              value={newDiocese.name}
              onChange={(e) => setNewDiocese({...newDiocese, name: e.target.value})}
              style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'white'
              }}
            />
            <input
              type="text"
              placeholder="Location (e.g., Demo City, TX)"
              value={newDiocese.location}
              onChange={(e) => setNewDiocese({...newDiocese, location: e.target.value})}
              style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'white'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <ActionButton text="✅ Create Diocese" onClick={handleCreateDiocese} />
            <ActionButton text="❌ Cancel" onClick={() => setShowCreateDiocese(false)} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {dioceses.map(diocese => (
          <div key={diocese.id} style={{
            background: 'rgba(139, 92, 246, 0.2)',
            borderRadius: '0.5rem',
            padding: '1rem',
            border: '1px solid rgba(139, 92, 246, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '0.5rem'
            }}>
              <div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 'bold',
                  marginBottom: '0.25rem'
                }}>
                  ⛪ {diocese.name}
                </h3>
                <p style={{ color: '#c084fc', margin: '0.25rem 0' }}>
                  📍 {diocese.location}
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#a78bfa',
                  margin: '0.25rem 0'
                }}>
                  🔑 Admin Code: <strong>{diocese.adminCode}</strong>
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#a78bfa',
                  margin: 0
                }}>
                  🏫 {diocese.schools?.length || 0} schools
                </p>
              </div>
            </div>
            
            {diocese.schools && diocese.schools.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#e879f9' }}>
                  Schools in this Diocese:
                </h4>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {diocese.schools.map(school => (
                    <div key={school.id} style={{
                      background: 'rgba(59, 130, 246, 0.2)',
                      borderRadius: '0.375rem',
                      padding: '0.75rem',
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontWeight: '600', margin: 0 }}>🏫 {school.name}</p>
                          <p style={{ fontSize: '0.875rem', color: '#93c5fd', margin: '0.25rem 0' }}>
                            📧 {school.adminEmail} | 🔑 {school.studentAccessCode}
                          </p>
                        </div>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          background: 'rgba(34, 197, 94, 0.3)',
                          color: '#86efac'
                        }}>
                          {school.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {dioceses.length === 0 && (
        <div style={{ textAlign: 'center', color: '#c084fc', padding: '2rem' }}>
          <p>No dioceses created yet. Create your first diocese above!</p>
        </div>
      )}
    </div>
  )
}

function SchoolsTab({ dioceses, showCreateSchool, setShowCreateSchool, newSchool, setNewSchool, handleCreateSchool }) {
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
        <ActionButton text="+ Create School" onClick={() => setShowCreateSchool(true)} />
      </div>

      {showCreateSchool && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.2)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Create New School
          </h3>
          
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
            <select
              value={newSchool.dioceseId}
              onChange={(e) => setNewSchool({...newSchool, dioceseId: e.target.value})}
              style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'white'
              }}
            >
              <option value="">Select Diocese</option>
              {dioceses.map(diocese => (
                <option key={diocese.id} value={diocese.id}>{diocese.name}</option>
              ))}
            </select>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <input
                type="text"
                placeholder="School Name"
                value={newSchool.name}
                onChange={(e) => setNewSchool({...newSchool, name: e.target.value})}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: 'white'
                }}
              />
              <input
                type="text"
                placeholder="City"
                value={newSchool.city}
                onChange={(e) => setNewSchool({...newSchool, city: e.target.value})}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: 'white'
                }}
              />
              <input
                type="text"
                placeholder="State"
                value={newSchool.state}
                onChange={(e) => setNewSchool({...newSchool, state: e.target.value})}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: 'white'
                }}
              />
            </div>
            
            <input
              type="email"
              placeholder="School Email"
              value={newSchool.email}
              onChange={(e) => setNewSchool({...newSchool, email: e.target.value})}
              style={{
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'white'
              }}
            />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input
                type="email"
                placeholder="Admin Email"
                value={newSchool.adminEmail}
                onChange={(e) => setNewSchool({...newSchool, adminEmail: e.target.value})}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: 'white'
                }}
              />
              <input
                type="password"
                placeholder="Admin Password"
                value={newSchool.adminPassword}
                onChange={(e) => setNewSchool({...newSchool, adminPassword: e.target.value})}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: 'white'
                }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <ActionButton text="✅ Create School" onClick={handleCreateSchool} />
            <ActionButton text="❌ Cancel" onClick={() => setShowCreateSchool(false)} />
          </div>
        </div>
      )}

      {/* Display all schools from all dioceses */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {dioceses.map(diocese => 
          diocese.schools?.map(school => (
            <div key={`${diocese.id}-${school.id}`} style={{
              background: 'rgba(59, 130, 246, 0.2)',
              borderRadius: '0.5rem',
              padding: '1rem',
              border: '1px solid rgba(59, 130, 246, 0.3)'
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
                    🏫 {school.name}
                  </h3>
                  <p style={{ color: '#93c5fd', margin: '0.25rem 0' }}>
                    📍 {school.city}, {school.state} | ⛪ {diocese.name}
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#a78bfa',
                    margin: '0.25rem 0'
                  }}>
                    📧 Admin: {school.adminEmail}
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#a78bfa',
                    margin: 0
                  }}>
                    🔑 Student Code: <strong>{school.studentAccessCode}</strong> | 
                    🧩 Parent Code: <strong>{school.parentQuizCode}</strong>
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    background: 'rgba(34, 197, 94, 0.3)',
                    color: '#86efac'
                  }}>
                    {school.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {dioceses.every(diocese => !diocese.schools || diocese.schools.length === 0) && (
        <div style={{ textAlign: 'center', color: '#c084fc', padding: '2rem' }}>
          <p>No schools created yet. Create your first school above!</p>
        </div>
      )}
    </div>
  )
}

// Keep existing components with small updates
function OverviewTab({ nominees, dioceses }) {
  const totalSchools = dioceses.reduce((sum, diocese) => sum + (diocese.schools?.length || 0), 0)
  
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
            <StatusRow label="Dioceses" value={`${dioceses.length} active`} />
            <StatusRow label="Schools" value={`${totalSchools} schools`} />
            <StatusRow label="Master Nominees" value={`${nominees.length} loaded`} />
            <StatusRow label="Firebase" value="✅ Connected" />
            <StatusRow label="Domain" value="✅ luxlibris.org LIVE!" />
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
            <StatusRow label="Ready for Launch" value="🚀 Test Phase Active" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Keep all other existing components (NomineesTab, SaintsTab, etc.) the same
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
            <StatusRow label="Trophy Shelves" value="20 shelves" />
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