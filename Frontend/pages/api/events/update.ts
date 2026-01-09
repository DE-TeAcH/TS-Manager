// pages/api/events/update.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const data = req.body;

    if (!data.id || !data.status) {
        sendResponse(res, false, "Missing required fields.", null, 400);
        return;
    }

    const query = "UPDATE events SET status = ? WHERE id = ?";

    try {
        const conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        const [result]: any = await conn.execute(query, [data.status, data.id]);

        if (result.affectedRows > 0) {
            sendResponse(res, true, "Event updated successfully.", null, 200);
        } else {
            // Or ID not found
            sendResponse(res, false, "Unable to update event.", null, 503);
        }
    } catch (error) {
        console.error(error);
        sendResponse(res, false, "Internal Server Error", null, 500);
    }
}
