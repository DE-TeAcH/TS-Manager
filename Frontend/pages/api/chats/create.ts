// pages/api/chats/create.ts
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

    const type = data.type;
    const participant_ids = data.participant_ids || [];
    const task_id = data.task_id || null;
    const name = data.name || null;

    if (!type || !['private', 'group'].includes(type)) {
        sendResponse(res, false, "Valid chat type (private/group) is required.", null, 400);
        return;
    }

    if (participant_ids.length < 2) {
        sendResponse(res, false, "At least 2 participants are required.", null, 400);
        return;
    }

    let conn;
    try {
        conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        // Private chat check
        if (type === 'private' && participant_ids.length === 2) {
            const checkQuery = `SELECT c.id FROM chats c
                   INNER JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = ?
                   INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = ?
                   WHERE c.type = 'private'
                   LIMIT 1`;

            const [rows]: any = await conn.execute(checkQuery, [participant_ids[0], participant_ids[1]]);
            if (rows.length > 0) {
                sendResponse(res, true, "Chat already exists.", { id: rows[0].id, existing: true });
                return;
            }
        }

        // Group chat linked to task check
        if (type === 'group' && task_id) {
            const checkQuery = "SELECT id FROM chats WHERE task_id = ? AND type = 'group' LIMIT 1";
            const [rows]: any = await conn.execute(checkQuery, [task_id]);

            if (rows.length > 0) {
                const existingChatId = rows[0].id;
                // Add new participants
                for (const uid of participant_ids) {
                    const insertParticipant = "INSERT IGNORE INTO chat_participants (chat_id, user_id) VALUES (?, ?)";
                    await conn.execute(insertParticipant, [existingChatId, uid]);
                }
                sendResponse(res, true, "Chat already exists for this task.", { id: existingChatId, existing: true });
                return;
            }
        }

        await conn.beginTransaction();

        // Create Chat
        const insertChat = "INSERT INTO chats (type, name, task_id) VALUES (?, ?, ?)";
        const [chatResult]: any = await conn.execute(insertChat, [type, name, task_id]);
        const chatId = chatResult.insertId;

        // Add Participants
        for (const userId of participant_ids) {
            const insertParticipant = "INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)";
            await conn.execute(insertParticipant, [chatId, userId]);
        }

        await conn.commit();
        sendResponse(res, true, "Chat created successfully.", { id: chatId, existing: false });

    } catch (e: any) {
        if (conn) await conn.rollback();
        console.error(e);
        sendResponse(res, false, "Failed to create chat: " + e.message, null, 500);
    }
}
