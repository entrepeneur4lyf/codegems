'use client';

import { useSaved } from './SavedContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, GitFork, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Language {
  [key: string]: number;
}

interface Project {
  name: string;
  description: string;
  stars: string;
  forks: string;
  tags: string[];
  url: string;
  color: string;
  languages: Language;
}

const languageColors: { [key: string]: string } = {
  Python: '#3572A5',
  TypeScript: '#2b7489',
  JavaScript: '#f1e05a',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Dockerfile: '#384d54',
  Ruby: '#701516',
  PowerShell: '#012456',
  AutoHotkey: '#6594b9',
  Svelte: '#ff3e00',
  SCSS: '#c6538c',
  Scheme: '#1e4aec',
  "Inno Setup": '#264b99',
  Batchfile: '#C1F12E',
  Makefile: '#427819',
  Jinja: '#a52a22'
};

const LanguageBar = ({ languages }: { languages: Language }) => {
  const totalBytes = Object.values(languages).reduce((sum, value) => sum + value, 0);
  
  const percentages = Object.entries(languages).map(([name, bytes]) => ({
    name,
    percentage: (bytes / totalBytes) * 100
  })).sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Languages</h2>
      
      <TooltipProvider>
        <div className="h-2 w-full flex rounded-full overflow-hidden">
          {percentages.map(({ name, percentage }) => (
            <Tooltip key={name} delayDuration={0}>
              <TooltipTrigger asChild>
                <div
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: languageColors[name] || '#ededed'
                  }}
                  className="transition-opacity hover:opacity-80"
                />
              </TooltipTrigger>
              <TooltipContent 
                className="bg-slate-800 border-slate-700 text-white"
                side="top"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: languageColors[name] || '#ededed' }}
                  />
                  <span>{name}: {percentage.toFixed(1)}%</span>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
      
      <div className="flex flex-wrap gap-4">
        {percentages
          .filter(({ percentage }) => percentage >= 2) 
          .map(({ name, percentage }) => (
            <div key={name} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: languageColors[name] || '#ededed' }}
              />
              <span className="font-medium text-white">{name}</span>
              <span className="text-gray-400">{percentage.toFixed(1)}%</span>
            </div>
          ))}
      </div>
    </div>
  );
};

function getRandomGradient() {
  const colors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-green-400 to-blue-500',
    'from-yellow-400 to-orange-500',
  ];
  const randomIndex = Math.floor(Math.random() * colors.length);
  return `bg-gradient-to-br ${colors[randomIndex]}`;
}

export default function SavedPage() {
  const { removeProject } = useSaved();
  const [savedProjectDetails, setSavedProjectDetails] = useState<Project[]>([]);
  const [showWarning, setShowWarning] = useState<boolean>(true);

  useEffect(() => {
    const fetchSavedProjects = async () => {
      try {
        const storedProjects = localStorage.getItem('savedProjects');
        const latestSavedProjects: string[] = storedProjects ? JSON.parse(storedProjects) : [];

        const response = await fetch('/api/projects');
        const allProjects: Project[] = await response.json();

        const filteredProjects = allProjects
          .filter((project) => latestSavedProjects.includes(project.name))
          .map((project) => ({ ...project, color: getRandomGradient() }));

        setSavedProjectDetails(filteredProjects);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };

    fetchSavedProjects();
  }, []); 

  const handleRemove = (projectName: string) => {
    removeProject(projectName);
    setSavedProjectDetails((prevDetails) =>
      prevDetails.filter((project) => project.name !== projectName)
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="pt-24 p-8">
        <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
              Saved Projects
            </h1>
            {showWarning && (
              <div className="flex items-center justify-center gap-1">
                <p className="text-yellow-400/80 text-sm flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                  Projects are saved in your browsers local storage and will be deleted if you clear your browser data
                </p>
                <button
                  onClick={() => setShowWarning(false)}
                  className="ml-1 text-gray-400 hover:text-gray-300 p-1 rounded-full hover:bg-gray-700/50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            )}
          </div>
          {savedProjectDetails.length === 0 ? (
            <p className="text-gray-400 text-center">No projects saved yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {savedProjectDetails.map((project, index) => (
                <div
                  key={index}
                  className="group relative cursor-pointer"
                  onClick={() => window.open(project.url, '_blank', 'noopener,noreferrer')}
                >
                  <div
                    className={`absolute inset-0 ${project.color} rounded-xl blur-md opacity-20 group-hover:opacity-30 transition-all duration-500`}
                  ></div>
                  <Card className="relative h-full bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-500 backdrop-blur-sm transform-gpu hover:-translate-y-2 hover:scale-105">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:via-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                          {project.name}
                        </h2>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(project.name);
                          }}
                        >
                          Remove
                        </Button>
                      </div>

                      <p className="text-gray-300 mb-6">{project.description}</p>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {project.tags.map((tag, tagIndex) => (
                          <div
                            key={tagIndex}
                            className="bg-slate-700/50 text-gray-300 text-sm px-3 py-1 rounded-full flex items-center transform transition-all duration-300 hover:scale-105 hover:bg-slate-600/50"
                          >
                            <Tag className="h-3 w-3 mr-1.5" />
                            {tag}
                          </div>
                        ))}
                      </div>

                      <LanguageBar languages={project.languages} />

                      <div className="flex justify-start gap-6 text-sm text-gray-400 mt-6">
                        <span className="flex items-center">
                          <Star className="h-4 w-4 mr-1.5 text-yellow-500" />
                          {project.stars}
                        </span>
                        <span className="flex items-center">
                          <GitFork className="h-4 w-4 mr-1.5" />
                          {project.forks}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}