// lib/pricing-config.js - FIXED VERSION with proper program integration
export const PRICING_CONFIG = {
  // Single school base price
  singleSchool: 495,
  
  // Tier definitions with sustainable margins - MATCHES IMPLEMENTATION GUIDE
  tiers: {
    starter: {
      minSchools: 2,
      maxSchools: 3,
      perSchoolPrice: 475,
      discount: 0.04, // 4%
      description: 'Starter Diocese',
      displayName: 'Starter',
      color: '#10B981',
      programs: {
        included: 1,
        max: 2,
        extraCost: 150 // Cost per additional program
      }
    },
    small: {
      minSchools: 4,
      maxSchools: 7,
      perSchoolPrice: 460,
      discount: 0.07, // 7%
      description: 'Small Diocese',
      displayName: 'Small',
      color: '#3B82F6',
      programs: {
        included: 1,
        max: 3,
        extraCost: 150
      }
    },
    medium: {
      minSchools: 8,
      maxSchools: 15,
      perSchoolPrice: 445,
      discount: 0.10, // 10%
      description: 'Medium Diocese',
      displayName: 'Medium',
      color: '#8B5CF6',
      programs: {
        included: 2,
        max: 3,
        extraCost: 150
      }
    },
    large: {
      minSchools: 16,
      maxSchools: 25,
      perSchoolPrice: 425,
      discount: 0.14, // 14%
      description: 'Large Diocese',
      displayName: 'Large', 
      color: '#EC4899',
      programs: {
        included: 2,
        max: 4,
        extraCost: 150
      }
    },
    xlarge: {
      minSchools: 26,
      maxSchools: 40,
      perSchoolPrice: 405,
      discount: 0.18, // 18%
      description: 'Extra Large Diocese',
      displayName: 'XLarge',
      color: '#F59E0B',
      programs: {
        included: 3,
        max: 4,
        extraCost: 150
      }
    },
    enterprise: {
      minSchools: 41,
      maxSchools: 60,
      perSchoolPrice: 385,
      discount: 0.22, // 22%
      description: 'Enterprise Diocese',
      displayName: 'Enterprise',
      color: '#EF4444',
      programs: {
        included: 3,
        max: 5,
        extraCost: 150
      }
    },
    unlimited: {
      minSchools: 61,
      maxSchools: 999,
      perSchoolPrice: 370,
      discount: 0.25, // 25% MAX
      description: 'Unlimited Diocese',
      displayName: 'Unlimited',
      color: '#6366F1',
      programs: {
        included: 4,
        max: 999,
        extraCost: 150
      }
    }
  },
  
  // Overage rules - MATCHES IMPLEMENTATION GUIDE
  overage: {
    graceSchools: 1,         // Allow 1 extra school free
    softLimitPercent: 0.10,  // 10% overage = warning
    hardLimitPercent: 0.20,  // 20% overage = must upgrade
    overageRate: 495,        // Full price per extra school
    enforceHardLimit: false  // Set true when payments go live
  },
  
  // Billing configuration
  billing: {
    manualProcessing: true,   // Use God Mode for billing
    requiresContract: true,   // Contract needed before activation
    invoiceTerms: 30,         // Days to pay
    acceptedMethods: ['check', 'wire', 'card', 'po'],
    statuses: {
      pending_contract: 'Pending Contract',
      pending_payment: 'Pending Payment', 
      trial: 'Trial Period',
      active: 'Active',
      grace_period: 'Grace Period',
      suspended: 'Suspended',
      cancelled: 'Cancelled'
    }
  },
  
  // Contract terms
  contractTerms: {
    defaultLength: 12,        // months
    autoRenew: true,
    renewalNotice: 60,        // days before expiry
    earlyRenewalDiscount: 0.05, // 5% for renewing 60+ days early
    multiYearDiscount: 0.05,     // 5% per additional year (max 3)
    paymentTerms: {
      annual: 0,              // No surcharge
      semester: 0.05,         // 5% surcharge
      quarterly: 0.08,        // 8% surcharge  
      monthly: 0.10           // 10% surcharge
    }
  },
  
  // Special provisions
  specialProvisions: {
    foundingDioceseDiscount: 0.15,  // 15% for first 10 dioceses
    pilotProgramLength: 60,          // Days for pilot programs
    referralDiscount: 0.10,          // 10% for referrals
    nonprofitAdditional: 0           // Already priced for schools
  }
};

// Calculate diocese pricing - FIXED to handle programs properly
export const calculateDiocesePrice = (numSchools, tier, extraPrograms = 0, specialDiscounts = {}) => {
  const tierConfig = PRICING_CONFIG.tiers[tier];
  if (!tierConfig) return null;
  
  // Base calculations
  const basePrice = numSchools * tierConfig.perSchoolPrice;
  const programsOverIncluded = Math.max(0, extraPrograms - tierConfig.programs.included);
  const programCost = programsOverIncluded * tierConfig.programs.extraCost;
  const subtotal = basePrice + programCost;
  
  // Apply special discounts
  let totalDiscount = 0;
  if (specialDiscounts.founding) {
    totalDiscount += subtotal * PRICING_CONFIG.specialProvisions.foundingDioceseDiscount;
  }
  if (specialDiscounts.referral) {
    totalDiscount += subtotal * PRICING_CONFIG.specialProvisions.referralDiscount;
  }
  if (specialDiscounts.multiYear) {
    const years = Math.min(specialDiscounts.multiYear - 1, 2); // Max 3 years
    totalDiscount += subtotal * (years * PRICING_CONFIG.contractTerms.multiYearDiscount);
  }
  
  const totalPrice = Math.round(subtotal - totalDiscount);
  const monthlyEquivalent = Math.round(totalPrice / 12);
  
  return {
    tier: tier,
    numSchools,
    perSchoolPrice: tierConfig.perSchoolPrice,
    basePrice,
    programsIncluded: tierConfig.programs.included,
    extraPrograms: programsOverIncluded,
    programCost,
    subtotal,
    discounts: {
      amount: totalDiscount,
      ...specialDiscounts
    },
    totalPrice,
    monthlyEquivalent,
    perSchoolEffective: Math.round(totalPrice / numSchools),
    savings: (PRICING_CONFIG.singleSchool * numSchools) - basePrice,
    savingsPercent: Math.round(((PRICING_CONFIG.singleSchool * numSchools - basePrice) / (PRICING_CONFIG.singleSchool * numSchools)) * 100)
  };
};

