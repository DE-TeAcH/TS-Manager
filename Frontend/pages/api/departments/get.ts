// pages/api/departments/get.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const team_id = req.query.team_id;

    let query = `SELECT d.id, d.name, d.team_id, d.dept_head_id, u.name as dept_head_name 
          FROM departments d 
          LEFT JOIN users u ON d.dept_head_id = u.id 
          WHERE 1=1`;

    const params: any[] = [];
    if (team_id) {
        query += " AND d.team_id = ?";
        params.push(team_id);
    }
    query += " ORDER BY d.name ASC";

    try {
        const conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        const [departments] = await conn.execute(query, params);
        sendResponse(res, true, "Departments retrieved successfully.", departments);

    } catch (error) {
        console.error(error);
        sendResponse(res, false, "Internal Server Error", null, 500);
    }
}
