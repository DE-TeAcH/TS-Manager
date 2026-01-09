// pages/api/departments/delete.ts
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
        sendResponse(res, false, "No department IDs provided.", null, 400);
        return;
    }

    let conn;
    try {
        conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        await conn.beginTransaction();

        const placeholders = ids.map(() => '?').join(',');

        // 1. Unlink Users
        const queryUsers = `UPDATE users SET department_id = NULL WHERE department_id IN (${placeholders})`;
        await conn.execute(queryUsers, ids);

        // 2. Delete Tasks linked to these departments
        const queryTasks = `DELETE FROM tasks WHERE department_id IN (${placeholders})`;
        await conn.execute(queryTasks, ids);

        // 3. Delete Departments
        const queryDepts = `DELETE FROM departments WHERE id IN (${placeholders})`;
        await conn.execute(queryDepts, ids);

        await conn.commit();
        sendResponse(res, true, "Departments deleted successfully.");

    } catch (e: any) {
        if (conn) await conn.rollback();
        console.error("Delete Departments Error: " + e.message);
        sendResponse(res, false, "Failed to delete departments: " + e.message, null, 503);
    }
}
