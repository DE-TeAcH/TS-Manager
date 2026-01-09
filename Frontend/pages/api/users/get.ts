import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const role = req.query.role;
    const dept_id = req.query.department_id;
    const team_id = req.query.team_id;

    let query = `SELECT u.id, u.username, u.name, u.email, u.role, u.team_id, u.department_id, u.avatar, u.join_date, 
                 t.name as team_name, d.name as department_name , 
                 u.bac_matricule as bac_matricule, u.bac_year as bac_year 
          FROM users u 
          LEFT JOIN teams t ON u.team_id = t.id 
          LEFT JOIN departments d ON u.department_id = d.id 
          WHERE 1=1 AND u.role <> 'admin'`;

    const params: any[] = [];

    if (role) {
        query += " AND u.role = ?";
        params.push(role);
    }
    if (dept_id) {
        query += " AND u.department_id = ?";
        params.push(dept_id);
    }
    if (team_id) {
        query += " AND u.team_id = ?";
        params.push(team_id);
    }

    try {
        const conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        const [users] = await conn.execute(query, params);

        sendResponse(res, true, "Users retrieved successfully.", users);
    } catch (error) {
        console.error(error);
        sendResponse(res, false, "Internal Server Error", null, 500);
    }
}
