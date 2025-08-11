// lib/xp-management.js - Fixed XP Management System with Proper Validation

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
  FAMILY_BATTLE_SYNC: 'family-battle-sync', // Alternative format
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
    // Determine the student path based on available data
    let studentRef;
    let xpHistoryRef;
    
    if (studentData.entityId && studentData.schoolId) {
      // Entity-based school
      studentRef = doc(
        db, 
        `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}`
      );
      xpHistoryRef = collection(
        db,
        `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/xpHistory`
      );
    } else if (studentData.path) {
      // Use provided path
      studentRef = doc(db, studentData.path);
      xpHistoryRef = collection(db, `${studentData.path}/xpHistory`);
    } else {
      throw new Error('Cannot determine student path');
    }

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
      let studentRef;
      if (studentData.entityId && studentData.schoolId) {
        studentRef = doc(
          db, 
          `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}`
        );
      } else if (studentData.path) {
        studentRef = doc(db, studentData.path);
      }
      
      if (studentRef) {
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
      }
    } catch (historyError) {
      console.error('[Family Battle History Update Error]', historyError);
    }
  }
  
  return result;
};

// ============================================================================
// XP VALIDATION & AUDIT FUNCTIONS - FIXED VERSION
// ============================================================================

/**
 * Get complete XP history for a student
 */
