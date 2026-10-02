import { NextRequest, NextResponse } from "next/server";
import { getSpreadsheetData } from "../../../../lib/google/sheets";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: "Spreadsheet ID is required" },
                { status: 400 }
            );
        }

        const data = await getSpreadsheetData(id);

        return NextResponse.json(data);
    } catch (error) {
        console.error("REAL SPREADSHEET ERROR:", error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : String(error),
            },
            { status: 500 }
        );
    }
}