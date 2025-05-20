import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

// GET: Fetch comments
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectName = searchParams.get("project");
  const userId = searchParams.get("userId");

  try {
    let query = supabase.from('comments').select('*');

    if (projectName) {
      query = query.eq('project_name', projectName);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: comments, error } = await query;

    if (error) {
      console.error("Error getting comments:", error);
      return NextResponse.json(
        { error: "Failed to get comments. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(comments || []);
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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if parentId exists (if provided)
    if (parentId) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('id')
        .eq('id', parentId)
        .single();

      if (parentError || !parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    const newComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      project_name: projectName,
      user_id: userId,
      text: text.trim(),
      parent_id: parentId || null,
      likes: [],
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from('comments')
      .insert(newComment);

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }

    // Award points for new comment
    const { data: userData, error: getUserError } = await supabase
      .from('users')
      .select('points, badges')
      .eq('id', userId)
      .single();

    if (!getUserError && userData) {
      await supabase
        .from('users')
        .update({
          points: (userData.points || 0) + 2
        })
        .eq('id', userId);
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

    // Get current comment
    const { data: comment, error: getCommentError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single();

    if (getCommentError || !comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Handle different actions
    let updates = {};
    if (action === "like") {
      const likes = comment.likes || [];
      if (!likes.includes(userId)) {
        likes.push(userId);
      }
      updates = { likes };
    } else if (action === "unlike") {
      const likes = (comment.likes || []).filter((id: string) => id !== userId);
      updates = { likes };
    } else if (action === "edit") {
      // Verify the user is the author of the comment
      if (comment.user_id !== userId) {
        return NextResponse.json(
          { error: "Not authorized to edit this comment" },
          { status: 403 }
        );
      }
      
      updates = {
        text: text.trim(),
        edited: true,
        updated_at: new Date().toISOString()
      };
    }

    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update(updates)
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update comment" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedComment);
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
    // Check if comment exists and if user is the author
    const { data: comment, error: getCommentError } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (getCommentError || !comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    if (comment.user_id !== userId) {
      return NextResponse.json(
        { error: "Not authorized to delete this comment" },
        { status: 403 }
      );
    }

    // Delete the comment
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete comment" },
        { status: 500 }
      );
    }

    // Delete all replies to this comment
    await supabase
      .from('comments')
      .delete()
      .eq('parent_id', commentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment. Please try again." },
      { status: 500 }
    );
  }
}