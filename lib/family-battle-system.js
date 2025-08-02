// lib/family-battle-system.js - FIXED: Uses familyId correctly

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================================================
// PROGRAM YEAR UTILITIES (June 1 - May 31)
// ============================================================================

/**
 * Get the current program year (June 1 - May 31)
 */
export const getCurrentProgramYear = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const june1 = new Date(currentYear, 5, 1); // June 1st (month is 0-indexed)
  
  if (now >= june1) {
    return currentYear; // Current program year
  } else {
    return currentYear - 1; // Previous program year
  }
};

/**
 * Get week number within program year (1-52)
 */
export const getProgramWeekNumber = (date = new Date()) => {
  const programYear = getCurrentProgramYear();
  const programStart = new Date(programYear, 5, 1); // June 1st
  
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksDiff = Math.floor((date - programStart) / msPerWeek);
  
  return Math.max(1, Math.min(52, weeksDiff + 1));
};

/**
 * Get start of current program week (Sunday)
 */
export const getProgramWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

/**
 * Get local date string in YYYY-MM-DD format
 */
export const getLocalDateString = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ============================================================================
// STONE COLD JANE AUSTEN QUOTES SYSTEM
// ============================================================================

export const JANE_AUSTEN_QUOTES = {
  battleReady: [
    "You seek discourse? Then prepare for the most uncivil of educations.",
    "Pray remove thyself from my parlour, for Stone Cold Jane Austen hath spoken.",
    "If thou art unpleased, I suggest you turn the page and do weep.",
    "You are but an unfinished draft; I am the final edition.",
    "Consider thyself shelved — permanently.",
    "Thy intellect is as thin as a pamphlet.",
    "Even the prologue of thy argument is insufferable.",
    "You've been edited out of relevance.",
    "Your reasoning is fit only for the bargain bin.",
    "A footnote has more substance than thy rhetoric.",
    "You are as insipid as unseasoned porridge.",
    "My quill dismantles thee as easily as parchment tears.",
    "Welcome to the literary arena, where I am the headlining author!",
    "Prepare to receive thy comeuppance in the most elegant manner.",
    "I shall apply the pressure of prose until thou dost surrender.",
    "Dost thou detect the aroma of literary victory cooking?",
    "The battle of wits begins now - though thou dost appear unarmed.",
    "Challenge accepted! Let the words fly like steel!",
    "Time to separate the readers from the mere page-turners!",
    "Your literary education commences NOW!"
  ],
  
  victorious: [
    "The lady has turned the final page — and conquered.",
    "I write my own ending, and it is victorious.",
    "This chapter of competition closes: I stand the victor.",
    "The quill strikes mightier than the sword — and it is mine.",
    "Observe: I conclude this narrative with triumph.",
    "Your character arc ends most unfavourably — mine, in glory.",
    "This book is finished, and so are you.",
    "The final draft bears my signature.",
    "It is most agreeable to conclude with such satisfaction.",
    "I outwrite, outwit, and outlast.",
    "The book closes upon my victory.",
    "Stone Cold Jane Austen has spoken — and thou art done.",
    "Behold! A new champion of letters has emerged!",
    "I remain, as always, thy undisputed sovereign of syntax!",
    "Thus concludes this most satisfying era of literary dominance!",
    "Good heavens! I have quite thoroughly dismantled thy arguments!",
    "Victory tastes sweeter than the finest tea!",
    "And THAT'S the bottom line, because Stone Cold Jane said so!",
    "Consider thyself well and truly EDITED!",
    "Another challenger falls to my literary prowess!"
  ],
  
  encouraging: [
    "Turn the page, for idleness is the enemy.",
    "Read fiercely, as though the quill were your weapon.",
    "Fortune favours the well‑read.",
    "Pray silence, for Jane Austen hath entered the library!",
    "One chapter more, dear reader, and glory is thine.",
    "In this ring of letters, you are a champion.",
    "Your literacy is your legacy.",
    "Let your library be your armory.",
    "A reader is never defeated.",
    "Devour words as the famished devour bread.",
    "Where is my tea? There is conquest to be toasted.",
    "My discourse is sharp, my tea hotter still.",
    "If thou art prepared for literary combat, pray give me thy most enthusiastic affirmation!",
    "What say you? Speak louder! I commanded thee to peruse thy volumes!",
    "The championship of letters lies within thy grasp — seize it with dignity!",
    "Enter ye into the squared circle of scholarship and defend thy intellect!",
    "This domain belongs to thee — guard it with the most vigorous reading!",
    "Art thou prepared to engage in literary fisticuffs with the finest literature?",
    "Rise up, young scholar! Your moment of glory awaits!",
    "Every page turned is a step toward victory!",
    "The battle may be fierce, but thy spirit is fiercer!",
    "Read on, brave soul! Literature needs champions like thee!"
  ]
};

