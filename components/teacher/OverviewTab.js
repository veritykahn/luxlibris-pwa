// components/teacher/OverviewTab.js - Overview Dashboard
import React, { useState } from 'react'

export default function OverviewTab({ 
  statsData, 
  appStudents, 
  manualStudents, 
  userProfile,
  onGradeClick 
}) {
  // Calculate students at goal
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

      {/* Students at Goal & Most Active Grade Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr',
        gap: '1.5rem'
      }}>
        
        {/* Students at Goal Card */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              ✅
            </div>
            <div>
              <h3 style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#223848',
                margin: 0,
                fontFamily: 'Avenir, system-ui, sans-serif'
              }}>
                {studentsAtGoal}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#6B7280',
                margin: 0
              }}>
                Students at Goal
              </p>
            </div>
          </div>
          <div style={{
            padding: '0.75rem',
            background: '#F0FDF4',
            borderRadius: '0.5rem',
            border: '1px solid #10B981'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.875rem'
            }}>
              <span style={{ color: '#065F46', fontWeight: '600' }}>
                {studentsAtGoal} of {statsData.totalAppStudents + statsData.totalManualStudents} students
              </span>
              <span style={{ 
                color: '#065F46',
                fontSize: '1.25rem',
                fontWeight: 'bold'
              }}>
                {Math.round((studentsAtGoal / (statsData.totalAppStudents + statsData.totalManualStudents)) * 100)}%
              </span>
            </div>
            <div style={{
              marginTop: '0.5rem',
              height: '8px',
              background: '#D1FAE5',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min((studentsAtGoal / (statsData.totalAppStudents + statsData.totalManualStudents)) * 100, 100)}%`,
                background: '#10B981',
                transition: 'width 0.3s'
              }}></div>
            </div>
          </div>
        </div>

        {/* Most Active Grade Card */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              🏆
            </div>
            <div>
              <h3 style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#223848',
                margin: 0,
                fontFamily: 'Avenir, system-ui, sans-serif'
              }}>
                Grade {statsData.mostActiveGrade}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#6B7280',
                margin: 0
              }}>
                Most Active Grade
              </p>
            </div>
          </div>
          <div style={{
            padding: '0.75rem',
            background: '#FEF3C7',
            borderRadius: '0.5rem',
            border: '1px solid #F59E0B'
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: '#92400E'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontWeight: '600' }}>Total Books:</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>
                  {statsData.byGrade[statsData.mostActiveGrade]?.books || 0}
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#B45309'
              }}>
                <span>Students:</span>
                <span>{statsData.byGrade[statsData.mostActiveGrade]?.total || 0}</span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#B45309'
              }}>
                <span>Avg per student:</span>
                <span>
                  {statsData.byGrade[statsData.mostActiveGrade]?.total 
                    ? ((statsData.byGrade[statsData.mostActiveGrade]?.books || 0) / statsData.byGrade[statsData.mostActiveGrade]?.total).toFixed(1)
                    : 0
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Grades Comparison Table */}
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
          gap: '0.5rem',
          fontFamily: 'Avenir, system-ui, sans-serif'
        }}>
          📈 Grade Comparison
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem'
          }}>
            <thead>
              <tr style={{
                backgroundColor: '#F9FAFB',
                borderBottom: '2px solid #E5E7EB'
              }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                  Grade
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                  Students
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                  Total Books
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                  Avg/Student
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                  At Goal
                </th>
              </tr>
            </thead>
            <tbody>
              {[4, 5, 6, 7, 8].map((grade, index) => {
                const gradeData = statsData.byGrade[grade] || { total: 0, app: 0, manual: 0, books: 0 }
                const gradeStudents = [
                  ...appStudents.filter(s => parseInt(s.grade) === grade),
                  ...manualStudents.filter(s => parseInt(s.grade) === grade)
                ]
                const gradeAtGoal = gradeStudents.filter(s => {
                  const books = s.type === 'app' || (s.booksSubmittedThisYear !== undefined) 
                    ? (s.booksSubmittedThisYear || 0) 
                    : (s.totalBooksThisYear || 0)
                  return books >= (s.personalGoal || 0)
                }).length
                
                return (
                  <tr 
                    key={grade}
                    style={{
                      backgroundColor: index % 2 === 0 ? 'white' : '#FAFAFA',
                      borderBottom: '1px solid #F3F4F6'
                    }}
                  >
                    <td style={{ 
                      padding: '0.75rem', 
                      fontWeight: grade === statsData.mostActiveGrade ? 'bold' : '500',
                      color: grade === statsData.mostActiveGrade ? '#F59E0B' : '#111827'
                    }}>
                      {grade === statsData.mostActiveGrade && '🏆 '}
                      Grade {grade}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', color: '#6B7280' }}>
                      {gradeData.total}
                      <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                        {gradeData.app}📱 {gradeData.manual}📝
                      </div>
                    </td>
                    <td style={{ 
                      padding: '0.75rem', 
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#223848'
                    }}>
                      {gradeData.books}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', color: '#6B7280' }}>
                      {gradeData.total > 0 ? (gradeData.books / gradeData.total).toFixed(1) : '0.0'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: gradeAtGoal === gradeData.total && gradeData.total > 0 ? '#ECFDF5' : '#F3F4F6',
                        color: gradeAtGoal === gradeData.total && gradeData.total > 0 ? '#065F46' : '#6B7280',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {gradeAtGoal}/{gradeData.total}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inactive Students Alert (if any) */}
      {(statsData.totalAppStudents + statsData.totalManualStudents) - statsData.activeStudents > 0 && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: '0.75rem',
          padding: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#991B1B',
                margin: '0 0 0.25rem 0'
              }}>
                Inactive Students
              </h4>
              <p style={{
                fontSize: '0.875rem',
                color: '#B91C1C',
                margin: 0
              }}>
                {(statsData.totalAppStudents + statsData.totalManualStudents) - statsData.activeStudents} student{((statsData.totalAppStudents + statsData.totalManualStudents) - statsData.activeStudents) !== 1 ? 's are' : ' is'} currently inactive. 
                Visit the grade tabs to manage student status.
              </p>
            </div>
          </div>
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