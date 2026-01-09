// pages/api/departments/create.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const data = req.body;
    if (!data.name || !data.team_id) {
        sendResponse(res, false, "Department name and team ID are required.", null, 400);
        return;
    }

    try {
        const conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        // Check uniqueness
        const checkQuery = "SELECT id FROM departments WHERE name = ? AND team_id = ?";
        const [rows]: any = await conn.execute(checkQuery, [data.name, data.team_id]);
        if (rows.length > 0) {
            sendResponse(res, false, "A department with this name already exists in this team.", null, 409);
            return;
        }

        if (data.dept_head_id) {
            const userQuery = "SELECT id, role FROM users WHERE id = ?";
            const [users]: any = await conn.execute(userQuery, [data.dept_head_id]);
            if (users.length === 0) {
                sendResponse(res, false, "Simple member user not found.");
                return;
            }
            if (users[0].role !== 'member') {
                sendResponse(res, false, "Selected user must have the 'member' role.");
                return;
            }
        }

        const query = "INSERT INTO departments (name, team_id, dept_head_id) VALUES (?, ?, ?)";
        const dept_head_id = data.dept_head_id || null;

        const [result]: any = await conn.execute(query, [data.name, data.team_id, dept_head_id]);

        if (result.insertId) {
            const newDeptId = result.insertId;

            if (dept_head_id) {
                const updateUserQuery = "UPDATE users SET role = 'dept-head', department_id = ? WHERE id = ?";
                await conn.execute(updateUserQuery, [newDeptId, dept_head_id]);
            }

            sendResponse(res, true, "Department created successfully.", { id: newDeptId });
        } else {
            sendResponse(res, false, "Failed to create department.");
        }

    } catch (error) {
        console.error(error);
        sendResponse(res, false, "Internal Server Error", null, 500);
    }
}
