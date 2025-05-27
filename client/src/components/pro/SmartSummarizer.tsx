import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Loader2, Copy, RotateCcw, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

interface SmartSummarizerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SummaryResult {
  overview: string;
  mainPoints: string[];
  keyTerms: string[];
}

export default function SmartSummarizer({ isOpen, onClose }: SmartSummarizerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [inputText, setInputText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Extract text from uploaded file with proper parsing for different file types
  const extractTextFromFile = async (file: File): Promise<string> => {
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();

    try {
      // Handle TXT files with FileReader
      if (fileExtension === 'txt') {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target?.result as string;
            resolve(text);
          };
          reader.onerror = () => reject(new Error("Failed to read text file"));
          reader.readAsText(file);
        });
      }

      // Handle PDF files with pdfjs-dist
      if (fileExtension === 'pdf') {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const arrayBuffer = e.target?.result as ArrayBuffer;
              
              // Set up PDF.js worker
              pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
              
              const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
              let fullText = '';
              
              // Extract text from all pages
              for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                  .map((item: any) => item.str)
                  .join(' ');
                fullText += pageText + '\n';
              }
              
              if (!fullText.trim()) {
                throw new Error("No text content found in PDF");
              }
              
              resolve(fullText);
            } catch (error) {
              reject(new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
          };
          reader.onerror = () => reject(new Error("Failed to read PDF file"));
          reader.readAsArrayBuffer(file);
        });
      }

      // Handle DOCX files with mammoth
      if (fileExtension === 'docx') {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const arrayBuffer = e.target?.result as ArrayBuffer;
              const result = await mammoth.extractRawText({ arrayBuffer });
              
              if (!result.value.trim()) {
                throw new Error("No text content found in DOCX file");
              }
              
              resolve(result.value);
            } catch (error) {
              reject(new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
          };
          reader.onerror = () => reject(new Error("Failed to read DOCX file"));
          reader.readAsArrayBuffer(file);
        });
      }

      // Handle legacy DOC files (attempt as text, but warn user)
      if (fileExtension === 'doc') {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const text = e.target?.result as string;
              // DOC files may not parse well as plain text
              if (!text || text.length < 10) {
                throw new Error("Legacy DOC format detected - please convert to DOCX for better results");
              }
              resolve(text);
            } catch (error) {
              reject(new Error("Legacy DOC files are not fully supported. Please convert to DOCX format."));
            }
          };
          reader.onerror = () => reject(new Error("Failed to read DOC file"));
          reader.readAsText(file);
        });
      }

      // Unsupported file type
      throw new Error(`Unsupported file type: ${fileExtension}. Please use TXT, PDF, or DOCX files.`);

    } catch (error) {
      throw new Error(`File processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Call OpenRouter API for summarization
  const summarizeWithAI = async (text: string): Promise<SummaryResult> => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenRouter API key is missing. Please check your environment variables.');
    }

    const prompt = `Summarize the following text for a college student. 
- Write a clear one-paragraph overview.
- Then, list the top 5 main ideas as bullet points.
- Highlight key dates, terms, or concepts in bold. 
- Be thorough and accurate, but keep language simple and easy to understand.

Return your response in this JSON format:
{
  "overview": "one paragraph summary here",
  "mainPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "keyTerms": ["important term 1", "important term 2", "important term 3"]
}

TEXT:
${text.substring(0, 4000)}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'StudyVault Pro Smart Summarizer'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-small-3.1-24b-instruct:free',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.0,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`AI summarization failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No summary content received from AI');
    }

    try {
      return JSON.parse(content);
    } catch (parseError) {
      // Fallback parsing for malformed JSON
      throw new Error('Failed to parse AI response');
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|pdf|doc|docx)$/i)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a TXT, PDF, DOC, or DOCX file.",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);
    
    try {
      const extractedText = await extractTextFromFile(file);
      setInputText(extractedText);
      toast({
        title: "File uploaded successfully",
        description: `Text extracted from ${file.name}`
      });
    } catch (error) {
      toast({
        title: "File extraction failed",
        description: "Could not extract text from the uploaded file.",
        variant: "destructive"
      });
    }
  };

  // Start countdown timer
  const startCountdown = () => {
    setCountdown(30);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle summarization
  const handleSummarize = async () => {
    if (!inputText.trim()) {
      toast({
        title: "No content to summarize",
        description: "Please paste some text or upload a file first.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    startCountdown();
    
    try {
      const result = await summarizeWithAI(inputText);
      setSummaryResult(result);
      toast({
        title: "Summary generated successfully!",
        description: "Your content has been summarized."
      });
    } catch (error) {
      console.error('Summarization error:', error);
      toast({
        title: "Summarization failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setCountdown(0);
    }
  };

  // Copy summary to clipboard
  const copySummary = () => {
    if (!summaryResult) return;
    
    const formattedSummary = `SUMMARY:\n${summaryResult.overview}\n\nMAIN POINTS:\n${summaryResult.mainPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}\n\nKEY TERMS:\n${summaryResult.keyTerms.join(', ')}`;
    
    navigator.clipboard.writeText(formattedSummary);
    toast({
      title: "Summary copied!",
      description: "The summary has been copied to your clipboard."
    });
  };

  // Reset form
  const resetForm = () => {
    setInputText("");
    setUploadedFile(null);
    setSummaryResult(null);
    setIsProcessing(false);
    setCountdown(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center text-xl">
                <Sparkles className="w-5 h-5 mr-2" />
                Smart Summarizer
                <Badge className="ml-2 bg-white/20 text-white">PRO</Badge>
              </CardTitle>
              <p className="text-blue-100 mt-1">Transform your notes and readings into concise, student-friendly summaries</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {!summaryResult ? (
            <>
              {/* File Upload Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Upload className="w-5 h-5 mr-2 text-blue-600" />
                  Upload Document or Paste Text
                </h3>
                
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                  <Input
                    type="file"
                    accept=".txt,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <FileText className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600">
                      Click to upload PDF, DOC, DOCX, or TXT file
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Or paste your text in the box below
                    </p>
                  </label>
                </div>

                {uploadedFile && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      📄 {uploadedFile.name} uploaded successfully
                    </p>
                  </div>
                )}
              </div>

              {/* Text Input Section */}
              <div className="space-y-4">
                <Textarea
                  placeholder="Paste your notes, readings, or study material here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
                
                <div className="flex justify-between items-center">
                  <p className="text-sm text-slate-500">
                    {inputText.length > 0 ? `${inputText.length} characters` : "No content yet"}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetForm}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                    <Button 
                      onClick={handleSummarize}
                      disabled={isProcessing || !inputText.trim()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Summarizing... {countdown > 0 && `(${countdown}s)`}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Summary
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Summary Results */
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-green-600" />
                  Your Summary
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={copySummary}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Summary
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Analyze Another
                  </Button>
                </div>
              </div>

              {/* Overview */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">📖 Overview</h4>
                <p className="text-blue-800 leading-relaxed">{summaryResult.overview}</p>
              </div>

              {/* Main Points */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">🎯 Main Points</h4>
                <ul className="space-y-2">
                  {summaryResult.mainPoints.map((point, index) => (
                    <li key={index} className="flex items-start text-green-800">
                      <span className="font-semibold mr-2 text-green-600">{index + 1}.</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Terms */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">🔑 Key Terms</h4>
                <div className="flex flex-wrap gap-2">
                  {summaryResult.keyTerms.map((term, index) => (
                    <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}