// pages/god-mode/migrate-streaks.js
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Head from 'next/head';
import GodModeAuth from '../../components/god-mode/GodModeAuth';
import GodModeHeader from '../../components/god-mode/GodModeHeader';

export default function MigrateStreaks() {
  // Test student from reading-session-tester
  const TEST_STUDENT = {
    entityId: 'VG6SZ6Ry2MSJcNpapSsO',
    schoolId: 'lXFVkgIsAB2PEjtBDzR3',
    studentId: 'bnvDEPXEQvXCweIsM8ZZ',
    displayUsername: 'KeanuK5KAHN'
  };

  const [testLoading, setTestLoading] = useState(false);
  const [fullLoading, setFullLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [fullResults, setFullResults] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  const getLocalDateString = (date = new Date()) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const calculateSmartStreak = (completedSessionsByDate, todayStr) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);
    
    let streakCount = 0;
    let checkDate;
    
    if (completedSessionsByDate[todayStr]) {
      checkDate = new Date(today);
    } else if (completedSessionsByDate[yesterdayStr]) {
      checkDate = new Date(yesterday);
    } else {
      return 0;
    }
    
    while (streakCount < 1000) {
      const dateStr = getLocalDateString(checkDate);
      if (completedSessionsByDate[dateStr]) {
        streakCount++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streakCount;
  };

  const migrateOneStudent = async (entityId, schoolId, studentId, studentName = 'Student') => {
    const studentPath = `entities/${entityId}/schools/${schoolId}/students/${studentId}`;
    
    // Get current student data
    const studentRef = doc(db, studentPath);
    const studentSnap = await getDoc(studentRef);
    
    if (!studentSnap.exists()) {
      throw new Error('Student not found');
    }
    
    const currentData = studentSnap.data();
    
    // Get all reading sessions
    const sessionsRef = collection(db, `${studentPath}/readingSessions`);
    const allSessionsSnapshot = await getDocs(sessionsRef);
    
    const completedDates = {};
    const allReadingDates = new Set();
    
    allSessionsSnapshot.forEach(sessionDoc => {
      const session = sessionDoc.data();
      allReadingDates.add(session.date);
      if (session.completed === true) {
        completedDates[session.date] = true;
      }
    });
    
    const sortedCompletedDates = Object.keys(completedDates).sort();
    
    if (sortedCompletedDates.length === 0) {
      await updateDoc(studentRef, {
        currentStreak: 0,
        lastReadingDate: null,
        longestStreak: 0,
        totalDaysRead: allReadingDates.size,
        totalReadingDays: allReadingDates.size
      });
      
      return {
        studentId,
        studentName,
        before: currentData,
        after: {
          currentStreak: 0,
          longestStreak: 0,
          totalDaysRead: allReadingDates.size,
          totalReadingDays: allReadingDates.size,
          lastReadingDate: null
        },
        sessionCount: allSessionsSnapshot.size,
        completedCount: 0
      };
    }
    
    // Calculate current streak
    const today = getLocalDateString(new Date());
    const currentStreak = calculateSmartStreak(completedDates, today);
    
    // Find longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;
    
    for (const dateStr of sortedCompletedDates) {
      if (!lastDate) {
        tempStreak = 1;
      } else {
        const currentDate = new Date(dateStr);
        const previousDate = new Date(lastDate);
        const daysDiff = Math.round((currentDate - previousDate) / 86400000);
        
        if (daysDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      lastDate = dateStr;
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    
    const lastReadingDate = sortedCompletedDates[sortedCompletedDates.length - 1];
    
    // Update student document
    await updateDoc(studentRef, {
      currentStreak: currentStreak,
      lastReadingDate: lastReadingDate,
      longestStreak: longestStreak,
      totalDaysRead: allReadingDates.size,
      totalReadingDays: allReadingDates.size
    });
    
    return {
      studentId,
      studentName,
      before: currentData,
      after: {
        currentStreak,
        longestStreak,
        totalDaysRead: allReadingDates.size,
        totalReadingDays: allReadingDates.size,
        lastReadingDate
      },
      sessionCount: allSessionsSnapshot.size,
      completedCount: sortedCompletedDates.length
    };
  };

  const testSingleStudent = async () => {
    setTestLoading(true);
    setTestResults(null);
    setLogs([]);
    
    try {
      addLog(`Testing migration on ${TEST_STUDENT.displayUsername}...`, 'info');
      
      const result = await migrateOneStudent(
        TEST_STUDENT.entityId,
        TEST_STUDENT.schoolId,
        TEST_STUDENT.studentId,
        TEST_STUDENT.displayUsername
      );
      
      addLog(`Found ${result.sessionCount} total sessions`, 'info');
      addLog(`Found ${result.completedCount} completed sessions`, 'info');
      addLog(`Updated currentStreak: ${result.after.currentStreak}`, 'success');
      addLog(`Updated longestStreak: ${result.after.longestStreak}`, 'success');
      addLog(`Updated totalReadingDays: ${result.after.totalReadingDays}`, 'success');
      
      setTestResults(result);
      
    } catch (error) {
      console.error('Test error:', error);
      addLog(`Error: ${error.message}`, 'error');
    } finally {
      setTestLoading(false);
    }
  };

  const runFullMigration = async () => {
    if (!confirm('⚠️ This will migrate ALL students across ALL entities. Continue?')) {
      return;
    }

    setFullLoading(true);
    setFullResults(null);
    setLogs([]);

    try {
      addLog('Starting full migration...', 'info');
      
      const stats = {
        totalStudentsProcessed: 0,
        totalStudentsUpdated: 0,
        totalStudentsSkipped: 0,
        errors: []
      };

      // Get all entities
      const entitiesSnapshot = await getDocs(collection(db, 'entities'));
      addLog(`Found ${entitiesSnapshot.size} entities`, 'info');

      for (const entityDoc of entitiesSnapshot.docs) {
        const entityId = entityDoc.id;
        addLog(`Processing entity: ${entityId}`, 'info');

        // Get all schools
        const schoolsSnapshot = await getDocs(
          collection(db, `entities/${entityId}/schools`)
        );

        for (const schoolDoc of schoolsSnapshot.docs) {
          const schoolId = schoolDoc.id;
          addLog(`  Processing school: ${schoolId}`, 'info');

          // Get all students
          const studentsSnapshot = await getDocs(
            collection(db, `entities/${entityId}/schools/${schoolId}/students`)
          );
          
          addLog(`    Found ${studentsSnapshot.size} students`, 'info');

          for (const studentDoc of studentsSnapshot.docs) {
            const studentId = studentDoc.id;
            const studentData = studentDoc.data();
            stats.totalStudentsProcessed++;

            try {
              const result = await migrateOneStudent(
                entityId,
                schoolId,
                studentId,
                studentData.displayUsername || studentData.authEmail || 'Unknown'
              );
              
              stats.totalStudentsUpdated++;
              
              if (stats.totalStudentsUpdated % 10 === 0) {
                addLog(`    Progress: ${stats.totalStudentsUpdated} students updated...`, 'info');
              }
              
            } catch (studentErr) {
              console.error(`Error processing student ${studentId}:`, studentErr);
              stats.errors.push({
                studentId,
                schoolId,
                entityId,
                error: studentErr.message
              });
            }
          }
        }
      }

      addLog('Migration complete!', 'success');
      addLog(`Total processed: ${stats.totalStudentsProcessed}`, 'success');
      addLog(`Total updated: ${stats.totalStudentsUpdated}`, 'success');
      if (stats.errors.length > 0) {
        addLog(`Errors: ${stats.errors.length}`, 'error');
      }
      
      setFullResults(stats);

    } catch (error) {
      console.error('Migration error:', error);
      addLog(`Migration failed: ${error.message}`, 'error');
    } finally {
      setFullLoading(false);
    }
  };

  return (
    <GodModeAuth>
      {(authState) => {
        const { sessionTimeRemaining, handleLogout } = authState;
        return (
          <>
            <Head>
              <title>Streak Migration - God Mode</title>
            </Head>

            <div style={{
              minHeight: '100vh',
              background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              <GodModeHeader
                title="Streak Migration Tool"
                icon="🔥"
                sessionTimeRemaining={sessionTimeRemaining}
                onLogout={handleLogout}
                showDashboardButton={true}
                showManagerButton={true}
              />

              <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                padding: '2rem 1.5rem'
              }}>
                {/* Warning Banner */}
                <div style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '2px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '30px'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</div>
                  <strong style={{ color: '#fbbf24', fontSize: '18px', display: 'block', marginBottom: '8px' }}>
                    Streak Migration Tool
                  </strong>
                  <p style={{ color: '#fcd34d', margin: 0, fontSize: '14px' }}>
                    Calculates and updates currentStreak, longestStreak, totalDaysRead, and totalReadingDays for students based on their reading sessions.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                  {/* Left Column - Actions */}
                  <div>
                    {/* Step 1: Test Single Student */}
                    <div style={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      padding: '25px',
                      marginBottom: '25px',
                      border: '1px solid #334155'
                    }}>
                      <h2 style={{ color: '#e2e8f0', fontSize: '20px', marginBottom: '15px' }}>
                        🧪 Step 1: Test on {TEST_STUDENT.displayUsername}
                      </h2>
                      <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '15px' }}>
                        Test the migration on Keanu from the reading session tester first
                      </p>

                      <div style={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '15px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        color: '#94a3b8'
                      }}>
                        <div><strong style={{ color: '#e2e8f0' }}>Student ID:</strong> {TEST_STUDENT.studentId}</div>
                        <div><strong style={{ color: '#e2e8f0' }}>School ID:</strong> {TEST_STUDENT.schoolId}</div>
                      </div>

                      <button
                        onClick={testSingleStudent}
                        disabled={testLoading}
                        style={{
                          width: '100%',
                          padding: '14px',
                          backgroundColor: testLoading ? '#6b7280' : '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          cursor: testLoading ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {testLoading ? '⏳ Testing...' : '🧪 Test Migration'}
                      </button>
                    </div>

                    {/* Test Results */}
                    {testResults && (
                      <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        padding: '25px',
                        marginBottom: '25px',
                        border: '2px solid #10b981'
                      }}>
                        <h3 style={{ color: '#10b981', fontSize: '18px', marginBottom: '15px' }}>
                          ✅ Test Results
                        </h3>

                        <div style={{
                          backgroundColor: '#0f172a',
                          borderRadius: '8px',
                          padding: '15px',
                          marginBottom: '15px'
                        }}>
                          <strong style={{ color: '#e2e8f0', fontSize: '14px' }}>Before:</strong>
                          <div style={{ marginTop: '8px', fontSize: '13px', color: '#94a3b8' }}>
                            <div>Current Streak: {testResults.before.currentStreak ?? 'undefined'}</div>
                            <div>Longest Streak: {testResults.before.longestStreak ?? 'undefined'}</div>
                            <div>Total Days Read: {testResults.before.totalDaysRead ?? 'undefined'}</div>
                            <div>Total Reading Days: {testResults.before.totalReadingDays ?? 'undefined'}</div>
                          </div>
                        </div>

                        <div style={{
                          backgroundColor: '#0f172a',
                          borderRadius: '8px',
                          padding: '15px'
                        }}>
                          <strong style={{ color: '#10b981', fontSize: '14px' }}>After:</strong>
                          <div style={{ marginTop: '8px', fontSize: '13px', color: '#e2e8f0' }}>
                            <div><strong>Current Streak:</strong> {testResults.after.currentStreak} days</div>
                            <div><strong>Longest Streak:</strong> {testResults.after.longestStreak} days</div>
                            <div><strong>Total Days Read:</strong> {testResults.after.totalDaysRead} days</div>
                            <div><strong>Total Reading Days:</strong> {testResults.after.totalReadingDays} days</div>
                            <div><strong>Last Reading Date:</strong> {testResults.after.lastReadingDate}</div>
                          </div>
                          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #334155', fontSize: '12px', color: '#94a3b8' }}>
                            Analyzed {testResults.sessionCount} total sessions ({testResults.completedCount} completed)
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Full Migration */}
                    <div style={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      padding: '25px',
                      border: '2px solid #dc2626'
                    }}>
                      <h2 style={{ color: '#e2e8f0', fontSize: '20px', marginBottom: '15px' }}>
                        🚀 Step 2: Run Full Migration
                      </h2>
                      <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '15px' }}>
                        After successful test, migrate ALL students across ALL entities
                      </p>

                      <button
                        onClick={runFullMigration}
                        disabled={fullLoading || !testResults}
                        style={{
                          width: '100%',
                          padding: '16px',
                          backgroundColor: fullLoading ? '#6b7280' : (!testResults ? '#374151' : '#dc2626'),
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          cursor: (fullLoading || !testResults) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {fullLoading ? '⏳ Migrating All Students...' : '🚀 Migrate All Students'}
                      </button>

                      {!testResults && (
                        <p style={{ color: '#f59e0b', fontSize: '13px', textAlign: 'center', marginTop: '10px' }}>
                          ⚠️ Please complete test migration first
                        </p>
                      )}
                    </div>

                    {/* Full Results */}
                    {fullResults && (
                      <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        padding: '25px',
                        marginTop: '25px',
                        border: '2px solid #10b981'
                      }}>
                        <h3 style={{ color: '#10b981', fontSize: '18px', marginBottom: '15px' }}>
                          🎉 Migration Complete!
                        </h3>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '15px'
                        }}>
                          <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '6px' }}>
                            <div style={{ color: '#94a3b8', fontSize: '12px' }}>Processed</div>
                            <div style={{ color: '#e2e8f0', fontSize: '24px', fontWeight: 'bold' }}>
                              {fullResults.totalStudentsProcessed}
                            </div>
                          </div>
                          <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '6px' }}>
                            <div style={{ color: '#94a3b8', fontSize: '12px' }}>Updated</div>
                            <div style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold' }}>
                              {fullResults.totalStudentsUpdated}
                            </div>
                          </div>
                        </div>

                        {fullResults.errors.length > 0 && (
                          <div style={{ marginTop: '15px' }}>
                            <strong style={{ color: '#ef4444', fontSize: '14px' }}>
                              ⚠️ Errors ({fullResults.errors.length}):
                            </strong>
                            <pre style={{
                              backgroundColor: '#0f172a',
                              padding: '12px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              color: '#ef4444',
                              overflow: 'auto',
                              maxHeight: '200px',
                              marginTop: '8px'
                            }}>
                              {JSON.stringify(fullResults.errors, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column - Activity Log */}
                  <div>
                    <div style={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      padding: '25px',
                      border: '1px solid #334155',
                      height: 'fit-content'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#e2e8f0' }}>
                          📋 Activity Log
                        </h3>
                        <button
                          onClick={() => setLogs([])}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#334155',
                            color: '#94a3b8',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Clear
                        </button>
                      </div>

                      <div style={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        padding: '15px',
                        maxHeight: '600px',
                        overflowY: 'auto',
                        fontFamily: 'monospace',
                        fontSize: '12px'
                      }}>
                        {logs.length === 0 ? (
                          <div style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
                            No activity yet...
                          </div>
                        ) : (
                          logs.map((log, index) => (
                            <div
                              key={index}
                              style={{
                                marginBottom: '8px',
                                color: log.type === 'error' ? '#ef4444' :
                                       log.type === 'warning' ? '#f59e0b' :
                                       log.type === 'success' ? '#10b981' : '#94a3b8'
                              }}
                            >
                              <span style={{ color: '#64748b' }}>[{log.timestamp}]</span> {log.message}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      }}
    </GodModeAuth>
  );
}