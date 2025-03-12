import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const commentsFilePath = path.join(process.cwd(), "data", "comments.json");

// Hilfsfunktionen
const getComments = () => {
  if (!fs.existsSync(commentsFilePath)) {
    fs.writeFileSync(commentsFilePath, JSON.stringify([]));
    return [];
  }
  const data = fs.readFileSync(commentsFilePath, "utf8");
  return JSON.parse(data);
};

const saveComments = (comments: any) => {
  fs.writeFileSync(commentsFilePath, JSON.stringify(comments, null, 2));
};

// GET: Kommentare abrufen
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectName = searchParams.get("project");
  const userId = searchParams.get("userId");

  try {
    const comments = getComments();

    if (projectName) {
      const projectComments = comments.filter(
        (c: { projectName: string }) => c.projectName === projectName
      );
      return NextResponse.json(projectComments);
    }

    if (userId) {
      const userComments = comments.filter(
        (c: { userId: string }) => c.userId === userId
      );
      return NextResponse.json(userComments);
    }

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error getting comments:", error);
    return NextResponse.json(
      { error: "Failed to get comments" },
      { status: 500 }
    );
  }
}

// POST: Kommentar erstellen
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectName, userId, text, parentId } = body;

    if (!projectName || !userId || !text) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const comments = getComments();
    const newComment = {
      id: `comment_${Date.now()}`,
      projectName,
      userId,
      text,
      parentId: parentId || null,
      likes: [],
      createdAt: new Date().toISOString(),
    };

    comments.push(newComment);
    saveComments(comments);

    // Punkte für neuen Kommentar vergeben
    try {
      const usersFilePath = path.join(process.cwd(), "data", "users.json");
      if (fs.existsSync(usersFilePath)) {
        const usersData = fs.readFileSync(usersFilePath, "utf8");
        const users = JSON.parse(usersData);
        const userIndex = users.findIndex((u: { id: any }) => u.id === userId);

        if (userIndex !== -1) {
          users[userIndex].points = (users[userIndex].points || 0) + 2;
          fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
        }
      }
    } catch (pointsError) {
      console.error("Error updating user points:", pointsError);
    }

    return NextResponse.json(newComment);
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

// PUT: Kommentar aktualisieren (z.B. Likes)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { commentId, userId, action } = body;

    if (!commentId || !userId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const comments = getComments();
    const commentIndex = comments.findIndex(
      (c: { id: any }) => c.id === commentId
    );

    if (commentIndex === -1) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (action === "like") {
      if (!comments[commentIndex].likes.includes(userId)) {
        comments[commentIndex].likes.push(userId);
      }
    } else if (action === "unlike") {
      comments[commentIndex].likes = comments[commentIndex].likes.filter(
        (id: any) => id !== userId
      );
    } else if (action === "edit" && body.text) {
      if (comments[commentIndex].userId !== userId) {
        return NextResponse.json(
          { error: "Not authorized to edit this comment" },
          { status: 403 }
        );
      }
      comments[commentIndex].text = body.text;
      comments[commentIndex].edited = true;
    }

    saveComments(comments);
    return NextResponse.json(comments[commentIndex]);
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}

// DELETE: Kommentar löschen
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const commentId = searchParams.get("id");
  const userId = searchParams.get("userId");

  if (!commentId || !userId) {
    return NextResponse.json(
      { error: "Comment ID and User ID are required" },
      { status: 400 }
    );
  }

  try {
    const comments = getComments();
    const commentIndex = comments.findIndex(
      (c: { id: string }) => c.id === commentId
    );

    if (commentIndex === -1) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comments[commentIndex].userId !== userId) {
      return NextResponse.json(
        { error: "Not authorized to delete this comment" },
        { status: 403 }
      );
    }

    comments.splice(commentIndex, 1);
    saveComments(comments);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
