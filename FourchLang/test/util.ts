import * as path from "node:path";
import * as fs from "node:fs";
import * as fsAsync from "node:fs/promises";

import { URI } from 'langium';
import { EmptyFileSystem } from 'langium';
import { createFourchLangServices } from "../src/language/index.js";

export function createTestServices() {
    return createFourchLangServices(EmptyFileSystem).FourchLang;
}

/* Charge tous les fichiers .fl dans /examples */
export function loadExampleFiles(): string[] {
    const examplesRoot = path.resolve(__dirname, '../examples');

    const folders = fs.readdirSync(examplesRoot, { withFileTypes: true })
        .filter(dir => dir.isDirectory());

    return folders.flatMap(dir => {
        const folderPath = path.join(examplesRoot, dir.name);
        return fs.readdirSync(folderPath)
            .filter(f => f.endsWith('.fl'))
            .map(f => path.join(folderPath, f));
    });
}

export async function parseFromText(text: string, fakePath: string = 'file:///test.fl') {
    const services = createTestServices();

    if (!fakePath.endsWith('.fl')) {
        fakePath += '.fl';
    }

    const uri = URI.parse(fakePath);

    const doc = services.shared.workspace.LangiumDocuments.createDocument(uri, text);
    await services.shared.workspace.DocumentBuilder.build([doc], { validation: true });

    return doc;
}

export async function parseFromFile(filePath: string) {
    const services = createTestServices();
    const text = await fsAsync.readFile(filePath, 'utf-8');
    const uri = URI.file(path.resolve(filePath));

    const doc = services.shared.workspace.LangiumDocuments.createDocument(uri, text);
    await services.shared.workspace.DocumentBuilder.build([doc], { validation: true });

    return doc;
}