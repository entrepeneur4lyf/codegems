'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SavedContextProps {
  savedProjects: string[];
  addProject: (project: string) => void;
  removeProject: (project: string) => void;
}

const SavedContext = createContext<SavedContextProps | undefined>(undefined);

export const SavedProvider = ({ children }: { children: ReactNode }) => {
  const [savedProjects, setSavedProjects] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('savedProjects') || '[]');
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('savedProjects', JSON.stringify(savedProjects));
    }
  }, [savedProjects]);

  const addProject = (project: string) => {
    setSavedProjects((prev) => {
      const updatedProjects = [...prev, project];
      return updatedProjects;
    });
  };

  const removeProject = (project: string) => {
    setSavedProjects((prev) => prev.filter((p) => p !== project));
  };

  return (
    <SavedContext.Provider value={{ savedProjects, addProject, removeProject }}>
      {children}
    </SavedContext.Provider>
  );
};

export const useSaved = () => {
  const context = useContext(SavedContext);
  if (!context) {
    throw new Error('useSaved must be used within a SavedProvider');
  }
  return context;
};
