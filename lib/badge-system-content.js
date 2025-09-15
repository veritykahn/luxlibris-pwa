// lib/badge-system-content.js - Content Badge Checking Functions

import { hasEarnedWeeklyBadge, BADGE_CALENDAR, getCurrentWeekOfYear } from './badge-system';
import { updateStudentDataEntities } from './firebase';
import { awardBadgeXP } from './xp-management';

// Re-export for convenience
export const getCurrentWeek = getCurrentWeekOfYear;

/**
 * Check and award content badges based on student actions
 * Returns array of newly earned badges
 */
export const checkContentBadgeProgress = async (studentData, entityId, schoolId, action = null) => {
  const earnedBadges = [];
  const currentWeek = getCurrentWeekOfYear();
  
  // Content badges to check (with their week numbers)
  const contentBadges = [
    { week: 1, name: "Hummingbird Herald" },
    { week: 6, name: "Peacock Pride" },
    { week: 16, name: "Woodpecker Wisdom" },
    { week: 24, name: "Raven Ratings" },
    { week: 33, name: "Spoonbill Scholar" },
    { week: 43, name: "Gannet Sprint" },
    { week: 44, name: "Cormorant Democracy" }
  ];
  
  // Check each content badge
  for (const badgeInfo of contentBadges) {
    const { week, name } = badgeInfo;
    const badge = BADGE_CALENDAR[week];
    
    // Skip if not a content badge or already earned
    if (!badge || badge.type !== 'content' || hasEarnedWeeklyBadge(studentData, week)) {
      continue;
    }
    
    // Skip if it's not the current week (badges can only be earned during their week)
    if (week !== currentWeek) {
      continue;
    }
    
    let earned = false;
    
    switch (name) {
      case "Hummingbird Herald":
        // Award when adding first book to shelf
        if (studentData.bookshelf && studentData.bookshelf.length > 0) {
          earned = true;
        }
        break;
        
      case "Peacock Pride":
        // Award when rating first book
        if (studentData.bookshelf) {
          const hasRating = studentData.bookshelf.some(book => book.rating > 0);
          if (hasRating) {
            earned = true;
          }
        }
        break;
        
      case "Woodpecker Wisdom":
  // Award when ANY book has progress
  if (studentData.bookshelf) {
    const hasProgress = studentData.bookshelf.some(book => book.currentProgress > 0);
    if (hasProgress) {
      earned = true;
    }
  }
  break;
        
      case "Raven Ratings":
        // Award when rating 2 different books
        if (studentData.bookshelf) {
          const ratedBooks = studentData.bookshelf.filter(book => book.rating > 0);
          if (ratedBooks.length >= 2) {
            earned = true;
          }
        }
        break;
        
      case "Spoonbill Scholar":
        // Award when writing notes on 3 different books
        if (studentData.bookshelf) {
          const booksWithNotes = studentData.bookshelf.filter(book => 
            book.notes && book.notes.trim().length > 0
          );
          if (booksWithNotes.length >= 3) {
            earned = true;
          }
        }
        break;
        
      case "Gannet Sprint":
        // Award when all books in bookshelf have stars or notes
        if (studentData.bookshelf && studentData.bookshelf.length > 0) {
          const allBooksHaveRatingOrNotes = studentData.bookshelf.every(book => 
            book.rating > 0 || (book.notes && book.notes.trim().length > 0)
          );
          if (allBooksHaveRatingOrNotes) {
            earned = true;
          }
        }
        break;
        
      case "Cormorant Democracy":
        // Award when voting for favorite book
        if (studentData.votes && studentData.votes.length > 0) {
          // Check if they have voted this academic year
          const currentYear = getCurrentAcademicYear();
          const hasVotedThisYear = studentData.votes.some(vote => 
            vote.academicYear === currentYear
          );
          if (hasVotedThisYear) {
            earned = true;
          }
        }
        break;
    }
    
    // Award the badge if earned
    if (earned) {
      earnedBadges.push({ ...badge, week });
      
      // Update student data to mark badge as earned
      await updateStudentDataEntities(studentData.id, entityId, schoolId, {
        [`badgeEarnedWeek${week}`]: true,
        lastBadgeEarned: new Date()
      });
      
      console.log(`✅ Content badge earned: ${name} (Week ${week})`);
    }
  }
  
  return earnedBadges;
};

/**
 * Helper function to check specific content badge immediately after an action
 * This is more efficient than checking all badges every time
 */
