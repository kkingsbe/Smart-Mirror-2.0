import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createToken, cleanupOldTokens } from "../../../../lib/serverTokenService";

// Generate a unique, readable token for the mirror
export async function GET(req: NextRequest) {
  try {
    // Generate a random token
    const token = crypto.randomBytes(4).toString('hex');
    
    // Store the token in Firestore using server-side admin SDK
    await createToken(token);
    
    // Clean up old tokens in background
    cleanupOldTokens().catch(error => {
      console.error("Error cleaning up old tokens:", error);
    });
    
    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating token:", error);
    return NextResponse.json({ 
      error: "Failed to generate token",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 