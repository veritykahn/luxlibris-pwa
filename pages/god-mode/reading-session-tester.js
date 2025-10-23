// pages/god-mode/reading-session-tester.js - Reading Session Testing Tool
import { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Head from 'next/head';
import GodModeAuth from '../../components/god-mode/GodModeAuth';
import GodModeHeader from '../../components/god-mode/GodModeHeader';

export default function ReadingSessionTester() {
  // Test student details - from your uploaded data
  const TEST_STUDENT = {
    entityId: 'VG6SZ6Ry2MSJcNpapSsO',
    schoolId: 'lXFVkgIsAB2PEjtBDzR3',
    studentId: 'bnvDEPXEQvXCweIsM8ZZ',
    displayUsername: 'KeanuK5KAHN',
    signInCode: 'UKSCOT-DOGF-KAHN74-STUDENT'
  };

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentSessions, setCurrentSessions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [studentData, setStudentData] = useState(null);
  
  // Bulk add settings
  const [bulkCount, setBulkCount] = useState(89);
  const [bulkMinDuration, setBulkMinDuration] = useState(20);
  const [bulkMaxDuration, setBulkMaxDuration] = useState(45);
  
  // Single session settings
  const [singleDate, setSingleDate] = useState('');
  const [singleDuration, setSingleDuration] = useState(20);

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

  const loadCurrentData = async () => {
    try {
      setLoading(true);
      addLog('Loading current data...', 'info');
      
      // Load student document
      const studentDocRef = doc(db, `entities/${TEST_STUDENT.entityId}/schools/${TEST_STUDENT.schoolId}/students/${TEST_STUDENT.studentId}`);
      const studentSnapshot = await getDoc(studentDocRef);
      
      if (studentSnapshot.exists()) {
        const data = studentSnapshot.data();
        setStudentData(data);
        addLog(`Student loaded: ${data.displayUsername}`, 'success');
        addLog(`Total Reading Days: ${data.totalReadingDays || 0}`, 'info');
        addLog(`Last Reading Date: ${data.lastReadingDate || 'none'}`, 'info');
      }

      // Load reading sessions
      const sessionsPath = `entities/${TEST_STUDENT.entityId}/schools/${TEST_STUDENT.schoolId}/students/${TEST_STUDENT.studentId}/readingSessions`;
      const sessionsSnapshot = await getDocs(collection(db, sessionsPath));
      
      const sessions = [];
      sessionsSnapshot.forEach(sessionDoc => {
        sessions.push({ id: sessionDoc.id, ...sessionDoc.data() });
      });
      
      // Sort by date descending
      sessions.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      
      setCurrentSessions(sessions);
      addLog(`Loaded ${sessions.length} existing reading sessions`, 'info');
      
      // Analyze sessions
      const uniqueDates = new Set(sessions.map(s => s.date));
      const completedSessions = sessions.filter(s => s.completed === true);
      addLog(`Unique dates: ${uniqueDates.size}`, 'info');
      addLog(`Completed sessions (20+ mins): ${completedSessions.length}`, 'info');
      
    } catch (error) {
      console.error('Error loading data:', error);
      addLog(`Error loading data: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateRandomDuration = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const addBulkSessions = async () => {
    if (processing) return;
    
    if (!confirm(`Add ${bulkCount} reading sessions on consecutive dates before today?`)) {
      return;
    }

    try {
      setProcessing(true);
      addLog(`Starting bulk add of ${bulkCount} sessions...`, 'info');
      
      const today = new Date();
      const sessionsPath = `entities/${TEST_STUDENT.entityId}/schools/${TEST_STUDENT.schoolId}/students/${TEST_STUDENT.studentId}/readingSessions`;
      
      let addedCount = 0;
      let skippedCount = 0;
      const dateSet = new Set();
      
      // Get existing dates to avoid duplicates
      const existingDates = new Set(currentSessions.map(s => s.date));
      
      // Start from yesterday and work backwards
      for (let i = 1; i <= bulkCount; i++) {
        const sessionDate = new Date(today);
        sessionDate.setDate(today.getDate() - i);
        const dateStr = getLocalDateString(sessionDate);
        
        // Skip if date already has a session
        if (existingDates.has(dateStr) || dateSet.has(dateStr)) {
          skippedCount++;
          addLog(`Skipped ${dateStr} - already exists`, 'warning');
          continue;
        }
        
        const duration = generateRandomDuration(bulkMinDuration, bulkMaxDuration);
        const completed = duration >= 20;
        
        const sessionData = {
          bookId: null,
          completed: completed,
          date: dateStr,
          duration: duration,
          startTime: new Date(sessionDate.setHours(14, 0, 0, 0)), // 2pm each day
          targetDuration: 20
        };
        
        // Create session document with auto-generated ID
        const newSessionRef = doc(collection(db, sessionsPath));
        await setDoc(newSessionRef, sessionData);
        
        dateSet.add(dateStr);
        addedCount++;
        
        if (addedCount % 10 === 0) {
          addLog(`Progress: ${addedCount}/${bulkCount} sessions added...`, 'info');
        }
      }
      
      // Update student document with totalReadingDays and lastReadingDate
      const allDates = new Set([...existingDates, ...dateSet]);
      const sortedDates = Array.from(allDates).sort().reverse();
      
      const studentDocRef = doc(db, `entities/${TEST_STUDENT.entityId}/schools/${TEST_STUDENT.schoolId}/students/${TEST_STUDENT.studentId}`);
      await updateDoc(studentDocRef, {
        totalReadingDays: allDates.size,
        lastReadingDate: sortedDates[0],
        lastXPUpdate: new Date()
      });
      
      addLog(`✅ Bulk add complete!`, 'success');
      addLog(`Added: ${addedCount} sessions`, 'success');
      addLog(`Skipped: ${skippedCount} (duplicates)`, 'warning');
      addLog(`Total unique reading days: ${allDates.size}`, 'success');
      addLog(`Last reading date: ${sortedDates[0]}`, 'success');
      
      // Reload data
      await loadCurrentData();
      
    } catch (error) {
      console.error('Error adding bulk sessions:', error);
      addLog(`❌ Error: ${error.message}`, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const addSingleSession = async () => {
    if (processing) return;
    
    if (!singleDate) {
      alert('Please select a date');
      return;
    }

    if (!confirm(`Add a ${singleDuration}-minute session on ${singleDate}?`)) {
      return;
    }

    try {
      setProcessing(true);
      addLog(`Adding single session for ${singleDate}...`, 'info');
      
      // Check if date already exists
      const existingSession = currentSessions.find(s => s.date === singleDate);
      if (existingSession) {
        addLog(`⚠️ Date ${singleDate} already has a session!`, 'warning');
        if (!confirm('A session already exists for this date. Add another anyway?')) {
          setProcessing(false);
          return;
        }
      }
      
      const sessionsPath = `entities/${TEST_STUDENT.entityId}/schools/${TEST_STUDENT.schoolId}/students/${TEST_STUDENT.studentId}/readingSessions`;
      const completed = singleDuration >= 20;
      
      const sessionData = {
        bookId: null,
        completed: completed,
        date: singleDate,
        duration: singleDuration,
        startTime: new Date(`${singleDate}T14:00:00`),
        targetDuration: 20
      };
      
      const newSessionRef = doc(collection(db, sessionsPath));
      await setDoc(newSessionRef, sessionData);
      
      addLog(`✅ Session added for ${singleDate}`, 'success');
      
      // Update student document
      const allDates = new Set([...currentSessions.map(s => s.date), singleDate]);
      const sortedDates = Array.from(allDates).sort().reverse();
      
      const studentDocRef = doc(db, `entities/${TEST_STUDENT.entityId}/schools/${TEST_STUDENT.schoolId}/students/${TEST_STUDENT.studentId}`);
      await updateDoc(studentDocRef, {
        totalReadingDays: allDates.size,
        lastReadingDate: sortedDates[0],
        lastXPUpdate: new Date()
      });
      
      addLog(`Updated totalReadingDays to ${allDates.size}`, 'success');
      
      // Reload data
      await loadCurrentData();
      
    } catch (error) {
      console.error('Error adding session:', error);
      addLog(`❌ Error: ${error.message}`, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const clearAllSessions = async () => {
    if (processing) return;
    
    if (!confirm(`⚠️ DELETE ALL ${currentSessions.length} SESSIONS?\n\nThis cannot be undone!`)) {
      return;
    }

    if (!confirm('Are you absolutely sure? Type YES in the next prompt to confirm.')) {
      return;
    }

    const confirmation = prompt('Type YES to confirm deletion:');
    if (confirmation !== 'YES') {
      addLog('Deletion cancelled', 'info');
      return;
    }

    try {
      setProcessing(true);
      addLog('Deleting all sessions...', 'warning');
      
      const sessionsPath = `entities/${TEST_STUDENT.entityId}/schools/${TEST_STUDENT.schoolId}/students/${TEST_STUDENT.studentId}/readingSessions`;
      const sessionsSnapshot = await getDocs(collection(db, sessionsPath));
      
      let deletedCount = 0;
      const deletePromises = [];
      
      sessionsSnapshot.forEach(sessionDoc => {
        deletePromises.push(deleteDoc(sessionDoc.ref));
        deletedCount++;
      });
      
      await Promise.all(deletePromises);
      
      // Reset student counters
      const studentDocRef = doc(db, `entities/${TEST_STUDENT.entityId}/schools/${TEST_STUDENT.schoolId}/students/${TEST_STUDENT.studentId}`);
      await updateDoc(studentDocRef, {
        totalReadingDays: 0,
        lastReadingDate: null,
        lastXPUpdate: new Date()
      });
      
      addLog(`✅ Deleted ${deletedCount} sessions`, 'success');
      addLog('Reset student counters', 'success');
      
      // Reload data
      await loadCurrentData();
      
    } catch (error) {
      console.error('Error clearing sessions:', error);
      addLog(`❌ Error: ${error.message}`, 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <GodModeAuth pageName="Reading Session Tester">
      {({ isAuthenticated, sessionTimeRemaining, handleLogout }) => (
        <>
          <Head>
            <title>Reading Session Tester | God Mode</title>
          </Head>
          <div style={{ minHeight: '100vh', backgroundColor: '#0a0e27' }}>
            <GodModeHeader 
              title="Reading Session Tester"
              icon="📖"
              sessionTimeRemaining={sessionTimeRemaining}
              onLogout={handleLogout}
              showDashboardButton={true}
              showManagerButton={true}
            />
            
            <div style={{ padding: '40px 20px', maxWidth: '1400px', margin: '0 auto' }}>
              {/* Header */}
              <div style={{ marginBottom: '30px' }}>
                <h1 style={{ 
                  fontSize: '36px', 
                  fontWeight: 'bold', 
                  color: '#fbbf24',
                  marginBottom: '10px',
                  textShadow: '0 0 20px rgba(251, 191, 36, 0.3)'
                }}>
                  📖 Reading Session Tester
                </h1>
                <p style={{ fontSize: '16px', color: '#94a3b8' }}>
                  Test reading session creation and streak tracking on a single test student
                </p>
              </div>

              {/* Test Student Info Card */}
              <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '30px',
                border: '2px solid #fbbf24'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '15px' }}>
                  🎯 Test Student
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Display Name</div>
                    <div style={{ fontSize: '16px', color: '#e2e8f0', fontWeight: 'bold' }}>{TEST_STUDENT.displayUsername}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Sign-In Code</div>
                    <div style={{ fontSize: '16px', color: '#e2e8f0', fontFamily: 'monospace' }}>{TEST_STUDENT.signInCode}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Student ID</div>
                    <div style={{ fontSize: '13px', color: '#e2e8f0', fontFamily: 'monospace' }}>{TEST_STUDENT.studentId}</div>
                  </div>
                </div>
                
                {studentData && (
                  <div style={{ 
                    marginTop: '15px', 
                    paddingTop: '15px', 
                    borderTop: '1px solid #334155',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '15px'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Total Reading Days</div>
                      <div style={{ fontSize: '24px', color: '#10b981', fontWeight: 'bold' }}>{studentData.totalReadingDays || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Last Reading Date</div>
                      <div style={{ fontSize: '16px', color: '#e2e8f0' }}>{studentData.lastReadingDate || 'None'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Existing Sessions</div>
                      <div style={{ fontSize: '24px', color: '#3b82f6', fontWeight: 'bold' }}>{currentSessions.length}</div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                {/* Left Column - Actions */}
                <div>
                  {/* Bulk Add Card */}
                  <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    padding: '25px',
                    marginBottom: '20px',
                    border: '1px solid #334155'
                  }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', marginBottom: '20px' }}>
                      ➕ Bulk Add Sessions
                    </h3>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
                        Number of Sessions
                      </label>
                      <input
                        type="number"
                        value={bulkCount}
                        onChange={(e) => setBulkCount(parseInt(e.target.value) || 0)}
                        min="1"
                        max="365"
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#e2e8f0',
                          fontSize: '16px'
                        }}
                      />
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        Will create sessions from yesterday backwards for {bulkCount} consecutive days
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
                          Min Duration (mins)
                        </label>
                        <input
                          type="number"
                          value={bulkMinDuration}
                          onChange={(e) => setBulkMinDuration(parseInt(e.target.value) || 0)}
                          min="1"
                          max="120"
                          style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#e2e8f0',
                            fontSize: '16px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
                          Max Duration (mins)
                        </label>
                        <input
                          type="number"
                          value={bulkMaxDuration}
                          onChange={(e) => setBulkMaxDuration(parseInt(e.target.value) || 0)}
                          min="1"
                          max="120"
                          style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#e2e8f0',
                            fontSize: '16px'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: '#065f46',
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '15px',
                      fontSize: '13px',
                      color: '#d1fae5'
                    }}>
                      💡 Sessions with 20+ minutes will be marked as <strong>completed: true</strong> and count toward streaks
                    </div>

                    <button
                      onClick={addBulkSessions}
                      disabled={processing || loading}
                      style={{
                        width: '100%',
                        padding: '14px',
                        backgroundColor: processing ? '#6b7280' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: processing ? 'not-allowed' : 'pointer',
                        opacity: processing ? 0.6 : 1
                      }}
                    >
                      {processing ? '⏳ Adding Sessions...' : `➕ Add ${bulkCount} Sessions`}
                    </button>
                  </div>

                  {/* Single Session Card */}
                  <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    padding: '25px',
                    marginBottom: '20px',
                    border: '1px solid #334155'
                  }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '20px' }}>
                      📅 Add Single Session
                    </h3>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
                        Date
                      </label>
                      <input
                        type="date"
                        value={singleDate}
                        onChange={(e) => setSingleDate(e.target.value)}
                        max={getLocalDateString(new Date())}
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#e2e8f0',
                          fontSize: '16px'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={singleDuration}
                        onChange={(e) => setSingleDuration(parseInt(e.target.value) || 0)}
                        min="1"
                        max="120"
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#e2e8f0',
                          fontSize: '16px'
                        }}
                      />
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        {singleDuration >= 20 
                          ? '✅ Will be marked as completed (counts toward streak)' 
                          : '⚠️ Will be banked (does NOT count toward streak)'}
                      </div>
                    </div>

                    <button
                      onClick={addSingleSession}
                      disabled={processing || loading || !singleDate}
                      style={{
                        width: '100%',
                        padding: '14px',
                        backgroundColor: processing || !singleDate ? '#6b7280' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: processing || !singleDate ? 'not-allowed' : 'pointer',
                        opacity: processing || !singleDate ? 0.6 : 1
                      }}
                    >
                      {processing ? '⏳ Adding...' : '📅 Add Single Session'}
                    </button>
                  </div>

                  {/* Danger Zone */}
                  <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    padding: '25px',
                    border: '2px solid #dc2626'
                  }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444', marginBottom: '15px' }}>
                      ⚠️ Danger Zone
                    </h3>
                    
                    <div style={{
                      backgroundColor: '#7f1d1d',
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '15px',
                      fontSize: '13px',
                      color: '#fecaca'
                    }}>
                      ⚠️ This will permanently delete ALL reading sessions for this test student. This action cannot be undone!
                    </div>

                    <button
                      onClick={clearAllSessions}
                      disabled={processing || loading || currentSessions.length === 0}
                      style={{
                        width: '100%',
                        padding: '14px',
                        backgroundColor: currentSessions.length === 0 ? '#6b7280' : '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: currentSessions.length === 0 ? 'not-allowed' : 'pointer',
                        opacity: currentSessions.length === 0 ? 0.6 : 1
                      }}
                    >
                      🗑️ Delete All Sessions ({currentSessions.length})
                    </button>
                  </div>
                </div>

                {/* Right Column - Logs and Session List */}
                <div>
                  {/* Activity Log */}
                  <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    padding: '25px',
                    marginBottom: '20px',
                    border: '1px solid #334155'
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
                      maxHeight: '300px',
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

                  {/* Recent Sessions */}
                  <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    padding: '25px',
                    border: '1px solid #334155'
                  }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '15px' }}>
                      📚 Recent Sessions ({currentSessions.length})
                    </h3>
                    
                    <div style={{
                      maxHeight: '400px',
                      overflowY: 'auto'
                    }}>
                      {currentSessions.length === 0 ? (
                        <div style={{ 
                          color: '#64748b', 
                          textAlign: 'center', 
                          padding: '40px 20px',
                          backgroundColor: '#0f172a',
                          borderRadius: '8px'
                        }}>
                          No sessions yet. Add some using the forms above!
                        </div>
                      ) : (
                        currentSessions.slice(0, 50).map((session) => (
                          <div
                            key={session.id}
                            style={{
                              backgroundColor: '#0f172a',
                              borderRadius: '8px',
                              padding: '12px',
                              marginBottom: '10px',
                              border: session.completed ? '1px solid #10b981' : '1px solid #334155'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: 'bold' }}>
                                  📅 {session.date}
                                </div>
                                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                                  ⏱️ {session.duration} minutes
                                  {session.completed ? (
                                    <span style={{ marginLeft: '8px', color: '#10b981', fontWeight: 'bold' }}>
                                      ✅ Completed
                                    </span>
                                  ) : (
                                    <span style={{ marginLeft: '8px', color: '#f59e0b' }}>
                                      ⚠️ Banked
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {currentSessions.length > 50 && (
                        <div style={{ 
                          textAlign: 'center', 
                          color: '#64748b', 
                          fontSize: '12px',
                          marginTop: '10px'
                        }}>
                          Showing first 50 of {currentSessions.length} sessions
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </GodModeAuth>
  );
}