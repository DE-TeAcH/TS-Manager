// pages/api/teams/create.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '../config/database';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    const data = req.body;

    if (
        data.name &&
        data.leader_name &&
        data.leader_email &&
        data.leader_username &&
        data.leader_password &&
        data.leader_bac_matricule &&
        data.leader_bac_year &&
        data.category
    ) {
        const conn = await db.getConnection();
        if (!conn) {
            sendResponse(res, false, "Database connection failed", null, 500);
            return;
        }

        try {
            await conn.beginTransaction();

            // 1. Create Team
            const query = "INSERT INTO teams (name, description, category, created_at) VALUES (?, ?, ?, NOW())";
            const description = data.description ? data.description : "";

            const [teamResult]: any = await conn.execute(query, [data.name, description, data.category]);

            if (teamResult.affectedRows === 0) {
                throw new Error("Unable to create team.");
            }

            const teamId = teamResult.insertId;

            // 2. Create Team Leader User
            const queryUser = "INSERT INTO users (name, email, username, password, role, team_id, join_date, created_at, bac_matricule, bac_year) VALUES (?, ?, ?, ?, 'team-leader', ?, CURDATE(), NOW(), ?, ?)";

            const password_hash = await bcrypt.hash(data.leader_password, 10);

            const [userResult]: any = await conn.execute(queryUser, [
                data.leader_name,
                data.leader_email,
                data.leader_username,
                password_hash,
                teamId,
                data.leader_bac_matricule,
                data.leader_bac_year
            ]);

            if (userResult.affectedRows === 0) {
                throw new Error("Unable to create team leader.");
            }

            await conn.commit();
            sendResponse(res, true, "Team and Team Leader created successfully.", { team_id: teamId }, 201);

        } catch (e: any) {
            await conn.rollback();
            sendResponse(res, false, "Failed to create team: " + e.message, null, 503);
        }
    } else {
        sendResponse(res, false, "Incomplete data. Name, leader details, and category are required.", null, 400);
    }
}
