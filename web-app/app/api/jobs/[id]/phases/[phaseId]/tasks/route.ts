// app/api/jobs/[id]/phases/[phaseId]/tasks/route.ts
import { NextResponse } from "next/server";
import pool from '@/app/lib/db';
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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

      // Create task
      const [taskResult] = await connection.execute<ResultSetHeader>(
        "INSERT INTO task (phase_id, task_title, task_startdate, task_duration, task_description, task_status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          phaseId,
          data.title,
          data.startDate,
          data.duration,
          data.details || null,
          "Incomplete",
          userId,
        ]
      );

      const taskId = taskResult.insertId;

      // Handle user assignments
      if (data.selectedContacts?.length) {
        await Promise.all(
          data.selectedContacts.map((contactId: number) =>
            connection.execute(
              "INSERT INTO user_task (user_id, task_id, assigned_by) VALUES (?, ?, ?)",
              [contactId, taskId, userId]
            )
          )
        );
      }

      // Get the created task with its users
      const [taskData] = await connection.execute<RowDataPacket[]>(
        `SELECT t.*, 
          GROUP_CONCAT(JSON_OBJECT(
            'user_id', u.user_id,
            'first_name', u.user_first_name,
            'last_name', u.user_last_name,
            'user_email', u.user_email,
            'user_phone', u.user_phone
          )) as users
        FROM task t
        LEFT JOIN user_task ut ON t.task_id = ut.task_id
        LEFT JOIN app_user u ON ut.user_id = u.user_id
        WHERE t.task_id = ?
        GROUP BY t.task_id`,
        [taskId]
      );

      await connection.commit();

      const task = taskData[0];

      return NextResponse.json({
        task_id: task.task_id,
        task_title: task.task_title,
        task_startdate: task.task_startdate.toISOString().split('T')[0],
        task_duration: task.task_duration,
        task_status: task.task_status,
        task_description: task.task_description,
        users: []
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}