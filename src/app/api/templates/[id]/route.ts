import { NextRequest, NextResponse } from "next/server";
import { getGoogleDocContent } from "../../../../lib/google/docs";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: "Template ID is required" },
                { status: 400 }
            );
        }

        const document = await getGoogleDocContent(id);

        return NextResponse.json(document);
    } catch (error) {
        console.error("Failed to read Google Docs template:", error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to read Google Docs template",
            },
            { status: 500 }
        );
    }
}