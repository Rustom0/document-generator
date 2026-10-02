import { NextRequest, NextResponse } from "next/server";
import { getGoogleOAuthClient } from "../../../../../lib/google/auth";
import { createSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code) {
        return NextResponse.json(
            { error: "Authorization code is missing" },
            { status: 400 }
        );
    }

    if (!state) {
        return NextResponse.json(
            { error: "OAuth state is missing" },
            { status: 400 }
        );
    }

    const storedState = request.cookies.get("oauth_state")?.value;

    if (!storedState || storedState !== state) {
        return NextResponse.json(
            { error: "Invalid OAuth state" },
            { status: 400 }
        );
    }

    try {
        const oauth2Client = getGoogleOAuthClient();

        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.access_token) {
            return NextResponse.json(
                { error: "Google access token was not received" },
                { status: 400 }
            );
        }

        const sessionToken = await createSession({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token ?? undefined,
        });

        const response = NextResponse.redirect(
            new URL("/", request.url)
        );

        response.cookies.set("session", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });

        response.cookies.set("oauth_state", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 0,
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Google authentication error:", error);

        return NextResponse.json(
            { error: "Google authentication failed" },
            { status: 500 }
        );
    }
}