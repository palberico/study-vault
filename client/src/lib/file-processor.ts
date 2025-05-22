import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker source (required for PDF.js)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extracts text content from an uploaded file
 * Uses PDF.js to properly extract text from PDF files in the browser
 */
export async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        if (!event.target || !event.target.result) {
          reject(new Error('Failed to read file'));
          return;
        }
        
        let extractedText = '';
        
        if (typeof event.target.result === 'string') {
          // For text files, we can use the content directly
          extractedText = event.target.result;
          console.log("Read text file directly");
        } else if (file.type === 'application/pdf') {
          console.log("PDF file detected, using PDF.js for extraction");
          try {
            // Convert ArrayBuffer to Uint8Array for PDF.js
            const typedArray = new Uint8Array(event.target.result as ArrayBuffer);
            
            // Load the PDF file using PDF.js
            const loadingTask = pdfjsLib.getDocument({ data: typedArray });
            const pdf = await loadingTask.promise;
            
            console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);
            
            // Extract text from each page
            let combinedText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
              
              combinedText += pageText + '\n\n';
              console.log(`Extracted text from page ${i}`);
            }
            
            extractedText = combinedText;
            console.log(`Total extracted text: ${extractedText.length} characters`);
            
          } catch (pdfError) {
            console.error("PDF extraction error:", pdfError);
            // Fallback to basic extraction if PDF.js fails
            const decoder = new TextDecoder('utf-8');
            extractedText = decoder.decode(event.target.result as ArrayBuffer);
            console.log("Falling back to basic decoder");
          }
        } else if (
          file.type === 'application/msword' || 
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
          // For Word docs, simplified extraction
          const decoder = new TextDecoder('utf-8');
          extractedText = decoder.decode(event.target.result as ArrayBuffer);
          console.log("Word document detected, using basic decoder");
        } else {
          reject(new Error('Unsupported file format'));
          return;
        }
        
        // Process the extracted text to clean up any binary artifacts
        extractedText = cleanExtractedText(extractedText);
        
        // Enhanced debugging for file processing
        console.log(`--- FILE PROCESSOR DEBUG ---`);
        console.log(`File name: ${file.name}`);
        console.log(`File type: ${file.type}`);
        console.log(`File size: ${file.size} bytes`);
        console.log(`Extracted text length: ${extractedText.length} chars`);
        
        // Log a sample of the beginning of the extracted text
        console.log(`Text sample (first 300 chars):\n${extractedText.substring(0, 300)}`);
        
        if (extractedText.length > 50000) {
          console.log(`Text extracted from file is large (${extractedText.length} chars). Will use OpenRouter's middle_out compression.`);
        }
        
        resolve(extractedText);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    // Read as text for text-based files
    if (file.type.includes('text/')) {
      reader.readAsText(file);
    } else {
      // Read as array buffer for binary files
      reader.readAsArrayBuffer(file);
    }
  });
}

/**
 * Cleans extracted text by removing non-printable characters and excessive whitespace
 */
function cleanExtractedText(text: string): string {
  // Replace null bytes and other control characters that might appear in binary data
  let cleaned = text.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Replace multiple spaces with a single space
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Remove any strange Unicode replacement characters
  cleaned = cleaned.replace(/\uFFFD/g, '');
  
  // Remove PDF specific artifacts if present
  cleaned = cleaned.replace(/obj\s+endobj/g, '');
  cleaned = cleaned.replace(/stream\s+endstream/g, '');
  
  // Debug log the size
  console.log(`Cleaned text size: ${cleaned.length} characters`);
  
  return cleaned;
}