import React, { useState, useRef, useEffect } from "react";
import { FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { extractTextFromPDF } from "@/lib/pdf-extract";
import { processSyllabusWithAI, type SyllabusData } from "@/lib/openrouter-service";
import { addCourse, addAssignment } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useLocation } from "wouter";

interface SyllabusAnalyzerProps {
  open: boolean;
  onOpenChange: (val: boolean) => void;
}

const PROCESS_SECONDS = 25;

export default function SyllabusAnalyzer({ open, onOpenChange }: SyllabusAnalyzerProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(PROCESS_SECONDS);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Custom modal for success
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [assignmentCount, setAssignmentCount] = useState(0);

  useEffect(() => {
    if (isProcessing) {
      setCountdown(PROCESS_SECONDS);
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(intervalRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isProcessing]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // PDF only for now (extend to .doc/.docx in the future)
    const fileType = file.type;
    if (fileType === "application/pdf") {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid File Format",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const resetUploader = () => {
    setSelectedFile(null);
    setIsDragging(false);
    setIsProcessing(false);
    setCountdown(PROCESS_SECONDS);
  };

  const processSyllabus = async () => {
    if (!selectedFile || !user) return;
    setIsProcessing(true);

    try {
      // Step 1: Upload PDF to Firebase Storage
      const storage = getStorage();
      const timestamp = Date.now();
      const path = `Syllabi/${user.uid}/${timestamp}_${selectedFile.name}`;
      const fileRef = storageRef(storage, path);
      await uploadBytes(fileRef, selectedFile);
      const fileUrl = await getDownloadURL(fileRef);

      // Step 2: Extract text from PDF
      const fileText = await extractTextFromPDF(selectedFile);

      // Step 3: Use OpenRouter AI to extract course and assignments
      const aiJson: SyllabusData = await processSyllabusWithAI(fileText);

      // Step 4: Save course to Firestore (with syllabusUrl)
      const courseDocRef = await addCourse({
        ...aiJson.course,
        syllabusUrl: fileUrl,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      });

      const courseId = courseDocRef.id || courseDocRef; // Use .id if ref, else string

      // Step 5: Save assignments to Firestore (link to courseId)
      let assignmentsSaved = 0;
      if (aiJson.assignments && aiJson.assignments.length > 0) {
        await Promise.all(
          aiJson.assignments.map((assignment) =>
            addAssignment({
              ...assignment,
              courseId,
              userId: user.uid,
              createdAt: new Date().toISOString(),
            })
          )
        );
        assignmentsSaved = aiJson.assignments.length;
      }

      // Set info for modal
      setCourseName(aiJson.course.name);
      setAssignmentCount(assignmentsSaved);
      setShowSuccessModal(true);

      // Optionally close uploader modal (let the user upload again easily)
      // onOpenChange(false);
      // setSelectedFile(null);
    } catch (error) {
      console.error("❌ Syllabus parsing failed:", error);
      toast({
        title: "❌ Syllabus Parsing Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Success Modal Actions
  const handleViewCards = () => {
    setShowSuccessModal(false);
    onOpenChange(false); // Close uploader modal
    resetUploader();
    navigate("/"); // Or whatever route is your main dashboard
  };

  const handleUploadAnother = () => {
    setShowSuccessModal(false);
    resetUploader();
    // Keep uploader modal open for another file
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) resetUploader();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <FileUp className="h-5 w-5 mr-2 text-indigo-500" />
              Syllabus Analyzer
            </DialogTitle>
            <DialogDescription>
              Upload your course syllabus to automatically create a structured course with all assignments and deadlines.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isProcessing && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <h3 className="text-xl font-semibold mb-2">Processing Your Syllabus</h3>
                  <p className="text-gray-600 text-center max-w-md">
                    Our AI is analyzing your syllabus to extract course details and assignments.
                    This may take up to 30 seconds depending on the file size.
                  </p>
                  <div className="mt-4 text-indigo-500 font-bold text-lg">
                    {countdown > 0 ? `Estimated time left: ${countdown}s` : "Finalizing..."}
                  </div>
                </div>
              </div>
            )}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FileUp className="h-10 w-10 mx-auto mb-3 text-slate-400" />
              {selectedFile ? (
                <div>
                  <p className="font-medium text-indigo-600">{selectedFile.name}</p>
                  <p className="text-sm text-slate-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setSelectedFile(null)}
                    disabled={isProcessing}
                  >
                    Change file
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="font-medium">Drag and drop your syllabus here</p>
                  <p className="text-sm text-slate-500 mt-1">Or click to browse from your computer</p>
                  <input
                    type="file"
                    className="hidden"
                    id="syllabusFileInput"
                    accept=".pdf"
                    onChange={handleFileInput}
                    disabled={isProcessing}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => document.getElementById('syllabusFileInput')?.click()}
                    disabled={isProcessing}
                  >
                    Browse files
                  </Button>
                </div>
              )}
            </div>
            <div className="mt-3 text-sm text-slate-500">
              <p>Supported file type: PDF</p>
              <p className="mt-1">Our AI will extract course details, assignments, and deadlines from your syllabus.</p>
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetUploader();
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={processSyllabus}
              className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700"
              disabled={!selectedFile || isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-opacity-20 border-t-white"></span>
                  Processing...
                </>
              ) : (
                'Analyze Syllabus'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={(val) => {
        setShowSuccessModal(val);
        if (!val) resetUploader();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl text-green-700">
              🎉 Syllabus Uploaded!
            </DialogTitle>
            <DialogDescription>
              <span className="block mt-2 mb-1 text-lg font-semibold">
                <span className="text-green-700">Course Created:</span> {courseName}
              </span>
              <span className="block text-md mb-2">
                <span className="font-semibold text-green-700">{assignmentCount}</span> assignments detected and saved.
              </span>
              <span className="block text-slate-600 mt-2 text-sm">
                <b>Note:</b> AI isn't always 100% accurate. Please review your new course and edit assignments or details as needed.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              onClick={handleUploadAnother}
            >
              Upload Another Syllabus
            </Button>
            <Button
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              onClick={handleViewCards}
            >
              View Cards on Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
