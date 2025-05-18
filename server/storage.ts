import { 
  users, type User, type InsertUser,
  courses, type Course, type InsertCourse,
  assignments, type Assignment, type InsertAssignment,
  files, type File, type InsertFile
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Course operations
  getCourse(id: number): Promise<Course | undefined>;
  getCoursesByUserId(userId: string): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;
  
  // Assignment operations
  getAssignment(id: number): Promise<Assignment | undefined>;
  getAssignmentsByUserId(userId: string): Promise<Assignment[]>;
  getAssignmentsByCourseId(courseId: number): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: number, assignment: Partial<InsertAssignment>): Promise<Assignment | undefined>;
  deleteAssignment(id: number): Promise<boolean>;
  
  // File operations
  getFile(id: number): Promise<File | undefined>;
  getFilesByUserId(userId: string): Promise<File[]>;
  getFilesByAssignmentId(assignmentId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  deleteFile(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private assignments: Map<number, Assignment>;
  private files: Map<number, File>;
  private userId: number;
  private courseId: number;
  private assignmentId: number;
  private fileId: number;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.assignments = new Map();
    this.files = new Map();
    this.userId = 1;
    this.courseId = 1;
    this.assignmentId = 1;
    this.fileId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCoursesByUserId(userId: string): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(
      (course) => course.userId === userId,
    );
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.courseId++;
    const now = new Date();
    const course: Course = { ...insertCourse, id, createdAt: now };
    this.courses.set(id, course);
    return course;
  }

  async updateCourse(id: number, updateData: Partial<InsertCourse>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    
    const updatedCourse: Course = { ...course, ...updateData };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    return this.courses.delete(id);
  }

  // Assignment operations
  async getAssignment(id: number): Promise<Assignment | undefined> {
    return this.assignments.get(id);
  }

  async getAssignmentsByUserId(userId: string): Promise<Assignment[]> {
    return Array.from(this.assignments.values()).filter(
      (assignment) => assignment.userId === userId,
    );
  }

  async getAssignmentsByCourseId(courseId: number): Promise<Assignment[]> {
    return Array.from(this.assignments.values()).filter(
      (assignment) => assignment.courseId === courseId,
    );
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const id = this.assignmentId++;
    const now = new Date();
    const assignment: Assignment = { ...insertAssignment, id, createdAt: now };
    this.assignments.set(id, assignment);
    return assignment;
  }

  async updateAssignment(id: number, updateData: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    const assignment = this.assignments.get(id);
    if (!assignment) return undefined;
    
    const updatedAssignment: Assignment = { ...assignment, ...updateData };
    this.assignments.set(id, updatedAssignment);
    return updatedAssignment;
  }

  async deleteAssignment(id: number): Promise<boolean> {
    return this.assignments.delete(id);
  }

  // File operations
  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFilesByUserId(userId: string): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.userId === userId,
    );
  }

  async getFilesByAssignmentId(assignmentId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.assignmentId === assignmentId,
    );
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.fileId++;
    const now = new Date();
    const file: File = { ...insertFile, id, createdAt: now };
    this.files.set(id, file);
    return file;
  }

  async deleteFile(id: number): Promise<boolean> {
    return this.files.delete(id);
  }
}

export const storage = new MemStorage();
