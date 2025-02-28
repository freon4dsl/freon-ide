import { beforeAll, describe, expect, test, assert } from "vitest";
import { type LangiumDocument } from "langium";
import { parseHelper } from "langium/test";
import { createFreonServices } from "../src/language/freon-module.js";
import { Freon, Model } from "../src/language/generated/ast.js";
import { extractDocuments, extractFreonModels } from "../src/cli/cli-util-multifile.js";
import { NodeFileSystem } from "langium/node";
import { ConfigType, getConfig } from "./text-config.js";

// let services: ReturnType<typeof createFreonServices>;
let parse:    ReturnType<typeof parseHelper<Model>>;
let document: LangiumDocument<Model> | undefined;

// sm.install()

let config: ConfigType = getConfig();
const services = createFreonServices(NodeFileSystem).Freon;

beforeAll(async () => {
    // parse = parseHelper<Model>(services.Freon);

    // activate the following if your linking test requires elements from a built-in library, for example
    // await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
});

// Run all, tests with and without history

config.repositories.forEach(repo => {
    repo.languages.forEach(language => {
        describe(`Parsing tests for repo ${repo.target} language ${language}`, () => {

            test(`parse ${language}`, async () => {
                const documents = await extractDocuments(`${repo.target}/${language}`, services)
                documents.forEach(doc => {
                    const diags = doc.diagnostics
                    if (diags !== undefined && diags.length > 0) {
                        diags.forEach(diag => {
                            console.error(`=============== ${doc.uri} ${diag.range.start.line}-${diag.range.start.character}: ${diag.message}`)
                            // assert(false, `${doc.uri} ${diag.range.start.line}-${diag.range.start.character}: ${diag.message}`)
                        })
                    }
                });
            });
        });
        })
})




