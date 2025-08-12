// lib/book-state-utils.js
export const getBookState = (book) => {
  const now = new Date();
  
  if (book.completed && book.status === 'completed') {
    return 'completed';
  }
  
  if (book.status === 'quiz_unlocked') {
    return 'quiz_unlocked';
  }
  
  if (book.status === 'pending_approval') {
    return 'pending_admin_approval';
  }
  
  if (book.status === 'pending_parent_quiz_unlock') {
    return 'pending_parent_quiz_unlock';
  }
  
  if (book.status === 'revision_requested' && book.revisionRequestedAt) {
    const revisionTime = book.revisionRequestedAt?.toDate ? book.revisionRequestedAt.toDate() : new Date(book.revisionRequestedAt);
    const cooldownEnd = new Date(revisionTime.getTime() + 24 * 60 * 60 * 1000);
    if (now < cooldownEnd) {
      return 'revision_cooldown';
    } else {
      return 'revision_ready';
    }
  }
  
  if (book.status === 'quiz_failed' && book.failedAt) {
    const failedTime = book.failedAt?.toDate ? book.failedAt.toDate() : new Date(book.failedAt);
    const cooldownEnd = new Date(failedTime.getTime() + 24 * 60 * 60 * 1000);
    if (now < cooldownEnd) {
      return 'quiz_cooldown';
    }
  }
  
  if (book.status === 'admin_rejected' && book.rejectedAt) {
    const rejectedTime = book.rejectedAt?.toDate ? book.rejectedAt.toDate() : new Date(book.rejectedAt);
    const cooldownEnd = new Date(rejectedTime.getTime() + 24 * 60 * 60 * 1000);
    if (now < cooldownEnd) {
      return 'admin_cooldown';
    }
  }
  
  return 'in_progress';
};

export const getBookStateMessage = (book) => {
  const state = getBookState(book);
  const now = new Date();
  
  switch (state) {
    case 'completed':
      return { 
        message: book.teacherNotes 
          ? `🎉 Approved! ${book.teacherNotes}` 
          : '🎉 Book completed!', 
        color: '#4CAF50' 
      };
    
    case 'quiz_unlocked':
      return { message: '🎉 Quiz unlocked! Go to bookshelf to take it.', color: '#4CAF50' };
    
    case 'pending_admin_approval':
      return { message: '⏳ Waiting for teacher approval', color: '#FF9800' };
    
    case 'pending_parent_quiz_unlock':
      return { message: '🔒 Waiting for parent to unlock quiz', color: '#2196F3' };
    
    case 'revision_cooldown':
      if (book.revisionRequestedAt) {
        const revisionTime = book.revisionRequestedAt?.toDate ? book.revisionRequestedAt.toDate() : new Date(book.revisionRequestedAt);
        const cooldownEnd = new Date(revisionTime.getTime() + 24 * 60 * 60 * 1000);
        const hoursLeft = Math.ceil((cooldownEnd - now) / (1000 * 60 * 60));
        const baseMessage = `📝 Revisions requested - try again in ${hoursLeft} hours`;
        return { 
          message: book.teacherNotes ? `${baseMessage}: ${book.teacherNotes}` : baseMessage, 
          color: '#FF9800' 
        };
      }
      break;
    
    case 'revision_ready':
      const baseMessage = '✏️ Ready to resubmit - check bookshelf';
      return { 
        message: book.teacherNotes ? `${baseMessage}: ${book.teacherNotes}` : baseMessage, 
        color: '#2196F3' 
      };
    
    case 'quiz_cooldown':
      if (book.failedAt) {
        const failedTime = book.failedAt?.toDate ? book.failedAt.toDate() : new Date(book.failedAt);
        const cooldownEnd = new Date(failedTime.getTime() + 24 * 60 * 60 * 1000);
        const hoursLeft = Math.ceil((cooldownEnd - now) / (1000 * 60 * 60));
        return { message: `❌ Quiz failed - try again in ${hoursLeft} hours`, color: '#F44336' };
      }
      break;
    
    case 'admin_cooldown':
      if (book.rejectedAt) {
        const rejectedTime = book.rejectedAt?.toDate ? book.rejectedAt.toDate() : new Date(book.rejectedAt);
        const cooldownEnd = new Date(rejectedTime.getTime() + 24 * 60 * 60 * 1000);
        const hoursLeft = Math.ceil((cooldownEnd - now) / (1000 * 60 * 60));
        return { message: `⏳ Resubmit in ${hoursLeft} hours`, color: '#FF5722' };
      }
      break;
    
    default:
      return null;
  }
};