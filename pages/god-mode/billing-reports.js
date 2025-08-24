// pages/god-mode/billing-reports.js - COMPREHENSIVE BILLING ANALYTICS
import { useState, useEffect } from 'react'
import Head from 'next/head'
import GodModeAuth from '../../components/god-mode/GodModeAuth'
import GodModeHeader from '../../components/god-mode/GodModeHeader'
import { db } from '../../lib/firebase'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import {
  PRICING_CONFIG,
  calculateBilling,
  checkOverageStatus,
  formatCurrency,
  getTierInfo
} from '../../lib/pricing-config'

export default function BillingReports() {
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState('summary')
  const [dateRange, setDateRange] = useState('current_year')
  
  // Data states
  const [entities, setEntities] = useState([])
  const [billingEvents, setBillingEvents] = useState([])
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    activeRevenue: 0,
    pendingRevenue: 0,
    overageRevenue: 0,
    averageContractValue: 0,
    totalSchools: 0,
    revenuePerSchool: 0
  })
  
  // Breakdown states
  const [revenueByTier, setRevenueByTier] = useState({})
  const [revenueByStatus, setRevenueByStatus] = useState({})
  const [overageReport, setOverageReport] = useState([])
  const [renewalForecast, setRenewalForecast] = useState([])

  const loadBillingData = async () => {
    setLoading(true)
    try {
      // Load all entities
      const entitiesRef = collection(db, 'entities')
      const entitiesSnapshot = await getDocs(entitiesRef)
      const entitiesData = []
      
      let totalRevenue = 0
      let activeRevenue = 0
      let pendingRevenue = 0
      let overageRevenue = 0
      let totalSchools = 0
      
      const tierBreakdown = {}
      const statusBreakdown = {}
      const overageList = []
      const renewalList = []
      
      for (const doc of entitiesSnapshot.docs) {
        const entity = { id: doc.id, ...doc.data() }
        
        if (entity.type === 'diocese' || entity.type === 'isd') {
          // Get actual school count
          const schoolsRef = collection(db, `entities/${doc.id}/schools`)
          const schoolsSnapshot = await getDocs(schoolsRef)
          entity.actualSchoolCount = schoolsSnapshot.size
          totalSchools += entity.actualSchoolCount
          
          // Calculate billing
          const billing = calculateBilling(entity)
          entity.billing = billing
          
          // Track revenue by status
          const revenue = billing.totalDue || entity.annualPrice || 0
          totalRevenue += revenue
          
          if (entity.billingStatus === 'active') {
            activeRevenue += revenue
          } else {
            pendingRevenue += revenue
          }
          
          // Track overage
          if (billing.overage?.overageCost > 0) {
            overageRevenue += billing.overage.overageCost
            overageList.push({
              entity: entity.name,
              tier: entity.tier,
              schools: entity.actualSchoolCount,
              limit: entity.maxSubEntities,
              overage: billing.overage.overage,
              cost: billing.overage.overageCost,
              status: billing.overage.status
            })
          }
          
          // Track by tier
          if (!tierBreakdown[entity.tier]) {
            tierBreakdown[entity.tier] = {
              count: 0,
              revenue: 0,
              schools: 0
            }
          }
          tierBreakdown[entity.tier].count++
          tierBreakdown[entity.tier].revenue += revenue
          tierBreakdown[entity.tier].schools += entity.actualSchoolCount
          
          // Track by status
          const status = entity.billingStatus || 'pending'
          if (!statusBreakdown[status]) {
            statusBreakdown[status] = {
              count: 0,
              revenue: 0
            }
          }
          statusBreakdown[status].count++
          statusBreakdown[status].revenue += revenue
          
          // Check renewal dates
          if (entity.licenseExpiration) {
            const expDate = new Date(entity.licenseExpiration)
            const today = new Date()
            const daysUntilExpiry = Math.floor((expDate - today) / (1000 * 60 * 60 * 24))
            
            if (daysUntilExpiry <= 90) {
              renewalList.push({
                entity: entity.name,
                tier: entity.tier,
                schools: entity.actualSchoolCount,
                revenue: revenue,
                expiryDate: entity.licenseExpiration,
                daysRemaining: daysUntilExpiry,
                status: entity.billingStatus
              })
            }
          }
          
          entitiesData.push(entity)
        }
      }
      
      // Load single schools
      const schoolsRef = collection(db, 'schools')
      const schoolsSnapshot = await getDocs(schoolsRef)
      
      schoolsSnapshot.forEach(doc => {
        const school = doc.data()
        if (school.type === 'single_school') {
          const revenue = PRICING_CONFIG.singleSchool
          totalRevenue += revenue
          totalSchools++
          
          if (school.billingStatus === 'active') {
            activeRevenue += revenue
          } else {
            pendingRevenue += revenue
          }
          
          // Track single schools
          if (!tierBreakdown['single']) {
            tierBreakdown['single'] = {
              count: 0,
              revenue: 0,
              schools: 0
            }
          }
          tierBreakdown['single'].count++
          tierBreakdown['single'].revenue += revenue
          tierBreakdown['single'].schools++
        }
      })
      
      // Load billing events (overages, upgrades, etc.)
      try {
        const eventsRef = collection(db, 'billingEvents')
        const eventsSnapshot = await getDocs(eventsRef)
        const events = []
        eventsSnapshot.forEach(doc => {
          events.push({ id: doc.id, ...doc.data() })
        })
        setBillingEvents(events)
      } catch (error) {
        console.log('No billing events collection yet')
      }
      
      setEntities(entitiesData)
      setMetrics({
        totalRevenue,
        activeRevenue,
        pendingRevenue,
        overageRevenue,
        averageContractValue: entitiesData.length > 0 ? totalRevenue / entitiesData.length : 0,
        totalSchools,
        revenuePerSchool: totalSchools > 0 ? totalRevenue / totalSchools : 0
      })
      setRevenueByTier(tierBreakdown)
      setRevenueByStatus(statusBreakdown)
      setOverageReport(overageList)
      setRenewalForecast(renewalList.sort((a, b) => a.daysRemaining - b.daysRemaining))
      
    } catch (error) {
      console.error('Error loading billing data:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadBillingData()
  }, [])

  const exportToCSV = (data, filename) => {
    const csv = convertToCSV(data)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const convertToCSV = (data) => {
    if (data.length === 0) return ''
    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(',')
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header]
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value
      }).join(',')
    )
    return [csvHeaders, ...csvRows].join('\n')
  }

  return (
    <GodModeAuth pageName="Billing Reports">
      {({ isAuthenticated, sessionTimeRemaining, handleLogout }) => (
        <>
          <Head>
            <title>Billing Reports - God Mode</title>
          </Head>
          
          <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            
            <GodModeHeader 
              title="Billing Reports & Analytics"
              icon="💰"
              sessionTimeRemaining={sessionTimeRemaining}
              onLogout={handleLogout}
            />

            <div style={{
              maxWidth: '80rem',
              margin: '0 auto',
              padding: '2rem 1.5rem'
            }}>
              
              {/* Revenue Overview Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <MetricCard 
                  title="Total Annual Revenue" 
                  value={formatCurrency(metrics.totalRevenue)}
                  subtitle="All contracts"
                  icon="💰" 
                  color="#10b981"
                />
                <MetricCard 
                  title="Active Revenue" 
                  value={formatCurrency(metrics.activeRevenue)}
                  subtitle={`${Math.round((metrics.activeRevenue / metrics.totalRevenue) * 100)}% collected`}
                  icon="✅" 
                  color="#3b82f6"
                />
                <MetricCard 
                  title="Pending Revenue" 
                  value={formatCurrency(metrics.pendingRevenue)}
                  subtitle="Awaiting payment"
                  icon="⏳" 
                  color="#f59e0b"
                />
                <MetricCard 
                  title="Overage Revenue" 
                  value={formatCurrency(metrics.overageRevenue)}
                  subtitle="From capacity overages"
                  icon="📈" 
                  color="#8b5cf6"
                />
                <MetricCard 
                  title="Avg Contract Value" 
                  value={formatCurrency(metrics.averageContractValue)}
                  subtitle="Per diocese/ISD"
                  icon="📊" 
                  color="#ec4899"
                />
                <MetricCard 
                  title="Revenue per School" 
                  value={formatCurrency(metrics.revenuePerSchool)}
                  subtitle={`${metrics.totalSchools} total schools`}
                  icon="🏫" 
                  color="#6366f1"
                />
              </div>

              {/* Report Type Selector */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '0.75rem',
                padding: '1rem',
                marginBottom: '2rem',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(168, 85, 247, 0.3)'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  justifyContent: 'center'
                }}>
                  {[
                    { id: 'summary', label: '📊 Summary' },
                    { id: 'by_tier', label: '📈 By Tier' },
                    { id: 'by_status', label: '✅ By Status' },
                    { id: 'overage', label: '⚠️ Overage Report' },
                    { id: 'renewals', label: '🔄 Renewals' },
                    { id: 'detailed', label: '📋 Detailed List' }
                  ].map(report => (
                    <button
                      key={report.id}
                      onClick={() => setReportType(report.id)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: reportType === report.id 
                          ? 'linear-gradient(135deg, #a855f7, #ec4899)'
                          : 'rgba(168, 85, 247, 0.2)',
                        color: 'white',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}
                    >
                      {report.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Report Content */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(168, 85, 247, 0.3)'
              }}>
                {loading ? (
                  <div style={{ textAlign: 'center', color: 'white', padding: '2rem' }}>
                    Loading billing data...
                  </div>
                ) : (
                  <>
                    {reportType === 'summary' && <SummaryReport metrics={metrics} />}
                    {reportType === 'by_tier' && <TierReport data={revenueByTier} />}
                    {reportType === 'by_status' && <StatusReport data={revenueByStatus} />}
                    {reportType === 'overage' && <OverageReport data={overageReport} />}
                    {reportType === 'renewals' && <RenewalReport data={renewalForecast} />}
                    {reportType === 'detailed' && <DetailedReport entities={entities} />}
                  </>
                )}
                
                {/* Export Button */}
                {!loading && (
                  <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        let dataToExport = []
                        let filename = 'billing_report'
                        
                        switch(reportType) {
                          case 'overage':
                            dataToExport = overageReport
                            filename = 'overage_report'
                            break
                          case 'renewals':
                            dataToExport = renewalForecast
                            filename = 'renewal_forecast'
                            break
                          case 'detailed':
                            dataToExport = entities.map(e => ({
                              name: e.name,
                              type: e.type,
                              tier: e.tier,
                              schools: e.actualSchoolCount,
                              revenue: e.billing?.totalDue || e.annualPrice || 0,
                              status: e.billingStatus
                            }))
                            filename = 'detailed_billing'
                            break
                          default:
                            return
                        }
                        
                        if (dataToExport.length > 0) {
                          exportToCSV(dataToExport, filename)
                        }
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}
                    >
                      📥 Export to CSV
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </GodModeAuth>
  )
}

// Metric Card Component
function MetricCard({ title, value, subtitle, icon, color }) {
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(8px)',
      borderRadius: '0.5rem',
      padding: '1rem',
      border: '1px solid rgba(168, 85, 247, 0.3)',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{
        fontSize: '1.75rem',
        fontWeight: 'bold',
        color: 'white',
        marginBottom: '0.25rem'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '0.875rem',
        color: '#c084fc',
        fontWeight: '600'
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

// Summary Report Component
function SummaryReport({ metrics }) {
  const collectionRate = metrics.totalRevenue > 0 
    ? Math.round((metrics.activeRevenue / metrics.totalRevenue) * 100) 
    : 0

  return (
    <div>
      <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>
        Executive Summary
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <h3 style={{ color: '#10b981', marginBottom: '0.5rem' }}>
            Revenue Health
          </h3>
          <div style={{ color: '#c084fc', fontSize: '0.875rem' }}>
            <p>Collection Rate: {collectionRate}%</p>
            <p>Outstanding: {formatCurrency(metrics.pendingRevenue)}</p>
            <p>Overage Opportunity: {formatCurrency(metrics.overageRevenue)}</p>
          </div>
        </div>
        
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <h3 style={{ color: '#3b82f6', marginBottom: '0.5rem' }}>
            Key Metrics
          </h3>
          <div style={{ color: '#c084fc', fontSize: '0.875rem' }}>
            <p>Avg Contract: {formatCurrency(metrics.averageContractValue)}</p>
            <p>Per School: {formatCurrency(metrics.revenuePerSchool)}</p>
            <p>Total Schools: {metrics.totalSchools}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Tier Report Component
function TierReport({ data }) {
  return (
    <div>
      <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>
        Revenue by Tier
      </h2>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          color: '#c084fc'
        }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(168, 85, 247, 0.3)' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Tier</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Entities</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Schools</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Revenue</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Per Entity</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data).map(([tier, info]) => (
              <tr key={tier} style={{ borderBottom: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <td style={{ padding: '0.75rem' }}>
                  {PRICING_CONFIG.tiers[tier]?.displayName || tier}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  {info.count}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  {info.schools}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  {formatCurrency(info.revenue)}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  {formatCurrency(info.count > 0 ? info.revenue / info.count : 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Status Report Component  
function StatusReport({ data }) {
  return (
    <div>
      <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>
        Revenue by Status
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        {Object.entries(data).map(([status, info]) => (
          <div key={status} style={{
            background: status === 'active' 
              ? 'rgba(16, 185, 129, 0.1)'
              : status === 'pending_payment'
                ? 'rgba(245, 158, 11, 0.1)'
                : 'rgba(239, 68, 68, 0.1)',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: `1px solid ${
              status === 'active' 
                ? 'rgba(16, 185, 129, 0.3)'
                : status === 'pending_payment'
                  ? 'rgba(245, 158, 11, 0.3)'
                  : 'rgba(239, 68, 68, 0.3)'
            }`
          }}>
            <h3 style={{ 
              color: status === 'active' ? '#10b981' : status === 'pending_payment' ? '#f59e0b' : '#ef4444',
              marginBottom: '0.5rem',
              fontSize: '1rem'
            }}>
              {PRICING_CONFIG.billing.statuses[status] || status}
            </h3>
            <div style={{ color: '#c084fc', fontSize: '0.875rem' }}>
              <p style={{ margin: '0.25rem 0' }}>Count: {info.count}</p>
              <p style={{ margin: '0.25rem 0', fontSize: '1.25rem', fontWeight: 'bold' }}>
                {formatCurrency(info.revenue)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Overage Report Component
function OverageReport({ data }) {
  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#c084fc', padding: '2rem' }}>
        <p>No entities currently over capacity 🎉</p>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>
        Capacity Overage Report
      </h2>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          color: '#c084fc'
        }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(168, 85, 247, 0.3)' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Entity</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Tier</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Schools</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Limit</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Over</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Fee</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <td style={{ padding: '0.75rem' }}>{item.entity}</td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  {PRICING_CONFIG.tiers[item.tier]?.displayName || item.tier}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.schools}</td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.limit}</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', color: '#f59e0b' }}>
                  +{item.overage}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  {formatCurrency(item.cost)}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    background: item.status === 'upgrade_required' 
                      ? 'rgba(239, 68, 68, 0.2)'
                      : 'rgba(245, 158, 11, 0.2)',
                    color: item.status === 'upgrade_required' ? '#ef4444' : '#f59e0b'
                  }}>
                    {item.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        background: 'rgba(245, 158, 11, 0.1)',
        borderRadius: '0.5rem',
        border: '1px solid rgba(245, 158, 11, 0.3)'
      }}>
        <p style={{ color: '#f59e0b', fontSize: '0.875rem', margin: 0 }}>
          💰 Total Overage Revenue Opportunity: {formatCurrency(data.reduce((sum, item) => sum + item.cost, 0))}
        </p>
      </div>
    </div>
  )
}

// Renewal Report Component
function RenewalReport({ data }) {
  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#c084fc', padding: '2rem' }}>
        <p>No renewals due in the next 90 days</p>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>
        Upcoming Renewals (Next 90 Days)
      </h2>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          color: '#c084fc'
        }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(168, 85, 247, 0.3)' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Entity</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Days</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Expiry</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Schools</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Revenue</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <td style={{ padding: '0.75rem' }}>{item.entity}</td>
                <td style={{ 
                  padding: '0.75rem', 
                  textAlign: 'center',
                  color: item.daysRemaining <= 30 ? '#ef4444' : item.daysRemaining <= 60 ? '#f59e0b' : '#10b981'
                }}>
                  {item.daysRemaining}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  {item.expiryDate}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.schools}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  {formatCurrency(item.revenue)}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    background: item.status === 'active' 
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(245, 158, 11, 0.2)',
                    color: item.status === 'active' ? '#10b981' : '#f59e0b'
                  }}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '0.5rem',
        border: '1px solid rgba(59, 130, 246, 0.3)'
      }}>
        <p style={{ color: '#3b82f6', fontSize: '0.875rem', margin: 0 }}>
          🔄 Total Renewal Value: {formatCurrency(data.reduce((sum, item) => sum + item.revenue, 0))}
        </p>
      </div>
    </div>
  )
}

// Detailed Report Component
function DetailedReport({ entities }) {
  return (
    <div>
      <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>
        Detailed Entity List
      </h2>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          color: '#c084fc',
          fontSize: '0.875rem'
        }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(168, 85, 247, 0.3)' }}>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Entity</th>
              <th style={{ padding: '0.5rem', textAlign: 'center' }}>Type</th>
              <th style={{ padding: '0.5rem', textAlign: 'center' }}>Tier</th>
              <th style={{ padding: '0.5rem', textAlign: 'center' }}>Schools</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Base</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Overage</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total</th>
              <th style={{ padding: '0.5rem', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {entities.map((entity) => (
              <tr key={entity.id} style={{ borderBottom: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <td style={{ padding: '0.5rem' }}>{entity.name}</td>
                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{entity.type}</td>
                <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                  {PRICING_CONFIG.tiers[entity.tier]?.displayName || entity.tier}
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                  {entity.actualSchoolCount || 0}/{entity.maxSubEntities || 0}
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                  {formatCurrency(entity.billing?.basePrice || entity.annualPrice || 0)}
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                  {formatCurrency(entity.billing?.overage?.overageCost || 0)}
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                  {formatCurrency(entity.billing?.totalDue || entity.annualPrice || 0)}
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    background: entity.billingStatus === 'active' 
                      ? 'rgba(16, 185, 129, 0.2)'
                      : entity.billingStatus === 'pending_payment'
                        ? 'rgba(245, 158, 11, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)',
                    color: entity.billingStatus === 'active' 
                      ? '#10b981' 
                      : entity.billingStatus === 'pending_payment'
                        ? '#f59e0b'
                        : '#ef4444'
                  }}>
                    {PRICING_CONFIG.billing.statuses[entity.billingStatus] || entity.billingStatus || 'pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}