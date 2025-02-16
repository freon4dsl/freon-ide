import { DefaultScopeComputation, AstNode, LangiumDocument, AstNodeDescription } from "langium";
import { Freon } from "./generated/ast.js";


export class MyScopeComputation extends DefaultScopeComputation {

    /**
     * 
     * @param document Export concepts and interfaces 
     * @returns 
     */
    override async computeExports(document: LangiumDocument<AstNode>): Promise<AstNodeDescription[]> {
        console.log("MyScopeComputation")
        const result: AstNodeDescription[] = [];
        const freon = document.parseResult.value as Freon;
        if (!!(freon.ast)) {
            result.push(...freon.ast.classifiers
                .map(p => this.descriptions.createDescription(p, p.name))
            );
            // result.push(...freon.ast.modelunits
            //     .map(p => this.descriptions.createDescription(p, p.name))
            // );
            console.log("custom computeExports")
            this.logResult(document, result)
            return result;
        } else {
            const superresult = await super.computeExports(document)
            this.logResult(document, superresult)
            return superresult
        }
    }

    logResult(document: LangiumDocument<AstNode>, list: AstNodeDescription[]) {
        console.log(`Document ${document.uri}`)
        for(const ex of list) {
            console.log(`ex: name '${ex.name}' node '${ex.node?.$type}' nameSegment '${ex.nameSegment?.length}' type '${ex.type}' path '${ex.path}'`)
        }
    }
}
