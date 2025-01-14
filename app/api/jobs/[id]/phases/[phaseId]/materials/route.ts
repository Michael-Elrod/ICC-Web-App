// app/api/jobs/[id]/phases/[phaseId]/materials/route.ts
import { NextResponse } from "next/server";
import pool from '@/app/lib/db';
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string; phaseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const phaseId = parseInt(params.phaseId);
    const data = await request.json();

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Create material
      const [materialResult] = await connection.execute<ResultSetHeader>(
        "INSERT INTO material (phase_id, material_title, material_duedate, material_description, material_status, created_by) VALUES (?, ?, ?, ?, ?, ?)",
        [
          phaseId,
          data.title,
          data.dueDate,
          data.details || null,
          "Incomplete",
          userId,
        ]
      );

      const materialId = materialResult.insertId;

      // Handle user assignments
      if (data.selectedContacts?.length) {
        await Promise.all(
          data.selectedContacts.map((contactId: number) =>
            connection.execute(
              "INSERT INTO user_material (user_id, material_id, assigned_by) VALUES (?, ?, ?)",
              [contactId, materialId, userId]
            )
          )
        );
      }

      // Get the created material with its users
      const [materialData] = await connection.execute<RowDataPacket[]>(
        `SELECT m.*, 
          GROUP_CONCAT(JSON_OBJECT(
            'user_id', u.user_id,
            'first_name', u.user_first_name,
            'last_name', u.user_last_name,
            'user_email', u.user_email,
            'user_phone', u.user_phone
          )) as users
        FROM material m
        LEFT JOIN user_material um ON m.material_id = um.material_id
        LEFT JOIN app_user u ON um.user_id = u.user_id
        WHERE m.material_id = ?
        GROUP BY m.material_id`,
        [materialId]
      );

      await connection.commit();

      const material = materialData[0];

      return NextResponse.json({
        material_id: material.material_id,
        material_title: material.material_title,
        material_duedate: material.material_duedate.toISOString().split('T')[0],
        material_status: material.material_status,
        material_description: material.material_description,
        users: []
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Failed to create material:', error);
    return NextResponse.json(
      { error: 'Failed to create material' },
      { status: 500 }
    );
  }
}