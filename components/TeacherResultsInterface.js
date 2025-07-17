// components/TeacherResultsInterface.js - Display voting results for teachers
// Shows program winners + aggregated results from this teacher's students
import { useState, useEffect } from 'react';
import { db, dbHelpers, getCurrentAcademicYear } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function TeacherResultsInterface({ userProfile, currentTheme }) {
  const [results, setResults] = useState([]);
  const [teacherResults, setTeacherResults] = useState({
    totalVotes: 0,
    topChoice: null,
    studentVotes: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      console.log('🏆 Loading voting results for teacher dashboard...');
      
      const currentYear = getCurrentAcademicYear();
      
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
      
      // Sort by votes (descending) and take top 3
      votingResults.sort((a, b) => b.totalVotes - a.totalVotes);
      const top3Results = votingResults.slice(0, 3);
      
      setResults(top3Results);
      
      // Load this teacher's students' votes
      await loadTeacherStudentVotes(currentYear);
      
      console.log('✅ Results loaded:', {
        totalBooks: votingResults.length,
        winners: top3Results.length
      });
      
    } catch (error) {
      console.error('❌ Error loading results:', error);
    }
    setLoading(false);
  };

  const loadTeacherStudentVotes = async (currentYear) => {
    try {
      if (!userProfile?.entityId || !userProfile?.schoolId || !userProfile?.uid) {
        return;
      }

      // Find teacher document ID
      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`);
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid));
      const teacherSnapshot = await getDocs(teacherQuery);
      
      if (teacherSnapshot.empty) {
        return;
      }

      const teacherId = teacherSnapshot.docs[0].id;
      let allStudentVotes = [];

      // Get app students' votes
      const appStudentsRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/students`);
      const appStudentsQuery = query(appStudentsRef, where('currentTeacherId', '==', teacherId));
      const appStudentsSnapshot = await getDocs(appStudentsQuery);
      
      appStudentsSnapshot.forEach(doc => {
        const studentData = doc.data();
        const votes = studentData.votes?.filter(vote => vote.academicYear === currentYear) || [];
        votes.forEach(vote => {
          if (vote.bookId) {
            allStudentVotes.push({
              type: 'app',
              studentName: `${studentData.firstName} ${studentData.lastInitial}.`,
              bookId: vote.bookId
            });
          }
        });
      });

      // Get manual students' votes
      const manualStudentsRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`);
      const manualStudentsSnapshot = await getDocs(manualStudentsRef);
      
      manualStudentsSnapshot.forEach(doc => {
        const studentData = doc.data();
        if (studentData.vote && studentData.vote.bookId) {
          allStudentVotes.push({
            type: 'manual',
            studentName: `${studentData.firstName} ${studentData.lastInitial}.`,
            bookId: studentData.vote.bookId
          });
        }
      });

      // Aggregate votes by book
      const votesByBook = {};
      allStudentVotes.forEach(vote => {
        if (!votesByBook[vote.bookId]) {
          votesByBook[vote.bookId] = {
            bookId: vote.bookId,
            count: 0,
            voters: []
          };
        }
        votesByBook[vote.bookId].count++;
        votesByBook[vote.bookId].voters.push(vote.studentName);
      });

      // Find top choice
      const sortedVotes = Object.values(votesByBook).sort((a, b) => b.count - a.count);
      const topChoice = sortedVotes.length > 0 ? sortedVotes[0] : null;

      // FIXED: Fetch book details directly from masterNominees
      if (topChoice) {
        try {
          const masterNomineesRef = collection(db, 'masterNominees');
          const masterNomineesSnapshot = await getDocs(masterNomineesRef);
          
          let bookFound = false;
          masterNomineesSnapshot.forEach(doc => {
            const bookData = doc.data();
            if (bookData.id === topChoice.bookId) {
              topChoice.bookTitle = bookData.title || 'Unknown Book';
              topChoice.bookAuthors = bookData.authors || 'Unknown Author';
              bookFound = true;
            }
          });
          
          if (!bookFound) {
            console.warn(`Book details not found for ID: ${topChoice.bookId}`);
            topChoice.bookTitle = 'Book Not Found';
            topChoice.bookAuthors = 'Unknown Author';
          }
        } catch (error) {
          console.error('Error fetching book details:', error);
          topChoice.bookTitle = 'Error Loading Book';
          topChoice.bookAuthors = 'Unknown Author';
        }
      }

      setTeacherResults({
        totalVotes: allStudentVotes.length,
        topChoice: topChoice,
        studentVotes: allStudentVotes
      });

    } catch (error) {
      console.error('❌ Error loading teacher student votes:', error);
    }
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

  if (loading) {
    return (
      <div style={{
        backgroundColor: currentTheme.surface,
        borderRadius: '1rem',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '2rem',
          height: '2rem',
          border: '3px solid #C3E0DE',
          borderTop: '3px solid #223848',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }}></div>
        <p style={{ color: '#6b7280' }}>Loading results...</p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: currentTheme.surface,
      borderRadius: '1rem',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      border: '2px solid #9333EA'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '1.5rem'
      }}>
        <div style={{ 
          fontSize: '3rem', 
          marginBottom: '1rem',
          animation: 'bounce 2s ease-in-out infinite'
        }}>
          🏆
        </div>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#223848',
          margin: '0 0 0.5rem 0',
          fontFamily: 'Georgia, serif'
        }}>
          Lux Libris Award Results
        </h2>
        <p style={{
          fontSize: '1rem',
          color: '#6b7280',
          margin: 0
        }}>
          The winners have been announced!
        </p>
      </div>

      {/* Program Winners */}
      <div style={{
        background: 'linear-gradient(135deg, #9333EA20, #6366F120)',
        borderRadius: '1rem',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        border: '1px solid #9333EA40'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#223848',
          margin: '0 0 1rem 0',
          textAlign: 'center'
        }}>
          🏆 Program Winners 🏆
        </h3>
        
        {results.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#6b7280'
          }}>
            <p>Results not yet available</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: results.length >= 3 ? '1fr 1fr 1fr' : `repeat(${results.length}, 1fr)`,
            gap: '1rem'
          }}>
            {results.map((book, index) => {
              const award = getAward(index);
              return (
                <div
                  key={book.bookId}
                  style={{
                    background: `linear-gradient(135deg, ${award.color}15, ${award.color}05)`,
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    textAlign: 'center',
                    border: `2px solid ${award.color}40`,
                    transform: index === 0 ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  {/* Award Badge */}
                  <div style={{
                    background: award.color,
                    color: index === 0 ? '#000' : '#fff',
                    borderRadius: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.625rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    display: 'inline-block'
                  }}>
                    {award.description}
                  </div>
                  
                  {/* Book Cover */}
                  <div style={{
                    width: '60px',
                    height: '90px',
                    margin: '0 auto 0.5rem',
                    borderRadius: '0.375rem',
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
                      fontSize: '1.25rem',
                      color: award.color
                    }}>
                      📚
                    </div>
                  </div>
                  
                  {/* Award Title */}
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    color: award.color,
                    marginBottom: '0.25rem'
                  }}>
                    {award.icon} {award.title}
                  </div>
                  
                  {/* Book Info */}
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#223848',
                    marginBottom: '0.125rem',
                    lineHeight: '1.2'
                  }}>
                    &quot;{book.bookTitle}&quot;
                  </div>
                  <div style={{
                    fontSize: '0.625rem',
                    color: '#6b7280'
                  }}>
                    by {book.bookAuthors}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Your Students' Results */}
      <div style={{
        background: 'linear-gradient(135deg, #10B98120, #059F4620)',
        borderRadius: '1rem',
        padding: '1.25rem',
        border: '1px solid #10B98140'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#223848',
          margin: '0 0 1rem 0',
          textAlign: 'center'
        }}>
          📊 Your Students&apos; Votes
        </h3>
        
        {teacherResults.totalVotes === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '1.5rem',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗳️</div>
            <p style={{ margin: 0 }}>No votes cast by your students yet</p>
          </div>
        ) : (
          <div style={{
            textAlign: 'center'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#059F46',
                marginBottom: '0.25rem'
              }}>
                {teacherResults.totalVotes}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#047857'
              }}>
                Total votes from your students
              </div>
            </div>
            
            {teacherResults.topChoice && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '0.75rem',
                padding: '1rem',
                border: '2px solid #10B981'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#047857',
                  marginBottom: '0.5rem'
                }}>
                  🏆 Your Class Favorite
                </div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: '#223848',
                  marginBottom: '0.25rem'
                }}>
                  &quot;{teacherResults.topChoice.bookTitle || 'Unknown Book'}&quot;
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  marginBottom: '0.5rem'
                }}>
                  by {teacherResults.topChoice.bookAuthors || 'Unknown Author'}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#047857',
                  fontWeight: '600'
                }}>
                  {teacherResults.topChoice.count} vote{teacherResults.topChoice.count !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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