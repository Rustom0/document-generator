import { cookies } from "next/headers";
import { getGoogleOAuthClient } from "./auth";
import { verifySession } from "../auth/session";

export async function getAuthenticatedGoogleClient() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
        throw new Error("Not authenticated");
    }

    const session = await verifySession(sessionCookie.value);

    if (!session?.accessToken) {
        throw new Error("Invalid session");
    }

    const oauth2Client = getGoogleOAuthClient();

    oauth2Client.setCredentials({
        access_token: session.accessToken as string,
        refresh_token: session.refreshToken as string | undefined,
    });

    return oauth2Client;
}