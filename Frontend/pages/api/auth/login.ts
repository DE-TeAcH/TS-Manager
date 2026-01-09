import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // quick cors check
    if (runCors(req, res)) return;

    const { username, password } = req.body;

    if (!username || !password) {
        return sendResponse(res, false, "Missing credentials", null, 400);
    }

    const query = `
        SELECT u.*, t.name as team_name, d.name as department_name
        FROM users u
        LEFT JOIN teams t ON u.team_id = t.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.username = ? 
        LIMIT 1
    `;

    try {
        const conn = await db.getConnection();
        const [rows]: any = await conn.execute(query, [username]);

        if (!rows.length) {
            return sendResponse(res, false, "User not found", null, 404);
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            // don't send the hash back
            const { password, ...safeUser } = user;
            sendResponse(res, true, "Login successful", safeUser);
        } else {
            sendResponse(res, false, "Invalid password", null, 401);
        }

    } catch (err) {
        console.error("Login error:", err);
        sendResponse(res, false, "Server hiccup", null, 500);
    }
}
