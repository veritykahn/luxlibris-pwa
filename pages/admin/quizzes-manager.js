// pages/admin/quizzes-manager.js - Enhanced quizzes management
import { useState, useEffect } from 'react'
import Head from 'next/head'
import quizzesManager from '../../enhanced-quizzes-manager'

export default function QuizzesManagerPage() {
  const [activeTab, setActiveTab] = useState('saints-bulk')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [logs, setLogs] = useState([])
  const [saintsStats, setSaintsStats] = useState(null)
  const [bookStats, setBookStats] = useState(null)
  const [newSaintsQuizForm, setNewSaintsQuizForm] = useState({
    quiz_id: '',
    title: '',
    description: '',
    series: 'Halo Hatchlings',
    target_grades: [4, 5, 6, 7, 8],
    questions: [],
    results: {}
  })
  const [newBookQuizForm, setNewBookQuizForm] = useState({
    quiz_id: '',
    title: '',
    description: '',
    target_grades: [4, 5, 6, 7, 8],
    questions: [],
    results: {}
  })

  // Load current stats on page load
  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const currentSaintsStats = await quizzesManager.getQuizzesStats('saints')
    const currentBookStats = await quizzesManager.getQuizzesStats('books')
    setSaintsStats(currentSaintsStats)
    setBookStats(currentBookStats)
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
        case 'saints-bulk':
          console.log('🚀 Starting saints quizzes bulk setup...')
          setupResult = await quizzesManager.setupAllSaintsQuizzes()
          break
          
        case 'saints-addNew':
          console.log('➕ Adding new saints quizzes only...')
          setupResult = await quizzesManager.addNewSaintsQuizzesOnly()
          break
          
        case 'saints-addSingle':
          console.log('➕ Adding single saints quiz...')
          const nextSaintsId = await quizzesManager.getNextQuizId('saints', newSaintsQuizForm.series?.toLowerCase().replace(/\s+/g, '_'))
          const saintsQuizData = { ...newSaintsQuizForm, quiz_id: nextSaintsId }
          setupResult = await quizzesManager.addSingleSaintsQuiz(saintsQuizData)
          if (setupResult.success) {
            setNewSaintsQuizForm({
              quiz_id: '',
              title: '',
              description: '',
              series: 'Halo Hatchlings',
              target_grades: [4, 5, 6, 7, 8],
              questions: [],
              results: {}
            })
          }
          break

        case 'books-bulk':
          console.log('🚀 Starting book quizzes bulk setup...')
          setupResult = await quizzesManager.setupAllBookQuizzes()
          break
          
        case 'books-addSingle':
          console.log('➕ Adding single book quiz...')
          const nextBookId = await quizzesManager.getNextQuizId('books')
          const bookQuizData = { ...newBookQuizForm, quiz_id: nextBookId }
          setupResult = await quizzesManager.addSingleBookQuiz(bookQuizData)
          if (setupResult.success) {
            setNewBookQuizForm({
              quiz_id: '',
              title: '',
              description: '',
              target_grades: [4, 5, 6, 7, 8],
              questions: [],
              results: {}
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

  const handleSaintsFormChange = (field, value) => {
    setNewSaintsQuizForm(prev => ({ ...prev, [field]: value }))
  }

  const handleBookFormChange = (field, value) => {
    setNewBookQuizForm(prev => ({ ...prev, [field]: value }))
  }

  const tabs = [
    { id: 'saints-bulk', name: 'Saints Bulk Setup', icon: '📿' },
    { id: 'saints-addNew', name: 'Add New Saints Quizzes', icon: '➕' },
    { id: 'saints-addSingle', name: 'Add Single Saints Quiz', icon: '👤' },
    { id: 'books-bulk', name: 'Books Bulk Setup', icon: '📚' },
    { id: 'books-addSingle', name: 'Add Single Book Quiz', icon: '📖' },
    { id: 'stats', name: 'Statistics', icon: '📊' }
  ]

  const seriesOptions = [
    'Halo Hatchlings',
    'Contemplative Cuties', 
    'Founder Flames',
    'Pocket Patrons',
    'Super Sancti',
    'Sacred Circle',
    'Learning Legends',
    'Culture Carriers',
    'Regal Royals',
    'Heavenly Helpers',
    'Desert Disciples',
    'Virtue Vignettes',
    'Apostolic All-Stars',
    'Mini Marians',
    'Faithful Families',
    'Cherub Chibis'
  ]

  return (
    <>
      <Head>
        <title>Quizzes Manager - Lux Libris</title>
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
              🧩
            </div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 1rem',
              fontFamily: 'Georgia, serif'
            }}>
              Quizzes Collection Manager
            </h1>
            <p style={{
              color: '#c4b5fd',
              fontSize: '1.125rem',
              marginBottom: '0'
            }}>
              Manage saints and book quizzes for the Luxlings experience
            </p>
            
            {(saintsStats || bookStats) && (
              <div style={{
                display: 'flex',
                gap: '2rem',
                justifyContent: 'center',
                marginTop: '1rem'
              }}>
                {saintsStats && (
                  <div style={{
                    background: 'rgba(124, 58, 237, 0.2)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    display: 'inline-block'
                  }}>
                    <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                      Saints Quizzes: {saintsStats.total}
                    </span>
                  </div>
                )}
                {bookStats && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    display: 'inline-block'
                  }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                      Book Quizzes: {bookStats.total}
                    </span>
                  </div>
                )}
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
            
            {/* Saints Bulk Setup Tab */}
            {activeTab === 'saints-bulk' && (
              <div>
                <h3 style={{ color: '#fbbf24', marginBottom: '1rem', fontSize: '1.5rem' }}>
                  📿 Saints Quizzes Bulk Setup
                </h3>
                <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                  Import all saints quizzes to saints-quizzes collection.
                  This includes all series: Halo Hatchlings, Contemplative Cuties, Super Sancti, and more.
                </p>
                
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '2rem'
                }}>
                  <strong style={{ color: '#ef4444' }}>⚠️ Warning:</strong>
                  <span style={{ color: '#fca5a5' }}> This overwrites your entire saints quizzes collection.</span>
                </div>
                
                <button
                  onClick={() => runOperation('saints-bulk')}
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
                  {isRunning ? '⏳ Processing...' : '📿 Import Saints Quizzes'}
                </button>
              </div>
            )}

            {/* Saints Add New Tab */}
            {activeTab === 'saints-addNew' && (
              <div>
                <h3 style={{ color: '#fbbf24', marginBottom: '1rem', fontSize: '1.5rem' }}>
                  ➕ Add New Saints Quizzes Only
                </h3>
                <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                  Add only new saints quizzes that don't already exist. 
                  Skips quizzes that are already in the collection. Perfect for updates!
                </p>
                
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '2rem'
                }}>
                  <strong style={{ color: '#10b981' }}>✅ Safe:</strong>
                  <span style={{ color: '#a7f3d0' }}> Only adds new quizzes, existing quizzes unchanged.</span>
                </div>
                
                <button
                  onClick={() => runOperation('saints-addNew')}
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
                  {isRunning ? '⏳ Adding...' : '➕ Add New Saints Quizzes'}
                </button>
              </div>
            )}

            {/* Saints Add Single Tab */}
            {activeTab === 'saints-addSingle' && (
              <div>
                <h3 style={{ color: '#fbbf24', marginBottom: '1rem', fontSize: '1.5rem' }}>
                  👤 Add Single Saints Quiz
                </h3>
                <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                  Add one saints quiz manually with custom data. Perfect for quick additions!
                </p>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  <div>
                    <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                      Quiz Title *
                    </label>
                    <input
                      type="text"
                      value={newSaintsQuizForm.title}
                      onChange={(e) => handleSaintsFormChange('title', e.target.value)}
                      placeholder="Which Saints Series Are You?"
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
                      Series *
                    </label>
                    <select
                      value={newSaintsQuizForm.series}
                      onChange={(e) => handleSaintsFormChange('series', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(124, 58, 237, 0.3)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'white'
                      }}
                    >
                      {seriesOptions.map(series => (
                        <option key={series} value={series}>{series}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                    Description *
                  </label>
                  <textarea
                    value={newSaintsQuizForm.description}
                    onChange={(e) => handleSaintsFormChange('description', e.target.value)}
                    placeholder="Discover which saint from this series matches your personality..."
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
                
                <button
                  onClick={() => runOperation('saints-addSingle')}
                  disabled={isRunning || !newSaintsQuizForm.title || !newSaintsQuizForm.description}
                  style={{
                    background: (isRunning || !newSaintsQuizForm.title || !newSaintsQuizForm.description)
                      ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                      : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: (isRunning || !newSaintsQuizForm.title) ? 'not-allowed' : 'pointer',
                    fontSize: '1.125rem',
                    fontWeight: '600'
                  }}
                >
                  {isRunning ? '⏳ Adding...' : '👤 Add Single Saints Quiz'}
                </button>
              </div>
            )}

            {/* Books Bulk Setup Tab */}
            {activeTab === 'books-bulk' && (
              <div>
                <h3 style={{ color: '#fbbf24', marginBottom: '1rem', fontSize: '1.5rem' }}>
                  📚 Book Quizzes Bulk Setup
                </h3>
                <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                  Import all book quizzes to book-quizzes collection.
                  This feature will be enabled when book quizzes are created.
                </p>
                
                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '2rem'
                }}>
                  <strong style={{ color: '#3b82f6' }}>ℹ️ Coming Soon:</strong>
                  <span style={{ color: '#93c5fd' }}> Book quizzes are not created yet. This will be enabled in the future.</span>
                </div>
                
                <button
                  onClick={() => runOperation('books-bulk')}
                  disabled={isRunning}
                  style={{
                    background: isRunning 
                      ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                      : 'linear-gradient(135deg, #059669, #047857)',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                    fontSize: '1.125rem',
                    fontWeight: '600'
                  }}
                >
                  {isRunning ? '⏳ Processing...' : '📚 Import Book Quizzes'}
                </button>
              </div>
            )}

            {/* Books Add Single Tab */}
            {activeTab === 'books-addSingle' && (
              <div>
                <h3 style={{ color: '#fbbf24', marginBottom: '1rem', fontSize: '1.5rem' }}>
                  📖 Add Single Book Quiz
                </h3>
                <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                  Add one book quiz manually. This is ready for when book quizzes are developed.
                </p>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  <div>
                    <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                      Quiz Title *
                    </label>
                    <input
                      type="text"
                      value={newBookQuizForm.title}
                      onChange={(e) => handleBookFormChange('title', e.target.value)}
                      placeholder="Which Character Are You?"
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
                </div>
                
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                    Description *
                  </label>
                  <textarea
                    value={newBookQuizForm.description}
                    onChange={(e) => handleBookFormChange('description', e.target.value)}
                    placeholder="Discover which character from this book matches your personality..."
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
                
                <button
                  onClick={() => runOperation('books-addSingle')}
                  disabled={isRunning || !newBookQuizForm.title || !newBookQuizForm.description}
                  style={{
                    background: (isRunning || !newBookQuizForm.title || !newBookQuizForm.description)
                      ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                      : 'linear-gradient(135deg, #059669, #047857)',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: (isRunning || !newBookQuizForm.title) ? 'not-allowed' : 'pointer',
                    fontSize: '1.125rem',
                    fontWeight: '600'
                  }}
                >
                  {isRunning ? '⏳ Adding...' : '📖 Add Single Book Quiz'}
                </button>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'stats' && (
              <div>
                <h3 style={{ color: '#fbbf24', marginBottom: '1rem', fontSize: '1.5rem' }}>
                  📊 Quizzes Statistics
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                  
                  {/* Saints Stats */}
                  {saintsStats && (
                    <div>
                      <h4 style={{ color: '#7c3aed', marginBottom: '1rem', fontSize: '1.25rem' }}>
                        📿 Saints Quizzes ({saintsStats.total} total)
                      </h4>
                      
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{
                          background: 'rgba(124, 58, 237, 0.2)',
                          borderRadius: '0.5rem',
                          padding: '1rem'
                        }}>
                          <h5 style={{ color: '#c4b5fd', marginBottom: '0.5rem' }}>By Series</h5>
                          {Object.entries(saintsStats.bySeries).map(([series, count]) => (
                            <div key={series} style={{ color: '#a78bfa', marginBottom: '0.25rem' }}>
                              {series}: {count}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          borderRadius: '0.5rem',
                          padding: '1rem'
                        }}>
                          <h5 style={{ color: '#10b981', marginBottom: '0.5rem' }}>By Grade Level</h5>
                          {Object.entries(saintsStats.byGradeLevel).map(([level, count]) => (
                            <div key={level} style={{ color: '#a7f3d0', marginBottom: '0.25rem' }}>
                              {level}: {count}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Books Stats */}
                  {bookStats && (
                    <div>
                      <h4 style={{ color: '#059669', marginBottom: '1rem', fontSize: '1.25rem' }}>
                        📚 Book Quizzes ({bookStats.total} total)
                      </h4>
                      
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          borderRadius: '0.5rem',
                          padding: '1rem'
                        }}>
                          <h5 style={{ color: '#10b981', marginBottom: '0.5rem' }}>By Category</h5>
                          {Object.entries(bookStats.bySeries).map(([category, count]) => (
                            <div key={category} style={{ color: '#a7f3d0', marginBottom: '0.25rem' }}>
                              {category}: {count}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {(!saintsStats || saintsStats.total === 0) && (!bookStats || bookStats.total === 0) && (
                    <p style={{ color: '#c4b5fd' }}>No quizzes found. Import some quizzes to see statistics!</p>
                  )}
                </div>
                
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
                    {result.stats.operation === 'bulk' && `Total quizzes processed: ${result.stats.total}`}
                    {result.stats.operation === 'add_new' && `Added: ${result.stats.added}, Skipped: ${result.stats.skipped}`}
                    {result.stats.operation === 'single_add' && `Successfully added 1 quiz`}
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