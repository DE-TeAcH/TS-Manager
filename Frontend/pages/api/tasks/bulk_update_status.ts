// pages/api/tasks/bulk_update_status.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const data = req.body;
    if (!data.task_ids || !Array.isArray(data.task_ids) || !data.status) {
        sendResponse(res, false, "Missing required fields (task_ids array, status).", null, 400);
        return;
    }

    let conn;
    try {
        conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        await conn.beginTransaction();

        const query = "UPDATE tasks SET status = ? WHERE id = ?";
        for (const taskId of data.task_ids) {
            await conn.execute(query, [data.status, taskId]);
        }

        await conn.commit();
        sendResponse(res, true, "Tasks status updated successfully.", null, 200);

    } catch (e: any) {
        if (conn) await conn.rollback();
        console.error("Bulk status update error: " + e.message);
        sendResponse(res, false, "Unable to update tasks status.", null, 503);
    }
}
