import type { AstNode, LangiumCoreServices, LangiumDocument } from 'langium';
import chalk from 'chalk';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { URI } from 'langium';

export async function extractDocument(
    fileName: string,
    services: LangiumCoreServices
): Promise<LangiumDocument> {

    const extensions = services.LanguageMetaData.fileExtensions;
    const ext = path.extname(fileName);

    // ✘ Mauvaise extension
    if (!extensions.includes(ext)) {
        throw new Error(
            `Invalid file extension "${ext}". Expected one of: ${extensions.join(", ")}`
        );
    }

    // ✘ Fichier inexistant
    if (!fs.existsSync(fileName)) {
        throw new Error(`File "${fileName}" does not exist.`);
    }

    // Lecture + parsing Langium
    const document = await services.shared.workspace.LangiumDocuments.getOrCreateDocument(
        URI.file(path.resolve(fileName))
    );

    await services.shared.workspace.DocumentBuilder.build([document], {
        validation: true
    });

    // Diagnostics de validation
    const validationErrors = (document.diagnostics ?? []).filter(
        e => e.severity === 1 // erreur
    );

    if (validationErrors.length > 0) {
        const formatted = validationErrors
            .map(e =>
                `line ${e.range.start.line + 1}: ${e.message} [${document.textDocument.getText(e.range)}]`
            )
            .join("\n");

        console.error(chalk.red("Validation errors:\n" + formatted));
        throw new Error("Validation failed");
    }

    return document;
}

export async function extractAstNode<T extends AstNode>(
    fileName: string,
    services: LangiumCoreServices
): Promise<T> {
    return (await extractDocument(fileName, services)).parseResult?.value as T;
}

interface FilePathData {
    destination: string;
    name: string;
}

export function extractDestinationAndName(destination: string): FilePathData {
    return {
        destination: path.dirname(destination),
        name: path.basename(destination)
    };
}