/**
 * Get a random Jane Austen quote by type
 */
export const getJaneAustenQuote = (type = 'encouraging') => {
  const quotes = JANE_AUSTEN_QUOTES[type] || JANE_AUSTEN_QUOTES.encouraging;
  return quotes[Math.floor(Math.random() * quotes.length)];
};

// ============================================================================
// FAMILY BATTLE INITIALIZATION
// ============================================================================

/**
 * Initialize family battle system
 * FIXED: Now uses familyId from parentData instead of parentUid
 */
export const initializeFamilyBattle = async (familyId, parentData) => {
  try {
    if (!familyId) {
      throw new Error('No familyId provided for battle initialization');
    }
    
    const familyRef = doc(db, 'families', familyId);
    const today = new Date();
    const weekStart = getProgramWeekStart(today);
    const weekStr = getLocalDateString(weekStart);
    
    const familyDoc = await getDoc(familyRef);
    
    if (familyDoc.exists()) {
      // Family already exists, enable battle and ensure parent is linked
      const updates = {
        'familyBattleSettings.enabled': true,
        'familyBattleSettings.lastUpdated': serverTimestamp()
      };
      
      // Ensure parent is in linkedParents array
      const existingData = familyDoc.data();
      const parentUid = parentData.uid || parentData.id;
      
      if (parentUid && (!existingData.linkedParents || !existingData.linkedParents.includes(parentUid))) {
        updates.linkedParents = [...(existingData.linkedParents || []), parentUid];
      }
      
      await updateDoc(familyRef, updates);
      console.log('✅ Family battle enabled for existing family:', familyId);
      return familyDoc.data();
    }
    
    // This shouldn't happen if family was created properly during setup
    console.error('❌ Family document does not exist:', familyId);
    throw new Error('Family document not found. Please ensure family is set up correctly.');
    
  } catch (error) {
    console.error('❌ Error initializing family battle:', error);
    throw error;
  }
};

// ============================================================================
// BATTLE DATA CALCULATION
// ============================================================================

/**
 * Calculate current week's battle data
 * FIXED: Now uses familyId instead of parentUid
 */
