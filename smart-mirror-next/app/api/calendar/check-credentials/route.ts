import { NextRequest, NextResponse } from "next/server";
import { hasToken, getToken } from "../../../../lib/serverTokenService";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  
  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 400 });
  }
  
  try {
    // Check if token exists in Firestore
    const tokenExists = await hasToken(token);
    if (!tokenExists) {
      return NextResponse.json({ 
        linked: false, 
        message: "Token not found" 
      });
    }
    
    // Get token data from Firestore
    const tokenData = await getToken(token);
    
    // Check if credentials exist
    if (!tokenData || !tokenData.credentials) {
      return NextResponse.json({ 
        linked: false, 
        message: "Google account not linked yet"
      });
    }
    
    // Return status without exposing the actual credentials
    return NextResponse.json({ 
      linked: true,
      userName: tokenData.credentials.user?.name || "Google User",
      linkedAt: tokenData.linkedAt ? 
        (tokenData.linkedAt.toDate ? tokenData.linkedAt.toDate() : tokenData.linkedAt) : 
        null
    });
  } catch (error) {
    console.error("Error checking credentials:", error);
    return NextResponse.json({ 
      error: "Failed to check credentials",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 