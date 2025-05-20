// Fix the token expiration and validation in AuthContext.tsx
"use client"
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useToast } from "@/hooks/use-toast";

interface User {
  tokenExpiration: any;
  id: string;
  username: string;
  displayName: string;
  email?: string;
  points: number;
  level: number;
  badges: string[];
  avatarUrl: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (
    username: string,
    email: string,
    password: string,
    displayName?: string
  ) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token expiration time (24 hours)
const TOKEN_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load user from local storage on page load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        
        // Check if token is expired
        if (userData.tokenExpiration && Date.now() > userData.tokenExpiration) {
          // Token expired, log out user
          localStorage.removeItem("user");
          setUser(null);
          toast({
            title: "Session expired",
            description: "Please sign in again.",
          });
        } else {
          setUser(userData);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/users?action=login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          title: "Login failed",
          description: errorData.error || "Invalid credentials.",
          variant: "destructive",
        });
        return false;
      }

      const userData = await response.json();
      
      // Add token expiration
      const userWithExpiration = {
        ...userData,
        tokenExpiration: Date.now() + TOKEN_EXPIRATION_TIME
      };
      
      setUser(userWithExpiration);
      localStorage.setItem("user", JSON.stringify(userWithExpiration));

      toast({
        title: "Successfully signed in",
        description: `Welcome back, ${userData.displayName}!`,
      });

      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Check token validity
  const checkTokenValidity = (): boolean => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        const tokenExpiration = userData.tokenExpiration;

        if (tokenExpiration && Date.now() > tokenExpiration) {
          // Token expired, log out user
          logout();
          toast({
            title: "Session expired",
            description: "Please sign in again.",
          });
          return false;
        }
        return true;
      } catch (error) {
        console.error("Error checking token validity:", error);
        return false;
      }
    }
    return false;
  };

  useEffect(() => {
    // Check token validity on component mount
    checkTokenValidity();
    
    // Set up interval to check token validity periodically (every 5 minutes)
    const intervalId = setInterval(checkTokenValidity, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const register = async (
    username: string,
    email: string,
    password: string,
    displayName?: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, displayName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          title: "Registration failed",
          description: errorData.error || "Error during registration.",
          variant: "destructive",
        });
        return false;
      }

      const userData = await response.json();
      
      // Add token expiration
      const userWithExpiration = {
        ...userData,
        tokenExpiration: Date.now() + TOKEN_EXPIRATION_TIME
      };
      
      setUser(userWithExpiration);
      localStorage.setItem("user", JSON.stringify(userWithExpiration));

      toast({
        title: "Registration successful",
        description: `Welcome, ${userData.displayName}!`,
      });

      return true;
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const updateUser = async (userData: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    try {
      setIsLoading(true);

      // Check token validity before proceeding
      if (!checkTokenValidity()) {
        return false;
      }

      const response = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: user.id, ...userData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          title: "Update failed",
          description:
            errorData.error || "Error updating profile.",
          variant: "destructive",
        });
        return false;
      }

      const updatedUserData = await response.json();
      const newUserData = { 
        ...user, 
        ...updatedUserData,
        tokenExpiration: user.tokenExpiration // Preserve token expiration
      };

      setUser(newUserData);
      localStorage.setItem("user", JSON.stringify(newUserData));

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });

      return true;
    } catch (error) {
      console.error("Update user error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};