// app/api/jobs/[id]/materials/[materialId]/route.ts
import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { MaterialUpdatePayload } from '@/app/types/database';
import { addBusinessDays } from '@/app/utils';
import { RowDataPacket } from 'mysql2';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string, materialId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json(
      { error: 'Unauthorized: Session not found or user not authenticated' },
      { status: 401 }
    );
  }
  const connection = await pool.getConnection();

  try {
    const body: MaterialUpdatePayload = await request.json();
    const materialId = params.materialId;
    const jobId = params.id;
    const userId = parseInt(session.user.id);

    await connection.beginTransaction();

    // Verify material belongs to this job
    const [materialCheck] = await connection.query<RowDataPacket[]>(
      `SELECT m.material_id 
       FROM material m
       JOIN phase p ON m.phase_id = p.phase_id
       WHERE m.material_id = ? AND p.job_id = ?`,
      [materialId, jobId]
    );

    if (!materialCheck.length) {
      return NextResponse.json(
        { error: 'Material not found or does not belong to this job' },
        { status: 404 }
      );
    }

    // Handle basic updates
    if (body.material_title) {
      await connection.query(
        'UPDATE material SET material_title = ? WHERE material_id = ?',
        [body.material_title, materialId]
      );
    }

    if (body.material_description) {
      await connection.query(
        'UPDATE material SET material_description = ? WHERE material_id = ?',
        [body.material_description, materialId]
      );
    }

    if (body.extension_days && !isNaN(body.extension_days)) {
      // Get current material date
      const [currentMaterial] = await connection.query<RowDataPacket[]>(
        'SELECT material_duedate FROM material WHERE material_id = ?',
        [materialId]
      );
    
      if (currentMaterial.length > 0) {
        // Calculate new date using addBusinessDays
        const currentDate = new Date(currentMaterial[0].material_duedate);
        const newDate = addBusinessDays(currentDate, body.extension_days);
        const formattedNewDate = newDate.toISOString().split('T')[0];
    
        // Update with exact new date
        await connection.query(
          'UPDATE material SET material_duedate = ? WHERE material_id = ?',
          [formattedNewDate, materialId]
        );
      }
    }

    // Handle user assignments
    if (body.new_users) {
      // Get current user assignments
      const [currentUsers] = await connection.query<RowDataPacket[]>(
        'SELECT user_id FROM user_material WHERE material_id = ?',
        [materialId]
      );
      
      const currentUserIds = new Set(currentUsers.map(u => u.user_id));
      const newUserIds = new Set(body.new_users);
      
      // Users to remove
      const usersToRemove = Array.from(currentUserIds).filter(id => !newUserIds.has(id));
      
      // Users to add
      const usersToAdd = Array.from(newUserIds).filter(id => !currentUserIds.has(id));

      // Verify all new users exist
      if (usersToAdd.length > 0) {
        const [users] = await connection.query<RowDataPacket[]>(
          'SELECT user_id FROM app_user WHERE user_id IN (?)',
          [usersToAdd]
        );

        if (users.length !== usersToAdd.length) {
          throw new Error('One or more invalid user IDs');
        }
      }

      // Remove users no longer assigned
      if (usersToRemove.length > 0) {
        await connection.query(
          'DELETE FROM user_material WHERE material_id = ? AND user_id IN (?)',
          [materialId, usersToRemove]
        );
      }

      // Add new users
      for (const newUser of usersToAdd) {
        await connection.query(
          `INSERT INTO user_material (user_id, material_id, assigned_by) 
           VALUES (?, ?, ?)`,
          [newUser, materialId, userId]
        );
      }
    }

    await connection.commit();
    return NextResponse.json({ success: true });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating material:', error);
    return NextResponse.json(
      { error: 'Failed to update material' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string, materialId: string } }
) {
  const connection = await pool.getConnection();

  try {
    const materialId = params.materialId;
    const jobId = params.id;

    await connection.beginTransaction();

    // Verify material belongs to this job
    const [materialCheck] = await connection.query<RowDataPacket[]>(
      `SELECT m.material_id 
       FROM material m
       JOIN phase p ON m.phase_id = p.phase_id
       WHERE m.material_id = ? AND p.job_id = ?`,
      [materialId, jobId]
    );

    if (!materialCheck.length) {
      return NextResponse.json(
        { error: "Material not found or does not belong to this job" },
        { status: 404 }
      );
    }

    // Delete related entries
    await connection.query('DELETE FROM user_material WHERE material_id = ?', [materialId]);
    await connection.query('DELETE FROM material WHERE material_id = ?', [materialId]);

    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting material:", error);
    return NextResponse.json(
      { error: "Failed to delete material" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