// Get tier limits and pricing info
export const getTierInfo = (tier) => {
  const tierConfig = PRICING_CONFIG.tiers[tier];
  if (!tierConfig) return null;
  
  return {
    ...tierConfig,
    annualPrice: tierConfig.maxSchools * tierConfig.perSchoolPrice,
    maxPrice: (tierConfig.maxSchools * tierConfig.perSchoolPrice) + 
              ((tierConfig.programs.max - tierConfig.programs.included) * tierConfig.programs.extraCost)
  };
};

// Recommend best tier for school count
export const recommendTier = (numSchools) => {
  // Handle single schools
  if (numSchools === 1) {
    return {
      tier: 'single',
      message: 'Single school pricing applies',
      price: PRICING_CONFIG.singleSchool
    };
  }
  
  // Find matching tier
  for (const [tierName, tierConfig] of Object.entries(PRICING_CONFIG.tiers)) {
    if (numSchools >= tierConfig.minSchools && numSchools <= tierConfig.maxSchools) {
      return {
        tier: tierName,
        message: `Best fit: ${tierConfig.displayName} tier`,
        config: tierConfig
      };
    }
  }
  
  return {
    tier: 'unlimited',
    message: 'Unlimited tier - contact for custom pricing',
    config: PRICING_CONFIG.tiers.unlimited
  };
};

// Check overage status and calculate fees
export const checkOverageStatus = (currentSchools, tierLimit) => {
  const overage = currentSchools - tierLimit;
  const overagePercent = overage / tierLimit;
  
  // Calculate billable overage (after grace period)
  const billableOverage = Math.max(0, overage - PRICING_CONFIG.overage.graceSchools);
  const overageCost = billableOverage * PRICING_CONFIG.overage.overageRate;
  
  let status, message, action;
  
  if (overage <= 0) {
    status = 'within_limit';
    message = `Using ${currentSchools} of ${tierLimit} schools`;
    action = 'none';
  } else if (overage <= PRICING_CONFIG.overage.graceSchools) {
    status = 'grace_period';
    message = `${overage} school over limit (grace period - no charge)`;
    action = 'none';
  } else if (overagePercent <= PRICING_CONFIG.overage.softLimitPercent) {
    status = 'soft_warning';
    message = `${overage} schools over limit - $${overageCost}/year additional`;
    action = 'invoice_overage';
  } else if (overagePercent <= PRICING_CONFIG.overage.hardLimitPercent) {
    status = 'upgrade_recommended';
    message = `${overage} schools over limit - recommend tier upgrade`;
    action = 'recommend_upgrade';
  } else {
    status = 'upgrade_required';
    message = `${overage} schools over limit - upgrade required`;
    action = PRICING_CONFIG.overage.enforceHardLimit ? 'block_additions' : 'force_upgrade';
  }
  
  return {
    isOver: overage > 0,
    overage,
    overagePercent: Math.round(overagePercent * 100),
    billableOverage,
    overageCost,
    status,
    message,
    action,
    graceRemaining: Math.max(0, PRICING_CONFIG.overage.graceSchools - overage)
  };
};

// Calculate billing details for a diocese
export const calculateBilling = (diocese) => {
  const pricing = calculateDiocesePrice(
    diocese.currentSubEntities || diocese.maxSubEntities,
    diocese.tier,
    diocese.selectedPrograms?.length || 0,
    diocese.specialDiscounts || {}
  );
  
  const overage = checkOverageStatus(
    diocese.currentSubEntities || 0,
    diocese.maxSubEntities
  );
  
  const totalDue = pricing.totalPrice + (overage.overageCost || 0);
  
  return {
    ...pricing,
    overage,
    totalDue,
    billingStatus: diocese.billingStatus || 'pending_contract',
    lastPayment: diocese.lastPayment,
    nextDueDate: diocese.nextDueDate,
    contractExpiry: diocese.contractExpiry
  };
};

// Check if diocese can add more schools
export const canAddSchool = (currentSchools, tierLimit, enforceLimit = false) => {
  const overage = checkOverageStatus(currentSchools, tierLimit);
  
  if (!enforceLimit) {
    // In manual billing mode, always allow but track overage
    return {
      allowed: true,
      requiresApproval: overage.overagePercent > 10,
      overageFee: overage.billableOverage > 0 ? PRICING_CONFIG.overage.overageRate : 0,
      message: overage.message
    };
  }
  
  // When enforcement is on
  if (overage.action === 'block_additions') {
    return {
      allowed: false,
      requiresApproval: true,
      message: 'Tier limit exceeded - upgrade required'
    };
  }
  
  return {
    allowed: true,
    requiresApproval: overage.status !== 'within_limit',
    overageFee: overage.overageCost,
    message: overage.message
  };
};

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Export for use in other files
export default {
  PRICING_CONFIG,
  calculateDiocesePrice,
  recommendTier,
  checkOverageStatus,
  calculateBilling,
  getTierInfo,
  canAddSchool,
  formatCurrency
};