export const calculateFamilyBattleData = async (familyId, linkedStudents) => {
  try {
    if (!familyId) {
      throw new Error('No familyId provided for battle calculation');
    }
    
    const today = new Date();
    const weekStart = getProgramWeekStart(today);
    const weekStr = getLocalDateString(weekStart);
    
    console.log('🔄 Calculating battle data for family:', familyId, 'week:', weekStr);
    
    // Get the family document to find the parent UID
    const familyRef = doc(db, 'families', familyId);
    const familyDoc = await getDoc(familyRef);
    
    if (!familyDoc.exists()) {
      throw new Error('Family document not found');
    }
    
    const familyData = familyDoc.data();
    
    // Get parent UID from linkedParents array, createdBy field, or parentUid field
    let parentUid = null;
    if (familyData.linkedParents && familyData.linkedParents.length > 0) {
      parentUid = familyData.linkedParents[0];
    } else if (familyData.createdBy) {
      parentUid = familyData.createdBy;
    } else if (familyData.parentUid) {
      parentUid = familyData.parentUid;
    }
    
    if (!parentUid) {
      console.warn('⚠️ No parent UID found in family document');
      throw new Error('No parent linked to family');
    }
    
    // Get parent reading this week
    let parentMinutes = 0;
    try {
      const parentSessionsRef = collection(db, `parents/${parentUid}/readingSessions`);
      const parentWeekQuery = query(
        parentSessionsRef,
        where('date', '>=', weekStr)
      );
      const parentWeekSnapshot = await getDocs(parentWeekQuery);
      
      parentWeekSnapshot.forEach(docSnap => {
        const session = docSnap.data();
        parentMinutes += session.duration || 0;
      });
    } catch (error) {
      console.warn('⚠️ Could not load parent sessions:', error);
    }
    
    console.log('👨‍👩 Parent minutes this week:', parentMinutes);
    
    // Get children's reading this week
    let childrenMinutes = 0;
    for (const student of linkedStudents) {
      const studentSessionsRef = collection(
        db, 
        `entities/${student.entityId}/schools/${student.schoolId}/students/${student.id}/readingSessions`
      );
      const studentWeekQuery = query(
        studentSessionsRef,
        where('date', '>=', weekStr)
      );
      const studentWeekSnapshot = await getDocs(studentWeekQuery);
      
      let studentTotal = 0;
      studentWeekSnapshot.forEach(docSnap => {
        const session = docSnap.data();
        studentTotal += session.duration || 0;
      });
      
      console.log(`👦👧 Student ${student.id} minutes:`, studentTotal);
      childrenMinutes += studentTotal;
    }
    
    console.log('👧👦 Total children minutes this week:', childrenMinutes);
    
    // Determine winner and margin
    let winner = 'tie';
    let margin = 0;
    
    if (childrenMinutes > parentMinutes) {
      winner = 'children';
      margin = childrenMinutes - parentMinutes;
    } else if (parentMinutes > childrenMinutes) {
      winner = 'parents';
      margin = parentMinutes - childrenMinutes;
    }
    
    const battleData = {
      weekStart: weekStr,
      weekNumber: getProgramWeekNumber(today),
      parentMinutes,
      childrenMinutes,
      totalMinutes: parentMinutes + childrenMinutes,
      winner,
      margin,
      lastUpdated: new Date()
    };
    
    console.log('⚔️ Battle result:', battleData);
    
    // Update family document
    await updateFamilyBattleData(familyId, battleData);
    
    return battleData;
    
  } catch (error) {
    console.error('❌ Error calculating battle data:', error);
    throw error;
  }
};

/**
 * Update family battle data in database
 * FIXED: Now uses familyId
 */
export const updateFamilyBattleData = async (familyId, battleData) => {
  try {
    if (!familyId) {
      throw new Error('No familyId provided for battle update');
    }
    
    const familyRef = doc(db, 'families', familyId);
    
    await updateDoc(familyRef, {
      'familyBattleSettings.currentWeek': {
        weekStart: battleData.weekStart,
        weekNumber: battleData.weekNumber,
        children: battleData.childrenMinutes,
        parents: battleData.parentMinutes,
        winner: battleData.winner,
        margin: battleData.margin,
        lastUpdated: serverTimestamp()
      }
    });
    
    console.log('✅ Battle data updated in database for family:', familyId);
    
  } catch (error) {
    console.error('❌ Error updating battle data:', error);
    throw error;
  }
};

// ============================================================================
// STUDENT ENABLEMENT
// ============================================================================

/**
 * Enable family battle for students
 * FIXED: Now uses familyId
 */
export const enableFamilyBattleForStudents = async (familyId, linkedStudents) => {
  try {
    if (!familyId) {
      throw new Error('No familyId provided for student enablement');
    }
    
    console.log('🚀 Enabling family battle for students in family:', familyId);
    
    const promises = linkedStudents.map(async (student) => {
      try {
        const studentRef = doc(
          db, 
          `entities/${student.entityId}/schools/${student.schoolId}/students/${student.id}`
        );
        
        await updateDoc(studentRef, {
          'familyBattleSettings.enabled': true,
          'familyBattleSettings.parentFamilyId': familyId, // Store familyId, not parentUid
          'familyBattleSettings.enabledAt': serverTimestamp(),
          'familyBattleSettings.lastUpdated': serverTimestamp()
        });
        
        console.log('✅ Family battle enabled for student:', student.id);
        return { success: true, studentId: student.id };
        
      } catch (error) {
        console.error('❌ Error enabling family battle for student:', student.id, error);
        return { success: false, studentId: student.id, error };
      }
    });
    
    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success).length;
    
    console.log(`✅ Family battle enabled for ${successful}/${linkedStudents.length} students`);
    return { enabled: successful, total: linkedStudents.length };
    
  } catch (error) {
    console.error('❌ Error enabling family battle for students:', error);
    throw error;
  }
};

// ============================================================================
// BATTLE STATISTICS
// ============================================================================

/**
 * Get family battle statistics
 * FIXED: Now uses familyId
 */
