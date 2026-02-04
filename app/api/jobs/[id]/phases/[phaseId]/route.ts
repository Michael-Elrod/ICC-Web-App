import { NextResponse } from "next/server";
import { addBusinessDays } from "@/app/utils";
import { RowDataPacket } from 'mysql2/promise';
import { withDb, withTransaction } from "@/app/lib/api-utils";

export const PATCH = withDb(async (connection, request, params) => {
  const phaseId = parseInt(params.phaseId);
  if (isNaN(phaseId)) {
    return NextResponse.json({ error: 'Invalid phase ID' }, { status: 400 });
  }

  const body = await request.json();

  return await withTransaction(connection, async () => {
    let updateQuery = 'UPDATE phase SET';
    const updateValues = [];
    const updates = [];

    if (body.title !== undefined) {
      updates.push(' phase_title = ?');
      updateValues.push(body.title);
    }

    if (body.startDate !== undefined) {
      const formattedDate = body.startDate.split('T')[0];
      updates.push(' phase_startdate = ?');
      updateValues.push(formattedDate);
    }

    if (updates.length > 0) {
      updateQuery += updates.join(',') + ' WHERE phase_id = ?';
      updateValues.push(phaseId);
      await connection.query(updateQuery, updateValues);
    }

    if (body.extend > 0) {
      const [currentTasks] = await connection.query<RowDataPacket[]>(
        `SELECT task_id FROM task WHERE phase_id = ?`,
        [phaseId]
      );

      for (const task of currentTasks) {
        await connection.query(
          'UPDATE task SET task_duration = task_duration + ? WHERE task_id = ?',
          [body.extend, task.task_id]
        );
      }

      const [currentMaterials] = await connection.query<RowDataPacket[]>(
        `SELECT material_id, material_duedate FROM material WHERE phase_id = ?`,
        [phaseId]
      );

      for (const material of currentMaterials) {
        const newDate = addBusinessDays(new Date(material.material_duedate), body.extend);
        await connection.query(
          'UPDATE material SET material_duedate = ? WHERE material_id = ?',
          [newDate.toISOString().split('T')[0], material.material_id]
        );
      }
    }

    if (body.extendFuturePhases && body.extend > 0) {
      const [futureTasks] = await connection.query<RowDataPacket[]>(
        `SELECT task_id, task_startdate FROM task t
         JOIN phase p ON t.phase_id = p.phase_id
         WHERE p.phase_id > ?`,
        [phaseId]
      );

      for (const task of futureTasks) {
        const newDate = addBusinessDays(new Date(task.task_startdate), body.extend);
        await connection.query(
          'UPDATE task SET task_startdate = ? WHERE task_id = ?',
          [newDate.toISOString().split('T')[0], task.task_id]
        );
      }

      const [futureMaterials] = await connection.query<RowDataPacket[]>(
        `SELECT material_id, material_duedate FROM material m
         JOIN phase p ON m.phase_id = p.phase_id
         WHERE p.phase_id > ?`,
        [phaseId]
      );

      for (const material of futureMaterials) {
        const newDate = addBusinessDays(new Date(material.material_duedate), body.extend);
        await connection.query(
          'UPDATE material SET material_duedate = ? WHERE material_id = ?',
          [newDate.toISOString().split('T')[0], material.material_id]
        );
      }

      const [futurePhases] = await connection.query<RowDataPacket[]>(
        `SELECT DISTINCT p.phase_id,
          LEAST(
            COALESCE(MIN(t.task_startdate), '9999-12-31'),
            COALESCE(MIN(m.material_duedate), '9999-12-31')
          ) as earliest_date
        FROM phase p
        LEFT JOIN task t ON p.phase_id = t.phase_id
        LEFT JOIN material m ON p.phase_id = m.phase_id
        WHERE p.phase_id > ?
        GROUP BY p.phase_id`,
        [phaseId]
      );

      for (const phase of futurePhases) {
        await connection.query(
          'UPDATE phase SET phase_startdate = ? WHERE phase_id = ?',
          [phase.earliest_date, phase.phase_id]
        );
      }
    }

    return NextResponse.json({ message: 'Phase updated successfully' });
  });
}, "Failed to update phase");
