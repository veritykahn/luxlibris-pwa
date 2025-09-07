// pages/god-mode/family-battle-health.js - Family Battle Health Check & Repair Tool
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Head from 'next/head';
import GodModeAuth from '../../components/god-mode/GodModeAuth';
import GodModeHeader from '../../components/god-mode/GodModeHeader';

export default function FamilyBattleHealth() {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [repairResults, setRepairResults] = useState(null);
  const [selectedFamilies, setSelectedFamilies] = useState(new Set());
  const [showConsoleScript, setShowConsoleScript] = useState(false);

  // Issue type definitions
  const ISSUE_TYPES = {
    DUAL_STRUCTURE: 'dual_structure',
    INCONSISTENT_STATE: 'inconsistent_state', 
    MISSING_HISTORY: 'missing_history',
    INVALID_MATH: 'invalid_math',
    ORPHANED_DATA: 'orphaned_data'
  };

  // Comprehensive family battle health scan
  const scanFamilyBattleHealth = async () => {
    try {
      setLoading(true);
      console.log('🔍 Scanning family battle health...');
      
      const familiesSnapshot = await getDocs(collection(db, 'families'));
      const familyIssues = [];
      
      familiesSnapshot.forEach(doc => {
        const familyId = doc.id;
        const data = doc.data();
        const battle = data.familyBattle;
        const oldHistory = data.familyBattleHistory;
        
        const issues = [];
        
        // Check for dual structure (both old and new data)
        if (oldHistory && battle?.history) {
          issues.push({
            type: ISSUE_TYPES.DUAL_STRUCTURE,
            severity: 'high',
            description: `Has both old (familyBattleHistory: ${oldHistory.battles} battles) and new (familyBattle.history: ${battle.history.totalBattles} battles) structures`,
            oldBattles: oldHistory.battles || 0,
            newBattles: battle.history.totalBattles || 0,
            oldWins: {
              children: oldHistory.childrenWins || 0,
              parents: oldHistory.parentWins || 0,
              ties: oldHistory.ties || 0
            },
            newWins: {
              children: battle.history.childrenWins || 0,
              parents: battle.history.parentWins || 0,
              ties: battle.history.ties || 0
            }
          });
        }
        
        // Check for inconsistent enabled state
        if (battle && !battle.enabled && (battle.currentWeek || battle.completedWeek)) {
          issues.push({
            type: ISSUE_TYPES.INCONSISTENT_STATE,
            severity: 'medium',
            description: 'Battle disabled but contains active battle data',
            hasCurrentWeek: !!battle.currentWeek,
            hasCompletedWeek: !!battle.completedWeek
          });
        }
        
        // Check for missing history structure
        if (battle?.enabled && !battle.history) {
          issues.push({
            type: ISSUE_TYPES.MISSING_HISTORY,
            severity: 'high',
            description: 'Battle enabled but missing history structure'
          });
        }
        
        // Check for invalid math in history
        if (battle?.history) {
          const h = battle.history;
          const totalCalculated = (h.childrenWins || 0) + (h.parentWins || 0) + (h.ties || 0);
          if (h.totalBattles !== totalCalculated) {
            issues.push({
              type: ISSUE_TYPES.INVALID_MATH,
              severity: 'medium',
              description: `Math error: totalBattles (${h.totalBattles}) ≠ sum of wins (${totalCalculated})`,
              totalBattles: h.totalBattles,
              calculatedTotal: totalCalculated,
              breakdown: {
                children: h.childrenWins || 0,
                parents: h.parentWins || 0,
                ties: h.ties || 0
              }
            });
          }
        }
        
        // Check for orphaned old data
        if (oldHistory && !battle) {
          issues.push({
            type: ISSUE_TYPES.ORPHANED_DATA,
            severity: 'low',
            description: 'Has old familyBattleHistory but no current familyBattle structure',
            oldBattles: oldHistory.battles || 0
          });
        }
        
        if (issues.length > 0) {
          familyIssues.push({
            familyId,
            familyName: data.familyName || 'Unknown Family',
            issues,
            data: {
              battle,
              oldHistory,
              linkedStudents: data.linkedStudents || [],
              linkedParents: data.linkedParents || []
            }
          });
        }
      });
      
      setFamilies(familyIssues);
      console.log(`📊 Found ${familyIssues.length} families with issues`);
      
    } catch (error) {
      console.error('❌ Error scanning families:', error);
    }
    setLoading(false);
  };

  // Repair dual structure families by merging old → new
  const repairDualStructure = async (family) => {
    const { familyId, data } = family;
    const { battle, oldHistory } = data;
    
    // Merge battle data prioritizing the more complete dataset
    const mergedHistory = {
      totalBattles: Math.max(oldHistory.battles || 0, battle.history.totalBattles || 0),
      childrenWins: Math.max(oldHistory.childrenWins || 0, battle.history.childrenWins || 0),
      parentWins: Math.max(oldHistory.parentWins || 0, battle.history.parentWins || 0),
      ties: Math.max(oldHistory.ties || 0, battle.history.ties || 0),
      currentStreak: battle.history.currentStreak || { team: null, count: 0 },
      recentBattles: battle.history.recentBattles || [],
      xpAwarded: battle.history.xpAwarded || {}
    };
    
    // Ensure math is correct
    const calculatedTotal = mergedHistory.childrenWins + mergedHistory.parentWins + mergedHistory.ties;
    if (mergedHistory.totalBattles < calculatedTotal) {
      mergedHistory.totalBattles = calculatedTotal;
    }
    
    return {
      'familyBattle.history': mergedHistory,
      // Remove old structure
      familyBattleHistory: null
    };
  };

  // Repair inconsistent state
  const repairInconsistentState = async (family) => {
  const { data } = family;
  const { battle } = data;
  
  // If there's ANY battle data, assume parent intended to enable
  const hasAnyBattleData = battle.currentWeek || 
                          battle.completedWeek || 
                          battle.history?.totalBattles > 0 ||
                          (battle.children?.total || 0) > 0 ||
                          (battle.parents?.total || 0) > 0;
  
  if (hasAnyBattleData) {
    return {
      'familyBattle.enabled': true, // Enable since data exists
      // Ensure history exists
      'familyBattle.history': battle.history || {
        totalBattles: 0,
        childrenWins: 0,
        parentWins: 0,
        ties: 0,
        currentStreak: { team: null, count: 0 },
        recentBattles: [],
        xpAwarded: {}
      },
      // Add repair timestamp
      'familyBattle.repairedAt': new Date(),
      'familyBattle.repairedReason': 'Auto-enabled due to existing battle data'
    };
  } else {
    // No data, clear everything
    return {
      'familyBattle.currentWeek': null,
      'familyBattle.completedWeek': null
    };
  }
};

  // Repair missing history
  const repairMissingHistory = async (family) => {
    return {
      'familyBattle.history': {
        totalBattles: 0,
        childrenWins: 0,
        parentWins: 0,
        ties: 0,
        currentStreak: { team: null, count: 0 },
        recentBattles: [],
        xpAwarded: {}
      }
    };
  };

  // Repair invalid math
  const repairInvalidMath = async (family) => {
    const { data } = family;
    const h = data.battle.history;
    
    const correctedTotal = (h.childrenWins || 0) + (h.parentWins || 0) + (h.ties || 0);
    
    return {
      'familyBattle.history.totalBattles': correctedTotal
    };
  };

  // Repair orphaned data
  const repairOrphanedData = async (family) => {
    const { data } = family;
    const { oldHistory } = data;
    
    // Create new battle structure from old data
    return {
      familyBattle: {
        enabled: false, // Let parents enable when ready
        currentWeek: null,
        completedWeek: null,
        history: {
          totalBattles: oldHistory.battles || 0,
          childrenWins: oldHistory.childrenWins || 0,
          parentWins: oldHistory.parentWins || 0,
          ties: oldHistory.ties || 0,
          currentStreak: { team: null, count: 0 },
          recentBattles: [],
          xpAwarded: {}
        }
      },
      // Remove old structure
      familyBattleHistory: null
    };
  };

  // Auto-repair selected families
  const autoRepairFamilies = async () => {
    if (selectedFamilies.size === 0) {
      alert('Please select families to repair');
      return;
    }
    
    setProcessing(true);
    const results = { success: 0, failed: 0, errors: [] };
    
    for (const familyId of selectedFamilies) {
      try {
        const family = families.find(f => f.familyId === familyId);
        if (!family) continue;
        
        console.log(`🔧 Repairing ${family.familyName}...`);
        
        const familyRef = doc(db, 'families', familyId);
        let updateData = {};
        
        // Apply repairs for each issue type
        for (const issue of family.issues) {
          let repairData = {};
          
          switch (issue.type) {
            case ISSUE_TYPES.DUAL_STRUCTURE:
              repairData = await repairDualStructure(family);
              break;
            case ISSUE_TYPES.INCONSISTENT_STATE:
              repairData = await repairInconsistentState(family);
              break;
            case ISSUE_TYPES.MISSING_HISTORY:
              repairData = await repairMissingHistory(family);
              break;
            case ISSUE_TYPES.INVALID_MATH:
              repairData = await repairInvalidMath(family);
              break;
            case ISSUE_TYPES.ORPHANED_DATA:
              repairData = await repairOrphanedData(family);
              break;
          }
          
          updateData = { ...updateData, ...repairData };
        }
        
        // Add repair timestamp
        updateData.lastRepaired = new Date();
        updateData.repairedBy = 'family-battle-health-tool';
        
        await updateDoc(familyRef, updateData);
        
        results.success++;
        console.log(`✅ Repaired ${family.familyName}`);
        
      } catch (error) {
        results.failed++;
        results.errors.push(`${familyId}: ${error.message}`);
        console.error(`❌ Failed to repair ${familyId}:`, error);
      }
    }
    
    setRepairResults(results);
    setProcessing(false);
    setSelectedFamilies(new Set());
    
    // Refresh scan
    await scanFamilyBattleHealth();
  };

  // Generate console repair script
  const generateConsoleScript = () => {
    const selectedFamilyData = families.filter(f => selectedFamilies.has(f.familyId));
    
    if (selectedFamilyData.length === 0) {
      return 'console.log("No families selected for repair");';
    }
    
    let script = `// Family Battle Repair Script - Generated ${new Date().toLocaleString()}\n`;
    script += `// Repairs ${selectedFamilyData.length} families with battle issues\n\n`;
    script += `(async function repairFamilyBattles() {\n`;
    script += `  const { doc, updateDoc } = window;\n`;
    script += `  const db = window.db;\n\n`;
    script += `  console.log('🔧 Starting family battle repairs...');\n\n`;
    
    selectedFamilyData.forEach((family, index) => {
      script += `  // ${index + 1}. ${family.familyName} (${family.familyId})\n`;
      script += `  // Issues: ${family.issues.map(i => i.type).join(', ')}\n`;
      script += `  try {\n`;
      script += `    await updateDoc(doc(db, 'families', '${family.familyId}'), {\n`;
      
      // Generate repair data for each issue
      family.issues.forEach(issue => {
        switch (issue.type) {
          case ISSUE_TYPES.DUAL_STRUCTURE:
            script += `      // Merge dual structures\n`;
            script += `      'familyBattle.history.totalBattles': ${Math.max(issue.oldBattles, issue.newBattles)},\n`;
            script += `      'familyBattle.history.childrenWins': ${Math.max(issue.oldWins.children, issue.newWins.children)},\n`;
            script += `      'familyBattle.history.parentWins': ${Math.max(issue.oldWins.parents, issue.newWins.parents)},\n`;
            script += `      'familyBattle.history.ties': ${Math.max(issue.oldWins.ties, issue.newWins.ties)},\n`;
            script += `      familyBattleHistory: null, // Remove old structure\n`;
            break;
          case ISSUE_TYPES.INCONSISTENT_STATE:
            script += `      // Fix inconsistent state\n`;
            if (issue.hasCurrentWeek || issue.hasCompletedWeek) {
              script += `      'familyBattle.enabled': true,\n`;
            }
            break;
          case ISSUE_TYPES.MISSING_HISTORY:
            script += `      // Add missing history structure\n`;
            script += `      'familyBattle.history': {\n`;
            script += `        totalBattles: 0,\n`;
            script += `        childrenWins: 0,\n`;
            script += `        parentWins: 0,\n`;
            script += `        ties: 0,\n`;
            script += `        currentStreak: { team: null, count: 0 },\n`;
            script += `        recentBattles: [],\n`;
            script += `        xpAwarded: {}\n`;
            script += `      },\n`;
            break;
          case ISSUE_TYPES.INVALID_MATH:
            script += `      // Fix math error\n`;
            script += `      'familyBattle.history.totalBattles': ${issue.calculatedTotal},\n`;
            break;
          case ISSUE_TYPES.ORPHANED_DATA:
            script += `      // Convert orphaned data to new structure\n`;
            script += `      familyBattle: {\n`;
            script += `        enabled: false,\n`;
            script += `        currentWeek: null,\n`;
            script += `        completedWeek: null,\n`;
            script += `        history: {\n`;
            script += `          totalBattles: ${issue.oldBattles},\n`;
            script += `          childrenWins: 0,\n`;
            script += `          parentWins: 0,\n`;
            script += `          ties: 0,\n`;
            script += `          currentStreak: { team: null, count: 0 },\n`;
            script += `          recentBattles: [],\n`;
            script += `          xpAwarded: {}\n`;
            script += `        }\n`;
            script += `      },\n`;
            script += `      familyBattleHistory: null,\n`;
            break;
        }
      });
      
      script += `      lastRepaired: new Date(),\n`;
      script += `      repairedBy: 'console-script'\n`;
      script += `    });\n`;
      script += `    console.log('✅ Repaired ${family.familyName}');\n`;
      script += `  } catch (error) {\n`;
      script += `    console.error('❌ Failed to repair ${family.familyName}:', error);\n`;
      script += `  }\n\n`;
    });
    
    script += `  console.log('🎉 Family battle repair complete!');\n`;
    script += `})();\n`;
    
    return script;
  };

  useEffect(() => {
    scanFamilyBattleHealth();
  }, []);

  const getIssueColor = (severity) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getIssueIcon = (type) => {
    switch (type) {
      case ISSUE_TYPES.DUAL_STRUCTURE: return '🔄';
      case ISSUE_TYPES.INCONSISTENT_STATE: return '⚠️';
      case ISSUE_TYPES.MISSING_HISTORY: return '❓';
      case ISSUE_TYPES.INVALID_MATH: return '🔢';
      case ISSUE_TYPES.ORPHANED_DATA: return '👻';
      default: return '🔧';
    }
  };

  const toggleFamilySelection = (familyId) => {
    const newSelection = new Set(selectedFamilies);
    if (newSelection.has(familyId)) {
      newSelection.delete(familyId);
    } else {
      newSelection.add(familyId);
    }
    setSelectedFamilies(newSelection);
  };

  const selectAllFamilies = () => {
    setSelectedFamilies(new Set(families.map(f => f.familyId)));
  };

  const clearSelection = () => {
    setSelectedFamilies(new Set());
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '4px solid #ec4899',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: 'white' }}>Scanning family battle health...</p>
        </div>
      </div>
    );
  }

  return (
    <GodModeAuth pageName="Family Battle Health Check">
      {({ isAuthenticated, sessionTimeRemaining, handleLogout }) => (
        <>
          <Head>
            <title>Family Battle Health Check - GOD MODE - Lux Libris</title>
          </Head>

          <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            
            <GodModeHeader 
              title="Family Battle Health Check"
              icon="⚔️"
              sessionTimeRemaining={sessionTimeRemaining}
              onLogout={handleLogout}
              showDashboardButton={true}
              showManagerButton={true}
            />

            <div style={{
              maxWidth: '80rem',
              margin: '0 auto',
              padding: '2rem 1.5rem'
            }}>
              
              {/* Header */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '0.75rem',
                padding: '2rem',
                marginBottom: '2rem',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(236, 72, 153, 0.3)'
              }}>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: '0 0 1rem 0',
                  fontFamily: 'Georgia, serif'
                }}>
                  ⚔️ Family Battle Health Check & Repair
                </h1>
                <p style={{
                  color: '#c084fc',
                  margin: '0 0 1rem 0',
                  fontSize: '1.125rem'
                }}>
                  Comprehensive diagnostics and repair tools for family battle data integrity
                </p>
                
                <button
                  onClick={scanFamilyBattleHealth}
                  disabled={loading}
                  style={{
                    background: loading ? '#6b7280' : 'linear-gradient(135deg, #ec4899, #be185d)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? '⏳ Scanning...' : '🔄 Re-scan All Families'}
                </button>
              </div>

              {/* Summary Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  textAlign: 'center',
                  border: families.length > 0 ? '2px solid #ef444440' : '2px solid #10b98140'
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: families.length > 0 ? '#ef4444' : '#10b981'
                  }}>
                    {families.length}
                  </div>
                  <div style={{ color: '#c084fc', fontSize: '0.875rem' }}>
                    Families with Issues
                  </div>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  textAlign: 'center',
                  border: '2px solid #ec489940'
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: '#ec4899'
                  }}>
                    {families.filter(f => f.issues.some(i => i.type === ISSUE_TYPES.DUAL_STRUCTURE)).length}
                  </div>
                  <div style={{ color: '#c084fc', fontSize: '0.875rem' }}>
                    Dual Structure
                  </div>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  textAlign: 'center',
                  border: '2px solid #f59e0b40'
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: '#f59e0b'
                  }}>
                    {families.filter(f => f.issues.some(i => i.type === ISSUE_TYPES.INCONSISTENT_STATE)).length}
                  </div>
                  <div style={{ color: '#c084fc', fontSize: '0.875rem' }}>
                    Inconsistent State
                  </div>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  textAlign: 'center',
                  border: `2px solid ${selectedFamilies.size > 0 ? '#8b5cf640' : '#6b728040'}`
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: selectedFamilies.size > 0 ? '#8b5cf6' : '#6b7280'
                  }}>
                    {selectedFamilies.size}
                  </div>
                  <div style={{ color: '#c084fc', fontSize: '0.875rem' }}>
                    Selected for Repair
                  </div>
                </div>
              </div>

              {/* Bulk Actions */}
              {families.length > 0 && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '0.75rem',
                  padding: '2rem',
                  marginBottom: '2rem',
                  border: '1px solid rgba(168, 85, 247, 0.3)'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: '0 0 1rem 0',
                    fontFamily: 'Georgia, serif'
                  }}>
                    ⚡ Bulk Repair Actions
                  </h2>
                  
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <button
                      onClick={selectAllFamilies}
                      style={{
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      ✅ Select All ({families.length})
                    </button>

                    <button
                      onClick={clearSelection}
                      disabled={selectedFamilies.size === 0}
                      style={{
                        background: selectedFamilies.size === 0 ? '#6b7280' : 'linear-gradient(135deg, #6b7280, #4b5563)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        fontSize: '1rem',
                        cursor: selectedFamilies.size === 0 ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        opacity: selectedFamilies.size === 0 ? 0.7 : 1
                      }}
                    >
                      ❌ Clear Selection
                    </button>

                    <button
                      onClick={autoRepairFamilies}
                      disabled={processing || selectedFamilies.size === 0}
                      style={{
                        background: (processing || selectedFamilies.size === 0) ? '#6b7280' : 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        fontSize: '1rem',
                        cursor: (processing || selectedFamilies.size === 0) ? 'not-allowed' : 'pointer',
                        opacity: (processing || selectedFamilies.size === 0) ? 0.7 : 1,
                        fontWeight: '600'
                      }}
                    >
                      {processing ? '⏳ Repairing...' : `🔧 Auto-Repair Selected (${selectedFamilies.size})`}
                    </button>

                    <button
                      onClick={() => setShowConsoleScript(!showConsoleScript)}
                      disabled={selectedFamilies.size === 0}
                      style={{
                        background: selectedFamilies.size === 0 ? '#6b7280' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        fontSize: '1rem',
                        cursor: selectedFamilies.size === 0 ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        opacity: selectedFamilies.size === 0 ? 0.7 : 1
                      }}
                    >
                      📜 {showConsoleScript ? 'Hide' : 'Generate'} Console Script
                    </button>
                  </div>
                  
                  <p style={{
                    color: '#c084fc',
                    fontSize: '0.875rem',
                    margin: '0'
                  }}>
                    Auto-repair will merge dual structures, fix inconsistent states, and correct math errors.
                  </p>
                </div>
              )}

              {/* Console Script Display */}
              {showConsoleScript && selectedFamilies.size > 0 && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: '2px solid #f59e0b60',
                  borderRadius: '0.75rem',
                  padding: '2rem',
                  marginBottom: '2rem',
                  backdropFilter: 'blur(8px)'
                }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: '#f59e0b',
                    margin: '0 0 1rem 0',
                    fontFamily: 'Georgia, serif'
                  }}>
                    📜 Console Repair Script
                  </h3>
                  <p style={{
                    color: '#fbbf24',
                    marginBottom: '1rem',
                    fontSize: '0.875rem'
                  }}>
                    Copy and paste this script into your browser console while on the app to manually run repairs:
                  </p>
                  
                  <div style={{
                    background: '#1f2937',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '1rem',
                    border: '1px solid #374151'
                  }}>
                    <pre style={{
                      color: '#d1d5db',
                      fontSize: '0.75rem',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'Monaco, Consolas, monospace'
                    }}>
                      {generateConsoleScript()}
                    </pre>
                  </div>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generateConsoleScript());
                      alert('Console script copied to clipboard!');
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    📋 Copy Script to Clipboard
                  </button>
                </div>
              )}

              {/* Repair Results */}
              {repairResults && (
                <div style={{
                  background: repairResults.success > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `2px solid ${repairResults.success > 0 ? '#10b98160' : '#ef444460'}`,
                  borderRadius: '0.75rem',
                  padding: '2rem',
                  marginBottom: '2rem',
                  backdropFilter: 'blur(8px)'
                }}>
                  <h3 style={{
                    color: repairResults.success > 0 ? '#10b981' : '#ef4444',
                    margin: '0 0 1rem 0',
                    fontFamily: 'Georgia, serif'
                  }}>
                    🔧 Repair Results
                  </h3>
                  <p style={{ margin: '0 0 1rem 0', color: 'white' }}>
                    Successfully repaired: <strong style={{ color: '#10b981' }}>{repairResults.success}</strong> families
                    <br />
                    Failed: <strong style={{ color: '#ef4444' }}>{repairResults.failed}</strong> families
                  </p>
                  
                  {repairResults.errors.length > 0 && (
                    <div>
                      <strong style={{ color: 'white' }}>Errors:</strong>
                      <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                        {repairResults.errors.map((error, index) => (
                          <li key={index} style={{ color: '#ef4444' }}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Families with Issues */}
              {families.length > 0 ? (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '0.75rem',
                  padding: '2rem',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: '0 0 1.5rem 0',
                    fontFamily: 'Georgia, serif'
                  }}>
                    🔧 Families Requiring Attention
                  </h2>

                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {families.map(family => (
                      <div key={family.familyId} style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: selectedFamilies.has(family.familyId) ? '2px solid #8b5cf6' : '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '0.75rem',
                        padding: '1.5rem'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '1rem'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                              <input
                                type="checkbox"
                                checked={selectedFamilies.has(family.familyId)}
                                onChange={() => toggleFamilySelection(family.familyId)}
                                style={{
                                  width: '1.25rem',
                                  height: '1.25rem',
                                  cursor: 'pointer'
                                }}
                              />
                              <strong style={{ color: 'white', fontSize: '1.125rem' }}>
                                {family.familyName}
                              </strong>
                              <span style={{ 
                                color: '#9ca3af', 
                                fontSize: '0.875rem',
                                fontFamily: 'Monaco, Consolas, monospace'
                              }}>
                                {family.familyId}
                              </span>
                            </div>
                            
                            <div style={{ color: '#c084fc', fontSize: '0.875rem', marginBottom: '1rem' }}>
                              {family.data.linkedStudents.length} students, {family.data.linkedParents.length} parents
                            </div>
                          </div>
                        </div>

                        {/* Issues List */}
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                          {family.issues.map((issue, index) => (
                            <div key={index} style={{
                              background: 'rgba(0, 0, 0, 0.4)',
                              border: `1px solid ${getIssueColor(issue.severity)}60`,
                              borderRadius: '0.5rem',
                              padding: '1rem'
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.75rem',
                                marginBottom: '0.5rem'
                              }}>
                                <span style={{ fontSize: '1.25rem' }}>
                                  {getIssueIcon(issue.type)}
                                </span>
                                <div style={{ flex: 1 }}>
                                  <div style={{
                                    color: getIssueColor(issue.severity),
                                    fontWeight: 'bold',
                                    fontSize: '0.875rem',
                                    marginBottom: '0.25rem'
                                  }}>
                                    {issue.type.replace(/_/g, ' ').toUpperCase()} ({issue.severity.toUpperCase()})
                                  </div>
                                  <div style={{
                                    color: 'white',
                                    fontSize: '0.875rem'
                                  }}>
                                    {issue.description}
                                  </div>
                                  
                                  {/* Additional details for dual structure */}
                                  {issue.type === ISSUE_TYPES.DUAL_STRUCTURE && (
                                    <div style={{
                                      marginTop: '0.5rem',
                                      fontSize: '0.75rem',
                                      color: '#d1d5db',
                                      background: 'rgba(0,0,0,0.3)',
                                      padding: '0.5rem',
                                      borderRadius: '0.25rem'
                                    }}>
                                      <strong>Merge Preview:</strong><br/>
                                      Total Battles: {Math.max(issue.oldBattles, issue.newBattles)}<br/>
                                      Children Wins: {Math.max(issue.oldWins.children, issue.newWins.children)}<br/>
                                      Parent Wins: {Math.max(issue.oldWins.parents, issue.newWins.parents)}<br/>
                                      Ties: {Math.max(issue.oldWins.ties, issue.newWins.ties)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '0.75rem',
                  padding: '3rem',
                  textAlign: 'center',
                  border: '2px solid #10b98140'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                  <h2 style={{
                    fontSize: '1.5rem',
                    color: 'white',
                    margin: '0 0 0.5rem 0',
                    fontFamily: 'Georgia, serif'
                  }}>
                    All Family Battles Healthy!
                  </h2>
                  <p style={{ color: '#c084fc' }}>
                    No family battle issues detected. All data structures are consistent.
                  </p>
                </div>
              )}
            </div>

            <style jsx>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </>
      )}
    </GodModeAuth>
  );
}