// pages/api/chats/get.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const user_id = req.query.user_id;
    const chat_id = req.query.chat_id;

    if (!user_id && !chat_id) {
        sendResponse(res, false, "User ID or Chat ID is required.", null, 400);
        return;
    }

    try {
        const conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        if (chat_id) {
            // Get specific chat
            const query = `SELECT c.*, 
                  GROUP_CONCAT(DISTINCT cp.user_id) as participant_ids,
                  GROUP_CONCAT(DISTINCT u.name) as participant_names,
                  t.title as task_title,
                  t.id as linked_task_id
                  FROM chats c
                  LEFT JOIN chat_participants cp ON c.id = cp.chat_id
                  LEFT JOIN users u ON cp.user_id = u.id
                  LEFT JOIN tasks t ON c.task_id = t.id
                  WHERE c.id = ?
                  GROUP BY c.id`;

            const [rows]: any = await conn.execute(query, [chat_id]);
            const chat = rows[0];

            if (chat) {
                // Process participants
                if (chat.participant_ids) {
                    const ids: string[] = chat.participant_ids.toString().split(',');
                    const names: string[] = chat.participant_names.toString().split(',');
                    chat.participants = [];
                    for (let i = 0; i < ids.length; i++) {
                        chat.participants.push({
                            id: ids[i],
                            name: names[i]
                        });
                    }
                } else {
                    chat.participants = [];
                }
                delete chat.participant_ids;
                delete chat.participant_names;

                sendResponse(res, true, "Chat retrieved successfully.", chat);
            } else {
                sendResponse(res, false, "Chat not found.", null, 404);
            }
        } else {
            // Get all chats for a user
            const query = `SELECT c.*, 
                  GROUP_CONCAT(DISTINCT CONCAT(u2.id, ':{|}:', u2.name, ':{|}:', COALESCE(u2.role, '')) SEPARATOR ':{||}:') as participant_details,
                  t.title as task_title,
                  (SELECT m.content FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
                  (SELECT m.created_at FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_time,
                  (SELECT u3.name FROM messages m JOIN users u3 ON m.sender_id = u3.id WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_sender,
                  (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.sender_id != ? AND m.is_read = 0) as unread_count
                  FROM chats c
                  INNER JOIN chat_participants cp ON c.id = cp.chat_id AND cp.user_id = ?
                  LEFT JOIN chat_participants cp2 ON c.id = cp2.chat_id
                  LEFT JOIN users u2 ON cp2.user_id = u2.id
                  LEFT JOIN tasks t ON c.task_id = t.id
                  GROUP BY c.id
                  ORDER BY last_message_time DESC`;

            const [chats]: any = await conn.execute(query, [user_id, user_id]);

            // Process each chat
            for (const chat of chats) {
                chat.participants = [];

                if (chat.participant_details) {
                    const participants = chat.participant_details.toString().split(':{||}:');
                    for (const p of participants) {
                        const details = p.split(':{|}:');
                        if (details.length >= 2) {
                            chat.participants.push({
                                id: details[0],
                                name: details[1],
                                role: (details[2] && details[2] !== '') ? details[2] : null
                            });
                        }
                    }
                }
                delete chat.participant_details;

                // For private chats
                if (chat.type === 'private' && chat.participants.length > 0) {
                    for (const p of chat.participants) {
                        if (p.id != user_id) {
                            chat.display_name = p.name;
                            chat.other_user_role = p.role;
                            break;
                        }
                    }
                } else {
                    chat.display_name = chat.name ? chat.name : (chat.task_title ? chat.task_title + ' Chat' : 'Group Chat');
                }
            }
            sendResponse(res, true, "Chats retrieved successfully.", chats);
        }

    } catch (error) {
        console.error(error);
        sendResponse(res, false, "Internal Server Error", null, 500);
    }
}
