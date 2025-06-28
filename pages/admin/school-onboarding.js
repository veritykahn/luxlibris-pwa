import { useState, useEffect } from 'react'
import Head from 'next/head'
import { db } from '../../lib/firebase'
import { collection, getDocs, addDoc } from 'firebase/firestore'

export default function SchoolAdminOnboarding() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [nominees, setNominees] = useState([])
  
  // In your schoolData state, add:
const [schoolData, setSchoolData] = useState({
  name: '',
  city: '',
  state: '',
  email: '',
  selectedNominees: [],
  achievementTiers: [
    { books: 5, reward: 'Recognition at Mass' },
    { books: 10, reward: 'Certificate' },
    { books: 15, reward: 'Pizza Party' },
    { books: 20, reward: 'Medal' },
    { books: 100, reward: 'Plaque' }
  ],
  parentCode: 'HFCS2025',
  submissionOptions: {
    quiz: true, // Always enabled
    presentToTeacher: false,
    submitReview: false,
    createStoryboard: false,
    bookReport: false,
    discussWithLibrarian: false,
    actOutScene: false
  }
})

  // Fetch nominees on load
  useEffect(() => {
    fetchNominees()
  }, [])

  const fetchNominees = async () => {
    try {
      const nomineesRef = collection(db, 'masterNominees')
      const snapshot = await getDocs(nomineesRef)
      const nomineesData = []
      
      snapshot.forEach((doc) => {
        nomineesData.push({
          id: doc.id,
          ...doc.data(),
          selected: true // Default all selected
        })
      })
      
      setNominees(nomineesData)
      setSchoolData(prev => ({
        ...prev,
        selectedNominees: nomineesData.map(n => n.id)
      }))
    } catch (error) {
      console.error('Error fetching nominees:', error)
    }
  }

  const handleNext = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Save school to Firebase
      await addDoc(collection(db, 'schools'), {
        ...schoolData,
        createdAt: new Date(),
        active: true,
        students: []
      })

      // Navigate to splash screen, then dashboard
