// pages/api/messages/get.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const chat_id = req.query.chat_id;
    const user_id = req.query.user_id;
    const mark_read = req.query.mark_read === 'true';

    if (!chat_id) {
        sendResponse(res, false, "Chat ID is required.", null, 400);
        return;
    }

    try {
        const conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        if (user_id) {
            const checkQuery = "SELECT id FROM chat_participants WHERE chat_id = ? AND user_id = ?";
            const [rows]: any = await conn.execute(checkQuery, [chat_id, user_id]);
            if (rows.length === 0) {
                sendResponse(res, false, "User is not a participant of this chat.", null, 403);
                return;
            }
        }

        const query = `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar, u.role as sender_role
              FROM messages m 
              LEFT JOIN users u ON m.sender_id = u.id 
              WHERE m.chat_id = ?
              ORDER BY m.created_at ASC`;

        const [messages]: any = await conn.execute(query, [chat_id]);

        if (mark_read && user_id) {
            const updateQuery = "UPDATE messages SET is_read = 1 WHERE chat_id = ? AND sender_id != ? AND is_read = 0";
            await conn.execute(updateQuery, [chat_id, user_id]);
        }

        sendResponse(res, true, "Messages retrieved successfully.", messages);

    } catch (error) {
        console.error(error);
        sendResponse(res, false, "Internal Server Error", null, 500);
    }
}
