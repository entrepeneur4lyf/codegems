import { NextResponse } from "next/server";
import supabase from "@/lib/supabase";

// GET: Get all ratings or filter by project or user
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectName = searchParams.get("project");
  const userId = searchParams.get("userId");

  try {
    let query = supabase.from('ratings').select('*');

    if (projectName) {
      query = query.eq('project_name', projectName);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: ratings, error } = await query;

    if (error) {
      console.error("Error getting ratings:", error);
      return NextResponse.json(
        { error: "Failed to get ratings" },
        { status: 500 }
      );
    }

    return NextResponse.json(ratings || []);
  } catch (error) {
    console.error("Error getting ratings:", error);
    return NextResponse.json(
      { error: "Failed to get ratings" },
      { status: 500 }
    );
  }
}

// POST: Create a new rating or update an existing one
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectName, userId, rating, review } = body;

    if (!projectName || !userId || !rating) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if rating already exists
    const { data: existingRating, error: findError } = await supabase
      .from('ratings')
      .select('*')
      .eq('project_name', projectName)
      .eq('user_id', userId)
      .single();

    const now = new Date().toISOString();

    if (existingRating) {
      // Update existing rating
      const { error: updateError } = await supabase
        .from('ratings')
        .update({
          rating,
          review: review || existingRating.review,
          updated_at: now
        })
        .eq('id', existingRating.id);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to update rating" },
          { status: 500 }
        );
      }
    } else {
      // Create new rating
      const newRating = {
        id: `rating_${Date.now()}`,
        project_name: projectName,
        user_id: userId,
        rating,
        review: review || "",
        created_at: now,
        updated_at: now
      };

      const { error: insertError } = await supabase
        .from('ratings')
        .insert(newRating);

      if (insertError) {
        return NextResponse.json(
          { error: "Failed to save rating" },
          { status: 500 }
        );
      }

      // Award points for new rating
      const { data: userData, error: getUserError } = await supabase
        .from('users')
        .select('points')
        .eq('id', userId)
        .single();

      if (!getUserError && userData) {
        await supabase
          .from('users')
          .update({
            points: (userData.points || 0) + 5
          })
          .eq('id', userId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving rating:", error);
    return NextResponse.json(
      { error: "Failed to save rating" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a rating
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const ratingId = searchParams.get("id");

  if (!ratingId) {
    return NextResponse.json(
      { error: "Rating ID is required" },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase
      .from('ratings')
      .delete()
      .eq('id', ratingId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete rating" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting rating:", error);
    return NextResponse.json(
      { error: "Failed to delete rating" },
      { status: 500 }
    );
  }
}