import { toast } from "@/hooks/use-toast";

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export interface SyllabusAssignment {
  title: string;
  description: string;
  dueDate: string;
  status?: string;
}

export interface SyllabusCourse {
  name: string;
  code: string;
  description: string;
  term: string;
}

export interface SyllabusData {
  course: SyllabusCourse;
  assignments: SyllabusAssignment[];
}

/**
 * Processes a syllabus file using the OpenRouter API
 * @param fileContent The text content of the syllabus
 * @returns Extracted course and assignment information
 */
export async function processSyllabusWithAI(fileContent: string) {
  try {
    // Check if we have the API key
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenRouter API key is missing. Please make sure it is provided in the environment variables.');
    }

    // Our prompt instruction to extract course and assignment information
    const systemPrompt = `You are a specialized education AI that helps students organize their academic courses. 
    Your task is to analyze the provided syllabus and extract key information in a structured format.
    
    Extract the following information:
    1. COURSE DETAILS: Name, code, description, instructor, term/semester
    2. ASSIGNMENTS: For each assignment, extract title, description, due date, and any grading information
    
    Respond ONLY with a JSON object in the following format:
    {
      "course": {
        "name": "string",
        "code": "string",
        "description": "string",
        "term": "string (e.g., Fall 2025)"
      },
      "assignments": [
        {
          "title": "string",
          "description": "string",
          "dueDate": "YYYY-MM-DD",
          "status": "pending"
        }
      ]
    }
    
    If certain information is not available, use empty strings or provide reasonable defaults. Make your best guess for dates based on context.
    Do NOT include any explanatory text before or after the JSON.`;

    // The specific model requested by the user
    const model = "mistralai/mistral-small-3.1-24b-instruct:free";

    // Prepare our message payload
    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: fileContent }
    ];

    // Make the API call to OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'StudyVault Pro'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.1, // Low temperature for more consistent and accurate responses
        max_tokens: 2000  // Allow enough tokens for a detailed response
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
    }

    const data: OpenRouterResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response content received from AI');
    }

    // Extract and parse the JSON from the AI response
    const content = data.choices[0].message.content.trim();
    
    // Try to parse as JSON
    try {
      const parsedData = JSON.parse(content);
      return parsedData;
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', content);
      throw new Error('The AI response could not be processed correctly');
    }
  } catch (error) {
    console.error('Error processing syllabus with AI:', error);
    
    // Show error toast to user
    toast({
      title: 'AI Processing Error',
      description: error instanceof Error ? error.message : 'Failed to analyze syllabus',
      variant: 'destructive',
    });
    
    throw error;
  }
}