// components/PhaseAwareMessage.js
export default function PhaseAwareMessage({ 
  currentPhase, 
  lockedFeature, 
  customMessage,
  showActions = false,
  onActionClick 
}) {
  const getPhaseConfig = (phase) => {
    switch (phase) {
      case 'SETUP':
        return {
          icon: '📝',
          color: '#F59E0B',
          bgColor: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
          title: 'System Setup',
          defaultMessage: 'Setting up for the new academic year'
        };
      case 'TEACHER_SELECTION':
        return {
          icon: '👩‍🏫',
          color: '#3B82F6',
          bgColor: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
          title: 'Teacher Selection Period',
          defaultMessage: 'Teachers are selecting books for the new academic year'
        };
      case 'ACTIVE':
        return {
          icon: '📚',
          color: '#10B981',
          bgColor: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
          title: 'Active Reading',
          defaultMessage: 'Reading program is active'
        };
      case 'VOTING':
        return {
          icon: '🗳️',
          color: '#8B5CF6',
          bgColor: 'linear-gradient(135deg, #F3E8FF, #E9D5FF)',
          title: 'Voting Period',
          defaultMessage: 'Students are voting for their favorites'
        };
      case 'RESULTS':
        return {
          icon: '🏆',
          color: '#F59E0B',
          bgColor: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
          title: 'Results Available',
          defaultMessage: 'Voting results are now available'
        };
      case 'CLOSED':
        return {
          icon: '❄️',
          color: '#6B7280',
          bgColor: 'linear-gradient(135deg, #F9FAFB, #F3F4F6)',
          title: 'Program Closed',
          defaultMessage: 'Taking a break between school years'
        };
      default:
        return {
          icon: '📋',
          color: '#6B7280',
          bgColor: 'linear-gradient(135deg, #F9FAFB, #F3F4F6)',
          title: 'Status Unknown',
          defaultMessage: 'Program status unknown'
        };
    }
  };

  const config = getPhaseConfig(currentPhase);
  
  return (
    <div style={{
      background: config.bgColor,
      borderRadius: '1rem',
      padding: '1.5rem',
      margin: '1rem 0',
      textAlign: 'center',
      border: `2px solid ${config.color}60`
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        {config.icon}
      </div>
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: config.color,
        marginBottom: '0.5rem'
      }}>
        {config.title}
      </h3>
      <p style={{
        fontSize: '0.875rem',
        color: config.color,
        margin: showActions ? '0 0 1rem 0' : 0
      }}>
        {customMessage || config.defaultMessage}
      </p>
      
      {showActions && onActionClick && (
        <button
          onClick={onActionClick}
          style={{
            background: config.color,
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Take Action
        </button>
      )}
    </div>
  );
}