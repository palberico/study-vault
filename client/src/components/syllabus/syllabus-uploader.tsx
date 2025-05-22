import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface SyllabusUploaderProps {
  courseId: string;
  onUploadSuccess: () => void;
}

export function SyllabusUploader({ courseId, onUploadSuccess }: SyllabusUploaderProps) {
  const [uploadState, setUploadState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate the file is a PDF
    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF file.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadState('loading');
      
      // Create form data for the Cloud Function
      const form = new FormData();
      form.append('courseId', courseId);
      form.append('syllabus', file);
      
      // Call the Cloud Function
      const res = await fetch(
        'https://us-central1-study-vault-dd7d1.cloudfunctions.net/parseSyllabus',
        { method: 'POST', body: form }
      );
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to process syllabus');
      }
      
      // Success handling
      setUploadState('success');
      toast({
        title: 'Success!',
        description: 'Syllabus processed, assignments updated.',
      });
      
      // Trigger parent component to refetch data
      onUploadSuccess();
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      setUploadState('error');
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to process syllabus',
        variant: 'destructive',
      });
    } finally {
      // Return to idle state after a short delay
      setTimeout(() => {
        setUploadState('idle');
      }, 2000);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="my-4">
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileSelect}
        ref={fileInputRef}
      />
      <Button
        onClick={triggerFileSelect}
        disabled={uploadState === 'loading'}
        className="relative w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
      >
        {uploadState === 'loading' && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {uploadState === 'loading' ? 'Processing...' : 'Upload Syllabus'}
      </Button>
      <p className="text-xs text-slate-500 mt-1">
        Upload a PDF syllabus to automatically extract assignments
      </p>
    </div>
  );
}