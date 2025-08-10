// lib/xp-management.js - Centralized XP Management System with Transaction Support

import { 
  doc, 
  runTransaction, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { BADGE_CALENDAR } from './badge-system';

// ============================================================================
// XP CONSTANTS
// ============================================================================

export const XP_TYPES = {
  READING: 'reading',
  BADGE: 'badge',
  FAMILY_BATTLE: 'family_battle',
  FAMILY_BATTLE_MVP: 'family_battle_mvp',
  BONUS: 'bonus',
  MANUAL_ADJUSTMENT: 'manual_adjustment'
};

export const XP_VALUES = {
  PER_MINUTE_READING: 1,
  FAMILY_BATTLE_WIN: 25,
  FAMILY_BATTLE_MVP_BONUS: 25
};

// ============================================================================
// CORE XP TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Award XP with transaction safety and history tracking
 * This is the ONLY function that should modify totalXP
 */
const awardXP = async (studentData, xpAmount, type, details = {}) => {
  try {
    const studentRef = doc(
      db, 
      `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}`
    );
    
    const xpHistoryRef = collection(
      db,
      `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/xpHistory`
    );

    const result = await runTransaction(db, async (transaction) => {
      // Get current student data within transaction
      const studentDoc = await transaction.get(studentRef);
      
      if (!studentDoc.exists()) {
        throw new Error('Student document not found');
      }
      
      const currentData = studentDoc.data();
      const currentTotalXP = currentData.totalXP || 0;
      const newTotalXP = currentTotalXP + xpAmount;
      
      // Check for duplicate awards based on type
      if (type === XP_TYPES.BADGE && details.weekNumber) {
        if (currentData[`badgeEarnedWeek${details.weekNumber}`]) {
          return {
            success: false,
            reason: 'Badge already awarded',
            duplicate: true
          };
        }
      }
      
      if (type === XP_TYPES.FAMILY_BATTLE && details.weekNumber) {
        if (currentData[`familyBattleWeek${details.weekNumber}XPAwarded`]) {
          return {
            success: false,
            reason: 'Family battle XP already awarded for this week',
            duplicate: true
          };
        }
      }
      
      // Create XP history entry
      const xpHistoryEntry = {
        timestamp: serverTimestamp(),
        type: type,
        amount: xpAmount,
        details: {
          ...details,
          source: details.source || 'unknown',
          sessionId: details.sessionId || null,
          badgeName: details.badgeName || null,
          weekNumber: details.weekNumber || null,
          description: details.description || null
        },
        previousTotal: currentTotalXP,
        newTotal: newTotalXP,
        academicYear: currentData.academicYear || '2025-26'
      };
      
      // Prepare update object
      const updateData = {
        totalXP: newTotalXP,
        lastXPUpdate: serverTimestamp()
      };
      
      // Add type-specific flags
      if (type === XP_TYPES.BADGE && details.weekNumber) {
        updateData[`badgeEarnedWeek${details.weekNumber}`] = true;
        updateData.lastBadgeEarned = serverTimestamp();
      }
      
      if (type === XP_TYPES.FAMILY_BATTLE && details.weekNumber) {
        updateData[`familyBattleWeek${details.weekNumber}XPAwarded`] = true;
        updateData.lastFamilyBattleXP = xpAmount;
      }
      
      if (type === XP_TYPES.FAMILY_BATTLE_MVP && details.weekNumber) {
        updateData[`familyBattleWeek${details.weekNumber}MVP`] = true;
      }
      
      // Update student document
      transaction.update(studentRef, updateData);
      
      // Note: We can't use transaction.add for subcollections, so we'll add history after
      
      return {
        success: true,
        xpAwarded: xpAmount,
        previousTotal: currentTotalXP,
        newTotal: newTotalXP,
        historyEntry: xpHistoryEntry
      };
    });
    
    // Add history entry after successful transaction
    if (result.success && result.historyEntry) {
      await addDoc(xpHistoryRef, result.historyEntry);
      
      // Log the XP award
      console.log('[XP Award Success]', {
        timestamp: new Date().toISOString(),
        studentId: studentData.id,
        type: type,
        amount: xpAmount,
        source: details.source || 'unknown',
        previousTotal: result.previousTotal,
        newTotal: result.newTotal,
        details: details
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('[XP Award Error]', {
      timestamp: new Date().toISOString(),
      studentId: studentData.id,
      type: type,
      amount: xpAmount,
      error: error.message
    });
    
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================================================
// SPECIFIC XP AWARD FUNCTIONS
// ============================================================================

/**
 * Award XP for reading session
 */
const awardReadingXP = async (studentData, duration, sessionId) => {
  const xpAmount = Math.max(1, Math.floor(duration));
  
  return await awardXP(
    studentData,
    xpAmount,
    XP_TYPES.READING,
    {
      source: 'reading_session',
      sessionId: sessionId,
      duration: duration,
      description: `${duration} minute reading session`
    }
  );
};

/**
 * Award XP for badge completion
 */
const awardBadgeXP = async (studentData, weekNumber, source = 'unknown') => {
  const badge = BADGE_CALENDAR[weekNumber];
  
  if (!badge) {
    return {
      success: false,
      error: 'Badge not found for week ' + weekNumber
    };
  }
  
  return await awardXP(
    studentData,
    badge.xp,
    XP_TYPES.BADGE,
    {
      source: source,
      weekNumber: weekNumber,
      badgeName: badge.name,
      badgeType: badge.type,
      description: `Earned ${badge.name} badge (Week ${weekNumber})`
    }
  );
};

/**
 * Award XP for family battle victory
 */
const awardFamilyBattleXP = async (studentData, weekNumber, isMVP = false, source = 'family_battle') => {
  const baseXP = XP_VALUES.FAMILY_BATTLE_WIN;
  const mvpBonus = isMVP ? XP_VALUES.FAMILY_BATTLE_MVP_BONUS : 0;
  const totalXP = baseXP + mvpBonus;
  
  const result = await awardXP(
    studentData,
    totalXP,
    isMVP ? XP_TYPES.FAMILY_BATTLE_MVP : XP_TYPES.FAMILY_BATTLE,
    {
      source: source,
      weekNumber: weekNumber,
      isMVP: isMVP,
      baseXP: baseXP,
      mvpBonus: mvpBonus,
      description: `Family battle victory Week ${weekNumber}${isMVP ? ' (MVP)' : ''}`
    }
  );
  
  // Update family battle history if successful
  if (result.success) {
    try {
      const studentRef = doc(
        db, 
        `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}`
      );
      
      await runTransaction(db, async (transaction) => {
        const studentDoc = await transaction.get(studentRef);
        const currentData = studentDoc.data();
        
        const currentVictories = currentData.familyBattleHistory?.totalVictories || 0;
        
        transaction.update(studentRef, {
          'familyBattleHistory.totalVictories': currentVictories + 1,
          'familyBattleHistory.lastVictoryWeek': weekNumber,
          'familyBattleHistory.lastVictoryXP': totalXP,
          'familyBattleHistory.lastVictoryDate': serverTimestamp()
        });
      });
    } catch (historyError) {
      console.error('[Family Battle History Update Error]', historyError);
    }
  }
  
  return result;
};

// ============================================================================
// XP VALIDATION & AUDIT FUNCTIONS
// ============================================================================

/**
 * Get complete XP history for a student
 */
const getXPHistory = async (studentData, limitCount = 100) => {
  try {
    const xpHistoryRef = collection(
      db,
      `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/xpHistory`
    );
    
    const historyQuery = query(
      xpHistoryRef,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(historyQuery);
    const history = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      history.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date()
      });
    });
    
    return history;
    
  } catch (error) {
    console.error('[XP History Error]', error);
    return [];
  }
};

/**
 * Calculate total XP from history (for validation)
 */
const calculateXPFromHistory = async (studentData) => {
  try {
    const history = await getXPHistory(studentData, 10000); // Get all history
    
    const totalFromHistory = history.reduce((sum, entry) => sum + (entry.amount || 0), 0);
    
    return {
      calculatedTotal: totalFromHistory,
      historyCount: history.length,
      breakdown: {
        reading: history.filter(h => h.type === XP_TYPES.READING)
          .reduce((sum, h) => sum + h.amount, 0),
        badges: history.filter(h => h.type === XP_TYPES.BADGE)
          .reduce((sum, h) => sum + h.amount, 0),
        familyBattle: history.filter(h => h.type === XP_TYPES.FAMILY_BATTLE || h.type === XP_TYPES.FAMILY_BATTLE_MVP)
          .reduce((sum, h) => sum + h.amount, 0),
        other: history.filter(h => ![XP_TYPES.READING, XP_TYPES.BADGE, XP_TYPES.FAMILY_BATTLE, XP_TYPES.FAMILY_BATTLE_MVP].includes(h.type))
          .reduce((sum, h) => sum + h.amount, 0)
      }
    };
    
  } catch (error) {
    console.error('[XP Calculation Error]', error);
    return null;
  }
};

/**
 * Validate student's total XP against all sources
 */
const validateTotalXP = async (studentData) => {
  try {
    let calculatedXP = 0;
    const validation = {
      sources: {},
      discrepancies: []
    };
    
    // 1. Calculate from reading sessions
    const sessionsRef = collection(
      db, 
      `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/readingSessions`
    );
    const sessionsSnapshot = await getDocs(sessionsRef);
    
    let readingXP = 0;
    sessionsSnapshot.forEach(doc => {
      const session = doc.data();
      // Use xpEarned if available, otherwise use duration
      const sessionXP = session.xpEarned || session.duration || 0;
      readingXP += sessionXP;
    });
    
    validation.sources.reading = readingXP;
    calculatedXP += readingXP;
    
    // 2. Calculate from badges
    let badgeXP = 0;
    for (let week = 1; week <= 52; week++) {
      if (studentData[`badgeEarnedWeek${week}`]) {
        const badge = BADGE_CALENDAR[week];
        if (badge) {
          badgeXP += badge.xp;
        } else {
          validation.discrepancies.push(`Badge earned for week ${week} but no badge definition found`);
        }
      }
    }
    
    validation.sources.badges = badgeXP;
    calculatedXP += badgeXP;
    
    // 3. Calculate from family battles
    let battleXP = 0;
    
    // Check each week for family battle XP
    for (let week = 1; week <= 52; week++) {
      if (studentData[`familyBattleWeek${week}XPAwarded`]) {
        battleXP += XP_VALUES.FAMILY_BATTLE_WIN;
        if (studentData[`familyBattleWeek${week}MVP`]) {
          battleXP += XP_VALUES.FAMILY_BATTLE_MVP_BONUS;
        }
      }
    }
    
    validation.sources.familyBattle = battleXP;
    calculatedXP += battleXP;
    
    // 4. Compare with history if available
    const historyData = await calculateXPFromHistory(studentData);
    if (historyData) {
      validation.sources.fromHistory = historyData.calculatedTotal;
      validation.historyBreakdown = historyData.breakdown;
    }
    
    // 5. Compare with stored total
    validation.calculatedTotal = calculatedXP;
    validation.storedTotal = studentData.totalXP || 0;
    validation.difference = validation.storedTotal - calculatedXP;
    validation.isValid = Math.abs(validation.difference) < 1; // Allow for rounding
    
    // Log validation results
    console.log('[XP Validation]', {
      studentId: studentData.id,
      ...validation
    });
    
    return validation;
    
  } catch (error) {
    console.error('[XP Validation Error]', error);
    return {
      error: error.message,
      isValid: false
    };
  }
};

/**
 * Fix XP discrepancies (admin function)
 */
const reconcileXP = async (studentData, useHistoryTotal = false) => {
  try {
    const validation = await validateTotalXP(studentData);
    
    if (validation.isValid) {
      return {
        success: true,
        message: 'No discrepancy found',
        validation
      };
    }
    
    // Determine the correct total
    let correctTotal = validation.calculatedTotal;
    
    if (useHistoryTotal && validation.sources.fromHistory) {
      correctTotal = validation.sources.fromHistory;
    }
    
    // Update the student's total XP
    const studentRef = doc(
      db, 
      `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}`
    );
    
    await runTransaction(db, async (transaction) => {
      transaction.update(studentRef, {
        totalXP: correctTotal,
        lastXPReconciliation: serverTimestamp(),
        xpReconciliationNote: `Reconciled from ${validation.storedTotal} to ${correctTotal} (diff: ${validation.difference})`
      });
    });
    
    // Add reconciliation entry to history
    const xpHistoryRef = collection(
      db,
      `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/xpHistory`
    );
    
    await addDoc(xpHistoryRef, {
      timestamp: serverTimestamp(),
      type: XP_TYPES.MANUAL_ADJUSTMENT,
      amount: correctTotal - validation.storedTotal,
      details: {
        source: 'reconciliation',
        previousTotal: validation.storedTotal,
        newTotal: correctTotal,
        validation: validation,
        description: 'Automatic XP reconciliation'
      },
      previousTotal: validation.storedTotal,
      newTotal: correctTotal
    });
    
    return {
      success: true,
      message: 'XP reconciled successfully',
      previousTotal: validation.storedTotal,
      newTotal: correctTotal,
      difference: correctTotal - validation.storedTotal
    };
    
  } catch (error) {
    console.error('[XP Reconciliation Error]', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================================================
// WEEKLY XP TRACKING
// ============================================================================

/**
 * Get XP earned in current week
 */
const getWeeklyXP = async (studentData) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const xpHistoryRef = collection(
      db,
      `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/xpHistory`
    );
    
    const weekQuery = query(
      xpHistoryRef,
      where('timestamp', '>=', Timestamp.fromDate(oneWeekAgo))
    );
    
    const snapshot = await getDocs(weekQuery);
    let weeklyTotal = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      weeklyTotal += data.amount || 0;
    });
    
    return weeklyTotal;
    
  } catch (error) {
    console.error('[Weekly XP Error]', error);
    return 0;
  }
};

// ============================================================================
// DEBUG & MONITORING
// ============================================================================

/**
 * Get XP audit report for debugging
 */
const getXPAuditReport = async (studentData) => {
  try {
    const validation = await validateTotalXP(studentData);
    const history = await getXPHistory(studentData, 50);
    const weeklyXP = await getWeeklyXP(studentData);
    
    const report = {
      studentId: studentData.id,
      currentTotal: studentData.totalXP || 0,
      validation: validation,
      weeklyXP: weeklyXP,
      recentHistory: history.slice(0, 10).map(h => ({
        date: h.timestamp,
        type: h.type,
        amount: h.amount,
        description: h.details?.description || 'No description'
      })),
      flags: {
        hasHistory: history.length > 0,
        hasDiscrepancy: !validation.isValid,
        discrepancyAmount: validation.difference || 0
      }
    };
    
    return report;
    
  } catch (error) {
    console.error('[XP Audit Error]', error);
    return {
      error: error.message
    };
  }
};

// ============================================================================
// NAMED EXPORTS (for direct imports)
// ============================================================================

export {
  // Core functions
  awardXP,
  awardReadingXP,
  awardBadgeXP,
  awardFamilyBattleXP,
  
  // Validation functions
  getXPHistory,
  calculateXPFromHistory,
  validateTotalXP,
  reconcileXP,
  
  // Utility functions
  getWeeklyXP,
  getXPAuditReport,
  
  // Constants (these are already exported above, but including for clarity)
  XP_TYPES,
  XP_VALUES
};

// ============================================================================
// DEFAULT EXPORT (for backward compatibility)
// ============================================================================

export default {
  // Core functions
  awardXP,
  awardReadingXP,
  awardBadgeXP,
  awardFamilyBattleXP,
  
  // Validation functions
  getXPHistory,
  calculateXPFromHistory,
  validateTotalXP,
  reconcileXP,
  
  // Utility functions
  getWeeklyXP,
  getXPAuditReport,
  
  // Constants
  XP_TYPES,
  XP_VALUES
};