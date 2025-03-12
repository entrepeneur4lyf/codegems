import { NextResponse } from "next/server";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, githubLink, description, reason } = body;

    if (!DISCORD_WEBHOOK_URL) {
      console.error("Discord webhook URL not configured");
      return NextResponse.json(
        { error: "Webhook URL not configured" },
        { status: 500 }
      );
    }

    if (!title || title.length > 100) {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }

    if (!githubLink || !githubLink.startsWith("https://github.com/")) {
      return NextResponse.json(
        { error: "Invalid GitHub link" },
        { status: 400 }
      );
    }

    console.log("Sending to Discord:", {
      title,
      githubLink,
      description,
      reason,
    });

    const discordMessage = {
      embeds: [
        {
          title: "🆕 New Project Request",
          color: 0x8d15cd,
          fields: [
            {
              name: "📝 Project Title",
              value: title || "Not provided",
            },
            {
              name: "🔗 GitHub Link",
              value: githubLink || "Not provided",
            },
            {
              name: "📋 Description",
              value: description || "Not provided",
            },
            {
              name: "💡 Why is it good?",
              value: reason || "Not provided",
            },
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: "Codegems",
            icon_url: "https://www.codegems.xyz/icon.png",
          },
        },
      ],
    };

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(discordMessage),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Discord API error:", errorText);
      throw new Error(`Discord API error: ${errorText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing project request:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 }
    );
  }
}
