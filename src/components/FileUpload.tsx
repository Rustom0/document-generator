"use client";

import { useState } from "react";

export default function FileUpload() {
    const [fileName, setFileName] = useState("");

    function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        if (!file) return;

        setFileName(file.name);
    }

    return (
        <div className="w-full max-w-xl space-y-4">
            <label className="block text-sm font-medium">
                Upload your spreadsheet
            </label>

            <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="block w-full rounded-lg border p-3"
            />

            {fileName && (
                <p className="text-sm text-gray-600">
                    Selected file: {fileName}
                </p>
            )}
        </div>
    );
}