import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as pdfParse from 'pdf-parse';
import * as busboy from 'busboy';
import { Readable } from 'stream';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

interface Assignment {
  title: string;
  dueDate: string; // ISO YYYY-MM-DD format
  type: string;
}

interface TableRow {
  cells: string[];
}

interface Table {
  headers: string[];
  rows: TableRow[];
  score: number;
}

// Keywords for scoring table headers
const ASSIGNMENT_KEYWORDS = [
  'date', 'due', 'name', 'event', 'points', 
  'assignment', 'discussion', 'module', 'title', 
  'deadline', 'task', 'homework', 'project'
];

export const parseSyllabus = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { courseId, pdfBuffer } = await parseMultipartForm(req);
    
    if (!courseId || !pdfBuffer) {
      res.status(400).json({ error: 'Missing courseId or PDF file' });
      return;
    }

    console.log(`Processing syllabus for course: ${courseId}`);
    console.log(`PDF buffer size: ${pdfBuffer.length} bytes`);

    // Extract text from PDF
    const pdfData = await pdfParse(pdfBuffer);
    const fullText = pdfData.text;
    
    console.log(`Extracted ${fullText.length} characters from PDF`);

    // Step 1: Extract and score tables
    const tables = extractTablesFromText(fullText);
    console.log(`Found ${tables.length} potential tables`);

    let assignments: Assignment[] = [];

    // Step 2: Try table-first extraction
    const bestTable = findBestAssignmentTable(tables);
    if (bestTable && bestTable.score >= 2) {
      console.log(`Using table-based extraction (score: ${bestTable.score})`);
      assignments = parseAssignmentsFromTable(bestTable);
    } else {
      // Step 3: Fallback to fuzzy extraction with AI
      console.log('No suitable table found, using fuzzy extraction');
      assignments = await parseAssignmentsWithAI(fullText);
    }

    // Step 4: Date validation and filtering
    assignments = validateAndFilterAssignments(assignments);
    
    console.log(`Final assignments count: ${assignments.length}`);

    // Step 5: Write to Firestore
    if (assignments.length > 0) {
      await writeAssignmentsToFirestore(courseId, assignments);
      console.log(`Successfully wrote ${assignments.length} assignments to Firestore`);
    }

    res.status(200).json({
      success: true,
      courseId,
      assignmentsCount: assignments.length,
      assignments: assignments
    });

  } catch (error) {
    console.error('Error processing syllabus:', error);
    res.status(500).json({ 
      error: 'Failed to process syllabus',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

async function parseMultipartForm(req: functions.Request): Promise<{ courseId: string; pdfBuffer: Buffer }> {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    let courseId = '';
    let pdfBuffer: Buffer | null = null;

    bb.on('field', (name, val) => {
      if (name === 'courseId') {
        courseId = val;
      }
    });

    bb.on('file', (name, file, info) => {
      if (name === 'syllabus') {
        const chunks: Buffer[] = [];
        file.on('data', (chunk) => chunks.push(chunk));
        file.on('end', () => {
          pdfBuffer = Buffer.concat(chunks);
        });
      }
    });

    bb.on('close', () => {
      if (courseId && pdfBuffer) {
        resolve({ courseId, pdfBuffer });
      } else {
        reject(new Error('Missing courseId or PDF file'));
      }
    });

    bb.on('error', reject);

    if (req.rawBody) {
      bb.end(req.rawBody);
    } else {
      req.pipe(bb);
    }
  });
}

function extractTablesFromText(text: string): Table[] {
  const tables: Table[] = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let currentTable: string[] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect potential table start (multiple columns separated by whitespace/tabs)
    const hasMultipleColumns = /\s{3,}|\t/.test(line) && line.split(/\s{3,}|\t/).length >= 2;
    const hasDatePattern = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/i.test(line);
    
    if (hasMultipleColumns || hasDatePattern) {
      if (!inTable) {
        inTable = true;
        currentTable = [];
      }
      currentTable.push(line);
    } else if (inTable && currentTable.length >= 2) {
      // End of table found
      tables.push(parseTableFromLines(currentTable));
      currentTable = [];
      inTable = false;
    } else if (inTable && !hasMultipleColumns) {
      // Single column line might end the table
      inTable = false;
      if (currentTable.length >= 2) {
        tables.push(parseTableFromLines(currentTable));
      }
      currentTable = [];
    }
  }

  // Handle table at end of text
  if (inTable && currentTable.length >= 2) {
    tables.push(parseTableFromLines(currentTable));
  }

  return tables;
}

