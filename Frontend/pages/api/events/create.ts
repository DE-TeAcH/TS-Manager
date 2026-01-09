// pages/api/events/create.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const data = req.body;

    if (
        !data.title ||
        !data.date ||
        !data.end_date ||
        !data.start_time ||
        !data.end_time ||
        !data.team_id
    ) {
        sendResponse(res, false, "Missing required fields.", null, 400);
        return;
    }

    const query = `INSERT INTO events (title, description, date, end_date, start_time, end_time, location, team_id, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    // Set status based on room request
    const status = (data.request_room && data.request_room) ? 'pending' : 'active';

    try {
        const conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        const [result]: any = await conn.execute(query, [
            data.title,
            data.description,
            data.date,
            data.end_date,
            data.start_time,
            data.end_time,
            data.location,
            data.team_id,
            status
        ]);

        if (result.insertId) {
            sendResponse(res, true, "Event created successfully.", { id: result.insertId }, 201);
        } else {
            sendResponse(res, false, "Unable to create event.", null, 503);
        }
    } catch (error) {
        console.error(error);
        sendResponse(res, false, "Internal Server Error", null, 500);
    }
}
