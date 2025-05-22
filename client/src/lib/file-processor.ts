/**
 * Extracts text content from an uploaded file
 * Also handles text preprocessing and truncation for large files
 */
export async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        if (!event.target || !event.target.result) {
          reject(new Error('Failed to read file'));
          return;
        }
        
        let extractedText = '';
        
        if (typeof event.target.result === 'string') {
          // For text files, we can use the content directly
          extractedText = event.target.result;
        } else if (file.type === 'application/pdf') {
          // This is a simplified approach for PDFs
          const decoder = new TextDecoder('utf-8');
          extractedText = decoder.decode(event.target.result as ArrayBuffer);
        } else if (
          file.type === 'application/msword' || 
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
          // For Word docs, simplified extraction
          const decoder = new TextDecoder('utf-8');
          extractedText = decoder.decode(event.target.result as ArrayBuffer);
        } else {
          reject(new Error('Unsupported file format'));
          return;
        }
        
        // Process the extracted text to clean up any binary artifacts
        extractedText = cleanExtractedText(extractedText);
        
        // Truncate text if it's too long (approx 50,000 chars ~ 12,500 tokens)
        // This is conservative to ensure we stay under the 96,000 token limit
        const MAX_CHARS = 50000;
        if (extractedText.length > MAX_CHARS) {
          console.log(`Text extracted from file is very large (${extractedText.length} chars), truncating to ${MAX_CHARS} chars.`);
          
          // Take the first section which likely contains course info
          const firstSection = extractedText.slice(0, MAX_CHARS * 0.4);
          
          // And some of the middle/end where assignments might be listed
          const remainingSection = extractedText.slice(
            Math.floor(extractedText.length * 0.4), 
            Math.floor(extractedText.length * 0.4) + (MAX_CHARS * 0.6)
          );
          
          extractedText = firstSection + remainingSection;
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