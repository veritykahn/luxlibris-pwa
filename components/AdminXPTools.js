// components/AdminXPTools.js - Enhanced XP Diagnostic & Management Tools
import { useState, useEffect } from 'react'
import { 
  getXPHistory, 
  validateTotalXP, 
  reconcileXP, 
  getXPAuditReport,
  awardXP,
  XP_TYPES 
} from '../lib/xp-management'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

export default function AdminXPTools({ studentData, onUpdate }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [xpHistory, setXpHistory] = useState([])
  const [validation, setValidation] = useState(null)
  const [auditReport, setAuditReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  
  // Manual XP adjustment form
  const [manualXP, setManualXP] = useState({
    amount: '',
    type: XP_TYPES.MANUAL_ADJUSTMENT,
    description: '',
    source: 'admin_tools'
  })

  // Load XP history
  const loadXPHistory = async () => {
    setLoading(true)
    try {
      const history = await getXPHistory(studentData, 50)
      setXpHistory(history)
    } catch (error) {
      console.error('Error loading XP history:', error)
      setMessage({ type: 'error', text: 'Failed to load XP history' })
    }
    setLoading(false)
  }

  // Run XP validation
  const runValidation = async () => {
    setLoading(true)
    try {
      const result = await validateTotalXP(studentData)
      setValidation(result)
      
      if (result.isValid) {
        setMessage({ type: 'success', text: '✅ XP is valid - no discrepancies found!' })
      } else {
        setMessage({ 
          type: 'warning', 
          text: `⚠️ XP discrepancy found: ${result.difference} XP difference` 
        })
      }
    } catch (error) {
      console.error('Error validating XP:', error)
      setMessage({ type: 'error', text: 'Failed to validate XP' })
    }
    setLoading(false)
  }

  // Run XP reconciliation
  const runReconciliation = async (useHistory = false) => {
    if (!confirm(`This will recalculate and update the student's total XP based on ${useHistory ? 'history entries' : 'all sources'}. Continue?`)) {
      return
    }
    
    setLoading(true)
    try {
      const result = await reconcileXP(studentData, useHistory)
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `✅ XP reconciled! Changed from ${result.previousTotal} to ${result.newTotal} (${result.difference > 0 ? '+' : ''}${result.difference} XP)` 
        })
        
        // Update parent component
        if (onUpdate) {
          onUpdate({
            ...studentData,
            totalXP: result.newTotal
          })
        }
        
        // Reload validation
        await runValidation()
      } else {
        setMessage({ type: 'error', text: result.error || 'Reconciliation failed' })
      }
    } catch (error) {
      console.error('Error reconciling XP:', error)
      setMessage({ type: 'error', text: 'Failed to reconcile XP' })
    }
    setLoading(false)
  }

  // Get full audit report
  const loadAuditReport = async () => {
    setLoading(true)
    try {
      const report = await getXPAuditReport(studentData)
      setAuditReport(report)
    } catch (error) {
      console.error('Error loading audit report:', error)
      setMessage({ type: 'error', text: 'Failed to load audit report' })
    }
    setLoading(false)
  }

  // Manual XP adjustment
  const addManualXP = async () => {
    const amount = parseInt(manualXP.amount)
    
    if (!amount || amount === 0) {
      setMessage({ type: 'error', text: 'Please enter a valid XP amount' })
      return
    }
    
    if (!manualXP.description) {
      setMessage({ type: 'error', text: 'Please enter a description' })
      return
    }
    
    if (!confirm(`Add ${amount} XP to student? This action will be logged.`)) {
      return
    }
    
    setLoading(true)
    try {
      const result = await awardXP(
        studentData,
        amount,
        XP_TYPES.MANUAL_ADJUSTMENT,
        {
          source: 'admin_tools',
          description: manualXP.description,
          adminAction: true,
          timestamp: new Date().toISOString()
        }
      )
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `✅ Added ${amount} XP! New total: ${result.newTotal}` 
        })
        
        // Update parent
        if (onUpdate) {
          onUpdate({
            ...studentData,
            totalXP: result.newTotal
          })
        }
        
        // Reset form
        setManualXP({
          amount: '',
          type: XP_TYPES.MANUAL_ADJUSTMENT,
          description: '',
          source: 'admin_tools'
        })
        
        // Reload history
        await loadXPHistory()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to add XP' })
      }
    } catch (error) {
      console.error('Error adding manual XP:', error)
      setMessage({ type: 'error', text: 'Failed to add XP' })
    }
    setLoading(false)
  }

  // Load initial data based on active tab
  useEffect(() => {
    if (activeTab === 'history') {
      loadXPHistory()
    } else if (activeTab === 'validation') {
      runValidation()
    } else if (activeTab === 'audit') {
      loadAuditReport()
    }
  }, [activeTab])

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  return (
    <div style={{
      padding: '1rem',
      background: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '0.5rem'
    }}>
      
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem',
        borderBottom: '2px solid rgba(168, 85, 247, 0.3)',
        paddingBottom: '0.5rem'
      }}>
        {[
          { id: 'overview', label: '📊 Overview', icon: '📊' },
          { id: 'history', label: '📜 History', icon: '📜' },
          { id: 'validation', label: '✅ Validate', icon: '✅' },
          { id: 'manual', label: '➕ Add XP', icon: '➕' },
          { id: 'audit', label: '🔍 Audit', icon: '🔍' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.5rem 1rem',
              background: activeTab === tab.id 
                ? 'linear-gradient(135deg, #a855f7, #9333ea)'
                : 'rgba(0, 0, 0, 0.3)',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Message Display */}
      {message && (
        <div style={{
          padding: '0.75rem',
          marginBottom: '1rem',
          borderRadius: '0.375rem',
          background: message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' :
                     message.type === 'warning' ? 'rgba(245, 158, 11, 0.2)' :
                     'rgba(34, 197, 94, 0.2)',
          border: `1px solid ${
            message.type === 'error' ? 'rgba(239, 68, 68, 0.5)' :
            message.type === 'warning' ? 'rgba(245, 158, 11, 0.5)' :
            'rgba(34, 197, 94, 0.5)'
          }`,
          color: 'white'
        }}>
          {message.text}
        </div>
      )}

      {/* Tab Content */}
      <div style={{ minHeight: '300px' }}>
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem' }}>
              📊 XP Overview
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{
                padding: '1rem',
                background: 'rgba(6, 182, 212, 0.1)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(6, 182, 212, 0.3)'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#06b6d4' }}>
                  {studentData.totalXP || 0}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#67e8f9' }}>
                  Total XP
                </div>
              </div>
              
              <div style={{
                padding: '1rem',
                background: 'rgba(168, 85, 247, 0.1)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(168, 85, 247, 0.3)'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#a855f7' }}>
                  {studentData.weeklyXP || 0}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#c084fc' }}>
                  Weekly XP
                </div>
              </div>
              
              <div style={{
                padding: '1rem',
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(34, 197, 94, 0.3)'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>
                  {studentData.level || 1}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#86efac' }}>
                  Level
                </div>
              </div>
            </div>
            
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              color: '#a78bfa'
            }}>
              <div>📅 Last XP Update: {studentData.lastXPUpdate ? new Date(studentData.lastXPUpdate.seconds * 1000).toLocaleString() : 'Never'}</div>
              <div>🔧 Student Path: {studentData.path}</div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem' }}>
              📜 XP History (Last 50 Entries)
            </h4>
            
            {loading ? (
              <div style={{ color: '#a78bfa', textAlign: 'center', padding: '2rem' }}>
                Loading history...
              </div>
            ) : xpHistory.length > 0 ? (
              <div style={{
                maxHeight: '400px',
                overflowY: 'auto',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '0.5rem',
                padding: '0.5rem'
              }}>
                {xpHistory.map((entry, index) => (
                  <div
                    key={entry.id || index}
                    style={{
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      background: 'rgba(168, 85, 247, 0.1)',
                      borderRadius: '0.375rem',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      fontSize: '0.875rem'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.25rem'
                    }}>
                      <span style={{ color: 'white', fontWeight: '600' }}>
                        {entry.type === 'reading' && '📖 Reading'}
                        {entry.type === 'badge' && '🏆 Badge'}
                        {entry.type === 'family_battle' && '⚔️ Family Battle'}
                        {entry.type === 'family_battle_mvp' && '⭐ Family Battle MVP'}
                        {entry.type === 'manual_adjustment' && '🔧 Manual Adjustment'}
                      </span>
                      <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>
                        +{entry.amount} XP
                      </span>
                    </div>
                    
                    <div style={{ color: '#c084fc', fontSize: '0.75rem' }}>
                      {entry.details?.description || 'No description'}
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '0.25rem',
                      color: '#a78bfa',
                      fontSize: '0.75rem'
                    }}>
                      <span>
                        {entry.previousTotal} → {entry.newTotal} XP
                      </span>
                      <span>
                        {entry.timestamp?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#a78bfa', textAlign: 'center', padding: '2rem' }}>
                No XP history found
              </div>
            )}
          </div>
        )}

        {/* Validation Tab */}
        {activeTab === 'validation' && (
          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem' }}>
              ✅ XP Validation & Reconciliation
            </h4>
            
            {loading ? (
              <div style={{ color: '#a78bfa', textAlign: 'center', padding: '2rem' }}>
                Running validation...
              </div>
            ) : validation ? (
              <div>
                <div style={{
                  padding: '1rem',
                  background: validation.isValid 
                    ? 'rgba(34, 197, 94, 0.1)' 
                    : 'rgba(245, 158, 11, 0.1)',
                  borderRadius: '0.5rem',
                  border: `1px solid ${validation.isValid 
                    ? 'rgba(34, 197, 94, 0.3)' 
                    : 'rgba(245, 158, 11, 0.3)'}`,
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
                    {validation.isValid ? '✅ XP Valid' : '⚠️ XP Discrepancy Detected'}
                  </div>
                  <div style={{ color: '#a78bfa', marginTop: '0.5rem' }}>
                    Stored Total: {validation.storedTotal} XP<br />
                    Calculated Total: {validation.calculatedTotal} XP<br />
                    Difference: {validation.difference > 0 ? '+' : ''}{validation.difference} XP
                  </div>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(6, 182, 212, 0.1)',
                    borderRadius: '0.375rem',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#06b6d4' }}>
                      {validation.sources?.reading || 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#67e8f9' }}>
                      Reading XP
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(168, 85, 247, 0.1)',
                    borderRadius: '0.375rem',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#a855f7' }}>
                      {validation.sources?.badges || 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#c084fc' }}>
                      Badge XP
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '0.375rem',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444' }}>
                      {validation.sources?.familyBattle || 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#fca5a5' }}>
                      Battle XP
                    </div>
                  </div>
                </div>
                
                {!validation.isValid && (
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '1rem'
                  }}>
                    <button
                      onClick={() => runReconciliation(false)}
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      🔧 Reconcile from Sources
                    </button>
                    
                    <button
                      onClick={() => runReconciliation(true)}
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      📜 Reconcile from History
                    </button>
                  </div>
                )}
                
                {validation.discrepancies?.length > 0 && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '0.375rem',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}>
                    <div style={{ color: '#ef4444', fontWeight: '600', marginBottom: '0.5rem' }}>
                      Issues Found:
                    </div>
                    {validation.discrepancies.map((issue, i) => (
                      <div key={i} style={{ color: '#fca5a5', fontSize: '0.875rem' }}>
                        • {issue}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <button
                  onClick={runValidation}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 2rem',
                    background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  🔍 Run Validation
                </button>
              </div>
            )}
          </div>
        )}

        {/* Manual XP Tab */}
        {activeTab === 'manual' && (
          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem' }}>
              ➕ Manual XP Adjustment
            </h4>
            
            <div style={{
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '0.5rem'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '0.25rem'
                }}>
                  XP Amount (can be negative)
                </label>
                <input
                  type="number"
                  value={manualXP.amount}
                  onChange={(e) => setManualXP({ ...manualXP, amount: e.target.value })}
                  placeholder="e.g., 50 or -25"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '0.375rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'white',
                  marginBottom: '0.25rem'
                }}>
                  Description (required)
                </label>
                <textarea
                  value={manualXP.description}
                  onChange={(e) => setManualXP({ ...manualXP, description: e.target.value })}
                  placeholder="Reason for XP adjustment..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '0.375rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: 'white',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <button
                onClick={addManualXP}
                disabled={loading || !manualXP.amount || !manualXP.description}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: loading || !manualXP.amount || !manualXP.description
                    ? '#6b7280'
                    : 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: loading || !manualXP.amount || !manualXP.description 
                    ? 'not-allowed' 
                    : 'pointer',
                  fontWeight: '600'
                }}
              >
                {loading ? '⏳ Processing...' : '✅ Add XP Adjustment'}
              </button>
              
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'rgba(245, 158, 11, 0.1)',
                borderRadius: '0.375rem',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                fontSize: '0.75rem',
                color: '#fbbf24'
              }}>
                ⚠️ All manual adjustments are logged in XP history with admin attribution
              </div>
            </div>
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem' }}>
              🔍 XP Audit Report
            </h4>
            
            {loading ? (
              <div style={{ color: '#a78bfa', textAlign: 'center', padding: '2rem' }}>
                Generating audit report...
              </div>
            ) : auditReport ? (
              <div>
                {/* Audit Summary */}
                <div style={{
                  padding: '1rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <h5 style={{ color: '#06b6d4', marginBottom: '0.5rem' }}>
                    Audit Summary
                  </h5>
                  <div style={{ fontSize: '0.875rem', color: '#a78bfa' }}>
                    <div>Student ID: {auditReport.studentId}</div>
                    <div>Current Total XP: {auditReport.currentTotal}</div>
                    <div>Weekly XP: {auditReport.weeklyXP}</div>
                    <div>Has History: {auditReport.flags?.hasHistory ? 'Yes' : 'No'}</div>
                    <div>Has Discrepancy: {auditReport.flags?.hasDiscrepancy ? `Yes (${auditReport.flags.discrepancyAmount} XP)` : 'No'}</div>
                  </div>
                </div>
                
                {/* Validation Details */}
                {auditReport.validation && (
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(168, 85, 247, 0.1)',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem'
                  }}>
                    <h5 style={{ color: '#a855f7', marginBottom: '0.5rem' }}>
                      XP Breakdown
                    </h5>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#c084fc'
                    }}>
                      <div>Reading XP: {auditReport.validation.sources?.reading || 0}</div>
                      <div>Badge XP: {auditReport.validation.sources?.badges || 0}</div>
                      <div>Battle XP: {auditReport.validation.sources?.familyBattle || 0}</div>
                      <div>Calculated Total: {auditReport.validation.calculatedTotal || 0}</div>
                    </div>
                  </div>
                )}
                
                {/* Recent History */}
                {auditReport.recentHistory?.length > 0 && (
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(6, 182, 212, 0.1)',
                    borderRadius: '0.5rem'
                  }}>
                    <h5 style={{ color: '#06b6d4', marginBottom: '0.5rem' }}>
                      Recent XP Activity
                    </h5>
                    {auditReport.recentHistory.map((entry, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '0.5rem',
                          marginBottom: '0.25rem',
                          background: 'rgba(0, 0, 0, 0.2)',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          color: '#67e8f9'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{entry.type}: {entry.description}</span>
                          <span>+{entry.amount} XP</span>
                        </div>
                        <div style={{ color: '#a78bfa', fontSize: '0.7rem' }}>
                          {new Date(entry.date).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <button
                  onClick={loadAuditReport}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 2rem',
                    background: 'linear-gradient(135deg, #a855f7, #9333ea)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  📊 Generate Audit Report
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}