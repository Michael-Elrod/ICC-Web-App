import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { addBusinessDays } from "@/app/utils";
import { RowDataPacket } from 'mysql2/promise';

export async function PATCH(
   request: Request,
   { params }: { params: { phaseId: string } }
) {
   try {
     const phaseId = parseInt(params.phaseId);
     if (isNaN(phaseId)) {
       return NextResponse.json({ error: 'Invalid phase ID' }, { status: 400 });
     }
  
     const body = await request.json();
     const connection = await pool.getConnection();
  
     try {
       await connection.beginTransaction();
  
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

       // Update current phase tasks and materials if extending
       if (body.extend > 0) {
         // Get current phase tasks
         const [currentTasks] = await connection.query<RowDataPacket[]>(
           `SELECT task_id FROM task WHERE phase_id = ?`,
           [phaseId]
         );
         
         // Update task durations in current phase
         for (const task of currentTasks) {
           await connection.query(
             'UPDATE task SET task_duration = task_duration + ? WHERE task_id = ?',
             [body.extend, task.task_id]
           );
         }

         // Get current phase materials
         const [currentMaterials] = await connection.query<RowDataPacket[]>(
           `SELECT material_id, material_duedate FROM material WHERE phase_id = ?`,
           [phaseId]
         );

         // Update material due dates in current phase
         for (const material of currentMaterials) {
           const newDate = addBusinessDays(new Date(material.material_duedate), body.extend);
           await connection.query(
             'UPDATE material SET material_duedate = ? WHERE material_id = ?',
             [newDate.toISOString().split('T')[0], material.material_id]
           );
         }
       }

       // Handle pushing future phase dates if option selected
       if (body.extendFuturePhases && body.extend > 0) {
         // Push dates forward for future phase tasks
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

         // Push dates forward for future phase materials
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

         // Update future phase start dates based on their earliest items
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

       await connection.commit();
       return NextResponse.json({ message: 'Phase updated successfully' });
  
     } catch (error) {
       await connection.rollback();
       throw error;
     } finally {
       connection.release();
     }
  
   } catch (error) {
     console.error('Error updating phase:', error);
     return NextResponse.json(
       { error: 'Failed to update phase' },
       { status: 500 }
     );
   }
}