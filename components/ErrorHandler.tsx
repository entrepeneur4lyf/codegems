// Enhanced Error Handling Component
// This new component will be used throughout the application to provide consistent error handling

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

interface ErrorHandlerProps {
  error: string | null;
  isLoading: boolean;
  retry?: () => void;
  children: React.ReactNode;
}

const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  error,
  isLoading,
  retry,
  children,
}) => {
  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-4" />
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-4">
        <Alert className="bg-red-500/20 border-red-500 mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        {retry && (
          <div className="flex justify-center">
            <Button 
              onClick={retry} 
              variant="outline" 
              className="bg-slate-800 hover:bg-slate-700 text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export default ErrorHandler;