export const getFamilyBattleStats = async (familyId) => {
  try {
    if (!familyId) {
      throw new Error('No familyId provided for stats');
    }
    
    const familyRef = doc(db, 'families', familyId);
    const familyDoc = await getDoc(familyRef);
    
    if (!familyDoc.exists()) {
      return null;
    }
    
    const familyData = familyDoc.data();
    const history = familyData.championshipHistory || {};
    
    return {
      totalBattles: history.totalBattles || 0,
      childrenWins: history.childrenWins || 0,
      parentWins: history.parentWins || 0,
      ties: history.ties || 0,
      winRates: {
        children: history.totalBattles > 0 ? 
          Math.round((history.childrenWins / history.totalBattles) * 100) : 0,
        parents: history.totalBattles > 0 ? 
          Math.round((history.parentWins / history.totalBattles) * 100) : 0
      },
      currentStreak: history.currentStreak || { team: null, weeks: 0 },
      recentResults: history.recentResults || []
    };
    
  } catch (error) {
    console.error('❌ Error getting family battle stats:', error);
    return null;
  }
};

// ============================================================================
// WEEKLY RESET - Called every Sunday night
// ============================================================================

/**
 * Reset weekly battle and archive results
 * FIXED: Now uses familyId
 */
export const resetWeeklyBattle = async (familyId) => {
  try {
    if (!familyId) {
      throw new Error('No familyId provided for reset');
    }
    
    const familyRef = doc(db, 'families', familyId);
    const familyDoc = await getDoc(familyRef);
    
    if (!familyDoc.exists()) return;
    
    const familyData = familyDoc.data();
    const currentWeek = familyData.familyBattleSettings?.currentWeek;
    
    if (currentWeek) {
      // Update championship history
      const history = familyData.championshipHistory || {};
      const newHistory = {
        totalBattles: (history.totalBattles || 0) + 1,
        childrenWins: history.childrenWins || 0,
        parentWins: history.parentWins || 0,
        ties: history.ties || 0,
        recentResults: [...(history.recentResults || [])],
        currentStreak: history.currentStreak || { team: null, weeks: 0 }
      };
      
      // Update win counts
      if (currentWeek.winner === 'children') {
        newHistory.childrenWins += 1;
      } else if (currentWeek.winner === 'parents') {
        newHistory.parentWins += 1;
      } else {
        newHistory.ties += 1;
      }
      
      // Update streak
      if (currentWeek.winner === 'tie') {
        newHistory.currentStreak = { team: null, weeks: 0 };
      } else if (newHistory.currentStreak.team === currentWeek.winner) {
        newHistory.currentStreak.weeks += 1;
      } else {
        newHistory.currentStreak = { team: currentWeek.winner, weeks: 1 };
      }
      
      // Add to recent results (keep last 5)
      newHistory.recentResults.unshift({
        week: currentWeek.weekNumber,
        winner: currentWeek.winner,
        childrenMinutes: currentWeek.children,
        parentMinutes: currentWeek.parents,
        margin: currentWeek.margin
      });
      newHistory.recentResults = newHistory.recentResults.slice(0, 5);
      
      // Start new week
      const today = new Date();
      const newWeekStart = getProgramWeekStart(today);
      const newWeekStr = getLocalDateString(newWeekStart);
      
      await updateDoc(familyRef, {
        'familyBattleSettings.currentWeek': {
          weekStart: newWeekStr,
          weekNumber: getProgramWeekNumber(today),
          children: 0,
          parents: 0,
          winner: 'tie',
          margin: 0,
          lastUpdated: serverTimestamp()
        },
        championshipHistory: newHistory
      });
    }
    
    console.log('✅ Weekly battle reset completed for family:', familyId);
    
  } catch (error) {
    console.error('❌ Error resetting battle:', error);
    throw error;
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Setup
  initializeFamilyBattle,
  
  // Student enablement
  enableFamilyBattleForStudents,
  
  // Battle calculation
  calculateFamilyBattleData,
  updateFamilyBattleData,
  getFamilyBattleStats,
  
  // Weekly reset
  resetWeeklyBattle,
  
  // Jane Austen system
  getJaneAustenQuote,
  JANE_AUSTEN_QUOTES,
  
  // Utilities
  getCurrentProgramYear,
  getProgramWeekNumber,
  getProgramWeekStart,
  getLocalDateString
};