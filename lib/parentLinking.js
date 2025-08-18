// lib/parentLinking.js - Fixed to properly maintain linkedParents array for family battles

import { doc, updateDoc, arrayUnion, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from './firebase';

// Generate unique parent invite code for student - NEW FORMAT
export const generateParentInviteCode = (signInCode, firstName, lastInitial, grade) => {
  // Extract school identifier from sign-in code (e.g., "TXTEST-DEMO-TEST85-STUDENT" -> "TXTEST-DEMO")
  const parts = signInCode.split('-');
  const schoolIdentifier = parts.slice(0, 2).join('-'); // Get state+city+school
  
  // Create student identifier (e.g., "JESSEK5TEST")
  const studentIdentifier = `${firstName.toUpperCase()}${lastInitial.toUpperCase()}${grade}`;
  
  // Generate 8-character random suffix
  const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomSuffix = '';
  for (let i = 0; i < 8; i++) {
    randomSuffix += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }
  
  // Final format: TXTEST-DEMO-JESSEK5TEST-A7B9C2D4
  return `${schoolIdentifier}-${studentIdentifier}-${randomSuffix}`;
};

// VALIDATE PARENT INVITE CODE - New function
export const validateParentInviteCode = async (inviteCode) => {
  try {
    if (!inviteCode || typeof inviteCode !== 'string') {
      return {
        isValid: false,
        error: 'Invalid code format'
      };
    }

    // Basic format validation
    const parts = inviteCode.split('-');
    if (parts.length !== 4) {
      return {
        isValid: false,
        error: 'Invalid code format. Please check for typos.'
      };
    }

    // Search all entities/schools/students for this invite code
    const entitiesRef = collection(db, 'entities');
    const entitiesSnapshot = await getDocs(entitiesRef);
    
    let foundStudent = null;
    let studentPath = null;
    
    for (const entityDoc of entitiesSnapshot.docs) {
      const entityId = entityDoc.id;
      const schoolsRef = collection(db, `entities/${entityId}/schools`);
      const schoolsSnapshot = await getDocs(schoolsRef);
      
      for (const schoolDoc of schoolsSnapshot.docs) {
        const schoolId = schoolDoc.id;
        const schoolData = schoolDoc.data();
        const studentsRef = collection(db, `entities/${entityId}/schools/${schoolId}/students`);
        const studentsSnapshot = await getDocs(studentsRef);
        
        for (const studentDoc of studentsSnapshot.docs) {
          const studentData = studentDoc.data();
          if (studentData.parentInviteCode === inviteCode) {
            foundStudent = { 
              id: studentDoc.id, 
              entityId: entityId,
              schoolId: schoolId,
              schoolName: schoolData.name || 'Unknown School',
              ...studentData 
            };
            studentPath = `entities/${entityId}/schools/${schoolId}/students/${studentDoc.id}`;
            break;
          }
        }
        if (foundStudent) break;
      }
      if (foundStudent) break;
    }
    
    if (!foundStudent) {
      return {
        isValid: false,
        error: 'Code not found. Please check for typos and try again.'
      };
    }

    // Check if parent linking is enabled for this student
    if (!foundStudent.parentLinkingEnabled || !foundStudent.allowParentAccess) {
      return {
        isValid: false,
        error: 'Parent access is not enabled for this student. Please contact the teacher.'
      };
    }

    // Check for existing family
    let existingFamily = null;
    if (foundStudent.familyId) {
      const familyDoc = await getDoc(doc(db, 'families', foundStudent.familyId));
      if (familyDoc.exists()) {
        existingFamily = {
          familyId: foundStudent.familyId,
          ...familyDoc.data()
        };
      }
    }

    return {
      isValid: true,
      studentId: foundStudent.id,
      studentInfo: {
        id: foundStudent.id,
        firstName: foundStudent.firstName,
        lastInitial: foundStudent.lastInitial,
        grade: foundStudent.grade,
        schoolName: foundStudent.schoolName,
        entityId: foundStudent.entityId,
        schoolId: foundStudent.schoolId
      },
      existingFamily,
      studentPath
    };

  } catch (error) {
    console.error('Error validating invite code:', error);
    return {
      isValid: false,
      error: 'Unable to validate code. Please try again.'
    };
  }
};

// CHECK STUDENT PARENT CAPACITY - New function
export const checkStudentParentCapacity = async (studentId) => {
  try {
    // Find the student across all entities
    const entitiesRef = collection(db, 'entities');
    const entitiesSnapshot = await getDocs(entitiesRef);
    
    let studentData = null;
    
    for (const entityDoc of entitiesSnapshot.docs) {
      const entityId = entityDoc.id;
      const schoolsRef = collection(db, `entities/${entityId}/schools`);
      const schoolsSnapshot = await getDocs(schoolsRef);
      
      for (const schoolDoc of schoolsSnapshot.docs) {
        const schoolId = schoolDoc.id;
        const studentDoc = await getDoc(doc(db, `entities/${entityId}/schools/${schoolId}/students`, studentId));
        
        if (studentDoc.exists()) {
          studentData = studentDoc.data();
          break;
        }
      }
      if (studentData) break;
    }
    
    if (!studentData) {
      return {
        hasCapacity: false,
        reason: 'Student not found'
      };
    }

    const linkedParentsCount = studentData.linkedParents?.length || 0;
    const maxParents = studentData.maxLinkedParents || 2;

    if (linkedParentsCount >= maxParents) {
      return {
        hasCapacity: false,
        reason: `This student already has ${linkedParentsCount} parent${linkedParentsCount > 1 ? 's' : ''} connected (maximum: ${maxParents})`
      };
    }

    return {
      hasCapacity: true,
      currentCount: linkedParentsCount,
      maxCount: maxParents,
      remainingSlots: maxParents - linkedParentsCount
    };

  } catch (error) {
    console.error('Error checking parent capacity:', error);
    return {
      hasCapacity: false,
      reason: 'Unable to check parent capacity'
    };
  }
};

// Create parent invite code for student (call from student dashboard button)
export const createParentInviteCode = async (studentId, entityId, schoolId, signInCode, firstName, lastInitial, grade) => {
  try {
    // First check if student already has an invite code
    const studentRef = doc(db, `entities/${entityId}/schools/${schoolId}/students`, studentId);
    const studentDoc = await getDoc(studentRef);
    const studentData = studentDoc.data();
    
    // If invite code already exists, return it
    if (studentData?.parentInviteCode) {
      console.log('📋 Returning existing parent invite code');
      return studentData.parentInviteCode;
    }
    
    // Otherwise, generate new invite code
    const inviteCode = generateParentInviteCode(signInCode, firstName, lastInitial, grade);
    
    // Update student with new invite code
    const currentLinkedParents = studentData?.linkedParents || [];
    
    await updateDoc(studentRef, {
      parentInviteCode: inviteCode,
      linkedParents: currentLinkedParents, // Preserve existing linked parents
      allowParentAccess: true,
      parentLinkingEnabled: true,
      maxLinkedParents: 2 // Enforce 2-parent limit at student level
    });
    
    console.log('✨ Generated new parent invite code');
    return inviteCode;
  } catch (error) {
    console.error('Error creating parent invite code:', error);
    throw error;
  }
};

// Create parent account with email/password
export const createParentAccount = async (email, password, firstName, lastName) => {
  try {
    // Use Firebase Auth helper
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const parentId = userCredential.user.uid;
    
    // Create parent profile in top-level parents collection
    // Note: familyId will be set when joining/creating family
    await setDoc(doc(db, 'parents', parentId), {
      uid: parentId,
      email,
      firstName,
      lastName,
      linkedStudents: [],
      familyId: null, // Will be set when joining/creating family
      subscriptionTier: 'basic', // Free tier
      schoolIds: [],
      accountCreated: new Date(),
      accountType: 'parent',
      role: 'parent' // Both parents have equal role
    });
    
    return parentId;
  } catch (error) {
    console.error('Error creating parent account:', error);
    throw error;
  }
};

// Check if student already has a family
export const checkExistingFamily = async (studentId) => {
  try {
    console.log('🔍 Checking if student already belongs to a family:', studentId);
    
    // Search all families to see if this student is already linked
    const familiesRef = collection(db, 'families');
    const familiesSnapshot = await getDocs(familiesRef);
    
    for (const familyDoc of familiesSnapshot.docs) {
      const familyData = familyDoc.data();
      
      // Handle both string IDs and object format in linkedStudents
      const linkedStudentIds = familyData.linkedStudents?.map(s => 
        typeof s === 'string' ? s : s.studentId
      ) || [];
      
      if (linkedStudentIds.includes(studentId)) {
        console.log('✅ Found existing family:', familyDoc.id, familyData.familyName);
        return {
          exists: true,
          familyId: familyDoc.id,
          familyData: familyData
        };
      }
    }
    
    console.log('❌ No existing family found for student');
    return { exists: false };
  } catch (error) {
    console.error('Error checking existing family:', error);
    throw error;
  }
};

// Create new family (first parent) - FIXED: Now properly sets linkedParents
export const createFamily = async (parentId, parentLastName, students) => {
  try {
    const familyId = doc(collection(db, 'families')).id; // Generate new ID
    console.log('🏠 Creating new family with ID:', familyId);
    
    await setDoc(doc(db, 'families', familyId), {
      familyId,
      familyName: `The ${parentLastName} Family`,
      parents: [parentId], // Keep for backward compatibility
      linkedParents: [parentId], // CRITICAL: Add to linkedParents array for family battles!
      linkedStudents: students.map(student => ({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastInitial}`,
        schoolName: student.schoolName,
        entityId: student.entityId,
        schoolId: student.schoolId,
        grade: student.grade
      })),
      createdAt: new Date(),
      lastUpdated: new Date(),
     // Initialize family battle data
familyBattle: {  // Changed from familyBattleSettings to familyBattle
  enabled: false,  // Start as false - parent will enable it manually
  weeklyGoal: 150,
  currentWeek: null,  // Will be created when parent starts a week
  weekHistory: []
}
    });
    
    console.log('✅ Family document created with linkedParents array');
    
    // Update parent with familyId and linkedStudents
    await updateDoc(doc(db, 'parents', parentId), {
      familyId: familyId,
      linkedStudents: students.map(s => s.id), // Add student IDs to parent
      lastUpdated: new Date()
    });
    
    console.log('✅ Parent updated with familyId');
    
    // Update all students with familyId
    for (const student of students) {
      try {
        await updateDoc(doc(db, `entities/${student.entityId}/schools/${student.schoolId}/students`, student.id), {
          familyId: familyId,
          lastModified: new Date()
        });
        console.log('✅ Student updated with familyId:', student.firstName);
      } catch (error) {
        console.error('⚠️ Error updating student with familyId:', student.id, error);
      }
    }
    
    console.log('✅ Family created successfully with linkedParents:', familyId);
    return familyId;
  } catch (error) {
    console.error('Error creating family:', error);
    throw error;
  }
};

// Join existing family (second parent) - FIXED: Now properly adds to linkedParents
export const joinExistingFamily = async (parentId, familyId) => {
  try {
    console.log('👨‍👩‍👧‍👦 Joining existing family:', familyId);
    
    const familyRef = doc(db, 'families', familyId);
    const familyDoc = await getDoc(familyRef);
    
    if (!familyDoc.exists()) {
      throw new Error('Family not found');
    }
    
    const familyData = familyDoc.data();
    
    // Check if parent is already in linkedParents (the array that matters for battles)
    if (familyData.linkedParents && familyData.linkedParents.includes(parentId)) {
      console.log('✅ Parent already in family');
      return {
        familyId,
        familyName: familyData.familyName,
        existingParentCount: familyData.linkedParents.length,
        alreadyJoined: true
      };
    }
    
    // Also check the legacy parents array for backward compatibility
    if (familyData.parents && familyData.parents.includes(parentId)) {
      // Parent is in old array but not new - fix this
      console.log('⚠️ Parent in legacy array but not linkedParents - fixing...');
      await updateDoc(familyRef, {
        linkedParents: arrayUnion(parentId),
        lastUpdated: new Date()
      });
      
      return {
        familyId,
        familyName: familyData.familyName,
        existingParentCount: (familyData.linkedParents?.length || 0) + 1,
        alreadyJoined: true
      };
    }
    
    // Check if family already has 2 parents (check both arrays for safety)
    const linkedParentsCount = familyData.linkedParents?.length || 0;
    const parentsCount = familyData.parents?.length || 0;
    const maxCount = Math.max(linkedParentsCount, parentsCount);
    
    if (maxCount >= 2) {
      throw new Error('This family already has two parents');
    }
    
    // FIXED: Add parent to BOTH arrays for compatibility
    await updateDoc(familyRef, {
      parents: arrayUnion(parentId), // Keep for backward compatibility
      linkedParents: arrayUnion(parentId), // CRITICAL: This is what family battle uses!
      lastUpdated: new Date()
    });
    
    // Extract student IDs correctly (handle both string and object formats)
    const studentIds = familyData.linkedStudents.map(s => 
      typeof s === 'string' ? s : s.studentId
    );
    
    // Update parent with familyId and linked students
    await updateDoc(doc(db, 'parents', parentId), {
      familyId: familyId,
      linkedStudents: studentIds,
      schoolIds: [...new Set(familyData.linkedStudents.map(s => 
        typeof s === 'object' ? s.schoolId : null
      ).filter(id => id !== null))]
    });
    
    console.log('✅ Successfully joined family:', familyData.familyName);
    console.log('✅ Added to linkedParents array for family battles');
    
    return {
      familyId,
      familyName: familyData.familyName,
      existingParentCount: (familyData.linkedParents?.length || 0) + 1,
      isSecondParent: true
    };
  } catch (error) {
    console.error('Error joining existing family:', error);
    throw error;
  }
};

// Link parent to student using invite code (updated for family system)
export const linkParentToStudent = async (parentId, inviteCode, validatedCodeInfo = null, existingFamilyId = null) => {
  try {
    let foundStudent, studentPath;
    
    // If we already have validated info, use it
    if (validatedCodeInfo) {
      foundStudent = validatedCodeInfo.studentInfo;
      studentPath = validatedCodeInfo.studentPath;
    } else {
      // Otherwise, validate the code
      const validation = await validateParentInviteCode(inviteCode);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      foundStudent = validation.studentInfo;
      studentPath = validation.studentPath;
    }
    
    let familyInfo;

    // If we already have a family ID from a previous child, use it
    if (existingFamilyId) {
      console.log('🏠 Using existing family ID from previous child:', existingFamilyId);
      
      // Join the existing family if not already joined
      const parentDoc = await getDoc(doc(db, 'parents', parentId));
      const parentData = parentDoc.data();
      
      if (!parentData.familyId || parentData.familyId !== existingFamilyId) {
        const joinResult = await joinExistingFamily(parentId, existingFamilyId);
        familyInfo = {
          ...joinResult,
          isNewFamily: false,
          familyId: existingFamilyId
        };
      } else {
        // Parent already in this family
        const familyDoc = await getDoc(doc(db, 'families', existingFamilyId));
        const familyData = familyDoc.data();
        familyInfo = {
          isNewFamily: false,
          familyId: existingFamilyId,
          familyName: familyData.familyName,
          alreadyJoined: true
        };
      }
    } else {
      // Check if student already belongs to a family
      const existingFamily = await checkExistingFamily(foundStudent.id);

      if (existingFamily.exists) {
        console.log('🏠 Student already belongs to a family, joining as second parent...');
        // Join existing family as second parent
        const joinResult = await joinExistingFamily(parentId, existingFamily.familyId);
        familyInfo = {
          ...joinResult,
          isNewFamily: false,
          familyId: existingFamily.familyId,
          familyName: existingFamily.familyData.familyName || joinResult.familyName
        };
        console.log('✅ Joined existing family:', familyInfo.familyName);
      } else {
        console.log('🆕 No existing family, will create new one in onboarding');
        // This will be handled in onboarding after parent provides last name
        // Just validate and return student info for now
        familyInfo = {
          isNewFamily: true,
          requiresFamilyCreation: true
        };
      }
    }
    
    // Add parent to student's linkedParents array
    await updateDoc(doc(db, studentPath), {
      linkedParents: arrayUnion(parentId)
    });
    
    // Update parent's linkedStudents
    await updateDoc(doc(db, 'parents', parentId), {
      linkedStudents: arrayUnion(foundStudent.id),
      schoolIds: arrayUnion(foundStudent.schoolId)
    });
    
    // AUTO-ENABLE FAMILY BATTLE if family already has it enabled
    if (familyInfo.familyId && !familyInfo.isNewFamily) {
      try {
        const familyDoc = await getDoc(doc(db, 'families', familyInfo.familyId));
        if (familyDoc.exists()) {
          const familyData = familyDoc.data();
          
          // Check if family battle is enabled (check both possible field names)
          if (familyData.familyBattle?.enabled || familyData.familyBattleSettings?.enabled) {
            console.log('🎮 Family has battle enabled, auto-enabling for student...');
            
            // Enable battle for this student
            await updateDoc(doc(db, studentPath), {
              'familyBattleSettings.enabled': true,
              'familyBattleSettings.familyId': familyInfo.familyId,
              'familyBattleSettings.enabledAt': new Date()
            });
            
            console.log('✅ Auto-enabled family battle for student:', foundStudent.firstName);
          }
        }
      } catch (error) {
        console.error('⚠️ Error auto-enabling family battle:', error);
        // Non-critical error, continue
      }
    }
    
    return {
      studentId: foundStudent.id,
      studentName: `${foundStudent.firstName} ${foundStudent.lastInitial}`,
      schoolName: foundStudent.schoolName,
      entityId: foundStudent.entityId,
      schoolId: foundStudent.schoolId,
      grade: foundStudent.grade,
      ...familyInfo
    };
    
  } catch (error) {
    console.error('Error linking parent to student:', error);
    throw error;
  }
};

// Get all students linked to a parent (updated for family system)
export const getLinkedStudents = async (parentId) => {
  try {
    const parentDoc = await getDoc(doc(db, 'parents', parentId));
    if (!parentDoc.exists()) {
      throw new Error('Parent not found');
    }
    
    const parentData = parentDoc.data();
    
    // If parent has a family, get students from family document
    if (parentData.familyId) {
      const familyDoc = await getDoc(doc(db, 'families', parentData.familyId));
      if (familyDoc.exists()) {
        const familyData = familyDoc.data();
        return familyData.linkedStudents || [];
      }
    }
    
    // Fallback to old method if no family (shouldn't happen in new system)
    const linkedStudentIds = parentData.linkedStudents || [];
    const students = [];
    
    // Find each student in entities structure
    const entitiesRef = collection(db, 'entities');
    const entitiesSnapshot = await getDocs(entitiesRef);
    
    for (const entityDoc of entitiesSnapshot.docs) {
      const entityId = entityDoc.id;
      const schoolsRef = collection(db, `entities/${entityId}/schools`);
      const schoolsSnapshot = await getDocs(schoolsRef);
      
      for (const schoolDoc of schoolsSnapshot.docs) {
        const schoolId = schoolDoc.id;
        const studentsRef = collection(db, `entities/${entityId}/schools/${schoolId}/students`);
        const studentsSnapshot = await getDocs(studentsRef);
        
        for (const studentDoc of studentsSnapshot.docs) {
          if (linkedStudentIds.includes(studentDoc.id)) {
            students.push({
              id: studentDoc.id,
              entityId: entityId,
              schoolId,
              ...studentDoc.data()
            });
          }
        }
      }
    }
    
    return students;
    
  } catch (error) {
    console.error('Error getting linked students:', error);
    throw error;
  }
};

// Get family information including all parents
export const getFamilyInfo = async (familyId) => {
  try {
    const familyDoc = await getDoc(doc(db, 'families', familyId));
    if (!familyDoc.exists()) {
      throw new Error('Family not found');
    }
    
    const familyData = familyDoc.data();
    
    // Use linkedParents if available, fall back to parents for backward compatibility
    const parentIds = familyData.linkedParents || familyData.parents || [];
    
    // Get parent details
    const parentPromises = parentIds.map(async (parentId) => {
      const parentDoc = await getDoc(doc(db, 'parents', parentId));
      if (parentDoc.exists()) {
        const data = parentDoc.data();
        return {
          id: parentId,
          name: `${data.firstName} ${data.lastName}`,
          email: data.email
        };
      }
      return null;
    });
    
    const parents = (await Promise.all(parentPromises)).filter(p => p !== null);
    
    return {
      ...familyData,
      parentDetails: parents
    };
    
  } catch (error) {
    console.error('Error getting family info:', error);
    throw error;
  }
};

// Get linked parent details for a student
export const getLinkedParentDetails = async (parentIds) => {
  try {
    if (!parentIds || parentIds.length === 0) {
      return [];
    }

    const parentPromises = parentIds.map(async (parentId) => {
      const parentDoc = await getDoc(doc(db, 'parents', parentId));
      if (parentDoc.exists()) {
        const data = parentDoc.data();
        return {
          id: parentId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email
        };
      }
      return null;
    });

    const parents = (await Promise.all(parentPromises)).filter(p => p !== null);
    return parents;

  } catch (error) {
    console.error('Error getting linked parent details:', error);
    return [];
  }
};

// Get family details for a student
export const getFamilyDetails = async (familyId) => {
  try {
    if (!familyId) {
      return null;
    }

    const familyDoc = await getDoc(doc(db, 'families', familyId));
    if (!familyDoc.exists()) {
      return null;
    }

    return {
      familyId,
      ...familyDoc.data()
    };

  } catch (error) {
    console.error('Error getting family details:', error);
    return null;
  }
};

// One-time migration function to fix existing families (optional utility)
export const migrateFamilyLinkedParents = async () => {
  try {
    console.log('🔧 Starting migration of linkedParents array...');
    
    const familiesRef = collection(db, 'families');
    const familiesSnapshot = await getDocs(familiesRef);
    
    let migrated = 0;
    let skipped = 0;
    
    for (const familyDoc of familiesSnapshot.docs) {
      const data = familyDoc.data();
      
      // Check if migration is needed
      if (data.parents && data.parents.length > 0 && 
          (!data.linkedParents || data.linkedParents.length === 0)) {
        
        // Migrate parents array to linkedParents
        await updateDoc(doc(db, 'families', familyDoc.id), {
          linkedParents: data.parents,
          lastUpdated: new Date(),
          migrationNote: 'Added linkedParents array for family battles'
        });
        
        console.log(`✅ Migrated family ${familyDoc.id} - ${data.familyName}`);
        migrated++;
      } else {
        skipped++;
      }
    }
    
    console.log(`🎉 Migration complete! Migrated: ${migrated}, Skipped: ${skipped}`);
    return { migrated, skipped };
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
};