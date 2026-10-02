import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getGoogleOAuthClient } from "@/lib/google/auth";

export async function GET() {
    const oauth2Client = getGoogleOAuthClient();

    const state = randomBytes(32).toString("hex");

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: [
            "https://www.googleapis.com/auth/drive",
            "https://www.googleapis.com/auth/documents",
        ],
        state,
    });

    const response = NextResponse.redirect(authUrl);

    response.cookies.set("oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 10,
        path: "/",
    });

    return response;
}