function parseTableFromLines(lines: string[]): Table {
  const table: Table = { headers: [], rows: [], score: 0 };
  
  if (lines.length === 0) return table;

  // First line as headers
  const headerLine = lines[0];
  table.headers = headerLine.split(/\s{3,}|\t/).map(h => h.trim()).filter(h => h.length > 0);
  
  // Remaining lines as rows
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(/\s{3,}|\t/).map(c => c.trim()).filter(c => c.length > 0);
    if (cells.length > 0) {
      table.rows.push({ cells });
    }
  }

  // Score the table based on header keywords
  table.score = scoreTableHeaders(table.headers);
  
  return table;
}

function scoreTableHeaders(headers: string[]): number {
  let score = 0;
  const headerText = headers.join(' ').toLowerCase();
  
  for (const keyword of ASSIGNMENT_KEYWORDS) {
    if (headerText.includes(keyword)) {
      score++;
    }
  }
  
  return score;
}

function findBestAssignmentTable(tables: Table[]): Table | null {
  if (tables.length === 0) return null;
  
  // Sort by score descending
  tables.sort((a, b) => b.score - a.score);
  
  return tables[0].score >= 2 ? tables[0] : null;
}

function parseAssignmentsFromTable(table: Table): Assignment[] {
  const assignments: Assignment[] = [];
  
  // Find column indices for date, title, and type
  const dateColumnIndex = findColumnIndex(table.headers, ['date', 'due', 'deadline']);
  const titleColumnIndex = findColumnIndex(table.headers, ['name', 'title', 'assignment', 'task']);
  const typeColumnIndex = findColumnIndex(table.headers, ['type', 'category', 'kind']);
  
  console.log(`Column indices - Date: ${dateColumnIndex}, Title: ${titleColumnIndex}, Type: ${typeColumnIndex}`);

  for (const row of table.rows) {
    try {
      const assignment = parseAssignmentFromRow(row.cells, dateColumnIndex, titleColumnIndex, typeColumnIndex);
      if (assignment) {
        assignments.push(assignment);
      }
    } catch (error) {
      console.log(`Skipping row due to parse error:`, error);
    }
  }

  return assignments;
}

function findColumnIndex(headers: string[], keywords: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase();
    for (const keyword of keywords) {
      if (header.includes(keyword)) {
        return i;
      }
    }
  }
  return -1;
}

function parseAssignmentFromRow(
  cells: string[], 
  dateIndex: number, 
  titleIndex: number, 
  typeIndex: number
): Assignment | null {
  if (cells.length === 0) return null;

  // Extract date
  let dueDate = '';
  if (dateIndex >= 0 && dateIndex < cells.length) {
    dueDate = parseDateToISO(cells[dateIndex]);
  } else {
    // Look for date in any cell
    for (const cell of cells) {
      const parsedDate = parseDateToISO(cell);
      if (parsedDate) {
        dueDate = parsedDate;
        break;
      }
    }
  }

  if (!dueDate) return null;

  // Extract title
  let title = '';
  if (titleIndex >= 0 && titleIndex < cells.length) {
    title = cells[titleIndex].trim();
  } else {
    // Use the longest non-date cell as title
    let longestCell = '';
    for (const cell of cells) {
      if (!parseDateToISO(cell) && cell.length > longestCell.length) {
        longestCell = cell;
      }
    }
    title = longestCell.trim();
  }

  if (!title) return null;

  // Extract type
  let type = 'Assignment'; // Default
  if (typeIndex >= 0 && typeIndex < cells.length) {
    type = cells[typeIndex].trim();
  } else {
    // Infer type from title
    const titleLower = title.toLowerCase();
    if (titleLower.includes('discussion')) type = 'Discussion';
    else if (titleLower.includes('quiz')) type = 'Quiz';
    else if (titleLower.includes('exam')) type = 'Exam';
    else if (titleLower.includes('project')) type = 'Project';
    else if (titleLower.includes('lab')) type = 'Lab';
  }

  return { title, dueDate, type };
}