const getXPHistory = async (studentData, limitCount = 100) => {
  try {
    let xpHistoryRef;
    
    if (studentData.entityId && studentData.schoolId) {
      xpHistoryRef = collection(
        db,
        `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/xpHistory`
      );
    } else if (studentData.path) {
      xpHistoryRef = collection(db, `${studentData.path}/xpHistory`);
    } else {
      throw new Error('Cannot determine student path for history');
    }
    
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
 * Calculate total XP from history (for validation) - ENHANCED VERSION
 */
const calculateXPFromHistory = async (studentData) => {
  try {
    const history = await getXPHistory(studentData, 10000); // Get all history
    
    // Calculate totals by type
    const breakdown = {
      reading: 0,
      badges: 0,
      familyBattle: 0,
      familyBattleMVP: 0,
      manual: 0,
      other: 0
    };
    
    let totalFromHistory = 0;
    
    history.forEach(entry => {
      const amount = entry.amount || 0;
      totalFromHistory += amount;
      
      // Categorize by type (handle various formats)
      const type = entry.type?.toLowerCase() || '';
      
      if (type.includes('reading')) {
        breakdown.reading += amount;
      } else if (type.includes('badge')) {
        breakdown.badges += amount;
      } else if (type === 'family_battle_mvp' || type === 'family-battle-mvp') {
        breakdown.familyBattleMVP += amount;
      } else if (type.includes('family') && type.includes('battle')) {
        breakdown.familyBattle += amount;
      } else if (type.includes('manual') || type.includes('adjustment')) {
        breakdown.manual += amount;
      } else {
        breakdown.other += amount;
      }
    });
    
    return {
      calculatedTotal: totalFromHistory,
      historyCount: history.length,
      breakdown: breakdown,
      history: history // Include raw history for debugging
    };
    
  } catch (error) {
    console.error('[XP Calculation Error]', error);
    return null;
  }
};

/**
 * FIXED: Validate student's total XP against all sources
 * This version properly checks xpHistory as the primary source of truth
 */
const validateTotalXP = async (studentData) => {
  try {
    const validation = {
      sources: {},
      discrepancies: [],
      isValid: false
    };
    
    // Get XP from history (this is the source of truth)
    const historyData = await calculateXPFromHistory(studentData);
    
    if (historyData) {
      validation.sources = {
        reading: historyData.breakdown.reading,
        badges: historyData.breakdown.badges,
        familyBattle: historyData.breakdown.familyBattle + historyData.breakdown.familyBattleMVP,
        manual: historyData.breakdown.manual,
        other: historyData.breakdown.other,
        fromHistory: historyData.calculatedTotal
      };
      
      validation.calculatedTotal = historyData.calculatedTotal;
      validation.historyBreakdown = historyData.breakdown;
      validation.historyCount = historyData.historyCount;
    } else {
      // Fallback: Try to calculate from other sources
      let calculatedXP = 0;
      
      // 1. Calculate from reading sessions
      try {
        let sessionsRef;
        if (studentData.entityId && studentData.schoolId) {
          sessionsRef = collection(
            db, 
            `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/readingSessions`
          );
        } else if (studentData.path) {
          sessionsRef = collection(db, `${studentData.path}/readingSessions`);
        }
        
        if (sessionsRef) {
          const sessionsSnapshot = await getDocs(sessionsRef);
          let readingXP = 0;
          
          sessionsSnapshot.forEach(doc => {
            const session = doc.data();
            const sessionXP = session.xpEarned || session.duration || 0;
            readingXP += sessionXP;
          });
          
          validation.sources.reading = readingXP;
          calculatedXP += readingXP;
        }
      } catch (error) {
        console.log('Error calculating reading XP:', error);
      }
      
      // 2. Calculate from badges
      let badgeXP = 0;
      for (let week = 1; week <= 52; week++) {
        if (studentData[`badgeEarnedWeek${week}`]) {
          const badge = BADGE_CALENDAR[week];
          if (badge) {
            badgeXP += badge.xp;
          }
        }
      }
      validation.sources.badges = badgeXP;
      calculatedXP += badgeXP;
      
      validation.calculatedTotal = calculatedXP;
    }
    
    // Compare with stored total
    validation.storedTotal = studentData.totalXP || 0;
    validation.difference = validation.storedTotal - validation.calculatedTotal;
    
    // Consider valid if difference is less than 1 XP (rounding tolerance)
    validation.isValid = Math.abs(validation.difference) < 1;
    
    // Add warnings for large discrepancies
    if (Math.abs(validation.difference) > 50) {
      validation.discrepancies.push(`Large XP discrepancy detected: ${validation.difference} XP difference`);
    }
    
    // Check if history exists
    if (!historyData || historyData.historyCount === 0) {
      validation.discrepancies.push('No XP history found - unable to fully validate');
    }
    
    // Log validation results
    console.log('[XP Validation Results]', {
      studentId: studentData.id,
      stored: validation.storedTotal,
      calculated: validation.calculatedTotal,
      difference: validation.difference,
      isValid: validation.isValid,
      breakdown: validation.sources
    });
    
    return validation;
    
  } catch (error) {
    console.error('[XP Validation Error]', error);
    return {
      error: error.message,
      isValid: false,
      storedTotal: studentData.totalXP || 0,
      calculatedTotal: 0,
      difference: 0
    };
  }
};

/**
 * Fix XP discrepancies (admin function) - FIXED VERSION
 */
const reconcileXP = async (studentData, useHistoryTotal = true) => {
  try {
    const validation = await validateTotalXP(studentData);
    
    if (validation.isValid) {
      return {
        success: true,
        message: 'No discrepancy found',
        validation
      };
    }
    
    // Always prefer history total as it's the source of truth
    let correctTotal = validation.sources?.fromHistory || validation.calculatedTotal;
    
    if (!useHistoryTotal && validation.calculatedTotal) {
      correctTotal = validation.calculatedTotal;
    }
    
    // Determine student path
    let studentRef;
    let xpHistoryRef;
    
    if (studentData.entityId && studentData.schoolId) {
      studentRef = doc(
        db, 
        `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}`
      );
      xpHistoryRef = collection(
        db,
        `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/xpHistory`
      );
    } else if (studentData.path) {
      studentRef = doc(db, studentData.path);
      xpHistoryRef = collection(db, `${studentData.path}/xpHistory`);
    } else {
      throw new Error('Cannot determine student path');
    }
    
    // Update the student's total XP
    await runTransaction(db, async (transaction) => {
      transaction.update(studentRef, {
        totalXP: correctTotal,
        lastXPReconciliation: serverTimestamp(),
        xpReconciliationNote: `Reconciled from ${validation.storedTotal} to ${correctTotal} (diff: ${correctTotal - validation.storedTotal})`
      });
    });
    
    // Add reconciliation entry to history
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
      newTotal: correctTotal,
      academicYear: studentData.academicYear || '2025-26'
    });
    
    return {
      success: true,
      message: 'XP reconciled successfully',
      previousTotal: validation.storedTotal,
      newTotal: correctTotal,
      difference: correctTotal - validation.storedTotal,
      updatedData: {
        ...studentData,
        totalXP: correctTotal
      }
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
    
    let xpHistoryRef;
    
    if (studentData.entityId && studentData.schoolId) {
      xpHistoryRef = collection(
        db,
        `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/xpHistory`
      );
    } else if (studentData.path) {
      xpHistoryRef = collection(db, `${studentData.path}/xpHistory`);
    } else {
      return 0;
    }
    
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
 * Get XP audit report for debugging - ENHANCED VERSION
 */
const getXPAuditReport = async (studentData) => {
  try {
    const validation = await validateTotalXP(studentData);
    const history = await getXPHistory(studentData, 50);
    const weeklyXP = await getWeeklyXP(studentData);
    
    const report = {
      studentId: studentData.id,
      currentTotal: studentData.totalXP || 0,
      
      // Core validation
      stored: validation.storedTotal,
      calculated: validation.calculatedTotal || 0,
      difference: validation.difference || 0,
      
      // Breakdown by source
      breakdown: {
        reading: validation.sources?.reading || 0,
        badges: validation.sources?.badges || 0,
        battles: validation.sources?.familyBattle || 0,
        manual: validation.sources?.manual || 0,
        other: validation.sources?.other || 0,
        fromHistory: validation.sources?.fromHistory || 0,
        
        // Add detailed badge info if available
        badgeDetails: []
      },
      
      // Weekly stats
      weeklyXP: weeklyXP,
      
      // Recent history
      xpHistory: history.slice(0, 10).map(h => ({
        timestamp: h.timestamp,
        type: h.type,
        amount: h.amount,
        description: h.details?.description || 'No description'
      })),
      
      // Validation flags
      flags: {
        hasHistory: history.length > 0,
        hasDiscrepancy: !validation.isValid,
        discrepancyAmount: validation.difference || 0
      },
      
      // Full validation object for debugging
      validation: validation
    };
    
    // Add badge details
    for (let week = 1; week <= 52; week++) {
      if (studentData[`badgeEarnedWeek${week}`]) {
        const badge = BADGE_CALENDAR[week];
        if (badge) {
          report.breakdown.badgeDetails.push({
            week: week,
            name: badge.name,
            xp: badge.xp
          });
        }
      }
    }
    
    return report;
    
  } catch (error) {
    console.error('[XP Audit Error]', error);
    return {
      error: error.message,
      studentId: studentData.id,
      currentTotal: studentData.totalXP || 0
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