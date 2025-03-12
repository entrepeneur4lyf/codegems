import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Define interfaces for type safety
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  passwordHash: string;
  salt: string;
  points: number;
  level: number;
  badges: string[];
  createdAt: string;
  avatarUrl: string;
}

interface Rating {
  userId: string;
  // Add other rating-related fields
}

interface Comment {
  userId: string;
  // Add other comment-related fields
}

const usersFilePath = path.join(process.cwd(), "data", "users.json");
const badgesFilePath = path.join(process.cwd(), "data", "badges.json");

// Utility functions with explicit typing
const getUsers = (): User[] => {
  if (!fs.existsSync(usersFilePath)) {
    // Ensure directory exists
    const dir = path.dirname(usersFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Create an empty array if file doesn't exist
    fs.writeFileSync(usersFilePath, JSON.stringify([]));
    return [];
  }

  const data = fs.readFileSync(usersFilePath, "utf8").trim();

  // Handle empty file or invalid JSON
  if (!data) {
    return [];
  }

  try {
    return JSON.parse(data);
  } catch (error) {
    console.error("Error parsing users file:", error);
    // Backup the problematic file and start fresh
    const backupPath = `${usersFilePath}.backup.${Date.now()}`;
    fs.renameSync(usersFilePath, backupPath);
    fs.writeFileSync(usersFilePath, JSON.stringify([]));
    return [];
  }
};

const saveUsers = (users: User[]): void => {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

const getBadges = (): Badge[] => {
  if (!fs.existsSync(badgesFilePath)) {
    // Create default badges if file doesn't exist
    const defaultBadges: Badge[] = [
      {
        id: "newcomer",
        name: "Newcomer",
        description: "Create an account",
        icon: "Gift",
        points: 10,
      },
      {
        id: "first_rating",
        name: "Critic",
        description: "Give your first rating",
        icon: "Star",
        points: 20,
      },
      {
        id: "first_comment",
        name: "Commentator",
        description: "Write your first comment",
        icon: "MessageSquare",
        points: 20,
      },
      {
        id: "project_submitter",
        name: "Explorer",
        description: "Submit your first project",
        icon: "Search",
        points: 50,
      },
      {
        id: "rating_10",
        name: "Rating Master",
        description: "Give 10 ratings",
        icon: "Award",
        points: 100,
      },
    ];
    fs.writeFileSync(badgesFilePath, JSON.stringify(defaultBadges, null, 2));
    return defaultBadges;
  }
  const data = fs.readFileSync(badgesFilePath, "utf8");
  return JSON.parse(data);
};

// GET: Retrieve users
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("id");
  const username = searchParams.get("username");
  const leaderboard = searchParams.get("leaderboard");

  try {
    const users = getUsers();

    if (userId) {
      const user = users.find((u) => u.id === userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      // Security measure: do not return password hash
      const { passwordHash, salt, ...userData } = user;
      return NextResponse.json(userData);
    }

    if (username) {
      const user = users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase()
      );
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      const { passwordHash, salt, ...userData } = user;
      return NextResponse.json(userData);
    }

    if (leaderboard) {
      // Return leaderboard (Top 10 sorted by points)
      return NextResponse.json(
        users
          .map(
            ({
              id,
              username,
              displayName,
              points,
              badges,
              level,
              avatarUrl,
            }) => ({
              id,
              username,
              displayName,
              points,
              badges,
              level,
              avatarUrl,
            })
          )
          .sort((a, b) => (b.points || 0) - (a.points || 0))
          .slice(0, 10)
      );
    }

    // Return all users without sensitive data
    return NextResponse.json(
      users.map(
        ({
          id,
          username,
          displayName,
          points,
          badges,
          level,
          createdAt,
          avatarUrl,
        }) => ({
          id,
          username,
          displayName,
          points,
          badges,
          level,
          createdAt,
          avatarUrl,
        })
      )
    );
  } catch (error) {
    console.error("Error getting users:", error);
    return NextResponse.json({ error: "Failed to get users" }, { status: 500 });
  }
}

// POST: Create user (Registration)
export async function createUser(request: Request) {
  try {
    const body = await request.json();
    const { username, password, email, displayName } = body;

    if (!username || !password || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const users = getUsers();

    // Check if username or email already exist
    if (
      users.some((u) => u.username.toLowerCase() === username.toLowerCase())
    ) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
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

    const newUser: User = {
      id: `user_${Date.now()}`,
      username,
      email,
      displayName: displayName || username,
      passwordHash,
      salt,
      points: 10, // Starting points
      level: 1,
      badges: ["newcomer"], // Newcomer badge
      createdAt: new Date().toISOString(),
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`, // Generated avatar
    };

    users.push(newUser);
    saveUsers(users);

    // Return user without sensitive data
    const { passwordHash: _, salt: __, ...userData } = newUser;
    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

// POST: Login
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

    const users = getUsers();
    const user = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const hashedPassword = crypto
      .pbkdf2Sync(password, user.salt, 1000, 64, "sha512")
      .toString("hex");

    if (hashedPassword !== user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Successful login, return user without sensitive data
    const { passwordHash, salt, ...userData } = user;
    return NextResponse.json({
      ...userData,
      token: crypto.randomBytes(32).toString("hex"), // Simple session token
    });
  } catch (error) {
    console.error("Error during login:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

// PUT: Update user
export async function updateUser(request: Request) {
  try {
    const body = await request.json();
    const { id, displayName, avatarUrl, email, currentPassword, newPassword } =
      body;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const users = getUsers();
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[userIndex];

    // Update modifiable fields
    if (displayName) user.displayName = displayName;
    if (avatarUrl) user.avatarUrl = avatarUrl;

    // If email is being changed, check if it already exists
    if (email && email !== user.email) {
      if (
        users.some(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== id
        )
      ) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        );
      }
      user.email = email;
    }

    // If password is being changed
    if (currentPassword && newPassword) {
      const hashedCurrentPassword = crypto
        .pbkdf2Sync(currentPassword, user.salt, 1000, 64, "sha512")
        .toString("hex");

      if (hashedCurrentPassword !== user.passwordHash) {
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

      user.passwordHash = newPasswordHash;
      user.salt = newSalt;
    }

    saveUsers(users);

    // Updated user without sensitive data
    const { passwordHash, salt, ...userData } = user;
    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// POST: Check badges
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

    const users = getUsers();
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[userIndex];
    const badges = getBadges();
    const earnedBadges: Badge[] = [];

    // Check badge conditions
    // This function can be expanded as needed

    // Example: Check ratings
    const ratingsFilePath = path.join(process.cwd(), "data", "ratings.json");
    if (fs.existsSync(ratingsFilePath)) {
      const ratingsData = fs.readFileSync(ratingsFilePath, "utf8");
      const ratings: Rating[] = JSON.parse(ratingsData);
      const userRatings = ratings.filter((r) => r.userId === userId);

      // First rating badge
      const firstRatingBadge = badges.find((b) => b.id === "first_rating");
      if (
        userRatings.length > 0 &&
        !user.badges.includes("first_rating") &&
        firstRatingBadge
      ) {
        earnedBadges.push(firstRatingBadge);
        user.badges.push("first_rating");
        user.points += firstRatingBadge.points;
      }

      // 10 ratings badge
      const rating10Badge = badges.find((b) => b.id === "rating_10");
      if (
        userRatings.length >= 10 &&
        !user.badges.includes("rating_10") &&
        rating10Badge
      ) {
        earnedBadges.push(rating10Badge);
        user.badges.push("rating_10");
        user.points += rating10Badge.points;
      }
    }

    // Example: Check comments
    const commentsFilePath = path.join(process.cwd(), "data", "comments.json");
    if (fs.existsSync(commentsFilePath)) {
      const commentsData = fs.readFileSync(commentsFilePath, "utf8");
      const comments: Comment[] = JSON.parse(commentsData);
      const userComments = comments.filter((c) => c.userId === userId);

      const firstCommentBadge = badges.find((b) => b.id === "first_comment");
      if (
        userComments.length > 0 &&
        !user.badges.includes("first_comment") &&
        firstCommentBadge
      ) {
        earnedBadges.push(firstCommentBadge);
        user.badges.push("first_comment");
        user.points += firstCommentBadge.points;
      }
    }

    // Calculate level based on points
    const newLevel = Math.floor(user.points / 100) + 1;
    const levelUp = newLevel > user.level;
    user.level = newLevel;

    saveUsers(users);

    return NextResponse.json({
      earnedBadges,
      levelUp,
      currentLevel: user.level,
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
