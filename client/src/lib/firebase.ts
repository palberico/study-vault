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
  uploadBytesResumable,
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
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
  syllabusUrl?: string;
  syllabusName?: string;
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
  tags?: string[];
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
  path: string; // Storage path for deletion
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
  // Make sure tags is always an array
  const data = {
    ...assignmentData,
    tags: Array.isArray(assignmentData.tags) ? assignmentData.tags : [],
    createdAt: new Date()
  };
  
  return addDoc(collection(db, "assignments"), data);
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
  try {
    console.log("Getting assignment with ID:", assignmentId);
    const docRef = doc(db, "assignments", assignmentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log("Assignment found:", docSnap.id);
      return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as Assignment;
    } else {
      console.error("Assignment not found with ID:", assignmentId);
      throw new Error("Assignment not found");
    }
  } catch (error) {
    console.error("Error in getAssignment:", error, "for ID:", assignmentId);
    throw error;
  }
};

export const updateAssignment = async (assignmentId: string, data: Partial<Assignment>) => {
  const assignmentRef = doc(db, "assignments", assignmentId);
  
  // Ensure tags are properly formatted for Firestore
  if (data.tags !== undefined) {
    // Make sure we're sending an array even if empty
    data.tags = Array.isArray(data.tags) ? data.tags : [];
  }
  
  return updateDoc(assignmentRef, data);
};

export const deleteAssignment = async (assignmentId: string) => {
  try {
    // First get all files associated with this assignment
    const filesQuery = query(
      collection(db, "files"),
      where("assignmentId", "==", assignmentId)
    );
    
    const filesSnapshot = await getDocs(filesQuery);
    
    // Delete all associated files
    const batch = writeBatch(db);
    
    // Delete files from storage and Firestore
    for (const fileDoc of filesSnapshot.docs) {
      const fileData = fileDoc.data() as FileItem;
      
      // Delete file from storage if it has a path
      if (fileData.path) {
        try {
          const fileRef = ref(storage, fileData.path);
          await deleteObject(fileRef);
          console.log(`Deleted file from storage: ${fileData.path}`);
        } catch (err) {
          console.error(`Error deleting file from storage: ${fileData.path}`, err);
          // Continue with deletion even if storage deletion fails
        }
      }
      
      // Mark file for deletion in Firestore
      batch.delete(fileDoc.ref);
    }
    
    // Delete the assignment itself
    batch.delete(doc(db, "assignments", assignmentId));
    
    // Commit all deletions as a single transaction
    await batch.commit();
    
    console.log(`Assignment and ${filesSnapshot.size} associated files deleted successfully`);
    return true;
  } catch (error) {
    console.error("Error deleting assignment and its files:", error);
    throw error;
  }
};

// Files
export const uploadFile = async (file: File, assignmentId: string, courseId: string, userId: string) => {
  const filePath = `files/${userId}/${assignmentId}/${file.name}`;
  const storageRef = ref(storage, filePath);
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);
  
  const fileData: Omit<FileItem, 'id' | 'createdAt'> = {
    userId,
    assignmentId,
    courseId,
    name: file.name,
    type: file.type,
    size: file.size,
    url: downloadUrl,
    path: filePath // Store the storage path for deletion
  };
  
  return addDoc(collection(db, "files"), {
    ...fileData,
    createdAt: new Date()
  });
};

// Generic file upload function for syllabi and other non-assignment files
export const uploadGenericFile = async (
  file: File, 
  path: string, 
  onProgress?: (progress: number) => void
) => {
  const storageRef = ref(storage, path);
  
  if (onProgress) {
    // Upload with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      }
    );
    
    await uploadTask;
  } else {
    // Simple upload without tracking
    await uploadBytes(storageRef, file);
  }
  
  const downloadUrl = await getDownloadURL(storageRef);
  
  return {
    url: downloadUrl,
    name: file.name,
    size: file.size,
    type: file.type,
    path: path // Store the storage path for deletion
  };
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
  try {
    console.log("Deleting file with path:", filePath);
    
    // Always delete from Firestore database, regardless of storage success
    const deleteFromFirestore = async () => {
      try {
        await deleteDoc(doc(db, "files", fileId));
        console.log("File record deleted from Firestore successfully");
        return true;
      } catch (firestoreError) {
        console.error("Error deleting file record from Firestore:", firestoreError);
        throw firestoreError;
      }
    };
    
    // Try to delete from storage if path exists
    if (filePath && filePath.trim() !== '') {
      try {
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
        console.log("File deleted from Storage successfully");
      } catch (storageError) {
        // Log the storage error but continue with Firestore deletion
        console.error("Error deleting file from Storage:", storageError);
        // Don't throw here - we still want to delete from Firestore
      }
    } else {
      console.warn("No valid storage path provided for file deletion");
    }
    
    // Always attempt to delete from Firestore, even if Storage deletion failed
    return await deleteFromFirestore();
  } catch (error) {
    console.error('Error in deleteFile function:', error);
    throw error;
  }
};

// Summary types and functions
export interface Summary {
  id?: string;
  userId: string;
  courseId: string;
  assignmentId?: string;
  title: string;
  overview: string;
  mainPoints: string[];
  keyTerms: string[];
  originalDocumentUrl?: string;
  originalDocumentName?: string;
  createdAt: any;
}

export const saveSummary = async (summaryData: Omit<Summary, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, "summaries"), {
      ...summaryData,
      createdAt: new Date()
    });
    
    return {
      id: docRef.id,
      ...summaryData,
      createdAt: new Date()
    } as Summary;
  } catch (error) {
    console.error("Error saving summary:", error);
    throw error;
  }
};

export const getUserSummaries = async (userId: string) => {
  try {
    const q = query(
      collection(db, "summaries"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Summary[];
  } catch (error) {
    console.error("Error fetching summaries:", error);
    return [];
  }
};

export const getSummary = async (summaryId: string) => {
  try {
    const docRef = doc(db, "summaries", summaryId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Summary;
    } else {
      throw new Error("Summary not found");
    }
  } catch (error) {
    console.error("Error fetching summary:", error);
    throw error;
  }
};

export const deleteSummary = async (summaryId: string) => {
  try {
    await deleteDoc(doc(db, "summaries", summaryId));
  } catch (error) {
    console.error("Error deleting summary:", error);
    throw error;
  }
};

export { app, auth, db, storage, onAuthStateChanged };
export type { FirebaseUser as User };
