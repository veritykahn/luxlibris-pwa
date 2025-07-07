// pages/admin/setup-programs.js - Clean client-side only setup page
import { useState } from 'react'
import Head from 'next/head'
import programsSetup from '../../setup-programs'

export default function SetupProgramsPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [logs, setLogs] = useState([])

  // Capture console logs
  const originalLog = console.log
  const originalError = console.error

  const runSetup = async () => {
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
      console.log('🚀 Starting Enhanced Programs Setup...')
      
      // Use the default import approach
      const setupResult = await programsSetup.setupProgramsCollection()
      
      setResult(setupResult)
      
      if (setupResult.success) {
        console.log('✅ Setup completed successfully!')
        console.log('Programs created:', setupResult.programs?.length || 0)
      } else {
        console.error('❌ Setup failed:', setupResult.message)
      }
    } catch (error) {
      console.error('❌ Error during setup:', error.message)
      console.error('Full error:', error)
      setResult({ success: false, message: error.message })
    }

    // Restore original console methods
    console.log = originalLog
    console.error = originalError
    setIsRunning(false)
  }

  return (
    <>
      <Head>
        <title>Setup Enhanced Programs - Lux Libris</title>
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '60rem',
          margin: '0 auto'
        }}>
          
          {/* Header */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #a855f7, #10b981)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1rem'
            }}>
              ⚙️
            </div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 1rem',
              fontFamily: 'Georgia, serif'
            }}>
              Enhanced Programs Setup
            </h1>
            <p style={{
              color: '#c084fc',
              fontSize: '1.125rem',
              marginBottom: '2rem'
            }}>
              Set up the enhanced flexible program system with Lux Libris & Laudato Literary
            </p>

            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginBottom: '2rem',
              textAlign: 'left'
            }}>
              <h3 style={{ color: '#10b981', marginBottom: '1rem', fontSize: '1.25rem' }}>
                📚 What This Setup Creates:
              </h3>
              <ul style={{ color: '#a78bfa', lineHeight: '1.6', margin: 0, paddingLeft: '1.5rem' }}>
                <li><strong>Lux Libris Program:</strong> Elementary/Middle School (grades 4-8) - your existing program!</li>
                <li><strong>Laudato Literary List:</strong> High School (grades 9-12) with advanced features</li>
                <li><strong>Flexible Tier System:</strong> Choose any programs based on tier limits</li>
                <li><strong>GOD MODE Overrides:</strong> Custom program counts with pricing</li>
                <li><strong>Future Ready:</strong> Expandable for Bluebonnet, ISD programs, etc.</li>
              </ul>
            </div>

            <button
              onClick={runSetup}
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
                fontWeight: '600',
                minWidth: '200px'
              }}
            >
              {isRunning ? '⏳ Setting up...' : '🚀 Run Enhanced Setup'}
            </button>
          </div>

          {/* Live Logs */}
          {logs.length > 0 && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.7)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              marginBottom: '2rem'
            }}>
              <h3 style={{
                color: 'white',
                marginBottom: '1rem',
                fontSize: '1.25rem',
                fontFamily: 'Georgia, serif'
              }}>
                📊 Setup Progress
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
                      color: log.type === 'error' ? '#ef4444' : '#10b981',
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
              padding: '2rem',
              marginBottom: '2rem'
            }}>
              <h3 style={{
                color: result.success ? '#10b981' : '#ef4444',
                marginBottom: '1rem',
                fontSize: '1.5rem',
                fontFamily: 'Georgia, serif'
              }}>
                {result.success ? '🎉 Setup Successful!' : '❌ Setup Failed'}
              </h3>
              
              <p style={{
                color: result.success ? '#a7f3d0' : '#fca5a5',
                fontSize: '1.125rem',
                marginBottom: '1rem'
              }}>
                {result.message}
              </p>

              {result.success && result.programs && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginTop: '1rem'
                }}>
                  <h4 style={{ color: '#10b981', marginBottom: '0.5rem' }}>
                    Programs Created:
                  </h4>
                  {result.programs.map((program, index) => (
                    <div key={index} style={{ color: '#a7f3d0', marginBottom: '0.25rem' }}>
                      • {program.name} ({program.status}) - {program.targetAudience}
                    </div>
                  ))}
                </div>
              )}

              {result.success && (
                <div style={{
                  background: 'rgba(168, 85, 247, 0.2)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginTop: '1rem'
                }}>
                  <h4 style={{ color: '#c084fc', marginBottom: '0.5rem' }}>
                    🔄 Next Steps:
                  </h4>
                  <ul style={{ color: '#a78bfa', lineHeight: '1.6', margin: 0, paddingLeft: '1.5rem' }}>
                    <li>Go to Enhanced GOD MODE to create entities with program selection</li>
                    <li>Test the new flexible tier system</li>
                    <li>Update diocese and school dashboards to use program selection</li>
                    <li>Your existing masterNominees, saints, quizzes stay unchanged!</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div style={{
            background: 'rgba(168, 85, 247, 0.2)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '0.75rem',
            padding: '1.5rem'
          }}>
            <h3 style={{
              color: '#c084fc',
              marginBottom: '1rem',
              fontSize: '1.25rem'
            }}>
              📝 Important Notes:
            </h3>
            <ul style={{ color: '#a78bfa', lineHeight: '1.6', margin: 0, paddingLeft: '1.5rem' }}>
              <li><strong>Safe to Run:</strong> This setup preserves all your existing data</li>
              <li><strong>Backup Recommended:</strong> Always backup before major changes</li>
              <li><strong>Run Once:</strong> Only run this setup once - it will ask before overwriting</li>
              <li><strong>Testing:</strong> Test in development environment first if possible</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}

// NO SERVER-SIDE FUNCTIONS - This is purely client-side