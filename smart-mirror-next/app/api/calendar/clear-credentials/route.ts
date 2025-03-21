import { NextRequest, NextResponse } from "next/server";
import { hasToken, updateToken } from "../../../../lib/serverTokenService";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }
    
    // Check if token exists in Firestore
    const tokenExists = await hasToken(token);
    if (!tokenExists) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }
    
    // Clear credentials but keep the token entry in Firestore
    await updateToken(token, {
      credentials: null,
      linkedAt: null
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "Google Calendar disconnected from Smart Mirror"
    });
  } catch (error) {
    console.error("Error clearing credentials:", error);
    return NextResponse.json({ 
      error: "Failed to process request",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 