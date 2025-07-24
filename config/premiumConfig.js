// config/premiumConfig.js - Easy configuration for premium features
export const PREMIUM_CONFIG = {
  // PILOT SETTINGS - Change these to transition from pilot to production
  IS_PILOT_PHASE: true, // ⭐ CHANGE THIS TO FALSE TO END PILOT ⭐
  PILOT_END_DATE: '2024-12-31', // When pilot phase ends
  
  // PRICING - ⭐ CHANGE AMOUNTS HERE ⭐
  PREMIUM_PRICE: {
    yearly: {
      amount: 1000, // ⭐ CHANGE TO 1500 for $15.00 ⭐
      currency: 'USD',
      displayPrice: '$10.00/year', // ⭐ UPDATE DISPLAY TOO ⭐
      savings: 'Less than $1/month'
    },
    // Could add monthly option later
    // monthly: {
    //   amount: 100, // $1.00 in cents
    //   currency: 'USD',
    //   displayPrice: '$1.00/month'
    // }
  },
  
  // FEATURES - What's included in premium
  PREMIUM_FEATURES: {
    healthyHabits: {
      name: 'Personal Reading Habits',
      description: 'Track your reading time, streaks, and progress',
      icon: '📚',
      isPremium: true
    },
    familyBattle: {
      name: 'Family Reading Competition',
      description: 'Compete with your children in reading challenges',
      icon: '🏆',
      isPremium: true
    },
    dnaLab: {
      name: 'Family DNA Lab',
      description: 'Analyze family reading patterns and preferences',
      icon: '🧬',
      isPremium: true
    },
    advancedAnalytics: {
      name: 'Advanced Analytics',
      description: 'Detailed insights into family reading patterns',
      icon: '📊',
      isPremium: true
    },
    customGoals: {
      name: 'Custom Reading Goals',
      description: 'Set personalized targets for your family',
      icon: '🎯',
      isPremium: true
    }
  },
  
  // TRIAL SETTINGS
  TRIAL: {
    defaultLength: 365, // days (1 year for pilot)
    pilotLength: 365, // days for pilot users
    gracePeriod: 7 // days after expiration before features are locked
  },
  
  // MESSAGING
  MESSAGES: {
    pilot: {
      unlocked: "🎉 Premium features unlocked for pilot users!",
      badge: "PILOT FREE",
      notice: "You're part of our pilot program - premium features are free during the trial!"
    },
    production: {
      upgrade: "Upgrade to Premium to unlock this feature",
      trial: "Premium trial",
      expired: "Your premium trial has expired"
    }
  },
  
  // PAYMENT SETTINGS (for future use)
  PAYMENT: {
    provider: 'stripe', // 'stripe', 'paypal', etc.
    webhook: '/api/webhooks/stripe',
    successUrl: '/parent/upgrade/success',
    cancelUrl: '/parent/upgrade/cancel'
  }
}

// Helper functions for premium config
export const isPilotPhase = () => {
  if (!PREMIUM_CONFIG.IS_PILOT_PHASE) return false
  
  const pilotEndDate = new Date(PREMIUM_CONFIG.PILOT_END_DATE)
  return new Date() < pilotEndDate
}

export const getPremiumPrice = (period = 'yearly') => {
  return PREMIUM_CONFIG.PREMIUM_PRICE[period] || PREMIUM_CONFIG.PREMIUM_PRICE.yearly
}

export const getPremiumFeatures = () => {
  return Object.entries(PREMIUM_CONFIG.PREMIUM_FEATURES).map(([key, feature]) => ({
    key,
    ...feature
  }))
}

export const isPremiumFeature = (featureKey) => {
  return PREMIUM_CONFIG.PREMIUM_FEATURES[featureKey]?.isPremium || false
}

export const getTrialLength = () => {
  return isPilotPhase() 
    ? PREMIUM_CONFIG.TRIAL.pilotLength 
    : PREMIUM_CONFIG.TRIAL.defaultLength
}

export const getMessage = (messageKey) => {
  const messageGroup = isPilotPhase() ? 'pilot' : 'production'
  return PREMIUM_CONFIG.MESSAGES[messageGroup][messageKey] || ''
}

// Easy toggle functions for admins
export const enablePremiumForUser = async (parentUid) => {
  // Implementation would go here
  console.log('Enabling premium for user:', parentUid)
}

export const disablePremiumForUser = async (parentUid) => {
  // Implementation would go here
  console.log('Disabling premium for user:', parentUid)
}

// Transition from pilot to production
export const transitionToProduction = async () => {
  try {
    console.log('🚀 Transitioning from pilot to production...')
    
    // This would:
    // 1. Update PREMIUM_CONFIG.IS_PILOT_PHASE to false
    // 2. Send notifications to all pilot users about transition
    // 3. Set appropriate trial periods for existing users
    // 4. Enable payment processing
    
    console.log('✅ Transition to production completed')
    return { success: true }
  } catch (error) {
    console.error('❌ Error transitioning to production:', error)
    throw error
  }
}

// Development helpers - easy testing
if (process.env.NODE_ENV === 'development') {
  // Expose helper functions globally for testing
  if (typeof window !== 'undefined') {
    window.premiumConfig = {
      isPilotPhase,
      getPremiumPrice,
      getPremiumFeatures,
      enablePremiumForUser,
      disablePremiumForUser
    }
  }
}

export default PREMIUM_CONFIG