const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { format, getWeek, startOfWeek, endOfWeek } = require('date-fns');

admin.initializeApp();
const db = admin.firestore();

// ============================================================================
// RUNS EVERY SUNDAY AT 11:59 PM (YOUR TIMEZONE)
// ============================================================================
exports.completeFamilyBattleWeeks = functions.pubsub
  .schedule('59 23 * * 0') // Sunday 11:59 PM
  .timeZone('America/Chicago') // CHANGE THIS TO YOUR TIMEZONE
  .onRun(async (context) => {
    console.log('🏁 Starting weekly family battle completion...');
    
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
        
        // Determine winner
        const parentTotal = currentWeek.parents?.total || 0;
        const childrenTotal = currentWeek.children?.total || 0;
        
        let winner = 'tie';
        let margin = 0;
        
        if (parentTotal > childrenTotal) {
          winner = 'parents';
          margin = parentTotal - childrenTotal;
        } else if (childrenTotal > parentTotal) {
          winner = 'children';
          margin = childrenTotal - parentTotal;
        }
        
        // Create completed week object
        const completedWeek = {
          ...currentWeek,
          completed: true,
          completedAt: new Date().toISOString(),
          winner: winner,
          margin: margin,
          parentMinutes: parentTotal,
          childrenMinutes: childrenTotal
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
        
        // Update stats
        const updatedHistory = {
          battles: currentHistory.battles + 1,
          childrenWins: winner === 'children' ? currentHistory.childrenWins + 1 : currentHistory.childrenWins,
          parentWins: winner === 'parents' ? currentHistory.parentWins + 1 : currentHistory.parentWins,
          ties: winner === 'tie' ? (currentHistory.ties || 0) + 1 : currentHistory.ties || 0,
          childrenTrophies: winner === 'children' ? currentHistory.childrenTrophies + 1 : currentHistory.childrenTrophies,
          parentTrophies: winner === 'parents' ? currentHistory.parentTrophies + 1 : currentHistory.parentTrophies,
          lastBattle: completedWeek
        };
        
        // Add to week history
        const weekHistory = familyData.familyBattle?.weekHistory || [];
        weekHistory.push(completedWeek);
        
        // Keep only last 52 weeks
        if (weekHistory.length > 52) {
          weekHistory.shift();
        }
        
        // BUG FIX #2: Add lastCompletedWeek field
        batch.update(familyRef, {
          'familyBattle.currentWeek': null, // Clear current week
          'familyBattle.lastCompletedWeek': completedWeek, // ✅ ADD THIS LINE
          'familyBattle.weekHistory': weekHistory,
          'familyBattleHistory': updatedHistory
        });
        
        // AWARD XP IF CHILDREN WON
        if (winner === 'children' && familyData.linkedStudents) {
          await awardXPToWinningChildren(
            familyData.linkedStudents,
            currentWeek.children?.breakdown || {},
            currentWeek.week
          );
        }
        
        completedCount++;
        
        console.log(`✅ Completed battle for family ${familyDoc.id}: ${winner} won by ${margin} minutes`);
      }
      
      await batch.commit();
      console.log(`🎉 Completed ${completedCount} family battles`);
      
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
            // Force complete the expired week
            console.log(`⚠️ Forcing completion of expired week for family ${familyDoc.id}`);
            
            const currentWeek = familyData.familyBattle.currentWeek;
            const parentTotal = currentWeek.parents?.total || 0;
            const childrenTotal = currentWeek.children?.total || 0;
            
            let winner = 'tie';
            let margin = 0;
            
            if (parentTotal > childrenTotal) {
              winner = 'parents';
              margin = parentTotal - childrenTotal;
            } else if (childrenTotal > parentTotal) {
              winner = 'children';
              margin = childrenTotal - parentTotal;
            }
            
            // Create completed week object
            const completedWeek = {
              ...currentWeek,
              completed: true,
              completedAt: new Date().toISOString(),
              winner: winner,
              margin: margin,
              parentMinutes: parentTotal,
              childrenMinutes: childrenTotal,
              forcedCompletion: true // Mark as forced completion
            };
            
            // Update week history
            const weekHistory = familyData.familyBattle?.weekHistory || [];
            weekHistory.push(completedWeek);
            
            // Keep only last 52 weeks
            if (weekHistory.length > 52) {
              weekHistory.shift();
            }
            
            // Update history stats
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
                currentWeek.children?.breakdown || {},
                currentWeek.week
              );
            }
            
            forcedCompleteCount++;
          } else {
            // Week is still active, skip starting a new one
            console.log(`⏭️ Family ${familyDoc.id} already has active week`);
            continue;
          }
        }
        
        // Create new week
        const newWeek = {
          week: weekNumber,
          startDate: format(weekStart, 'yyyy-MM-dd'),
          endDate: format(weekEnd, 'yyyy-MM-dd'),
          parents: { total: 0, breakdown: {} },
          children: { total: 0, breakdown: {} },
          completed: false,
          startedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        const familyRef = db.collection('families').doc(familyDoc.id);
        batch.update(familyRef, {
          'familyBattle.currentWeek': newWeek
        });
        
        startedCount++;
        console.log(`✅ Started week ${weekNumber} for family ${familyDoc.id}`);
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
// HELPER FUNCTION: Award XP to winning children (BUG FIX #1 APPLIED)
// ============================================================================
async function awardXPToWinningChildren(linkedStudents, childrenBreakdown, weekNumber) {
  try {
    // Find MVP (child with most minutes)
    let mvpStudentId = null;
    let maxMinutes = 0;
    
    Object.entries(childrenBreakdown).forEach(([studentId, minutes]) => {
      if (minutes > maxMinutes) {
        maxMinutes = minutes;
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
        
        // BUG FIX #1: Build update object dynamically
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
// Usage: https://your-project.cloudfunctions.net/manualCompleteBattles?token=your-secret-token-2025-change-this
// Usage: https://your-project.cloudfunctions.net/manualStartBattles?token=your-secret-token-2025-change-this
// 
// IMPORTANT: Change the SECRET_TOKEN to something secure before deploying!
// Consider using Firebase environment config for production:
// functions.config().familybattle.secret_token
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