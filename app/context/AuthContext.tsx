"use client"
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useToast } from "@/hooks/use-toast";
import supabase from "@/lib/supabase";
import crypto from 'crypto';

interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  points: number;
  level: number;
  badges: string[];
  avatarUrl: string;
  token?: string;
  tokenExpiration?: number;
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

  // Login function using Supabase
  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Get the user by username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (userError || !userData) {
        toast({
          title: "Login failed",
          description: "Invalid username or password.",
          variant: "destructive",
        });
        return false;
      }

      // Verify password
      const hashedPassword = crypto
        .pbkdf2Sync(password, userData.salt, 1000, 64, 'sha512')
        .toString('hex');

      if (hashedPassword !== userData.password_hash) {
        toast({
          title: "Login failed",
          description: "Invalid username or password.",
          variant: "destructive",
        });
        return false;
      }

      // Format the user object to match our frontend structure
      const formattedUser: User = {
        id: userData.id,
        username: userData.username,
        displayName: userData.display_name,
        email: userData.email,
        points: userData.points,
        level: userData.level,
        badges: userData.badges,
        avatarUrl: userData.avatar_url,
        token: crypto.randomBytes(32).toString('hex'), // Simple token
        tokenExpiration: Date.now() + TOKEN_EXPIRATION_TIME
      };
      
      setUser(formattedUser);
      localStorage.setItem("user", JSON.stringify(formattedUser));

      toast({
        title: "Successfully signed in",
        description: `Welcome back, ${formattedUser.displayName}!`,
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

      // Check if username exists
      const { data: existingUsername } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (existingUsername) {
        toast({
          title: "Registration failed",
          description: "Username already exists.",
          variant: "destructive",
        });
        return false;
      }

      // Check if email exists
      const { data: existingEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingEmail) {
        toast({
          title: "Registration failed",
          description: "Email already exists.",
          variant: "destructive",
        });
        return false;
      }

      // Create password hash
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
        .toString('hex');

      const userId = `user_${Date.now()}`;
      const newUser = {
        id: userId,
        username,
        email,
        display_name: displayName || username,
        password_hash: passwordHash,
        salt,
        points: 10, // Starting points
        level: 1,
        badges: ["newcomer"], // Newcomer badge
        created_at: new Date().toISOString(),
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`, // Generated avatar
      };

      // Insert user into database
      const { error: insertError } = await supabase
        .from('users')
        .insert(newUser);

      if (insertError) {
        console.error("Error inserting user:", insertError);
        toast({
          title: "Registration failed",
          description: "Error creating user account.",
          variant: "destructive",
        });
        return false;
      }

      // Format the user object for the frontend
      const formattedUser: User = {
        id: newUser.id,
        username: newUser.username,
        displayName: newUser.display_name,
        email: newUser.email,
        points: newUser.points,
        level: newUser.level,
        badges: newUser.badges,
        avatarUrl: newUser.avatar_url,
        token: crypto.randomBytes(32).toString('hex'),
        tokenExpiration: Date.now() + TOKEN_EXPIRATION_TIME
      };
      
      setUser(formattedUser);
      localStorage.setItem("user", JSON.stringify(formattedUser));

      toast({
        title: "Registration successful",
        description: `Welcome, ${formattedUser.displayName}!`,
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

      const updates: Record<string, any> = {};

      // Map user data to database column names
      if (userData.displayName) updates.display_name = userData.displayName;
      if (userData.email) updates.email = userData.email;
      if (userData.avatarUrl) updates.avatar_url = userData.avatarUrl;

      // Handle password update separately if provided
      if (userData.currentPassword && userData.newPassword) {
        // Get current user data for password verification
        const { data: currentUserData, error: userError } = await supabase
          .from('users')
          .select('salt, password_hash')
          .eq('id', user.id)
          .single();

        if (userError || !currentUserData) {
          toast({
            title: "Update failed",
            description: "Error verifying current password.",
            variant: "destructive",
          });
          return false;
        }

        // Verify current password
        const hashedCurrentPassword = crypto
          .pbkdf2Sync(userData.currentPassword, currentUserData.salt, 1000, 64, 'sha512')
          .toString('hex');

        if (hashedCurrentPassword !== currentUserData.password_hash) {
          toast({
            title: "Update failed",
            description: "Current password is incorrect.",
            variant: "destructive",
          });
          return false;
        }

        // Create new password hash
        const newSalt = crypto.randomBytes(16).toString('hex');
        const newPasswordHash = crypto
          .pbkdf2Sync(userData.newPassword, newSalt, 1000, 64, 'sha512')
          .toString('hex');

        updates.salt = newSalt;
        updates.password_hash = newPasswordHash;
      }

      // Update user in database
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (updateError) {
        toast({
          title: "Update failed",
          description: "Error updating profile.",
          variant: "destructive",
        });
        return false;
      }

      // Update the local user state with new values
      const updatedUser = {
        ...user,
        ...userData,
        tokenExpiration: user.tokenExpiration // Preserve token expiration
      };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

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