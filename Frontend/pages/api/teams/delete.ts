// pages/api/teams/delete.ts
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
        sendResponse(res, false, "No team IDs provided.", null, 400);
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

        // Helper to create placeholders ?,?,?
        const placeholders = ids.map(() => '?').join(',');

        // 1. Unlink Department Heads
        const query1 = `UPDATE departments SET dept_head_id = NULL WHERE team_id IN (${placeholders})`;
        await conn.execute(query1, ids);

        // 2. Delete Tasks
        // Delete tasks linked to events of these teams
        const queryTasksEvents = `DELETE t FROM tasks t 
                                  INNER JOIN events e ON t.event_id = e.id 
                                  WHERE e.team_id IN (${placeholders})`;
        await conn.execute(queryTasksEvents, ids);

        // Delete tasks linked to departments of these teams
        const queryTasksDepts = `DELETE t FROM tasks t 
                                 INNER JOIN departments d ON t.department_id = d.id 
                                 WHERE d.team_id IN (${placeholders})`;
        await conn.execute(queryTasksDepts, ids);

        // 3. Delete Events
        const queryEvents = `DELETE FROM events WHERE team_id IN (${placeholders})`;
        await conn.execute(queryEvents, ids);

        // 4. Delete Messages (associated with users of these teams)
        const queryMessages = `DELETE m FROM messages m 
                               INNER JOIN users u1 ON m.sender_id = u1.id 
                               WHERE u1.team_id IN (${placeholders})`;
        await conn.execute(queryMessages, ids);

        const queryMessagesRecv = `DELETE m FROM messages m 
                                   INNER JOIN users u2 ON m.receiver_id = u2.id 
                                   WHERE u2.team_id IN (${placeholders})`;
        await conn.execute(queryMessagesRecv, ids);

        // 5. Delete Users
        const queryUsers = `DELETE FROM users WHERE team_id IN (${placeholders})`;
        await conn.execute(queryUsers, ids);

        // 6. Delete Departments
        const queryDepts = `DELETE FROM departments WHERE team_id IN (${placeholders})`;
        await conn.execute(queryDepts, ids);

        // 7. Delete Teams
        const queryTeams = `DELETE FROM teams WHERE id IN (${placeholders})`;
        await conn.execute(queryTeams, ids);

        await conn.commit();
        sendResponse(res, true, "Teams deleted successfully.");

    } catch (e: any) {
        if (conn) await conn.rollback();
        console.error("Delete Teams Error: " + e.message);
        sendResponse(res, false, "Failed to delete teams: " + e.message, null, 503);
    }
}
