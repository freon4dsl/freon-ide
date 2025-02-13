import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { clearDocuments, parseHelper } from "langium/test";
import { createFreonServices } from "../../src/language/freon-module.js";
import { FreonModel, isFreonModel } from "../../src/language/generated/ast.js";

let services: ReturnType<typeof createFreonServices>;
let parse:    ReturnType<typeof parseHelper<FreonModel>>;
let document: LangiumDocument<FreonModel> | undefined;

beforeAll(async () => {
    services = createFreonServices(EmptyFileSystem);
    parse = parseHelper<FreonModel>(services.Freon);

    // activate the following if your linking test requires elements from a built-in library, for example
    // await services.shared.workspace.WorkspaceManager.initializeWorkspace([]);
});

afterEach(async () => {
    document && clearDocuments(services.shared, [ document ]);
});

describe('Linking tests', () => {

    test('linking of greetings', async () => {
        document = await parse(`
            language Langium
            concept Aap base Noot {} 
            concept Noot {} 
            concept Mies base Aap {}
        `);

        expect(
            // here we first check for validity of the parsed document object by means of the reusable function
            //  'checkDocumentValid()' to sort out (critical) typos first,
            // and then evaluate the cross references we're interested in by checking
            //  the referenced AST element as well as for a potential error message;
            checkDocumentValid(document)
                || document.parseResult.value.concepts.map(g => g.base?.ref?.name || g.base?.error?.message).join('\n')
        ).toBe(['Noot', 'Aap']);
    });
});

function checkDocumentValid(document: LangiumDocument): string | undefined {
    return document.parseResult.parserErrors.length && s`
        Parser errors:
          ${document.parseResult.parserErrors.map(e => e.message).join('\n  ')}
    `
        || document.parseResult.value === undefined && `ParseResult is 'undefined'.`
        || !isFreonModel(document.parseResult.value) && `Root AST object is a ${document.parseResult.value.$type}, expected a '${FreonModel}'.`
        || undefined;
}
