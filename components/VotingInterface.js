// components/VotingInterface.js - PERMANENT VOTING: Vote once, no changes, celebration
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useVoting } from '../hooks/useVoting';

export default function VotingInterface({ studentData, currentTheme }) {
  const router = useRouter();
  const {
    votingData,
    isSubmitting,
    submitVote,
    hasVotedForBook,
    getRemainingVotes,
    getVotingProgress
  } = useVoting(studentData);

  const [message, setMessage] = useState('');

  // Handle voting (PERMANENT - no changes allowed)
  const handleVote = async (bookId, bookTitle) => {
    try {
      await submitVote(bookId);
      setMessage(`✅ Vote locked in for "${bookTitle}"!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ ${error.message}`);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  if (votingData.loading) {
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
        <p style={{ color: currentTheme.textSecondary }}>Loading your voting options...</p>
      </div>
    );
  }

  // No eligible books to vote for
  if (votingData.eligibleBooks.length === 0) {
    return (
      <div style={{
        backgroundColor: currentTheme.surface,
        borderRadius: '16px',
        padding: '32px',
        textAlign: 'center',
        margin: '20px 0',
        border: `2px solid ${currentTheme.primary}30`,
        animation: 'slideInUp 0.8s ease-out 0.6s both'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📚</div>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: currentTheme.textPrimary,
          marginBottom: '8px'
        }}>
          Complete Books to Vote!
        </h3>
        <p style={{
          fontSize: '16px',
          color: currentTheme.textSecondary,
          lineHeight: '1.5'
        }}>
          You need to complete at least one book before you can vote. 
          Keep reading and you&apos;ll be able to vote next time!
        </p>
      </div>
    );
  }

  // 🎉 PERMANENT VOTING COMPLETE - Show only voted book + celebration
  if (votingData.hasVoted && votingData.currentVote) {
    const votedBook = votingData.eligibleBooks.find(book => book.id === votingData.currentVote.bookId);
    
    return (
      <div style={{
        backgroundColor: currentTheme.surface,
        borderRadius: '16px',
        padding: '24px',
        margin: '20px 0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: `2px solid ${currentTheme.primary}`,
        animation: 'slideInUp 0.8s ease-out 0.6s both',
        textAlign: 'center'
      }}>
        {/* Celebration Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            fontSize: '64px', 
            marginBottom: '16px',
            animation: 'bounce 2s ease-in-out infinite'
          }}>
            🎉
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: currentTheme.textPrimary,
            margin: '0 0 8px 0',
            fontFamily: 'Didot, "Times New Roman", serif'
          }}>
            Vote Submitted!
          </h2>
          <p style={{
            fontSize: '16px',
            color: currentTheme.textSecondary,
            margin: 0
          }}>
            Thank you for participating in the Lux Libris Award
          </p>
        </div>

        {/* Your Vote Display */}
        <div style={{
          background: `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.primary}10)`,
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          border: `2px solid ${currentTheme.primary}`
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: currentTheme.textPrimary,
            margin: '0 0 16px 0'
          }}>
            🗳️ Your Vote
          </h3>
          
          {/* Voted Book Display */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            justifyContent: 'center',
            maxWidth: '300px',
            margin: '0 auto'
          }}>
            {/* Book Cover */}
            <div style={{
              width: '60px',
              height: '90px',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: `${currentTheme.primary}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}>
              {votedBook?.coverImageUrl ? (
                <img
                  src={votedBook.coverImageUrl}
                  alt={votedBook.title}
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
                display: votedBook?.coverImageUrl ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                fontSize: '24px'
              }}>
                📚
              </div>
            </div>

            {/* Book Info */}
            <div style={{ flex: 1, textAlign: 'left' }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: currentTheme.textPrimary,
                margin: '0 0 4px 0',
                lineHeight: '1.3'
              }}>
                {votedBook?.title || 'Unknown Book'}
              </h4>
              <p style={{
                fontSize: '14px',
                color: currentTheme.textSecondary,
                margin: '0 0 4px 0'
              }}>
                by {votedBook?.authors || 'Unknown Author'}
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: currentTheme.textSecondary
              }}>
                <span>✅ Your Favorite</span>
              </div>
            </div>
          </div>
        </div>

        {/* NEW: Bragging Rights Unlock */}
        <div style={{
          background: `linear-gradient(135deg, ${currentTheme.accent}40, ${currentTheme.accent}20)`,
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          border: `2px solid ${currentTheme.accent}60`
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '12px',
            animation: 'bounce 2s ease-in-out infinite'
          }}>
            🏆
          </div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: currentTheme.textPrimary,
            margin: '0 0 8px 0'
          }}>
            Bragging Rights Officially Unlocked!
          </h3>
          <p style={{
            fontSize: '14px',
            color: currentTheme.textSecondary,
            margin: '0 0 16px 0',
            lineHeight: '1.4'
          }}>
            You've completed an amazing reading year! Show off your achievements and stats to everyone.
          </p>
          <button
            onClick={() => router.push('/student-stats')}
            style={{
              backgroundColor: currentTheme.primary,
              color: currentTheme.textPrimary,
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              margin: '0 auto',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = 'none';
            }}
          >
            🎉 Show My Bragging Rights
          </button>
        </div>

        {/* Results Announcement */}
        <div style={{
          background: `linear-gradient(135deg, ${currentTheme.accent}40, ${currentTheme.accent}20)`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          border: `1px solid ${currentTheme.accent}60`
        }}>
          <div style={{
            fontSize: '24px',
            marginBottom: '8px'
          }}>
            🏆
          </div>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: currentTheme.textPrimary,
            margin: '0 0 4px 0'
          }}>
            Results Coming Soon!
          </h4>
          <p style={{
            fontSize: '14px',
            color: currentTheme.textSecondary,
            margin: 0
          }}>
            Winners will be announced on <strong>April 15th</strong>
          </p>
        </div>

        {/* Final Message */}
        <div style={{
          backgroundColor: `${currentTheme.primary}10`,
          borderRadius: '12px',
          padding: '16px',
          border: `1px solid ${currentTheme.primary}40`
        }}>
          <p style={{
            fontSize: '14px',
            color: currentTheme.textPrimary,
            margin: '0 0 8px 0',
            fontWeight: '600'
          }}>
            🔒 Vote Locked In
          </p>
          <p style={{
            fontSize: '12px',
            color: currentTheme.textSecondary,
            margin: 0,
            lineHeight: '1.4'
          }}>
            Your vote has been permanently recorded and cannot be changed. 
            Thank you for making your choice count!
          </p>
        </div>
      </div>
    );
  }

  // 🗳️ VOTING INTERFACE - Before voting (show all eligible books)
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
        <h2 style={{
          fontSize: '28px',
          fontWeight: '600',
          color: currentTheme.textPrimary,
          margin: '0 0 8px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '32px' }}>🗳️</span>
          Vote for Your Favorite
        </h2>
        <p style={{
          fontSize: '16px',
          color: currentTheme.textSecondary,
          margin: '0 0 8px 0'
        }}>
          Choose your absolute favorite book from this year
        </p>
        <p style={{
          fontSize: '14px',
          color: currentTheme.primary,
          margin: 0,
          fontWeight: '600'
        }}>
          ⚠️ You can only vote once - choose wisely!
        </p>
      </div>

      {/* Voting Progress */}
      <div style={{
        backgroundColor: `${currentTheme.primary}10`,
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{
            fontSize: '16px',
            fontWeight: '600',
            color: currentTheme.textPrimary
          }}>
            Voting Status
          </span>
          <span style={{
            fontSize: '14px',
            color: currentTheme.textSecondary
          }}>
            Ready to vote
          </span>
        </div>
        
        <div style={{
          backgroundColor: `${currentTheme.primary}20`,
          borderRadius: '8px',
          height: '8px',
          overflow: 'hidden'
        }}>
          <div style={{
            backgroundColor: currentTheme.primary,
            height: '100%',
            width: '0%',
            transition: 'width 0.3s ease'
          }} />
        </div>
        
        <p style={{
          fontSize: '12px',
          color: currentTheme.textSecondary,
          margin: '8px 0 0 0',
          textAlign: 'center'
        }}>
          Choose your favorite book below
        </p>
      </div>

      {/* Books List */}
      <div style={{
        display: 'grid',
        gap: '12px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {votingData.eligibleBooks.map((book) => (
          <div
            key={book.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              backgroundColor: `${currentTheme.primary}05`,
              borderRadius: '12px',
              border: `1px solid ${currentTheme.primary}20`,
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onClick={() => !isSubmitting && handleVote(book.id, book.title)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = `${currentTheme.primary}15`;
              e.currentTarget.style.borderColor = `${currentTheme.primary}60`;
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = `${currentTheme.primary}05`;
              e.currentTarget.style.borderColor = `${currentTheme.primary}20`;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {/* Book Cover */}
            <div style={{
              width: '50px',
              height: '75px',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: `${currentTheme.primary}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {book.coverImageUrl ? (
                <img
                  src={book.coverImageUrl}
                  alt={book.title}
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
                display: book.coverImageUrl ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                fontSize: '20px'
              }}>
                📚
              </div>
            </div>

            {/* Book Info */}
            <div style={{ flex: 1 }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: currentTheme.textPrimary,
                margin: '0 0 4px 0'
              }}>
                {book.title}
              </h4>
              <p style={{
                fontSize: '14px',
                color: currentTheme.textSecondary,
                margin: '0 0 4px 0'
              }}>
                by {book.authors}
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: currentTheme.textSecondary
              }}>
                <span>📖 {book.format}</span>
                {book.rating > 0 && (
                  <span>⭐ {book.rating}/5</span>
                )}
              </div>
            </div>

            {/* Vote Button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                backgroundColor: `${currentTheme.primary}10`,
                color: currentTheme.primary,
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '600',
                border: `1px solid ${currentTheme.primary}40`,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>🗳️</span>
                <span>Vote</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Warning Message */}
      <div style={{
        backgroundColor: `${currentTheme.accent}10`,
        borderRadius: '12px',
        padding: '16px',
        marginTop: '20px',
        textAlign: 'center',
        border: `1px solid ${currentTheme.accent}40`
      }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
        <p style={{
          fontSize: '14px',
          color: currentTheme.textPrimary,
          margin: '0 0 4px 0',
          fontWeight: '600'
        }}>
          Choose Carefully!
        </p>
        <p style={{
          fontSize: '12px',
          color: currentTheme.textSecondary,
          margin: 0
        }}>
          Once you vote, your choice is final and cannot be changed.
          Results will be announced on April 14th.
        </p>
      </div>

      {/* Status Message */}
      {message && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: currentTheme.primary,
          color: 'white',
          padding: '12px 24px',
          borderRadius: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1001,
          fontSize: '14px',
          fontWeight: '600',
          maxWidth: '90vw',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

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