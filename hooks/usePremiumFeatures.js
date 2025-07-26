// hooks/usePremiumFeatures.js - Premium features logic for parents
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export const usePremiumFeatures = () => {
  const { user, userProfile } = useAuth()
  const [premiumStatus, setPremiumStatus] = useState({
    loading: true,
    isPremium: false,
    isTrialUser: false,
    subscriptionTier: 'basic', // 'basic', 'premium'
    trialEndDate: null,
    features: {
      healthyHabits: false,
      familyBattle: false,
      dnaLab: false, // ADD THIS LINE
      advancedAnalytics: false,
      customGoals: false
    }
  })

  // Check premium status
  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user?.uid || userProfile?.accountType !== 'parent') {
        setPremiumStatus(prev => ({ ...prev, loading: false }))
        return
      }

      try {
        // Get parent's subscription data
        const parentRef = doc(db, 'parents', user.uid)
        const parentDoc = await getDoc(parentRef)
        
        if (!parentDoc.exists()) {
          setPremiumStatus(prev => ({ ...prev, loading: false }))
          return
        }

        const parentData = parentDoc.data()
        
        // PILOT LOGIC: Everyone gets premium features for free during pilot
        const isPilotPhase = true // Set to false when pilot ends
        
        let isPremium = false
        let isTrialUser = false
        let subscriptionTier = 'basic'
        
        if (isPilotPhase) {
          // During pilot: everyone gets premium
          isPremium = true
          isTrialUser = true
          subscriptionTier = 'premium'
        } else {
          // Post-pilot logic (for future use)
          const subscription = parentData.subscription || {}
          isPremium = subscription.status === 'active' && subscription.tier === 'premium'
          subscriptionTier = subscription.tier || 'basic'
          
          // Check if they have a trial
          if (subscription.trialEndDate) {
            const trialEnd = subscription.trialEndDate.toDate()
            isTrialUser = new Date() < trialEnd
            if (isTrialUser) isPremium = true
          }
        }

        // Define feature access
        const features = {
          healthyHabits: isPremium,
          familyBattle: isPremium,
          dnaLab: isPremium, // ADD THIS LINE
          advancedAnalytics: isPremium,
          customGoals: isPremium
        }

        setPremiumStatus({
          loading: false,
          isPremium,
          isTrialUser,
          subscriptionTier,
          trialEndDate: parentData.subscription?.trialEndDate?.toDate() || null,
          features,
          isPilotPhase // Include this for UI messaging
        })

      } catch (error) {
        console.error('Error checking premium status:', error)
        setPremiumStatus(prev => ({ ...prev, loading: false }))
      }
    }

    checkPremiumStatus()
  }, [user?.uid, userProfile?.accountType])

  // Helper functions
  const hasFeature = (featureName) => {
    return premiumStatus.features[featureName] || false
  }

  const requiresPremium = (featureName) => {
    return !premiumStatus.features[featureName]
  }

  const getPremiumMessage = (featureName) => {
    if (premiumStatus.isPilotPhase) {
      return "This premium feature is unlocked for all pilot users! 🎉"
    }
    
    if (premiumStatus.isTrialUser) {
      const daysLeft = Math.ceil((premiumStatus.trialEndDate - new Date()) / (1000 * 60 * 60 * 24))
      return `Premium trial: ${daysLeft} days remaining`
    }
    
    return "Upgrade to Premium to unlock this feature"
  }

  const getUpgradeInfo = () => {
    if (premiumStatus.isPilotPhase) {
      return {
        title: "Premium Features Unlocked!",
        message: "You're part of our pilot program - all premium features are free during the trial period.",
        action: null,
        price: "$0.00"
      }
    }
    
    return {
      title: "Upgrade to Premium",
      message: "Unlock advanced family reading features for just $10/year",
      action: "upgrade",
      price: "$10.00/year"
    }
  }

  return {
    ...premiumStatus,
    hasFeature,
    requiresPremium,
    getPremiumMessage,
    getUpgradeInfo
  }
}