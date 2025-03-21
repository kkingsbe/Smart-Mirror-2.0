import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { hasToken, getToken } from "../../../../lib/serverTokenService";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  // Check if a mirror token is provided
  const mirrorToken = req.nextUrl.searchParams.get('token');
  let accessToken: string | undefined;
  
  // If a mirror token is provided, try to get its credentials
  if (mirrorToken) {
    try {
      // Check if token exists
      const tokenExists = await hasToken(mirrorToken);
      if (tokenExists) {
        // Get the token data
        const tokenData = await getToken(mirrorToken);
        if (tokenData?.credentials?.accessToken) {
          accessToken = tokenData.credentials.accessToken;
        }
      }
    } catch (error) {
      console.error("Error retrieving token credentials:", error);
    }
  }
  
  // If no token or no credentials for token, fall back to the session
  if (!accessToken) {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    accessToken = session.accessToken;
  }

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: accessToken as string,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    
    // Get events from the primary calendar for the next 7 days
    const now = new Date();
    const oneWeekLater = new Date(now);
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);
    
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: oneWeekLater.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 10,
    });

    const events = response.data.items || [];
    
    // Format the events for easier consumption by the frontend
    const formattedEvents = events.map((event) => ({
      id: event.id,
      summary: event.summary,
      start: event.start,
      end: event.end,
      location: event.location,
    }));

    return NextResponse.json({ events: formattedEvents });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch calendar events",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 