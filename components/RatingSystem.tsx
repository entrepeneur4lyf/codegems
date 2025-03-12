"use client";

import React, { useState, useEffect } from "react";
import { Star, StarHalf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/app/context/AuthContext";

interface RatingSystemProps {
  projectName: string;
  onRatingSubmit?: () => void;
}

interface Rating {
  id: string;
  projectName: string;
  userId: string;
  rating: number;
  review: string;
  createdAt: string;
  updatedAt: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
}

interface BadgeResponse {
  earnedBadges: Badge[];
  levelUp: boolean;
  currentLevel: number;
  currentPoints: number;
}

const RatingSystem: React.FC<RatingSystemProps> = ({
  projectName,
  onRatingSubmit,
}) => {
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [review, setReview] = useState("");
  const [existingRating, setExistingRating] = useState<Rating | null>(null);
  const [projectRatings, setProjectRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Ratings für dieses Projekt laden
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const response = await fetch(
          `/api/ratings?project=${encodeURIComponent(projectName)}`
        );
        if (response.ok) {
          const ratings = await response.json();
          setProjectRatings(ratings);

          // Durchschnittsbewertung berechnen
          if (ratings.length > 0) {
            const sum = ratings.reduce(
              (total: number, r: Rating) => total + r.rating,
              0
            );
            setAverageRating(sum / ratings.length);
          }

          // Prüfen, ob der aktuelle Benutzer bereits eine Bewertung abgegeben hat
          if (isAuthenticated && user) {
            const userExistingRating = ratings.find(
              (r: Rating) => r.userId === user.id
            );
            if (userExistingRating) {
              setExistingRating(userExistingRating);
              setUserRating(userExistingRating.rating);
              setReview(userExistingRating.review);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching ratings:", error);
      }
    };

    fetchRatings();
  }, [projectName, isAuthenticated, user]);

  const handleRatingClick = (rating: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Du musst angemeldet sein, um eine Bewertung abzugeben.",
        variant: "destructive",
      });
      return;
    }

    setUserRating(rating);
    setShowReviewForm(true);
  };

  const handleRatingHover = (rating: number) => {
    setHoverRating(rating);
  };

  const handleRatingLeave = () => {
    setHoverRating(null);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Du musst angemeldet sein, um eine Bewertung abzugeben.",
        variant: "destructive",
      });
      return;
    }

    if (!userRating) {
      toast({
        title: "Bewertung fehlt",
        description: "Bitte wähle eine Bewertung aus.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName,
          userId: user.id,
          rating: userRating,
          review,
        }),
      });

      if (response.ok) {
        toast({
          title: existingRating
            ? "Bewertung aktualisiert"
            : "Bewertung abgegeben",
          description: existingRating
            ? "Deine Bewertung wurde erfolgreich aktualisiert."
            : "Deine Bewertung wurde erfolgreich abgegeben.",
        });

        // Abzeichen-Check auslösen
        if (!existingRating) {
          try {
            const badgeResponse = await fetch(
              "/api/users?action=check_badges",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId: user.id,
                }),
              }
            );

            if (badgeResponse.ok) {
              const badgeData: BadgeResponse = await badgeResponse.json();

              if (badgeData.earnedBadges && badgeData.earnedBadges.length > 0) {
                badgeData.earnedBadges.forEach((badge: Badge) => {
                  toast({
                    title: "Neues Abzeichen freigeschaltet!",
                    description: `Du hast das Abzeichen "${badge.name}" erhalten: ${badge.description}`,
                  });
                });
              }

              if (badgeData.levelUp) {
                toast({
                  title: "Level-Aufstieg!",
                  description: `Glückwunsch! Du bist auf Level ${badgeData.currentLevel} aufgestiegen.`,
                });
              }
            }
          } catch (badgeError) {
            console.error("Error checking badges:", badgeError);
          }
        }

        // Wenn ein Callback bereitgestellt wurde, rufe ihn auf
        if (onRatingSubmit) {
          onRatingSubmit();
        }

        // Ratings neu laden
        const updatedResponse = await fetch(
          `/api/ratings?project=${encodeURIComponent(projectName)}`
        );
        if (updatedResponse.ok) {
          const updatedRatings = await updatedResponse.json();
          setProjectRatings(updatedRatings);

          if (updatedRatings.length > 0) {
            const sum = updatedRatings.reduce(
              (total: number, r: Rating) => total + r.rating,
              0
            );
            setAverageRating(sum / updatedRatings.length);
          }

          const userUpdatedRating = updatedRatings.find(
            (r: Rating) => r.userId === user.id
          );
          if (userUpdatedRating) {
            setExistingRating(userUpdatedRating);
          }
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Fehler",
          description:
            errorData.error || "Fehler beim Speichern der Bewertung.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex flex-col items-center sm:items-start">
          <h3 className="text-lg font-semibold text-white mb-2">
            Projektbewertung
          </h3>

          {averageRating !== null && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.floor(averageRating)
                        ? "text-yellow-400 fill-yellow-400"
                        : star <= averageRating
                        ? "text-yellow-400 fill-yellow-400 opacity-50"
                        : "text-gray-400"
                    }`}
                  />
                ))}
              </div>
              <span className="text-white">
                {averageRating.toFixed(1)} ({projectRatings.length}{" "}
                {projectRatings.length === 1 ? "Bewertung" : "Bewertungen"})
              </span>
            </div>
          )}

          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingClick(star)}
                onMouseEnter={() => handleRatingHover(star)}
                onMouseLeave={handleRatingLeave}
                className="transition-transform hover:scale-110 p-1"
              >
                <Star
                  className={`w-6 h-6 ${
                    (
                      hoverRating !== null
                        ? star <= hoverRating
                        : star <= (userRating || 0)
                    )
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-400"
                  }`}
                />
              </button>
            ))}
          </div>

          {!isAuthenticated && (
            <p className="text-sm text-gray-400 mt-2">
              Melde dich an, um eine Bewertung abzugeben.
            </p>
          )}
        </div>

        {existingRating && (
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <span className="text-sm text-gray-400">
              Du hast dieses Projekt bereits bewertet. Du kannst deine Bewertung
              bearbeiten.
            </span>
          </div>
        )}
      </div>

      {showReviewForm && isAuthenticated && (
        <div className="mt-4 space-y-3">
          <Textarea
            placeholder="Schreibe einen Kommentar zu deiner Bewertung (optional)"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            className="min-h-32 bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-400"
          />

          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              {isSubmitting
                ? "Wird gesendet..."
                : existingRating
                ? "Bewertung aktualisieren"
                : "Bewertung abschicken"}
            </Button>
          </div>
        </div>
      )}

      {projectRatings.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Alle Bewertungen</h3>

          <div className="space-y-4">
            {projectRatings
              .filter((r) => r.review) // Nur Bewertungen mit Rezensionen anzeigen
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((rating) => (
                <div
                  key={rating.id}
                  className="bg-slate-800/50 p-4 rounded-lg border border-slate-700"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2 items-center">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= rating.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-400"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(rating.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {rating.userId === user?.id && (
                      <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                        Deine Bewertung
                      </span>
                    )}
                  </div>

                  {rating.review && (
                    <p className="mt-2 text-gray-300">{rating.review}</p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RatingSystem;
