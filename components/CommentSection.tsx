"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  ThumbsUp,
  Edit,
  Trash2,
  Reply,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/app/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CommentSectionProps {
  projectName: string;
}

interface Comment {
  id: string;
  projectName: string;
  userId: string;
  text: string;
  parentId: string | null;
  likes: string[];
  createdAt: string;
  edited?: boolean;
}

interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
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

const CommentSection: React.FC<CommentSectionProps> = ({ projectName }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [newComment, setNewComment] = useState("");
  const [replyToComment, setReplyToComment] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Kommentare für dieses Projekt laden
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(
          `/api/comments?project=${encodeURIComponent(projectName)}`
        );
        if (response.ok) {
          const commentsData = await response.json();
          setComments(commentsData);

          // Benutzerinformationen für alle Kommentare laden
          const userIds = [
            ...new Set(commentsData.map((c: Comment) => c.userId)),
          ];
          const userDetails = await Promise.all(
            userIds.map(async (id) => {
              const userResponse = await fetch(`/api/users?id=${id}`);
              if (userResponse.ok) {
                return await userResponse.json();
              }
              return null;
            })
          );

          const usersMap: Record<string, User> = {};
          userDetails.filter(Boolean).forEach((u: User) => {
            usersMap[u.id] = {
              id: u.id,
              username: u.username,
              displayName: u.displayName,
              avatarUrl: u.avatarUrl,
            };
          });

          setUsers(usersMap);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };

    fetchComments();
  }, [projectName]);

  const handleCommentSubmit = async () => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Anmeldung erforderlich",
        description:
          "Du musst angemeldet sein, um einen Kommentar zu schreiben.",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Leerer Kommentar",
        description: "Bitte gib einen Kommentar ein.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName,
          userId: user.id,
          text: newComment,
        }),
      });

      if (response.ok) {
        const newCommentData = await response.json();

        // Neuen Kommentar zur lokalen Liste hinzufügen
        setComments((prev) => [...prev, newCommentData]);

        // Kommentarfeld zurücksetzen
        setNewComment("");

        toast({
          title: "Kommentar gesendet",
          description: "Dein Kommentar wurde erfolgreich gesendet.",
        });

        // Abzeichen-Check auslösen
        try {
          const badgeResponse = await fetch("/api/users?action=check_badges", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user.id,
            }),
          });

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
      } else {
        const errorData = await response.json();
        toast({
          title: "Fehler",
          description: errorData.error || "Fehler beim Senden des Kommentars.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!isAuthenticated || !user || !replyToComment) return;

    if (!replyText.trim()) {
      toast({
        title: "Leere Antwort",
        description: "Bitte gib eine Antwort ein.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName,
          userId: user.id,
          text: replyText,
          parentId: replyToComment,
        }),
      });

      if (response.ok) {
        const newReplyData = await response.json();

        // Neue Antwort zur lokalen Liste hinzufügen
        setComments((prev) => [...prev, newReplyData]);

        // Antwortformular zurücksetzen
        setReplyToComment(null);
        setReplyText("");

        toast({
          title: "Antwort gesendet",
          description: "Deine Antwort wurde erfolgreich gesendet.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Fehler",
          description: errorData.error || "Fehler beim Senden der Antwort.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!isAuthenticated || !user || !editingComment) return;

    if (!editText.trim()) {
      toast({
        title: "Leerer Kommentar",
        description: "Bitte gib einen Kommentar ein.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/comments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commentId: editingComment,
          userId: user.id,
          action: "edit",
          text: editText,
        }),
      });

      if (response.ok) {
        const updatedComment = await response.json();

        // Kommentar in der lokalen Liste aktualisieren
        setComments((prev) =>
          prev.map((c) => (c.id === editingComment ? updatedComment : c))
        );

        // Bearbeitungsformular zurücksetzen
        setEditingComment(null);
        setEditText("");

        toast({
          title: "Kommentar aktualisiert",
          description: "Dein Kommentar wurde erfolgreich aktualisiert.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Fehler",
          description:
            errorData.error || "Fehler beim Aktualisieren des Kommentars.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!isAuthenticated || !user || !commentToDelete) return;

    try {
      const response = await fetch(
        `/api/comments?id=${commentToDelete}&userId=${user.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Kommentar und alle Antworten aus der lokalen Liste entfernen
        setComments((prev) =>
          prev.filter(
            (c) => c.id !== commentToDelete && c.parentId !== commentToDelete
          )
        );

        setShowDeleteDialog(false);
        setCommentToDelete(null);

        toast({
          title: "Kommentar gelöscht",
          description: "Dein Kommentar wurde erfolgreich gelöscht.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Fehler",
          description: errorData.error || "Fehler beim Löschen des Kommentars.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    }
  };

  const handleLike = async (commentId: string) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Du musst angemeldet sein, um einen Kommentar zu liken.",
        variant: "destructive",
      });
      return;
    }

    try {
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return;

      const action = comment.likes.includes(user.id) ? "unlike" : "like";

      const response = await fetch("/api/comments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commentId,
          userId: user.id,
          action,
        }),
      });

      if (response.ok) {
        const updatedComment = await response.json();

        // Kommentar in der lokalen Liste aktualisieren
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? updatedComment : c))
        );
      } else {
        const errorData = await response.json();
        toast({
          title: "Fehler",
          description:
            errorData.error ||
            `Fehler beim ${
              action === "like" ? "Liken" : "Entliken"
            } des Kommentars.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error liking comment:", error);
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    }
  };

  // Kommentare nach Erstellungsdatum sortieren und in Threads gruppieren
  const rootComments = comments
    .filter((c) => !c.parentId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const getReplies = (commentId: string) => {
    return comments
      .filter((c) => c.parentId === commentId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const commentUser = users[comment.userId];

    return (
      <div
        key={comment.id}
        className={`${
          isReply ? "ml-8 mt-3" : "mt-4"
        } bg-slate-800/50 p-4 rounded-lg border border-slate-700`}
      >
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            {commentUser && (
              <>
                <img
                  src={commentUser.avatarUrl}
                  alt={commentUser.username}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">
                      {commentUser.displayName}
                    </span>
                    {comment.userId === user?.id && (
                      <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                        Du
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
              </>
            )}
          </div>

          {comment.userId === user?.id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-slate-800 border-slate-700 text-white"
              >
                <DropdownMenuItem
                  onClick={() => {
                    setEditingComment(comment.id);
                    setEditText(comment.text);
                  }}
                  className="cursor-pointer flex items-center gap-2 hover:bg-slate-700"
                >
                  <Edit className="h-4 w-4" />
                  <span>Bearbeiten</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setCommentToDelete(comment.id);
                    setShowDeleteDialog(true);
                  }}
                  className="cursor-pointer flex items-center gap-2 text-red-400 hover:bg-slate-700 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Löschen</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {editingComment === comment.id ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-400"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingComment(null);
                  setEditText("");
                }}
                className="bg-slate-700 text-white hover:bg-slate-600 border-slate-600"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={isSubmitting}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                Speichern
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-2 text-gray-300">
              {comment.text}
              {comment.edited && (
                <span className="text-xs text-gray-400 ml-2">(bearbeitet)</span>
              )}
            </p>

            <div className="mt-3 flex items-center gap-4">
              <button
                onClick={() => handleLike(comment.id)}
                className={`flex items-center gap-1 text-sm ${
                  user && comment.likes.includes(user.id)
                    ? "text-blue-400"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <ThumbsUp className="h-4 w-4" />
                <span>
                  {comment.likes.length > 0 ? comment.likes.length : ""}
                </span>
              </button>

              {isAuthenticated && (
                <button
                  onClick={() => {
                    setReplyToComment(comment.id);
                    setReplyText("");
                  }}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-300"
                >
                  <Reply className="h-4 w-4" />
                  <span>Antworten</span>
                </button>
              )}
            </div>
          </>
        )}

        {replyToComment === comment.id && (
          <div className="mt-3 space-y-2">
            <Textarea
              placeholder="Schreibe eine Antwort..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-400"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setReplyToComment(null)}
                className="bg-slate-700 text-white hover:bg-slate-600 border-slate-600"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleReplySubmit}
                disabled={isSubmitting}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                Antworten
              </Button>
            </div>
          </div>
        )}

        {/* Antworten anzeigen */}
        {getReplies(comment.id).map((reply) => renderComment(reply, true))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="text-purple-500" />
        <h3 className="text-lg font-semibold text-white">Diskussion</h3>
      </div>

      {isAuthenticated ? (
        <div className="space-y-3">
          <Textarea
            placeholder="Schreibe einen Kommentar..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-24 bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-400"
          />

          <div className="flex justify-end">
            <Button
              onClick={handleCommentSubmit}
              disabled={isSubmitting}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              {isSubmitting ? "Wird gesendet..." : "Kommentar senden"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          <p className="text-gray-300">
            Melde dich an, um an der Diskussion teilzunehmen.
          </p>
        </div>
      )}

      {comments.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-gray-400">Noch keine Kommentare. Sei der Erste!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rootComments.map((comment) => renderComment(comment))}
        </div>
      )}

      {/* Lösch-Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Kommentar löschen</DialogTitle>
            <DialogDescription className="text-gray-400">
              Bist du sicher, dass du diesen Kommentar löschen möchtest? Diese
              Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="bg-slate-700 text-white hover:bg-slate-600 border-slate-600"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommentSection;
