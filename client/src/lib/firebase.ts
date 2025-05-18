import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  orderBy 
} from "firebase/firestore";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
  throw new Error("Failed to initialize Firebase. Please check your configuration.");
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Auth functions
export const logInWithEmailAndPassword = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const registerWithEmailAndPassword = async (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logout = () => {
  return signOut(auth);
};

// Firestore functions
export interface Course {
  id?: string;
  userId: string;
  code: string;
  name: string;
  description?: string;
  term: string;
  createdAt: Date;
}

export interface ResourceLink {
  label: string;
  url: string;
}

export interface Assignment {
  id?: string;
  userId: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'submitted' | 'overdue';
  createdAt: Date;
  links?: ResourceLink[];
}

export interface FileItem {
  id?: string;
  userId: string;
  assignmentId: string;
  courseId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  createdAt: Date;
}

// Courses
export const addCourse = async (courseData: Omit<Course, 'id' | 'createdAt'>) => {
  return addDoc(collection(db, "courses"), {
    ...courseData,
    createdAt: new Date()
  });
};

export const getUserCourses = async (userId: string) => {
  try {
    console.log("Getting courses from Firebase for user:", userId);
    // Simplified query - remove the orderBy to avoid requiring a composite index
    const q = query(
      collection(db, "courses"),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    const courses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as Course[];
    
    console.log("Courses fetched from Firebase:", courses);
    return courses;
  } catch (error) {
    console.error("Error in getUserCourses:", error);
    return [];
  }
};

export const getCourse = async (courseId: string) => {
  const docRef = doc(db, "courses", courseId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as Course;
  } else {
    throw new Error("Course not found");
  }
};

export const updateCourse = async (courseId: string, data: Partial<Course>) => {
  const courseRef = doc(db, "courses", courseId);
  return updateDoc(courseRef, data);
};

export const deleteCourse = async (courseId: string) => {
  try {
    // Get all assignments for this course first
    const assignmentsQuery = query(
      collection(db, "assignments"),
      where("courseId", "==", courseId)
    );
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    
    // Delete all assignments and their files
    const batch = writeBatch(db);
    
    // Process each assignment
    for (const assignmentDoc of assignmentsSnapshot.docs) {
      const assignmentId = assignmentDoc.id;
      
      // Find files for this assignment
      const filesQuery = query(
        collection(db, "files"),
        where("assignmentId", "==", assignmentId)
      );
      const filesSnapshot = await getDocs(filesQuery);
      
      // Delete all files for this assignment
      for (const fileDoc of filesSnapshot.docs) {
        // Get the file reference from storage and delete it
        try {
          const fileData = fileDoc.data();
          if (fileData.url) {
            // Extract file path from URL
            const fileUrl = new URL(fileData.url);
            const filePath = decodeURIComponent(fileUrl.pathname.split('/o/')[1]);
            if (filePath) {
              const storageRef = ref(storage, filePath);
              await deleteObject(storageRef);
            }
          }
        } catch (error) {
          console.error("Error deleting file from storage:", error);
        }
        
        // Delete the file document
        batch.delete(fileDoc.ref);
      }
      
      // Delete the assignment
      batch.delete(assignmentDoc.ref);
    }
    
    // Delete the course itself
    batch.delete(doc(db, "courses", courseId));
    
    // Commit all deletions in a single batch
    await batch.commit();
    
    console.log("Course and related items deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting course:", error);
    throw error;
  }
};

// Assignments
export const addAssignment = async (assignmentData: Omit<Assignment, 'id' | 'createdAt'>) => {
  return addDoc(collection(db, "assignments"), {
    ...assignmentData,
    createdAt: new Date()
  });
};

// Helper function to convert Firestore timestamps to Date objects
const convertTimestamps = (data: any) => {
  const result = { ...data };
  
  // Convert specific known timestamp fields
  if (result.createdAt && typeof result.createdAt.toDate === 'function') {
    result.createdAt = result.createdAt.toDate();
  }
  
  if (result.dueDate && typeof result.dueDate.toDate === 'function') {
    result.dueDate = result.dueDate.toDate();
  }
  
  return result;
};

export const getUserAssignments = async (userId: string) => {
  try {
    // Simplified query without orderBy to avoid index requirement
    const q = query(
      collection(db, "assignments"),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    })) as Assignment[];
  } catch (error) {
    console.error("Error in getUserAssignments:", error);
    return [];
  }
};

export const getCourseAssignments = async (courseId: string) => {
  const q = query(
    collection(db, "assignments"),
    where("courseId", "==", courseId),
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  })) as Assignment[];
};

export const getAssignment = async (assignmentId: string) => {
  const docRef = doc(db, "assignments", assignmentId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as Assignment;
  } else {
    throw new Error("Assignment not found");
  }
};

export const updateAssignment = async (assignmentId: string, data: Partial<Assignment>) => {
  const assignmentRef = doc(db, "assignments", assignmentId);
  return updateDoc(assignmentRef, data);
};

export const deleteAssignment = async (assignmentId: string) => {
  return deleteDoc(doc(db, "assignments", assignmentId));
};

// Files
export const uploadFile = async (file: File, assignmentId: string, courseId: string, userId: string) => {
  const storageRef = ref(storage, `files/${userId}/${assignmentId}/${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);
  
  const fileData: Omit<FileItem, 'id' | 'createdAt'> = {
    userId,
    assignmentId,
    courseId,
    name: file.name,
    type: file.type,
    size: file.size,
    url: downloadUrl
  };
  
  return addDoc(collection(db, "files"), {
    ...fileData,
    createdAt: new Date()
  });
};

export const getAssignmentFiles = async (assignmentId: string) => {
  const q = query(
    collection(db, "files"),
    where("assignmentId", "==", assignmentId),
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as FileItem[];
};

export const getUserFiles = async (userId: string) => {
  try {
    // Simplified query without orderBy to avoid index requirement
    const q = query(
      collection(db, "files"),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FileItem[];
  } catch (error) {
    console.error("Error in getUserFiles:", error);
    return [];
  }
};

export const deleteFile = async (fileId: string, filePath: string) => {
  const fileRef = ref(storage, filePath);
  await deleteObject(fileRef);
  return deleteDoc(doc(db, "files", fileId));
};

export { app, auth, db, storage, onAuthStateChanged };
export type { FirebaseUser as User };
