// route.ts

import { NextResponse } from "next/server";
import { sendInvitationEmail } from "@/app/lib/email";
import { withRole } from "@/app/lib/api-utils";

export const GET = withRole(
  ["Owner", "Admin"],
  async (connection, session) => {
    const [codes] = await connection.query(
      "SELECT code FROM invite_code LIMIT 1",
    );
    const codeArray = codes as any[];

    if (!codeArray.length) {
      return NextResponse.json(
        { message: "No invite code available" },
        { status: 404 },
      );
    }

    return NextResponse.json({ code: codeArray[0].code });
  },
  "Failed to fetch invite code",
);

export const POST = withRole(
  ["Owner", "Admin"],
  async (connection, session, request) => {
    const contentType = request.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const { email } = await request.json();

      if (!email) {
        return NextResponse.json(
          { message: "Email is required" },
          { status: 400 },
        );
      }

      const [codes] = await connection.query(
        "SELECT code FROM invite_code LIMIT 1",
      );
      const codeArray = codes as any[];

      if (!codeArray.length) {
        return NextResponse.json(
          { message: "No invite code available" },
          { status: 400 },
        );
      }

      const inviteCode = codeArray[0].code;
      const senderName = `${session.user.firstName} ${session.user.lastName}`;

      await sendInvitationEmail(email, inviteCode, senderName);

      return NextResponse.json({
        message: "Invitation email sent successfully",
        success: true,
      });
    } else {
      const inviteCode = generateInviteCode();

      await connection.query(
        "UPDATE invite_code SET code = ?, updated_by = ?, updated_at = NOW()",
        [inviteCode, session.user.id],
      );

      return NextResponse.json({ code: inviteCode });
    }
  },
  "An error occurred",
);

function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
