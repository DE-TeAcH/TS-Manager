import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const query = `SELECT 
            t.id, 
            t.name, 
            t.description, 
            t.category,
            t.created_at,
            u.name as leader_name,
            u.email as leader_email,
            COUNT(DISTINCT um.id) as total_members,
            COUNT(DISTINCT e.id) as total_events,
            COUNT(DISTINCT CASE WHEN MONTH(e.date) = MONTH(CURRENT_DATE()) AND YEAR(e.date) = YEAR(CURRENT_DATE()) THEN e.id END) as events_this_month
          FROM teams t
          LEFT JOIN users u ON t.id = u.team_id AND u.role = 'team-leader'
          LEFT JOIN users um ON t.id = um.team_id
          LEFT JOIN events e ON t.id = e.team_id
          GROUP BY t.id, t.name, t.description, t.category, t.created_at, u.name, u.email
          ORDER BY events_this_month DESC, t.name ASC`;

    try {
        const conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        const [teams] = await conn.execute(query);
        sendResponse(res, true, "Teams retrieved successfully.", teams);
    } catch (error) {
        console.error(error);
        sendResponse(res, false, "Internal Server Error", null, 500);
    }
}
