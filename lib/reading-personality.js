// lib/reading-personality.js - Reading Personality & First Book Celebration System

import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

// Reading personality definitions
export const READING_PERSONALITIES = {
  early_bird: {
    name: 'Early Bird',
    emoji: '🌅',
    description: 'You love starting your day with a good book!',
    timeRange: '6am-11am',
    startHour: 6,
    endHour: 11,
    color: '#FFA726'
  },
  sunshine_reader: {
    name: 'Sunshine Reader',
    emoji: '☀️', 
    description: 'Midday reading brings you joy and energy!',
    timeRange: '11am-4pm',
    startHour: 11,
    endHour: 16,
    color: '#FFD54F'
  },
  twilight_scholar: {
    name: 'Twilight Scholar',
    emoji: '🌆',
    description: 'Evening hours are perfect for diving into stories!',
    timeRange: '4pm-8pm', 
    startHour: 16,
    endHour: 20,
    color: '#FF7043'
  },
  night_owl: {
    name: 'Night Owl',
    emoji: '🌙',
    description: 'Late evening reading helps you unwind!',
    timeRange: '8pm-12am',
    startHour: 20,
    endHour: 24,
    color: '#7986CB'
  },
  midnight_mouse: {
    name: 'Midnight Mouse',
    emoji: '🐭',
    description: 'The quiet hours after midnight are your reading sanctuary!',
    timeRange: '12am-6am',
    startHour: 0,
    endHour: 6,
    color: '#9575CD'
  }
};

// Calculate reading personality from session data
export const calculateReadingPersonality = async (studentData) => {
  try {
    console.log('🕐 Calculating reading personality for:', studentData.firstName);
    
    // Get all reading sessions
    const sessionsRef = collection(db, `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/readingSessions`);
    const sessionsSnapshot = await getDocs(sessionsRef);
    
    const timeSlotCounts = {
      early_bird: 0,
      sunshine_reader: 0,
      twilight_scholar: 0,
      night_owl: 0,
      midnight_mouse: 0
    };
    
    let totalSessions = 0;
    
    sessionsSnapshot.forEach(doc => {
      const session = doc.data();
      
      // Get the hour from the session start time
      let sessionHour;
      if (session.startTime?.toDate) {
        sessionHour = session.startTime.toDate().getHours();
      } else if (session.startTime) {
        sessionHour = new Date(session.startTime).getHours();
      } else {
        return; // Skip sessions without start time
      }
      
      totalSessions++;
      
      // Categorize by time slot
      if (sessionHour >= 6 && sessionHour < 11) {
        timeSlotCounts.early_bird++;
      } else if (sessionHour >= 11 && sessionHour < 16) {
        timeSlotCounts.sunshine_reader++;
      } else if (sessionHour >= 16 && sessionHour < 20) {
        timeSlotCounts.twilight_scholar++;
      } else if (sessionHour >= 20 && sessionHour < 24) {
        timeSlotCounts.night_owl++;
      } else { // 0-6 hours (midnight to 6am)
        timeSlotCounts.midnight_mouse++;
      }
    });
    
    if (totalSessions === 0) {
      console.log('📊 No sessions found for personality calculation');
      return null;
    }
    
    // Find the personality with the most sessions
    let dominantPersonality = 'sunshine_reader'; // Default
    let maxCount = 0;
    
    for (const [personality, count] of Object.entries(timeSlotCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantPersonality = personality;
      }
    }
    
    const personalityData = READING_PERSONALITIES[dominantPersonality];
    const percentage = Math.round((maxCount / totalSessions) * 100);
    
    console.log('✅ Reading personality calculated:', {
      personality: personalityData.name,
      percentage,
      sessions: maxCount,
      total: totalSessions
    });
    
    return {
      type: dominantPersonality,
      name: personalityData.name,
      emoji: personalityData.emoji,
      description: personalityData.description,
      timeRange: personalityData.timeRange,
      color: personalityData.color,
      percentage,
      sessionsInSlot: maxCount,
      totalSessions,
      breakdown: timeSlotCounts
    };
    
  } catch (error) {
    console.error('❌ Error calculating reading personality:', error);
    return null;
  }
};

// Check if student has completed their first book
export const checkFirstBookCompletion = (studentData) => {
  // Use booksSubmittedThisYear from Firebase structure
  const booksCompleted = studentData.booksSubmittedThisYear || 0;
  
  return {
    hasCompletedFirstBook: booksCompleted > 0,
    totalCompleted: booksCompleted,
    totalInBookshelf: booksCompleted
  };
};

// Check if student should see first book celebration
export const shouldShowFirstBookCelebration = (studentData) => {
  const completion = checkFirstBookCompletion(studentData);
  
  return (
    completion.hasCompletedFirstBook && 
    !studentData.firstBookCelebrationShown &&
    !studentData.certificateUnlocked
  );
};

// Mark first book celebration as shown and unlock certificate
export const unlockCertificate = async (studentData) => {
  try {
    console.log('🎉 Unlocking certificate for first book completion');
    
    await updateDoc(doc(db, `entities/${studentData.entityId}/schools/${studentData.schoolId}/students`, studentData.id), {
      firstBookCelebrationShown: true,
      certificateUnlocked: true,
      certificateUnlockedDate: new Date(),
      lastModified: new Date()
    });
    
    console.log('✅ Certificate unlocked successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error unlocking certificate:', error);
    return false;
  }
};

// Enhanced book completion stats for certificate
export const getBookCompletionStats = (studentData) => {
  // Use booksSubmittedThisYear from Firebase structure
  const completedBooks = studentData.booksSubmittedThisYear || 0;
  const currentYearGoal = studentData.personalGoal || studentData.currentYearGoal || 15;
  
  return {
    completed: completedBooks,
    goal: currentYearGoal,
    percentage: Math.round((completedBooks / currentYearGoal) * 100),
    remaining: Math.max(0, currentYearGoal - completedBooks),
    inProgress: 0 // No bookshelf progress tracking in current structure
  };
};

// Get reading habits summary for certificate
export const getReadingHabitsSummary = async (studentData) => {
  try {
    const personality = await calculateReadingPersonality(studentData);
    const bookStats = getBookCompletionStats(studentData);
    
    const sessionsRef = collection(db, `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/readingSessions`);
    const sessionsSnapshot = await getDocs(sessionsRef);
    
    let totalMinutes = 0;
    let completedSessions = 0;
    
    sessionsSnapshot.forEach(doc => {
      const session = doc.data();
      totalMinutes += session.duration || 0;
      if (session.completed) completedSessions++;
    });
    
    return {
      personality,
      bookStats,
      totalMinutes,
      totalHours: Math.round(totalMinutes / 60),
      completedSessions,
      averageSessionLength: completedSessions > 0 ? Math.round(totalMinutes / completedSessions) : 0
    };
    
  } catch (error) {
    console.error('❌ Error getting reading habits summary:', error);
    return null;
  }
};