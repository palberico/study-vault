import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { extractTextFromFile, extractFilmAssignments } from "@/lib/file-processor";

export function PdfDebugComponent() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [assignments, setAssignments] = useState<Array<{title: string, dueDate: string | null}>>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setExtractedText("");
      setAssignments([]);
    }
  };

  const processFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      console.log("🔍 DEBUG: Processing file:", selectedFile.name);
      
      // Extract text using your current processor
      const text = await extractTextFromFile(selectedFile);
      setExtractedText(text);
      
      // Extract assignments using deterministic parsing
      const foundAssignments = extractFilmAssignments(text);
      setAssignments(foundAssignments);
      
      console.log("🔍 DEBUG: Extracted text length:", text.length);
      console.log("🔍 DEBUG: Found assignments:", foundAssignments);
      
    } catch (error) {
      console.error("Error processing file:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>PDF Parser Debug Tool</CardTitle>
          <CardDescription>
            Upload a PDF to see exactly what text the parser extracts (no AI, no fallback data)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="flex-1"
            />
            <Button 
              onClick={processFile} 
              disabled={!selectedFile || isProcessing}
            >
              {isProcessing ? "Processing..." : "Parse PDF"}
            </Button>
          </div>
          
          {selectedFile && (
            <div className="text-sm text-muted-foreground">
              Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </div>
          )}
        </CardContent>
      </Card>

      {extractedText && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Text ({extractedText.length} characters)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-md">
              <pre className="whitespace-pre-wrap text-sm font-mono max-h-96 overflow-y-auto">
                {extractedText}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Found Assignments ({assignments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assignments.map((assignment, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <span className="font-medium">{assignment.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {assignment.dueDate || "No date"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}