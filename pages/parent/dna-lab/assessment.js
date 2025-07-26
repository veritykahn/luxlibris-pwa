// pages/parent/dna-lab/assessment.js - Parent Reading DNA Assessment (Fixed)
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import Head from 'next/head';
import { collection, getDocs, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default function ParentDnaAssessment() {
  const router = useRouter();
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Track where user came from
  const previousPath = useRef(null);
  
  // Assessment states
  const [questions, setQuestions] = useState([]);
  const [parentDnaTypes, setParentDnaTypes] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [existingResult, setExistingResult] = useState(null);
  const [showRetakeWarning, setShowRetakeWarning] = useState(false);
  const [showResearchBasis, setShowResearchBasis] = useState(false);
  
  // Lux Libris Classic Theme
  const luxTheme = {
    primary: '#ADD4EA',
    secondary: '#C3E0DE',
    accent: '#A1E5DB',
    background: '#FFFCF5',
    surface: '#FFFFFF',
    textPrimary: '#223848',
    textSecondary: '#556B7A'
  };

  // Emoji fallbacks for parent types
  const parentTypeEmojis = {
    authentic_modeler: '📚',
    meaning_maker: '🌟',
    connection_creator: '🤝',
    competence_builder: '🏗️',
    growth_facilitator: '📈',
    autonomy_supporter: '🌱'
  };

  // Track referrer on mount
  useEffect(() => {
    if (document.referrer && !previousPath.current) {
      try {
        const referrerUrl = new URL(document.referrer);
        if (referrerUrl.pathname && referrerUrl.origin === window.location.origin) {
          previousPath.current = referrerUrl.pathname;
        } else {
          previousPath.current = '/parent/dna-lab';
        }
      } catch {
        previousPath.current = '/parent/dna-lab';
      }
    } else if (!previousPath.current) {
      previousPath.current = '/parent/dna-lab';
    }
  }, []);

  // Load questions and types from Firebase
  const loadAssessmentData = useCallback(async () => {
    try {
      console.log('📋 Loading parent DNA assessment data...');
      
      // Load questions
      const questionsRef = collection(db, 'parent-dna-questions');
      const questionsSnapshot = await getDocs(questionsRef);
      const loadedQuestions = [];
      
      questionsSnapshot.forEach(doc => {
        loadedQuestions.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort questions by ID (000, 001, 002, etc.)
      loadedQuestions.sort((a, b) => a.id.localeCompare(b.id));
      
      // Load parent DNA types
      const typesRef = collection(db, 'parent-dna-types');
      const typesSnapshot = await getDocs(typesRef);
      const types = {};
      
      typesSnapshot.forEach(doc => {
        types[doc.id] = doc.data();
      });
      
      setQuestions(loadedQuestions);
      setParentDnaTypes(types);
      
      console.log(`✅ Loaded ${loadedQuestions.length} questions and ${Object.keys(types).length} parent types`);
      console.log('✅ Loaded parent types:', types);
      
    } catch (error) {
      console.error('❌ Error loading assessment data:', error);
      setError('Failed to load assessment. Please try again.');
    }
  }, []);

  // Check for existing assessment
  const checkExistingAssessment = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const parentRef = doc(db, 'parents', user.uid);
      const parentDoc = await getDoc(parentRef);
      
      if (parentDoc.exists()) {
        const data = parentDoc.data();
        if (data.parentDNA) {
          setExistingResult(data.parentDNA);
          
          // Calculate days since last assessment
          const lastAssessmentDate = data.parentDNA.completedAt?.toDate();
          if (lastAssessmentDate) {
            const daysSince = Math.floor((new Date() - lastAssessmentDate) / (1000 * 60 * 60 * 24));
            
            if (daysSince < 365) {
              setShowRetakeWarning(true);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error checking existing assessment:', error);
    }
  }, [user]);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      if (!authLoading && isAuthenticated && user && userProfile?.accountType === 'parent') {
        await loadAssessmentData();
        await checkExistingAssessment();
        setLoading(false);
      } else if (!authLoading && !isAuthenticated) {
        router.push('/role-selector');
      } else if (!authLoading && userProfile?.accountType !== 'parent') {
        router.push('/student-dashboard');
      }
    };
    
    loadData();
  }, [authLoading, isAuthenticated, user, userProfile, loadAssessmentData, checkExistingAssessment, router]);

  // Calculate parent DNA type based on answers - COMPREHENSIVE VERSION
  const calculateParentDnaType = useCallback((responses) => {
    console.log('🧮 Calculating parent DNA type from responses:', responses);
    
    // Step 1: Count all traits from selected answers
    const traitCounts = {};
    
    Object.entries(responses).forEach(([questionIndex, answerIndex]) => {
      const question = questions[parseInt(questionIndex)];
      const selectedOption = question?.options?.[answerIndex];
      
      if (selectedOption?.traits) {
        selectedOption.traits.forEach(trait => {
          traitCounts[trait] = (traitCounts[trait] || 0) + 1;
        });
      }
    });
    
    console.log('📊 Trait counts:', traitCounts);
    
    // Step 2: Calculate scores for each parent type
    const typeScores = {};
    
    Object.entries(parentDnaTypes).forEach(([typeId, typeData]) => {
      let score = 0;
      
      // Sum up all occurrences of this type's traits
      if (typeData.traits) {
        typeData.traits.forEach(trait => {
          score += (traitCounts[trait] || 0);
        });
      }
      
      typeScores[typeId] = score;
    });
    
    console.log('📊 Type scores:', typeScores);
    
    // Step 3: Find the highest scoring type
    let bestType = null;
    let highestScore = 0;
    
    Object.entries(typeScores).forEach(([typeId, score]) => {
      if (score > highestScore) {
        highestScore = score;
        bestType = typeId;
      }
    });
    
    // Step 4: Calculate secondary type (for nuanced results)
    const sortedTypes = Object.entries(typeScores)
      .sort(([,a], [,b]) => b - a)
      .map(([typeId, score]) => ({ typeId, score }));
    
    const secondaryType = sortedTypes[1]?.typeId || null;
    const secondaryScore = sortedTypes[1]?.score || 0;
    
    // Step 5: Calculate percentage strengths for all types (fixed calculation)
    const totalPossibleScore = questions.length * 3; // Max 3 traits per answer
    
    const typePercentages = {};
    Object.entries(typeScores).forEach(([typeId, score]) => {
      typePercentages[typeId] = totalPossibleScore > 0 
        ? Math.round((score / totalPossibleScore) * 100) 
        : 0;
    });
    
    console.log('✅ Calculated parent type:', bestType);
    console.log('📊 Type percentages:', typePercentages);
    
    // Step 6: Return comprehensive results
    return {
      primaryType: {
        id: bestType,
        score: highestScore,
        percentage: typePercentages[bestType] || 0,
        details: parentDnaTypes[bestType]
      },
      secondaryType: secondaryType ? {
        id: secondaryType,
        score: secondaryScore,
        percentage: typePercentages[secondaryType] || 0,
        details: parentDnaTypes[secondaryType]
      } : null,
      allScores: typeScores,
      allPercentages: typePercentages,
      traitProfile: traitCounts,
      totalQuestions: Object.keys(responses).length,
      completionRate: Math.round((Object.keys(responses).length / questions.length) * 100),
      completedAt: new Date()
    };
  }, [questions, parentDnaTypes]);

  // Handle answer selection
  const handleAnswer = (answerIndex) => {
    const newAnswers = { ...answers, [currentQuestion]: answerIndex };
    setAnswers(newAnswers);
    
    // Move to next question or complete assessment
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      completeAssessment(newAnswers);
    }
  };

  // Complete assessment and save results
  const completeAssessment = async (finalAnswers) => {
    try {
      setIsCalculating(true);
      
      // Calculate result
      const result = calculateParentDnaType(finalAnswers);
      
      // Save to Firebase - store the primary type information
      const parentRef = doc(db, 'parents', user.uid);
      
      // Check if document exists
      const parentDoc = await getDoc(parentRef);
      
      const saveData = {
        type: result.primaryType.id,
        traits: result.traitProfile,
        responses: finalAnswers,
        scores: result.allScores,
        percentages: result.allPercentages,
        primaryType: result.primaryType,
        secondaryType: result.secondaryType,
        completedAt: result.completedAt
      };
      
      if (parentDoc.exists()) {
        // Update existing document
        await updateDoc(parentRef, {
          parentDNA: saveData,
          lastUpdated: new Date()
        });
      } else {
        // Create new document
        await setDoc(parentRef, {
          uid: user.uid,
          email: user.email,
          parentDNA: saveData,
          createdAt: new Date(),
          lastUpdated: new Date()
        });
      }
      
      console.log('✅ Parent DNA assessment saved successfully');
      
      setAssessmentResult(result);
      setShowResult(true);
      
    } catch (error) {
      console.error('❌ Error completing assessment:', error);
      setError('Failed to save assessment. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Navigate to previous question
  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Start or restart assessment
  const startAssessment = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResult(false);
    setShowRetakeWarning(false);
  };

  // Navigate back to previous page (for Exit button and error state)
  const navigateBack = () => {
    router.push(previousPath.current || '/parent/dna-lab');
  };

  // Navigate to My Reading DNA page (for Cancel button)
  const navigateToMyReadingDna = () => {
    router.push('/parent/dna-lab/my-reading-dna');
  };

  // Get retake warning message
  const getRetakeWarningMessage = () => {
    if (!existingResult?.completedAt) return null;
    
    const lastDate = existingResult.completedAt.toDate();
    const daysSince = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
    
    if (daysSince < 30) {
      return `🤔 You took this assessment ${daysSince} days ago. Your parenting style typically doesn't change quickly. We recommend waiting at least a year between assessments for meaningful insights.`;
    } else if (daysSince < 365) {
      const monthsSince = Math.floor(daysSince / 30);
      return `📅 You took this assessment ${monthsSince} month${monthsSince > 1 ? 's' : ''} ago. We recommend taking the assessment once per year, ideally at the beginning of each school year, to track how your approach evolves.`;
    } else {
      return `🌟 It's been over a year since your last assessment! Perfect timing to rediscover your reading support style and see how you've grown.`;
    }
  };

  // Show loading
  if (authLoading || loading) {
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
          <p style={{ color: luxTheme.textPrimary, fontSize: '14px' }}>
            Preparing your personalized assessment...
          </p>
        </div>
      </div>
    );
  }

  // Show error
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
            onClick={navigateBack}
            style={{
              backgroundColor: luxTheme.primary,
              color: luxTheme.textPrimary,
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentQuestionData = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <>
      <Head>
        <title>Parent Reading DNA Assessment - Lux Libris</title>
        <meta name="description" content="Discover your unique parenting style for supporting your children's reading journey" />
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
          padding: '30px 20px 20px',
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          zIndex: 100
        }}>
          {/* Exit Button */}
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
                navigateBack();
              }
            }}
            style={{
              position: 'absolute',
              right: '20px',
              top: '30px',
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
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            ✕
          </button>

          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              fontFamily: 'Didot, serif',
              margin: '0 0 8px 0',
              color: luxTheme.textPrimary
            }}>
              Parent Reading DNA Assessment
            </h1>
            <p style={{
              fontSize: '14px',
              color: luxTheme.textSecondary,
              margin: '0'
            }}>
              Discover your unique approach to supporting your child&apos;s reading journey
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
          
          {/* Retake Warning */}
          {showRetakeWarning && !showResult && (
            <div style={{
              backgroundColor: '#FFF3CD',
              border: '1px solid #FFE69C',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#664D03',
                marginBottom: '16px',
                lineHeight: '1.5'
              }}>
                {getRetakeWarningMessage()}
              </div>
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={navigateToMyReadingDna}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#664D03',
                    border: '1px solid #FFE69C',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={startAssessment}
                  style={{
                    backgroundColor: '#FFE69C',
                    color: '#664D03',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Continue Anyway
                </button>
              </div>
            </div>
          )}

          {/* Success Result */}
          {showResult && assessmentResult ? (
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Animated Background with Parent Type Color */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                right: '-50%',
                bottom: '-50%',
                background: `radial-gradient(circle at 30% 40%, ${assessmentResult.primaryType?.details?.color || luxTheme.primary}30 0%, transparent 40%),
                            radial-gradient(circle at 70% 60%, ${assessmentResult.primaryType?.details?.color || luxTheme.secondary}30 0%, transparent 40%),
                            radial-gradient(circle at 50% 80%, ${assessmentResult.primaryType?.details?.color || luxTheme.accent}20 0%, transparent 50%)`,
                animation: 'celebrateRotate 8s linear infinite',
                zIndex: 0
              }} />
              
              {/* Confetti Animation */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
                zIndex: 1
              }}>
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      width: '10px',
                      height: '10px',
                      backgroundColor: i % 3 === 0 ? assessmentResult.primaryType?.details?.color : 
                                       i % 3 === 1 ? luxTheme.primary : luxTheme.secondary,
                      opacity: 0.8,
                      borderRadius: i % 2 === 0 ? '50%' : '0',
                      left: `${Math.random() * 100}%`,
                      top: '-10px',
                      animation: `confettiFall ${2 + Math.random() * 3}s ease-out ${Math.random() * 2}s`,
                      transform: `rotate(${Math.random() * 360}deg)`
                    }}
                  />
                ))}
              </div>
              
              <div style={{ position: 'relative', zIndex: 2 }}>
                {/* Celebration Emoji */}
                <div style={{
                  fontSize: '64px',
                  marginBottom: '24px',
                  animation: 'celebrateBounce 1s ease-out'
                }}>
                  🎉
                </div>
              
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  fontFamily: 'Didot, serif',
                  color: luxTheme.textPrimary,
                  margin: '0 0 16px 0',
                  animation: 'fadeInScale 0.5s ease-out 0.3s both'
                }}>
                  Discovery Complete!
                </h2>
              
                <div style={{
                  backgroundColor: `${assessmentResult.primaryType?.details?.color || luxTheme.primary}20`,
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '24px',
                  border: `2px solid ${assessmentResult.primaryType?.details?.color || luxTheme.primary}40`,
                  animation: 'fadeInScale 0.5s ease-out 0.5s both'
                }}>
                  {/* Bouncing Type Emoji */}
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '16px',
                    animation: 'typeEmojiFloat 3s ease-in-out infinite',
                    filter: `drop-shadow(0 0 20px ${assessmentResult.primaryType?.details?.color || luxTheme.primary}60)`
                  }}>
                    {assessmentResult.primaryType?.details?.emoji || parentTypeEmojis[assessmentResult.primaryType?.id] || '🌟'}
                  </div>
                  
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    marginBottom: '8px'
                  }}>
                    You are {(() => {
                      const typeName = assessmentResult.primaryType?.details?.name || 'a Unique Parent';
                      const firstLetter = typeName.charAt(0).toLowerCase();
                      const article = ['a', 'e', 'i', 'o', 'u'].includes(firstLetter) ? 'an' : 'a';
                      return `${article} ${typeName}`;
                    })()}!
                  </div>
                  
                  {/* Just show "It's a Match!" */}
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: assessmentResult.primaryType?.details?.color || luxTheme.primary,
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ fontSize: '14px' }}>✨</span>
                    It's a Match!
                    <span style={{ fontSize: '14px' }}>✨</span>
                  </div>
                  
                  {/* Show secondary type if significant */}
                  {assessmentResult.secondaryType && assessmentResult.secondaryType.percentage >= 30 && (
                    <div style={{
                      fontSize: '14px',
                      color: luxTheme.textSecondary,
                      marginBottom: '8px'
                    }}>
                      with {assessmentResult.secondaryType.details?.name} tendencies
                    </div>
                  )}
                  
                  <div style={{
                    fontSize: '14px',
                    color: luxTheme.textSecondary,
                    lineHeight: '1.5'
                  }}>
                    {assessmentResult.primaryType?.details?.quickDescription || 'Your personalized insights are ready.'}
                  </div>
                </div>
              
                <button
                  onClick={() => router.push('/parent/dna-lab/my-reading-dna')}
                  style={{
                    backgroundColor: assessmentResult.primaryType?.details?.color || luxTheme.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '16px 32px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    animation: 'fadeInScale 0.5s ease-out 0.7s both',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
                  }}
                >
                  View Full Results →
                </button>
              
                <div style={{
                  fontSize: '12px',
                  color: luxTheme.textSecondary,
                  marginTop: '16px',
                  animation: 'fadeInScale 0.5s ease-out 0.9s both'
                }}>
                  Your results have been saved to your profile
                </div>
              </div>
            </div>
          ) : (
            /* Assessment Questions */
            currentQuestionData && (
              <div style={{
                backgroundColor: luxTheme.surface,
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                {/* Progress Bar */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      color: luxTheme.textSecondary
                    }}>
                      Question {currentQuestion + 1} of {questions.length}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: luxTheme.textSecondary
                    }}>
                      {Math.round(progress)}% Complete
                    </span>
                  </div>
                  <div style={{
                    height: '8px',
                    backgroundColor: `${luxTheme.primary}20`,
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${progress}%`,
                      background: `linear-gradient(90deg, ${luxTheme.primary}, ${luxTheme.secondary})`,
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* Question */}
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  marginBottom: '8px',
                  lineHeight: '1.5',
                  textAlign: 'center'
                }}>
                  {currentQuestionData.text || currentQuestionData.question}
                </div>

                {/* Research Basis */}
                {currentQuestionData.researchBase && (
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '20px'
                  }}>
                    <button
                      onClick={() => setShowResearchBasis(!showResearchBasis)}
                      style={{
                        backgroundColor: 'transparent',
                        border: `1px solid ${luxTheme.primary}40`,
                        borderRadius: '16px',
                        padding: '4px 12px',
                        fontSize: '12px',
                        color: luxTheme.textSecondary,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${luxTheme.primary}10`;
                        e.currentTarget.style.borderColor = luxTheme.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = `${luxTheme.primary}40`;
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>🔬</span>
                      Research Basis
                    </button>
                    
                    {showResearchBasis && (
                      <div style={{
                        marginTop: '12px',
                        backgroundColor: `${luxTheme.primary}05`,
                        borderRadius: '12px',
                        padding: '12px 16px',
                        fontSize: '13px',
                        color: luxTheme.textSecondary,
                        lineHeight: '1.5',
                        textAlign: 'left',
                        border: `1px solid ${luxTheme.primary}20`
                      }}>
                        <strong style={{ color: luxTheme.textPrimary }}>Research Foundation:</strong> {currentQuestionData.researchBase}
                      </div>
                    )}
                  </div>
                )}

                {/* Answer Options */}
                <div style={{
                  display: 'grid',
                  gap: '12px',
                  marginBottom: '24px'
                }}>
                  {currentQuestionData.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      disabled={isCalculating}
                      style={{
                        backgroundColor: `${luxTheme.primary}10`,
                        border: `2px solid ${luxTheme.primary}30`,
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: isCalculating ? 'wait' : 'pointer',
                        textAlign: 'left',
                        fontSize: '15px',
                        color: luxTheme.textPrimary,
                        fontWeight: '500',
                        lineHeight: '1.5',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        transition: 'all 0.2s ease',
                        opacity: isCalculating ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isCalculating) {
                          e.currentTarget.style.backgroundColor = `${luxTheme.primary}20`;
                          e.currentTarget.style.borderColor = luxTheme.primary;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCalculating) {
                          e.currentTarget.style.backgroundColor = `${luxTheme.primary}10`;
                          e.currentTarget.style.borderColor = `${luxTheme.primary}30`;
                        }
                      }}
                    >
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: `${luxTheme.primary}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '600',
                        flexShrink: 0
                      }}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span>{option.text}</span>
                    </button>
                  ))}
                </div>

                {/* Navigation */}
                {currentQuestion > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={goToPreviousQuestion}
                      disabled={isCalculating}
                      style={{
                        backgroundColor: 'transparent',
                        color: luxTheme.textSecondary,
                        border: 'none',
                        fontSize: '14px',
                        cursor: isCalculating ? 'wait' : 'pointer',
                        textDecoration: 'underline',
                        padding: '8px',
                        opacity: isCalculating ? 0.6 : 1
                      }}
                    >
                      ← Previous Question
                    </button>
                  </div>
                )}

                {isCalculating && (
                  <div style={{
                    textAlign: 'center',
                    marginTop: '20px',
                    fontSize: '14px',
                    color: luxTheme.textSecondary
                  }}>
                    ⏳ Analyzing your responses...
                  </div>
                )}
              </div>
            )
          )}
        </div>

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes celebrateBounce {
            0% { transform: translateY(-100px) scale(0); opacity: 0; }
            50% { transform: translateY(0) scale(1.2); opacity: 1; }
            70% { transform: translateY(-30px) scale(0.9); }
            100% { transform: translateY(0) scale(1); }
          }
          
          @keyframes typeEmojiFloat {
            0%, 100% { 
              transform: translateY(0) scale(1) rotate(-5deg); 
            }
            33% { 
              transform: translateY(-15px) scale(1.05) rotate(5deg); 
            }
            66% { 
              transform: translateY(-10px) scale(1.02) rotate(-3deg); 
            }
          }
          
          @keyframes celebrateRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes confettiFall {
            0% { 
              transform: translateY(0) rotate(0deg);
              opacity: 1;
            }
            100% { 
              transform: translateY(600px) rotate(720deg);
              opacity: 0;
            }
          }
          
          @keyframes fadeInScale {
            from { 
              opacity: 0;
              transform: scale(0.8);
            }
            to { 
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes pulse {
            0%, 100% { 
              opacity: 0.3;
              transform: scale(1);
            }
            50% { 
              opacity: 0.6;
              transform: scale(1.05);
            }
          }
          
          button {
            -webkit-tap-highlight-color: transparent;
            -webkit-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
            touch-action: manipulation;
          }
          
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
        `}</style>
      </div>
    </>
  );
}