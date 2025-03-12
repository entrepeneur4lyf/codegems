"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useToast } from "@/hooks/use-toast";

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Beim Laden der Seite Benutzer aus dem lokalen Speicher laden
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
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
          title: "Anmeldung fehlgeschlagen",
          description: errorData.error || "Ungültige Anmeldedaten.",
          variant: "destructive",
        });
        return false;
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));

      toast({
        title: "Erfolgreich angemeldet",
        description: `Willkommen zurück, ${userData.displayName}!`,
      });

      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

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
          title: "Registrierung fehlgeschlagen",
          description: errorData.error || "Fehler bei der Registrierung.",
          variant: "destructive",
        });
        return false;
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));

      toast({
        title: "Registrierung erfolgreich",
        description: `Willkommen, ${userData.displayName}!`,
      });

      return true;
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
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
      title: "Abgemeldet",
      description: "Du wurdest erfolgreich abgemeldet.",
    });
  };

  const updateUser = async (userData: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    try {
      setIsLoading(true);

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
          title: "Update fehlgeschlagen",
          description:
            errorData.error || "Fehler beim Aktualisieren des Profils.",
          variant: "destructive",
        });
        return false;
      }

      const updatedUserData = await response.json();
      const newUserData = { ...user, ...updatedUserData };

      setUser(newUserData);
      localStorage.setItem("user", JSON.stringify(newUserData));

      toast({
        title: "Profil aktualisiert",
        description: "Dein Profil wurde erfolgreich aktualisiert.",
      });

      return true;
    } catch (error) {
      console.error("Update user error:", error);
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
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
