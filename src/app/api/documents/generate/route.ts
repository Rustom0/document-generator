import { NextRequest, NextResponse } from "next/server";
import { generateDocument } from "@/lib/google/generator";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            templateId,
            documentName,
            replacements,
            uniqueKey,
        } = body;

        if (!templateId) {
            return NextResponse.json(
                { error: "Template ID is required" },
                { status: 400 }
            );
        }

        if (!documentName) {
            return NextResponse.json(
                { error: "Document name is required" },
                { status: 400 }
            );
        }

        if (!replacements) {
            return NextResponse.json(
                { error: "Replacements are required" },
                { status: 400 }
            );
        }

        if (!uniqueKey) {
            return NextResponse.json(
                { error: "Unique key is required" },
                { status: 400 }
            );
        }

        const document = await generateDocument(
            templateId,
            documentName,
            replacements,
            uniqueKey
        );

        return NextResponse.json({
            success: true,
            document,
        });
    } catch (error) {
        console.error(
            "Document generation error:",
            error
        );

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to generate document",
            },
            { status: 500 }
        );
    }
}