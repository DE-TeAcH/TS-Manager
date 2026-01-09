// pages/api/utils/cors.ts
import { NextApiRequest, NextApiResponse } from 'next';

export function runCors(req: NextApiRequest, res: NextApiResponse) {
    // Allow from any origin (or specific one if req.headers.origin is used logic from PHP)
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin as string);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400');
    }

    if (req.method === 'OPTIONS') {
        if (req.headers['access-control-request-method']) {
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
        }
        if (req.headers['access-control-request-headers']) {
            res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] as string);
        }
        res.status(200).end();
        return true; // Handled
    }
    return false;
}
