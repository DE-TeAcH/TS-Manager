// pages/api/users/update.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const data = req.body;

    if (!data.id) {
        sendResponse(res, false, "User ID is required.", null, 400);
        return;
    }

    const fields: string[] = [];
    const params: any[] = [];

    // We need to handle params mapping carefully for raw SQL
    // PHP: $params = [":id" => $data->id]; ... execute($params)
    // Node mysql2: execute(query, [val1, val2...])
    // Strategy: Build query with ? and push values to array in order.

    if (data.username !== undefined) {
        fields.push("username = ?");
        params.push(data.username);
    }
    if (data.name !== undefined) {
        fields.push("name = ?");
        params.push(data.name);
    }
    if (data.email !== undefined) {
        fields.push("email = ?");
        params.push(data.email);
    }
    if (data.role !== undefined) {
        fields.push("role = ?");
        params.push(data.role);
    }
    if (data.team_id !== undefined) {
        fields.push("team_id = ?");
        params.push(data.team_id);
    }
    if (data.department_id !== undefined) {
        fields.push("department_id = ?");
        params.push(data.department_id);
    }
    if (data.password !== undefined) {
        fields.push("password = ?");
        params.push(await bcrypt.hash(data.password, 10));
    }
    if (data.bac_matricule !== undefined) {
        fields.push("bac_matricule = ?");
        params.push(data.bac_matricule);
    }
    if (data.bac_year !== undefined) {
        fields.push("bac_year = ?");
        params.push(data.bac_year);
    }

    if (fields.length === 0) {
        sendResponse(res, false, "No fields to update.", null, 400);
        return;
    }

    // Add ID at the end
    params.push(data.id);

    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

    try {
        const conn = await db.getConnection();
        if (!conn) throw new Error("Database connection failed");

        const [result]: any = await conn.execute(query, params);

        if (result.affectedRows > 0 || result.changedRows >= 0) {
            // In MySQL, if fields match, changedRows is 0 but query succeeded. 
            // We return success.
            sendResponse(res, true, "User updated successfully.");
        } else {
            // ID not found?
            sendResponse(res, false, "Unable to update user.", null, 503);
        }
    } catch (error) {
        console.error(error);
        sendResponse(res, false, "Internal Server Error", null, 500);
    }
}
