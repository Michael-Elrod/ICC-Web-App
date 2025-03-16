// app/api/invite/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";
import pool from "@/app/lib/db";
import { sendInvitationEmail } from "@/app/lib/email";

// Get current invite code
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow owners and admins to get the invite code
    if (!session || (session.user.type !== "Owner" && session.user.type !== "Admin")) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    const [codes] = await pool.query("SELECT code FROM invite_code LIMIT 1");
    const codeArray = codes as any[];
    
    if (!codeArray.length) {
      return NextResponse.json(
        { message: "No invite code available" },
        { status: 404 }
      );
    }

    return NextResponse.json({ code: codeArray[0].code });
  } catch (error) {
    console.error("Error fetching invite code:", error);
    return NextResponse.json(
      { message: "Failed to fetch invite code" },
      { status: 500 }
    );
  }
}

// Generate a new invite code OR send an invitation email
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow owners and admins
    if (!session || (session.user.type !== "Owner" && session.user.type !== "Admin")) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if this is a request to send an email
    const contentType = request.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      // This is a request to send an invitation email
      const { email } = await request.json();
      
      if (!email) {
        return NextResponse.json(
          { message: "Email is required" },
          { status: 400 }
        );
      }

      // Get the current invite code
      const [codes] = await pool.query("SELECT code FROM invite_code LIMIT 1");
      const codeArray = codes as any[];
      
      if (!codeArray.length) {
        return NextResponse.json(
          { message: "No invite code available" },
          { status: 400 }
        );
      }

      const inviteCode = codeArray[0].code;
      const senderName = `${session.user.firstName} ${session.user.lastName}`;

      // Send the invitation email
      await sendInvitationEmail(email, inviteCode, senderName);

      return NextResponse.json({
        message: "Invitation email sent successfully",
        success: true
      });
    } else {
      // This is a request to generate a new invite code
      const inviteCode = generateInviteCode();
      
      await pool.query(
        "UPDATE invite_code SET code = ?, updated_by = ?, updated_at = NOW()",
        [inviteCode, session.user.id]
      );
      
      return NextResponse.json({ code: inviteCode });
    }
  } catch (error) {
    console.error("Error processing invite operation:", error);
    return NextResponse.json(
      { message: "An error occurred" },
      { status: 500 }
    );
  }
}

// Helper function to generate a random invite code
function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing characters like I, O, 0, 1
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}