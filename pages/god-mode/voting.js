// pages/god-mode/voting.js - VOTING RESULTS MANAGEMENT
import { useState, useEffect } from 'react'
import Head from 'next/head'
import GodModeAuth from '../../components/god-mode/GodModeAuth'
import GodModeHeader from '../../components/god-mode/GodModeHeader'
import { db, dbHelpers } from '../../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function VotingManagement() {
  const [votingResults, setVotingResults] = useState([])
  const [votingLoading, setVotingLoading] = useState(false)
  const [totalVotes, setTotalVotes] = useState(0)
  const [totalVoters, setTotalVoters] = useState(0)
  const [phaseData, setPhaseData] = useState({ currentPhase: 'SETUP' })

  // Load current phase
  const loadPhaseData = async () => {
    try {
      const config = await dbHelpers.getSystemConfig()
      setPhaseData({ currentPhase: config.programPhase || 'SETUP' })
    } catch (error) {
      console.error('Error loading phase:', error)
    }
  }

  // Load voting results from centralized votes collection
  const loadVotingResults = async () => {
    setVotingLoading(true)
    try {
      const currentYear = dbHelpers.getCurrentAcademicYear()
      console.log('🗳️ Loading voting results for:', currentYear)
      
      // Get all votes for current academic year
      const votesRef = collection(db, 'votes')
      const votesSnapshot = await getDocs(votesRef)
      
      const results = []
      let allVotes = 0
      const voterSet = new Set() // Track unique voters
      
      votesSnapshot.forEach(doc => {
        const voteData = doc.data()
        
        // Filter by current academic year
        if (voteData.academicYear === currentYear) {
          results.push({
            id: doc.id,
            bookId: voteData.bookId,
            bookTitle: voteData.bookTitle || 'Unknown Book',
            bookAuthors: voteData.bookAuthors || 'Unknown Author',
            bookCoverUrl: voteData.bookCoverUrl,
            totalVotes: voteData.totalVotes || 0,
            voterIds: voteData.voterIds || [],
            lastUpdated: voteData.lastUpdated
          })
          
          allVotes += voteData.totalVotes || 0
          
          // Add voters to set for unique count
          if (voteData.voterIds) {
            voteData.voterIds.forEach(voterId => voterSet.add(voterId))
          }
        }
      })
      
      // Sort by total votes (descending)
      results.sort((a, b) => b.totalVotes - a.totalVotes)
      
      setVotingResults(results)
      setTotalVotes(allVotes)
      setTotalVoters(voterSet.size)
      
      console.log('✅ Voting results loaded:', {
        books: results.length,
        totalVotes: allVotes,
        uniqueVoters: voterSet.size
      })
      
    } catch (error) {
      console.error('❌ Error loading voting results:', error)
      alert('Error loading voting results: ' + error.message)
    }
    setVotingLoading(false)
  }

  // Get award for ranking
  const getAward = (position) => {
    switch (position) {
      case 0: return { 
        title: 'Luminous Champion', 
        icon: '🌟', 
        color: '#FFD700',
        description: '1st Place Winner'
      }
      case 1: return { 
        title: 'Radiant Read', 
        icon: '📚', 
        color: '#C0C0C0',
        description: '2nd Place'
      }
      case 2: return { 
        title: 'Brilliant Book', 
        icon: '✨', 
        color: '#CD7F32',
        description: '3rd Place'
      }
      default: return { 
        title: 'Finalist', 
        icon: '📖', 
        color: '#8B5CF6',
        description: `${position + 1}th Place`
      }
    }
  }

  // Announce results - transition from VOTING to RESULTS phase
  const announceResults = async () => {
    if (votingResults.length === 0) {
      alert('Please load voting results first')
      return
    }
    
    const winners = votingResults.slice(0, 3)
    let confirmText = `🏆 ANNOUNCE RESULTS TO ALL STUDENTS?\n\n`
    confirmText += `This will:\n`
    confirmText += `• End the voting period\n`
    confirmText += `• Change phase to RESULTS\n`
    confirmText += `• Show winners to all students immediately\n\n`
    
    confirmText += `🥇 WINNERS TO BE ANNOUNCED:\n`
    winners.forEach((book, index) => {
      const award = getAward(index)
      confirmText += `${award.icon} ${award.title}: "${book.bookTitle}" (${book.totalVotes} votes)\n`
    })
    
    confirmText += `\nContinue with announcement?`
    
    const confirmed = window.confirm(confirmText)
    if (!confirmed) return

    try {
      setVotingLoading(true)
      
      // Transition to RESULTS phase
      await dbHelpers.updateProgramPhase('RESULTS')
      
      // Reload phase data
      await loadPhaseData()
      
      alert(`✅ RESULTS ANNOUNCED!\n\n🏆 Students can now see the winners in their dashboards!\n\n🥇 ${winners[0]?.bookTitle} - Luminous Champion\n🥈 ${winners[1]?.bookTitle} - Radiant Read\n🥉 ${winners[2]?.bookTitle} - Brilliant Book`)
      
    } catch (error) {
      console.error('❌ Error announcing results:', error)
      alert('Error announcing results: ' + error.message)
    }
    setVotingLoading(false)
  }

  // Export voting results
  const exportResults = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      academicYear: dbHelpers.getCurrentAcademicYear(),
      totalBooks: votingResults.length,
      totalVotes: totalVotes,
      uniqueVoters: totalVoters,
      results: votingResults.map((book, index) => ({
        rank: index + 1,
        award: index < 3 ? getAward(index).title : 'Finalist',
        bookId: book.bookId,
        bookTitle: book.bookTitle,
        bookAuthors: book.bookAuthors,
        totalVotes: book.totalVotes,
        voterCount: book.voterIds.length,
        lastUpdated: book.lastUpdated
      }))
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lux-libris-voting-results-${dbHelpers.getCurrentAcademicYear()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Initialize on mount
  useEffect(() => {
    loadPhaseData()
    loadVotingResults()
  }, [])

  return (
    <GodModeAuth pageName="Voting Results">
      {({ isAuthenticated, sessionTimeRemaining, handleLogout }) => (
        <>
          <Head>
            <title>Voting Results - God Mode</title>
          </Head>
          
          <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            
            <GodModeHeader 
              title="Voting Results"
              icon="🗳️"
              sessionTimeRemaining={sessionTimeRemaining}
              onLogout={handleLogout}
            />

            <div style={{
              maxWidth: '80rem',
              margin: '0 auto',
              padding: '2rem 1.5rem'
            }}>
              
              {/* Main Voting Section */}
              <div style={{
                background: 'rgba(139, 92, 246, 0.3)',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '2rem',
                backdropFilter: 'blur(8px)',
                border: '2px solid rgba(139, 92, 246, 0.5)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
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
                    🗳️ Voting Results Tally
                  </h2>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={loadVotingResults}
                      disabled={votingLoading}
                      style={{
                        background: votingLoading ? '#6b7280' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        cursor: votingLoading ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}
                    >
                      {votingLoading ? '⏳ Loading...' : '🔄 Load Results'}
                    </button>
                    
                    {votingResults.length > 0 && (
                      <button
                        onClick={exportResults}
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '600'
                        }}
                      >
                        📦 Export Results
                      </button>
                    )}
                    
                    {/* Show Announce Results button only during VOTING phase */}
                    {phaseData.currentPhase === 'VOTING' && votingResults.length > 0 && (
                      <button
                        onClick={announceResults}
                        disabled={votingLoading}
                        style={{
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          cursor: votingLoading ? 'not-allowed' : 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          animation: 'pulse 2s infinite'
                        }}
                      >
                        🏆 Announce Results to Students
                      </button>
                    )}
                    
                    {/* Show status during RESULTS phase */}
                    {phaseData.currentPhase === 'RESULTS' && (
                      <div style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        ✅ Results Published to Students
                      </div>
                    )}
                  </div>
                </div>

                {/* Voting Summary Stats */}
                {votingResults.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      textAlign: 'center',
                      border: '2px solid #3b82f6'
                    }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📚</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
                        {votingResults.length}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#c084fc' }}>Books</div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      textAlign: 'center',
                      border: '2px solid #10b981'
                    }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🗳️</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
                        {totalVotes}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#c084fc' }}>Total Votes</div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      textAlign: 'center',
                      border: '2px solid #f59e0b'
                    }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>👨‍🎓</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
                        {totalVoters}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#c084fc' }}>Students Voted</div>
                    </div>
                    
                    {totalVoters > 0 && (
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        textAlign: 'center',
                        border: '2px solid #8b5cf6'
                      }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📊</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
                          {Math.round((totalVotes / totalVoters) * 100) / 100}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#c084fc' }}>Avg per Student</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Winners Podium - Top 3 */}
                {votingResults.length > 0 && (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: 'white',
                      marginBottom: '1rem',
                      textAlign: 'center',
                      fontFamily: 'Georgia, serif'
                    }}>
                      🏆 WINNERS PODIUM 🏆
                    </h3>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: votingResults.length >= 3 ? '1fr 1fr 1fr' : `repeat(${votingResults.length}, 1fr)`,
                      gap: '1rem',
                      maxWidth: '800px',
                      margin: '0 auto'
                    }}>
                      {votingResults.slice(0, 3).map((book, index) => {
                        const award = getAward(index)
                        return (
                          <div
                            key={book.id}
                            style={{
                              background: `linear-gradient(135deg, ${award.color}20, ${award.color}10)`,
                              borderRadius: '0.75rem',
                              padding: '1rem',
                              textAlign: 'center',
                              border: `2px solid ${award.color}60`,
                              position: 'relative',
                              transform: index === 0 ? 'scale(1.05)' : 'scale(1)'
                            }}
                          >
                            {/* Award Badge */}
                            <div style={{
                              position: 'absolute',
                              top: '-0.5rem',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: award.color,
                              color: index === 0 ? '#000' : '#fff',
                              borderRadius: '1rem',
                              padding: '0.25rem 0.75rem',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                            }}>
                              {award.description}
                            </div>
                            
                            {/* Book Cover */}
                            <div style={{
                              width: '80px',
                              height: '120px',
                              margin: '1rem auto',
                              borderRadius: '0.5rem',
                              overflow: 'hidden',
                              backgroundColor: `${award.color}30`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: `2px solid ${award.color}60`,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                            }}>
                              {book.bookCoverUrl ? (
                                <img
                                  src={book.bookCoverUrl}
                                  alt={book.bookTitle}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextElementSibling.style.display = 'flex'
                                  }}
                                />
                              ) : null}
                              <div style={{
                                display: book.bookCoverUrl ? 'none' : 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                height: '100%',
                                fontSize: '24px',
                                color: award.color
                              }}>
                                📚
                              </div>
                            </div>
                            
                            {/* Award Title */}
                            <div style={{
                              fontSize: '1.125rem',
                              fontWeight: 'bold',
                              color: award.color,
                              marginBottom: '0.5rem',
                              fontFamily: 'Georgia, serif'
                            }}>
                              {award.icon} {award.title}
                            </div>
                            
                            {/* Book Info */}
                            <div style={{
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: 'white',
                              marginBottom: '0.25rem',
                              lineHeight: '1.2'
                            }}>
                              &quot;{book.bookTitle}&quot;
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#c084fc',
                              marginBottom: '0.5rem'
                            }}>
                              by {book.bookAuthors}
                            </div>
                            
                            {/* Vote Count */}
                            <div style={{
                              background: `${award.color}30`,
                              borderRadius: '0.5rem',
                              padding: '0.5rem',
                              display: 'inline-block',
                              border: `1px solid ${award.color}60`
                            }}>
                              <div style={{
                                fontSize: '1.25rem',
                                fontWeight: 'bold',
                                color: 'white'
                              }}>
                                {book.totalVotes}
                              </div>
                              <div style={{
                                fontSize: '0.75rem',
                                color: '#c084fc'
                              }}>
                                {book.totalVotes === 1 ? 'vote' : 'votes'}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Complete Results Table */}
                {votingResults.length > 0 && (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <h4 style={{
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      color: 'white',
                      marginBottom: '1rem',
                      fontFamily: 'Georgia, serif'
                    }}>
                      📊 Complete Results ({votingResults.length} books)
                    </h4>
                    
                    <div style={{
                      maxHeight: '400px',
                      overflowY: 'auto',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '0.375rem'
                    }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.875rem'
                      }}>
                        <thead>
                          <tr style={{
                            background: 'rgba(139, 92, 246, 0.3)',
                            position: 'sticky',
                            top: 0
                          }}>
                            <th style={{ 
                              padding: '0.75rem', 
                              textAlign: 'left', 
                              color: 'white', 
                              fontWeight: '600',
                              borderBottom: '1px solid rgba(139, 92, 246, 0.5)'
                            }}>
                              Rank
                            </th>
                            <th style={{ 
                              padding: '0.75rem', 
                              textAlign: 'left', 
                              color: 'white', 
                              fontWeight: '600',
                              borderBottom: '1px solid rgba(139, 92, 246, 0.5)'
                            }}>
                              Book
                            </th>
                            <th style={{ 
                              padding: '0.75rem', 
                              textAlign: 'center', 
                              color: 'white', 
                              fontWeight: '600',
                              borderBottom: '1px solid rgba(139, 92, 246, 0.5)'
                            }}>
                              Votes
                            </th>
                            <th style={{ 
                              padding: '0.75rem', 
                              textAlign: 'center', 
                              color: 'white', 
                              fontWeight: '600',
                              borderBottom: '1px solid rgba(139, 92, 246, 0.5)'
                            }}>
                              Award
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {votingResults.map((book, index) => {
                            const award = getAward(index)
                            return (
                              <tr 
                                key={book.id}
                                style={{
                                  backgroundColor: index < 3 ? `${award.color}10` : 'transparent',
                                  borderBottom: '1px solid rgba(139, 92, 246, 0.2)'
                                }}
                              >
                                <td style={{ 
                                  padding: '0.75rem', 
                                  color: index < 3 ? award.color : 'white',
                                  fontWeight: index < 3 ? 'bold' : 'normal'
                                }}>
                                  #{index + 1}
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                  <div style={{ color: 'white', fontWeight: '600', marginBottom: '0.25rem' }}>
                                    &quot;{book.bookTitle}&quot;
                                  </div>
                                  <div style={{ color: '#c084fc', fontSize: '0.75rem' }}>
                                    by {book.bookAuthors}
                                  </div>
                                </td>
                                <td style={{ 
                                  padding: '0.75rem', 
                                  textAlign: 'center',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: '1rem'
                                }}>
                                  {book.totalVotes}
                                </td>
                                <td style={{ 
                                  padding: '0.75rem', 
                                  textAlign: 'center',
                                  color: award.color,
                                  fontWeight: '600'
                                }}>
                                  {index < 3 ? `${award.icon} ${award.title}` : '📖 Finalist'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* No Results State */}
                {!votingLoading && votingResults.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#c084fc'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗳️</div>
                    <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No voting results yet</p>
                    <p style={{ fontSize: '0.875rem' }}>
                      Click &quot;Load Results&quot; to check for votes, or wait for students to start voting!
                    </p>
                  </div>
                )}
              </div>

              {/* Phase Status Info */}
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
                  📊 Voting System Information
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
                    <h4 style={{ color: '#3b82f6', marginBottom: '0.5rem' }}>🗳️ Voting Period</h4>
                    <p style={{ color: '#93c5fd', fontSize: '0.875rem' }}>
                      March 31 - April 14 annually<br />
                      Students can vote for their favorite books
                    </p>
                  </div>
                  
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    <h4 style={{ color: '#10b981', marginBottom: '0.5rem' }}>🏆 Awards</h4>
                    <p style={{ color: '#86efac', fontSize: '0.875rem' }}>
                      Top 3 books receive special awards<br />
                      Winners announced April 15th
                    </p>
                  </div>
                  
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    border: '1px solid rgba(245, 158, 11, 0.3)'
                  }}>
                    <h4 style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>📈 Current Status</h4>
                    <p style={{ color: '#fcd34d', fontSize: '0.875rem' }}>
                      Phase: {phaseData.currentPhase}<br />
                      {phaseData.currentPhase === 'VOTING' ? 'Voting is OPEN' :
                       phaseData.currentPhase === 'RESULTS' ? 'Results ANNOUNCED' :
                       'Voting period not active'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <style jsx>{`
              @keyframes pulse {
                0%, 100% {
                  transform: scale(1);
                  opacity: 1;
                }
                50% {
                  transform: scale(1.05);
                  opacity: 0.8;
                }
              }
            `}</style>
          </div>
        </>
      )}
    </GodModeAuth>
  )
}