"use client";

import ProjectDetailPage from "@/components/ProjectDetailPage";

interface ProjectPageProps {
  params: {
    projectName: string;
  };
}

export default function ProjectPage({ params }: ProjectPageProps) {
  // Decode URL parameter
  const decodedProjectName = decodeURIComponent(params.projectName);

  return <ProjectDetailPage projectName={decodedProjectName} />;
}
