import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET() {
  return NextResponse.json({ 
    message: "API test endpoint is working!", 
    timestamp: new Date().toISOString() 
  });
}

export async function POST(req: NextRequest) {
  try {
    console.log("TEST API: Started token test");
    
    // Try to parse the body, but don't fail if it's not valid JSON
    let body = null;
    try {
      body = await req.json();
      console.log("TEST API: Body parsed:", body);
    } catch {
      console.log("TEST API: Could not parse request body as JSON");
    }
    
    // Check if token exists in query params
    const searchParams = req.nextUrl.searchParams;
    const testToken = searchParams.get('token') || 
                     (body && body.token) || 
                     '3345184f'; // Use the token from the error logs
    
    console.log(`TEST API: Testing token: ${testToken}`);
    
    // Check Firebase connection
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      console.log(`TEST API: Firebase project ID: ${projectId}`);
      
      // Check if we can query Firestore
      const tokensCollection = adminDb.collection('smart-mirror-tokens');
      console.log("TEST API: Got tokens collection reference");
      
      // Check if test token exists
      const docRef = tokensCollection.doc(testToken);
      const docSnapshot = await docRef.get();
      const exists = docSnapshot.exists;
      
      console.log(`TEST API: Token ${testToken} exists: ${exists}`);
      
      // If token doesn't exist, try to create it
      if (!exists) {
        try {
          await docRef.set({
            createdAt: FieldValue.serverTimestamp(),
            credentials: null,
            linkedAt: null
          });
          console.log(`TEST API: Created token ${testToken}`);
        } catch (error) {
          console.error(`TEST API: Failed to create token ${testToken}:`, error);
        }
        
        // Verify it was created
        const newSnapshot = await docRef.get();
        console.log(`TEST API: After creation, token exists: ${newSnapshot.exists}`);
      }
      
      return NextResponse.json({ 
        message: "API test POST endpoint is working!", 
        timestamp: new Date().toISOString(),
        receivedBody: body,
        tokenTested: testToken,
        tokenExists: exists,
        tokenCreated: !exists && (await docRef.get()).exists,
        firebaseConnected: true
      });
    } catch (dbError) {
      console.error("TEST API: Database error:", dbError);
      return NextResponse.json({ 
        message: "API test POST endpoint is working, but database test failed!", 
        timestamp: new Date().toISOString(),
        receivedBody: body,
        tokenTested: testToken,
        databaseError: dbError instanceof Error ? dbError.message : String(dbError),
        firebaseConnected: false
      });
    }
  } catch (error) {
    console.error("TEST API error:", error);
    return NextResponse.json({ 
      error: "Test API error",
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 