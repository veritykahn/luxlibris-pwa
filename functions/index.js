const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { format, getWeek, startOfWeek, endOfWeek } = require('date-fns');

admin.initializeApp();
const db = admin.firestore();

// ============================================================================
// HELPER FUNCTIONS FOR CALCULATING FRESH TOTALS
// ============================================================================

/**
 * Get student's reading minutes for the week
 */
const getStudentMinutes = async (student, week) => {
  try {
    const sessionsRef = db.collection(
      `entities/${student.entityId}/schools/${student.schoolId}/students/${student.studentId || student.id}/readingSessions`
    );
    
    const weekQuery = sessionsRef
      .where('date', '>=', week.startDate)
      .where('date', '<=', week.endDate);
    
    const snapshot = await weekQuery.get();
    let total = 0;
    
    snapshot.forEach(doc => {
      const session = doc.data();
      if (session.duration > 0) {
        total += session.duration;
      }
    });
    
    return total;
  } catch (error) {
    console.error(`Error getting minutes for student:`, error);
    return 0;
  }
};

/**
 * Get parent's reading minutes for the week
 */
const getParentMinutes = async (parentId, week) => {
  try {
    const sessionsRef = db.collection(`parents/${parentId}/readingSessions`);
    
    const weekQuery = sessionsRef
      .where('date', '>=', week.startDate)
      .where('date', '<=', week.endDate);
    
    const snapshot = await weekQuery.get();
    let total = 0;
    
    snapshot.forEach(doc => {
      const session = doc.data();
      if (session.duration > 0) {
        total += session.duration;
      }
    });
    
    return total;
  } catch (error) {
    console.error(`Error getting minutes for parent ${parentId}:`, error);
    return 0;
  }
};

/**
 * Calculate week totals for both teams from actual reading sessions
 */
const calculateWeekTotals = async (familyData, week) => {
  // Get children's minutes
  const linkedStudents = familyData.linkedStudents || [];
  const studentBreakdown = {};
  let childrenTotal = 0;
  
  for (const student of linkedStudents) {
    const minutes = await getStudentMinutes(student, week);
    studentBreakdown[student.studentId || student.id] = {
      name: student.studentName || student.firstName || 'Student',
      minutes,
      entityId: student.entityId,
      schoolId: student.schoolId
    };
    childrenTotal += minutes;
  }
  
  // Get parents' minutes
  const linkedParents = familyData.linkedParents || [];
  const parentBreakdown = {};
  let parentsTotal = 0;
  
  for (const parentId of linkedParents) {
    const minutes = await getParentMinutes(parentId, week);
    
    // Get parent's name
let parentName = 'Parent';
try {
  console.log(`🔍 Fetching name for parent: ${parentId}`);
  const parentDoc = await db.doc(`parents/${parentId}`).get();
  
  if (parentDoc.exists()) {
    const data = parentDoc.data();
    console.log(`📋 Parent data:`, data);
    const firstName = data.firstName || '';
    const lastName = data.lastName || '';
    parentName = `${firstName} ${lastName}`.trim() || data.displayName || data.name || 'Parent';
    console.log(`✅ Parent name resolved to: ${parentName}`);
  } else {
    console.log(`❌ Parent document not found: ${parentId}`);
  }
} catch (e) {
  console.error('❌ Error getting parent name:', e);
}
    
    parentBreakdown[parentId] = {
      name: parentName,
      minutes
    };
    parentsTotal += minutes;
  }
  
  return {
    children: {
      total: childrenTotal,
      breakdown: studentBreakdown
    },
    parents: {
      total: parentsTotal,
      breakdown: parentBreakdown
    }
  };
};

