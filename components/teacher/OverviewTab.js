// components/teacher/OverviewTab.js - Overview Dashboard
import React from 'react'

export default function OverviewTab({ 
  statsData, 
  appStudents, 
  manualStudents, 
  searchTerm, 
  filterType,
  userProfile,
  onGradeClick 
}) {
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