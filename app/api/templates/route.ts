// route.ts

import { NextResponse } from "next/server";
import { withRole, withTransaction } from "@/app/lib/api-utils";
import type { PoolConnection } from "mysql2/promise";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export const GET = withRole(
  ["Owner", "Admin"],
  async (connection) => {
    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT template_id, template_name FROM job_template ORDER BY template_name",
    );

    return NextResponse.json(rows);
  },
  "Failed to fetch templates",
);

export const POST = withRole(
  ["Owner", "Admin"],
  async (connection, session, request) => {
    const body = await request.json();
    const { template_name, phases } = body;

    if (!template_name?.trim()) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 },
      );
    }

    const result = await withTransaction(connection, async () => {
      const [templateResult] = await connection.execute<ResultSetHeader>(
        "INSERT INTO job_template (template_name, created_by) VALUES (?, ?)",
        [template_name.trim(), parseInt(session.user.id)],
      );
      const templateId = templateResult.insertId;

      await insertPhasesWithContacts(connection, templateId, phases || []);

      return { templateId };
    });

    return NextResponse.json(
      { templateId: result.templateId },
      { status: 201 },
    );
  },
  "Failed to create template",
);

async function insertPhasesWithContacts(
  connection: PoolConnection,
  templateId: number,
  phases: any[],
) {
  for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
    const phase = phases[phaseIndex];

    const [phaseResult] = await connection.execute<ResultSetHeader>(
      "INSERT INTO template_phase (template_id, phase_title, phase_description, phase_order) VALUES (?, ?, ?, ?)",
      [
        templateId,
        phase.title?.trim() || "Untitled Phase",
        phase.description?.trim() || null,
        phaseIndex,
      ],
    );
    const phaseId = phaseResult.insertId;

    if (phase.tasks?.length > 0) {
      for (let taskIndex = 0; taskIndex < phase.tasks.length; taskIndex++) {
        const task = phase.tasks[taskIndex];
        const [taskResult] = await connection.execute<ResultSetHeader>(
          "INSERT INTO template_task (template_phase_id, task_title, task_duration, task_offset, task_description, task_order) VALUES (?, ?, ?, ?, ?, ?)",
          [
            phaseId,
            task.title?.trim() || "Untitled Task",
            parseInt(task.duration) || 1,
            parseInt(task.offset) || 0,
            task.description?.trim() || null,
            taskIndex,
          ],
        );
        const taskId = taskResult.insertId;

        if (task.contacts?.length > 0) {
          for (const contact of task.contacts) {
            const userId = parseInt(contact.user_id || contact.id);
            if (userId) {
              await connection.execute(
                "INSERT INTO template_task_contact (template_task_id, user_id) VALUES (?, ?)",
                [taskId, userId],
              );
            }
          }
        }
      }
    }

    if (phase.materials?.length > 0) {
      for (
        let materialIndex = 0;
        materialIndex < phase.materials.length;
        materialIndex++
      ) {
        const material = phase.materials[materialIndex];
        const [materialResult] = await connection.execute<ResultSetHeader>(
          "INSERT INTO template_material (template_phase_id, material_title, material_offset, material_description, material_order) VALUES (?, ?, ?, ?, ?)",
          [
            phaseId,
            material.title?.trim() || "Untitled Material",
            parseInt(material.offset) || 0,
            material.description?.trim() || null,
            materialIndex,
          ],
        );
        const materialId = materialResult.insertId;

        if (material.contacts?.length > 0) {
          for (const contact of material.contacts) {
            const userId = parseInt(contact.user_id || contact.id);
            if (userId) {
              await connection.execute(
                "INSERT INTO template_material_contact (template_material_id, user_id) VALUES (?, ?)",
                [materialId, userId],
              );
            }
          }
        }
      }
    }
  }
}