window.location.href = '/splash?type=school-admin'

    } catch (error) {
      console.error('Error creating school. Please try again.')
    }
    setLoading(false)
  }

  const toggleNominee = (nomineeId) => {
    setSchoolData(prev => ({
      ...prev,
      selectedNominees: prev.selectedNominees.includes(nomineeId)
        ? prev.selectedNominees.filter(id => id !== nomineeId)
        : [...prev.selectedNominees, nomineeId]
    }))
  }

  const updateAchievementTier = (index, field, value) => {
    setSchoolData(prev => ({
      ...prev,
      achievementTiers: prev.achievementTiers.map((tier, i) => 
        i === index ? { ...tier, [field]: value } : tier
      )
    }))
  }

  return (
    <>
      <Head>
        <title>School Admin Setup - Lux Libris</title>
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFFCF5 0%, #C3E0DE 50%, #A1E5DB 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        
        {/* Header */}
        <header style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          padding: '1rem 0',
          borderBottom: '1px solid rgba(195, 224, 222, 0.3)'
        }}>
          <div style={{
            maxWidth: '60rem',
            margin: '0 auto',
            padding: '0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #C3E0DE, #A1E5DB)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                🏫
              </div>
              <div>
                <h1 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#223848',
                  margin: 0,
                  fontFamily: 'Georgia, serif'
                }}>
                  School Admin Setup
                </h1>
                <p style={{
                  color: '#A1E5DB',
                  fontSize: '0.875rem',
                  margin: 0
                }}>
                  Configure your Lux Libris reading program
                </p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5, 6].map(step => (
                <div
                  key={step}
                  style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    background: currentStep >= step 
                      ? 'linear-gradient(135deg, #C3E0DE, #A1E5DB)' 
                      : '#e5e7eb',
                    color: currentStep >= step ? 'white' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 'bold'
                  }}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div style={{
          maxWidth: '60rem',
          margin: '0 auto',
          padding: '3rem 1.5rem'
        }}>
          
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(195, 224, 222, 0.4)'
          }}>
            
            {/* Step 1: Welcome */}
            {currentStep === 1 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚✨</div>
                <h2 style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  color: '#223848',
                  marginBottom: '1rem',
                  fontFamily: 'Georgia, serif'
                }}>
                  Welcome to Lux Libris!
                </h2>
                <p style={{
                  fontSize: '1.125rem',
                  color: '#A1E5DB',
                  marginBottom: '2rem',
                  lineHeight: '1.6'
                }}>
                  Let&apos;s set up your school&apos;s reading program in just a few steps. 
                  You&apos;ll configure your book list, achievement rewards, and get everything ready for your students!
                </p>
                
                <div style={{
                  background: 'linear-gradient(135deg, #FFFCF5, #C3E0DE)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  border: '1px solid rgba(195, 224, 222, 0.4)'
                }}>
                  <h3 style={{ color: '#223848', marginBottom: '1rem', fontFamily: 'Georgia, serif' }}>
                    🎯 What we&apos;ll set up:
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1rem',
                    justifyItems: 'center',
                    textAlign: 'center'
                  }}>
                    <div>✅ School information</div>
                    <div>📚 Book nominees selection</div>
                    <div>🏆 Achievement rewards</div>
                  </div>
                </div>
                
                <ActionButton onClick={handleNext} primary>
                  Let&apos;s Get Started! 🚀
                </ActionButton>
              </div>
            )}

            {/* Step 2: School Details */}
            {currentStep === 2 && (
              <div>
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#223848',
                  marginBottom: '1rem',
                  fontFamily: 'Georgia, serif'
                }}>
                  📍 School Information
                </h2>
                <p style={{ color: '#A1E5DB', marginBottom: '2rem' }}>
                  Tell us about your school so we can customize the experience.
                </p>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '2rem'
                }}>
                  <FormField
                    label="School Name"
                    value={schoolData.name}
                    onChange={(value) => setSchoolData(prev => ({ ...prev, name: value }))}
                    placeholder="Holy Family Catholic School"
                  />
                  <FormField
                    label="City"
                    value={schoolData.city}
                    onChange={(value) => setSchoolData(prev => ({ ...prev, city: value }))}
                    placeholder="Austin"
                  />
                  <FormField
                    label="State"
                    value={schoolData.state}
                    onChange={(value) => setSchoolData(prev => ({ ...prev, state: value }))}
                    placeholder="TX"
                  />
                  <FormField
                    label="Contact Email"
                    value={schoolData.email}
                    onChange={(value) => setSchoolData(prev => ({ ...prev, email: value }))}
                    placeholder="librarian@school.edu"
                    type="email"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Nominee Selection */}
            {currentStep === 3 && (
              <div>
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#223848',
                  marginBottom: '1rem',
                  fontFamily: 'Georgia, serif'
                }}>
                  📚 Select Your Nominees
                </h2>
                <p style={{ color: '#ADD4EA', marginBottom: '1rem' }}>
                  Choose which books from the 2025-26 master list your students can read.
                </p>
                <p style={{ 
                  color: '#ADD4EA', 
                  fontSize: '0.875rem', 
                  marginBottom: '2rem',
                  fontStyle: 'italic'
                }}>
                  📝 Selected: {schoolData.selectedNominees.length} of {nominees.length} books
                </p>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.75rem',
                  maxHeight: '40vh',
                  overflowY: 'auto',
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '0.5rem'
                }}>
                  {nominees.map(book => (
                    <div
                      key={book.id}
                      onClick={() => toggleNominee(book.id)}
                      style={{
                        background: 'white',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        border: schoolData.selectedNominees.includes(book.id)
                          ? '2px solid #C3E0DE'
                          : '2px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        opacity: schoolData.selectedNominees.includes(book.id) ? 1 : 0.7,
                        minWidth: 0,
                        maxWidth: '100%'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: schoolData.selectedNominees.includes(book.id)
                            ? '#C3E0DE'
                            : '#e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: schoolData.selectedNominees.includes(book.id) ? '#223848' : 'white',
                          fontSize: '10px',
                          flexShrink: 0
                        }}>
                          {schoolData.selectedNominees.includes(book.id) ? '✓' : ''}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{
                            fontSize: '0.875rem',
                            fontWeight: 'bold',
                            color: '#1f2937',
                            margin: '0 0 0.25rem 0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {book.title}
                          </h4>
                          <p style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            margin: '0 0 0.5rem 0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            by {book.authors}
                          </p>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                            <span style={{
                              fontSize: '0.75rem',
                              background: '#C3E0DE',
                              color: '#223848',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem'
                            }}>
                              {book.displayCategory?.replace(/^[📚📖🏆💰🗝️✨]\s/, '')}
                            </span>
                            {book.isAudiobook && (
                              <span style={{
                                fontSize: '0.75rem',
                                background: '#A1E5DB',
                                color: '#223848',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem'
                              }}>
                                🔊 Audio
                              </span>
                            )}
                            {book.genres && (
                              <span style={{
                                fontSize: '0.75rem',
                                background: '#ADD4EA',
                                color: '#223848',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem'
                              }}>
                                {book.genres}
                              </span>
                            )}
                          </div>
                          {book.luxLibrisReview && (
                            <p style={{
                              fontSize: '0.65rem',
                              color: '#6b7280',
                              margin: '0.5rem 0 0 0',
                              lineHeight: '1.3',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              &quot;{book.luxLibrisReview.substring(0, 120)}...&quot;
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Achievement Setup */}
            {currentStep === 4 && (
              <div>
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#223848',
                  marginBottom: '1rem',
                  fontFamily: 'Georgia, serif'
                }}>
                  🏆 Achievement Rewards
                </h2>
                <p style={{ color: '#ADD4EA', marginBottom: '2rem' }}>
                  Set up what students earn when they reach reading milestones.
                </p>
                
                <div style={{ marginBottom: '2rem' }}>
                  {schoolData.achievementTiers.map((tier, index) => (
                    <div key={index} style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 2fr',
                      gap: '1rem',
                      alignItems: 'center',
                      marginBottom: '1rem',
                      padding: '1rem',
                      background: '#f9fafb',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          width: '2rem',
                          height: '2rem',
                          background: 'linear-gradient(135deg, #C3E0DE, #A1E5DB)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          {tier.books}
                        </span>
                        <span style={{ fontWeight: '600', color: '#1f2937' }}>
                          {tier.books} book{tier.books > 1 ? 's' : ''}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={tier.reward}
                        onChange={(e) => updateAchievementTier(index, 'reward', e.target.value)}
                        style={{
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.5rem',
                          fontSize: '1rem',
                          width: '100%'
                        }}
                        placeholder="Enter reward description"
                      />
                    </div>
                  ))}
                </div>
                
                <div style={{
                  background: 'linear-gradient(135deg, #FFFCF5, #ADD4EA)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  border: '1px solid #ADD4EA'
                }}>
                  <h4 style={{ color: '#223848', marginBottom: '0.5rem' }}>
                    🔐 Parent Quiz Code
                  </h4>
                  <FormField
                    label="Parent Code (for book quizzes)"
                    value={schoolData.parentCode}
                    onChange={(value) => setSchoolData(prev => ({ ...prev, parentCode: value }))}
                    placeholder="HFCS2025"
                  />
                </div>
              </div>
            )}
            {/* Step 5: Submission Options */}
{currentStep === 5 && (
  <div>
    <h2 style={{
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#223848',
      marginBottom: '1rem',
      fontFamily: 'Georgia, serif'
    }}>
      📝 Book Completion Options
    </h2>
    <p style={{ color: '#ADD4EA', marginBottom: '2rem' }}>
      When students finish a book, what options should they have? Quizzes are always available.
    </p>
    
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem'
    }}>
      {[
        { key: 'quiz', label: '📝 Take Quiz', description: 'Parent code required, auto-graded', disabled: true },
        { key: 'presentToTeacher', label: '🗣️ Present to Teacher', description: 'Oral presentation or discussion' },
        { key: 'submitReview', label: '✍️ Submit Written Review', description: 'Written book review or summary' },
        { key: 'createStoryboard', label: '🎨 Create Storyboard', description: 'Visual art or comic strip' },
        { key: 'bookReport', label: '📚 Traditional Book Report', description: 'Formal written report' },
        { key: 'discussWithLibrarian', label: '💬 Discussion with Librarian', description: 'One-on-one book discussion' },
        { key: 'actOutScene', label: '🎭 Act Out Scene', description: 'Performance or dramatic reading' }
      ].map(option => (
        <div
          key={option.key}
          style={{
            padding: '1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            background: option.disabled ? '#f9fafb' : 'white',
            opacity: option.disabled ? 0.7 : 1
          }}
        >
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            cursor: option.disabled ? 'not-allowed' : 'pointer'
          }}>
            <input
              type="checkbox"
              checked={schoolData.submissionOptions[option.key]}
              disabled={option.disabled}
              onChange={(e) => setSchoolData(prev => ({
                ...prev,
                submissionOptions: {
                  ...prev.submissionOptions,
                  [option.key]: e.target.checked
                }
              }))}
              style={{
                marginTop: '0.25rem',
                cursor: option.disabled ? 'not-allowed' : 'pointer'
              }}
            />
            <div>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#223848',
                marginBottom: '0.25rem'
              }}>
                {option.label} {option.disabled && '(Always Available)'}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                lineHeight: '1.3'
              }}>
                {option.description}
              </div>
            </div>
          </label>
        </div>
      ))}
    </div>
    
    <div style={{
      background: 'linear-gradient(135deg, #FFFCF5, #ADD4EA)',
      borderRadius: '0.75rem',
      padding: '1rem',
      border: '1px solid #ADD4EA'
    }}>
      <h4 style={{ color: '#223848', marginBottom: '0.5rem' }}>
        💡 How It Works
      </h4>
      <p style={{ color: '#223848', fontSize: '0.875rem', margin: 0 }}>
        Students will see these options when they complete a book. Non-quiz submissions go to your approval queue for review.
      </p>
    </div>
  </div>
)}

            {/* Step 6: Review */}
            {currentStep === 6 && (
              <div>
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#223848',
                  marginBottom: '1rem',
                  fontFamily: 'Georgia, serif'
                }}>
                  ✅ Review & Launch
                </h2>
                <p style={{ color: '#ADD4EA', marginBottom: '2rem' }}>
                  Everything looks great! Review your settings and launch your program.
                </p>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '1.5rem'
                }}>
                  <ReviewCard
                    title="🏫 School Details"
                    items={[
                      `Name: ${schoolData.name}`,
                      `Location: ${schoolData.city}, ${schoolData.state}`,
                      `Contact: ${schoolData.email}`
                    ]}
                  />
                  <ReviewCard
                    title="📚 Book Selection"
                    items={[
                      `${schoolData.selectedNominees.length} of ${nominees.length} nominees selected`,
                      'Students can read any selected book',
                      'Progress tracked automatically'
                    ]}
                  />
                  <ReviewCard
                    title="🏆 Achievements"
                    items={schoolData.achievementTiers.map(tier => 
                      `${tier.books} books: ${tier.reward}`
                    )}
                  />
                  <ReviewCard
                    title="📝 Submission Options"
                    items={[
                      'Quiz: Always available',
                      ...Object.entries(schoolData.submissionOptions || {})
                        .filter(([key, enabled]) => enabled && key !== 'quiz')
                        .map(([key, enabled]) => {
                          const labels = {
                            presentToTeacher: 'Present to Teacher',
                            submitReview: 'Submit Review',
                            createStoryboard: 'Create Storyboard',
                            bookReport: 'Book Report',
                            discussWithLibrarian: 'Discuss with Librarian',
                            actOutScene: 'Act Out Scene'
                          }
                          return labels[key]
                        })
                    ]}
                  />
                </div>
                
                <div style={{
                  background: 'linear-gradient(135deg, #FFFCF5, #C3E0DE)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginTop: '2rem',
                  textAlign: 'center',
                  border: '1px solid #C3E0DE'
                }}>
                  <h3 style={{ color: '#223848', marginBottom: '1rem' }}>
                    🎉 Ready to Transform Reading at {schoolData.name}?
                  </h3>
                  <p style={{ color: '#223848', marginBottom: '1.5rem' }}>
                    Your students will love the gamified experience, saint achievements, and progress tracking!
                  </p>
                  <ActionButton onClick={handleSubmit} primary loading={loading}>
                    {loading ? '🚀 Creating Your Program...' : '🎊 Launch Lux Libris!'}
                  </ActionButton>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <ActionButton 
                onClick={handleBack} 
                disabled={currentStep === 1}
                secondary
              >
                ← Back
              </ActionButton>
              
              {currentStep < 6 && (
                <ActionButton 
                  onClick={handleNext}
                  disabled={
                    (currentStep === 2 && (!schoolData.name || !schoolData.city || !schoolData.state)) ||
                    (currentStep === 3 && schoolData.selectedNominees.length === 0)
                  }
                  primary
                >
                  Continue →
                </ActionButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function FormField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '0.5rem'
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '90%',
          maxWidth: '300px',
          padding: '0.75rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.5rem',
          fontSize: '1rem',
          transition: 'border-color 0.2s'
        }}
        onFocus={(e) => e.target.style.borderColor = '#C3E0DE'}
        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
      />
    </div>
  )
}

