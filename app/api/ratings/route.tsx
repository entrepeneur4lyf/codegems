import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ratingsFilePath = path.join(process.cwd(), "data", "ratings.json");

// Hilfsfunktionen
const getRatings = () => {
  if (!fs.existsSync(ratingsFilePath)) {
    fs.writeFileSync(ratingsFilePath, JSON.stringify([]));
    return [];
  }
  const data = fs.readFileSync(ratingsFilePath, "utf8");
  return JSON.parse(data);
};

const saveRatings = (ratings: any) => {
  fs.writeFileSync(ratingsFilePath, JSON.stringify(ratings, null, 2));
};

// GET: Alle Bewertungen abrufen oder nach Projekt filtern
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectName = searchParams.get("project");
  const userId = searchParams.get("userId");

  try {
    const ratings = getRatings();

    if (projectName) {
      const filteredRatings = ratings.filter(
        (r: { projectName: string }) => r.projectName === projectName
      );
      return NextResponse.json(filteredRatings);
    }

    if (userId) {
      const userRatings = ratings.filter(
        (r: { userId: string }) => r.userId === userId
      );
      return NextResponse.json(userRatings);
    }

    return NextResponse.json(ratings);
  } catch (error) {
    console.error("Error getting ratings:", error);
    return NextResponse.json(
      { error: "Failed to get ratings" },
      { status: 500 }
    );
  }
}

// POST: Neue Bewertung erstellen oder bestehende aktualisieren
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

    const ratings = getRatings();
    const existingRatingIndex = ratings.findIndex(
      (r: { projectName: any; userId: any }) =>
        r.projectName === projectName && r.userId === userId
    );

    if (existingRatingIndex !== -1) {
      // Aktualisieren einer bestehenden Bewertung
      ratings[existingRatingIndex] = {
        ...ratings[existingRatingIndex],
        rating,
        review: review || ratings[existingRatingIndex].review,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Neue Bewertung erstellen
      ratings.push({
        id: `rating_${Date.now()}`,
        projectName,
        userId,
        rating,
        review: review || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Punkte für neue Bewertung vergeben
      try {
        const usersFilePath = path.join(process.cwd(), "data", "users.json");
        if (fs.existsSync(usersFilePath)) {
          const usersData = fs.readFileSync(usersFilePath, "utf8");
          const users = JSON.parse(usersData);
          const userIndex = users.findIndex(
            (u: { id: any }) => u.id === userId
          );

          if (userIndex !== -1) {
            users[userIndex].points = (users[userIndex].points || 0) + 5;
            fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
          }
        }
      } catch (pointsError) {
        console.error("Error updating user points:", pointsError);
      }
    }

    saveRatings(ratings);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving rating:", error);
    return NextResponse.json(
      { error: "Failed to save rating" },
      { status: 500 }
    );
  }
}

// DELETE: Bewertung löschen
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
    const ratings = getRatings();
    const filteredRatings = ratings.filter(
      (r: { id: string }) => r.id !== ratingId
    );

    if (filteredRatings.length === ratings.length) {
      return NextResponse.json({ error: "Rating not found" }, { status: 404 });
    }

    saveRatings(filteredRatings);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting rating:", error);
    return NextResponse.json(
      { error: "Failed to delete rating" },
      { status: 500 }
    );
  }
}
