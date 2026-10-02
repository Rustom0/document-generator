"use client";

import { useState } from "react";

import SpreadsheetSelector from "@/components/SpreadsheetSelector";
import TemplateSelector from "@/components/TemplateSelector";
import FieldMapper from "@/components/FieldMapper";
import DocumentPreview from "@/components/DocumentPreview";
import LogoutButton from "@/components/LogoutButton";

interface SpreadsheetData {
  headers: string[];
  rows: Record<string, string>[];
}

export default function Home() {
  const [spreadsheetData, setSpreadsheetData] =
    useState<SpreadsheetData | null>(null);
  const [templateId, setTemplateId] = useState("");
  const [templateText, setTemplateText] = useState("");
  const [variables, setVariables] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState("");
  const [generatedDocuments, setGeneratedDocuments] =
    useState<
      {
        name: string;
        webViewLink: string;
        created: boolean;
        skipped: boolean;
      }[]
    >([]);
  const [generationError, setGenerationError] = useState("");
  const [generationSummary, setGenerationSummary] =
    useState({
      created: 0,
      skipped: 0,
    });

  const [mappings, setMappings] =
    useState<Record<string, string>>({});

  async function handleTemplateSelect(id: string) {

    setGeneratedDocuments([]);
    setGenerationSummary({
      created: 0,
      skipped: 0,
    });
    setGenerationError("");
    setTemplateId(id);
    setTemplateText("");
    setVariables([]);
    setMappings({});

    if (!id) {
      return;
    }

    try {
      const response = await fetch(
        `/api/templates/${id}`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load template"
        );
      }

      const data = await response.json();

      const text: string = String(data.text ?? "");

      setTemplateText(text);

      const matches: string[] =
        text.match(/{{\s*([^{}]+?)\s*}}/g) ?? [];

      const detectedVariables: string[] = [];

      for (const match of matches) {
        const variable = match
          .replace(/{{|}}/g, "")
          .trim();

        if (
          variable &&
          !detectedVariables.includes(variable)
        ) {
          detectedVariables.push(variable);
        }
      }

      setVariables(detectedVariables);

      // Automatically map placeholders to matching
      // spreadsheet headers.
      if (spreadsheetData) {
        const automaticMappings: Record<
          string,
          string
        > = {};

        for (const variable of detectedVariables) {
          const matchingHeader =
            spreadsheetData.headers.find(
              (header) =>
                header
                  .trim()
                  .toLowerCase() ===
                variable
                  .trim()
                  .toLowerCase()
            );

          if (matchingHeader) {
            automaticMappings[variable] =
              matchingHeader;
          }
        }

        setMappings(automaticMappings);
      }
    } catch (error) {
      console.error(error);
    }
  }

  function handleMappingChange(
    variable: string,
    header: string
  ) {
    setMappings((currentMappings) => ({
      ...currentMappings,
      [variable]: header,
    }));
  }
  async function handleGenerate() {
    setGenerationError("");

    if (!selectedSpreadsheet) {
      setGenerationError(
        "Please select a Google Sheet first."
      );
      return;
    }

    if (!templateId) {
      setGenerationError(
        "Please select a Google Docs template first."
      );
      return;
    }

    if (
      !spreadsheetData ||
      spreadsheetData.rows.length === 0
    ) {
      setGenerationError(
        "The selected spreadsheet does not contain any data rows."
      );
      return;
    }

    const missingMappings = variables.filter(
      (variable) => !mappings[variable]
    );

    if (missingMappings.length > 0) {
      setGenerationError(
        `Please map all template fields before generating: ${missingMappings
          .map((variable) => `{{${variable}}}`)
          .join(", ")}`
      );
      return;
    }

    try {
      setGenerationProgress(0);
      setGenerating(true);
      setGenerationError("");
      setGeneratedDocuments([]);
      setGenerationSummary({
        created: 0,
        skipped: 0,
      });

      const results: {
        name: string;
        webViewLink: string;
        created: boolean;
        skipped: boolean;
      }[] = [];

      for (
        let rowIndex = 0;
        rowIndex < spreadsheetData.rows.length;
        rowIndex++
      ) {
        const row = spreadsheetData.rows[rowIndex];

        const replacements: Record<string, string> = {};

        variables.forEach((variable) => {
          const mappedHeader = mappings[variable];

          replacements[variable] = mappedHeader
            ? row[mappedHeader] ?? ""
            : "";
        });

        const position =
          replacements["Position"] || "Document";

        const company =
          replacements["Company"] || "";

        const documentName = company
          ? `Application for ${position} - ${company}`
          : `Application for ${position}`;

        // Unique identity for this spreadsheet + template + row
        const uniqueKey =
          `${selectedSpreadsheet}-${templateId}-row-${rowIndex}`;

        const response = await fetch(
          "/api/documents/generate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              templateId,
              documentName,
              replacements,
              uniqueKey,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
            "Failed to generate document"
          );
        }

        results.push(data.document);

        const progress = Math.round(
          ((rowIndex + 1) / spreadsheetData.rows.length) * 100
        );

        setGenerationProgress(progress);
      }

      setGeneratedDocuments(results);
      const createdCount = results.filter(
        (document) => document.created
      ).length;

      const skippedCount = results.filter(
        (document) => document.skipped
      ).length;

      setGenerationSummary({
        created: createdCount,
        skipped: skippedCount,
      });
    } catch (error) {
      console.error(error);

      setGenerationError(
        error instanceof Error
          ? error.message
          : "Failed to generate documents"
      );
    } finally {
      setGenerating(false);
      setGenerationProgress(0);
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-16 text-gray-900">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold">
                Document Generator
              </h1>

              <p className="text-gray-600">
                Create personalized Google Docs
                from your spreadsheet.
              </p>
            </div>

            <LogoutButton />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Step 1 */}
            <div
              className={`rounded-xl border p-5 transition ${selectedSpreadsheet
                ? "border-green-300 bg-green-50"
                : "border-gray-300 bg-white"
                }`}
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${selectedSpreadsheet
                    ? "bg-green-600 text-white"
                    : "bg-black text-white"
                    }`}
                >
                  {selectedSpreadsheet ? "✓" : "1"}
                </div>

                <h2 className="font-semibold">
                  Select Spreadsheet
                </h2>
              </div>

              <p className="text-sm text-gray-600">
                {selectedSpreadsheet
                  ? "Spreadsheet selected."
                  : "Choose the Google Sheet containing your data."}
              </p>
            </div>

            {/* Step 2 */}
            <div
              className={`rounded-xl border p-5 transition ${templateId
                ? "border-green-300 bg-green-50"
                : selectedSpreadsheet
                  ? "border-black bg-gray-50"
                  : "border-gray-300 bg-white"
                }`}
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${templateId
                    ? "bg-green-600 text-white"
                    : "bg-black text-white"
                    }`}
                >
                  {templateId ? "✓" : "2"}
                </div>

                <h2 className="font-semibold">
                  Select Template
                </h2>
              </div>

              <p className="text-sm text-gray-600">
                {templateId
                  ? "Template selected."
                  : "Choose a Google Docs template with placeholders."}
              </p>
            </div>

            {/* Step 3 */}
            <div
              className={`rounded-xl border p-5 transition ${generationSummary.created > 0 ||
                generationSummary.skipped > 0
                ? "border-green-300 bg-green-50"
                : selectedSpreadsheet &&
                  templateId &&
                  templateText &&
                  variables.length > 0
                  ? "border-black bg-gray-50"
                  : "border-gray-300 bg-white"
                }`}
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${generationSummary.created > 0 ||
                    generationSummary.skipped > 0
                    ? "bg-green-600 text-white"
                    : "bg-black text-white"
                    }`}
                >
                  {generationSummary.created > 0 ||
                    generationSummary.skipped > 0
                    ? "✓"
                    : "3"}
                </div>

                <h2 className="font-semibold">
                  Map & Generate
                </h2>
              </div>

              <p className="text-sm text-gray-600">
                {generationSummary.created > 0 ||
                  generationSummary.skipped > 0
                  ? "Documents generated successfully."
                  : selectedSpreadsheet &&
                    templateId &&
                    templateText &&
                    variables.length > 0
                    ? "Ready to map fields and generate."
                    : "Map your fields, preview, and generate documents."}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-900">
              1. Select Spreadsheet
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Choose the Google Sheet containing the data you want to use.
            </p>
          </div>

          <SpreadsheetSelector
            onDataLoaded={(spreadsheetId, data) => {
              setSelectedSpreadsheet(spreadsheetId);
              setSpreadsheetData(data);

              setGeneratedDocuments([]);
              setGenerationSummary({
                created: 0,
                skipped: 0,
              });
              setGenerationError("");
            }}
          />
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-900">
              2. Select Template
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Choose the Google Docs template containing your placeholders.
            </p>
          </div>

          <TemplateSelector
            onSelect={handleTemplateSelect}
          />
        </div>

        {selectedSpreadsheet &&
          templateId &&
          spreadsheetData &&
          templateText &&
          variables.length > 0 && (
            <>
              <FieldMapper
                variables={variables}
                headers={spreadsheetData.headers}
                mappings={mappings}
                onMappingChange={handleMappingChange}
              />

              {spreadsheetData.rows.length > 0 && (
                <DocumentPreview
                  templateText={templateText}
                  row={spreadsheetData.rows[0]}
                  variables={variables}
                  mappings={mappings}
                />
              )}

              <div className="w-full max-w-3xl rounded-xl border bg-gray-50 p-5">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {generating
                          ? "Generating documents..."
                          : "Ready to generate?"}
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        {generating
                          ? `Creating document ${Math.ceil(
                            (generationProgress / 100) *
                            (spreadsheetData?.rows.length ?? 0)
                          )} of ${spreadsheetData?.rows.length ?? 0
                          }...`
                          : "Your mapped fields will be used to create a personalized Google Doc for each spreadsheet row."}
                      </p>
                    </div>

                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="shrink-0 rounded-lg bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {generating
                        ? `${generationProgress}%`
                        : "Generate Documents"}
                    </button>
                  </div>

                  {generating && (
                    <div className="space-y-2">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-black transition-all duration-300"
                          style={{
                            width: `${generationProgress}%`,
                          }}
                        />
                      </div>

                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Generating...</span>
                        <span>{generationProgress}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {generationError && (
                <p className="text-sm text-red-500">
                  {generationError}
                </p>
              )}

              {(generationSummary.created > 0 ||
                generationSummary.skipped > 0) && (
                  <div className="w-full max-w-4xl space-y-6">
                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">
                            Generation complete
                          </h2>

                          <p className="mt-1 text-sm text-gray-500">
                            Your documents have been processed.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-lg border bg-green-50 p-4">
                          <p className="text-sm text-green-700">
                            New documents
                          </p>

                          <p className="mt-1 text-2xl font-bold text-green-700">
                            {generationSummary.created}
                          </p>

                          <p className="text-xs text-green-600">
                            Created
                          </p>
                        </div>

                        <div className="rounded-lg border bg-gray-50 p-4">
                          <p className="text-sm text-gray-600">
                            Duplicates
                          </p>

                          <p className="mt-1 text-2xl font-bold text-gray-700">
                            {generationSummary.skipped}
                          </p>

                          <p className="text-xs text-gray-500">
                            Skipped
                          </p>
                        </div>

                        <div className="rounded-lg border bg-blue-50 p-4">
                          <p className="text-sm text-blue-700">
                            Total processed
                          </p>

                          <p className="mt-1 text-2xl font-bold text-blue-700">
                            {generationSummary.created +
                              generationSummary.skipped}
                          </p>

                          <p className="text-xs text-blue-600">
                            Documents
                          </p>
                        </div>
                      </div>
                    </div>

                    {generatedDocuments.length > 0 && (
                      <div className="rounded-xl border bg-white p-6 shadow-sm">
                        <div className="mb-5">
                          <h2 className="text-xl font-semibold text-gray-900">
                            Generated Documents
                          </h2>

                          <p className="mt-1 text-sm text-gray-500">
                            Open any document below in Google Docs.
                          </p>
                        </div>

                        <div className="space-y-3">
                          {generatedDocuments.map(
                            (document, index) => (
                              <div
                                key={`${document.name}-${index}`}
                                className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-gray-900">
                                    {document.name}
                                  </p>

                                  {document.created ? (
                                    <p className="mt-1 text-sm text-green-600">
                                      ✓ New document created
                                    </p>
                                  ) : document.skipped ? (
                                    <p className="mt-1 text-sm text-gray-500">
                                      ↩ Duplicate skipped
                                    </p>
                                  ) : null}
                                </div>

                                <a
                                  href={document.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                                >
                                  Open Document
                                </a>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </>
          )}
      </div>
    </main>
  );
}