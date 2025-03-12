"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Star,
  GitFork,
  Tag,
  ExternalLink,
  Github,
  Bookmark,
  CheckCircle,
} from "lucide-react";
import { useSaved } from "@/app/saved/SavedContext";
import RatingSystem from "@/components/RatingSystem";
import CommentSection from "@/components/CommentSection";
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
  languages: Language;
}

interface ProjectDetailPageProps {
  projectName: string;
}

const languageColors: { [key: string]: string } = {
  Python: "#3572A5",
  TypeScript: "#2b7489",
  JavaScript: "#f1e05a",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Dockerfile: "#384d54",
  Ruby: "#701516",
  PowerShell: "#012456",
  AutoHotkey: "#6594b9",
  Svelte: "#ff3e00",
  SCSS: "#c6538c",
  Scheme: "#1e4aec",
  "Inno Setup": "#264b99",
  Batchfile: "#C1F12E",
  Makefile: "#427819",
  Jinja: "#a52a22",
};

const LanguageBar = ({ languages }: { languages: Language }) => {
  const totalBytes = Object.values(languages).reduce(
    (sum, value) => sum + value,
    0
  );

  const percentages = Object.entries(languages)
    .map(([name, bytes]) => ({
      name,
      percentage: (bytes / totalBytes) * 100,
    }))
    .sort((a, b) => b.percentage - a.percentage);

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
                    backgroundColor: languageColors[name] || "#ededed",
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
                    style={{
                      backgroundColor: languageColors[name] || "#ededed",
                    }}
                  />
                  <span>
                    {name}: {percentage.toFixed(1)}%
                  </span>
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
                style={{ backgroundColor: languageColors[name] || "#ededed" }}
              />
              <span className="font-medium text-white">{name}</span>
              <span className="text-gray-400">{percentage.toFixed(1)}%</span>
            </div>
          ))}
      </div>
    </div>
  );
};

const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  projectName,
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { savedProjects, addProject, removeProject } = useSaved();
  const isSaved = savedProjects.includes(projectName);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch("/api/projects");
        const projects = await response.json();
        const foundProject = projects.find(
          (p: Project) => p.name === projectName
        );

        if (foundProject) {
          setProject(foundProject);
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectName]);

  const toggleSave = () => {
    if (isSaved) {
      removeProject(projectName);
    } else {
      addProject(projectName);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold text-white">
              Projekt nicht gefunden
            </h1>
            <p className="text-gray-400 mt-4">
              Das gesuchte Projekt existiert nicht.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 mt-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Project Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <h1 className="text-4xl font-bold text-white">{project.name}</h1>

              <div className="flex gap-3">
                <Button
                  onClick={toggleSave}
                  variant="outline"
                  className={`${
                    isSaved
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                      : "bg-slate-800 text-gray-300 border-slate-700"
                  } hover:bg-slate-700/80`}
                >
                  {isSaved ? (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  ) : (
                    <Bookmark className="mr-2 h-4 w-4" />
                  )}
                  {isSaved ? "Gespeichert" : "Speichern"}
                </Button>

                <a href={project.url} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-slate-800 text-white hover:bg-slate-700/80 border border-slate-700">
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </Button>
                </a>
              </div>
            </div>

            <p className="text-gray-300 mt-4 text-lg">{project.description}</p>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              <div className="flex items-center gap-1 bg-slate-800/80 px-3 py-1.5 rounded-full">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-gray-300">{project.stars}</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-800/80 px-3 py-1.5 rounded-full">
                <GitFork className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">{project.forks}</span>
              </div>

              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 bg-slate-800/80 px-3 py-1.5 rounded-full hover:bg-slate-700/80 transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300">Öffnen</span>
              </a>
            </div>
          </div>

          {/* Project Tags */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-3">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag, index) => (
                <div
                  key={index}
                  className="bg-slate-800/80 text-gray-300 px-3 py-1 rounded-full flex items-center"
                >
                  <Tag className="h-3 w-3 mr-1.5" />
                  {tag}
                </div>
              ))}
            </div>
          </div>

          {/* Languages */}
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardContent className="p-6">
              <LanguageBar languages={project.languages} />
            </CardContent>
          </Card>

          {/* Rating System */}
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardContent className="p-6">
              <RatingSystem projectName={project.name} />
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <CommentSection projectName={project.name} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
