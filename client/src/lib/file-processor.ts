import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

/**
 * Extracts actual text content from PDF using PDF.js
 */
export async function extractTextFromFile(file: File): Promise<string> {
  console.log("🔍 PARSING SYLLABUS - Starting real PDF text extraction");
  console.log(`📄 File: ${file.name} (${Math.round(file.size / 1024)}KB)`);
  
  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are supported for now');
  }
  
  try {
    // Load PDF using PDF.js
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    console.log(`📄 PDF loaded successfully - ${pdf.numPages} pages`);
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine all text items from the page
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
      console.log(`📄 Page ${pageNum}: extracted ${pageText.length} characters`);
    }
    
    // Clean up the extracted text
    const cleanText = fullText
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/\n\s+/g, '\n')  // Clean line breaks
      .trim();
    
    console.log(`✅ EXTRACTION COMPLETE: ${cleanText.length} total characters`);
    console.log(`📄 Text preview (first 500 chars):\n${cleanText.substring(0, 500)}`);
    
    return cleanText;
    
  } catch (error) {
    console.error('❌ PDF parsing failed:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
 * Extracts course information from syllabus text
 */
export function parseCourseInfo(text: string): any {
  console.log("🏫 Parsing course information...");
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const courseInfo: any = {};
  
  // Look for course code patterns (e.g., "CS 101", "MATH-200", "WW-HUMN 340")
  const codePattern = /([A-Z]{2,4}[-\s]?[A-Z]{0,4}[-\s]?\d{3,4})/;
  const codeMatch = text.match(codePattern);
  if (codeMatch) {
    courseInfo.code = codeMatch[1];
    console.log(`📖 Found course code: ${courseInfo.code}`);
  }
  
  // Look for course title (usually after the course code)
  if (courseInfo.code) {
    const codeIndex = text.indexOf(courseInfo.code);
    const afterCode = text.substring(codeIndex + courseInfo.code.length, codeIndex + 200);
    const titleMatch = afterCode.match(/([A-Z][A-Za-z\s&:,-]+?)(?:\n|Course|Syllabus|Credits?|Units?)/);
    if (titleMatch) {
      courseInfo.name = titleMatch[1].trim();
      console.log(`📚 Found course name: ${courseInfo.name}`);
    }
  }
  
  // Look for term/semester info
  const termPattern = /(Fall|Spring|Summer|Winter)\s+(\d{4})|(\d{4})[-\s](Fall|Spring|Summer|Winter|01|02|03|04|05|06|07|08|09|10|11|12)/i;
  const termMatch = text.match(termPattern);
  if (termMatch) {
    courseInfo.term = termMatch[0];
    console.log(`📅 Found term: ${courseInfo.term}`);
  }
  
  // Look for credit hours
  const creditPattern = /(\d+)\s*(credit|unit|hour)s?/i;
  const creditMatch = text.match(creditPattern);
  if (creditMatch) {
    courseInfo.credits = parseInt(creditMatch[1]);
    console.log(`⭐ Found credits: ${courseInfo.credits}`);
  }
  
  // Look for instructor name
  const instructorPattern = /(?:instructor|professor|teacher)[\s:]*([A-Z][a-z]+\s+[A-Z][a-z]+)/i;
  const instructorMatch = text.match(instructorPattern);
  if (instructorMatch) {
    courseInfo.instructor = instructorMatch[1];
    console.log(`👨‍🏫 Found instructor: ${courseInfo.instructor}`);
  }
  
  return courseInfo;
}

/**
 * Extracts assignments from syllabus text
 */
export function parseAssignments(text: string): any[] {
  console.log("📋 Parsing assignments...");
  
  const assignments: any[] = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Find assignment sections
  let inAssignmentSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    // Detect assignment section headers
    if (lowerLine.includes('assignment') || lowerLine.includes('schedule') || 
        lowerLine.includes('coursework') || lowerLine.includes('homework')) {
      inAssignmentSection = true;
      console.log(`📍 Found assignment section: ${line}`);
      continue;
    }
    
    // Stop at major section headers
    if (line === line.toUpperCase() && line.length > 5 && !line.includes('-')) {
      if (lowerLine.includes('grading') || lowerLine.includes('policy') || 
          lowerLine.includes('schedule') && !lowerLine.includes('assignment')) {
        inAssignmentSection = false;
      }
    }
    
    if (!inAssignmentSection) continue;
    
    // Parse different assignment formats
    
    // Format: "MM/DD/YYYY - Assignment Title"
    const dateAssignmentMatch = line.match(/^(\d{1,2}\/\d{1,2}\/\d{2,4})\s*[-–—]\s*(.+)$/);
    if (dateAssignmentMatch) {
      assignments.push({
        title: dateAssignmentMatch[2].trim(),
        dueDate: parseDateToISO(dateAssignmentMatch[1]),
        type: 'assignment'
      });
      continue;
    }
    
    // Format: "- Assignment Title" or "• Assignment Title"
    const bulletMatch = line.match(/^[-•*]\s*(.+)$/);
    if (bulletMatch) {
      assignments.push({
        title: bulletMatch[1].trim(),
        dueDate: null,
        type: 'assignment'
      });
      continue;
    }
    
    // Format: "Assignment 1:", "Homework 2:", etc.
    const numberedMatch = line.match(/^(Assignment|Homework|Project|Quiz|Exam|Test|Paper)\s*\d*:?\s*(.*)$/i);
    if (numberedMatch) {
      assignments.push({
        title: numberedMatch[0].trim(),
        dueDate: null,
        type: numberedMatch[1].toLowerCase()
      });
      continue;
    }
  }
  
  console.log(`📋 Found ${assignments.length} assignments`);
  assignments.forEach((assignment, index) => {
    console.log(`  ${index + 1}. ${assignment.title} ${assignment.dueDate ? `(due: ${assignment.dueDate})` : ''}`);
  });
  
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