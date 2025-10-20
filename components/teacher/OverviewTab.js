// components/teacher/OverviewTab.js - Overview Dashboard
import React, { useState } from 'react'

export default function OverviewTab({ 
  statsData, 
  appStudents, 
  manualStudents, 
  searchTerm, 
  filterType,
  userProfile,
  onGradeClick 
}) {
  const [showQuickActions, setShowQuickActions] = useState(true)

  // Filter students based on search and type
  const filterStudents = (students, type) => {
    let filtered = students
    
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastInitial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.displayUsername && student.displayUsername.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    if (filterType !== 'all') {
      if (filterType === 'app' && type === 'manual') return []
      if (filterType === 'manual' && type === 'app') return []
    }
    
    return filtered
  }

  const filteredApp = filterStudents(appStudents, 'app')
  const filteredManual = filterStudents(manualStudents, 'manual')

  // Get recent activity (last 5 students with book submissions)
  const getRecentActivity = () => {
    const allStudents = [
      ...appStudents.map(s => ({ ...s, type: 'app' })),
      ...manualStudents.map(s => ({ ...s, type: 'manual' }))
    ]
    
    return allStudents
      .filter(s => s.type === 'app' ? s.booksSubmittedThisYear > 0 : s.totalBooksThisYear > 0)
      .sort((a, b) => {
        const aBooks = a.type === 'app' ? a.booksSubmittedThisYear : a.totalBooksThisYear
        const bBooks = b.type === 'app' ? b.booksSubmittedThisYear : b.totalBooksThisYear
        return bBooks - aBooks
      })
      .slice(0, 5)
  }

  const recentActivity = getRecentActivity()

  // FIXED: Calculate students at goal correctly
  const studentsAtGoal = [
    ...appStudents.map(s => ({ ...s, type: 'app' })),
    ...manualStudents.map(s => ({ ...s, type: 'manual' }))
  ].filter(s => {
    const books = s.type === 'app' ? (s.booksSubmittedThisYear || 0) : (s.totalBooksThisYear || 0)
    return books >= (s.personalGoal || 0)
  }).length

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      
      {/* Quick Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <StatCard
          icon="📱"
          title="App Students"
          value={statsData.totalAppStudents}
          subtitle={`${statsData.totalAppStudents - appStudents.filter(s => s.status === 'inactive').length} active`}
          color="#ADD4EA"
        />
        <StatCard
          icon="📝"
          title="Manual Students"
          value={statsData.totalManualStudents}
          subtitle={`${statsData.totalManualStudents - manualStudents.filter(s => s.status === 'inactive').length} active`}
          color="#C3E0DE"
        />
        <StatCard
          icon="📚"
          title="Total Books"
          value={statsData.totalBooks}
          subtitle="Completed this year"
          color="#A1E5DB"
        />
        <StatCard
          icon="✅"
          title="Active Students"
          value={statsData.activeStudents}
          subtitle={`${Math.round((statsData.activeStudents / (statsData.totalAppStudents + statsData.totalManualStudents)) * 100)}% participation`}
          color="#B6DFEB"
        />
      </div>

      {/* Grade Distribution */}
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '1.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#223848',
          margin: '0 0 1rem 0'
        }}>
          📊 Students by Grade
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '0.75rem'
        }}>
          {[4, 5, 6, 7, 8].map(grade => {
            const gradeData = statsData.byGrade[grade] || { total: 0, app: 0, manual: 0, books: 0 }
            
            return (
              <button
                key={grade}
                onClick={() => onGradeClick(grade)}
                style={{
                  background: 'linear-gradient(135deg, #F0F9FF, #E0F2FE)',
                  border: '1px solid #BAE6FD',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <h4 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#223848',
                  margin: '0 0 0.5rem 0'
                }}>
                  Grade {grade}
                </h4>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#6B7280',
                  display: 'grid',
                  gap: '0.125rem'
                }}>
                  <div>{gradeData.total} students</div>
                  <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                    {gradeData.app} app • {gradeData.manual} manual
                  </div>
                  <div style={{
                    marginTop: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    background: '#ECFDF5',
                    color: '#065F46',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    display: 'inline-block'
                  }}>
                    {gradeData.books} books
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
        gap: '1.5rem'
      }}>
        
        {/* Recent Activity */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 'bold',
            color: '#223848',
            margin: '0 0 1rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            ⭐ Top Readers
          </h3>
          {recentActivity.length === 0 ? (
            <p style={{
              color: '#6B7280',
              fontSize: '0.875rem',
              textAlign: 'center',
              padding: '2rem 0'
            }}>
              No books submitted yet this year
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {recentActivity.map((student, index) => (
                <div
                  key={`${student.type}-${student.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem',
                    background: index === 0 ? '#FEF3C7' : '#F9FAFB',
                    borderRadius: '0.5rem',
                    border: index === 0 ? '1px solid #F59E0B' : '1px solid #E5E7EB'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {index === 0 && <span>🏆</span>}
                    {index === 1 && <span>🥈</span>}
                    {index === 2 && <span>🥉</span>}
                    {index > 2 && <span style={{ width: '1rem' }}>{index + 1}.</span>}
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#223848'
                      }}>
                        {student.firstName} {student.lastInitial}.
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6B7280'
                      }}>
                        Grade {student.grade} • {student.type === 'app' ? '📱' : '📝'}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: '0.25rem 0.5rem',
                    background: '#ECFDF5',
                    color: '#065F46',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {student.type === 'app' ? student.booksSubmittedThisYear : student.totalBooksThisYear} books
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 'bold',
            color: '#223848',
            margin: '0 0 1rem 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            ⚡ Quick Stats
          </h3>
          
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {/* Average books per student */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.75rem',
              background: '#F9FAFB',
              borderRadius: '0.5rem'
            }}>
              <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                Avg. Books/Student
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#223848' }}>
                {((statsData.totalBooks / (statsData.totalAppStudents + statsData.totalManualStudents)) || 0).toFixed(1)}
              </span>
            </div>

            {/* Students at goal - FIXED */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.75rem',
              background: '#F9FAFB',
              borderRadius: '0.5rem'
            }}>
              <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                Students at Goal
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#223848' }}>
                {studentsAtGoal} / {statsData.totalAppStudents + statsData.totalManualStudents}
              </span>
            </div>

            {/* Most active grade */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.75rem',
              background: '#F9FAFB',
              borderRadius: '0.5rem'
            }}>
              <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                Most Active Grade
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#223848' }}>
                Grade {Object.entries(statsData.byGrade)
                  .reduce((max, [grade, data]) => 
                    data.books > (statsData.byGrade[max]?.books || 0) ? grade : max, '4'
                  )}
              </span>
            </div>

            {/* Inactive students */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.75rem',
              background: '#FEF2F2',
              borderRadius: '0.5rem'
            }}>
              <span style={{ fontSize: '0.875rem', color: '#991B1B' }}>
                Inactive Students
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#991B1B' }}>
                {(statsData.totalAppStudents + statsData.totalManualStudents) - statsData.activeStudents}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Search/Filter Results */}
      {(searchTerm || filterType !== 'all') && (
        <div style={{
          background: '#F0F9FF',
          border: '1px solid #0EA5E9',
          borderRadius: '0.5rem',
          padding: '1rem'
        }}>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#075985',
            margin: '0 0 0.5rem 0'
          }}>
            Search Results
          </h4>
          <p style={{
            fontSize: '0.875rem',
            color: '#0C4A6E',
            margin: 0
          }}>
            Found {filteredApp.length + filteredManual.length} students
            {searchTerm && ` matching "${searchTerm}"`}
            {filterType !== 'all' && ` (${filterType} students only)`}
          </p>
        </div>
      )}
    </div>
  )
}

// Stat Card Component
function StatCard({ icon, title, value, subtitle, color }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '0.75rem',
      padding: '1.25rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      border: `2px solid ${color}40`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '-10px',
        right: '-10px',
        width: '60px',
        height: '60px',
        background: `${color}20`,
        borderRadius: '50%'
      }}></div>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '0.75rem',
        position: 'relative'
      }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      </div>
      <h3 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#223848',
        margin: '0 0 0.25rem 0'
      }}>
        {value}
      </h3>
      <p style={{
        fontSize: '0.875rem',
        color: '#374151',
        margin: '0 0 0.125rem 0',
        fontWeight: '600'
      }}>
        {title}
      </p>
      <p style={{
        fontSize: '0.75rem',
        color: '#9CA3AF',
        margin: 0
      }}>
        {subtitle}
      </p>
    </div>
  )
}