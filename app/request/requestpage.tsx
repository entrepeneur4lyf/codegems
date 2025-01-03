'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function Requestpage() {
  const [projectRequest, setProjectRequest] = useState({
    title: '',
    githubLink: '',
    description: '',
    reason: ''
  });

  const handleProjectRequest = async () => {
    if (!projectRequest.title.trim() || 
        !projectRequest.githubLink.trim() || 
        !projectRequest.description.trim() || 
        !projectRequest.reason.trim()) {
      return;
    }
    
    try {
      const response = await fetch('/api/project-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectRequest),
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      setProjectRequest({
        title: '',
        githubLink: '',
        description: '',
        reason: ''
      });
    } catch (error) {
      console.error('Failed to submit project request:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="pt-24 p-8">
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
            Submit
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}