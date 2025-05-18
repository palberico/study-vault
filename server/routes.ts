import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertCourseSchema, insertAssignmentSchema, insertFileSchema } from "@shared/schema";

// Validation middleware
const validate = (schema: z.ZodType<any, any>) => (req: Request, res: Response, next: Function) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/users", validate(insertUserSchema), async (req, res) => {
    try {
      const existing = await storage.getUserByEmail(req.body.email);
      if (existing) {
        return res.status(409).json({ message: "User with this email already exists" });
      }
      
      const user = await storage.createUser(req.body);
      res.status(201).json({ id: user.id, email: user.email });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Course routes
  app.get("/api/courses", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      
      const courses = await storage.getCoursesByUserId(userId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
      
      const course = await storage.getCourse(id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", validate(insertCourseSchema), async (req, res) => {
    try {
      const course = await storage.createCourse(req.body);
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.put("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
      
      const course = await storage.getCourse(id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      const updatedCourse = await storage.updateCourse(id, req.body);
      res.json(updatedCourse);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
      
      const course = await storage.getCourse(id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      const success = await storage.deleteCourse(id);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete course" });
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Assignment routes
  app.get("/api/assignments", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      
      let assignments;
      if (courseId) {
        assignments = await storage.getAssignmentsByCourseId(courseId);
      } else if (userId) {
        assignments = await storage.getAssignmentsByUserId(userId);
      } else {
        return res.status(400).json({ message: "userId or courseId is required" });
      }
      
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.get("/api/assignments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid assignment ID" });
      }
      
      const assignment = await storage.getAssignment(id);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      res.json(assignment);
    } catch (error) {
      console.error("Error fetching assignment:", error);
      res.status(500).json({ message: "Failed to fetch assignment" });
    }
  });

  app.post("/api/assignments", validate(insertAssignmentSchema), async (req, res) => {
    try {
      const assignment = await storage.createAssignment(req.body);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  app.put("/api/assignments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid assignment ID" });
      }
      
      const assignment = await storage.getAssignment(id);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      const updatedAssignment = await storage.updateAssignment(id, req.body);
      res.json(updatedAssignment);
    } catch (error) {
      console.error("Error updating assignment:", error);
      res.status(500).json({ message: "Failed to update assignment" });
    }
  });

  app.delete("/api/assignments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid assignment ID" });
      }
      
      const assignment = await storage.getAssignment(id);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      const success = await storage.deleteAssignment(id);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete assignment" });
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      res.status(500).json({ message: "Failed to delete assignment" });
    }
  });

  // File routes
  app.get("/api/files", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const assignmentId = req.query.assignmentId ? parseInt(req.query.assignmentId as string) : undefined;
      
      let files;
      if (assignmentId) {
        files = await storage.getFilesByAssignmentId(assignmentId);
      } else if (userId) {
        files = await storage.getFilesByUserId(userId);
      } else {
        return res.status(400).json({ message: "userId or assignmentId is required" });
      }
      
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.get("/api/files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }
      
      const file = await storage.getFile(id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.json(file);
    } catch (error) {
      console.error("Error fetching file:", error);
      res.status(500).json({ message: "Failed to fetch file" });
    }
  });

  app.post("/api/files", validate(insertFileSchema), async (req, res) => {
    try {
      const file = await storage.createFile(req.body);
      res.status(201).json(file);
    } catch (error) {
      console.error("Error creating file:", error);
      res.status(500).json({ message: "Failed to create file" });
    }
  });

  app.delete("/api/files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }
      
      const file = await storage.getFile(id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      const success = await storage.deleteFile(id);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete file" });
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
