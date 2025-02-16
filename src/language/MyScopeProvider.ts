import { ReferenceInfo, Scope, ScopeProvider, AstUtils, LangiumCoreServices, AstNodeDescriptionProvider, MapScope, EMPTY_SCOPE, DefaultScopeProvider, AstNode, Reference } from "langium";
import { ClassifierType, Concept, Expression, Interface, isClassifier, isConcept, isFreonModel, isProjection, Limited, ModelUnit } from "./generated/ast.js";

export class MyScopeProvider implements ScopeProvider {
    private astNodeDescriptionProvider: AstNodeDescriptionProvider;
    constructor(services: LangiumCoreServices) {
        //get some helper services
        this.astNodeDescriptionProvider = services.workspace.AstNodeDescriptionProvider;
    }

    getScope(context: ReferenceInfo): Scope {
        console.log(`My Scoper for ${context.property} container ${context.container?.$type}`)
        //make sure which cross-reference you are handling right now
        if(isConcept(context.container) && context.property === 'base') {
            //Success! We are handling the cross-reference of a greeting to a person!

            //get the root node of the document
            const model = AstUtils.getContainerOfType(context.container, isFreonModel)!;
            //select all persons from this document
            const concepts = model.classifiers.filter(c => isConcept(c)).map(cc => cc)
            console.log("Concepts: " + concepts.map(i => i.kind + ":" + i.name))
            //transform them into node descriptions
            const descriptions = concepts.map(p => this.astNodeDescriptionProvider.createDescription(p, p.name));
            //create the scope
            return new MapScope(descriptions);
        }
        return EMPTY_SCOPE;
    }
}

export class MyScopeProvider2 extends DefaultScopeProvider {
    private astNodeDescriptionProvider: AstNodeDescriptionProvider;

    constructor(services: LangiumCoreServices) {
        super(services);
        //get some helper services
        this.astNodeDescriptionProvider = services.workspace.AstNodeDescriptionProvider;
    }

    override getScope(context: ReferenceInfo): Scope {
        // First see whether this is a "self.property" in the .edit file
        if (context.property === "propName") {
            console.log(`========== context for propName is property '${context.property}' + '${context.reference.$refText}'`)
            const projection = this.containerOfType(context.container, "Projection")
            console.log(`    Projection found is ${projection} type '${projection?.$type}`)
            if (isProjection(projection)) {
                const classifierReference = getClassifierType(projection.classifier)
                console.log(`    !!isProjection ${classifierReference?.$refText}  ${classifierReference?.ref} ${classifierReference?.error?.message} ${classifierReference?.error?.property} `)
                // console.log(`CT ${classifierReference.$refText} ${classifierReference.ref} ${classifierReference.error} ${classifierReference.$nodeDescription}`)
                const classifierRef = classifierReference?.ref
                console.log("    ClassfierRef " + classifierRef?.$type)
                if (isClassifier(classifierRef)) {
                    if (classifierRef === undefined || classifierRef?.properties?.length === 0) {
                        console.log("    Found concept " + classifierRef.name + " " + " NOPROPS  " + classifierRef.properties.map(p => p.name + " "))
                    } else {
                        console.log("    Found concept " + classifierRef.name + " " + " props " + classifierRef.properties.map(p => p.name + " "))
                    }
                    const descriptions = classifierRef.properties.map(p => this.astNodeDescriptionProvider.createDescription(p, p.name));
                    return new MapScope(descriptions)
                }
            }
                
        }
        // return default
        const result = super.getScope(context)
        return result
    }

    containerOfType(node: AstNode, type: string): AstNode | undefined {
        // console.log(`containerOfType ${node.$type}`)
        let result: AstNode | undefined = node
        while (result !== undefined) {
            // console.log(`    RcontainerOfType ${result.$type}`)
            if (result.$type === type) {
                return result;
            }
            result = result.$container
        }
        return result
    }
}

function getClassifierType(ct: ClassifierType): Reference<Concept | Expression | Interface | Limited | ModelUnit> | undefined {
    if (ct.conceptType !== undefined) {
        return ct.conceptType
    }
    // if (ct.expressionType !== undefined) {
    //     return ct.expressionType
    // }
    if (ct.intfaceType !== undefined) {
        return ct.intfaceType
    }
    // if (ct.limitedType !== undefined) {
    //     return ct.limitedType
    // }
    // if (ct.modelunitType !== undefined) {
    //     return ct.modelunitType
    // }
    return undefined
}
