// pages/api/departments/update.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const data = req.body;
    if (!data.id) {
        sendResponse(res, false, "Department ID is required.", null, 400);
        return;
    }

    let conn;
    try {
        conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        // Check if dept_head_id is being changed
        let oldDeptHeadId = null;
        let teamId = null;

        if (data.dept_head_id !== undefined) {
            const getCurrentQuery = "SELECT d.dept_head_id, d.team_id FROM departments d WHERE d.id = ?";
            const [rows]: any = await conn.execute(getCurrentQuery, [data.id]);
            if (rows.length > 0) {
                oldDeptHeadId = rows[0].dept_head_id;
                teamId = rows[0].team_id;
            }
        }

        const fields: string[] = [];
        const params: any[] = [];

        if (data.name) {
            fields.push("name = ?");
            params.push(data.name);
        }
        if (data.dept_head_id !== undefined) {
            fields.push("dept_head_id = ?");
            params.push(data.dept_head_id);
        }

        if (fields.length === 0) {
            sendResponse(res, false, "No fields to update.", null, 400);
            return;
        }

        params.push(data.id);
        const query = `UPDATE departments SET ${fields.join(", ")} WHERE id = ?`;

        await conn.beginTransaction();
        await conn.execute(query, params);

        // If dept head changed, cleanup
        if (oldDeptHeadId && data.dept_head_id !== undefined && oldDeptHeadId != data.dept_head_id) {

            const getLeaderQuery = "SELECT id FROM users WHERE team_id = ? AND role = 'team-leader' LIMIT 1";
            const [leaders]: any = await conn.execute(getLeaderQuery, [teamId]);

            if (leaders.length > 0) {
                const leaderId = leaders[0].id;

                // Find old chat
                const findChatQuery = `SELECT c.id FROM chats c
                         INNER JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = ?
                         INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = ?
                         WHERE c.type = 'private'`;
                const [chats]: any = await conn.execute(findChatQuery, [oldDeptHeadId, leaderId]);

                if (chats.length > 0) {
                    await conn.execute("DELETE FROM chats WHERE id = ?", [chats[0].id]);
                }

                // Create new chat
                if (data.dept_head_id) {
                    const checkExisting = `SELECT c.id FROM chats c
                           INNER JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = ?
                           INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = ?
                           WHERE c.type = 'private' LIMIT 1`;
                    const [existing]: any = await conn.execute(checkExisting, [data.dept_head_id, leaderId]);

                    if (existing.length === 0) {
                        const [res]: any = await conn.execute("INSERT INTO chats (type) VALUES ('private')");
                        const newChatId = res.insertId;
                        await conn.execute("INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)", [newChatId, leaderId]);
                        await conn.execute("INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)", [newChatId, data.dept_head_id]);
                    }
                }
            }
        }

        await conn.commit();
        sendResponse(res, true, "Department updated successfully.");

    } catch (e: any) {
        if (conn) await conn.rollback();
        console.error("Update department error: " + e.message);
        sendResponse(res, false, "Unable to update department.", null, 503);
    }
}
