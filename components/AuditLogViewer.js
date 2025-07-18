// components/AuditLogViewer.js - Admin component to view account deletion logs
import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'student', 'parent', 'teacher'
  const [timeRange, setTimeRange] = useState('7'); // days

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError('');

      // Calculate date range
      const now = new Date();
      const daysAgo = new Date(now.getTime() - (parseInt(timeRange) * 24 * 60 * 60 * 1000));

      // Build query
      let logsQuery = query(
        collection(db, 'accountDeletionLogs'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      // Add account type filter if not 'all'
      if (filter !== 'all') {
        logsQuery = query(
          collection(db, 'accountDeletionLogs'),
          where('accountType', '==', filter),
          orderBy('timestamp', 'desc'),
          limit(100)
        );
      }

      const snapshot = await getDocs(logsQuery);
      const auditLogs = [];

      snapshot.forEach(doc => {
        const logData = doc.data();
        const logDate = logData.timestamp?.toDate?.() || new Date(logData.timestamp);
        
        // Filter by time range
        if (logDate >= daysAgo) {
          auditLogs.push({
            id: doc.id,
            ...logData,
            timestamp: logDate
          });
        }
      });

      setLogs(auditLogs);
      console.log(`✅ Loaded ${auditLogs.length} audit logs`);

    } catch (error) {
      console.error('❌ Error loading audit logs:', error);
      setError('Failed to load audit logs: ' + error.message);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadAuditLogs();
  }, [filter, timeRange]);

  const getAccountTypeColor = (accountType) => {
    switch (accountType) {
      case 'student': return '#3B82F6'; // Blue
      case 'parent': return '#10B981'; // Green  
      case 'teacher': return '#F59E0B'; // Orange
      case 'admin': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  };

  const getAccountTypeIcon = (accountType) => {
    switch (accountType) {
      case 'student': return '🎓';
      case 'parent': return '👨‍👩‍👧‍👦';
      case 'teacher': return '👩‍🏫';
      case 'admin': return '👨‍💼';
      default: return '👤';
    }
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const exportLogs = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalLogs: logs.length,
      filters: { accountType: filter, timeRange: timeRange + ' days' },
      logs: logs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        accountType: log.accountType,
        accountId: log.accountId,
        userEmail: log.userEmail,
        reason: log.reason,
        deletedBy: log.deletedBy,
        academicYear: log.academicYear
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lux-libris-audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      maxWidth: '1000px',
      margin: '0 auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#1F2937',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📋 Account Deletion Audit Logs
        </h2>
        
        <button
          onClick={exportLogs}
          disabled={logs.length === 0}
          style={{
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: logs.length === 0 ? 'not-allowed' : 'pointer',
            opacity: logs.length === 0 ? 0.5 : 1
          }}
        >
          📦 Export Logs
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '4px'
          }}>
            Account Type
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="all">All Types</option>
            <option value="student">Students</option>
            <option value="parent">Parents</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
        
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '4px'
          }}>
            Time Range
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
        
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '4px'
          }}>
            Actions
          </label>
          <button
            onClick={loadAuditLogs}
            disabled={loading}
            style={{
              backgroundColor: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          backgroundColor: '#FEE2E2',
          border: '1px solid #FCA5A5',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px',
          color: '#DC2626'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Summary stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1F2937' }}>
            {logs.length}
          </div>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>
            Total Deletions
          </div>
        </div>
        
        <div style={{
          backgroundColor: '#EBF8FF',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3B82F6' }}>
            {logs.filter(log => log.accountType === 'student').length}
          </div>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>
            Students
          </div>
        </div>
        
        <div style={{
          backgroundColor: '#ECFDF5',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>
            {logs.filter(log => log.accountType === 'parent').length}
          </div>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>
            Parents
          </div>
        </div>
        
        <div style={{
          backgroundColor: '#FFFBEB',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F59E0B' }}>
            {logs.filter(log => log.accountType === 'teacher').length}
          </div>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>
            Teachers
          </div>
        </div>
      </div>

      {/* Logs table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #E5E7EB',
            borderTop: '3px solid #3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6B7280' }}>Loading audit logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6B7280'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <p>No deletion logs found for the selected criteria.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                  Timestamp
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                  Account Type
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                  Email
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                  Reason
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                  Academic Year
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: '1px solid #E5E7EB',
                    backgroundColor: index % 2 === 0 ? 'white' : '#F9FAFB'
                  }}
                >
                  <td style={{ padding: '12px', color: '#374151' }}>
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: getAccountTypeColor(log.accountType) + '20',
                      color: getAccountTypeColor(log.accountType),
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {getAccountTypeIcon(log.accountType)} {log.accountType}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#374151', fontFamily: 'monospace' }}>
                    {log.userEmail}
                  </td>
                  <td style={{ padding: '12px', color: '#6B7280' }}>
                    {log.reason}
                  </td>
                  <td style={{ padding: '12px', color: '#6B7280' }}>
                    {log.academicYear}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}