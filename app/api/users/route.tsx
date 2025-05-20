import { NextResponse } from "next/server";
import crypto from "crypto";
import supabase from "@/lib/supabase";

interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  password_hash: string;
  salt: string;
  points: number;
  level: number;
  badges: string[];
  created_at: string;
  avatar_url: string;
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

const validatePassword = (password: string): boolean => {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
};

// GET: Retrieve users
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("id");
  const username = searchParams.get("username");
  const leaderboard = searchParams.get("leaderboard");

  try {
    if (userId) {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Don't return sensitive data
      const { password_hash, salt, ...userData } = user;
      return NextResponse.json(userData);
    }

    if (username) {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .ilike('username', username)
        .single();

      if (error || !user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const { password_hash, salt, ...userData } = user;
      return NextResponse.json(userData);
    }

    if (leaderboard) {
      // Return leaderboard (Top 10 sorted by points)
      const { data: users, error } = await supabase
        .from('users')
        .select('id, username, display_name, points, badges, level, avatar_url')
        .order('points', { ascending: false })
        .limit(10);

      if (error) {
        return NextResponse.json({ error: "Failed to get leaderboard" }, { status: 500 });
      }

      return NextResponse.json(users);
    }

    // Return all users without sensitive data
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, display_name, points, badges, level, created_at, avatar_url');

    if (error) {
      return NextResponse.json({ error: "Failed to get users" }, { status: 500 });
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error getting users:", error);
    return NextResponse.json({ error: "Failed to get users" }, { status: 500 });
  }
}

// Create user (Registration)
export async function createUser(request: Request) {
  try {
    const body = await request.json();
    const { username, password, email, displayName } = body;

    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: "Password does not meet complexity requirements" },
        { status: 400 }
      );
    }

    if (!username || !password || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUsername) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Create password hash
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, "sha512")
      .toString("hex");

    const newUser = {
      id: `user_${Date.now()}`,
      username,
      email,
      display_name: displayName || username,
      password_hash: passwordHash,
      salt,
      points: 10, // Starting points
      level: 1,
      badges: ["newcomer"], // Newcomer badge
      created_at: new Date().toISOString(),
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`, // Generated avatar
    };

    const { error } = await supabase.from('users').insert(newUser);

    if (error) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Return user without sensitive data
    const { password_hash: _, salt: __, ...userData } = newUser;
    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

// Login
export async function loginUser(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const hashedPassword = crypto
      .pbkdf2Sync(password, user.salt, 1000, 64, "sha512")
      .toString("hex");

    if (hashedPassword !== user.password_hash) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Successful login, return user without sensitive data
    const { password_hash, salt, ...userData } = user;
    return NextResponse.json({
      ...userData,
      token: crypto.randomBytes(32).toString("hex"), // Simple session token
    });
  } catch (error) {
    console.error("Error during login:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

// Update user
export async function updateUser(request: Request) {
  try {
    const body = await request.json();
    const { id, displayName, avatarUrl, email, currentPassword, newPassword } = body;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const { data: user, error: getUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (getUserError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prepare update object
    const updates: Record<string, any> = {};

    // Update modifiable fields
    if (displayName) updates.display_name = displayName;
    if (avatarUrl) updates.avatar_url = avatarUrl;

    // If email is being changed, check if it already exists
    if (email && email !== user.email) {
      const { data: existingEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .single();

      if (existingEmail) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        );
      }
      updates.email = email;
    }

    // If password is being changed
    if (currentPassword && newPassword) {
      const hashedCurrentPassword = crypto
        .pbkdf2Sync(currentPassword, user.salt, 1000, 64, "sha512")
        .toString("hex");

      if (hashedCurrentPassword !== user.password_hash) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      // Hash new password
      const newSalt = crypto.randomBytes(16).toString("hex");
      const newPasswordHash = crypto
        .pbkdf2Sync(newPassword, newSalt, 1000, 64, "sha512")
        .toString("hex");

      updates.password_hash = newPasswordHash;
      updates.salt = newSalt;
    }

    // Update user
    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    // Get updated user
    const { data: updatedUser, error: getUpdatedError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (getUpdatedError || !updatedUser) {
      return NextResponse.json(
        { error: "Failed to retrieve updated user" },
        { status: 500 }
      );
    }

    // Return updated user without sensitive data
    const { password_hash, salt, ...userData } = updatedUser;
    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// Check badges
export async function checkBadges(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: badges, error: badgesError } = await supabase
      .from('badges')
      .select('*');

    if (badgesError) {
      return NextResponse.json(
        { error: "Failed to fetch badges" },
        { status: 500 }
      );
    }

    const earnedBadges: Badge[] = [];
    let userBadges = [...user.badges];

    // Check ratings count
    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select('id')
      .eq('user_id', userId);

    if (!ratingsError) {
      const ratingsCount = ratings?.length || 0;

      // First rating badge
      const firstRatingBadge = badges.find(b => b.id === "first_rating");
      if (ratingsCount > 0 && !userBadges.includes("first_rating") && firstRatingBadge) {
        earnedBadges.push(firstRatingBadge);
        userBadges.push("first_rating");
        user.points += firstRatingBadge.points;
      }

      // 10 ratings badge
      const rating10Badge = badges.find(b => b.id === "rating_10");
      if (ratingsCount >= 10 && !userBadges.includes("rating_10") && rating10Badge) {
        earnedBadges.push(rating10Badge);
        userBadges.push("rating_10");
        user.points += rating10Badge.points;
      }
    }

    // Check comments count
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('id')
      .eq('user_id', userId);

    if (!commentsError) {
      const commentsCount = comments?.length || 0;

      // First comment badge
      const firstCommentBadge = badges.find(b => b.id === "first_comment");
      if (commentsCount > 0 && !userBadges.includes("first_comment") && firstCommentBadge) {
        earnedBadges.push(firstCommentBadge);
        userBadges.push("first_comment");
        user.points += firstCommentBadge.points;
      }

      // 10 comments badge
      const comment10Badge = badges.find(b => b.id === "comment_10");
      if (commentsCount >= 10 && !userBadges.includes("comment_10") && comment10Badge) {
        earnedBadges.push(comment10Badge);
        userBadges.push("comment_10");
        user.points += comment10Badge.points;
      }
    }

    // Calculate level based on points
    const newLevel = Math.floor(user.points / 100) + 1;
    const levelUp = newLevel > user.level;
    
    // Check for level badges
    if (newLevel >= 5 && !userBadges.includes("level_5")) {
      const level5Badge = badges.find(b => b.id === "level_5");
      if (level5Badge) {
        earnedBadges.push(level5Badge);
        userBadges.push("level_5");
        user.points += level5Badge.points;
      }
    }

    if (newLevel >= 10 && !userBadges.includes("level_10")) {
      const level10Badge = badges.find(b => b.id === "level_10");
      if (level10Badge) {
        earnedBadges.push(level10Badge);
        userBadges.push("level_10");
        user.points += level10Badge.points;
      }
    }

    // Update user if badges or points changed
    if (earnedBadges.length > 0 || levelUp) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          badges: userBadges,
          points: user.points,
          level: newLevel,
        })
        .eq('id', userId);

      if (updateError) {
        console.error("Error updating user badges:", updateError);
      }
    }

    return NextResponse.json({
      earnedBadges,
      levelUp,
      currentLevel: newLevel,
      currentPoints: user.points,
    });
  } catch (error) {
    console.error("Error checking badges:", error);
    return NextResponse.json(
      { error: "Failed to check badges" },
      { status: 500 }
    );
  }
}

// Single POST handler
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  switch (action) {
    case "login":
      return loginUser(request);
    case "check_badges":
      return checkBadges(request);
    default:
      return createUser(request);
  }
}

// PUT handler for updates
export async function PUT(request: Request) {
  return updateUser(request);
}