import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getAuth, updateProfile } from "firebase/auth";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import PaymentModal from "@/components/pro/payment-modal";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Check, Crown, Laptop, Mail, School, User as UserIcon } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters."
  }).optional(),
  school: z.string().min(2, {
    message: "School name must be at least 2 characters."
  }).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function MyAccountPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [localUserState, setLocalUserState] = useState({ isPro: user?.isPro || false });
  
  // Default form values from user object
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      school: user?.school || "",
    }
  });

  async function onSubmit(values: ProfileFormValues) {
    if (!user) return;
    
    setIsUpdating(true);
    
    try {
      // Update displayName in Firebase Auth
      if (values.name && values.name !== user.displayName) {
        try {
          // Using Firebase's updateProfile function properly
          const auth = getAuth();
          if (auth.currentUser) {
            await updateProfile(auth.currentUser, { 
              displayName: values.name 
            });
            
            // Force refresh local user state since auth state might not update immediately
            if (auth.currentUser.reload) {
              await auth.currentUser.reload();
            }
          } else {
            throw new Error("No authenticated user found");
          }
        } catch (error) {
          console.error("Error updating auth profile:", error);
          throw error;
        }
      }
      
      // Update additional fields in Firestore
      try {
        const userDocRef = doc(db, "users", user.uid);
        
        // First check if the document exists
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
          // Update existing document
          await updateDoc(userDocRef, {
            school: values.school || null,
            name: values.name || null,
          });
        } else {
          // Create new document if it doesn't exist
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            school: values.school || null,
            name: values.name || null,
            createdAt: new Date()
          });
        }
      } catch (error) {
        console.error("Error updating Firestore document:", error);
        throw error;
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  // Update local state when user data changes
  useEffect(() => {
    if (user) {
      setLocalUserState({ isPro: user.isPro || false });
    }
  }, [user]);

  // Handle successful pro upgrade
  const handleProUpgradeSuccess = () => {
    setLocalUserState({ isPro: true });
    // Force reload window to ensure all components see the updated state
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  // Function to get user initials for avatar
  const getUserInitials = () => {
    if (user?.name) {
      return user.name.charAt(0);
    }
    return user?.email?.charAt(0).toUpperCase() || "?";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">My Account</h1>
      <p className="text-slate-500 mb-8">
        Manage your personal settings and preferences
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Section */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <UserIcon className="mr-2 h-4 w-4 text-slate-500" />
                            <Input 
                              placeholder="Your name" 
                              {...field}
                              value={field.value || ""}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          This will be displayed in your profile and avatar.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="school"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School or University</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <School className="mr-2 h-4 w-4 text-slate-500" />
                            <Input 
                              placeholder="Your school or university name" 
                              {...field}
                              value={field.value || ""}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          This helps organize your academic work.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <Label>Email Address</Label>
                    <div className="flex items-center mt-2">
                      <Mail className="mr-2 h-4 w-4 text-slate-500" />
                      <Input
                        value={user?.email || ""}
                        disabled
                        className="bg-slate-50"
                      />
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      Your email address cannot be changed.
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isUpdating || !form.formState.isDirty}
                  >
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        {/* Subscription Info */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Your Subscription</CardTitle>
              <CardDescription>
                Current plan and benefits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Current Plan</span>
                  <Badge variant={user?.isPro ? "default" : "outline"} className={user?.isPro ? "bg-amber-500" : ""}>
                    {user?.isPro ? "Pro" : "Free"}
                  </Badge>
                </div>
                
                {user?.isPro ? (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">You have access to all Premium features:</p>
                    <ul className="space-y-1">
                      <li className="text-sm flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-600" />
                        <span>AI Study Assistant</span>
                      </li>
                      <li className="text-sm flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-600" />
                        <span>Unlimited Files</span>
                      </li>
                      <li className="text-sm flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-600" />
                        <span>Advanced Analytics</span>
                      </li>
                    </ul>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600">Upgrade to Pro to unlock:</p>
                      <ul className="space-y-1">
                        <li className="text-sm text-slate-500 flex items-center">
                          <Crown className="h-4 w-4 mr-2 text-amber-500" />
                          <span>AI Study Assistant</span>
                        </li>
                        <li className="text-sm text-slate-500 flex items-center">
                          <Crown className="h-4 w-4 mr-2 text-amber-500" />
                          <span>Unlimited Files</span>
                        </li>
                        <li className="text-sm text-slate-500 flex items-center">
                          <Crown className="h-4 w-4 mr-2 text-amber-500" />
                          <span>Advanced Analytics</span>
                        </li>
                      </ul>
                    </div>
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
                      size="sm"
                      onClick={() => setShowPaymentModal(true)}
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      Upgrade to Pro
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Application Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Version</span>
                  <span>1.0.0</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Environment</span>
                  <span className="flex items-center">
                    <Laptop className="h-3 w-3 mr-1" />
                    Web
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Payment Modal */}
      {user && (
        <PaymentModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          userId={user.uid}
          onSuccess={handleProUpgradeSuccess}
        />
      )}
    </div>
  );
}