// pages/api/tasks/delete.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const data = req.body;
    let ids: any[] = [];

    if (data.ids && Array.isArray(data.ids)) {
        ids = data.ids;
    } else if (data.id) {
        ids = [data.id];
    }

    if (ids.length === 0) {
        sendResponse(res, false, "No task IDs provided.", null, 400);
        return;
    }

    let conn;
    try {
        conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        await conn.beginTransaction();

        const placeholders = ids.map(() => '?').join(',');

        // 1. Delete Task Assignments
        const queryAssignments = `DELETE FROM task_assignments WHERE task_id IN (${placeholders})`;
        await conn.execute(queryAssignments, ids);

        // 2. Delete Tasks
        const queryTasks = `DELETE FROM tasks WHERE id IN (${placeholders})`;
        await conn.execute(queryTasks, ids);

        await conn.commit();
        sendResponse(res, true, "Tasks deleted successfully.");

    } catch (e: any) {
        if (conn) await conn.rollback();
        console.error("Delete Tasks Error: " + e.message);
        sendResponse(res, false, "Failed to delete tasks: " + e.message, null, 503);
    }
}