export const checkSpecificContentBadge = async (studentData, entityId, schoolId, badgeName) => {
  const currentWeek = getCurrentWeekOfYear();
  
  // Find the badge by name
  let targetWeek = null;
  for (const [week, badge] of Object.entries(BADGE_CALENDAR)) {
    if (badge.name === badgeName && badge.type === 'content') {
      targetWeek = parseInt(week);
      break;
    }
  }
  
  // Only check if it's the current week and not already earned
  if (!targetWeek || targetWeek !== currentWeek || hasEarnedWeeklyBadge(studentData, targetWeek)) {
    return null;
  }
  
  // Check the specific badge condition
  const badge = BADGE_CALENDAR[targetWeek];
  let earned = false;
  
  switch (badgeName) {
    case "Hummingbird Herald":
      earned = studentData.bookshelf && studentData.bookshelf.length === 1;
      break;
      
    case "Peacock Pride":
      // Check if this is the first book with a rating
      if (studentData.bookshelf) {
        const ratedBooks = studentData.bookshelf.filter(book => book.rating > 0);
        earned = ratedBooks.length === 1;
      }
      break;
      
    case "Woodpecker Wisdom":
  // Check if ANY book has progress
  if (studentData.bookshelf) {
    const booksWithProgress = studentData.bookshelf.filter(book => book.currentProgress > 0);
    earned = booksWithProgress.length >= 1;
  }
  break;
      
    case "Raven Ratings":
      if (studentData.bookshelf) {
        const ratedBooks = studentData.bookshelf.filter(book => book.rating > 0);
        earned = ratedBooks.length === 2;
      }
      break;
      
    case "Spoonbill Scholar":
      if (studentData.bookshelf) {
        const booksWithNotes = studentData.bookshelf.filter(book => 
          book.notes && book.notes.trim().length > 0
        );
        earned = booksWithNotes.length === 3;
      }
      break;
      
    case "Gannet Sprint":
      if (studentData.bookshelf && studentData.bookshelf.length > 0) {
        earned = studentData.bookshelf.every(book => 
          book.rating > 0 || (book.notes && book.notes.trim().length > 0)
        );
      }
      break;
      
    case "Cormorant Democracy":
      // Check if they just voted
      if (studentData.votes && studentData.votes.length === 1) {
        earned = true;
      }
      break;
  }
  
  if (earned) {
  // Award the badge with proper XP using the XP management system
  try {
    const xpResult = await awardBadgeXP(studentData, targetWeek, 'content-badge-check');
    
    if (xpResult.success) {
      console.log(`✅ Content badge earned with XP: ${badgeName} (Week ${targetWeek}) - ${badge.xp} XP`);
      return { ...badge, week: targetWeek, xpAwarded: badge.xp };
    } else if (xpResult.duplicate) {
      console.log(`⚠️ Badge already earned: ${badgeName}`);
      return null;
    } else {
      console.error(`❌ Failed to award badge XP: ${xpResult.error}`);
      // Fallback to old method
      await updateStudentDataEntities(studentData.id, entityId, schoolId, {
        [`badgeEarnedWeek${targetWeek}`]: true,
        lastBadgeEarned: new Date()
      });
      return { ...badge, week: targetWeek };
    }
  } catch (error) {
    console.error(`❌ Error awarding badge: ${error}`);
    return null;
  }
}
  
  return null;
};

/**
 * Check if a content badge can be earned this week
 * @returns {eligible: boolean, badge: object|null, progress: string}
 */
export const checkContentBadgeEligibility = (studentData, actionType) => {
  const currentWeek = getCurrentWeekOfYear();
  
  // Map action types to their badge weeks
  const badgeMapping = {
    'bookshelf': { week: 1, requiredCount: 1 },
    'rating': { weeks: [6, 24], requiredCounts: [1, 2] },
    'progress': { week: 16, requiredCount: 1 },
    'notes': { week: 33, requiredCount: 3 },
    'completion': { week: 43 },
    'voting': { week: 44 }
  };
  
  const mapping = badgeMapping[actionType];
  if (!mapping) return { eligible: false, badge: null, progress: 'Unknown action' };
  
  // Handle multiple possible weeks (like rating badges)
  const weeks = mapping.weeks || [mapping.week];
  const counts = mapping.requiredCounts || [mapping.requiredCount];
  
  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i];
    const requiredCount = counts[i];
    
    if (currentWeek !== week) continue;
    if (studentData[`badgeEarnedWeek${week}`]) continue;
    
    const badge = BADGE_CALENDAR[week];
    if (!badge || badge.type !== 'content') continue;
    
    // Check specific conditions
    let currentCount = 0;
    let eligible = false;
    
    switch (actionType) {
      case 'bookshelf':
        currentCount = studentData.bookshelf?.length || 0;
        eligible = currentCount >= 1;
        break;
        
      case 'rating':
        currentCount = studentData.bookshelf?.filter(b => b.rating > 0).length || 0;
        eligible = currentCount >= requiredCount;
        break;
        
      case 'progress':
        currentCount = studentData.bookshelf?.filter(b => b.currentProgress > 0).length || 0;
        eligible = currentCount >= 1;
        break;
        
      case 'notes':
        currentCount = studentData.bookshelf?.filter(b => b.notes?.trim().length > 0).length || 0;
        eligible = currentCount >= 3;
        break;
        
      case 'completion':
        if (studentData.bookshelf?.length > 0) {
          eligible = studentData.bookshelf.every(b => 
            b.rating > 0 || (b.notes?.trim().length > 0)
          );
        }
        break;
        
      case 'voting':
        eligible = true; // Will be true when they vote
        break;
    }
    
    if (eligible) {
      return {
        eligible: true,
        badge: { ...badge, week },
        progress: `${currentCount}/${requiredCount || 1}`
      };
    }
    
    return {
      eligible: false,
      badge: { ...badge, week },
      progress: `${currentCount}/${requiredCount || 1}`,
      percentage: Math.round((currentCount / (requiredCount || 1)) * 100)
    };
  }
  
  return { eligible: false, badge: null, progress: 'Not available this week' };
};

// Helper to get current academic year (import from firebase.js in actual implementation)
const getCurrentAcademicYear = () => {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();
  
  // If it's January-May, we're in the second half of the academic year
  if (currentMonth <= 4) { // Jan-May
    return `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
  } else { // June-December
    return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
  }
};