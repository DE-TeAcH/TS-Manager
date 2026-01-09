// pages/api/chats/init.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const data = req.body;
    if (!data.user_id) {
        sendResponse(res, false, "User ID is required.", null, 400);
        return;
    }

    const userId = data.user_id;

    try {
        const conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        // Get user info
        const userQuery = `SELECT u.*, d.dept_head_id FROM users u 
                  LEFT JOIN departments d ON u.department_id = d.id 
                  WHERE u.id = ?`;
        const [users]: any = await conn.execute(userQuery, [userId]);
        const user = users[0];

        if (!user) {
            sendResponse(res, false, "User not found.", null, 404);
            return;
        }

        let chatsCreated = 0;

        // Helper to create private chat
        const createPrivateChatIfNotExists = async (user1Id: any, user2Id: any) => {
            const checkQuery = `SELECT c.id FROM chats c
                       INNER JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = ?
                       INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = ?
                       WHERE c.type = 'private' LIMIT 1`;
            const [existing]: any = await conn.execute(checkQuery, [user1Id, user2Id]);

            if (existing.length === 0) {
                const createQuery = "INSERT INTO chats (type) VALUES ('private')";
                const [res]: any = await conn.execute(createQuery);
                const chatId = res.insertId;

                const addQuery = "INSERT INTO chat_participants (chat_id, user_id) VALUES (?, ?)";
                await conn.execute(addQuery, [chatId, user1Id]);
                await conn.execute(addQuery, [chatId, user2Id]);

                chatsCreated++;
                return chatId;
            }
            return null;
        };

        const allowedCounterpartIds: any[] = [];

        switch (user.role) {
            case 'team-leader':
                const deptHeadsQuery = `SELECT DISTINCT d.dept_head_id FROM departments d 
                               WHERE d.team_id = ? AND d.dept_head_id IS NOT NULL`;
                const [deptHeads]: any = await conn.execute(deptHeadsQuery, [user.team_id]);

                for (const row of deptHeads) {
                    if (row.dept_head_id) {
                        await createPrivateChatIfNotExists(userId, row.dept_head_id);
                        allowedCounterpartIds.push(row.dept_head_id);
                    }
                }
                break;

            case 'dept-head':
                // 1. Chat with Team Leader
                const leaderQuery = "SELECT id FROM users WHERE team_id = ? AND role = 'team-leader' LIMIT 1";
                const [leaders]: any = await conn.execute(leaderQuery, [user.team_id]);
                const leader = leaders[0];

                if (leader) {
                    await createPrivateChatIfNotExists(userId, leader.id);
                    allowedCounterpartIds.push(leader.id);
                }

                // 2. Chat with members
                const membersQuery = "SELECT id FROM users WHERE department_id = ? AND role = 'member'";
                const [members]: any = await conn.execute(membersQuery, [user.department_id]);

                for (const member of members) {
                    await createPrivateChatIfNotExists(userId, member.id);
                    allowedCounterpartIds.push(member.id);
                }
                break;

            case 'member':
                if (user.dept_head_id) {
                    await createPrivateChatIfNotExists(userId, user.dept_head_id);
                    allowedCounterpartIds.push(user.dept_head_id);
                }
                break;
        }

        // Cleanup Logic
        let chatsDeleted = 0;
        if (['member', 'dept-head', 'team-leader'].includes(user.role)) {
            const getChatsQuery = `SELECT c.id, cp_other.user_id as other_user_id 
                          FROM chats c
                          JOIN chat_participants cp_me ON c.id = cp_me.chat_id AND cp_me.user_id = ?
                          JOIN chat_participants cp_other ON c.id = cp_other.chat_id AND cp_other.user_id != ?
                          WHERE c.type = 'private'`;

            const [existingChats]: any = await conn.execute(getChatsQuery, [userId, userId]);

            for (const chat of existingChats) {
                // Check if other user is valid
                // Note: allowedCounterpartIds contains numbers/strings. Ensure type match or loose check.
                if (!allowedCounterpartIds.includes(chat.other_user_id)) {
                    // Delete chat
                    await conn.execute("DELETE FROM messages WHERE chat_id = ?", [chat.id]);
                    await conn.execute("DELETE FROM chat_participants WHERE chat_id = ?", [chat.id]);
                    await conn.execute("DELETE FROM chats WHERE id = ?", [chat.id]);
                    chatsDeleted++;
                }
            }
        }

        sendResponse(res, true, "Chats initialized successfully.", {
            chats_created: chatsCreated,
            chats_deleted: chatsDeleted
        });

    } catch (e: any) {
        console.error("Init chats error: " + e.message);
        sendResponse(res, false, "Unable to initialize chats.", null, 503);
    }
}