function parseDateToISO(dateStr: string): string {
  if (!dateStr) return '';

  // Remove extra whitespace and clean up
  dateStr = dateStr.trim().replace(/\s+/g, ' ');

  // Pattern 1: M/D/YY or M/D/YYYY
  const slashPattern = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/;
  const slashMatch = dateStr.match(slashPattern);
  if (slashMatch) {
    let [, month, day, year] = slashMatch;
    if (year.length === 2) {
      year = '20' + year; // Assume 2000s
    }
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Pattern 2: Month D, YYYY or Month D YYYY
  const monthPattern = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i;
  const monthMatch = dateStr.match(monthPattern);
  if (monthMatch) {
    const [, monthName, day, year] = monthMatch;
    const monthMap: {[key: string]: string} = {
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };
    const month = monthMap[monthName.toLowerCase().substring(0, 3)];
    if (month) {
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }
  }

  return '';
}

async function parseAssignmentsWithAI(fullText: string): Promise<Assignment[]> {
  try {
    // Extract candidate lines with dates
    const candidateLines = extractDateCandidateLines(fullText);
    
    if (candidateLines.length === 0) {
      console.log('No candidate lines found for AI processing');
      return [];
    }

    console.log(`Found ${candidateLines.length} candidate lines for AI processing`);

    // Prepare prompt for OpenRouter
    const prompt = `Extract assignment information from these candidate lines. Return ONLY valid JSON in this exact format:
{
  "assignments": [
    { "title": "...", "dueDate": "YYYY-MM-DD", "type": "..." }
  ]
}

Rules:
- Only extract assignments that have clear due dates
- Convert all dates to YYYY-MM-DD format
- Types should be: Assignment, Discussion, Quiz, Exam, Project, Lab, or Paper
- Only include entries that clearly represent coursework

Candidate lines:
${candidateLines.slice(0, 50).join('\n')}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content returned from AI');
    }

    // Parse JSON response
    const parsed = JSON.parse(content);
    return parsed.assignments || [];

  } catch (error) {
    console.error('AI processing failed:', error);
    return [];
  }
}

function extractDateCandidateLines(text: string): string[] {
  const lines = text.split('\n');
  const candidates: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 10) continue; // Skip very short lines
    
    // Look for lines containing dates
    const hasDate = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/i.test(trimmed);
    
    if (hasDate) {
      candidates.push(trimmed);
    }
  }
  
  return candidates;
}

function validateAndFilterAssignments(assignments: Assignment[]): Assignment[] {
  if (assignments.length === 0) return [];

  // Sort assignments by due date
  const validAssignments = assignments
    .filter(a => a.dueDate && a.title)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  if (validAssignments.length === 0) return [];

  // Use the earliest date as course start reference
  const earliestDate = new Date(validAssignments[0].dueDate);
  const courseStartThreshold = new Date(earliestDate);
  courseStartThreshold.setDate(courseStartThreshold.getDate() - 30); // Allow 30 days before first assignment

  // Filter out assignments that are too early
  const filtered = validAssignments.filter(assignment => {
    const assignmentDate = new Date(assignment.dueDate);
    return assignmentDate >= courseStartThreshold;
  });

  console.log(`Filtered ${validAssignments.length - filtered.length} assignments that were too early`);
  
  return filtered;
}

async function writeAssignmentsToFirestore(courseId: string, assignments: Assignment[]): Promise<void> {
  const batch = db.batch();
  
  // Get course document reference
  const courseRef = db.collection('courses').doc(courseId);
  
  // Add each assignment to the subcollection
  for (const assignment of assignments) {
    const assignmentRef = courseRef.collection('assignments').doc();
    batch.set(assignmentRef, {
      ...assignment,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending'
    });
  }
  
  // Execute batch write
  await batch.commit();
}