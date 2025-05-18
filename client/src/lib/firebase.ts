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

export interface Assignment {
  id?: string;
  userId: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'submitted' | 'overdue';
  createdAt: Date;
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
  const q = query(
    collection(db, "courses"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Course[];
};

export const getCourse = async (courseId: string) => {
  const docRef = doc(db, "courses", courseId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Course;
  } else {
    throw new Error("Course not found");
  }
};

export const updateCourse = async (courseId: string, data: Partial<Course>) => {
  const courseRef = doc(db, "courses", courseId);
  return updateDoc(courseRef, data);
};

export const deleteCourse = async (courseId: string) => {
  return deleteDoc(doc(db, "courses", courseId));
};

// Assignments
export const addAssignment = async (assignmentData: Omit<Assignment, 'id' | 'createdAt'>) => {
  return addDoc(collection(db, "assignments"), {
    ...assignmentData,
    createdAt: new Date()
  });
};

export const getUserAssignments = async (userId: string) => {
  const q = query(
    collection(db, "assignments"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Assignment[];
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
    ...doc.data()
  })) as Assignment[];
};

export const getAssignment = async (assignmentId: string) => {
  const docRef = doc(db, "assignments", assignmentId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Assignment;
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
  const q = query(
    collection(db, "files"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as FileItem[];
};

export const deleteFile = async (fileId: string, filePath: string) => {
  const fileRef = ref(storage, filePath);
  await deleteObject(fileRef);
  return deleteDoc(doc(db, "files", fileId));
};

export { app, auth, db, storage, onAuthStateChanged };
export type { FirebaseUser as User };
