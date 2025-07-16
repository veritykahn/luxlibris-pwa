// components/ResultsInterface.js - Display voting results to students
import { useState, useEffect } from 'react';
import { db, dbHelpers } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function ResultsInterface({ studentData, currentTheme }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentVote, setStudentVote] = useState(null);

  // Load results when component mounts
  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      console.log('🏆 Loading voting results for student display...');
      
      const currentYear = dbHelpers.getCurrentAcademicYear();
      
      // Get voting results from centralized votes collection
      const votesRef = collection(db, 'votes');
      const votesSnapshot = await getDocs(votesRef);
      
      const votingResults = [];
      votesSnapshot.forEach(doc => {
        const voteData = doc.data();
        if (voteData.academicYear === currentYear) {
          votingResults.push({
            bookId: voteData.bookId,
            bookTitle: voteData.bookTitle || 'Unknown Book',
            bookAuthors: voteData.bookAuthors || 'Unknown Author',
            bookCoverUrl: voteData.bookCoverUrl,
            totalVotes: voteData.totalVotes || 0
          });
        }
      });
      
      // Sort by votes (descending)
      votingResults.sort((a, b) => b.totalVotes - a.totalVotes);
      
      // Get student's vote
      const studentVotes = studentData.votes?.filter(vote => 
        vote.academicYear === currentYear
      ) || [];
      const studentVote = studentVotes.length > 0 ? studentVotes[0] : null;
      
      setResults(votingResults);
      setStudentVote(studentVote);
      
      console.log('✅ Results loaded:', {
        totalBooks: votingResults.length,
        studentVoted: !!studentVote,
        studentVoteFor: studentVote?.bookId
      });
      
    } catch (error) {
      console.error('❌ Error loading results:', error);
    }
    setLoading(false);
  };

  // Get award info for position
  const getAward = (position) => {
    switch (position) {
      case 0: return { 
        title: 'Luminous Champion', 
        icon: '🌟', 
        color: '#FFD700',
        description: '1st Place Winner'
      };
      case 1: return { 
        title: 'Radiant Reader', 
        icon: '📚', 
        color: '#C0C0C0',
        description: '2nd Place'
      };
      case 2: return { 
        title: 'Brilliant Book', 
        icon: '✨', 
        color: '#CD7F32',
        description: '3rd Place'
      };
      default: return null;
    }
  };

  // Check if student voted for a winner
  const checkStudentResult = () => {
    if (!studentVote || results.length === 0) return null;
    
    const studentBookIndex = results.findIndex(book => book.bookId === studentVote.bookId);
    if (studentBookIndex === -1) return null;
    
    const isWinner = studentBookIndex < 3;
    const award = getAward(studentBookIndex);
    
    return {
      position: studentBookIndex + 1,
      isWinner,
      award,
      book: results[studentBookIndex]
    };
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: currentTheme.surface,
        borderRadius: '16px',
        padding: '32px',
        textAlign: 'center',
        margin: '20px 0',
        animation: 'slideInUp 0.8s ease-out 0.6s both'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `3px solid ${currentTheme.primary}30`,
          borderTop: `3px solid ${currentTheme.primary}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p style={{ color: currentTheme.textSecondary }}>Loading results...</p>
      </div>
    );
  }

  const studentResult = checkStudentResult();
  const winners = results.slice(0, 3);

  return (
    <div style={{
      backgroundColor: currentTheme.surface,
      borderRadius: '16px',
      padding: '24px',
      margin: '20px 0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      border: `2px solid ${currentTheme.primary}`,
      animation: 'slideInUp 0.8s ease-out 0.6s both'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '24px'
      }}>
        <div style={{ 
          fontSize: '64px', 
          marginBottom: '16px',
          animation: 'bounce 2s ease-in-out infinite'
        }}>
          🏆
        </div>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '600',
          color: currentTheme.textPrimary,
          margin: '0 0 8px 0',
          fontFamily: 'Didot, "Times New Roman", serif'
        }}>
          Lux Libris Award Results
        </h2>
        <p style={{
          fontSize: '16px',
          color: currentTheme.textSecondary,
          margin: 0
        }}>
          The winners have been announced!
        </p>
      </div>

      {/* Student's Result (if they voted) */}
      {studentVote && studentResult && (
        <div style={{
          background: studentResult.isWinner 
            ? `linear-gradient(135deg, ${studentResult.award.color}20, ${studentResult.award.color}10)` 
            : `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.primary}10)`,
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          border: studentResult.isWinner 
            ? `2px solid ${studentResult.award.color}60` 
            : `2px solid ${currentTheme.primary}60`,
          textAlign: 'center'
        }}>
          {studentResult.isWinner ? (
            <>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: studentResult.award.color,
                margin: '0 0 8px 0'
              }}>
                🎉 Your vote was a winner! 🎉
              </h3>
              <p style={{
                fontSize: '16px',
                color: currentTheme.textPrimary,
                margin: '0 0 8px 0',
                fontWeight: '600'
              }}>
                You voted for "{studentResult.book.bookTitle}"
              </p>
              <p style={{
                fontSize: '14px',
                color: studentResult.award.color,
                margin: 0,
                fontWeight: '600'
              }}>
                {studentResult.award.icon} {studentResult.award.title} - {studentResult.award.description}!
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🗳️</div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: currentTheme.textPrimary,
                margin: '0 0 8px 0'
              }}>
                Your Vote
              </h3>
              <p style={{
                fontSize: '14px',
                color: currentTheme.textSecondary,
                margin: '0 0 4px 0'
              }}>
                You voted for "{studentResult.book.bookTitle}"
              </p>
              <p style={{
                fontSize: '12px',
                color: currentTheme.textSecondary,
                margin: 0
              }}>
                Finished #{studentResult.position} • Great choice!
              </p>
            </>
          )}
        </div>
      )}

      {/* Winners Podium */}
      <div style={{
        background: `linear-gradient(135deg, ${currentTheme.primary}10, ${currentTheme.accent}10)`,
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        border: `1px solid ${currentTheme.primary}30`
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: currentTheme.textPrimary,
          margin: '0 0 16px 0',
          textAlign: 'center'
        }}>
          🏆 Winners 🏆
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: winners.length >= 3 ? '1fr 1fr 1fr' : `repeat(${winners.length}, 1fr)`,
          gap: '16px'
        }}>
          {winners.map((book, index) => {
            const award = getAward(index);
            return (
              <div
                key={book.bookId}
                style={{
                  background: `linear-gradient(135deg, ${award.color}15, ${award.color}05)`,
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  border: `2px solid ${award.color}40`,
                  transform: index === 0 ? 'scale(1.05)' : 'scale(1)'
                }}
              >
                {/* Award Badge */}
                <div style={{
                  background: award.color,
                  color: index === 0 ? '#000' : '#fff',
                  borderRadius: '12px',
                  padding: '4px 8px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  display: 'inline-block'
                }}>
                  {award.description}
                </div>
                
                {/* Book Cover */}
                <div style={{
                  width: '60px',
                  height: '90px',
                  margin: '0 auto 8px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  backgroundColor: `${award.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${award.color}40`
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
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{
                    display: book.bookCoverUrl ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    fontSize: '20px',
                    color: award.color
                  }}>
                    📚
                  </div>
                </div>
                
                {/* Award Title */}
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: award.color,
                  marginBottom: '4px'
                }}>
                  {award.icon} {award.title}
                </div>
                
                {/* Book Info */}
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  marginBottom: '2px',
                  lineHeight: '1.2'
                }}>
                  "{book.bookTitle}"
                </div>
                <div style={{
                  fontSize: '10px',
                  color: currentTheme.textSecondary,
                  marginBottom: '4px'
                }}>
                  by {book.bookAuthors}
                </div>
                
                {/* Vote Count */}
                <div style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: currentTheme.textPrimary
                }}>
                  {book.totalVotes} {book.totalVotes === 1 ? 'vote' : 'votes'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Final Message */}
      <div style={{
        backgroundColor: `${currentTheme.primary}10`,
        borderRadius: '12px',
        padding: '16px',
        textAlign: 'center',
        border: `1px solid ${currentTheme.primary}40`
      }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎉</div>
        <p style={{
          fontSize: '14px',
          color: currentTheme.textPrimary,
          margin: '0 0 4px 0',
          fontWeight: '600'
        }}>
          Congratulations to all participants!
        </p>
        <p style={{
          fontSize: '12px',
          color: currentTheme.textSecondary,
          margin: 0
        }}>
          Thank you for making this year's Lux Libris Award amazing. 
          Keep reading and see you next year!
        </p>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideInUp {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-8px);
          }
          60% {
            transform: translateY(-4px);
          }
        }
      `}</style>
    </div>
  );
}