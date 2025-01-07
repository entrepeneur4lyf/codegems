'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Star, GitFork, Search, Tag, ChevronLeft, ChevronRight, Heart, Github, Share2, Check, AlertCircle } from 'lucide-react';

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
  const [SubmitButton, setSubmitButton] = useState("Submit");
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
        setSubmitButton("Please Fill every Text-Area");
      return;
    }
    
    try {
      const response = await fetch('/api/project-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectRequest),
      });

      if (!response.ok) {
        setSubmitButton("Failed to submit request");
        throw new Error('Failed to submit request');
      }

      setSubmitButton("Successfully Sent");

      setProjectRequest({
        title: '',
        githubLink: '',
        description: '',
        reason: ''
      });
    } catch (error) {
      setSubmitButton("Failed to submit request");
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
                              removeProject(project.name);
                            } else {
                              addProject(project.name);
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

          {/* Project Request Section */}
{/* Project Request Section */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Request Form Card */}
            <Card className="bg-slate-800/50 border-slate-700 h-fit">
              <CardHeader>
                <CardTitle className="text-white text-xl text-center">Request a Project</CardTitle>
                <CardDescription className="text-gray-300 text-center">
                  Share an amazing project with the community
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Project Title"
                  value={projectRequest.title}
                  onChange={(e) => setProjectRequest(prev => ({...prev, title: e.target.value}))}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-400"
                />

                <div className="flex items-center gap-2">
                  <Github className="text-white" />
                  <Input
                    placeholder="GitHub Link"
                    value={projectRequest.githubLink}
                    onChange={(e) => setProjectRequest(prev => ({...prev, githubLink: e.target.value}))}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-400"
                  />
                </div>

                <Textarea
                  placeholder="What is this project about?"
                  value={projectRequest.description}
                  onChange={(e) => setProjectRequest(prev => ({...prev, description: e.target.value}))}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-400"
                />

                <Textarea
                  placeholder="Why do you think this is a good project?"
                  value={projectRequest.reason}
                  onChange={(e) => setProjectRequest(prev => ({...prev, reason: e.target.value}))}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-400"
                />

                {SubmitButton !== "Submit" && (
                  <Alert className={`${
                    SubmitButton.includes("Success") ? 'bg-green-500/20 border-green-500' :
                    SubmitButton.includes("Failed") ? 'bg-red-500/20 border-red-500' :
                    'bg-blue-500/20 border-blue-500'
                  } text-white border`}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>
                      {SubmitButton.includes("Success") ? 'Success!' :
                       SubmitButton.includes("Failed") ? 'Error' :
                       'Note'}
                    </AlertTitle>
                    <AlertDescription>
                      {SubmitButton}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleProjectRequest}
                  className="bg-purple-500 hover:bg-purple-600 text-white w-full flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  {SubmitButton}
                </Button>

                <div className="flex items-center justify-center gap-4 mt-4">
                  <Badge variant="secondary" className="bg-slate-700 text-gray-300">
                    <Star className="w-4 h-4 mr-1" /> Community Driven
                  </Badge>
                  <Badge variant="secondary" className="bg-slate-700 text-gray-300">
                    <Heart className="w-4 h-4 mr-1" /> Open Source
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Community Guidelines Card */}
            <Card className="bg-slate-800/50 border-slate-700 text-white h-fit lg:mt-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="text-purple-500" />
                  Community Guidelines
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Help us maintain a high-quality collection of projects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-300">
                <div className="flex items-start gap-2">
                  <Check className="text-green-500 mt-1" />
                  <p>Share projects that have made a significant impact on your development workflow</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="text-green-500 mt-1" />
                  <p>Include detailed descriptions to help others understand the projects value</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="text-green-500 mt-1" />
                  <p>Ensure the project is actively maintained and well-documented</p>
                </div>
                
                <div className="pt-4">
                  <h3 className="text-lg font-semibold mb-3">What makes a good submission?</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="text-green-500 mt-1" />
                      <p>Clear description of the projects purpose and benefits</p>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="text-green-500 mt-1" />
                      <p>Regular updates and active maintenance</p>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="text-green-500 mt-1" />
                      <p>Good documentation and examples</p>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="text-green-500 mt-1" />
                      <p>Responsive maintainers and community</p>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}