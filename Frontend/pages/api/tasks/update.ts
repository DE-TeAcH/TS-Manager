// pages/api/tasks/update.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const data = req.body;
    if (!data.id) {
        sendResponse(res, false, "Task ID is required.", null, 400);
        return;
    }

    const fields: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) {
        fields.push("title = ?");
        params.push(data.title);
    }
    if (data.description !== undefined) {
        fields.push("description = ?");
        params.push(data.description);
    }
    if (data.assigned_to !== undefined) {
        fields.push("assigned_to = ?");
        params.push(data.assigned_to);
    }
    if (data.status !== undefined) {
        fields.push("status = ?");
        params.push(data.status);
    }

    if (fields.length === 0) {
        sendResponse(res, false, "No fields to update.", null, 400);
        return;
    }

    params.push(data.id);
    const query = `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`;

    try {
        const conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        const [result]: any = await conn.execute(query, params);

        if (result.affectedRows > 0 || result.changedRows >= 0) {
            sendResponse(res, true, "Task updated successfully.");
        } else {
            sendResponse(res, false, "Unable to update task.", null, 503);
        }

    } catch (error) {
        console.error(error);
        sendResponse(res, false, "Internal Server Error", null, 500);
    }
}
