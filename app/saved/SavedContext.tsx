"use client"
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface SavedContextProps {
  savedProjects: string[];
  addProject: (project: string) => void;
  removeProject: (project: string) => void;
  clearAllSaved: () => void;
}

const SavedContext = createContext<SavedContextProps | undefined>(undefined);

export const SavedProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage, but handle potential errors
  const [savedProjects, setSavedProjects] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('savedProjects');
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error('Error parsing saved projects from localStorage:', error);
        // If there's an error, reset to empty array
        localStorage.removeItem('savedProjects');
        return [];
      }
    }
    return [];
  });

  // Update localStorage whenever savedProjects changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('savedProjects', JSON.stringify(savedProjects));
      } catch (error) {
        console.error('Error saving projects to localStorage:', error);
      }
    }
  }, [savedProjects]);

  // Listen for storage events to sync across tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'savedProjects' && event.newValue !== null) {
        try {
          setSavedProjects(JSON.parse(event.newValue));
        } catch (error) {
          console.error('Error parsing saved projects from storage event:', error);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, []);

  const addProject = useCallback((project: string) => {
    setSavedProjects((prev) => {
      // Check if the project is already in the list to avoid duplicates
      if (prev.includes(project)) {
        return prev;
      }
      return [...prev, project];
    });
  }, []);

  const removeProject = useCallback((project: string) => {
    setSavedProjects((prev) => prev.filter((p) => p !== project));
  }, []);

  const clearAllSaved = useCallback(() => {
    setSavedProjects([]);
  }, []);

  return (
    <SavedContext.Provider value={{ 
      savedProjects, 
      addProject, 
      removeProject,
      clearAllSaved 
    }}>
      {children}
    </SavedContext.Provider>
  );
};

export const useSaved = () => {
  const context = useContext(SavedContext);
  if (!context) {
    throw new Error("useSaved must be used within a SavedProvider");
  }
  return context;
};