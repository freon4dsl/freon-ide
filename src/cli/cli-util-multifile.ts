// FROM https://github.com/eclipse-langium/langium/blob/2a895e6b56535318fd24283cfdebc9e6838d52a5/examples/requirements/src/cli/cli-util.ts#L17
/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { LangiumDocument, LangiumCoreServices, AstNode } from 'langium';
// CHANGED import { LangiumDocument, LangiumServices } from 'langium';
import { URI } from 'vscode-uri';
// import { isTestModel, RequirementModel, TestModel } from '../language-server/generated/ast';
import { Diagnostic, WorkspaceFolder } from 'vscode-languageclient';
import { Freon, isFreon } from '../language/generated/ast.js';
// import { LangiumGrammarDefinitionProvider } from 'langium/grammar';

/**
 * Read a requirement document with the complete workspace (with requirements and
 * tests) located in the folder of the file.
 * @param fileName the main requirement model file
 * @param services the language services
 * @returns a tuple with the document indicated by the fileName and a list of
 *          documents from the workspace.
 */
export async function extractDocuments(dirName: string, services: LangiumCoreServices): Promise<LangiumDocument[]> {
    // const extensions = services.LanguageMetaData.fileExtensions;

    if (!fs.existsSync(dirName)) {
        console.error(chalk.red(`Folder ${dirName} does not exist.`));
        process.exit(1);
    }

    const folders: WorkspaceFolder[] = [{
        uri: URI.file(path.resolve(dirName)).toString(),
        name: 'main'
    }];
    await services.shared.workspace.WorkspaceManager.initializeWorkspace(folders);

    const documents = services.shared.workspace.LangiumDocuments.all.toArray();
    await services.shared.workspace.DocumentBuilder.build(documents, { validation: true });

    // documents.forEach(document=>{
    //     const validationErrors = (document.diagnostics ?? []).filter(e => e.severity === 1);
    //     if (validationErrors.length > 0) {
    //         console.error(chalk.red('There are validation errors:'));
    //         for (const validationError of validationErrors) {
    //             console.error(chalk.red(
    //                 `file ${document.uri.fsPath} line ${validationError.range.start.line + 1}: ${validationError.message} [${document.textDocument.getText(validationError.range)}]`
    //             ));
    //         }
    //         // process.exit(1);
    //     }
    // });

    return documents;
}

type ValidationError = {
    document: LangiumDocument<AstNode>,
    diagnostic: Diagnostic
}

export function validateDocuments(documents: LangiumDocument[]): ValidationError[] {
    const result: ValidationError[] = [];
    documents.forEach(document=>{
        const validationErrors = (document.diagnostics ?? []).filter(e => e.severity === 1);
        if (validationErrors.length > 0) {
            // console.error(chalk.red('There are validation errors:'));
            for (const validationError of validationErrors) {
                result.push( {document: document, diagnostic: validationError})
                // console.error(chalk.red(
                //     `file ${document.uri.fsPath} line ${validationError.range.start.line + 1}: ${validationError.message} [${document.textDocument.getText(validationError.range)}]`
                // ));
            }
            // process.exit(1);
        }
    });
    return result
}

/**
 * Read a requirement model with the test models from workspace located in the same folder.
 * @param fileName the main requirement model file
 * @param services the language services
 * @returns a tuple with the model indicated by the fileName and a list of
 *          test models from the workspace.
chr */
export async function extractFreonModels(dirName: string, services: LangiumCoreServices): Promise<Freon[]> {
    const allDocuments = await extractDocuments(dirName, services);
    validateDocuments(allDocuments)
    return  allDocuments
            .filter(d=>isFreon(d.parseResult?.value))
            .map(d=>d.parseResult?.value as Freon)
    ;
}

interface FilePathData {
    destination: string,
    name: string
}

export function extractDestinationAndName(filePath: string, destination: string | undefined): FilePathData {
    filePath = path.basename(filePath, path.extname(filePath)).replace(/[.-]/g, '');
    return {
        destination: destination ?? path.join(path.dirname(filePath), 'generated'),
        name: path.basename(filePath)
    };
}
