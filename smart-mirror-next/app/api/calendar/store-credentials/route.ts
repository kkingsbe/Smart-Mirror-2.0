import { NextRequest, NextResponse } from "next/server";
import { hasToken, updateToken } from "../../../../lib/serverTokenService";
import { auth } from "@/auth";
import { FieldValue } from "firebase-admin/firestore";

// Handler for POST requests to this route
export async function POST(req: NextRequest) {
  try {
    console.log("API: Store credentials request received");
    
    // Parse request body first (do this before auth to ensure we can read the request)
    let body;
    try {
      body = await req.json();
      console.log("API: Request body parsed successfully");
    } catch (error) {
      console.error("API: Failed to parse request body:", error);
      return NextResponse.json({ 
        error: "Invalid JSON in request body" 
      }, { status: 400 });
    }
    
    const { token } = body || {};
    console.log("API: Token received:", token || "missing");
    
    if (!token) {
      console.log("API: No token provided");
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }
    
    // Check if token exists in our database
    console.log("API: Checking if token exists");
    const tokenExists = await hasToken(token);
    
    if (!tokenExists) {
      console.log("API: Invalid token");
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }
    
    // Check authentication (after token validation to provide better errors)
    try {
      const session = await auth();
      
      if (!session || !session.accessToken) {
        console.log("API: Authentication failed - no session/token");
        return NextResponse.json({ 
          error: "Not authenticated",
          hint: "You need to sign in with Google first" 
        }, { status: 401 });
      }
      
      // Store the credentials with the token (server-side only)
      console.log("API: Storing credentials");
      await updateToken(token, {
        credentials: {
          accessToken: session.accessToken,
          user: session.user
        },
        linkedAt: FieldValue.serverTimestamp()
      });
      
      console.log("API: Success - credentials stored");
      return NextResponse.json({ 
        success: true, 
        message: "Successfully linked Google Calendar to Smart Mirror"
      });
    } catch (authError) {
      console.error("API: Auth error:", authError);
      return NextResponse.json({ 
        error: "Authentication error",
        details: authError instanceof Error ? authError.message : String(authError) 
      }, { status: 401 });
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ 
      error: "Server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 