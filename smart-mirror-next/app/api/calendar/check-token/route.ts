import { NextRequest, NextResponse } from "next/server";
import { hasToken } from "../../../../lib/serverTokenService";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const token = searchParams.get('token');
  
  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 400 });
  }
  
  console.log(`Checking token existence: ${token}`);
  const exists = await hasToken(token);
  console.log(`Token ${token} exists: ${exists}`);
  
  return NextResponse.json({ 
    token,
    exists 
  });
} 