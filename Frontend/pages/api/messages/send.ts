// pages/api/messages/send.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const data = req.body;
    if (!data) {
        sendResponse(res, false, "No data provided.", null, 400);
        return;
    }

    const chat_id = data.chat_id;
    const sender_id = data.sender_id;
    const content = data.content ? data.content.trim() : null;

    if (!chat_id || !sender_id || !content) {
        sendResponse(res, false, "Chat ID, sender ID, and content are required.", null, 400);
        return;
    }

    try {
        const conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        const checkQuery = "SELECT id FROM chat_participants WHERE chat_id = ? AND user_id = ?";
        const [rows]: any = await conn.execute(checkQuery, [chat_id, sender_id]);

        if (rows.length === 0) {
            sendResponse(res, false, "User is not a participant of this chat.", null, 403);
            return;
        }

        const query = `INSERT INTO messages (chat_id, sender_id, content, is_read, created_at) 
              VALUES (?, ?, ?, 0, NOW())`;

        const [result]: any = await conn.execute(query, [chat_id, sender_id, content]);
        const messageId = result.insertId;

        const fetchQuery = `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar 
                   FROM messages m 
                   LEFT JOIN users u ON m.sender_id = u.id 
                   WHERE m.id = ?`;

        const [msgs]: any = await conn.execute(fetchQuery, [messageId]);
        const message = msgs[0];

        sendResponse(res, true, "Message sent successfully.", message);

    } catch (e: any) {
        console.error(e);
        sendResponse(res, false, "Failed to send message: " + e.message, null, 500);
    }
}
