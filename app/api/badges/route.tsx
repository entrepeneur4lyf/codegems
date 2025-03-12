import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const badgesFilePath = path.join(process.cwd(), "data", "badges.json");

// Hilfsfunktionen
const getBadges = () => {
  if (!fs.existsSync(badgesFilePath)) {
    // Erstelle einige Standard-Abzeichen, wenn die Datei nicht existiert
    const defaultBadges = [
      {
        id: "newcomer",
        name: "Newcomer",
        description: "Erstelle ein Konto",
        icon: "Gift",
        points: 10,
      },
      {
        id: "first_rating",
        name: "Kritiker",
        description: "Gib deine erste Bewertung ab",
        icon: "Star",
        points: 20,
      },
      {
        id: "first_comment",
        name: "Kommentator",
        description: "Schreibe deinen ersten Kommentar",
        icon: "MessageSquare",
        points: 20,
      },
      {
        id: "project_submitter",
        name: "Entdecker",
        description: "Reiche dein erstes Projekt ein",
        icon: "Search",
        points: 50,
      },
      {
        id: "rating_10",
        name: "Bewertungs-Meister",
        description: "Gib 10 Bewertungen ab",
        icon: "Award",
        points: 100,
      },
      {
        id: "comment_10",
        name: "Diskussions-Meister",
        description: "Schreibe 10 Kommentare",
        icon: "MessageCircle",
        points: 100,
      },
      {
        id: "level_5",
        name: "Fortgeschritten",
        description: "Erreiche Level 5",
        icon: "TrendingUp",
        points: 100,
      },
      {
        id: "level_10",
        name: "Experte",
        description: "Erreiche Level 10",
        icon: "Award",
        points: 150,
      },
    ];
    fs.writeFileSync(badgesFilePath, JSON.stringify(defaultBadges, null, 2));
    return defaultBadges;
  }
  const data = fs.readFileSync(badgesFilePath, "utf8");
  return JSON.parse(data);
};

const saveBadges = (badges) => {
  fs.writeFileSync(badgesFilePath, JSON.stringify(badges, null, 2));
};

// GET: Alle Abzeichen oder spezifisches Abzeichen abrufen
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const badgeId = searchParams.get("id");

  try {
    const badges = getBadges();

    if (badgeId) {
      const badge = badges.find((b) => b.id === badgeId);
      if (!badge) {
        return NextResponse.json({ error: "Badge not found" }, { status: 404 });
      }
      return NextResponse.json(badge);
    }

    return NextResponse.json(badges);
  } catch (error) {
    console.error("Error getting badges:", error);
    return NextResponse.json(
      { error: "Failed to get badges" },
      { status: 500 }
    );
  }
}
