// test-utils.ts
import fs from 'node:fs/promises';
import { URI } from 'langium';
import { EmptyFileSystem } from 'langium';
import path from 'node:path';
import { createFourchLangServices } from '../src/fourch-lang-module.js';

export async function parseFromFile(filePath: string) {
    const services = createFourchLangServices(EmptyFileSystem);
    const text = await fs.readFile(filePath, 'utf-8');
    const uri = URI.file(path.resolve(filePath));

    const document = services.shared.workspace.LangiumDocuments.createDocument(uri, text);

    await services.shared.workspace.DocumentBuilder.build([document], {
        validation: true
    });

    return document;
}

export async function parseFromText(text: string, fakePath = 'memory://test.fl') {
    const services = createFourchLangServices(EmptyFileSystem);
    const uri = URI.parse(fakePath); // URI for in-memory document

    const document = services.shared.workspace.LangiumDocuments.createDocument(uri, text);

    await services.shared.workspace.DocumentBuilder.build([document], {
        validation: true
    });

    return document;
}