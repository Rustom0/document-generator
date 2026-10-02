"use client";

interface FieldMapperProps {
    variables: string[];
    headers: string[];
    mappings: Record<string, string>;
    onMappingChange: (
        variable: string,
        header: string
    ) => void;
}

export default function FieldMapper({
    variables,
    headers,
    mappings,
    onMappingChange,
}: FieldMapperProps) {
    const mappedCount = variables.filter(
        (variable) => mappings[variable]
    ).length;

    return (
        <div className="w-full max-w-3xl space-y-5">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Field Mapping
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Match each template field with a
                            spreadsheet column.
                        </p>
                    </div>

                </div>

                <div className="mt-6 space-y-3">
                    {variables.map((variable) => {
                        const selectedHeader =
                            mappings[variable] ?? "";

                        const isMapped =
                            selectedHeader !== "";

                        return (
                            <div
                                key={variable}
                                className={`rounded-lg border p-4 transition ${isMapped
                                    ? "border-green-200 bg-green-50"
                                    : "border-gray-200 bg-gray-50"
                                    }`}
                            >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <div className="flex min-w-48 items-center gap-3">

                                        <span className="font-medium text-gray-900">
                                            {"{{"}
                                            {variable}
                                            {"}}"}
                                        </span>
                                    </div>

                                    <span className="hidden text-gray-400 sm:block">
                                        →
                                    </span>

                                    <select
                                        value={selectedHeader}
                                        onChange={(event) =>
                                            onMappingChange(
                                                variable,
                                                event.target.value
                                            )
                                        }
                                        className="flex-1 rounded-lg border border-gray-300 bg-white p-2.5 text-gray-900 outline-none transition focus:border-black"
                                    >
                                        <option value="">
                                            Select spreadsheet column...
                                        </option>

                                        {headers.map(
                                            (header) => (
                                                <option
                                                    key={header}
                                                    value={header}
                                                >
                                                    {header}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}