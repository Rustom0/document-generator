import { google } from "googleapis";
import { getAuthenticatedGoogleClient } from "./client";

export async function getGoogleDocsTemplates() {
    const auth = await getAuthenticatedGoogleClient();

    const drive = google.drive({
        version: "v3",
        auth,
    });

    // Find the Document Generator folder
    const folderResponse = await drive.files.list({
        q:
            "name='Document Generator' " +
            "and mimeType='application/vnd.google-apps.folder' " +
            "and trashed=false",
        fields: "files(id,name)",
        spaces: "drive",
        corpora: "user",
        pageSize: 10,
    });

    const generatorFolderId =
        folderResponse.data.files?.[0]?.id;

    // Build the query for Google Docs templates
    let query =
        "mimeType='application/vnd.google-apps.document' " +
        "and trashed=false";

    // Exclude documents inside Document Generator
    if (generatorFolderId) {
        query += ` and not '${generatorFolderId}' in parents`;
    }

    const response = await drive.files.list({
        q: query,
        fields:
            "nextPageToken, files(id,name,webViewLink,modifiedTime)",
        pageSize: 1000,
        orderBy: "modifiedTime desc",
        spaces: "drive",
        corpora: "user",
    });

    return response.data.files ?? [];
}
export async function getTestTemplateDetails() {
    const auth = await getAuthenticatedGoogleClient();

    const drive = google.drive({
        version: "v3",
        auth,
    });

    const response = await drive.files.get({
        fileId: "1aU6iRoTZSURGBqEZPfcT7A6xxUvoPY75C4Gf4d2d_G4",
        fields:
            "id,name,mimeType,parents,driveId,spaces,owners,permissions,capabilities,createdTime,modifiedTime",
    });

    return response.data;
}