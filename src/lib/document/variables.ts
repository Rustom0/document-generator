export function extractVariables(text: string): string[] {
    const matches = text.match(/{{\s*([^{}]+?)\s*}}/g) ?? [];

    const variables = matches.map((match) =>
        match
            .replace(/{{|}}/g, "")
            .trim()
    );

    return [...new Set(variables)];
}