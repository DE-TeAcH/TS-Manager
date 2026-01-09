// pages/api/tasks/create.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const data = req.body;

    if (!data.title || !data.event_id || !data.department_id) {
        sendResponse(res, false, "Missing required fields (title, event_id, department_id).", null, 400);
        return;
    }

    const query = `INSERT INTO tasks (title, description, event_id, department_id, status) 
          VALUES (?, ?, ?, ?, 'pending')`;

    try {
        const conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        const [result]: any = await conn.execute(query, [
            data.title,
            data.description,
            data.event_id,
            parseInt(data.department_id) // Ensure int
        ]);

        if (result.insertId) {
            sendResponse(res, true, "Task created successfully.", { id: result.insertId }, 201);
        } else {
            sendResponse(res, false, "Unable to create task.", null, 503);
        }

    } catch (error) {
        console.error(error);
        sendResponse(res, false, "Internal Server Error", null, 500);
    }
}
