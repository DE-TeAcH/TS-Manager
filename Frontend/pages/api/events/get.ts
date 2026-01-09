import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const team_id = req.query.team_id;
    const sort_by = req.query.sort_by ? req.query.sort_by : 'date';
    const sort_order = req.query.sort_order === 'desc' ? 'DESC' : 'ASC';

    // Auto-update status for expired events
    try {
        const conn = await db.getConnection();
        if (conn) {
            await conn.execute("UPDATE events SET status = 'inactive' WHERE end_date < CURDATE() AND status = 'active'");
        }
    } catch (e) {
        console.error("Failed to auto-update event statuses", e);
    }

    let query = `SELECT e.*, t.name as team_name 
          FROM events e 
          LEFT JOIN teams t ON e.team_id = t.id 
          WHERE 1=1`;

    const params: any[] = [];

    if (team_id) {
        query += " AND e.team_id = ?";
        params.push(team_id);
    }

    if (sort_by === 'title') {
        query += ` ORDER BY e.title ${sort_order}`;
    } else {
        query += ` ORDER BY e.date ${sort_order}, e.start_time ${sort_order}`;
    }

    try {
        const conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        const [events] = await conn.execute(query, params);
        sendResponse(res, true, "Events retrieved successfully.", events);
    } catch (error) {
        console.error(error);
        sendResponse(res, false, "Internal Server Error", null, 500);
    }
}
