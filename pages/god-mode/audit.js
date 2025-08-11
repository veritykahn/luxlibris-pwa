// pages/god-mode/audit.js - AUDIT LOG VIEWER
import { useState, useEffect } from 'react'
import Head from 'next/head'
import GodModeAuth from '../../components/god-mode/GodModeAuth'
import GodModeHeader from '../../components/god-mode/GodModeHeader'
import { db } from '../../lib/firebase'
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore'

export default function AuditLogsManagement() {
  const [auditLogs, setAuditLogs] = useState([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState('')
  const [auditFilter, setAuditFilter] = useState('all') // 'all', 'student', 'parent', 'teacher'
  const [auditTimeRange, setAuditTimeRange] = useState('7') // days

  // Load audit logs from Firebase
  const loadAuditLogs = async () => {
    try {
      setAuditLoading(true)
      setAuditError('')

      // Calculate date range
      const now = new Date()
      const daysAgo = new Date(now.getTime() - (parseInt(auditTimeRange) * 24 * 60 * 60 * 1000))

      // Build query
      let logsQuery = query(
        collection(db, 'accountDeletionLogs'),
        orderBy('timestamp', 'desc'),
        limit(100)
      )

      // Add account type filter if not 'all'
      if (auditFilter !== 'all') {
        logsQuery = query(
          collection(db, 'accountDeletionLogs'),
          where('accountType', '==', auditFilter),
          orderBy('timestamp', 'desc'),
          limit(100)
        )
      }

      const snapshot = await getDocs(logsQuery)
      const auditLogData = []

      snapshot.forEach(doc => {
        const logData = doc.data()
        const logDate = logData.timestamp?.toDate?.() || new Date(logData.timestamp)
        
        // Filter by time range
        if (logDate >= daysAgo) {
          auditLogData.push({
            id: doc.id,
            ...logData,
            timestamp: logDate
          })
        }
      })

      setAuditLogs(auditLogData)
      console.log(`✅ Loaded ${auditLogData.length} audit logs`)

    } catch (error) {
      console.error('❌ Error loading audit logs:', error)
      setAuditError('Failed to load audit logs: ' + error.message)
    }
    
    setAuditLoading(false)
  }

  const getAccountTypeColor = (accountType) => {
    switch (accountType) {
      case 'student': return '#3B82F6' // Blue
      case 'parent': return '#10B981' // Green  
      case 'teacher': return '#F59E0B' // Orange
      case 'admin': return '#EF4444' // Red
      default: return '#6B7280' // Gray
    }
  }

  const getAccountTypeIcon = (accountType) => {
    switch (accountType) {
      case 'student': return '🎓'
      case 'parent': return '👨‍👩‍👧‍👦'
      case 'teacher': return '👩‍🏫'
      case 'admin': return '👨‍💼'
      default: return '👤'
    }
  }

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const exportAuditLogs = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalLogs: auditLogs.length,
      filters: { accountType: auditFilter, timeRange: auditTimeRange + ' days' },
      logs: auditLogs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        accountType: log.accountType,
        accountId: log.accountId,
        userEmail: log.userEmail,
        reason: log.reason,
        deletedBy: log.deletedBy,
        academicYear: log.academicYear
      }))
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lux-libris-audit-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Load audit logs when filters change
  useEffect(() => {
    loadAuditLogs()
  }, [auditFilter, auditTimeRange])

  return (
    <GodModeAuth pageName="Audit Logs">
      {({ isAuthenticated, sessionTimeRemaining, handleLogout }) => (
        <>
          <Head>
            <title>Audit Logs - God Mode</title>
          </Head>
          
          <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            
            <GodModeHeader 
              title="Audit Logs"
              icon="📋"
              sessionTimeRemaining={sessionTimeRemaining}
              onLogout={handleLogout}
            />

            <div style={{
              maxWidth: '80rem',
              margin: '0 auto',
              padding: '2rem 1.5rem'
            }}>
              
              {/* Main Audit Section */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.3)',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '2rem',
                backdropFilter: 'blur(8px)',
                border: '2px solid rgba(239, 68, 68, 0.5)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: 0,
                    fontFamily: 'Georgia, serif',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    📋 Account Deletion Audit Logs
                  </h2>
                  
                  <button
                    onClick={exportAuditLogs}
                    disabled={auditLogs.length === 0}
                    style={{
                      background: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: auditLogs.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: auditLogs.length === 0 ? 0.5 : 1
                    }}
                  >
                    📦 Export Logs
                  </button>
                </div>

                {/* Controls */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  marginBottom: '1.5rem'
                }}>
                  {/* Account Type Filter */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: 'white',
                      marginBottom: '0.25rem'
                    }}>
                      Account Type
                    </label>
                    <select
                      value={auditFilter}
                      onChange={(e) => setAuditFilter(e.target.value)}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'white'
                      }}
                    >
                      <option value="all">All Types</option>
                      <option value="student">Students</option>
                      <option value="parent">Parents</option>
                      <option value="teacher">Teachers</option>
                      <option value="admin">Admins</option>
                    </select>
                  </div>
                  
                  {/* Time Range Filter */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: 'white',
                      marginBottom: '0.25rem'
                    }}>
                      Time Range
                    </label>
                    <select
                      value={auditTimeRange}
                      onChange={(e) => setAuditTimeRange(e.target.value)}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'white'
                      }}
                    >
                      <option value="1">Last 24 hours</option>
                      <option value="7">Last 7 days</option>
                      <option value="30">Last 30 days</option>
                      <option value="90">Last 90 days</option>
                    </select>
                  </div>
                  
                  {/* Refresh Button */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: 'white',
                      marginBottom: '0.25rem'
                    }}>
                      Actions
                    </label>
                    <button
                      onClick={loadAuditLogs}
                      disabled={auditLoading}
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: auditLoading ? 'wait' : 'pointer',
                        opacity: auditLoading ? 0.7 : 1
                      }}
                    >
                      {auditLoading ? '⏳ Loading...' : '🔄 Refresh'}
                    </button>
                  </div>
                </div>

                {/* Error message */}
                {auditError && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    color: '#fca5a5'
                  }}>
                    ❌ {auditError}
                  </div>
                )}

                {/* Summary stats */}
                {auditLogs.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      background: 'rgba(107, 114, 128, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      textAlign: 'center',
                      border: '2px solid #6b7280'
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
                        {auditLogs.length}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#c084fc' }}>
                        Total Deletions
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      textAlign: 'center',
                      border: '2px solid #3b82f6'
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                        {auditLogs.filter(log => log.accountType === 'student').length}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#c084fc' }}>
                        Students
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      textAlign: 'center',
                      border: '2px solid #10b981'
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                        {auditLogs.filter(log => log.accountType === 'parent').length}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#c084fc' }}>
                        Parents
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(245, 158, 11, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      textAlign: 'center',
                      border: '2px solid #f59e0b'
                    }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                        {auditLogs.filter(log => log.accountType === 'teacher').length}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#c084fc' }}>
                        Teachers
                      </div>
                    </div>
                  </div>
                )}

                {/* Logs table */}
                {auditLoading ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      border: '3px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '3px solid #3B82F6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 1rem'
                    }} />
                    <p style={{ color: '#c084fc' }}>Loading audit logs...</p>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#c084fc'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                    <p>No deletion logs found for the selected criteria.</p>
                  </div>
                ) : (
                  <div style={{ 
                    overflowX: 'auto',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '0.5rem'
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.875rem'
                    }}>
                      <thead>
                        <tr style={{ 
                          background: 'rgba(239, 68, 68, 0.3)',
                          position: 'sticky',
                          top: 0
                        }}>
                          <th style={{ 
                            padding: '0.75rem', 
                            textAlign: 'left', 
                            fontWeight: '600', 
                            color: 'white',
                            borderBottom: '1px solid rgba(239, 68, 68, 0.5)'
                          }}>
                            Timestamp
                          </th>
                          <th style={{ 
                            padding: '0.75rem', 
                            textAlign: 'left', 
                            fontWeight: '600', 
                            color: 'white',
                            borderBottom: '1px solid rgba(239, 68, 68, 0.5)'
                          }}>
                            Account Type
                          </th>
                          <th style={{ 
                            padding: '0.75rem', 
                            textAlign: 'left', 
                            fontWeight: '600', 
                            color: 'white',
                            borderBottom: '1px solid rgba(239, 68, 68, 0.5)'
                          }}>
                            Email
                          </th>
                          <th style={{ 
                            padding: '0.75rem', 
                            textAlign: 'left', 
                            fontWeight: '600', 
                            color: 'white',
                            borderBottom: '1px solid rgba(239, 68, 68, 0.5)'
                          }}>
                            Reason
                          </th>
                          <th style={{ 
                            padding: '0.75rem', 
                            textAlign: 'left', 
                            fontWeight: '600', 
                            color: 'white',
                            borderBottom: '1px solid rgba(239, 68, 68, 0.5)'
                          }}>
                            Academic Year
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log, index) => (
                          <tr
                            key={log.id}
                            style={{
                              borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
                              backgroundColor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.2)' : 'transparent'
                            }}
                          >
                            <td style={{ padding: '0.75rem', color: 'white' }}>
                              {formatTimestamp(log.timestamp)}
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.375rem',
                                backgroundColor: getAccountTypeColor(log.accountType) + '30',
                                color: getAccountTypeColor(log.accountType),
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                border: `1px solid ${getAccountTypeColor(log.accountType)}60`
                              }}>
                                {getAccountTypeIcon(log.accountType)} {log.accountType}
                              </span>
                            </td>
                            <td style={{ 
                              padding: '0.75rem', 
                              color: 'white', 
                              fontFamily: 'monospace',
                              fontSize: '0.8rem'
                            }}>
                              {log.userEmail}
                            </td>
                            <td style={{ padding: '0.75rem', color: '#c084fc' }}>
                              {log.reason}
                            </td>
                            <td style={{ padding: '0.75rem', color: '#c084fc' }}>
                              {log.academicYear}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Compliance Information */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(168, 85, 247, 0.3)'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '1rem',
                  fontFamily: 'Georgia, serif'
                }}>
                  🔒 Compliance & Privacy Information
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '1rem'
                }}>
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}>
                    <h4 style={{ color: '#3b82f6', marginBottom: '0.5rem' }}>📋 Audit Trail</h4>
                    <p style={{ color: '#93c5fd', fontSize: '0.875rem' }}>
                      All account deletions are logged with timestamp, user details, and reason for deletion.
                    </p>
                  </div>
                  
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    <h4 style={{ color: '#10b981', marginBottom: '0.5rem' }}>🛡️ Data Protection</h4>
                    <p style={{ color: '#86efac', fontSize: '0.875rem' }}>
                      User data is permanently removed from the system upon account deletion.
                    </p>
                  </div>
                  
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    border: '1px solid rgba(245, 158, 11, 0.3)'
                  }}>
                    <h4 style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>⚖️ Compliance</h4>
                    <p style={{ color: '#fcd34d', fontSize: '0.875rem' }}>
                      Logs are maintained for legal compliance and can be exported for regulatory review.
                    </p>
                  </div>
                </div>
                
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '0.375rem',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  <p style={{
                    color: '#fca5a5',
                    fontSize: '0.875rem',
                    margin: 0
                  }}>
                    ⚠️ <strong>Important:</strong> Audit logs are retained for 2 years or as required by applicable regulations.
                    These logs should be reviewed regularly for compliance purposes.
                  </p>
                </div>
              </div>
            </div>

            <style jsx>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </>
      )}
    </GodModeAuth>
  )
}