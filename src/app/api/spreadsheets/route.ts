import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getAuthenticatedGoogleClient } from "../../../lib/google/client";

export async function GET() {
    try {
        const auth = await getAuthenticatedGoogleClient();

        const drive = google.drive({
            version: "v3",
            auth,
        });

        const response = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
            fields: "nextPageToken, files(id, name, webViewLink, modifiedTime)",
            pageSize: 1000,
            orderBy: "modifiedTime desc",
            spaces: "drive",
            corpora: "user",
        });

        return NextResponse.json({
            spreadsheets: response.data.files ?? [],
        });
    } catch (error) {
        console.error("Failed to load Google Sheets:", error);

        return NextResponse.json(
            { error: "Failed to load Google Sheets" },
            { status: 500 }
        );
    }
}