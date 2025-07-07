// lib/parentLinking.js - Updated for Entities Structure

import { doc, updateDoc, arrayUnion, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from './firebase';

// Generate unique parent invite code for student
export const generateParentInviteCode = (firstName, lastInitial, grade) => {
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${firstName.toUpperCase()}-${lastInitial.toUpperCase()}${grade}-INVITE-${randomSuffix}`;
};

// Create parent invite code for student (call from student dashboard button)
export const createParentInviteCode = async (studentId, entityId, schoolId, firstName, lastInitial, grade) => {
  const inviteCode = generateParentInviteCode(firstName, lastInitial, grade);
  
  try {
    // Update student in entities structure
    const studentRef = doc(db, `entities/${entityId}/schools/${schoolId}/students`, studentId);
    await updateDoc(studentRef, {
      parentInviteCode: inviteCode,
      linkedParents: [],
      allowParentAccess: true,
      parentLinkingEnabled: true
    });
    
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
    await setDoc(doc(db, 'parents', parentId), {
      uid: parentId,
      email,
      firstName,
      lastName,
      linkedStudents: [],
      subscriptionTier: 'basic', // Free tier
      schoolIds: [],
      accountCreated: new Date(),
      accountType: 'parent'
    });
    
    return parentId;
  } catch (error) {
    console.error('Error creating parent account:', error);
    throw error;
  }
};

// Link parent to student using invite code (from parent signup flow)
export const linkParentToStudent = async (parentId, inviteCode) => {
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
    
    // Add parent to student's linkedParents array
    await updateDoc(doc(db, studentPath), {
      linkedParents: arrayUnion(parentId)
    });
    
    // Add student to parent's linkedStudents array
    await updateDoc(doc(db, 'parents', parentId), {
      linkedStudents: arrayUnion(foundStudent.id),
      schoolIds: arrayUnion(foundStudent.schoolId)
    });
    
    return {
      studentId: foundStudent.id,
      studentName: `${foundStudent.firstName} ${foundStudent.lastInitial}`,
      schoolName: foundStudent.schoolName,
      entityId: foundStudent.entityId,
      schoolId: foundStudent.schoolId
    };
    
  } catch (error) {
    console.error('Error linking parent to student:', error);
    throw error;
  }
};

// Get all students linked to a parent
export const getLinkedStudents = async (parentId) => {
  try {
    const parentDoc = await getDoc(doc(db, 'parents', parentId));
    if (!parentDoc.exists()) {
      throw new Error('Parent not found');
    }
    
    const linkedStudentIds = parentDoc.data().linkedStudents || [];
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
              entityId: entityId,  // Updated: entityId instead of dioceseId
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