// pages/api/events/delete.ts
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
        sendResponse(res, false, "No event IDs provided.", null, 400);
        return;
    }

    let conn;
    try {
        conn = await db.getConnection();
        if (!conn) {
            sendResponse(res, false, "Database connection failed", null, 500);
            return;
        }

        await conn.beginTransaction();

        const placeholders = ids.map(() => '?').join(',');

        // 1. Get all task IDs for these events
        const getTasksQuery = `SELECT id FROM tasks WHERE event_id IN (${placeholders})`;
        const [tasks]: any = await conn.execute(getTasksQuery, ids);
        const taskIds = tasks.map((row: any) => row.id);

        // 2. Delete group chats linked to these tasks
        if (taskIds.length > 0) {
            const taskPlaceholders = taskIds.map(() => '?').join(',');
            const deleteChatsQuery = `DELETE FROM chats WHERE task_id IN (${taskPlaceholders})`;
            await conn.execute(deleteChatsQuery, taskIds);
        }

        // 3. Delete Tasks linked to these events
        const queryTasks = `DELETE FROM tasks WHERE event_id IN (${placeholders})`;
        await conn.execute(queryTasks, ids);

        // 4. Delete Events
        const queryEvents = `DELETE FROM events WHERE id IN (${placeholders})`;
        await conn.execute(queryEvents, ids);

        await conn.commit();
        sendResponse(res, true, "Events deleted successfully.");

    } catch (e: any) {
        if (conn) await conn.rollback();
        console.error("Delete Events Error: " + e.message);
        sendResponse(res, false, "Failed to delete events: " + e.message, null, 503);
    }
}
