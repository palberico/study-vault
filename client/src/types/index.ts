// Firebase Authentication Types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Course Types
export interface Course {
  id?: string;
  userId: string;
  code: string;
  name: string;
  description?: string;
  term: string;
  createdAt: Date;
}

export interface CreateCourseData {
  userId: string;
  code: string;
  name: string;
  description?: string;
  term: string;
}

// Resource Link Type
export interface ResourceLink {
  label: string;
  url: string;
}

// Assignment Types
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

export interface CreateAssignmentData {
  userId: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'submitted' | 'overdue';
  links?: ResourceLink[];
}

// File Types
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

export interface FileUploadData {
  userId: string;
  assignmentId: string;
  courseId: string;
  name: string;
  type: string;
  size: number;
  url: string;
}
