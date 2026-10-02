"use client";

import { useEffect, useState } from "react";

interface Spreadsheet {
    id: string;
    name: string;
    webViewLink?: string | null;
    modifiedTime?: string | null;
}

interface SpreadsheetData {
    headers: string[];
    rows: Record<string, string>[];
}

interface SpreadsheetSelectorProps {
    onDataLoaded: (
        spreadsheetId: string,
        data: SpreadsheetData
    ) => void;
}

export default function SpreadsheetSelector({
    onDataLoaded,
}: SpreadsheetSelectorProps) {
    const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>(
        []
    );

    const [selectedSpreadsheet, setSelectedSpreadsheet] =
        useState("");

    const [spreadsheetData, setSpreadsheetData] =
        useState<SpreadsheetData | null>(null);

    const [loading, setLoading] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadSpreadsheets() {
            try {
                const response = await fetch("/api/spreadsheets");

                if (!response.ok) {
                    throw new Error(
                        "Failed to load spreadsheets"
                    );
                }

                const data = await response.json();

                setSpreadsheets(data.spreadsheets ?? []);
            } catch (error) {
                console.error(error);

                setError(
                    "Could not load your Google Sheets."
                );
            } finally {
                setLoading(false);
            }
        }

        loadSpreadsheets();
    }, []);

    async function handleSpreadsheetChange(
        event: React.ChangeEvent<HTMLSelectElement>
    ) {
        const spreadsheetId = event.target.value;

        setSelectedSpreadsheet(spreadsheetId);
        setSpreadsheetData(null);
        setError("");

        if (!spreadsheetId) {
            onDataLoaded("", {
                headers: [],
                rows: [],
            });

            return;
        }

        try {
            setLoadingData(true);

            const response = await fetch(
                `/api/spreadsheets/${spreadsheetId}`
            );

            if (!response.ok) {
                const data = await response.json();

                throw new Error(
                    data.error ||
                    "Failed to read spreadsheet"
                );
            }

            const data = await response.json();

            setSpreadsheetData(data);

            onDataLoaded(spreadsheetId, data);
        } catch (error) {
            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not read spreadsheet data."
            );
        } finally {
            setLoadingData(false);
        }
    }

    if (loading) {
        return <p>Loading your Google Sheets...</p>;
    }

    if (error && spreadsheets.length === 0) {
        return <p className="text-red-500">{error}</p>;
    }

    if (spreadsheets.length === 0) {
        return <p>No Google Sheets found.</p>;
    }

    const selectedSheet = spreadsheets.find(
        (spreadsheet) =>
            spreadsheet.id === selectedSpreadsheet
    );

    return (
        <div className="w-full space-y-6">
            <div className="w-full max-w-xl space-y-4">
                <label className="block text-sm font-medium">
                    Select a Google Sheet
                </label>

                <select
                    value={selectedSpreadsheet}
                    onChange={handleSpreadsheetChange}
                    className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900"
                >
                    <option value="">
                        Choose a spreadsheet...
                    </option>

                    {spreadsheets.map((spreadsheet) => (
                        <option
                            key={spreadsheet.id}
                            value={spreadsheet.id}
                        >
                            {spreadsheet.name}
                        </option>
                    ))}
                </select>

                {selectedSpreadsheet && (
                    <a
                        href={
                            selectedSheet?.webViewLink ?? "#"
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-sm underline"
                    >
                        Open selected spreadsheet
                    </a>
                )}
            </div>

            {loadingData && (
                <p className="text-sm text-gray-600">
                    Loading spreadsheet data...
                </p>
            )}

            {error && selectedSpreadsheet && (
                <p className="text-sm text-red-500">
                    {error}
                </p>
            )}

            {spreadsheetData &&
                spreadsheetData.headers.length > 0 && (
                    <div className="w-full overflow-x-auto rounded-lg border">
                        <table className="w-full min-w-max text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    {spreadsheetData.headers.map(
                                        (header) => (
                                            <th
                                                key={header}
                                                className="border-b px-4 py-3 text-left font-medium"
                                            >
                                                {header}
                                            </th>
                                        )
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {spreadsheetData.rows.map(
                                    (row, rowIndex) => (
                                        <tr key={rowIndex}>
                                            {spreadsheetData.headers.map(
                                                (header) => (
                                                    <td
                                                        key={header}
                                                        className="border-b px-4 py-3"
                                                    >
                                                        {
                                                            row[
                                                            header
                                                            ]
                                                        }
                                                    </td>
                                                )
                                            )}
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
        </div>
    );
}