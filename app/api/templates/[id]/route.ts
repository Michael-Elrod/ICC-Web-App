// route.ts

import { NextResponse } from "next/server";
import { withRole, withTransaction } from "@/app/lib/api-utils";
import type { PoolConnection } from "mysql2/promise";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export const GET = withRole(
  ["Owner", "Admin"],
  async (connection, session, request, params) => {
    const { id } = await params;
    const templateId = parseInt(id);

    const [templates] = await connection.execute<RowDataPacket[]>(
      "SELECT template_id, template_name FROM job_template WHERE template_id = ?",
      [templateId],
    );

    if ((templates as any[]).length === 0) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    const template = (templates as any[])[0];

    const [phases] = await connection.execute<RowDataPacket[]>(
      "SELECT template_phase_id, phase_title, phase_description, phase_order FROM template_phase WHERE template_id = ? ORDER BY phase_order",
      [templateId],
    );

    const phaseIds = (phases as any[]).map((p) => p.template_phase_id);

    let tasks: any[] = [];
    let materials: any[] = [];
    let taskContacts: any[] = [];
    let materialContacts: any[] = [];

    if (phaseIds.length > 0) {
      const placeholders = phaseIds.map(() => "?").join(",");

      const [taskRows] = await connection.execute<RowDataPacket[]>(
        `SELECT template_task_id, template_phase_id, task_title, task_duration, task_offset, task_description, task_order FROM template_task WHERE template_phase_id IN (${placeholders}) ORDER BY task_order`,
        phaseIds,
      );
      tasks = taskRows as any[];

      const [materialRows] = await connection.execute<RowDataPacket[]>(
        `SELECT template_material_id, template_phase_id, material_title, material_offset, material_description, material_order FROM template_material WHERE template_phase_id IN (${placeholders}) ORDER BY material_order`,
        phaseIds,
      );
      materials = materialRows as any[];

      // Fetch contact assignments
      const taskIds = tasks.map((t) => t.template_task_id);
      if (taskIds.length > 0) {
        const taskPlaceholders = taskIds.map(() => "?").join(",");
        const [tcRows] = await connection.execute<RowDataPacket[]>(
          `SELECT ttc.template_task_id, ttc.user_id, u.user_first_name AS first_name, u.user_last_name AS last_name, u.user_email, u.user_phone
           FROM template_task_contact ttc
           JOIN app_user u ON u.user_id = ttc.user_id
           WHERE ttc.template_task_id IN (${taskPlaceholders})`,
          taskIds,
        );
        taskContacts = tcRows as any[];
      }

      const materialIds = materials.map((m) => m.template_material_id);
      if (materialIds.length > 0) {
        const matPlaceholders = materialIds.map(() => "?").join(",");
        const [mcRows] = await connection.execute<RowDataPacket[]>(
          `SELECT tmc.template_material_id, tmc.user_id, u.user_first_name AS first_name, u.user_last_name AS last_name, u.user_email, u.user_phone
           FROM template_material_contact tmc
           JOIN app_user u ON u.user_id = tmc.user_id
           WHERE tmc.template_material_id IN (${matPlaceholders})`,
          materialIds,
        );
        materialContacts = mcRows as any[];
      }
    }

    const result = {
      template_id: template.template_id,
      template_name: template.template_name,
      phases: (phases as any[]).map((phase) => ({
        template_phase_id: phase.template_phase_id,
        phase_title: phase.phase_title,
        phase_description: phase.phase_description,
        phase_order: phase.phase_order,
        tasks: tasks
          .filter((t) => t.template_phase_id === phase.template_phase_id)
          .map((t) => ({
            template_task_id: t.template_task_id,
            task_title: t.task_title,
            task_duration: t.task_duration,
            task_offset: t.task_offset,
            task_description: t.task_description,
            task_order: t.task_order,
            contacts: taskContacts
              .filter((c) => c.template_task_id === t.template_task_id)
              .map((c) => ({
                user_id: c.user_id,
                first_name: c.first_name,
                last_name: c.last_name,
                user_email: c.user_email,
                user_phone: c.user_phone || "",
              })),
          })),
        materials: materials
          .filter((m) => m.template_phase_id === phase.template_phase_id)
          .map((m) => ({
            template_material_id: m.template_material_id,
            material_title: m.material_title,
            material_offset: m.material_offset,
            material_description: m.material_description,
            material_order: m.material_order,
            contacts: materialContacts
              .filter((c) => c.template_material_id === m.template_material_id)
              .map((c) => ({
                user_id: c.user_id,
                first_name: c.first_name,
                last_name: c.last_name,
                user_email: c.user_email,
                user_phone: c.user_phone || "",
              })),
          })),
      })),
    };

    return NextResponse.json(result);
  },
  "Failed to fetch template",
);

export const PUT = withRole(
  ["Owner", "Admin"],
  async (connection, session, request, params) => {
    const { id } = await params;
    const templateId = parseInt(id);
    const body = await request.json();
    const { template_name, phases } = body;

    if (!template_name?.trim()) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 },
      );
    }

    const [existing] = await connection.execute<RowDataPacket[]>(
      "SELECT template_id FROM job_template WHERE template_id = ?",
      [templateId],
    );

    if ((existing as any[]).length === 0) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    await withTransaction(connection, async () => {
      await connection.execute(
        "UPDATE job_template SET template_name = ? WHERE template_id = ?",
        [template_name.trim(), templateId],
      );

      // Delete existing phases (cascades to tasks, materials, and their contacts)
      await connection.execute(
        "DELETE FROM template_phase WHERE template_id = ?",
        [templateId],
      );

      await insertPhasesWithContacts(connection, templateId, phases || []);
    });

    return NextResponse.json({ success: true });
  },
  "Failed to update template",
);

export const DELETE = withRole(
  ["Owner", "Admin"],
  async (connection, session, request, params) => {
    const { id } = await params;
    const templateId = parseInt(id);

    const [result] = await connection.execute<ResultSetHeader>(
      "DELETE FROM job_template WHERE template_id = ?",
      [templateId],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  },
  "Failed to delete template",
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
