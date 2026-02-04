// app/api/jobs/[id]/materials/[materialId]/route.ts
import { NextResponse } from 'next/server';
import { MaterialUpdatePayload } from '@/app/types/database';
import { addBusinessDays } from '@/app/utils';
import { RowDataPacket } from 'mysql2';
import { withAuth, withDb, withTransaction } from "@/app/lib/api-utils";

export const PATCH = withAuth(async (connection, session, request, params) => {
  const body: MaterialUpdatePayload = await request.json();
  const materialId = params.materialId;
  const jobId = params.id;
  const userId = parseInt(session.user.id);

  return await withTransaction(connection, async () => {
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
      const [currentMaterial] = await connection.query<RowDataPacket[]>(
        'SELECT material_duedate FROM material WHERE material_id = ?',
        [materialId]
      );

      if (currentMaterial.length > 0) {
        const currentDate = new Date(currentMaterial[0].material_duedate);
        const newDate = addBusinessDays(currentDate, body.extension_days);
        const formattedNewDate = newDate.toISOString().split('T')[0];

        await connection.query(
          'UPDATE material SET material_duedate = ? WHERE material_id = ?',
          [formattedNewDate, materialId]
        );
      }
    }

    if (body.new_users) {
      const [currentUsers] = await connection.query<RowDataPacket[]>(
        'SELECT user_id FROM user_material WHERE material_id = ?',
        [materialId]
      );

      const currentUserIds = new Set(currentUsers.map(u => u.user_id));
      const newUserIds = new Set(body.new_users);

      const usersToRemove = Array.from(currentUserIds).filter(id => !newUserIds.has(id));
      const usersToAdd = Array.from(newUserIds).filter(id => !currentUserIds.has(id));

      if (usersToAdd.length > 0) {
        const [users] = await connection.query<RowDataPacket[]>(
          'SELECT user_id FROM app_user WHERE user_id IN (?)',
          [usersToAdd]
        );

        if (users.length !== usersToAdd.length) {
          throw new Error('One or more invalid user IDs');
        }
      }

      if (usersToRemove.length > 0) {
        await connection.query(
          'DELETE FROM user_material WHERE material_id = ? AND user_id IN (?)',
          [materialId, usersToRemove]
        );
      }

      for (const newUser of usersToAdd) {
        await connection.query(
          `INSERT INTO user_material (user_id, material_id, assigned_by)
           VALUES (?, ?, ?)`,
          [newUser, materialId, userId]
        );
      }
    }

    return NextResponse.json({ success: true });
  });
}, "Failed to update material");

export const DELETE = withDb(async (connection, request, params) => {
  const materialId = params.materialId;
  const jobId = params.id;

  return await withTransaction(connection, async () => {
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

    await connection.query('DELETE FROM user_material WHERE material_id = ?', [materialId]);
    await connection.query('DELETE FROM material WHERE material_id = ?', [materialId]);

    return NextResponse.json({ success: true });
  });
}, "Failed to delete material");
