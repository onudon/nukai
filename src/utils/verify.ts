import jwt from 'jsonwebtoken';

export function verifyJWT(token: string | undefined) {

    if (!token)
        return null;

    try {
        return jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
        return null;
    }
}