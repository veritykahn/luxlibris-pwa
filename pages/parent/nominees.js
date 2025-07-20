// pages/parent/nominees.js - Parent view of nominees with guidance instead of add buttons
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Head from 'next/head'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db, getSchoolNomineesEntities, getCurrentAcademicYear } from '../../lib/firebase'

// Parent Guide Modal Component
function ParentGuideModal({ book, theme, isOpen, onClose }) {
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      // Restore body scroll when modal closes
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const getCategoryColorPalette = (book) => {
    const category = book.displayCategory || book.internalCategory || ''

    if (category.includes('Graphic')) {
      return {
        primary: '#FF6B35',
        secondary: '#FF8C42',
        background: '#FFF4E6',
        textPrimary: '#8B2500',
        textSecondary: '#B8491C'
      }
    }

    if (category.includes('Chapter Books')) {
      return {
        primary: '#F4D03F',
        secondary: '#F7DC6F',
        background: '#FFFEF7',
        textPrimary: '#7D6608',
        textSecondary: '#A57C00'
      }
    }

    if (category.includes('Picture')) {
      return {
        primary: '#48CAE4',
        secondary: '#00B4D8',
        background: '#F0FDFF',
        textPrimary: '#023047',
        textSecondary: '#0077B6'
      }
    }

    if (category.includes('Classic')) {
      return {
        primary: '#3F51B5',
        secondary: '#5C6BC0',
        background: '#F3F4FF',
        textPrimary: '#1A237E',
        textSecondary: '#283593'
      }
    }

    if (category.includes('Catholic')) {
      return {
        primary: '#64B5F6',
        secondary: '#90CAF9',
        background: '#F8FCFF',
        textPrimary: '#0D47A1',
        textSecondary: '#1565C0'
      }
    }

    if (category.includes('Hidden') || category.includes('Treasure')) {
      return {
        primary: '#D32F2F',
        secondary: '#F44336',
        background: '#FFF8F8',
        textPrimary: '#8B1538',
        textSecondary: '#B71C1C'
      }
    }

    return {
      primary: theme.primary,
      secondary: theme.secondary,
      background: theme.background,
      textPrimary: theme.textPrimary,
      textSecondary: theme.textSecondary
    }
  }

  const colorPalette = getCategoryColorPalette(book)

  const formatAuthors = (authorsString) => {
    if (!authorsString) return 'Unknown Author'
    if (Array.isArray(authorsString)) {
      if (authorsString.length === 0) return 'Unknown Author'
      if (authorsString.length === 1) return authorsString[0]
      if (authorsString.length === 2) return `${authorsString[0]} & ${authorsString[1]}`
      return `${authorsString[0]} & ${authorsString.length - 1} more`
    }

    const authors = authorsString.split(';').map(author => {
      return author.replace(/\s*\([^)]*\)\s*$/, '').trim()
    }).filter(author => author.length > 0)

    if (authors.length === 0) return 'Unknown Author'
    if (authors.length === 1) return authors[0]
    if (authors.length === 2) return `${authors[0]} & ${authors[1]}`
    return `${authors[0]} & ${authors.length - 1} more`
  }

  // Map Firebase data structure to parent guidance format
  const parentGuidance = {
    discussionQuestions: book.discussionQuestions || [
      `What do you think the main character learned from their journey in "${book.title}"?`,
      "Which character did you connect with most and why?",
      "What would you have done differently if you were in this situation?"
    ],
    themes: book.themes || [
      "Friendship and loyalty",
      "Overcoming challenges",
      "The importance of family"
    ],
    readingTips: book.readingTips || [
      "Ask your child to predict what might happen next",
      "Discuss the characters' feelings and motivations",
      "Connect the story to your child's own experiences"
    ],
    culturalContext: book.culturalContext || [
      "This story takes place in a different time period - discuss how life was different then",
      "The author wrote this to teach us about important values"
    ]
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px'
      }}
      onClick={(e) => {
        // Close modal when clicking the backdrop
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div style={{
        backgroundColor: colorPalette.background,
        borderRadius: '20px',
        padding: '0',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        border: `3px solid ${colorPalette.primary}`
      }}>
        {/* Modal Header */}
        <div style={{
          background: `linear-gradient(135deg, ${colorPalette.primary}, ${colorPalette.secondary})`,
          padding: '20px',
          color: '#FFFFFF',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#FFFFFF',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
          >
            ×
          </button>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div style={{
              width: '50px',
              height: '75px',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: 'rgba(255,255,255,0.2)',
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
                />
              ) : (
                <span style={{ fontSize: '20px' }}>📚</span>
              )}
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                margin: '0 0 4px 0',
                lineHeight: '1.2',
                color: '#FFFFFF'
              }}>
                {book.title}
              </h2>
              <p style={{
                fontSize: '14px',
                margin: '0',
                opacity: 0.9,
                color: '#FFFFFF'
              }}>
                by {formatAuthors(book.authors)}
              </p>
            </div>
          </div>
          
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            💡 Parent Guide
          </div>
        </div>

        {/* Modal Content - Scrollable */}
        <div style={{
          padding: '20px',
          maxHeight: 'calc(90vh - 140px)',
          overflowY: 'auto'
        }}>
          {/* Discussion Questions */}
          {parentGuidance.discussionQuestions && parentGuidance.discussionQuestions.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: colorPalette.textPrimary,
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                🗣️ Discussion Questions
              </div>
              <ul style={{
                fontSize: '14px',
                color: colorPalette.textSecondary,
                margin: 0,
                paddingLeft: '20px',
                lineHeight: '1.6'
              }}>
                {parentGuidance.discussionQuestions.map((question, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Themes */}
          {parentGuidance.themes && parentGuidance.themes.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: colorPalette.textPrimary,
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                🎯 Key Themes
              </div>
              <ul style={{
                fontSize: '14px',
                color: colorPalette.textSecondary,
                margin: 0,
                paddingLeft: '20px',
                lineHeight: '1.6'
              }}>
                {parentGuidance.themes.map((themeItem, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    {themeItem}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reading Tips */}
          {parentGuidance.readingTips && parentGuidance.readingTips.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: colorPalette.textPrimary,
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                📚 Reading Tips
              </div>
              <ul style={{
                fontSize: '14px',
                color: colorPalette.textSecondary,
                margin: 0,
                paddingLeft: '20px',
                lineHeight: '1.6'
              }}>
                {parentGuidance.readingTips.map((tip, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cultural Context */}
          {parentGuidance.culturalContext && parentGuidance.culturalContext.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: colorPalette.textPrimary,
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                🌍 Cultural Context
              </div>
              <ul style={{
                fontSize: '14px',
                color: colorPalette.textSecondary,
                margin: 0,
                paddingLeft: '20px',
                lineHeight: '1.6'
              }}>
                {parentGuidance.culturalContext.map((context, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    {context}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Parent Book Card component - shows guidance instead of action buttons
function ParentBookCard({ book, theme, linkedStudents, nominees, onOpenParentGuide }) {
  // Helper function to get student's status for this book
  const getStudentBookStatus = (student, bookId) => {
    // Check if student has this book in their bookshelf
    const studentBook = student.bookshelf?.find(b => b.bookId === bookId);
    
    if (!studentBook) {
      return {
        status: "hasn't added this book yet",
        icon: '📚',
        bgColor: '#F5F5F5',
        borderColor: '#E0E0E0',
        textColor: '#666666',
        iconBg: '#999999'
      };
    }
    
    // Check completion status first
    if (studentBook.completed === true || studentBook.status === 'completed') {
      return {
        status: 'has completed this book! 🎉',
        icon: '🎉',
        bgColor: '#E8F5E8',
        borderColor: '#4CAF50',
        textColor: '#2E7D32',
        iconBg: '#4CAF50'
      };
    }
    
    // Check for special statuses
    if (studentBook.status === 'pending_parent_quiz_unlock') {
      return {
        status: 'waiting for quiz approval',
        icon: '🔒',
        bgColor: '#E3F2FD',
        borderColor: '#2196F3',
        textColor: '#1565C0',
        iconBg: '#2196F3'
      };
    }
    
    if (studentBook.status === 'pending_approval') {
      return {
        status: 'waiting for teacher approval',
        icon: '⏳',
        bgColor: '#FFF3E0',
        borderColor: '#FF9800',
        textColor: '#E65100',
        iconBg: '#FF9800'
      };
    }
    
    if (studentBook.status === 'quiz_failed') {
      return {
        status: 'quiz failed, will retry soon',
        icon: '🔄',
        bgColor: '#FFEBEE',
        borderColor: '#F44336',
        textColor: '#C62828',
        iconBg: '#F44336'
      };
    }
    
    // Check if currently reading (has progress)
    if (studentBook.currentProgress > 0) {
      // Try to find the book details to calculate percentage
      const bookDetails = nominees?.find(n => n.id === bookId);
      let progressText = 'is reading this';
      
      if (bookDetails) {
        const total = studentBook.format === 'audiobook' 
          ? (bookDetails.totalMinutes || 0)
          : (bookDetails.pages || bookDetails.pageCount || 0);
          
        if (total > 0) {
          const percentage = Math.round((studentBook.currentProgress / total) * 100);
          progressText = `is reading (${percentage}% done)`;
        } else {
          progressText = `is reading (${studentBook.currentProgress} ${studentBook.format === 'audiobook' ? 'mins' : 'pages'})`;
        }
      } else {
        progressText = `is reading (${studentBook.currentProgress} ${studentBook.format === 'audiobook' ? 'mins' : 'pages'})`;
      }
      
      return {
        status: progressText,
        icon: '📖',
        bgColor: '#E3F2FD',
        borderColor: '#2196F3',
        textColor: '#1565C0',
        iconBg: '#2196F3'
      };
    }
    
    // Has added but not started reading
    return {
      status: 'has added but not started',
      icon: '⏳',
      bgColor: '#FFF3E0',
      borderColor: '#FF9800',
      textColor: '#E65100',
      iconBg: '#FF9800'
    };
  };
  const getCategoryColorPalette = (book) => {
    const category = book.displayCategory || book.internalCategory || ''

    if (category.includes('Graphic')) {
      return {
        primary: '#FF6B35',
        secondary: '#FF8C42',
        cardBg: 'linear-gradient(145deg, #FFF4E6, #FFE5CC, #FFFFFF)',
        headerBg: 'linear-gradient(135deg, #FF6B35, #FF8C42)',
        textPrimary: '#8B2500',
        textSecondary: '#B8491C'
      }
    }

    if (category.includes('Chapter Books')) {
      return {
        primary: '#F4D03F',
        secondary: '#F7DC6F',
        cardBg: 'linear-gradient(145deg, #FFFEF7, #FCF3CF, #FFFFFF)',
        headerBg: 'linear-gradient(135deg, #F4D03F, #F7DC6F)',
        textPrimary: '#7D6608',
        textSecondary: '#A57C00'
      }
    }

    if (category.includes('Picture')) {
      return {
        primary: '#48CAE4',
        secondary: '#00B4D8',
        cardBg: 'linear-gradient(145deg, #F0FDFF, #CAF0F8, #FFFFFF)',
        headerBg: 'linear-gradient(135deg, #48CAE4, #00B4D8)',
        textPrimary: '#023047',
        textSecondary: '#0077B6'
      }
    }

    if (category.includes('Classic')) {
      return {
        primary: '#3F51B5',
        secondary: '#5C6BC0',
        cardBg: 'linear-gradient(145deg, #F3F4FF, #E8EAF6, #FFFFFF)',
        headerBg: 'linear-gradient(135deg, #3F51B5, #5C6BC0)',
        textPrimary: '#1A237E',
        textSecondary: '#283593'
      }
    }

    if (category.includes('Catholic')) {
      return {
        primary: '#64B5F6',
        secondary: '#90CAF9',
        cardBg: 'linear-gradient(145deg, #F8FCFF, #E3F2FD, #FFFFFF)',
        headerBg: 'linear-gradient(135deg, #64B5F6, #90CAF9)',
        textPrimary: '#0D47A1',
        textSecondary: '#1565C0'
      }
    }

    if (category.includes('Hidden') || category.includes('Treasure')) {
      return {
        primary: '#D32F2F',
        secondary: '#F44336',
        cardBg: 'linear-gradient(145deg, #FFF8F8, #FFEBEE, #FFFFFF)',
        headerBg: 'linear-gradient(135deg, #D32F2F, #8D4E3C)',
        textPrimary: '#8B1538',
        textSecondary: '#B71C1C'
      }
    }

    return {
      primary: theme.primary,
      secondary: theme.secondary,
      cardBg: `linear-gradient(145deg, ${theme.surface}, ${theme.background}, #FFFFFF)`,
      headerBg: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
      textPrimary: theme.textPrimary,
      textSecondary: theme.textSecondary
    }
  }

  const colorPalette = getCategoryColorPalette(book)

  const formatAuthors = (authorsString) => {
    if (!authorsString) return 'Unknown Author'
    if (Array.isArray(authorsString)) {
      if (authorsString.length === 0) return 'Unknown Author'
      if (authorsString.length === 1) return authorsString[0]
      if (authorsString.length === 2) return `${authorsString[0]} & ${authorsString[1]}`
      return `${authorsString[0]} & ${authorsString.length - 1} more`
    }

    const authors = authorsString.split(';').map(author => {
      return author.replace(/\s*\([^)]*\)\s*$/, '').trim()
    }).filter(author => author.length > 0)

    if (authors.length === 0) return 'Unknown Author'
    if (authors.length === 1) return authors[0]
    if (authors.length === 2) return `${authors[0]} & ${authors[1]}`
    return `${authors[0]} & ${authors.length - 1} more`
  }

  const getShortCategory = (book) => {
    const category = book.displayCategory || book.internalCategory || 'Fiction'
    return category.replace(/📖\s*/, '').replace(/🎨\s*/, '').replace(/📚\s*/, '')
  }

  const getGradeDisplay = (gradeLevelsString) => {
    if (!gradeLevelsString) return 'All Grades'
    if (Array.isArray(gradeLevelsString)) {
      if (gradeLevelsString.length === 0) return 'All Grades'
      const gradeText = gradeLevelsString[0]
      return gradeText ? gradeText.replace('Grades ', '') : 'All Grades'
    }
    return gradeLevelsString.replace('Grades ', '')
  }

  const getGenreDisplay = (genresString) => {
    if (!genresString) return ''
    if (Array.isArray(genresString)) {
      if (genresString.length === 0) return ''
      const primaryGenre = genresString[0]
      return primaryGenre.length > 25 ? primaryGenre.substring(0, 25) + '...' : primaryGenre
    }
    const genres = genresString.split(',').map(g => g.trim())
    const primaryGenre = genres[0]
    return primaryGenre.length > 25 ? primaryGenre.substring(0, 25) + '...' : primaryGenre
  }

  const getLengthDisplay = (book) => {
    const pages = book.pages || book.pageCount || 0
    const minutes = book.totalMinutes || 0
    if (book.isAudiobook && minutes > 0 && pages > 0) {
      return `${pages} pages • ${minutes} min audio`
    } else if (book.isAudiobook && minutes > 0) {
      return `${minutes} minutes`
    } else if (pages > 0) {
      return `${pages} pages`
    } else {
      return 'Length unknown'
    }
  }

  return (
    <div style={{
      background: colorPalette.cardBg,
      borderRadius: '20px',
      boxShadow: `
        0 20px 40px rgba(0,0,0,0.15),
        0 8px 16px rgba(0,0,0,0.1),
        inset 0 1px 0 rgba(255,255,255,0.8)
      `,
      overflow: 'hidden',
      border: '4px solid #FFFFFF',
      position: 'relative',
      transform: 'translateY(-4px)',
      transition: 'all 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        background: colorPalette.headerBg,
        padding: '16px 20px 12px',
        color: '#FFFFFF',
        position: 'relative',
        borderBottom: '3px solid #FFFFFF',
        textAlign: 'center',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
      }}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.9)',
          color: colorPalette.textPrimary,
          fontSize: '11px',
          fontWeight: 'bold',
          padding: '6px 16px',
          borderRadius: '16px',
          letterSpacing: '0.5px',
          display: 'inline-block',
          marginBottom: '12px',
          textTransform: 'uppercase',
          border: '2px solid #FFFFFF',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {getShortCategory(book)}
        </div>

        <div>
          <h2 style={{
            fontSize: 'clamp(18px, 5vw, 22px)',
            fontWeight: 'bold',
            margin: '0 0 8px 0',
            lineHeight: '1.2',
            fontFamily: 'Didot, serif',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            color: '#FFFFFF'
          }}>
            {book.title}
          </h2>
          <p style={{
            fontSize: 'clamp(12px, 3.5vw, 14px)',
            margin: '0 0 10px 0',
            opacity: 0.95,
            fontWeight: '500',
            color: '#FFFFFF'
          }}>
            by {formatAuthors(book.authors)}
          </p>
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              fontSize: '9px',
              padding: '4px 10px',
              borderRadius: '12px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.3)',
              lineHeight: '1.2',
              maxWidth: '140px',
              textAlign: 'center'
            }}>
              {getGenreDisplay(book.genres)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        padding: '20px',
        background: `linear-gradient(180deg, ${colorPalette.surface || theme.surface}, ${colorPalette.background || theme.background})`
      }}>
        {/* Cover and Stats Section */}
        <div style={{
          display: 'flex',
          gap: 'clamp(12px, 4vw, 16px)',
          marginBottom: '16px'
        }}>
          <div style={{
            width: '100px',
            height: '150px',
            flexShrink: 0,
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: `${theme.primary}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
            border: '3px solid #FFFFFF',
            position: 'relative'
          }}>
            {book.coverImageUrl ? (
              <>
                <img
                  src={book.coverImageUrl}
                  alt={book.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `linear-gradient(45deg, transparent 30%, ${colorPalette.primary}20 50%, transparent 70%)`,
                  pointerEvents: 'none'
                }} />
              </>
            ) : (
              <span style={{ fontSize: '40px' }}>📚</span>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{
              backgroundColor: `${theme.primary}15`,
              borderRadius: '12px',
              padding: '12px',
              border: `2px solid ${theme.primary}30`
            }}>
              <div style={{ marginBottom: '10px' }}>
                <div style={{
                  fontSize: '11px',
                  color: theme.textSecondary,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  📊 Book Stats
                </div>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '12px'
              }}>
                <div>
                  <span style={{ color: theme.textSecondary, fontWeight: '600' }}>Grades:</span><br/>
                  <span style={{ color: theme.textPrimary, fontWeight: 'bold' }}>
                    {getGradeDisplay(book.gradeLevels)}
                  </span>
                </div>
                <div>
                  <span style={{ color: theme.textSecondary, fontWeight: '600' }}>Length:</span><br/>
                  <span style={{ color: theme.textPrimary, fontWeight: 'bold' }}>
                    {getLengthDisplay(book)}
                  </span>
                </div>
                <div>
                  <span style={{ color: theme.textSecondary, fontWeight: '600' }}>Published:</span><br/>
                  <span style={{ color: theme.textPrimary, fontWeight: 'bold' }}>
                    {book.publicationDate ? new Date(book.publicationDate).getFullYear() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span style={{ color: theme.textSecondary, fontWeight: '600' }}>Genre:</span><br/>
                  <span style={{ color: theme.textPrimary, fontWeight: 'bold' }}>
                    {getGenreDisplay(book.genres)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lux Libris Review Section */}
        {book.luxLibrisReview && (
          <div style={{
            backgroundColor: colorPalette.background || theme.background,
            padding: '14px',
            borderRadius: '12px',
            marginBottom: '16px',
            border: '2px solid #FFFFFF',
            position: 'relative',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '700',
              color: colorPalette.textSecondary || theme.textSecondary,
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              ⭐ Lux Libris Review
            </div>
            <p style={{
              fontSize: '13px',
              lineHeight: '1.4',
              color: colorPalette.textPrimary || theme.textPrimary,
              margin: 0,
              fontStyle: 'italic',
              fontWeight: '500'
            }}>
              &quot;{book.luxLibrisReview}&quot;
            </p>
          </div>
        )}

        {/* Parent Guide Button */}
        <div style={{
          backgroundColor: colorPalette.background || theme.background,
          padding: '14px',
          borderRadius: '12px',
          marginBottom: '16px',
          border: '2px solid #FFFFFF',
          position: 'relative',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <button
            onClick={() => onOpenParentGuide()}
            style={{
              width: '100%',
              backgroundColor: colorPalette.primary,
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              touchAction: 'manipulation'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)'
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            💡 Parent Guide
          </button>
        </div>
      </div>

      {/* Children's Status Section */}
      <div style={{
        padding: '12px 20px 20px',
        background: `linear-gradient(180deg, ${colorPalette.background || theme.background}, ${colorPalette.surface || theme.surface})`
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {linkedStudents && linkedStudents.length > 0 ? (
            linkedStudents.map((student) => {
              const bookStatus = getStudentBookStatus(student, book.id);
              return (
                <div
                  key={student.id}
                  style={{
                    backgroundColor: bookStatus.bgColor,
                    border: `2px solid ${bookStatus.borderColor}`,
                    borderRadius: '12px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: bookStatus.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: 'white',
                    flexShrink: 0
                  }}>
                    {student.firstName?.charAt(0) || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: bookStatus.textColor,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>{bookStatus.icon}</span>
                      <span>{student.firstName} {bookStatus.status}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{
              backgroundColor: theme.surface,
              border: `2px solid ${theme.primary}30`,
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: theme.textSecondary,
                fontStyle: 'italic'
              }}>
                No children linked to this account
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ParentNominees() {
  const router = useRouter()
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [parentData, setParentData] = useState(null)
  const [linkedStudents, setLinkedStudents] = useState([])
  const [nominees, setNominees] = useState([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showParentModal, setShowParentModal] = useState(false)
  
  // Navigation menu state
  const [showNavMenu, setShowNavMenu] = useState(false)

  // Lux Libris Classic Theme (same as parent dashboard)
  const luxTheme = {
    primary: '#ADD4EA',
    secondary: '#C3E0DE',
    accent: '#A1E5DB',
    background: '#FFFCF5',
    surface: '#FFFFFF',
    textPrimary: '#223848',
    textSecondary: '#556B7A'
  }

  // Navigation menu items with nominees as current
  const navMenuItems = useMemo(() => [
    { name: 'Family Dashboard', path: '/parent/dashboard', icon: '⌂' },
    { name: 'Book Nominees', path: '/parent/nominees', icon: '□', current: true },
    { name: 'Reading Habits', path: '/parent/healthy-habits', icon: '◉' },
    { name: 'Family DNA Lab', path: '/parent/dna-lab', icon: '🧬' },
    { name: 'Quiz Unlock Center', path: '/parent/quiz-unlock', icon: '▦' },
    { name: 'Family Celebrations', path: '/parent/celebrations', icon: '♔' },
    { name: 'Settings', path: '/parent/settings', icon: '⚙' }
  ], [])

  useEffect(() => {
    if (!authLoading && isAuthenticated && user && userProfile?.accountType === 'parent') {
      loadNomineesData()
    } else if (!authLoading && !isAuthenticated) {
      router.push('/role-selector')
    } else if (!authLoading && userProfile?.accountType !== 'parent') {
      router.push('/student-dashboard')
    }
  }, [authLoading, isAuthenticated, user, userProfile])

  // Close nav menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNavMenu && !event.target.closest('.nav-menu-container')) {
        setShowNavMenu(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape' && showNavMenu) {
        setShowNavMenu(false)
      }
    }

    if (showNavMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showNavMenu])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        if (currentCardIndex > 0) {
          setCurrentCardIndex(currentCardIndex - 1)
        } else {
          setCurrentCardIndex(nominees.length - 1) // Wrap to last
        }
      } else if (e.key === 'ArrowRight') {
        if (currentCardIndex < nominees.length - 1) {
          setCurrentCardIndex(currentCardIndex + 1)
        } else {
          setCurrentCardIndex(0) // Wrap to first
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentCardIndex, nominees.length])

  const loadNomineesData = async () => {
    try {
      console.log('📚 Loading parent nominees data...')
      
      // Load parent profile
      const parentRef = doc(db, 'parents', user.uid)
      const parentDoc = await getDoc(parentRef)
      
      if (!parentDoc.exists()) {
        throw new Error('Parent profile not found')
      }

      const parentProfile = parentDoc.data()
      setParentData(parentProfile)

      // Load linked students data to get their school
      const students = await loadLinkedStudentsData(parentProfile.linkedStudents || [])
      
      if (students.length > 0) {
        // Use first student's school to load nominees (since they're all from same teacher)
        const firstStudent = students[0]
        const allNominees = await getSchoolNomineesEntities(
          firstStudent.entityId,
          firstStudent.schoolId
        )
        
        // Filter by current academic year
        const currentYear = getCurrentAcademicYear()
        const currentYearNominees = allNominees.filter(book => 
          book.academicYear === currentYear || !book.academicYear
        )
        
        // Sort nominees by category and title
        const sortedNominees = sortNominees(currentYearNominees)
        setNominees(sortedNominees)
        console.log('✅ Loaded', sortedNominees.length, 'nominee books for parents (sorted by category & title) for', currentYear)
      }

    } catch (error) {
      console.error('❌ Error loading nominees:', error)
      setError('Failed to load book nominees. Please try again.')
    }
    
    setLoading(false)
  }

  const loadLinkedStudentsData = async (linkedStudentIds) => {
    try {
      const students = []
      
      // Search all entities/schools for linked students
      const entitiesRef = collection(db, 'entities')
      const entitiesSnapshot = await getDocs(entitiesRef)
      
      for (const entityDoc of entitiesSnapshot.docs) {
        const entityId = entityDoc.id
        const schoolsRef = collection(db, `entities/${entityId}/schools`)
        const schoolsSnapshot = await getDocs(schoolsRef)
        
        for (const schoolDoc of schoolsSnapshot.docs) {
          const schoolId = schoolDoc.id
          const schoolData = schoolDoc.data()
          const studentsRef = collection(db, `entities/${entityId}/schools/${schoolId}/students`)
          const studentsSnapshot = await getDocs(studentsRef)
          
          for (const studentDoc of studentsSnapshot.docs) {
            if (linkedStudentIds.includes(studentDoc.id)) {
              const studentData = {
                id: studentDoc.id,
                entityId,
                schoolId,
                schoolName: schoolData.name,
                ...studentDoc.data()
              }
              students.push(studentData)
            }
          }
        }
      }
      
      setLinkedStudents(students)
      return students
      
    } catch (error) {
      console.error('❌ Error loading linked students:', error)
      return []
    }
  }

  // Sorting function for nominees
  const sortNominees = (nominees) => {
    const categoryPriority = {
      '📖 Chapter Books that Stick With You': 1,
      '🖼️ Picture Books with Heart': 2,
      '🎨 Graphic Novels with a Twist': 3,
      '🗝️ Hidden Treasure': 4,
      '✝️ Our Catholic Pick': 5,
      '🏛️ Our Classic': 6
    }

    return nominees.sort((a, b) => {
      const getCategoryKey = (book) => {
        const category = book.displayCategory || book.internalCategory || ''
        for (const key of Object.keys(categoryPriority)) {
          if (category === key) {
            return key
          }
        }
        for (const key of Object.keys(categoryPriority)) {
          if (category.toLowerCase().includes(key.toLowerCase().replace(/[📖🖼️🎨🗝️✝️🏛️]/g, '').trim())) {
            return key
          }
        }
        return 'Other'
      }

      const categoryA = getCategoryKey(a)
      const categoryB = getCategoryKey(b)
      const priorityA = categoryPriority[categoryA] || 999
      const priorityB = categoryPriority[categoryB] || 999

      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }

      return (a.title || '').localeCompare(b.title || '')
    })
  }

  const goToCard = (index) => {
    setCurrentCardIndex(index)
  }

  const goToPrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
    } else {
      setCurrentCardIndex(nominees.length - 1)
    }
  }

  const goToNextCard = () => {
    if (currentCardIndex < nominees.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
    } else {
      setCurrentCardIndex(0)
    }
  }

  const handleTabClick = (tabName) => {
    if (tabName === 'Book Nominees') {
      return // Already here
    } else {
      console.log(`${tabName} navigation coming soon`)
    }
  }

  // Show loading while data loads
  if (authLoading || loading || !userProfile) {
    return (
      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${luxTheme.primary}30`,
            borderTop: `3px solid ${luxTheme.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: luxTheme.textPrimary }}>Loading book nominees...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😞</div>
          <h2 style={{ color: luxTheme.textPrimary, marginBottom: '1rem' }}>Oops!</h2>
          <p style={{ color: luxTheme.textSecondary, marginBottom: '1.5rem' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: luxTheme.primary,
              color: luxTheme.textPrimary,
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (nominees.length === 0) {
    return (
      <>
        <Head>
          <title>Book Nominees - Lux Libris Parent</title>
          <meta name="description" content="Support your children's reading with guided information about their book nominees" />
          <link rel="icon" href="/images/lux_libris_logo.png" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
        </Head>
        <div style={{
          backgroundColor: luxTheme.background,
          minHeight: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            padding: '40px 20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📚</div>
            <h2 style={{
              fontSize: '24px',
              color: luxTheme.textPrimary,
              marginBottom: '12px'
            }}>
              No Books Available
            </h2>
            <p style={{
              fontSize: '16px',
              color: luxTheme.textSecondary,
              marginBottom: '24px'
            }}>
              Your children's school hasn't selected their book nominees yet.
            </p>
            <button
              onClick={() => router.push('/parent/dashboard')}
              style={{
                backgroundColor: luxTheme.primary,
                color: luxTheme.textPrimary,
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </>
    )
  }

  const currentBook = nominees[currentCardIndex]

  return (
    <>
      <Head>
        <title>Book Nominees - Lux Libris Parent</title>
        <meta name="description" content="Support your children's reading with guided information about their book nominees" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>
      
      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${luxTheme.primary}F0, ${luxTheme.secondary}F0)`,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Back Button */}
          <button
            onClick={() => router.push('/parent/dashboard')}
            style={{
              position: 'absolute',
              left: '20px',
              backgroundColor: 'rgba(255,255,255,0.3)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              cursor: 'pointer',
              color: luxTheme.textPrimary,
              backdropFilter: 'blur(10px)',
              flexShrink: 0,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            ←
          </button>

          {/* Centered Title */}
          <h1 style={{
            fontSize: 'clamp(20px, 5vw, 24px)',
            fontWeight: '400',
            color: luxTheme.textPrimary,
            margin: '0',
            letterSpacing: '1px',
            fontFamily: 'Didot, "Times New Roman", serif',
            textAlign: 'center'
          }}>
            Book Nominees
          </h1>

          {/* Hamburger Menu */}
          <div className="nav-menu-container" style={{ position: 'absolute', right: '20px' }}>
            <button
              onClick={() => setShowNavMenu(!showNavMenu)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.3)',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                cursor: 'pointer',
                color: luxTheme.textPrimary,
                backdropFilter: 'blur(10px)',
                flexShrink: 0,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              ☰
            </button>

            {/* Dropdown Menu */}
            {showNavMenu && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: '0',
                backgroundColor: luxTheme.surface,
                borderRadius: '12px',
                minWidth: '200px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(20px)',
                border: `2px solid ${luxTheme.primary}60`,
                overflow: 'hidden',
                zIndex: 9999
              }}>
                {navMenuItems.map((item, index) => (
                  <button
                    key={item.path}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowNavMenu(false)
                      
                      if (item.current) return
                      
                      setTimeout(() => {
                        if (item.path === '/parent/dashboard') {
                          router.push(item.path)
                        } else {
                          handleTabClick(item.name)
                        }
                      }, 100)
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: item.current ? `${luxTheme.primary}30` : 'transparent',
                      border: 'none',
                      borderBottom: index < navMenuItems.length - 1 ? `1px solid ${luxTheme.primary}40` : 'none',
                      cursor: item.current ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '14px',
                      color: luxTheme.textPrimary,
                      fontWeight: item.current ? '600' : '500',
                      textAlign: 'left',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!item.current) {
                        e.target.style.backgroundColor = `${luxTheme.primary}20`
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!item.current) {
                        e.target.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                    <span>{item.name}</span>
                    {item.current && (
                      <span style={{ marginLeft: 'auto', fontSize: '12px', color: luxTheme.primary }}>●</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          padding: '20px 20px 0 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: 'calc(100vh - 120px)',
          paddingTop: '20px'
        }}>
          {/* Subtitle */}
          <div style={{
            textAlign: 'center',
            marginBottom: '20px',
            maxWidth: '400px'
          }}>
            <h2 style={{
              fontSize: 'clamp(16px, 4vw, 18px)',
              color: luxTheme.textPrimary,
              margin: '0 0 8px 0',
              fontWeight: '600'
            }}>
              Supporting Your Children's Reading
            </h2>
            <p style={{
              fontSize: 'clamp(12px, 3.5vw, 14px)',
              color: luxTheme.textSecondary,
              margin: 0,
              lineHeight: '1.4'
            }}>
              Discover guidance and conversation starters for each book your children can choose from
            </p>
          </div>

          {/* Main Card with Navigation Arrows */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '360px',
            marginBottom: '20px'
          }}>
            {/* Left Arrow */}
            <button
              onClick={goToPrevCard}
              style={{
                position: 'absolute',
                left: '-24px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: luxTheme.primary,
                border: `3px solid ${luxTheme.secondary}`,
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                color: luxTheme.textPrimary,
                zIndex: 100,
                transition: 'all 0.3s ease',
                userSelect: 'none',
                boxShadow: `0 4px 12px ${luxTheme.primary}40, 0 2px 8px rgba(0,0,0,0.2)`,
                backdropFilter: 'blur(10px)'
              }}
            >
              ←
            </button>

            {/* Right Arrow */}
            <button
              onClick={goToNextCard}
              style={{
                position: 'absolute',
                right: '-24px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: luxTheme.primary,
                border: `3px solid ${luxTheme.secondary}`,
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                color: luxTheme.textPrimary,
                zIndex: 100,
                transition: 'all 0.3s ease',
                userSelect: 'none',
                boxShadow: `0 4px 12px ${luxTheme.primary}40, 0 2px 8px rgba(0,0,0,0.2)`,
                backdropFilter: 'blur(10px)'
              }}
            >
              →
            </button>

            <ParentBookCard
              book={currentBook}
              theme={luxTheme}
              linkedStudents={linkedStudents}
              currentCardIndex={currentCardIndex}
              onOpenParentGuide={() => setShowParentModal(true)}
            />
          </div>

          {/* Navigation Hint */}
          <div style={{
            fontSize: '12px',
            color: luxTheme.textSecondary,
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            ← Use arrows to browse books →
          </div>

          {/* Quick Browse */}
          <div style={{
            width: '100%',
            maxWidth: '400px',
            marginBottom: '40px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: luxTheme.textPrimary,
              margin: '0 0 12px 0',
              textAlign: 'center'
            }}>
              Quick Browse
            </h3>
            <div style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              padding: '8px 0 40px 0',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              {nominees.map((book, index) => (
                <button
                  key={book.id}
                  onClick={() => goToCard(index)}
                  className="quick-browse-item"
                  style={{
                    flexShrink: 0,
                    width: '64px',
                    height: '96px',
                    borderRadius: '8px',
                    border: index === currentCardIndex
                      ? `3px solid ${luxTheme.primary}`
                      : `2px solid ${luxTheme.primary}40`,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    backgroundColor: luxTheme.surface,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    transition: 'all 0.2s ease',
                    transform: index === currentCardIndex ? 'scale(1.1)' : 'scale(1)',
                    touchAction: 'manipulation'
                  }}
                >
                  {book.coverImageUrl ? (
                    <img
                      src={book.coverImageUrl}
                      alt={book.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    '▥'
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Parent Guide Modal */}
        {showParentModal && (
          <ParentGuideModal
            book={currentBook}
            theme={luxTheme}
            isOpen={showParentModal}
            onClose={() => setShowParentModal(false)}
          />
        )}

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          button {
            -webkit-tap-highlight-color: transparent;
            -webkit-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
            touch-action: manipulation;
          }
          
          ::-webkit-scrollbar {
            display: none;
          }
          
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
          
          @media (max-width: 768px) {
            .nav-menu-container > div {
              right: 10px !important;
              minWidth: 180px !important;
            }
          }
        `}</style>
      </div>
    </>
  )
}