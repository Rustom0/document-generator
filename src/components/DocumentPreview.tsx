"use client";

interface DocumentPreviewProps {
    templateText: string;
    row: Record<string, string>;
    variables: string[];
    mappings: Record<string, string>;
}

export default function DocumentPreview({
    templateText,
    row,
    variables,
    mappings,
}: DocumentPreviewProps) {
    function generatePreview() {
        let result = templateText;

        variables.forEach((variable) => {
            const mappedHeader = mappings[variable];

            const value = mappedHeader
                ? row[mappedHeader] ?? ""
                : "";

            const placeholderRegex = new RegExp(
                `{{\\s*${variable.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                )}\\s*}}`,
                "g"
            );

            result = result.replace(
                placeholderRegex,
                value
            );
        });

        return result;
    }

    return (
        <div className="w-full max-w-3xl space-y-4">
            <div>
                <h2 className="text-xl font-semibold text-gray-900 ">
                    Document Preview
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    Preview using the first row of your spreadsheet.
                </p>
            </div>

            <div className="rounded-xl border bg-gray-100 p-4 shadow-sm sm:p-8">
                <div className="min-h-96 rounded-lg bg-white p-6 shadow-sm sm:p-10">
                    <div className="whitespace-pre-wrap text-sm leading-7 text-gray-800">
                        {generatePreview()}
                    </div>
                </div>
            </div>
        </div>
    );
}