// ============================================================================
// RUNS EVERY SATURDAY AT 11:59 PM (CHANGED FROM SUNDAY)
// ============================================================================
exports.completeFamilyBattleWeeks = functions.pubsub
  .schedule('59 23 * * 6') // Saturday 11:59 PM (CHANGED from Sunday)
  .timeZone('America/Chicago') // CHANGE THIS TO YOUR TIMEZONE
  .onRun(async (context) => {
    console.log('🏁 Starting weekly family battle completion (Saturday night)...');
    
    try {
      // Get all families with active battles
      const familiesSnapshot = await db.collection('families')
        .where('familyBattle.enabled', '==', true)
        .get();
      
      console.log(`Found ${familiesSnapshot.size} families with battles enabled`);
      
      const batch = db.batch();
      let completedCount = 0;
      
      for (const familyDoc of familiesSnapshot.docs) {
        const familyData = familyDoc.data();
        const currentWeek = familyData.familyBattle?.currentWeek;
        
        // Skip if no current week or already completed
        if (!currentWeek || currentWeek.completed) {
          continue;
        }
        
        // CALCULATE FRESH TOTALS FROM ACTUAL READING SESSIONS
        console.log(`📊 Calculating fresh totals for family ${familyDoc.id}, week ${currentWeek.number}`);
        const freshTotals = await calculateWeekTotals(familyData, {
          startDate: currentWeek.startDate,
          endDate: currentWeek.endDate
        });
        
        const parentTotal = freshTotals.parents.total;
        const childrenTotal = freshTotals.children.total;
        
        console.log(`Fresh totals - Kids: ${childrenTotal}, Parents: ${parentTotal}`);
        
        // Determine winner based on FRESH TOTALS
        let winner = 'tie';
        let margin = 0;
        
        if (parentTotal > childrenTotal) {
          winner = 'parents';
          margin = parentTotal - childrenTotal;
        } else if (childrenTotal > parentTotal) {
          winner = 'children';
          margin = childrenTotal - parentTotal;
        }
        
        // Create completed week object with BOTH STRUCTURES for compatibility
        const completedWeek = {
          // NEW NESTED STRUCTURE (for client compatibility)
          children: freshTotals.children,
          parents: freshTotals.parents,
          // OLD FLAT STRUCTURE (for backward compatibility)
          childrenMinutes: childrenTotal,
          parentMinutes: parentTotal,
          studentBreakdown: freshTotals.children.breakdown,
          parentBreakdown: freshTotals.parents.breakdown,
          // COMMON FIELDS
          number: currentWeek.number,
          week: currentWeek.number,
          weekNumber: currentWeek.number,
          startDate: currentWeek.startDate,
          endDate: currentWeek.endDate,
          completed: true,
          completedAt: new Date().toISOString(),
          winner: winner,
          margin: margin,
          isResultsDay: false, // Will be true when viewed on Sunday
          finalStatus: winner === 'children' ? 
            `🏆 Kids won by ${margin} minutes!` :
            winner === 'parents' ? 
            `👑 Parents won by ${margin} minutes!` :
            '🤝 It was a tie!'
        };
        
        // Update family document
        const familyRef = db.collection('families').doc(familyDoc.id);
        
        // Get current history
        const currentHistory = familyData.familyBattleHistory || {
          battles: 0,
          childrenWins: 0,
          parentWins: 0,
          ties: 0,
          childrenTrophies: 0,
          parentTrophies: 0
        };
        
        // Update stats for familyBattleHistory (legacy)
        const updatedHistory = {
          battles: currentHistory.battles + 1,
          childrenWins: winner === 'children' ? currentHistory.childrenWins + 1 : currentHistory.childrenWins,
          parentWins: winner === 'parents' ? currentHistory.parentWins + 1 : currentHistory.parentWins,
          ties: winner === 'tie' ? (currentHistory.ties || 0) + 1 : currentHistory.ties || 0,
          childrenTrophies: winner === 'children' ? currentHistory.childrenTrophies + 1 : currentHistory.childrenTrophies,
          parentTrophies: winner === 'parents' ? currentHistory.parentTrophies + 1 : currentHistory.parentTrophies,
          lastBattle: completedWeek
        };
        
        // Update stats for familyBattle.history (new structure)
        const currentBattleHistory = familyData.familyBattle?.history || {
          totalBattles: 0,
          childrenWins: 0,
          parentWins: 0,
          ties: 0,
          currentStreak: { team: null, count: 0 },
          recentBattles: [],
          xpAwarded: {}
        };
        
        const updatedBattleHistory = {
          totalBattles: currentBattleHistory.totalBattles + 1,
          childrenWins: winner === 'children' ? currentBattleHistory.childrenWins + 1 : currentBattleHistory.childrenWins,
          parentWins: winner === 'parents' ? currentBattleHistory.parentWins + 1 : currentBattleHistory.parentWins,
          ties: winner === 'tie' ? (currentBattleHistory.ties || 0) + 1 : currentBattleHistory.ties || 0,
          currentStreak: winner === 'tie' ? 
            { team: null, count: 0 } :
            (!currentBattleHistory.currentStreak || currentBattleHistory.currentStreak.team !== winner) ?
            { team: winner, count: 1 } :
            { team: winner, count: currentBattleHistory.currentStreak.count + 1 },
          recentBattles: [
            {
              weekNumber: currentWeek.number,
              winner: winner,
              margin: margin,
              childrenTotal: childrenTotal,
              parentsTotal: parentTotal,
              startDate: currentWeek.startDate,
              endDate: currentWeek.endDate,
              timestamp: new Date().toISOString()
            },
            ...(currentBattleHistory.recentBattles || [])
          ].slice(0, 10), // Keep last 10 battles
          xpAwarded: currentBattleHistory.xpAwarded || {}
        };
        
        // Add to week history
        const weekHistory = familyData.familyBattle?.weekHistory || [];
        weekHistory.push(completedWeek);
        
        // Keep only last 52 weeks
        if (weekHistory.length > 52) {
          weekHistory.shift();
        }
        
        batch.update(familyRef, {
          'familyBattle.currentWeek': null, // Clear current week
          'familyBattle.lastCompletedWeek': completedWeek, // Store completed week
          'familyBattle.weekHistory': weekHistory,
          'familyBattle.history': updatedBattleHistory, // New structure
          'familyBattleHistory': updatedHistory // Legacy structure
        });
        
        // AWARD XP IF CHILDREN WON
        if (winner === 'children' && familyData.linkedStudents) {
          await awardXPToWinningChildren(
            familyData.linkedStudents,
            freshTotals.children.breakdown,
            currentWeek.number
          );
        }
        
        completedCount++;
        
        console.log(`✅ Completed battle for family ${familyDoc.id}: ${winner} won by ${margin} minutes (Kids: ${childrenTotal}, Parents: ${parentTotal})`);
      }
      
      await batch.commit();
      console.log(`🎉 Completed ${completedCount} family battles on Saturday night`);
      
    } catch (error) {
      console.error('❌ Error completing family battles:', error);
    }
    
    return null;
  });

