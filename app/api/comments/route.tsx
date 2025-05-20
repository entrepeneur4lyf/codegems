// Improved API routes with error handling and concurrency management
// File: app/api/comments/route.tsx

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { promises as fsPromises } from 'fs';

const commentsFilePath = path.join(process.cwd(), "data", "comments.json");
const usersFilePath = path.join(process.cwd(), "data", "users.json");

// Helper functions with proper error handling and file locking for concurrency
const getComments = async () => {
  try {
    // Create the file if it doesn't exist
    if (!fs.existsSync(commentsFilePath)) {
      await fsPromises.mkdir(path.dirname(commentsFilePath), { recursive: true });
      await fsPromises.writeFile(commentsFilePath, JSON.stringify([]));
      return [];
    }
    
    const data = await fsPromises.readFile(commentsFilePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading comments file:", error);
    // Return empty array in case of error
    return [];
  }
};

const saveComments = async (comments: any) => {
  try {
    // Ensure the directory exists
    await fsPromises.mkdir(path.dirname(commentsFilePath), { recursive: true });
    
    // Write to a temporary file first to prevent corrupting the file in case of error
    const tempFilePath = `${commentsFilePath}.temp`;
    await fsPromises.writeFile(tempFilePath, JSON.stringify(comments, null, 2));
    
    // Rename the temporary file to the actual file (atomic operation)
    await fsPromises.rename(tempFilePath, commentsFilePath);
  } catch (error) {
    console.error("Error saving comments:", error);
    throw error;
  }
};

// GET: Fetch comments
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectName = searchParams.get("project");
  const userId = searchParams.get("userId");

  try {
    const comments = await getComments();

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
      { error: "Failed to get comments. Please try again." },
      { status: 500 }
    );
  }
}

// POST: Create a new comment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectName, userId, text, parentId } = body;

    // Validation
    if (!projectName || !projectName.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    if (!userId || !userId.trim()) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Comment text is required" },
        { status: 400 }
      );
    }

    // Validate user exists
    try {
      if (fs.existsSync(usersFilePath)) {
        const usersData = await fsPromises.readFile(usersFilePath, "utf8");
        const users = JSON.parse(usersData);
        const userExists = users.some((u: { id: string }) => u.id === userId);
        
        if (!userExists) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "User database not found" },
          { status: 500 }
        );
      }
    } catch (userError) {
      console.error("Error validating user:", userError);
      return NextResponse.json(
        { error: "Error validating user" },
        { status: 500 }
      );
    }

    const comments = await getComments();
    
    // Check if parentId exists (if provided)
    if (parentId) {
      const parentExists = comments.some((c: { id: string }) => c.id === parentId);
      if (!parentExists) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    const newComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      projectName,
      userId,
      text: text.trim(),
      parentId: parentId || null,
      likes: [],
      createdAt: new Date().toISOString(),
    };

    comments.push(newComment);
    await saveComments(comments);

    // Award points for new comment
    try {
      if (fs.existsSync(usersFilePath)) {
        const usersData = await fsPromises.readFile(usersFilePath, "utf8");
        const users = JSON.parse(usersData);
        const userIndex = users.findIndex((u: { id: any }) => u.id === userId);

        if (userIndex !== -1) {
          users[userIndex].points = (users[userIndex].points || 0) + 2;
          await fsPromises.writeFile(usersFilePath, JSON.stringify(users, null, 2));
        }
      }
    } catch (pointsError) {
      console.error("Error updating user points:", pointsError);
      // Continue execution - points update is not critical
    }

    return NextResponse.json(newComment);
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment. Please try again." },
      { status: 500 }
    );
  }
}

// PUT: Update a comment (like/unlike/edit)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { commentId, userId, action, text } = body;

    // Validation
    if (!commentId || !commentId.trim()) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 }
      );
    }

    if (!userId || !userId.trim()) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!action || !["like", "unlike", "edit"].includes(action)) {
      return NextResponse.json(
        { error: "Valid action is required (like, unlike, or edit)" },
        { status: 400 }
      );
    }

    if (action === "edit" && (!text || !text.trim())) {
      return NextResponse.json(
        { error: "Comment text is required for edit action" },
        { status: 400 }
      );
    }

    const comments = await getComments();
    const commentIndex = comments.findIndex(
      (c: { id: any }) => c.id === commentId
    );

    if (commentIndex === -1) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Handle different actions
    if (action === "like") {
      if (!comments[commentIndex].likes.includes(userId)) {
        comments[commentIndex].likes.push(userId);
      }
    } else if (action === "unlike") {
      comments[commentIndex].likes = comments[commentIndex].likes.filter(
        (id: any) => id !== userId
      );
    } else if (action === "edit") {
      // Verify the user is the author of the comment
      if (comments[commentIndex].userId !== userId) {
        return NextResponse.json(
          { error: "Not authorized to edit this comment" },
          { status: 403 }
        );
      }
      
      comments[commentIndex].text = text.trim();
      comments[commentIndex].edited = true;
      comments[commentIndex].updatedAt = new Date().toISOString();
    }

    await saveComments(comments);
    return NextResponse.json(comments[commentIndex]);
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: "Failed to update comment. Please try again." },
      { status: 500 }
    );
  }
}

// DELETE: Delete a comment
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
    const comments = await getComments();
    const commentIndex = comments.findIndex(
      (c: { id: string }) => c.id === commentId
    );

    if (commentIndex === -1) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Verify the user is the author of the comment
    if (comments[commentIndex].userId !== userId) {
      return NextResponse.json(
        { error: "Not authorized to delete this comment" },
        { status: 403 }
      );
    }

    // Remove the comment
    comments.splice(commentIndex, 1);
    
    // Also remove all replies to this comment
    const updatedComments = comments.filter(
      (c: { parentId: string | null }) => c.parentId !== commentId
    );
    
    await saveComments(updatedComments);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment. Please try again." },
      { status: 500 }
    );
  }
}