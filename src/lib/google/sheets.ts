import { google } from "googleapis";
import { getAuthenticatedGoogleClient } from "./client";

export async function getSpreadsheetData(spreadsheetId: string) {
    const auth = await getAuthenticatedGoogleClient();

    const sheets = google.sheets({
        version: "v4",
        auth,
    });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Sheet1!A1:Z1000",
    });

    const rawValues = response.data.values ?? [];

    if (rawValues.length === 0) {
        return {
            headers: [],
            rows: [],
        };
    }

    // Convert every spreadsheet value to a plain string
    // so the response is always JSON serializable.
    const values: string[][] = rawValues.map((row) =>
        row.map((value) => String(value ?? "").trim())
    );

    // Find the header row automatically.
    let headerRowIndex = -1;

    for (let i = 0; i < values.length - 1; i++) {
        const currentRow = values[i];
        const nextRow = values[i + 1];

        const currentNonEmpty = currentRow.filter(
            (value) => value !== ""
        );

        const nextNonEmpty = nextRow.filter(
            (value) => value !== ""
        );

        if (
            currentNonEmpty.length >= 2 &&
            nextNonEmpty.length >= 2
        ) {
            headerRowIndex = i;
            break;
        }
    }

    // Fallback
    if (headerRowIndex === -1) {
        headerRowIndex = 0;
    }

    // Create headers
    const headers = values[headerRowIndex].map(
        (header, index) =>
            header || `Column ${index + 1}`
    );

    // Create data rows
    const rows = values
        .slice(headerRowIndex + 1)
        .filter((row) => {
            const nonEmptyValues = row.filter(
                (value) => value !== ""
            );

            // Ignore completely empty rows
            // and rows containing only one value.
            return nonEmptyValues.length >= 2;
        })
        .map((row) => {
            const rowData: Record<string, string> = {};

            headers.forEach((header, index) => {
                rowData[header] = row[index] ?? "";
            });

            return rowData;
        });

    return {
        headers,
        rows,
    };
}