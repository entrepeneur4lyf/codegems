"use client";

import React from "react";
import LeaderboardDisplay from "@/components/LeaderboardDisplay";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Trophy } from "lucide-react";

const LeaderboardPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 mt-10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-purple-400 text-transparent bg-clip-text">
              Leaderboard
            </h1>
            <p className="text-gray-400 text-lg">
              The most active members of the community
            </p>
          </div>

          <Card className="bg-slate-800/50 border-slate-700 text-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Trophy className="text-yellow-500 h-6 w-6" />
                <CardTitle>Top Contributors</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Users with the most points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeaderboardDisplay />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;