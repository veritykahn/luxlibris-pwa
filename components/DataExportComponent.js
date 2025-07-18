// components/DataExportComponent.js
import React, { useState } from 'react';

const DataExportComponent = ({ 
  accountType = 'student', // 'student' or 'parent'
  studentData = null,
  parentData = null,
  onExportComplete = () => {},
  theme = {
    primary: '#ADD4EA',
    secondary: '#C3E0DE',
    surface: '#FFFFFF',
    textPrimary: '#223848',
    textSecondary: '#556B7A'
  }
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState('');
  const [exportError, setExportError] = useState('');

  const downloadJsonFile = (data, filename) => {
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportStudentData = () => {
    if (!studentData) {
      setExportError('No student data available to export');
      return null;
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      accountType: 'student',
      personalInfo: {
        firstName: studentData.firstName,
        lastInitial: studentData.lastInitial,
        grade: studentData.grade,
        displayUsername: studentData.displayUsername,
        schoolName: studentData.schoolName,
        joinedDate: studentData.createdAt || 'Unknown'
      },
      readingData: {
        bookshelf: studentData.bookshelf || [],
        booksSubmittedThisYear: studentData.booksSubmittedThisYear || 0,
        personalGoal: studentData.personalGoal || 0,
        votes: studentData.votes || [],
        readingSettings: studentData.readingSettings || {}
      },
      achievements: {
        badges: studentData.badges || [],
        unlockedSaints: studentData.unlockedSaints || [],
        totalXP: studentData.totalXP || 0,
        lifetimeBooksSubmitted: studentData.lifetimeBooksSubmitted || 0
      },
      preferences: {
        selectedTheme: studentData.selectedTheme || 'classic_lux',
        notificationSettings: studentData.notificationSettings || {}
      }
    };

    const filename = `lux-libris-student-${studentData.firstName}-${studentData.lastInitial}-${new Date().toISOString().split('T')[0]}.json`;
    
    return { data: JSON.stringify(exportData, null, 2), filename };
  };

  const exportParentData = () => {
    if (!parentData) {
      setExportError('No parent data available to export');
      return null;
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      accountType: 'parent',
      personalInfo: {
        firstName: parentData.firstName,
        lastName: parentData.lastName,
        email: parentData.email,
        joinedDate: parentData.createdAt || 'Unknown'
      },
      familyInfo: {
        familyName: parentData.familyName || '',
        linkedStudents: parentData.linkedStudents || [],
        linkedStudentCount: (parentData.linkedStudents || []).length
      },
      teacherCodes: {
        savedQuizCodes: parentData.savedQuizCodes || [],
        quizApprovalsGiven: parentData.quizApprovalsGiven || 0
      }
    };

    const filename = `lux-libris-parent-${parentData.firstName}-${parentData.lastName}-${new Date().toISOString().split('T')[0]}.json`;
    
    return { data: JSON.stringify(exportData, null, 2), filename };
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportError('');
    setExportSuccess('');

    try {
      let exportResult = null;

      if (accountType === 'student') {
        exportResult = exportStudentData();
      } else if (accountType === 'parent') {
        exportResult = exportParentData();
      }

      if (!exportResult) {
        throw new Error('Failed to prepare export data');
      }

      // Download the file
      downloadJsonFile(exportResult.data, exportResult.filename);
      
      setExportSuccess(`✅ Data exported successfully as ${exportResult.filename}`);
      onExportComplete(exportResult);
      
    } catch (error) {
      console.error('Export error:', error);
      setExportError(`Failed to export data: ${error.message}`);
    }
    
    setIsExporting(false);
  };

  const getExportDescription = () => {
    if (accountType === 'student') {
      return {
        title: '📦 Export Your Reading Data',
        description: 'Download a complete copy of your reading progress, achievements, and account settings.',
        includes: [
          'Personal information (name, grade, username)',
          'Complete bookshelf and reading progress',
          'All achievements, badges, and unlocked saints',
          'Reading goals and session settings',
          'Theme preferences and account settings'
        ]
      };
    } else {
      return {
        title: '📦 Export Your Family Data',
        description: 'Download a complete copy of your family account information and connected children.',
        includes: [
          'Parent profile information',
          'Family settings and preferences',
          'Connected children information',
          'Teacher quiz codes and approvals',
          'Account creation and activity history'
        ]
      };
    }
  };

  const exportInfo = getExportDescription();

  return (
    <div style={{
      backgroundColor: theme.surface,
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: `2px solid ${theme.primary}30`
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: theme.textPrimary,
        margin: '0 0 12px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {exportInfo.title}
      </h3>
      
      <p style={{
        fontSize: '14px',
        color: theme.textSecondary,
        margin: '0 0 16px 0',
        lineHeight: '1.5'
      }}>
        {exportInfo.description}
      </p>

      {/* What's included */}
      <div style={{
        backgroundColor: `${theme.primary}10`,
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: theme.textPrimary,
          marginBottom: '8px'
        }}>
          📋 Your export will include:
        </div>
        <ul style={{
          margin: 0,
          paddingLeft: '16px',
          fontSize: '12px',
          color: theme.textSecondary,
          lineHeight: '1.4'
        }}>
          {exportInfo.includes.map((item, index) => (
            <li key={index} style={{ marginBottom: '2px' }}>{item}</li>
          ))}
        </ul>
      </div>

      {/* Privacy notice */}
      <div style={{
        backgroundColor: '#E6FFFA',
        border: '1px solid #81E6D9',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '16px'
      }}>
        <p style={{
          margin: 0,
          fontSize: '12px',
          color: '#065F46',
          lineHeight: '1.4'
        }}>
          🔒 <strong>Privacy Note:</strong> Your exported data is downloaded directly to your device. 
          Lux Libris does not store or transmit your data elsewhere during this process.
        </p>
      </div>

      {/* Export button */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleExport}
          disabled={isExporting}
          style={{
            backgroundColor: theme.primary,
            color: theme.textPrimary,
            border: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: isExporting ? 'wait' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: isExporting ? 0.7 : 1,
            minWidth: '140px'
          }}
          onMouseEnter={(e) => {
            if (!isExporting) {
              e.target.style.backgroundColor = theme.secondary;
            }
          }}
          onMouseLeave={(e) => {
            if (!isExporting) {
              e.target.style.backgroundColor = theme.primary;
            }
          }}
        >
          {isExporting ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid transparent',
                borderTop: '2px solid currentColor',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Exporting...
            </span>
          ) : (
            '📦 Export My Data'
          )}
        </button>
      </div>

      {/* Success message */}
      {exportSuccess && (
        <div style={{
          marginTop: '16px',
          backgroundColor: `${theme.primary}20`,
          border: `1px solid ${theme.primary}`,
          borderRadius: '8px',
          padding: '12px',
          fontSize: '14px',
          color: '#065f46',
          textAlign: 'center'
        }}>
          {exportSuccess}
        </div>
      )}

      {/* Error message */}
      {exportError && (
        <div style={{
          marginTop: '16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '14px',
          color: '#dc2626',
          textAlign: 'center'
        }}>
          ❌ {exportError}
        </div>
      )}

      {/* File format info */}
      <div style={{
        marginTop: '16px',
        fontSize: '11px',
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: '1.4'
      }}>
        💾 Data is exported as a JSON file that can be opened with any text editor or imported into other applications.
        <br />
        📅 Export includes data as of {new Date().toLocaleDateString()}.
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DataExportComponent;