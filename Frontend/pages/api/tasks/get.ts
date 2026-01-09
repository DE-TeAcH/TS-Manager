import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const event_id = req.query.event_id;
    const team_id = req.query.team_id;
    const assigned_to = req.query.assigned_to;
    const status = req.query.status as string;

    // Auto-update status for expired events
    try {
        const conn = await db.getConnection();
        if (conn) {
            await conn.execute("UPDATE events SET status = 'inactive' WHERE end_date < CURDATE() AND status = 'active'");
        }
    } catch (e) {
        console.error("Failed to auto-update event statuses", e);
    }

    // Auto-update task statuses based on event time
    try {
        const conn = await db.getConnection();
        if (conn) {
            // Assigned -> In Progress (Event started)
            // Event date is today and start time passed OR event date was in past (but not ended yet)
            await conn.execute(`
                UPDATE tasks t 
                JOIN events e ON t.event_id = e.id 
                SET t.status = 'in_progress' 
                WHERE t.status = 'assigned' 
                AND (
                    (e.date < CURDATE()) OR 
                    (e.date = CURDATE() AND e.start_time <= CURTIME())
                )
                AND (
                    (e.end_date > CURDATE()) OR 
                    (e.end_date = CURDATE() AND e.end_time > CURTIME())
                )
            `);

            // Any Status -> Completed (Event ended)
            await conn.execute(`
                UPDATE tasks t 
                JOIN events e ON t.event_id = e.id 
                SET t.status = 'completed' 
                WHERE t.status != 'completed' 
                AND (
                    (e.end_date < CURDATE()) OR 
                    (e.end_date = CURDATE() AND e.end_time <= CURTIME())
                )
            `);
        }
    } catch (e) {
        console.error("Failed to auto-update task statuses", e);
    }

    let query = `SELECT t.*, e.title as event_title, d.name as department_name,
          GROUP_CONCAT(u.id) as assigned_member_ids,
          GROUP_CONCAT(u.name) as assigned_member_names
          FROM tasks t 
          LEFT JOIN events e ON t.event_id = e.id 
          LEFT JOIN departments d ON t.department_id = d.id
          LEFT JOIN task_assignments ta ON t.id = ta.task_id
          LEFT JOIN users u ON ta.user_id = u.id
          WHERE (e.status = 'active' OR t.event_id IS NULL)`;

    const params: any[] = [];

    if (event_id) {
        query += " AND t.event_id = ?";
        params.push(event_id);
    }
    if (team_id) {
        query += " AND e.team_id = ?";
        params.push(team_id);
    }
    if (status) {
        if (status.includes(',')) {
            const statuses = status.split(',');
            const placeholders = statuses.map(() => '?').join(',');
            query += ` AND t.status IN (${placeholders})`;
            params.push(...statuses);
        } else {
            query += " AND t.status = ?";
            params.push(status);
        }
    }
    if (assigned_to) {
        query += " AND ta.user_id = ?";
        params.push(assigned_to);
    }

    query += " GROUP BY t.id ORDER BY t.created_at DESC";

    try {
        const conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        const [tasks]: any = await conn.execute(query, params);

        for (const task of tasks) {
            if (task.assigned_member_ids) {
                const ids = task.assigned_member_ids.toString().split(',');
                const names = task.assigned_member_names.toString().split(',');
                task.assigned_members = [];
                for (let i = 0; i < ids.length; i++) {
                    task.assigned_members.push({
                        id: ids[i],
                        name: names[i]
                    });
                }
            } else {
                task.assigned_members = [];
            }
            delete task.assigned_member_ids;
            delete task.assigned_member_names;
        }

        sendResponse(res, true, "Tasks retrieved successfully.", tasks);

    } catch (error) {
        console.error(error);
        sendResponse(res, false, "Internal Server Error", null, 500);
    }
}
