import { NextResponse } from "next/server";
import { getTestTemplateDetails } from "../../../../lib/google/drive";

export async function GET() {
    try {
        const template = await getTestTemplateDetails();

        return NextResponse.json({
            template,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to access document",
            },
            { status: 500 }
        );
    }
}