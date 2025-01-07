'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Star, GitFork, Search, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';


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
  return `bg-gradient-to-br ${colors[Math.floor(Math.random() * colors.length)]}`;
}

export default function GithubProjectsPage() {
  const [SubmitButton, setSubmitButton] = useState("Submit")
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [savedProjects, setSavedProjects] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('savedProjects') || '[]');
    }
    return [];
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [projectRequest, setProjectRequest] = useState({
    title: '',
    githubLink: '',
    description: '',
    reason: ''
  });
  const projectsPerPage = 9;

  useEffect(() => {
    localStorage.setItem('savedProjects', JSON.stringify(savedProjects));
  }, [savedProjects]);

  useEffect(() => {
    const fetchProjects = async () => {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data.map((project: Project) => ({
        ...project,
        color: getRandomGradient(),
      })));
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  const handleCardClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleProjectRequest = async () => {
    if (!projectRequest.title.trim() || 
        !projectRequest.githubLink.trim() || 
        !projectRequest.description.trim() || 
        !projectRequest.reason.trim()) {
        setSubmitButton("Please Fill every Text-Area")
      return;
    }
    
    try {
      const response = await fetch('/api/project-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectRequest),
      });

      if (!response.ok) {
        setSubmitButton("Failed to submit request")
        throw new Error('Failed to submit request');
      }

      setSubmitButton("Successfully Sent")

      setProjectRequest({
        title: '',
        githubLink: '',
        description: '',
        reason: ''
      });
    } catch (error) {
      setSubmitButton("Failed to submit request")
      console.error('Failed to submit project request:', error);
    }
  };

  const addProject = (projectName: string) => {
    setSavedProjects((prev) => [...prev, projectName]);
  };

  const removeProject = (projectName: string) => {
    setSavedProjects((prev) => prev.filter((name) => name !== projectName));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="pt-24 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
              Code Gems
            </h1>
            <p className="text-gray-400 text-xl mb-8">
              Discovering & Collecting Remarkable GitHub Projects
            </p>

            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search projects by name, description, or tags..."
                className="pl-12 py-6 w-full bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {currentProjects.map((project) => {
              const isSaved = savedProjects.includes(project.name);
              return (
                <div
                  key={project.name}
                  className="group relative cursor-pointer"
                  onClick={() => handleCardClick(project.url)}
                >
                  <div className={`absolute inset-0 ${project.color} rounded-xl blur-md opacity-20 group-hover:opacity-30 transition-all duration-500`}></div>
                  <Card className="relative h-full bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-500 backdrop-blur-sm transform-gpu hover:-translate-y-2 hover:scale-105">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:via-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                          {project.name}
                        </h2>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`text-gray-400 ${isSaved ? 'text-green-500' : 'hover:text-white'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isSaved) {
                              removeProject(project.name)
                            }else {
                              addProject(project.name)
                            }
                        
                          }}
                        >
                          {isSaved ? 'Unsave' : 'Save'}
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
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-4 mb-16">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700/50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-gray-400 flex items-center">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700/50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Project Request Form */}
         {/* Project Request Form */}
         <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">Request a Project</h3>
            <div className="flex flex-col gap-4">
              <Input
                placeholder="Project Title"
                value={projectRequest.title || ''}
                onChange={(e) => setProjectRequest(prev => ({...prev, title: e.target.value}))}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-400"
              />
              <Input
                placeholder="GitHub Link"
                value={projectRequest.githubLink || ''}
                onChange={(e) => setProjectRequest(prev => ({...prev, githubLink: e.target.value}))}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-400"
              />
              <Textarea
                placeholder="What is this project about?"
                value={projectRequest.description || ''}
                onChange={(e) => setProjectRequest(prev => ({...prev, description: e.target.value}))}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-400"
              />
              <Textarea
                placeholder="Why do you think this is a good project?"
                value={projectRequest.reason || ''}
                onChange={(e) => setProjectRequest(prev => ({...prev, reason: e.target.value}))}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-400"
              />
              <Button
                onClick={handleProjectRequest}
                className="bg-purple-500 hover:bg-purple-600 text-white w-full"
              >
                {SubmitButton}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}