// lib/premiumHelpers.js - Database functions for premium features
import { doc, updateDoc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore'
import { db } from './firebase'

// Initialize parent with premium trial (for pilot users)
export const initializePremiumTrial = async (parentUid) => {
  try {
    const parentRef = doc(db, 'parents', parentUid)
    
    // Give 1 year free trial for pilot users
    const trialEndDate = new Date()
    trialEndDate.setFullYear(trialEndDate.getFullYear() + 1)
    
    const subscriptionData = {
      subscription: {
        tier: 'premium',
        status: 'trial', // 'trial', 'active', 'expired', 'cancelled'
        billingPeriod: 'yearly',
        trialEndDate: trialEndDate,
        features: {
          healthyHabits: true,
          familyBattle: true,
          advancedAnalytics: true,
          customGoals: true
        },
        isPilotUser: true, // Mark as pilot user
        createdAt: new Date(),
        lastUpdated: new Date()
      }
    }
    
    await updateDoc(parentRef, subscriptionData)
    console.log('✅ Premium trial initialized for pilot user')
    
    return { success: true, trialEndDate }
  } catch (error) {
    console.error('❌ Error initializing premium trial:', error)
    throw error
  }
}

// Create premium subscription (for when payment is implemented)
export const createPremiumSubscription = async (parentUid, paymentData) => {
  try {
    const parentRef = doc(db, 'parents', parentUid)
    
    const subscriptionData = {
      subscription: {
        tier: 'premium',
        status: 'active',
        billingPeriod: 'yearly',
        amount: 1000, // $10.00 in cents
        currency: 'USD',
        startDate: new Date(),
        renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        features: {
          healthyHabits: true,
          familyBattle: true,
          advancedAnalytics: true,
          customGoals: true
        },
        paymentMethod: {
          // Store payment method details (safely)
          last4: paymentData.last4,
          brand: paymentData.brand,
          expiresAt: paymentData.expiresAt
        },
        stripeSubscriptionId: paymentData.stripeSubscriptionId, // If using Stripe
        isPilotUser: false,
        createdAt: new Date(),
        lastUpdated: new Date()
      }
    }
    
    await updateDoc(parentRef, subscriptionData)
    
    // Log the subscription for analytics
    await addDoc(collection(db, 'subscriptionLogs'), {
      parentUid,
      action: 'subscription_created',
      tier: 'premium',
      amount: 1000,
      timestamp: new Date()
    })
    
    console.log('✅ Premium subscription created')
    return { success: true }
  } catch (error) {
    console.error('❌ Error creating premium subscription:', error)
    throw error
  }
}

// Cancel premium subscription
export const cancelPremiumSubscription = async (parentUid, reason = 'user_requested') => {
  try {
    const parentRef = doc(db, 'parents', parentUid)
    const parentDoc = await getDoc(parentRef)
    
    if (!parentDoc.exists()) {
      throw new Error('Parent not found')
    }
    
    const parentData = parentDoc.data()
    const subscription = parentData.subscription || {}
    
    // Update subscription status
    const updatedSubscription = {
      ...subscription,
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: reason,
      // Keep access until current billing period ends
      accessExpiresAt: subscription.renewalDate || new Date(),
      lastUpdated: new Date()
    }
    
    await updateDoc(parentRef, {
      subscription: updatedSubscription
    })
    
    // Log the cancellation
    await addDoc(collection(db, 'subscriptionLogs'), {
      parentUid,
      action: 'subscription_cancelled',
      reason,
      timestamp: new Date()
    })
    
    console.log('✅ Premium subscription cancelled')
    return { success: true }
  } catch (error) {
    console.error('❌ Error cancelling subscription:', error)
    throw error
  }
}

// Check if subscription needs renewal
export const checkSubscriptionRenewal = async (parentUid) => {
  try {
    const parentDoc = await getDoc(doc(db, 'parents', parentUid))
    
    if (!parentDoc.exists()) {
      return { needsRenewal: false }
    }
    
    const parentData = parentDoc.data()
    const subscription = parentData.subscription || {}
    
    if (!subscription.renewalDate) {
      return { needsRenewal: false }
    }
    
    const now = new Date()
    const renewalDate = subscription.renewalDate.toDate()
    const daysUntilRenewal = Math.ceil((renewalDate - now) / (1000 * 60 * 60 * 24))
    
    return {
      needsRenewal: daysUntilRenewal <= 7 && daysUntilRenewal > 0,
      daysUntilRenewal,
      renewalDate,
      isExpired: now > renewalDate,
      subscription
    }
  } catch (error) {
    console.error('❌ Error checking subscription renewal:', error)
    return { needsRenewal: false }
  }
}

// Get subscription analytics for admin
export const getSubscriptionAnalytics = async () => {
  try {
    // This would query subscription logs and parent documents
    // to provide analytics on premium subscriptions
    
    // Example structure - implement based on your needs
    const analytics = {
      totalSubscribers: 0,
      trialUsers: 0,
      activeSubscribers: 0,
      cancelledSubscribers: 0,
      monthlyRevenue: 0,
      churnRate: 0,
      popularFeatures: {
        healthyHabits: 0,
        familyBattle: 0
      }
    }
    
    return analytics
  } catch (error) {
    console.error('❌ Error getting subscription analytics:', error)
    throw error
  }
}

// Database schema examples for reference:

/*
// Parent document structure with subscription:
{
  uid: "parent_uid",
  email: "parent@example.com",
  firstName: "John",
  lastName: "Doe",
  
  subscription: {
    tier: "premium", // "basic", "premium"
    status: "active", // "trial", "active", "expired", "cancelled"
    billingPeriod: "yearly", // "monthly", "yearly"
    amount: 1000, // in cents
    currency: "USD",
    
    startDate: Timestamp,
    renewalDate: Timestamp,
    trialEndDate: Timestamp, // for trial users
    cancelledAt: Timestamp, // if cancelled
    
    features: {
      healthyHabits: true,
      familyBattle: true,
      advancedAnalytics: true,
      customGoals: true
    },
    
    paymentMethod: {
      last4: "4242",
      brand: "visa",
      expiresAt: "12/25"
    },
    
    stripeSubscriptionId: "sub_1234567890",
    isPilotUser: true, // for pilot users
    
    createdAt: Timestamp,
    lastUpdated: Timestamp
  }
}

// Subscription log document structure:
{
  parentUid: "parent_uid",
  action: "subscription_created", // "created", "cancelled", "renewed", "upgraded"
  tier: "premium",
  amount: 1000,
  timestamp: Timestamp,
  metadata: {
    // Additional context
  }
}
*/