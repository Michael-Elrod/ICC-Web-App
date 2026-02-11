// route.ts

import { NextResponse } from "next/server";
import {
  addBusinessDays,
  createLocalDate,
  formatToDateString,
} from "@/app/utils";
import { RowDataPacket } from "mysql2/promise";
import { withDb, withTransaction } from "@/app/lib/api-utils";

/** Build a single UPDATE ... CASE WHEN for batch date updates */
function buildBatchDateUpdate(
  table: string,
  idColumn: string,
  dateColumn: string,
  rows: { id: number; newDate: string }[],
): { query: string; values: any[] } | null {
  if (rows.length === 0) return null;
  const ids = rows.map((r) => r.id);
  const cases = rows.map(() => `WHEN ${idColumn} = ? THEN ?`).join(" ");
  const values = rows.flatMap((r) => [r.id, r.newDate]);
  values.push(...ids);
  return {
    query: `UPDATE ${table} SET ${dateColumn} = CASE ${cases} END WHERE ${idColumn} IN (${ids.map(() => "?").join(",")})`,
    values,
  };
}

export const PATCH = withDb(async (connection, request, params) => {
  const phaseId = parseInt(params.phaseId);
  if (isNaN(phaseId)) {
    return NextResponse.json({ error: "Invalid phase ID" }, { status: 400 });
  }

  const body = await request.json();

  return await withTransaction(connection, async () => {
    let updateQuery = "UPDATE phase SET";
    const updateValues = [];
    const updates = [];

    if (body.title !== undefined) {
      updates.push(" phase_title = ?");
      updateValues.push(body.title);
    }

    if (body.startDate !== undefined) {
      const formattedDate = body.startDate.split("T")[0];
      updates.push(" phase_startdate = ?");
      updateValues.push(formattedDate);
    }

    if (updates.length > 0) {
      updateQuery += updates.join(",") + " WHERE phase_id = ?";
      updateValues.push(phaseId);
      await connection.query(updateQuery, updateValues);
    }

    if (body.extend > 0) {
      // Batch update: increment all task durations in one query (no SELECT needed)
      await connection.query(
        "UPDATE task SET task_duration = task_duration + ? WHERE phase_id = ?",
        [body.extend, phaseId],
      );

      // Batch update: shift material due dates (need SELECT for date calculation in JS)
      const [currentMaterials] = await connection.query<RowDataPacket[]>(
        `SELECT material_id, material_duedate FROM material WHERE phase_id = ?`,
        [phaseId],
      );

      const materialUpdates = currentMaterials.map((m) => ({
        id: m.material_id as number,
        newDate: formatToDateString(
          addBusinessDays(
            createLocalDate(formatToDateString(m.material_duedate)),
            body.extend,
          ),
        ),
      }));

      const materialBatch = buildBatchDateUpdate(
        "material",
        "material_id",
        "material_duedate",
        materialUpdates,
      );
      if (materialBatch) {
        await connection.query(materialBatch.query, materialBatch.values);
      }
    }

    if (body.extendFuturePhases && body.extend > 0) {
      // Fetch future tasks and materials in parallel
      const [[futureTasks], [futureMaterials]] = await Promise.all([
        connection.query<RowDataPacket[]>(
          `SELECT task_id, task_startdate FROM task t
           JOIN phase p ON t.phase_id = p.phase_id
           WHERE p.phase_id > ?`,
          [phaseId],
        ),
        connection.query<RowDataPacket[]>(
          `SELECT material_id, material_duedate FROM material m
           JOIN phase p ON m.phase_id = p.phase_id
           WHERE p.phase_id > ?`,
          [phaseId],
        ),
      ]);

      // Compute new dates in JS, then batch update
      const taskUpdates = futureTasks.map((t) => ({
        id: t.task_id as number,
        newDate: formatToDateString(
          addBusinessDays(
            createLocalDate(formatToDateString(t.task_startdate)),
            body.extend,
          ),
        ),
      }));

      const futMaterialUpdates = futureMaterials.map((m) => ({
        id: m.material_id as number,
        newDate: formatToDateString(
          addBusinessDays(
            createLocalDate(formatToDateString(m.material_duedate)),
            body.extend,
          ),
        ),
      }));

      const taskBatch = buildBatchDateUpdate(
        "task",
        "task_id",
        "task_startdate",
        taskUpdates,
      );
      const matBatch = buildBatchDateUpdate(
        "material",
        "material_id",
        "material_duedate",
        futMaterialUpdates,
      );

      // Run batch updates + future phase recalculation
      const batchPromises: Promise<any>[] = [];
      if (taskBatch) {
        batchPromises.push(connection.query(taskBatch.query, taskBatch.values));
      }
      if (matBatch) {
        batchPromises.push(connection.query(matBatch.query, matBatch.values));
      }
      if (batchPromises.length > 0) {
        await Promise.all(batchPromises);
      }

      // Recalculate future phase start dates from their updated items
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
        [phaseId],
      );

      const phaseUpdates = futurePhases.map((p) => ({
        id: p.phase_id as number,
        newDate: p.earliest_date as string,
      }));

      const phaseBatch = buildBatchDateUpdate(
        "phase",
        "phase_id",
        "phase_startdate",
        phaseUpdates,
      );
      if (phaseBatch) {
        await connection.query(phaseBatch.query, phaseBatch.values);
      }
    }

    return NextResponse.json({ message: "Phase updated successfully" });
  });
}, "Failed to update phase");
