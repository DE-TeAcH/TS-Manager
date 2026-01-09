// pages/api/users/delete.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const data = req.body;
    let id = data.id;

    if (!id) {
        if (req.query.id) {
            id = req.query.id;
        } else {
            sendResponse(res, false, "User ID is required.", null, 400);
            return;
        }
    }

    let conn;
    try {
        conn = await db.getConnection();
        if (!conn) {
            sendResponse(res, false, "Database connection failed", null, 500);
            return;
        }

        await conn.beginTransaction();

        // 1. Delete all private chats where this user is a participant
        const getChatIdsQuery = `SELECT c.id FROM chats c 
                        INNER JOIN chat_participants cp ON c.id = cp.chat_id 
                        WHERE cp.user_id = ? AND c.type = 'private'`;

        const [privateChats]: any = await conn.execute(getChatIdsQuery, [id]);
        const privateChatIds = privateChats.map((row: any) => row.id);

        if (privateChatIds.length > 0) {
            // Create placeholders ?,?,?
            const placeholders = privateChatIds.map(() => '?').join(',');
            const deleteChatsQuery = `DELETE FROM chats WHERE id IN (${placeholders})`;
            await conn.execute(deleteChatsQuery, privateChatIds);
        }

        // 2. Remove user from group chats
        const removeFromGroupsQuery = "DELETE FROM chat_participants WHERE user_id = ?";
        await conn.execute(removeFromGroupsQuery, [id]);

        // 3. Delete the user
        const deleteUserQuery = "DELETE FROM users WHERE id = ?";
        await conn.execute(deleteUserQuery, [id]);

        await conn.commit();
        sendResponse(res, true, "User and associated chats deleted successfully.");

    } catch (e: any) {
        if (conn) await conn.rollback();
        console.error("Delete user error: " + e.message);
        sendResponse(res, false, "Unable to delete user.", null, 503);
    }
}
