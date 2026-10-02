import { google } from "googleapis";
import { getAuthenticatedGoogleClient } from "./client";

async function getOrCreateGeneratorFolder(
    drive: ReturnType<typeof google.drive>
) {
    const response = await drive.files.list({
        q:
            "name='Document Generator' " +
            "and mimeType='application/vnd.google-apps.folder' " +
            "and trashed=false",
        fields: "files(id,name)",
        spaces: "drive",
        corpora: "user",
        pageSize: 10,
    });

    const existingFolder = response.data.files?.[0];

    if (existingFolder?.id) {
        return existingFolder.id;
    }

    const folder = await drive.files.create({
        requestBody: {
            name: "Document Generator",
            mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
    });

    if (!folder.data.id) {
        throw new Error(
            "Failed to create Document Generator folder"
        );
    }

    return folder.data.id;
}

export async function generateDocument(
    templateId: string,
    documentName: string,
    replacements: Record<string, string>,
    uniqueKey: string
) {
    const auth = await getAuthenticatedGoogleClient();

    const drive = google.drive({
        version: "v3",
        auth,
    });

    const docs = google.docs({
        version: "v1",
        auth,
    });

    const folderId =
        await getOrCreateGeneratorFolder(drive);

    // Check whether this exact document was already generated
    const existing = await drive.files.list({
        q:
            `'${folderId}' in parents ` +
            "and trashed=false",
        fields:
            "files(id,name,webViewLink,appProperties)",
        spaces: "drive",
        corpora: "user",
        pageSize: 1000,
    });

    const existingDocument =
        existing.data.files?.find(
            (file) =>
                file.appProperties?.documentGeneratorKey ===
                uniqueKey
        );

    // If it already exists, don't create another copy
    if (existingDocument?.id) {
        return {
            id: existingDocument.id,
            name:
                existingDocument.name ??
                documentName,
            webViewLink:
                existingDocument.webViewLink ??
                `https://docs.google.com/document/d/${existingDocument.id}/edit`,
            created: false,
            skipped: true,
        };
    }

    // Create a new document
    const copiedFile = await drive.files.copy({
        fileId: templateId,
        requestBody: {
            name: documentName,
            parents: [folderId],
            appProperties: {
                documentGeneratorKey: uniqueKey,
            },
        },
        fields:
            "id,name,webViewLink,appProperties",
    });

    const documentId = copiedFile.data.id;

    if (!documentId) {
        throw new Error("Failed to create document");
    }

    // Replace placeholders
    const requests = Object.entries(replacements).map(
        ([variable, value]) => ({
            replaceAllText: {
                containsText: {
                    text: `{{${variable}}}`,
                    matchCase: true,
                },
                replaceText: value,
            },
        })
    );

    if (requests.length > 0) {
        await docs.documents.batchUpdate({
            documentId,
            requestBody: {
                requests,
            },
        });
    }

    return {
        id: documentId,
        name:
            copiedFile.data.name ??
            documentName,
        webViewLink:
            copiedFile.data.webViewLink ??
            `https://docs.google.com/document/d/${documentId}/edit`,
        created: true,
        skipped: false,
    };
}