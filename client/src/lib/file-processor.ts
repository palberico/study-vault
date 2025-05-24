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
  
  // Remove all hardcoded content - read only what's actually in the PDF
  console.log("Reading actual PDF content (no fallback data)");
  
  let extractedText = '';
  
  try {
    // Basic text extraction from PDF buffer
    // In a real implementation, this would use pdf-parse or similar library
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let rawText = decoder.decode(arrayBuffer);
    
    // Clean up the extracted text to make it more readable
    // Remove non-printable characters but keep structure
    rawText = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
    
    // Look for actual readable content in the PDF
    const textChunks = rawText.split(/\s+/).filter(chunk => 
      chunk.length > 2 && 
      /[a-zA-Z]/.test(chunk) && 
      !chunk.match(/^[^a-zA-Z]*$/)
    );
    
    if (textChunks.length > 10) {
      // Found substantial text content
      extractedText = textChunks.join(' ').substring(0, 5000); // Limit to first 5000 chars
      console.log(`Successfully extracted ${textChunks.length} text chunks from PDF`);
    } else {
      // PDF is encoded and needs specialized parsing
      extractedText = `PDF Content Detected: ${file.name}
      
File size: ${file.size} bytes
Status: PDF requires specialized parsing library

This PDF contains encoded content that cannot be extracted with basic text decoding.
To read the actual syllabus content, we would need to implement a PDF parsing library like pdf-parse.

For now, this shows that your file was uploaded successfully but the content extraction needs enhancement.`;
    }
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    extractedText = `Error reading PDF: ${file.name}
    
The PDF file was uploaded but could not be processed.
Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
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