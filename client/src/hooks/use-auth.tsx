import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  auth, 
  onAuthStateChanged,
  logInWithEmailAndPassword,
  registerWithEmailAndPassword,
  logout as firebaseLogout,
  db
} from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { User } from "@/types/index";
import { useLocation } from "wouter";
import { LoaderPinwheel } from "lucide-react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to refresh user data - crucial for updating Pro status
  const refreshUserData = async () => {
    if (!auth.currentUser) return;
    
    try {
      console.log("Refreshing user data for:", auth.currentUser.uid);
      
      // Get fresh user document from Firestore
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Update the local user state with fresh data
        setUser(currentUser => {
          if (!currentUser) return null;
          
          return {
            ...currentUser,
            name: userData.name || currentUser.name,
            school: userData.school || currentUser.school,
            isPro: userData.isPro || false,
          };
        });
        
        console.log("User data refreshed successfully:", userData);
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Fetch additional user data from Firestore
        const fetchUserData = async () => {
          try {
            // Get user document from Firestore
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            
            // Convert Firebase user to our User type with additional data
            const user: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              // Add additional fields from Firestore if they exist
              name: userDoc.exists() ? userDoc.data().name : null,
              school: userDoc.exists() ? userDoc.data().school : null,
              isPro: userDoc.exists() ? userDoc.data().isPro : false
            };
            setUser(user);
          } catch (error) {
            console.error("Error fetching user data:", error);
            // Fallback to basic user info if Firestore fetch fails
            const user: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL
            };
            setUser(user);
          }
        };
        
        fetchUserData();
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await logInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      await registerWithEmailAndPassword(email, password);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseLogout();
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="flex items-center space-x-2">
          <LoaderPinwheel className="h-6 w-6 animate-spin text-primary" />
          <span className="text-lg font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : null;
}