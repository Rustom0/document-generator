import { google } from "googleapis";
import { getAuthenticatedGoogleClient } from "./client";

export async function getGoogleDocContent(documentId: string) {
    const auth = await getAuthenticatedGoogleClient();

    const docs = google.docs({
        version: "v1",
        auth,
    });

    const response = await docs.documents.get({
        documentId,
    });

    const content = response.data.body?.content ?? [];

    let text = "";

    for (const element of content) {
        const paragraph = element.paragraph;

        if (!paragraph?.elements) {
            continue;
        }

        for (const paragraphElement of paragraph.elements) {
            const textRun = paragraphElement.textRun;

            if (textRun?.content) {
                text += textRun.content;
            }
        }
    }

    return {
        documentId,
        title: response.data.title ?? "",
        text,
    };
}