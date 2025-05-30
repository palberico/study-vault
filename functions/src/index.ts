import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Busboy = require('busboy');
const fetch = require('node-fetch');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

interface CourseData {
  code: string;
  name: string;
  term: string;
  description: string;
}

interface AssignmentData {
  title: string;
  description: string;
  dueDate: string | null; // ISO format YYYY-MM-DD
  status: string;
  tags: string[];
}

interface ParsedSyllabusData {
  course: CourseData;
  assignments: AssignmentData[];
}

export const analyzeSyllabus = functions.https.onRequest(async (req: any, res: any) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Only POST allowed');
    return;
  }

  const { courseId, userId, fileName, text, assignments } = req.body;
  
  if (!courseId || !userId || !text) {
    res.status(400).json({ error: 'Missing required fields: courseId, userId, or text' });
    return;
  }

  try {
    console.log(`Processing syllabus text for user: ${userId}, course: ${courseId}`);
    console.log(`Text length: ${text.length} characters`);
    console.log(`Pre-parsed assignments received: ${assignments ? assignments.length : 0}`);

    let finalAssignments: AssignmentData[] = [];
    let courseData: CourseData;

    // If client already parsed assignments deterministically, use them
    if (assignments && assignments.length > 0) {
      console.log('Using deterministically parsed assignments from client');
      finalAssignments = assignments.map((assignment: any) => ({
        title: assignment.title,
        description: `Assignment: ${assignment.title}`,
        dueDate: assignment.dueDate,
        status: 'pending',
        tags: []
      }));
      
      // Extract course info from text
      courseData = extractCourseInformation(text);
    } else {
      console.log('No pre-parsed assignments, using AI parsing');
      // Fallback to AI parsing
      const parsedData = await intelligentSyllabusParsing(text);
      
      if (!parsedData || !parsedData.course || !parsedData.assignments) {
        throw new Error('Failed to extract course or assignment information from syllabus text');
      }
      
      courseData = parsedData.course;
      finalAssignments = parsedData.assignments;
    }

    console.log(`Successfully processed: ${courseData.name || 'Unknown Course'} with ${finalAssignments.length} assignments`);

    // Return the processed data to the client
    res.status(200).json({
      success: true,
      course: courseData,
      assignments: finalAssignments,
      assignmentsCount: finalAssignments.length
    });

  } catch (error) {
    console.error('Error analyzing syllabus:', error);
    res.status(500).json({ 
      error: 'Failed to analyze syllabus',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Storage trigger removed due to deployment issues - using HTTP trigger instead

// NEW: Clean, reliable PDF parsing without Busboy
export const parseStoredSyllabus = functions.https.onRequest(async (req: any, res: any) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Only POST');
  }

  const { storagePath, courseId, userId } = req.body;
  
  if (!storagePath || !courseId || !userId) {
    return res.status(400).json({ error: 'Missing storagePath, courseId or userId' });
  }

  try {
    console.log(`🎯 Processing PDF from Storage: ${storagePath}`);
    
    // Download PDF from Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);
    const [buffer] = await file.download();

    // Parse with pdf-parse
    const { text } = await pdfParse(buffer);
    console.log('✅ PDF text snippet:', text.slice(0, 300));
    console.log(`📄 Full text length: ${text.length} characters`);

    // Save to Firestore for real-time client updates
    await admin.firestore()
      .collection('parsedSyllabi')
      .add({ 
        userId, 
        courseId, 
        fileName: storagePath.split('/').pop(),
        text, 
        textSnippet: text.slice(0, 300),
        createdAt: admin.firestore.FieldValue.serverTimestamp() 
      });

    return res.json({ 
      success: true, 
      text: text.slice(0, 300),
      fullTextLength: text.length,
      message: 'PDF parsed successfully'
    });

  } catch (e: any) {
    console.error('❌ parseStoredSyllabus error:', e);
    return res.status(500).json({ error: e.message });
  }
});

export const parseSyllabus = functions.https.onRequest(async (req: any, res: any) => {
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
      console.log('Starting syllabus parsing...');
      
      const { courseId, fileBuffer, fileName, userId } = await parseMultipartForm(req);
      
      if (!courseId || !fileBuffer || !userId) {
        res.status(400).json({ error: 'Missing required fields: courseId, file, or userId' });
        return;
      }

      console.log(`Processing file: ${fileName} (${fileBuffer.length} bytes) for course: ${courseId}`);

      // Extract text from the document
      const extractedText = await extractTextFromDocument(fileBuffer, fileName);
      
      if (!extractedText || extractedText.length < 100) {
        throw new Error('Failed to extract meaningful text from document');
      }

      console.log(`Extracted ${extractedText.length} characters from document`);

      // Upload syllabus to Firebase Storage
      const syllabusUrl = await uploadSyllabusToStorage(fileBuffer, fileName, courseId, userId);
      console.log(`Uploaded syllabus to: ${syllabusUrl}`);

      // Parse course and assignment data intelligently
      const parsedData = await intelligentSyllabusParsing(extractedText);
      
      console.log(`Parsed course: ${parsedData.course.code} - ${parsedData.course.name}`);
      console.log(`Found ${parsedData.assignments.length} assignments`);

      // Update course document in Firestore
      const courseRef = db.collection('courses').doc(courseId);
      await courseRef.update({
        code: parsedData.course.code,
        name: parsedData.course.name,
        term: parsedData.course.term,
        description: parsedData.course.description,
        syllabusUrl: syllabusUrl,
        syllabusName: fileName,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create assignment documents
      const batch = db.batch();
      for (const assignment of parsedData.assignments) {
        const assignmentRef = courseRef.collection('assignments').doc();
        batch.set(assignmentRef, {
          ...assignment,
          courseId: courseId,
          userId: userId,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      await batch.commit();

      res.status(200).json({
        success: true,
        courseId,
        course: parsedData.course,
        assignmentsCount: parsedData.assignments.length,
        syllabusUrl
      });

    } catch (error) {
      console.error('Error processing syllabus:', error);
      res.status(500).json({ 
        error: 'Failed to process syllabus',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

async function parseMultipartForm(req: any): Promise<{
  courseId: string;
  fileBuffer: Buffer;
  fileName: string;
  userId: string;
}> {
  return new Promise((resolve, reject) => {
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Request method:', req.method);
    
    // Check if we have rawBody (Firebase Functions provides this for multipart)
    if (req.rawBody) {
      console.log('Using req.rawBody, length:', req.rawBody.length);
      
      const busboy = Busboy({ 
        headers: req.headers,
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB limit
          files: 1,
          fields: 10
        }
      });
      
      const formData: any = {};
      let fileBuffer: Buffer | null = null;
      let fileName = '';

      busboy.on('field', (name: string, val: string) => {
        console.log(`Field: ${name} = ${val}`);
        formData[name] = val;
      });

      busboy.on('file', (name: string, file: any, info: any) => {
        console.log(`File: ${name}, filename: ${info.filename}`);
        
        if (name === 'syllabus') {
          fileName = info.filename;
          const chunks: Buffer[] = [];
          
          file.on('data', (chunk: Buffer) => chunks.push(chunk));
          file.on('end', () => {
            fileBuffer = Buffer.concat(chunks);
            console.log(`File complete: ${fileBuffer.length} bytes`);
          });
          file.on('error', reject);
        } else {
          file.resume();
        }
      });

      busboy.on('finish', () => {
        const { courseId, userId } = formData;
        if (courseId && userId && fileBuffer && fileName) {
          resolve({ courseId, fileBuffer, fileName, userId });
        } else {
          reject(new Error(`Missing: courseId=${courseId}, userId=${userId}, file=${!!fileBuffer}`));
        }
      });

      busboy.on('error', reject);
      
      // Write the raw body to busboy
      busboy.end(req.rawBody);
      
    } else {
      console.log('No rawBody, trying to pipe request stream...');
      
      const busboy = Busboy({ 
        headers: req.headers,
        limits: {
          fileSize: 10 * 1024 * 1024,
          files: 1,
          fields: 10
        }
      });
      
      const formData: any = {};
      let fileBuffer: Buffer | null = null;
      let fileName = '';

      busboy.on('field', (name: string, val: string) => {
        console.log(`Field: ${name} = ${val}`);
        formData[name] = val;
      });

      busboy.on('file', (name: string, file: any, info: any) => {
        console.log(`File: ${name}, filename: ${info.filename}`);
        
        if (name === 'syllabus') {
          fileName = info.filename;
          const chunks: Buffer[] = [];
          
          file.on('data', (chunk: Buffer) => chunks.push(chunk));
          file.on('end', () => {
            fileBuffer = Buffer.concat(chunks);
            console.log(`File complete: ${fileBuffer.length} bytes`);
          });
          file.on('error', reject);
        } else {
          file.resume();
        }
      });

      busboy.on('finish', () => {
        const { courseId, userId } = formData;
        if (courseId && userId && fileBuffer && fileName) {
          resolve({ courseId, fileBuffer, fileName, userId });
        } else {
          reject(new Error(`Missing: courseId=${courseId}, userId=${userId}, file=${!!fileBuffer}`));
        }
      });

      busboy.on('error', reject);
      req.pipe(busboy);
    }
  });
}

async function extractTextFromDocument(buffer: Buffer, fileName: string): Promise<string> {
  const fileExt = fileName.toLowerCase().split('.').pop();
  
  try {
    switch (fileExt) {
      case 'pdf':
        const pdfData = await pdfParse(buffer);
        return pdfData.text;
      
      case 'docx':
      case 'doc':
        const docResult = await mammoth.extractRawText({ buffer });
        return docResult.value;
      
      default:
        throw new Error(`Unsupported file type: ${fileExt}`);
    }
  } catch (error) {
    console.error(`Error extracting text from ${fileExt}:`, error);
    throw new Error(`Failed to extract text from ${fileName}`);
  }
}

async function uploadSyllabusToStorage(
  buffer: Buffer, 
  fileName: string, 
  courseId: string, 
  userId: string
): Promise<string> {
  const bucket = storage.bucket();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `syllabi/${userId}/${courseId}/${Date.now()}_${sanitizedFileName}`;
  
  const file = bucket.file(filePath);
  
  await file.save(buffer, {
    metadata: {
      contentType: getMimeType(fileName),
      metadata: {
        courseId,
        userId,
        originalName: fileName
      }
    }
  });

  // Make file publicly readable
  await file.makePublic();
  
  return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
}

function getMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'doc': return 'application/msword';
    default: return 'application/octet-stream';
  }
}

async function intelligentSyllabusParsing(text: string): Promise<ParsedSyllabusData> {
  // Step 1: Extract course information deterministically
  const courseData = extractCourseInformation(text);
  
  // Step 2: Look for assignment schedules in tables or structured lists
  const assignments = extractAssignmentsFromText(text, courseData.term);
  
  // Step 3: If no clear assignments found, use AI to help identify them
  let finalAssignments = assignments;
  if (assignments.length === 0) {
    console.log('No structured assignments found, using AI assistance...');
    finalAssignments = await extractAssignmentsWithAI(text, courseData);
  }
  
  return {
    course: courseData,
    assignments: finalAssignments
  };
}

function extractCourseInformation(text: string): CourseData {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Extract course code - look for patterns like "CS 101", "WW-HUMN 340", etc.
  let courseCode = '';
  const codePattern = /\b([A-Z]{2,4}[-\s]?[A-Z]*\s*\d{3,4}[A-Z]?)\b/g;
  for (const line of lines.slice(0, 20)) { // Check first 20 lines
    const match = line.match(codePattern);
    if (match) {
      courseCode = match[0].trim();
      break;
    }
  }
  
  // Extract course name - usually appears near the course code
  let courseName = '';
  if (courseCode) {
    for (const line of lines.slice(0, 20)) {
      if (line.includes(courseCode)) {
        // Look for the course name in the same line or next few lines
        const nameAfterCode = line.replace(courseCode, '').trim();
        if (nameAfterCode.length > 5 && nameAfterCode.length < 100) {
          courseName = nameAfterCode.replace(/^[-\s:]+|[-\s:]+$/g, '');
          break;
        }
      }
    }
  }
  
  if (!courseName) {
    // Look for title-like lines (longer lines near the top)
    for (const line of lines.slice(0, 10)) {
      if (line.length > 10 && line.length < 100 && !line.includes('University') && !line.includes('College')) {
        courseName = line;
        break;
      }
    }
  }
  
  // Extract term - look for patterns like "Spring 2025", "May 2025", etc.
  let term = '';
  const termPattern = /(Spring|Summer|Fall|Winter|January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2}/gi;
  for (const line of lines.slice(0, 30)) {
    const match = line.match(termPattern);
    if (match) {
      term = match[0];
      break;
    }
  }
  
  // Extract course description
  let description = '';
  const descKeywords = ['description', 'overview', 'course goals', 'learning outcomes'];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (descKeywords.some(keyword => line.includes(keyword))) {
      // Take the next few lines as description
      const descLines = lines.slice(i + 1, i + 5)
        .filter(line => line.length > 20 && line.length < 500);
      if (descLines.length > 0) {
        description = descLines[0];
        break;
      }
    }
  }
  
  return {
    code: courseCode || 'Unknown Course Code',
    name: courseName || 'Unknown Course Name',
    term: term || 'Unknown Term',
    description: description || 'No description available'
  };
}

function extractAssignmentsFromText(text: string, courseTerm: string): AssignmentData[] {
  const assignments: AssignmentData[] = [];
  const lines = text.split('\n').map(line => line.trim());
  
  // Look for assignment schedule tables
  const assignmentPattern = /(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}\/\d{1,2})\s+(.*(?:module|assignment|discussion|quiz|exam|essay|project|worksheet|lab|homework).*)/gi;
  
  for (const line of lines) {
    const match = assignmentPattern.exec(line);
    if (match) {
      const [, dateStr, titleStr] = match;
      
      const dueDate = parseDateToISO(dateStr, courseTerm);
      const title = cleanAssignmentTitle(titleStr);
      
      if (dueDate && title && title.length > 3) {
        assignments.push({
          title,
          description: generateAssignmentDescription(title),
          dueDate,
          status: 'pending',
          tags: extractAssignmentTags(title)
        });
      }
    }
  }
  
  // If no pattern matches, look for structured lists
  if (assignments.length === 0) {
    assignments.push(...extractFromStructuredLists(text, courseTerm));
  }
  
  return assignments;
}

function extractFromStructuredLists(text: string, courseTerm: string): AssignmentData[] {
  const assignments: AssignmentData[] = [];
  const lines = text.split('\n').map(line => line.trim());
  
  let currentDate = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line contains a date
    const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/?\d{0,4})/);
    if (dateMatch) {
      currentDate = dateMatch[1];
    }
    
    // Check if this line contains assignment keywords
    const assignmentKeywords = /module|assignment|discussion|quiz|exam|essay|project|worksheet|lab|homework/i;
    if (assignmentKeywords.test(line) && line.length > 10) {
      const dueDate = parseDateToISO(currentDate, courseTerm);
      const title = cleanAssignmentTitle(line);
      
      if (title && title.length > 3) {
        assignments.push({
          title,
          description: generateAssignmentDescription(title),
          dueDate,
          status: 'pending',
          tags: extractAssignmentTags(title)
        });
      }
    }
  }
  
  return assignments;
}

async function extractAssignmentsWithAI(text: string, courseData: CourseData): Promise<AssignmentData[]> {
  try {
    const prompt = `Extract assignment information from this syllabus. Focus ONLY on actual assignments, not general course information.

Course: ${courseData.code} - ${courseData.name}
Term: ${courseData.term}

Return ONLY valid JSON in this format:
{
  "assignments": [
    {
      "title": "exact assignment title from syllabus",
      "description": "brief description based on title",
      "dueDate": "YYYY-MM-DD or null if no date found",
      "status": "pending",
      "tags": ["relevant", "tags"]
    }
  ]
}

Rules:
- Only extract assignments that clearly exist in the syllabus
- Do not invent assignments or dates
- Convert dates to YYYY-MM-DD format
- Tags should be based on assignment type: Discussion, Quiz, Exam, Essay, Project, Lab, Assignment
- If no due date is found, use null

Syllabus text:
${text.substring(0, 4000)}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-small-latest',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data: any = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return [];
    }

    const parsed = JSON.parse(content);
    return parsed.assignments || [];

  } catch (error) {
    console.error('AI assignment extraction failed:', error);
    return [];
  }
}

function parseDateToISO(dateStr: string, courseTerm: string): string | null {
  if (!dateStr) return null;
  
  // Handle M/D/YY or M/D/YYYY format
  const parts = dateStr.split('/');
  if (parts.length >= 2) {
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    
    let year = parts[2];
    if (!year || year.length === 0) {
      // Extract year from course term
      const termYear = courseTerm.match(/20\d{2}/);
      year = termYear ? termYear[0] : new Date().getFullYear().toString();
    } else if (year.length === 2) {
      year = '20' + year;
    }
    
    return `${year}-${month}-${day}`;
  }
  
  return null;
}

function cleanAssignmentTitle(title: string): string {
  return title
    .replace(/^\d{1,2}\/\d{1,2}\/?\d{0,4}\s*/, '') // Remove leading date
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

function generateAssignmentDescription(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('discussion')) {
    return `Discussion assignment: ${title}`;
  } else if (titleLower.includes('quiz')) {
    return `Quiz assessment: ${title}`;
  } else if (titleLower.includes('exam')) {
    return `Exam assessment: ${title}`;
  } else if (titleLower.includes('essay')) {
    return `Written essay assignment: ${title}`;
  } else if (titleLower.includes('project')) {
    return `Project assignment: ${title}`;
  } else if (titleLower.includes('lab')) {
    return `Laboratory assignment: ${title}`;
  } else if (titleLower.includes('worksheet')) {
    return `Worksheet assignment: ${title}`;
  } else {
    return `Assignment: ${title}`;
  }
}

function extractAssignmentTags(title: string): string[] {
  const tags: string[] = [];
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('discussion')) tags.push('Discussion');
  if (titleLower.includes('quiz')) tags.push('Quiz');
  if (titleLower.includes('exam')) tags.push('Exam');
  if (titleLower.includes('essay')) tags.push('Essay');
  if (titleLower.includes('project')) tags.push('Project');
  if (titleLower.includes('lab')) tags.push('Lab');
  if (titleLower.includes('worksheet')) tags.push('Worksheet');
  if (titleLower.includes('homework')) tags.push('Homework');
  if (titleLower.includes('assignment') && tags.length === 0) tags.push('Assignment');
  
  return tags;
}