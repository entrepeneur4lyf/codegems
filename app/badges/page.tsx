"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import BadgeDisplay from "@/components/BadgeDisplay";
import { useAuth } from "@/app/context/AuthContext";
import AuthenticationDialog from "@/components/AuthenticationDialog";
import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";

const BadgesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = React.useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 mt-10">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Badges</h1>
            <p className="text-gray-400 mb-6">You need to be signed in to view your badges.</p>

            <Button
              onClick={() => setShowAuthDialog(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              Sign In
            </Button>

            <AuthenticationDialog
              isOpen={showAuthDialog}
              onOpenChange={setShowAuthDialog}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 mt-10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-purple-400 text-transparent bg-clip-text">
              Your Badges
            </h1>
            <p className="text-gray-400 text-lg">
              Collect badges by being active on the platform!
            </p>
          </div>

          <Card className="bg-slate-800/50 border-slate-700 text-white mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Award className="text-yellow-500 h-6 w-6" />
                <CardTitle>Unlocked Badges</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Badges you have already earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user && <BadgeDisplay userBadges={user.badges} size="lg" />}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 text-white">
            <CardHeader>
              <CardTitle>Available Badges</CardTitle>
              <CardDescription className="text-gray-400">
                All badges you can collect
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user && (
                <BadgeDisplay userBadges={user.badges} showUnearned size="lg" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BadgesPage;