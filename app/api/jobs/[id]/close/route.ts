import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import { withRole, withTransaction } from "@/app/lib/api-utils";

export const POST = withRole(['Owner', 'Admin'], async (connection, session, request, params) => {
  return await withTransaction(connection, async () => {
    const [phases] = await connection.query<RowDataPacket[]>(
      "SELECT phase_id FROM phase WHERE job_id = ?",
      [params.id]
    );

    const phaseIds = phases.map(phase => phase.phase_id);

    if (phaseIds.length > 0) {
      await connection.query(`
        UPDATE task
        SET task_status = 'Complete'
        WHERE phase_id IN (?)
      `, [phaseIds]);

      await connection.query(`
        UPDATE material
        SET material_status = 'Complete'
        WHERE phase_id IN (?)
      `, [phaseIds]);
    }

    await connection.query(
      "UPDATE job SET job_status = 'closed' WHERE job_id = ?",
      [params.id]
    );

    return NextResponse.json({ success: true });
  });
}, "Failed to close job");
