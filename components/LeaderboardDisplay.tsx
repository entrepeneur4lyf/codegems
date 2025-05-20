"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Medal, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import BadgeDisplay from "@/components/BadgeDisplay";
import { useAuth } from "@/app/context/AuthContext";

interface LeaderboardUser {
  id: string;
  username: string;
  displayName: string;
  points: number;
  level: number;
  badges: string[];
  avatarUrl: string;
}

const LeaderboardDisplay: React.FC = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch("/api/users?leaderboard=true");
        if (response.ok) {
          const leaderboardData = await response.json();
          setUsers(leaderboardData);
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-400">Keine Benutzer gefunden.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 gap-4">
        {users.map((leaderboardUser, index) => {
          const isCurrentUser = user && user.id === leaderboardUser.id;

          return (
            <div
              key={leaderboardUser.id}
              className={`
                bg-slate-800/50 border ${
                  isCurrentUser ? "border-purple-500" : "border-slate-700"
                } 
                rounded-lg p-4 transition-transform hover:scale-[1.01]
              `}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 relative">
                  {/* Position Badge */}
                  <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center">
                    {index === 0 ? (
                      <Trophy className="w-7 h-7 text-yellow-400" />
                    ) : index === 1 ? (
                      <Medal className="w-6 h-6 text-gray-300" />
                    ) : index === 2 ? (
                      <Medal className="w-6 h-6 text-amber-600" />
                    ) : (
                      <span className="bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-gray-300 text-sm">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* User Avatar */}
                  {leaderboardUser.avatarUrl ? (
                    <img
                      src={leaderboardUser.avatarUrl}
                      alt={leaderboardUser.displayName}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : null}
                </div>

                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">
                      {leaderboardUser.displayName}
                    </h3>
                    {isCurrentUser && (
                      <Badge className="bg-purple-500/20 text-purple-300 border-none">
                        Du
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center mt-1">
                    <div className="text-sm text-gray-400">
                      @{leaderboardUser.username}
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="font-bold text-lg text-purple-400">
                      {leaderboardUser.points}
                    </span>
                    <span className="text-gray-400">Punkte</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end mt-1">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-400">
                      Level {leaderboardUser.level}
                    </span>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="mt-3">
                <BadgeDisplay userBadges={leaderboardUser.badges} size="sm" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeaderboardDisplay;
