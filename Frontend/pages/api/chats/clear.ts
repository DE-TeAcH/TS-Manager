// pages/api/chats/clear.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const data = req.body;
    if (!data.chat_id) {
        sendResponse(res, false, "Chat ID is required.", null, 400);
        return;
    }

    const chatId = data.chat_id;
    const userId = data.user_id;

    try {
        const conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        if (userId) {
            const checkQuery = "SELECT id FROM chat_participants WHERE chat_id = ? AND user_id = ?";
            const [rows]: any = await conn.execute(checkQuery, [chatId, userId]);
            if (rows.length === 0) {
                sendResponse(res, false, "User is not a participant of this chat.", null, 403);
                return;
            }
        }

        const deleteQuery = "DELETE FROM messages WHERE chat_id = ?";
        const [result]: any = await conn.execute(deleteQuery, [chatId]);

        sendResponse(res, true, "Chat cleared successfully.", { messages_deleted: result.affectedRows });
    } catch (e: any) {
        console.error(e);
        sendResponse(res, false, "Unable to clear chat.", null, 503);
    }
}
