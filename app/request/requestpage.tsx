import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Github, Heart, Share2, Star, Check, AlertCircle } from 'lucide-react';

const RequestPage = () => {
  const [projectRequest, setProjectRequest] = useState({
    title: '',
    githubLink: '',
    description: '',
    reason: ''
  });

  const [submissionStatus, setSubmissionStatus] = useState({
    status: '',
    message: ''
  });

  const handleProjectRequest = async () => {
    if (!projectRequest.title.trim() ||
        !projectRequest.githubLink.trim() ||
        !projectRequest.description.trim() ||
        !projectRequest.reason.trim()) {
      return;
    }

    try {
      setSubmissionStatus({ status: 'loading', message: 'Submitting your request...' });
      
      const response = await fetch('/api/project-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectRequest),
      });

      if (!response.ok) throw new Error('Failed to submit request');

      setSubmissionStatus({
        status: 'success',
        message: 'Thank you for contributing to the community! Your submission will be reviewed shortly.'
      });

      setProjectRequest({
        title: '',
        githubLink: '',
        description: '',
        reason: ''
      });
    } catch (error) {
      setSubmissionStatus({
        status: 'error',
        message: 'Failed to submit project request. Please try again.'
      });
      console.log(error)
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 mt-10">
      <div className="pt-16 p-8">
        <div className="max-w-2xl mx-auto">
          {/* Community Guidelines Card */}
          <Card className="mb-8 bg-slate-800/50 border-slate-700 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="text-purple-500" />
                Community Guidelines
              </CardTitle>
              <CardDescription className="text-gray-300">
                Help us maintain a high-quality collection of projects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-gray-300">
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
            </CardContent>
          </Card>

          {/* Request Form Card */}
          <Card className="bg-slate-800/50 border-slate-700">
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

              {submissionStatus.status && (
                <Alert className={`${
                  submissionStatus.status === 'success' ? 'bg-green-500/20 border-green-500' :
                  submissionStatus.status === 'error' ? 'bg-red-500/20 border-red-500' :
                  'bg-blue-500/20 border-blue-500'
                } text-white border`}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>
                    {submissionStatus.status === 'success' ? 'Success!' :
                     submissionStatus.status === 'error' ? 'Error' :
                     'Submitting...'}
                  </AlertTitle>
                  <AlertDescription>
                    {submissionStatus.message}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleProjectRequest}
                className="bg-purple-500 hover:bg-purple-600 text-white w-full flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Submit
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
        </div>
      </div>
    </div>
  );
};

export default RequestPage;