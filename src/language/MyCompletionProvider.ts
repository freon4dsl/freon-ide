import { AstNodeDescription, LangiumDocument, MaybePromise, ReferenceInfo, Stream } from "langium";
import { CompletionAcceptor, CompletionContext, DefaultCompletionProvider, NextFeature } from "langium/lsp";
import { CompletionParams, CancellationToken, CompletionList } from "vscode-languageserver";


export class MyCompletionProvider extends DefaultCompletionProvider {
    override async getCompletion(document: LangiumDocument, params: CompletionParams, _cancelToken?: CancellationToken): Promise<CompletionList | undefined> {

        console.log(`MyCompletionProvider ${params.context?.triggerCharacter} ${params.textDocument.uri} ${params.position.line}`)
        // return super.getCompletion(document, params, _cancelToken)
    //    const extensionIndex = params.textDocument.uri.lastIndexOf(".")
    //    const extension = params.textDocument.uri.substring(extensionIndex,  params.textDocument.uri.length)
        const result: CompletionList | undefined = await super.getCompletion(document, params, _cancelToken)
        console.log(`  result ${result?.isIncomplete} -- ${result?.items.length}`)
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

    override completionFor(context: CompletionContext, next: NextFeature, acceptor: CompletionAcceptor): MaybePromise<void> {
        console.log(`completionFor ${context.document.uri} -- ${context.node?.$type}`)
        return super.completionFor(context, next, acceptor)
    }
    override getReferenceCandidates(refInfo: ReferenceInfo, _context: CompletionContext): Stream<AstNodeDescription> {
        const result = this.scopeProvider.getScope(refInfo).getAllElements();
        console.log(`getReferenceCandidates ${refInfo.property}::${refInfo.reference?.$refText} size ${result.count()}`)
        return result
    }
}