// ============================================================================
// RUNS EVERY MONDAY AT 12:00 AM
// ============================================================================
exports.startFamilyBattleWeeks = functions.pubsub
  .schedule('0 0 * * 1') // Monday 12:00 AM
  .timeZone('America/Chicago') // CHANGE THIS TO YOUR TIMEZONE
  .onRun(async (context) => {
    console.log('🚀 Starting new family battle weeks...');
    
    try {
      // Get all families with battles enabled
      const familiesSnapshot = await db.collection('families')
        .where('familyBattle.enabled', '==', true)
        .get();
      
      console.log(`Found ${familiesSnapshot.size} families with battles enabled`);
      
      const batch = db.batch();
      let startedCount = 0;
      let forcedCompleteCount = 0;
      
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
// Calculate week number from June 1st (start of academic year)
const academicYearStart = new Date(now.getFullYear(), 5, 1); // June 1
if (now.getMonth() < 5) { // If before June, use previous year's June
  academicYearStart.setFullYear(now.getFullYear() - 1);
}
const daysSinceStart = Math.floor((weekStart - academicYearStart) / (1000 * 60 * 60 * 24));
const weekNumber = Math.floor(daysSinceStart / 7) + 1;      
      for (const familyDoc of familiesSnapshot.docs) {
        const familyData = familyDoc.data();
        
        // ERROR RECOVERY: Check if there's an expired week that wasn't completed
        if (familyData.familyBattle?.currentWeek && !familyData.familyBattle.currentWeek.completed) {
          const endDate = new Date(familyData.familyBattle.currentWeek.endDate);
          endDate.setHours(23, 59, 59, 999); // Set to end of day
          
          if (now > endDate) {
            // Force complete the expired week with FRESH TOTALS
            console.log(`⚠️ Forcing completion of expired week for family ${familyDoc.id}`);
            
            const currentWeek = familyData.familyBattle.currentWeek;
            
            // Calculate fresh totals instead of using stale data
            const freshTotals = await calculateWeekTotals(familyData, {
              startDate: currentWeek.startDate,
              endDate: currentWeek.endDate
            });
            
            const parentTotal = freshTotals.parents.total;
            const childrenTotal = freshTotals.children.total;
            
            let winner = 'tie';
            let margin = 0;
            
            if (parentTotal > childrenTotal) {
              winner = 'parents';
              margin = parentTotal - childrenTotal;
            } else if (childrenTotal > parentTotal) {
              winner = 'children';
              margin = childrenTotal - parentTotal;
            }
            
            // Create completed week object with fresh data and BOTH structures
            const completedWeek = {
              // NEW NESTED STRUCTURE
              children: freshTotals.children,
              parents: freshTotals.parents,
              // OLD FLAT STRUCTURE
              childrenMinutes: childrenTotal,
              parentMinutes: parentTotal,
              studentBreakdown: freshTotals.children.breakdown,
              parentBreakdown: freshTotals.parents.breakdown,
              // COMMON FIELDS
              number: currentWeek.number,
              week: currentWeek.number,
              weekNumber: currentWeek.number,
              startDate: currentWeek.startDate,
              endDate: currentWeek.endDate,
              completed: true,
              completedAt: new Date().toISOString(),
              winner: winner,
              margin: margin,
              forcedCompletion: true // Mark as forced completion
            };
            
            // Update week history
            const weekHistory = familyData.familyBattle?.weekHistory || [];
            weekHistory.push(completedWeek);
            
            // Keep only last 52 weeks
            if (weekHistory.length > 52) {
              weekHistory.shift();
            }
            
            // Update history stats (both structures)
            const currentHistory = familyData.familyBattleHistory || {
              battles: 0,
              childrenWins: 0,
              parentWins: 0,
              ties: 0,
              childrenTrophies: 0,
              parentTrophies: 0
            };
            
            const updatedHistory = {
              battles: currentHistory.battles + 1,
              childrenWins: winner === 'children' ? currentHistory.childrenWins + 1 : currentHistory.childrenWins,
              parentWins: winner === 'parents' ? currentHistory.parentWins + 1 : currentHistory.parentWins,
              ties: winner === 'tie' ? (currentHistory.ties || 0) + 1 : currentHistory.ties || 0,
              childrenTrophies: winner === 'children' ? currentHistory.childrenTrophies + 1 : currentHistory.childrenTrophies,
              parentTrophies: winner === 'parents' ? currentHistory.parentTrophies + 1 : currentHistory.parentTrophies,
              lastBattle: completedWeek
            };
            
            // Clear current week and update history
            batch.update(db.collection('families').doc(familyDoc.id), {
              'familyBattle.currentWeek': null,
              'familyBattle.lastCompletedWeek': completedWeek,
              'familyBattle.weekHistory': weekHistory,
              'familyBattleHistory': updatedHistory
            });
            
            // Award XP if children won
            if (winner === 'children' && familyData.linkedStudents) {
              await awardXPToWinningChildren(
                familyData.linkedStudents,
                freshTotals.children.breakdown,
                currentWeek.number
              );
            }
            
            forcedCompleteCount++;
          } else {
            // Week is still active, skip starting a new one
            console.log(`⏭️ Family ${familyDoc.id} already has active week`);
            continue;
          }
        }
        
        // Create new week (Saturday end date since completion happens Saturday night)
        const saturday = new Date(weekStart);
        saturday.setDate(saturday.getDate() + 5); // Saturday
        
        const newWeek = {
          number: weekNumber,
          startDate: format(weekStart, 'yyyy-MM-dd'), // Monday
          endDate: format(saturday, 'yyyy-MM-dd'), // Saturday
          children: { total: 0, breakdown: {} },
          parents: { total: 0, breakdown: {} },
          completed: false,
          leader: 'tie',
          margin: 0,
          status: 'New week! The battle begins!',
          startedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        const familyRef = db.collection('families').doc(familyDoc.id);
        batch.update(familyRef, {
          'familyBattle.currentWeek': newWeek
        });
        
        startedCount++;
        console.log(`✅ Started week ${weekNumber} for family ${familyDoc.id} (Monday-Saturday)`);
      }
      
      await batch.commit();
      console.log(`🎉 Started ${startedCount} new family battle weeks`);
      if (forcedCompleteCount > 0) {
        console.log(`⚠️ Force completed ${forcedCompleteCount} expired weeks`);
      }
      
    } catch (error) {
      console.error('❌ Error starting new weeks:', error);
    }
    
    return null;
  });

// ============================================================================
// HELPER FUNCTION: Award XP to winning children
// ============================================================================
async function awardXPToWinningChildren(linkedStudents, childrenBreakdown, weekNumber) {
  try {
    // Find MVP (child with most minutes)
    let mvpStudentId = null;
    let maxMinutes = 0;
    
    Object.entries(childrenBreakdown).forEach(([studentId, data]) => {
      if (data.minutes > maxMinutes) {
        maxMinutes = data.minutes;
        mvpStudentId = studentId;
      }
    });
    
    // Award XP to each child
    for (const student of linkedStudents) {
      const studentId = typeof student === 'string' ? student : student.studentId;
      const entityId = student.entityId;
      const schoolId = student.schoolId;
      
      if (!entityId || !schoolId) {
        console.log(`⚠️ Missing entity/school for student ${studentId}`);
        continue;
      }
      
      try {
        const isMVP = studentId === mvpStudentId;
        const xpAmount = isMVP ? 50 : 25; // 25 base + 25 MVP bonus
        
        const studentRef = db.doc(
          `entities/${entityId}/schools/${schoolId}/students/${studentId}`
        );
        
        // Build update object dynamically
        const updateData = {
          totalXP: admin.firestore.FieldValue.increment(xpAmount),
          [`familyBattleWeek${weekNumber}XPAwarded`]: true,
          lastFamilyBattleXP: xpAmount,
          lastXPUpdate: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Only add MVP field if they ARE the MVP
        if (isMVP) {
          updateData[`familyBattleWeek${weekNumber}MVP`] = true;
        }
        
        // Update student's XP
        await studentRef.update(updateData);
        
        // Add to XP history
        const xpHistoryRef = studentRef.collection('xpHistory');
        await xpHistoryRef.add({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          type: isMVP ? 'family_battle_mvp' : 'family_battle',
          amount: xpAmount,
          details: {
            source: 'cloud_function_auto_complete',
            weekNumber: weekNumber,
            isMVP: isMVP,
            description: `Family battle victory Week ${weekNumber}${isMVP ? ' (MVP)' : ''}`
          },
          academicYear: '2025-26'
        });
        
        console.log(`✅ Awarded ${xpAmount} XP to student ${studentId}${isMVP ? ' (MVP)' : ''}`);
        
      } catch (studentError) {
        console.error(`❌ Error awarding XP to student ${studentId}:`, studentError);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in awardXPToWinningChildren:', error);
  }
}

// ============================================================================
// MANUAL TRIGGER (for testing or manual intervention) - WITH SECURITY
// ============================================================================
exports.manualCompleteBattles = functions.https.onRequest(async (req, res) => {
  // SECURITY: Change this token to something secure and unique!
  const SECRET_TOKEN = 'your-secret-token-2025-change-this';
  
  // Check for authentication token
  if (req.query.token !== SECRET_TOKEN) {
    console.warn('⚠️ Unauthorized manual trigger attempt');
    return res.status(403).send('Unauthorized');
  }
  
  console.log('✅ Authorized manual completion trigger');
  await exports.completeFamilyBattleWeeks.run();
  res.send('Battles completed manually');
});

exports.manualStartBattles = functions.https.onRequest(async (req, res) => {
  // SECURITY: Change this token to something secure and unique!
  const SECRET_TOKEN = 'your-secret-token-2025-change-this';
  
  // Check for authentication token
  if (req.query.token !== SECRET_TOKEN) {
    console.warn('⚠️ Unauthorized manual trigger attempt');
    return res.status(403).send('Unauthorized');
  }
  
  console.log('✅ Authorized manual start trigger');
  await exports.startFamilyBattleWeeks.run();
  res.send('New weeks started manually');
});