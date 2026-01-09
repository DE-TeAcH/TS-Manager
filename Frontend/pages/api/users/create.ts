// pages/api/users/create.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const data = req.body;

    if (
        !data.username ||
        !data.password ||
        !data.name ||
        !data.email ||
        !data.role ||
        !data.bac_matricule ||
        !data.bac_year
    ) {
        sendResponse(res, false, "Missing required fields.", null, 400);
        return;
    }

    try {
        const conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        // Check if username exists
        const check_username = "SELECT id FROM users WHERE username = ?";
        const [rowsUser]: any = await conn.execute(check_username, [data.username]);
        if (rowsUser.length > 0) {
            sendResponse(res, false, "Username already exists.", null, 409);
            return;
        }

        // Check if email exists
        const check_email = "SELECT id FROM users WHERE email = ?";
        const [rowsEmail]: any = await conn.execute(check_email, [data.email]);
        if (rowsEmail.length > 0) {
            sendResponse(res, false, "Email already exists.", null, 409);
            return;
        }

        // Check if department already has a head
        if (data.role === 'dept-head' && data.department_id) {
            const dept_head_query = "SELECT id FROM users WHERE role = 'dept-head' AND department_id = ?";
            const [rowsHead]: any = await conn.execute(dept_head_query, [data.department_id]);

            if (rowsHead.length > 0) {
                sendResponse(res, false, "This department already has a Department Head.", null, 409);
                return;
            }
        }

        const join_date = data.join_date ? data.join_date : new Date().toISOString().slice(0, 10); // Simple YYYY-MM-DD

        const query = `INSERT INTO users (username, password, name, email, role, team_id, department_id, join_date, bac_matricule, bac_year) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const hashed_password = await bcrypt.hash(data.password, 10);

        const [result]: any = await conn.execute(query, [
            data.username,
            hashed_password,
            data.name,
            data.email,
            data.role,
            data.team_id || null,
            data.department_id || null,
            join_date,
            data.bac_matricule,
            data.bac_year
        ]);

        if (result.affectedRows > 0) {
            sendResponse(res, true, "User created successfully.", { id: result.insertId }, 201);
        } else {
            sendResponse(res, false, "Unable to create user.", null, 503);
        }

    } catch (error) {
        console.error(error);
        sendResponse(res, false, "Internal Server Error", null, 500);
    }
}
