// pages/api/tasks/assign.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const data = req.body;

    if (!data.task_id || !data.user_ids || !Array.isArray(data.user_ids)) {
        sendResponse(res, false, "Missing required fields (task_id, user_ids array).", null, 400);
        return;
    }

    let conn;
    try {
        conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        await conn.beginTransaction();

        // 1. Remove existing assignments
        const deleteQuery = "DELETE FROM task_assignments WHERE task_id = ?";
        await conn.execute(deleteQuery, [data.task_id]);

        // 2. Insert new assignments
        if (data.user_ids.length > 0) {
            const insertQuery = "INSERT INTO task_assignments (task_id, user_id) VALUES (?, ?)";
            for (const userId of data.user_ids) {
                await conn.execute(insertQuery, [data.task_id, userId]);
            }

            // 3. Create or update group chat
            const taskQuery = `SELECT t.*, t.title as task_title, t.department_id, d.dept_head_id, e.title as event_title
                          FROM tasks t 
                          LEFT JOIN departments d ON t.department_id = d.id 
                          LEFT JOIN events e ON t.event_id = e.id
                          WHERE t.id = ?`;
            const [tasks]: any = await conn.execute(taskQuery, [data.task_id]);
            const task = tasks[0];

            if (task) {
                const chatCheckQuery = "SELECT id FROM chats WHERE task_id = ? AND type = 'group'";
                const [existingChats]: any = await conn.execute(chatCheckQuery, [data.task_id]);
                const existingChat = existingChats[0];

                let chatId = null;

                if (existingChat) {
                    chatId = existingChat.id;
                    // Remove all participants except dept head ? PHP code says "DELETE FROM chat_participants WHERE chat_id = ?" (removing ALL)
                    // Then it adds them back.
                    await conn.execute("DELETE FROM chat_participants WHERE chat_id = ?", [chatId]);
                } else {
                    const eventName = task.event_title || 'Event';
                    const taskName = task.task_title || 'Task';
                    const chatName = `${eventName} - ${taskName}`;

                    const createChatQuery = "INSERT INTO chats (type, name, task_id) VALUES ('group', ?, ?)";
                    const [res]: any = await conn.execute(createChatQuery, [chatName, data.task_id]);
                    chatId = res.insertId;
                }

                // Add all assigned members
                const addParticipantQuery = "INSERT IGNORE INTO chat_participants (chat_id, user_id) VALUES (?, ?)";
                for (const userId of data.user_ids) {
                    await conn.execute(addParticipantQuery, [chatId, userId]);
                }

                // Add dept head
                if (task.dept_head_id) {
                    await conn.execute(addParticipantQuery, [chatId, task.dept_head_id]);
                }
            }
        }

        // 4. Update task status to "assigned" if it was pending
        const updateStatusQuery = "UPDATE tasks SET status = 'assigned' WHERE id = ? AND status = 'pending'";
        await conn.execute(updateStatusQuery, [data.task_id]);

        await conn.commit();
        sendResponse(res, true, "Members assigned successfully.", null, 200);

    } catch (e: any) {
        if (conn) await conn.rollback();
        console.error("Assignment error: " + e.message);
        sendResponse(res, false, "Unable to assign members.", null, 503);
    }
}
