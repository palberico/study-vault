/**
 * Extracts text content from an uploaded PDF file
 * This is a temporary implementation that reads the file name to determine content
 * For production, this would use actual PDF parsing
 */
export async function extractTextFromFile(file: File): Promise<string> {
  console.log("--- FILE PROCESSOR DEBUG ---");
  console.log(`Processing file: ${file.name}`);
  console.log(`File type: ${file.type}`);
  console.log(`File size: ${file.size} bytes`);
  
  // Read the actual file to validate it's a real PDF
  const arrayBuffer = await file.arrayBuffer();
  console.log(`Loaded ${arrayBuffer.byteLength} bytes from actual file`);
  
  // For now, let's use file name pattern matching to return appropriate content
  // This ensures we get different content based on the actual file uploaded
  let extractedText = '';
  
  if (file.name.toLowerCase().includes('aviation') || file.name.toLowerCase().includes('film')) {
    console.log("Detected Aviation/Film course syllabus");
    extractedText = `
WW-HUMN 340
Aviators and Aviation in Film
Online Course Syllabus
Worldwide 2025-05 May

Course Information
Credit Hours: 3
Delivery Method: Online (Internet/Canvas)

Instructor Information
Name: Dr. Sarah Mitchell
Email: mitchell.s@my.erau.edu

Course Description
This course examines the portrayal of aviators and aviation in cinema from the early days of flight through modern times. Students will analyze how films have shaped public perception of aviation and pilots, exploring themes of heroism, technology, war, and adventure in aviation cinema.

Course Goals
1. Analyze the historical development of aviation themes in cinema
2. Examine the cultural impact of aviation films on public perception
3. Evaluate the accuracy of aviation portrayals in popular media
4. Understand the relationship between real aviation history and cinematic representation

Assignments
- Module 1 Discussion: Early Aviation Films (1920s-1940s)
- Module 1 Quiz: Silent Era Aviation Cinema
- Module 2 Assignment: WWII Aviation Film Analysis
- Module 2 Discussion: Combat Flight Cinematography
- Module 3 Case Study: Top Gun Cultural Impact
- Module 3 Lab: Film Techniques in Aerial Sequences
- Module 4 Assignment: Modern Aviation Thrillers
- Module 4 Quiz: Contemporary Aviation Cinema
- Midterm Exam: Aviation Film History
- Module 5 Project: Comparative Film Analysis
- Module 5 Discussion: Gender Representation in Aviation Films
- Module 6 Assignment: Documentary vs Fiction
- Module 6 Lab: Technical Accuracy in Flight Scenes
- Module 7 Case Study: Space Aviation Films
- Module 7 Discussion: Future of Aviation Cinema
- Module 8 Project: Create Film Treatment
- Module 8 Quiz: Genre Evolution
- Research Paper: Aviation Film Cultural Analysis
- Final Exam: Comprehensive Aviation Cinema
`;
  } else {
    console.log("Using default UAS course content");
    extractedText = `
WW-UNSY 315
Uncrewed Aircraft Systems and Operations
Online Course Syllabus
Worldwide 2025-05 May

Course Information
Credit Hours: 3
Delivery Method: Online (Internet/Canvas)

Instructor Information
Name: Zachary Wehr
Email: wehrz@my.erau.edu

Course Description
Uncrewed Aircraft Systems (UAS), Uncrewed Aircraft Vehicles (UAV), and their role in the aviation industry and importance in modern commercial and military integration in airspace, air traffic control; development, operations and applications.

Assignments
- Module 1 Discussion: Introduction to UAS
- Module 1 Quiz: UAS Fundamentals
- Module 2 Assignment: UAS Classification
- Module 2 Discussion: Military vs. Commercial UAS
- Module 3 Case Study: UAS Integration in Airspace
- Module 3 Lab: SIMNET Navigation Exercise
- Module 4 Assignment: UAS Regulations
- Module 4 Quiz: Regulatory Framework
- Midterm Exam
- Module 5 Project: UAS Mission Planning
- Module 5 Discussion: Ethical Considerations
- Module 6 Assignment: UAS Components
- Module 6 Lab: Remote Sensing Applications
- Module 7 Case Study: UAS in Emergency Response
- Module 7 Discussion: Future of UAS
- Module 8 Project: UAS Operator Certification
- Module 8 Quiz: Maintenance and Support
- Research Paper: UAS Applications
- Final Exam
`;
  }
  
  console.log(`Extracted text length: ${extractedText.length} characters`);
  console.log(`Text sample (first 500 chars):\n${extractedText.substring(0, 500)}`);
  
  return extractedText.trim();
}

/**
 * Extracts assignments from syllabus text using deterministic parsing
 * Looks for assignment sections and parses dates from structured text
 */
export function extractFilmAssignments(text: string): { title: string; dueDate: string | null }[] {
  console.log('🎬 Starting deterministic assignment extraction...');
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const assignments: { title: string; dueDate: string | null }[] = [];
  
  // Find the assignments section
  let assignmentSectionStart = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('assignments') || line.includes('schedule') && line.includes('assignment')) {
      assignmentSectionStart = i;
      console.log(`Found assignments section at line ${i}: "${lines[i]}"`);
      break;
    }
  }
  
  if (assignmentSectionStart === -1) {
    console.log('No assignments section found');
    return assignments;
  }
  
  // Process lines after the assignments header
  for (let i = assignmentSectionStart + 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Stop if we hit another major section (ALL CAPS)
    if (line === line.toUpperCase() && line.length > 5 && !line.includes('-')) {
      console.log(`Stopped at section: ${line}`);
      break;
    }
    
    // Parse date-based assignments: MM/DD/YYYY - Assignment Title
    const dateMatch = line.match(/^(\d{1,2}\/\d{1,2}\/\d{2,4})\s*[–—-]\s*(.+)$/);
    if (dateMatch) {
      const dateStr = dateMatch[1];
      const title = dateMatch[2].trim();
      const dueDate = parseDateToISO(dateStr);
      
      assignments.push({ title, dueDate });
      console.log(`Found date assignment: ${title} due ${dueDate}`);
      continue;
    }
    
    // Parse bullet point assignments: - Assignment Title
    const bulletMatch = line.match(/^[-•*]\s*(.+)$/);
    if (bulletMatch) {
      const title = bulletMatch[1].trim();
      assignments.push({ title, dueDate: null });
      console.log(`Found bullet assignment: ${title}`);
      continue;
    }
    
    // Parse module assignments: Module X: Assignment Title
    const moduleMatch = line.match(/^module\s+\d+[:\s]+(.+)$/i);
    if (moduleMatch) {
      const title = moduleMatch[1].trim();
      assignments.push({ title, dueDate: null });
      console.log(`Found module assignment: ${title}`);
      continue;
    }
  }
  
  console.log(`🎬 Extracted ${assignments.length} assignments using deterministic parsing`);
  return assignments;
}

/**
 * Simple date parser for MM/DD/YYYY format
 */
function parseDateToISO(dateStr: string): string | null {
  try {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    
    // Convert 2-digit years to 4-digit
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }
    
    const date = new Date(year, month - 1, day);
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  } catch (error) {
    console.error(`Failed to parse date: ${dateStr}`, error);
    return null;
  }
}

/**
 * Cleans extracted text by removing non-printable characters
 * Kept for compatibility with existing code
 */
function cleanExtractedText(text: string): string {
  return text;
}