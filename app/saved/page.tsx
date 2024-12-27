'use client';

import { useSaved } from './SavedContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, GitFork, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Project {
  name: string;
  description: string;
  stars: string;
  forks: string;
  tags: string[];
  url: string;
  color: string;
}

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
  const { savedProjects, removeProject } = useSaved();
  const [savedProjectDetails, setSavedProjectDetails] = useState<Project[]>([]);

  useEffect(() => {
    const fetchSavedProjects = async () => {
      try {
        const storedProjects = localStorage.getItem('savedProjects');
        const latestSavedProjects: string[] = storedProjects ? JSON.parse(storedProjects) : [];

        // Fetch all projects from the database
        const response = await fetch('/api/projects');
        const allProjects: Project[] = await response.json();

        // Filter projects to include only saved ones and assign random colors
        const filteredProjects = allProjects
          .filter((project) => latestSavedProjects.includes(project.name))
          .map((project) => ({ ...project, color: getRandomGradient() }));

        setSavedProjectDetails(filteredProjects);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };

    fetchSavedProjects();
  }, []); // Fetch saved projects only once when the component mounts

  const handleRemove = (projectName: string) => {
    // Remove the project from context
    removeProject(projectName);

    // Update local state to reflect the change instantly
    setSavedProjectDetails((prevDetails) =>
      prevDetails.filter((project) => project.name !== projectName)
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="pt-24 p-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
            Saved Projects
          </h1>
          {savedProjectDetails.length === 0 ? (
            <p className="text-gray-400">No projects saved yet.</p>
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

                      <div className="flex justify-start gap-6 text-sm text-gray-400">
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
