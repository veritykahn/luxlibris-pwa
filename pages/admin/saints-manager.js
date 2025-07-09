// pages/admin/saints-manager.js - Enhanced saints management
import { useState, useEffect } from 'react'
import Head from 'next/head'
import saintsManager from '../../enhanced-saints-manager'

export default function SaintsManagerPage() {
  const [activeTab, setActiveTab] = useState('bulk')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState(null)
  const [newSaintForm, setNewSaintForm] = useState({
    name: '',
    patronage: '',
    feast_day: '',
    short_blurb: '',
    extra_fact: '',
    rarity: 'common',
    unlockCondition: 'streak_7_days',
    luxlings_series: 'Super Sancti'
  })

  // Load current stats on page load
  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const currentStats = await saintsManager.getSaintsStats()
    setStats(currentStats)
  }

  // Capture console logs
  const originalLog = console.log
  const originalError = console.error

  const runOperation = async (operation) => {
    setIsRunning(true)
    setResult(null)
    setLogs([])

    // Capture logs
    const capturedLogs = []
    console.log = (...args) => {
      capturedLogs.push({ type: 'log', message: args.join(' '), time: new Date().toLocaleTimeString() })
      setLogs([...capturedLogs])
      originalLog(...args)
    }
    
    console.error = (...args) => {
      capturedLogs.push({ type: 'error', message: args.join(' '), time: new Date().toLocaleTimeString() })
      setLogs([...capturedLogs])
      originalError(...args)
    }

    try {
      let setupResult
      
      switch (operation) {
        case 'bulk':
          console.log('🚀 Starting bulk saints setup...')
          setupResult = await saintsManager.setupAllSaints()
          break
          
        case 'addNew':
          console.log('➕ Adding new saints only...')
          setupResult = await saintsManager.addNewSaintsOnly()
          break
          
        case 'addSingle':
          console.log('➕ Adding single saint...')
          const nextId = await saintsManager.getNextSaintId()
          const saintData = { ...newSaintForm, id: nextId }
          setupResult = await saintsManager.addSingleSaint(saintData)
          if (setupResult.success) {
            setNewSaintForm({
              name: '',
              patronage: '',
              feast_day: '',
              short_blurb: '',
              extra_fact: '',
              rarity: 'common',
              unlockCondition: 'streak_7_days',
              luxlings_series: 'Super Sancti'
            })
          }
          break
          
        default:
          throw new Error('Unknown operation')
      }
      
      setResult(setupResult)
      
      if (setupResult.success) {
        console.log('✅ Operation completed successfully!')
        await loadStats() // Refresh stats
      } else {
        console.error('❌ Operation failed:', setupResult.message)
      }
    } catch (error) {
      console.error('❌ Error during operation:', error.message)
      setResult({ success: false, message: error.message })
    }

    // Restore original console methods
    console.log = originalLog
    console.error = originalError
    setIsRunning(false)
  }

  const handleFormChange = (field, value) => {
    setNewSaintForm(prev => ({ ...prev, [field]: value }))
  }

  const tabs = [
    { id: 'bulk', name: 'Bulk Setup', icon: '🏗️' },
    { id: 'addNew', name: 'Add New Saints', icon: '➕' },
    { id: 'addSingle', name: 'Add Single Saint', icon: '👤' },
    { id: 'stats', name: 'Statistics', icon: '📊' }
  ]

  return (
    <>
      <Head>
        <title>Saints Manager - Lux Libris</title>
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #7c3aed 50%, #0f172a 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto'
        }}>
          
          {/* Header */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #7c3aed, #fbbf24)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1rem'
            }}>
              👼
            </div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 1rem',
              fontFamily: 'Georgia, serif'
            }}>
              Saints Collection Manager
            </h1>
            <p style={{
              color: '#c4b5fd',
              fontSize: '1.125rem',
              marginBottom: '0'
            }}>
              Future-ready system for managing saints collection
            </p>
            
            {stats && (
              <div style={{
                background: 'rgba(124, 58, 237, 0.2)',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginTop: '1rem',
                display: 'inline-block'
              }}>
                <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                  Current Collection: {stats.total} Saints
                </span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '1rem',
            padding: '1rem',
            marginBottom: '2rem',
            border: '1px solid rgba(124, 58, 237, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: activeTab === tab.id 
                      ? 'linear-gradient(135deg, #7c3aed, #fbbf24)'
                      : 'rgba(124, 58, 237, 0.2)',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  {tab.icon} {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            marginBottom: '2rem'
          }}>
            
            {/* Bulk Setup Tab */}
            {activeTab === 'bulk' && (
              <div>
                <h3 style={{ color: '#fbbf24', marginBottom: '1rem', fontSize: '1.5rem' }}>
                  🏗️ Bulk Saints Setup
                </h3>
                <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                  Replace entire saints collection with complete catalog (existing + new saints).
                  Use this for major updates or initial setup.
                </p>
                
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '2rem'
                }}>
                  <strong style={{ color: '#ef4444' }}>⚠️ Warning:</strong>
                  <span style={{ color: '#fca5a5' }}> This overwrites your entire saints collection.</span>
                </div>
                
                <button
                  onClick={() => runOperation('bulk')}
                  disabled={isRunning}
                  style={{
                    background: isRunning 
                      ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                      : 'linear-gradient(135deg, #7c3aed, #fbbf24)',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                    fontSize: '1.125rem',
                    fontWeight: '600'
                  }}
                >
                  {isRunning ? '⏳ Processing...' : '🚀 Run Bulk Setup'}
                </button>
              </div>
            )}

            {/* Add New Saints Tab */}
            {activeTab === 'addNew' && (
              <div>
                <h3 style={{ color: '#fbbf24', marginBottom: '1rem', fontSize: '1.5rem' }}>
                  ➕ Add New Saints Only
                </h3>
                <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                  Add only new saints from the NEW_SAINTS_TO_ADD array. 
                  Skips saints that already exist. Perfect for updates!
                </p>
                
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '2rem'
                }}>
                  <strong style={{ color: '#10b981' }}>✅ Safe:</strong>
                  <span style={{ color: '#a7f3d0' }}> Only adds new saints, existing saints unchanged.</span>
                </div>
                
                <button
                  onClick={() => runOperation('addNew')}
                  disabled={isRunning}
                  style={{
                    background: isRunning 
                      ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                      : 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                    fontSize: '1.125rem',
                    fontWeight: '600'
                  }}
                >
                  {isRunning ? '⏳ Adding...' : '➕ Add New Saints'}
                </button>
              </div>
            )}

            {/* Add Single Saint Tab */}
            {activeTab === 'addSingle' && (
              <div>
                <h3 style={{ color: '#fbbf24', marginBottom: '1rem', fontSize: '1.5rem' }}>
                  👤 Add Single Saint
                </h3>
                <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                  Add one saint manually with custom data. Perfect for quick additions!
                </p>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  <div>
                    <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                      Saint Name *
                    </label>
                    <input
                      type="text"
                      value={newSaintForm.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder="St. Example Saint"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(124, 58, 237, 0.3)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'white'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                      Patronage *
                    </label>
                    <input
                      type="text"
                      value={newSaintForm.patronage}
                      onChange={(e) => handleFormChange('patronage', e.target.value)}
                      placeholder="Travelers, Students"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(124, 58, 237, 0.3)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'white'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                      Feast Day *
                    </label>
                    <input
                      type="text"
                      value={newSaintForm.feast_day}
                      onChange={(e) => handleFormChange('feast_day', e.target.value)}
                      placeholder="March 15"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(124, 58, 237, 0.3)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'white'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                      Rarity *
                    </label>
                    <select
                      value={newSaintForm.rarity}
                      onChange={(e) => handleFormChange('rarity', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(124, 58, 237, 0.3)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'white'
                      }}
                    >
                      <option value="common">Common</option>
                      <option value="rare">Rare</option>
                      <option value="legendary">Legendary</option>
                      <option value="seasonal">Seasonal</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                      Unlock Condition *
                    </label>
                    <select
                      value={newSaintForm.unlockCondition}
                      onChange={(e) => handleFormChange('unlockCondition', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(124, 58, 237, 0.3)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'white'
                      }}
                    >
                      <option value="streak_7_days">7-Day Streak</option>
                      <option value="streak_30_days">30-Day Streak</option>
                      <option value="streak_90_days">90-Day Streak</option>
                      <option value="milestone_20_books">20 Books</option>
                      <option value="milestone_100_books">100 Books</option>
                      <option value="seasonal_feast_day">Seasonal/Feast Day</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                      Luxlings Series
                    </label>
                    <select
                      value={newSaintForm.luxlings_series}
                      onChange={(e) => handleFormChange('luxlings_series', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(124, 58, 237, 0.3)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'white'
                      }}
                    >
                      <option value="Super Sancti">Super Sancti</option>
                      <option value="Pocket Patrons">Pocket Patrons</option>
                      <option value="Founder Flames">Founder Flames</option>
                      <option value="Heavenly Helpers">Heavenly Helpers</option>
                      <option value="Contemplative Cuties">Contemplative Cuties</option>
                      <option value="Virtue Vignettes">Virtue Vignettes</option>
                      <option value="Culture Carriers">Culture Carriers</option>
                    </select>
                  </div>
                </div>
                
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                    Short Description *
                  </label>
                  <textarea
                    value={newSaintForm.short_blurb}
                    onChange={(e) => handleFormChange('short_blurb', e.target.value)}
                    placeholder="Brief description of the saint..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(124, 58, 237, 0.3)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: 'white',
                      resize: 'vertical'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                    Extra Fact
                  </label>
                  <textarea
                    value={newSaintForm.extra_fact}
                    onChange={(e) => handleFormChange('extra_fact', e.target.value)}
                    placeholder="Interesting fact about the saint..."
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(124, 58, 237, 0.3)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: 'white',
                      resize: 'vertical'
                    }}
                  />
                </div>
                
                <button
                  onClick={() => runOperation('addSingle')}
                  disabled={isRunning || !newSaintForm.name || !newSaintForm.patronage}
                  style={{
                    background: (isRunning || !newSaintForm.name || !newSaintForm.patronage)
                      ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                      : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: (isRunning || !newSaintForm.name) ? 'not-allowed' : 'pointer',
                    fontSize: '1.125rem',
                    fontWeight: '600'
                  }}
                >
                  {isRunning ? '⏳ Adding...' : '👤 Add Single Saint'}
                </button>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'stats' && (
              <div>
                <h3 style={{ color: '#fbbf24', marginBottom: '1rem', fontSize: '1.5rem' }}>
                  📊 Collection Statistics
                </h3>
                
                {stats ? (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '1rem'
                  }}>
                    <div style={{
                      background: 'rgba(124, 58, 237, 0.2)',
                      borderRadius: '0.5rem',
                      padding: '1rem'
                    }}>
                      <h4 style={{ color: '#c4b5fd', marginBottom: '0.5rem' }}>By Rarity</h4>
                      {Object.entries(stats.byRarity).map(([rarity, count]) => (
                        <div key={rarity} style={{ color: '#a78bfa', marginBottom: '0.25rem' }}>
                          {rarity}: {count}
                        </div>
                      ))}
                    </div>
                    
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      borderRadius: '0.5rem',
                      padding: '1rem'
                    }}>
                      <h4 style={{ color: '#10b981', marginBottom: '0.5rem' }}>By Unlock Condition</h4>
                      {Object.entries(stats.byUnlockCondition).map(([condition, count]) => (
                        <div key={condition} style={{ color: '#a7f3d0', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                          {condition}: {count}
                        </div>
                      ))}
                    </div>
                    
                    <div style={{
                      background: 'rgba(251, 191, 36, 0.2)',
                      borderRadius: '0.5rem',
                      padding: '1rem'
                    }}>
                      <h4 style={{ color: '#fbbf24', marginBottom: '0.5rem' }}>By Series</h4>
                      {Object.entries(stats.bySeries).map(([series, count]) => (
                        <div key={series} style={{ color: '#fcd34d', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                          {series}: {count}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#c4b5fd' }}>Loading statistics...</p>
                )}
                
                <button
                  onClick={loadStats}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500',
                    marginTop: '1rem'
                  }}
                >
                  🔄 Refresh Stats
                </button>
              </div>
            )}
          </div>

          {/* Live Logs */}
          {logs.length > 0 && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.7)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              marginBottom: '2rem'
            }}>
              <h3 style={{
                color: 'white',
                marginBottom: '1rem',
                fontSize: '1.25rem'
              }}>
                📊 Operation Progress
              </h3>
              <div style={{
                background: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '0.5rem',
                padding: '1rem',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {logs.map((log, index) => (
                  <div 
                    key={index} 
                    style={{
                      color: log.type === 'error' ? '#ef4444' : 
                             log.message.includes('✅') ? '#10b981' :
                             log.message.includes('➕') ? '#3b82f6' :
                             log.message.includes('⏭️') ? '#fbbf24' : '#c4b5fd',
                      marginBottom: '0.5rem',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    <span style={{ color: '#a78bfa' }}>[{log.time}]</span> {log.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div style={{
              background: result.success 
                ? 'rgba(16, 185, 129, 0.2)' 
                : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${result.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: '0.75rem',
              padding: '2rem'
            }}>
              <h3 style={{
                color: result.success ? '#10b981' : '#ef4444',
                marginBottom: '1rem',
                fontSize: '1.5rem'
              }}>
                {result.success ? '🎉 Operation Successful!' : '❌ Operation Failed'}
              </h3>
              
              <p style={{
                color: result.success ? '#a7f3d0' : '#fca5a5',
                fontSize: '1.125rem',
                marginBottom: result.success ? '1rem' : '0'
              }}>
                {result.message}
              </p>

              {result.success && result.stats && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginTop: '1rem'
                }}>
                  <h4 style={{ color: '#10b981', marginBottom: '0.5rem' }}>
                    Operation Details:
                  </h4>
                  <div style={{ color: '#a7f3d0', fontSize: '0.875rem' }}>
                    {result.stats.operation === 'bulk' && `Total saints processed: ${result.stats.total}`}
                    {result.stats.operation === 'add_new' && `Added: ${result.stats.added}, Skipped: ${result.stats.skipped}`}
                    {result.stats.operation === 'single_add' && `Successfully added 1 saint`}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// NO SERVER-SIDE FUNCTIONS - This is purely client-side