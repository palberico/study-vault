import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: () => void;
}

const paymentSchema = z.object({
  cardNumber: z.string().min(16, "Card number must be 16 digits").max(19),
  cardName: z.string().min(2, "Name must be at least 2 characters"),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, "Expiry must be in MM/YY format"),
  cvc: z.string().min(3, "CVC must be 3-4 digits").max(4),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function PaymentModal({ open, onOpenChange, userId, onSuccess }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      cardNumber: '',
      cardName: '',
      expiry: '',
      cvc: '',
    },
  });

  async function onSubmit(values: PaymentFormValues) {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user document in Firestore to mark as Pro
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        isPro: true
      });

      // Show success
      setIsComplete(true);
      
      // Notify parent component of successful upgrade
      onSuccess();
      
      toast({
        title: "Upgrade complete!",
        description: "You are now a Pro member. Enjoy all the benefits!",
      });
      
      // Reset form
      form.reset();
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        onOpenChange(false);
        setIsComplete(false);
      }, 2000);
      
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <span>Upgrade to StudyVault Pro</span>
          </DialogTitle>
          <DialogDescription>
            Get unlimited assignment storage, priority support, and more with StudyVault Pro.
          </DialogDescription>
        </DialogHeader>
        
        {isComplete ? (
          <div className="py-6 flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-center">Upgrade Complete!</h3>
            <p className="text-center text-gray-500">
              Thank you for upgrading to StudyVault Pro. Enjoy all the premium features!
            </p>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="cardName">Name on Card</Label>
                <Input
                  id="cardName"
                  placeholder="John Smith"
                  {...form.register("cardName")}
                />
                {form.formState.errors.cardName && (
                  <p className="text-sm text-red-500">{form.formState.errors.cardName.message}</p>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="4111 1111 1111 1111"
                  {...form.register("cardNumber")}
                />
                {form.formState.errors.cardNumber && (
                  <p className="text-sm text-red-500">{form.formState.errors.cardNumber.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    {...form.register("expiry")}
                  />
                  {form.formState.errors.expiry && (
                    <p className="text-sm text-red-500">{form.formState.errors.expiry.message}</p>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input
                    id="cvc"
                    placeholder="123"
                    {...form.register("cvc")}
                  />
                  {form.formState.errors.cvc && (
                    <p className="text-sm text-red-500">{form.formState.errors.cvc.message}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 p-3 rounded-md border border-amber-100">
              <p className="text-sm text-amber-800 flex items-start">
                <Sparkles className="h-4 w-4 mr-2 mt-0.5 text-amber-500" />
                <span>
                  <strong>Pro Plan:</strong> $9.99/month - Unlimited assignments, priority support, and advanced features.
                </span>
              </p>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isProcessing} className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500">
                {isProcessing ? "Processing..." : "Upgrade Now"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}