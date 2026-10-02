import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
    process.env.SESSION_SECRET
);

export async function createSession(data: {
    accessToken: string;
    refreshToken?: string;
}) {
    return await new SignJWT(data)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secret);
}

export async function verifySession(token: string) {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch {
        return null;
    }
}