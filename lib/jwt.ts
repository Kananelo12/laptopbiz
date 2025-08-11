import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET!;
if (!SECRET) throw new Error('JWT_SECRET is not defined');

/**
 * Signs a payload into a JWT.
 * @param payload - An object containing data you want to include in the token (e.g., user ID).
 * @returns A JWT string, valid for 7 days.
 */
export function signToken(payload: object) {
    return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

/**
 * Verifies and decodes a JWT.
 * @param token - The JWT string to validate.
 * @returns The decoded token payload (as `any` for flexibility).
 * @throws If the token is invalid or expired.
 */
export function verifyToken(token: string) {
    return jwt.verify(token, SECRET) as any;
}