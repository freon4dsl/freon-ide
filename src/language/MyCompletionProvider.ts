import { LangiumDocument } from "langium";
import { DefaultCompletionProvider } from "langium/lsp";
import { CompletionParams, CancellationToken, CompletionList } from "vscode-languageserver";

export class MyCompletionProvider extends DefaultCompletionProvider {
    override async getCompletion(document: LangiumDocument, params: CompletionParams, _cancelToken?: CancellationToken): Promise<CompletionList | undefined> {

        console.log("MyCompletionProvider")
        // return super.getCompletion(document, params, _cancelToken)
    //    const extensionIndex = params.textDocument.uri.lastIndexOf(".")
    //    const extension = params.textDocument.uri.substring(extensionIndex,  params.textDocument.uri.length)
        const result: CompletionList | undefined = await super.getCompletion(document, params, _cancelToken)
        if (result !== undefined) {
            for(const cp of result.items) {
                console.log(`   cp '${cp.label}' kind '${cp.kind}' doc '${cp.documentation}' detail '${cp.detail}' cmd '${cp.command}'`)
            }
        }
        // result?.items?.push({
        //     label: params.textDocument.uri
        // })
        return result;
    }
}