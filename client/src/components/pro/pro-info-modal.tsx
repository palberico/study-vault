import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import PaymentModal from "./payment-modal";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface ProInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export default function ProInfoModal({ open, onOpenChange, userId }: ProInfoModalProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { toast } = useToast();
  const { refreshUserData } = useAuth();
  
  const handleUpgradeClick = () => {
    onOpenChange(false); // Close this modal
    setShowPaymentModal(true); // Open payment modal
  };
  
  const handleUpgradeSuccess = () => {
    toast({
      title: "Upgrade successful!",
      description: "You now have access to all Pro features.",
    });
    
    // Refresh user data to update the UI
    refreshUserData().then(() => {
      // Short delay before closing the modal to ensure state is updated
      setTimeout(() => {
        setShowPaymentModal(false);
      }, 500);
    });
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl font-bold">
              <Sparkles className="h-5 w-5 mr-2 text-yellow-400" />
              Unlock Pro Features
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-slate-600 mb-4">
              Upgrade to StudyVault Pro and unlock powerful features to enhance your academic experience:
            </p>
            
            <ul className="space-y-2">
              <li className="flex items-start">
                <div className="h-5 w-5 text-yellow-500 mr-2">•</div>
                <span className="text-slate-700">Auto-generate assignments from your syllabus</span>
              </li>
              <li className="flex items-start">
                <div className="h-5 w-5 text-yellow-500 mr-2">•</div>
                <span className="text-slate-700">Advanced analytics powered by AI</span>
              </li>
              <li className="flex items-start">
                <div className="h-5 w-5 text-yellow-500 mr-2">•</div>
                <span className="text-slate-700">Unlimited file storage for all your courses</span>
              </li>
              <li className="flex items-start">
                <div className="h-5 w-5 text-yellow-500 mr-2">•</div>
                <span className="text-slate-700">AI-powered study recommendations</span>
              </li>
              <li className="flex items-start">
                <div className="h-5 w-5 text-yellow-500 mr-2">•</div>
                <span className="text-slate-700">Priority customer support</span>
              </li>
            </ul>
          </div>
          
          <DialogFooter>
            <Button
              onClick={handleUpgradeClick}
              className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white"
            >
              <Sparkles className="h-4 w-4 mr-2" /> Try Pro Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Payment Modal */}
      <PaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        userId={userId}
        onSuccess={handleUpgradeSuccess}
      />
    </>
  );
}