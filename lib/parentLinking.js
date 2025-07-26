// lib/parentLinking.js - Updated for Two-Parent Family System

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
    // Search all families to see if this student is already linked
    const familiesRef = collection(db, 'families');
    const familiesSnapshot = await getDocs(familiesRef);
    
    for (const familyDoc of familiesSnapshot.docs) {
      const familyData = familyDoc.data();
      const linkedStudentIds = familyData.linkedStudents?.map(s => s.studentId) || [];
      
      if (linkedStudentIds.includes(studentId)) {
        return {
          exists: true,
          familyId: familyDoc.id,
          familyData: familyData
        };
      }
    }
    
    return { exists: false };
  } catch (error) {
    console.error('Error checking existing family:', error);
    throw error;
  }
};

// Create new family (first parent)
export const createFamily = async (parentId, parentLastName, students) => {
  try {
    const familyId = doc(collection(db, 'families')).id; // Generate new ID
    
    await setDoc(doc(db, 'families', familyId), {
      familyId,
      familyName: `The ${parentLastName} Family`,
      parents: [parentId], // Array to support 2 parents
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
      familyBattleSettings: {
        enabled: true,
        weeklyGoal: 150,
        currentWeek: {
          parents: {}, // Will store { parentId: minutes }
          children: {} // Will store { studentId: minutes }
        }
      }
    });
    
    // Update parent with familyId
    await updateDoc(doc(db, 'parents', parentId), {
      familyId: familyId
    });
    
    return familyId;
  } catch (error) {
    console.error('Error creating family:', error);
    throw error;
  }
};

// Join existing family (second parent)
export const joinExistingFamily = async (parentId, familyId) => {
  try {
    const familyRef = doc(db, 'families', familyId);
    const familyDoc = await getDoc(familyRef);
    
    if (!familyDoc.exists()) {
      throw new Error('Family not found');
    }
    
    const familyData = familyDoc.data();
    
    // Check if family already has 2 parents
    if (familyData.parents && familyData.parents.length >= 2) {
      throw new Error('This family already has two parents');
    }
    
    // Add parent to family
    await updateDoc(familyRef, {
      parents: arrayUnion(parentId),
      lastUpdated: new Date()
    });
    
    // Update parent with familyId
    await updateDoc(doc(db, 'parents', parentId), {
      familyId: familyId,
      linkedStudents: familyData.linkedStudents.map(s => s.studentId),
      schoolIds: [...new Set(familyData.linkedStudents.map(s => s.schoolId))]
    });
    
    return {
      familyId,
      familyName: familyData.familyName,
      existingParentCount: familyData.parents.length
    };
  } catch (error) {
    console.error('Error joining existing family:', error);
    throw error;
  }
};

// Link parent to student using invite code (updated for family system)
export const linkParentToStudent = async (parentId, inviteCode, isFirstParent = true) => {
  try {
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
        const studentsRef = collection(db, `entities/${entityId}/schools/${schoolId}/students`);
        const studentsSnapshot = await getDocs(studentsRef);
        
        for (const studentDoc of studentsSnapshot.docs) {
          const studentData = studentDoc.data();
          if (studentData.parentInviteCode === inviteCode) {
            foundStudent = { 
              id: studentDoc.id, 
              entityId: entityId,
              schoolId: schoolId,
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
      throw new Error('Invalid invite code');
    }
    
    // Check if student already belongs to a family
    const existingFamily = await checkExistingFamily(foundStudent.id);
    
    let familyInfo;
    
    if (existingFamily.exists) {
      // Join existing family as second parent
      familyInfo = await joinExistingFamily(parentId, existingFamily.familyId);
      familyInfo.isNewFamily = false;
    } else {
      // This will be handled in onboarding after parent provides last name
      // Just validate and return student info for now
      familyInfo = {
        isNewFamily: true,
        requiresFamilyCreation: true
      };
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
    
    // Get parent details
    const parentPromises = familyData.parents.map(async (parentId) => {
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