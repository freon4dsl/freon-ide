import { DefaultScopeComputation, AstNode, LangiumDocument, AstNodeDescription } from "langium";
import { Classifier, ExternalDeclaration, Freon, Instance, isLimited, Limited } from "./generated/ast.js";
// import { isOk } from "./MyScopeProvider.js";


export class MyScopeComputation extends DefaultScopeComputation {

    /**
     * 
     * @param document Export concepts and interfaces 
     * @returns 
     */
    override async computeExports(document: LangiumDocument<AstNode>): Promise<AstNodeDescription[]> {
        // console.log("MyScopeComputation.computeExports for " + document.uri)
        const result: AstNodeDescription[] = [];
        const freon = document.parseResult.value as Freon;
        if (freon.ast !== null && freon.ast !== undefined) {
            result.push(...freon.ast.classifiers
                .flatMap(p => (classifierHasName(p) ? this.descriptions.createDescription(p, p.name) : []))
            );
            const instances = freon.ast.classifiers.filter(c => isLimited(c)).flatMap(lim => (lim as Limited).instances)
            result.push( ...instances.flatMap(p => (instanceHasName(p) ? this.descriptions.createDescription(p, p.name) : [])))
            this.logResult(document, result)
            return result;
        } else if (freon.edit!== null) {
            const external: ExternalDeclaration[] | undefined = freon.edit?.globals?.flatMap(glob => (glob?.externals ? glob.externals : []))
            if (external !== undefined) {
                result.push(...external.map(ext => this.descriptions.createDescription(ext, ext.name)))
            }
            const superresult = await super.computeExports(document)
            result.push(...superresult)
            return result;
        } else {
            const superresult = await super.computeExports(document)
            this.logResult(document, superresult)
            return superresult
        }
    }

    logResult(document: LangiumDocument<AstNode>, list: AstNodeDescription[]) {
        // console.log(`computeExports for document ${document.uri}`)
        // for(const ex of list) {
        //     console.log(`ex: name '${ex.name}' node '${ex.node?.$type}' nameSegment '${ex.nameSegment?.length}' type '${ex.type}' path '${ex.path}'`)
        // }
    }
}

function classifierHasName(c: Classifier): boolean {
    return c !== null && c !== undefined && c.name !== undefined 
}
function instanceHasName(c: Instance): boolean {
    return c !== null && c !== undefined && c.name !== undefined 
}
