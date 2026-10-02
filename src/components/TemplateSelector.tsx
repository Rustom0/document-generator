"use client";

import { useEffect, useState } from "react";

interface Template {
    id: string;
    name: string;
    webViewLink?: string | null;
    modifiedTime?: string | null;
}

interface TemplateSelectorProps {
    onSelect: (templateId: string) => void;
}

export default function TemplateSelector({
    onSelect,
}: TemplateSelectorProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadTemplates() {
            try {
                const response = await fetch("/api/templates");

                if (!response.ok) {
                    throw new Error("Failed to load templates");
                }

                const data = await response.json();

                setTemplates(data.templates ?? []);
            } catch (error) {
                console.error(error);
                setError("Could not load your Google Docs.");
            } finally {
                setLoading(false);
            }
        }

        loadTemplates();
    }, []);

    function handleChange(
        event: React.ChangeEvent<HTMLSelectElement>
    ) {
        const templateId = event.target.value;

        setSelectedTemplate(templateId);
        onSelect(templateId);
    }

    if (loading) {
        return <p>Loading your Google Docs...</p>;
    }

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    if (templates.length === 0) {
        return <p>No Google Docs found.</p>;
    }

    return (
        <div className="w-full max-w-xl space-y-4">
            <label className="block text-sm font-medium">
                Select a Google Docs template
            </label>

            <select
                value={selectedTemplate}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900"
            >
                <option value="">
                    Choose a template...
                </option>

                {templates.map((template) => (
                    <option
                        key={template.id}
                        value={template.id}
                    >
                        {template.name}
                    </option>
                ))}
            </select>

            {selectedTemplate && (
                <a
                    href={
                        templates.find(
                            (template) =>
                                template.id === selectedTemplate
                        )?.webViewLink ?? "#"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm underline"
                >
                    Open selected template
                </a>
            )}
        </div>
    );
}