function ReviewCard({ title, items }) {
  return (
    <div style={{
      background: '#f9fafb',
      borderRadius: '0.5rem',
      padding: '1rem',
      border: '1px solid #e5e7eb'
    }}>
      <h4 style={{
        fontSize: '1.125rem',
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: '0.75rem'
      }}>
        {title}
      </h4>
      <ul style={{
        listStyle: 'none',
        padding: 0,
        margin: 0
      }}>
        {items.map((item, index) => (
          <li key={index} style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginBottom: '0.25rem'
          }}>
            • {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ActionButton({ children, onClick, primary, secondary, disabled, loading }) {
  const baseStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: disabled ? 0.5 : 1
  }

  const primaryStyle = {
    ...baseStyle,
    background: 'linear-gradient(135deg, #C3E0DE, #A1E5DB)',
    color: 'white'
  }

  const secondaryStyle = {
    ...baseStyle,
    background: 'white',
    color: '#A1E5DB',
    border: '1px solid #A1E5DB'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={primary ? primaryStyle : secondaryStyle}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.target.style.transform = 'translateY(-1px)'
          e.target.style.boxShadow = '0 4px 12px rgba(195, 224, 222, 0.4)'
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.target.style.transform = 'translateY(0)'
          e.target.style.boxShadow = 'none'
        }
      }}
    >
      {children}
    </button>
  )
}