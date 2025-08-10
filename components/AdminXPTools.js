// components/AdminXPTools.js
import { useState } from 'react';
import { validateTotalXP, reconcileXP, getXPAuditReport } from '../lib/xp-management';

export default function AdminXPTools({ studentData, onUpdate }) {
  const [auditReport, setAuditReport] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleAudit = async () => {
    setLoading(true);
    try {
      const report = await getXPAuditReport(studentData);
      setAuditReport(report);
    } catch (error) {
      console.error('Audit failed:', error);
      alert('Failed to audit XP: ' + error.message);
    }
    setLoading(false);
  };
  
  const handleReconcile = async () => {
    if (!confirm('This will update the student\'s total XP to match calculated value. Continue?')) {
      return;
    }
    
    setLoading(true);
    try {
      const result = await reconcileXP(studentData);
      if (result.success) {
        alert(`✅ XP reconciled: ${result.previousTotal} → ${result.newTotal}`);
        if (onUpdate) onUpdate(result.updatedData);
        // Re-run audit to show updated state
        handleAudit();
      }
    } catch (error) {
      console.error('Reconciliation failed:', error);
      alert('Failed to reconcile XP: ' + error.message);
    }
    setLoading(false);
  };
  
  const formatAuditReport = (report) => {
    if (!report) return null;
    
    const hasDiscrepancy = report.difference !== 0;
    
    return (
      <div style={{
        backgroundColor: hasDiscrepancy ? '#FEE' : '#EFE',
        border: `2px solid ${hasDiscrepancy ? '#F00' : '#0A0'}`,
        borderRadius: '8px',
        padding: '16px',
        marginTop: '16px',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        <h4 style={{ margin: '0 0 12px 0' }}>
          XP Audit Report {hasDiscrepancy ? '⚠️' : '✅'}
        </h4>
        
        <div style={{ marginBottom: '12px' }}>
          <strong>Current Total:</strong> {report.stored} XP<br/>
          <strong>Calculated Total:</strong> {report.calculated} XP<br/>
          <strong>Difference:</strong> 
          <span style={{ 
            color: hasDiscrepancy ? '#F00' : '#0A0',
            fontWeight: 'bold'
          }}>
            {hasDiscrepancy ? ` ${report.difference > 0 ? '+' : ''}${report.difference} XP` : ' None ✓'}
          </span>
        </div>
        
        <details>
          <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
            📊 Breakdown
          </summary>
          <div style={{ paddingLeft: '16px' }}>
            <div><strong>Reading XP:</strong> {report.breakdown?.reading || 0} XP</div>
            <div><strong>Badge XP:</strong> {report.breakdown?.badges || 0} XP</div>
            <div><strong>Battle XP:</strong> {report.breakdown?.battles || 0} XP</div>
            
            {report.breakdown?.badgeDetails && (
              <details style={{ marginTop: '8px' }}>
                <summary>Badge Details</summary>
                <div style={{ fontSize: '11px', paddingLeft: '8px' }}>
                  {report.breakdown.badgeDetails.map((badge, i) => (
                    <div key={i}>Week {badge.week}: {badge.name} ({badge.xp} XP)</div>
                  ))}
                </div>
              </details>
            )}
            
            {report.xpHistory && report.xpHistory.length > 0 && (
              <details style={{ marginTop: '8px' }}>
                <summary>Recent XP History</summary>
                <div style={{ fontSize: '11px', paddingLeft: '8px' }}>
                  {report.xpHistory.slice(-10).map((entry, i) => (
                    <div key={i}>
                      {new Date(entry.timestamp).toLocaleDateString()}: 
                      +{entry.amount} XP ({entry.type})
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </details>
      </div>
    );
  };
  
  return (
    <div style={{
      backgroundColor: '#F5F5F5',
      borderRadius: '12px',
      padding: '16px',
      marginTop: '16px'
    }}>
      <h4 style={{ margin: '0 0 12px 0' }}>🔧 XP Diagnostics</h4>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button 
          onClick={handleAudit}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? '⏳' : '🔍'} Audit XP
        </button>
        
        <button 
          onClick={handleReconcile}
          disabled={loading || !auditReport || auditReport.difference === 0}
          style={{
            padding: '8px 16px',
            backgroundColor: auditReport?.difference !== 0 ? '#FF9800' : '#999',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: (loading || !auditReport || auditReport.difference === 0) ? 'not-allowed' : 'pointer',
            opacity: (loading || !auditReport) ? 0.7 : 1
          }}
        >
          {loading ? '⏳' : '🔧'} Reconcile XP
        </button>
      </div>
      
      {formatAuditReport(auditReport)}
    </div>
  );
}