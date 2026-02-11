// route.ts

import { NextResponse } from "next/server";
import { TaskUpdatePayload } from "@/app/types/database";
import { RowDataPacket } from "mysql2";
import {
  addBusinessDays,
  createLocalDate,
  formatToDateString,
} from "@/app/utils";
import { withAuth, withDb, withTransaction } from "@/app/lib/api-utils";

export const PATCH = withAuth(async (connection, session, request, params) => {
  const body: TaskUpdatePayload = await request.json();
  const taskId = params.taskId;
  const jobId = params.id;
  const userId = parseInt(session.user.id);

  return await withTransaction(connection, async () => {
    const [taskCheck] = await connection.query<RowDataPacket[]>(
      `SELECT t.task_id
       FROM task t
       JOIN phase p ON t.phase_id = p.phase_id
       WHERE t.task_id = ? AND p.job_id = ?`,
      [taskId, jobId],
    );

    if (!taskCheck.length) {
      return NextResponse.json(
        { error: "Task not found or does not belong to this job" },
        { status: 404 },
      );
    }

    if (body.task_title) {
      await connection.query(
        "UPDATE task SET task_title = ? WHERE task_id = ?",
        [body.task_title, taskId],
      );
    }

    if (body.task_description) {
      await connection.query(
        "UPDATE task SET task_description = ? WHERE task_id = ?",
        [body.task_description, taskId],
      );
    }

    if (body.extension_days && !isNaN(body.extension_days)) {
      if (body.pushDates) {
        const [currentTask] = await connection.query<RowDataPacket[]>(
          "SELECT task_startdate FROM task WHERE task_id = ?",
          [taskId],
        );

        if (currentTask.length > 0) {
          const currentDate = createLocalDate(
            formatToDateString(currentTask[0].task_startdate),
          );
          const newDate = addBusinessDays(currentDate, body.extension_days);
          const formattedNewDate = formatToDateString(newDate);

          await connection.query(
            "UPDATE task SET task_startdate = ? WHERE task_id = ?",
            [formattedNewDate, taskId],
          );
        }
      } else {
        await connection.query(
          "UPDATE task SET task_duration = task_duration + ? WHERE task_id = ?",
          [body.extension_days, taskId],
        );
      }
    }

    if (body.new_users) {
      const [currentUsers] = await connection.query<RowDataPacket[]>(
        "SELECT user_id FROM user_task WHERE task_id = ?",
        [taskId],
      );

      const currentUserIds = new Set(currentUsers.map((u) => u.user_id));
      const newUserIds = new Set(body.new_users);

      const usersToRemove = Array.from(currentUserIds).filter(
        (id) => !newUserIds.has(id),
      );
      const usersToAdd = Array.from(newUserIds).filter(
        (id) => !currentUserIds.has(id),
      );

      if (usersToAdd.length > 0) {
        const [users] = await connection.query<RowDataPacket[]>(
          "SELECT user_id FROM app_user WHERE user_id IN (?)",
          [usersToAdd],
        );

        if (users.length !== usersToAdd.length) {
          throw new Error("One or more invalid user IDs");
        }
      }

      if (usersToRemove.length > 0) {
        await connection.query(
          "DELETE FROM user_task WHERE task_id = ? AND user_id IN (?)",
          [taskId, usersToRemove],
        );
      }

      for (const newUser of usersToAdd) {
        await connection.query(
          `INSERT INTO user_task (user_id, task_id, assigned_by)
           VALUES (?, ?, ?)`,
          [newUser, taskId, userId],
        );
      }
    }

    return NextResponse.json({ success: true });
  });
}, "Failed to update task");

export const DELETE = withDb(async (connection, request, params) => {
  const taskId = params.taskId;
  const jobId = params.id;

  return await withTransaction(connection, async () => {
    const [taskCheck] = await connection.query<RowDataPacket[]>(
      `SELECT t.task_id
       FROM task t
       JOIN phase p ON t.phase_id = p.phase_id
       WHERE t.task_id = ? AND p.job_id = ?`,
      [taskId, jobId],
    );

    if (!taskCheck.length) {
      return NextResponse.json(
        { error: "Task not found or does not belong to this job" },
        { status: 404 },
      );
    }

    await connection.query("DELETE FROM user_task WHERE task_id = ?", [taskId]);
    await connection.query("DELETE FROM task WHERE task_id = ?", [taskId]);

    return NextResponse.json({ success: true });
  });
}, "Failed to delete task");
