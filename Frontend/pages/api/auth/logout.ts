// pages/api/auth/logout.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { runCors } from '../utils/cors';
import { sendResponse } from '../utils/response';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (runCors(req, res)) return;

    // In a stateless JWT/session approach (common in Next.js/NextAuth), 
    // logout is often handled client-side by clearing tokens.
    // However, if we were using httpOnly cookies, we would clear them here.
    // Since the PHP version just did session_destroy() (server-side session),
    // and we are mirroring logic:

    // If we implement cookies later, we clear them here.
    // For now, just return success as per the PHP script.

    // res.setHeader('Set-Cookie', 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;');

    sendResponse(res, true, "Logout successful.");
}
