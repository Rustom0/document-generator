import { NextResponse } from "next/server";
import { getGoogleDocsTemplates } from "@/lib/google/drive";

export async function GET() {
    try {
        const templates = await getGoogleDocsTemplates();

        return NextResponse.json({
            templates,
        });
    } catch (error) {
        console.error("Failed to load Google Docs:", error);

        return NextResponse.json(
            { error: "Failed to load Google Docs" },
            { status: 500 }
        );
    }
}