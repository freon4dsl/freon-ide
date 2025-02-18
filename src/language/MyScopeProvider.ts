import { ReferenceInfo, Scope, ScopeProvider, AstUtils, LangiumCoreServices, AstNodeDescriptionProvider, MapScope, EMPTY_SCOPE, DefaultScopeProvider, AstNode, Reference } from "langium";
import { Classifier, ClassifierType, Concept, ExpressionConcept, Interface, isClassifier, isConcept, isConceptDefinition, isConceptRule, isExpressionConcept, isFreonModel, isInterface, isProjection, Limited, ModelUnit, Property } from "./generated/ast.js";
import { visitAndMap } from "../utils'/graphs.js";

export class MyScopeProvider implements ScopeProvider {
    private astNodeDescriptionProvider: AstNodeDescriptionProvider;
    constructor(services: LangiumCoreServices) {
        //get some helper services
        this.astNodeDescriptionProvider = services.workspace.AstNodeDescriptionProvider;
    }

    getScope(context: ReferenceInfo): Scope {
        // console.log(`My Scoper for ${context.property} container ${context.container?.$type}`)
        //make sure which cross-reference you are handling right now
        if(isConcept(context.container) && context.property === 'base') {
            //Success! We are handling the cross-reference of a greeting to a person!

            //get the root node of the document
            const model = AstUtils.getContainerOfType(context.container, isFreonModel)!;
            //select all persons from this document
            const concepts = model.classifiers.filter(c => isConcept(c)).map(cc => cc)
            // console.log("Concepts: " + concepts.map(i => i.kind + ":" + i.name))
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
        console.log(`========== context for property '${context.property}' + '${context.reference.$refText}' + '${context.container.$type}'`)
        if (context.property === "propName") {
            const projection = this.containerOfType(context.container, "Projection")
            // console.log(`    Projection found is ${projection} type '${projection?.$type}`)
            if (isProjection(projection)) {
                const classifierReference = getClassifierType(projection.classifier)
                // console.log(`    !!isProjection ${classifierReference?.$refText}  ${classifierReference?.ref} ${classifierReference?.error?.message} ${classifierReference?.error?.property} `)
                const classifierRef = classifierReference?.ref
                // console.log("    ClassfierRef " + classifierRef?.$type)
                if (isClassifier(classifierRef)) {
                    const descriptions = allProperties(classifierRef).map(p => this.astNodeDescriptionProvider.createDescription(p, p.name));
                    return new MapScope(descriptions)
                }
            } else {
                const scopeDef = this.containerOfType(context.container, "ConceptDefinition")
                if (isConceptDefinition(scopeDef)) {
                    const classifierReference = getClassifierType(scopeDef.cref)
                    const classifierRef = classifierReference?.ref
                    if (isClassifier(classifierRef)) {
                        const descriptions = allProperties(classifierRef).map(p => this.astNodeDescriptionProvider.createDescription(p, p.name));
                        return new MapScope(descriptions)
                    }
                } else {
                    const validDef = this.containerOfType(context.container, "ConceptRule")
                    if (isConceptRule(validDef)) {
                        const classifierReference = getClassifierType(validDef.conceptRef)
                        const classifierRef = classifierReference?.ref
                        if (isClassifier(classifierRef)) {
                            const descriptions = allProperties(classifierRef).map(p => this.astNodeDescriptionProvider.createDescription(p, p.name));
                            return new MapScope(descriptions)
                        }
                    }
                }
            }
                
        } else { 
            // const instanceExpr = this.containerOfType(context.container, "InstanceExpression")
            // if (isInstanceExpression(instanceExpr)) {
            //     if (context.property="instance") {
            //         console.log("==================== " + context.property + "  in " + instanceExpr.$type )
            //         // TODO take supers of Limited into account
            //             const node: InstanceExpression = instanceExpr as InstanceExpression
            //             console.log("== node.conceptName " + node.conceptName.$refText)
            //             console.log("== node.description " + node.conceptName.$nodeDescription)
            //             const nodeRefOk = node.conceptName?.ref !== undefined
            //             const REF = node.conceptName?.ref  
            //             if (nodeRefOk && isLimited(REF)) {
            //                 const limited: Limited = node.conceptName.ref as Limited
            //                 // console.log("==================== " + (context.reference.ref as InstanceExpression).conceptName?.ref?.conceptName?.ref)
            //                 if (limited.instances !== undefined) {
            //                     const instances: Instance[] = limited.instances
            //                     const descript: AstNodeDescription[] = instances.map(ins => this.astNodeDescriptionProvider.createDescription(ins, ins.name))
            //                     return new MapScope(descript)
            //                 }
            //             }
            //     }
            // }
        }
        // return default
        const result = super.getScope(context)
        return result
    }

    /**
     * 
     * @param node Find the nearest container of type `type`.
     * @param type 
     * @returns 
     */
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

function allProperties(classifier: Classifier | undefined): Property[] {
    if (classifier === undefined) {
        return [];
    }
    const result: Property[] = []
    result.push(...classifier.properties)
    allSuperClassifiers(classifier).forEach(cref =>
        result.push(...cref.properties)
    )
    console.log(`All proprties of ${classifier.name}: ${result.map(p => p.name)}`)
    return result;
}

function getClassifierType(ct: ClassifierType): Reference<Concept | ExpressionConcept | Interface | Limited | ModelUnit> | undefined {
    if (ct.conceptType !== undefined) {
        return ct.conceptType
    }
    if (ct.expressionType !== undefined) {
        return ct.expressionType
    }
    if (ct.intfaceType !== undefined) {
        return ct.intfaceType
    }
    if (ct.limitedType !== undefined) {
        return ct.limitedType
    }
    if (ct.modelunitType !== undefined) {
        return ct.modelunitType
    }
    return undefined
}

/**
 * Returns all super concepts, annotations and implemented interfaces of `classifier` recursively.
 * @param classifier
 */
export function allSuperClassifiers(classifier: Classifier): Classifier[] {
    return visitAndMap(superClassifiers, superClassifiers)(classifier)
}

/**
 * Returns all direct super concepts, annotations and implemented interfaces of `classifier`
 * @param classifier
 */
export function superClassifiers(classifier: Classifier): Classifier[]{
    if (classifier === undefined) {
        return [];
    }
    const result: Classifier[] = []

    if (isConcept(classifier)) {
        if (classifier.base !== undefined) {
            if (classifier.base.ref !== undefined) {
                result.push(classifier.base.ref)
            }
        }
        if (classifier.implements !== undefined) {
            if (classifier.name === 'Entity') {
                console.log("WWW Entity interfaces " + classifier.implements.intfaces)
            }
            for(const intface of classifier.implements.intfaces) {
                if (intface !== undefined && intface.ref !== undefined) {
                    result.push(intface.ref)
                }
            }
        }
    } else if (isInterface(classifier) ) {
        if (classifier.extends?.intfaces !== undefined) {
            for(const intface of classifier.extends?.intfaces) {
                if (intface !== undefined && intface.ref !== undefined) {
                    result.push(intface.ref)
                }
            }
        }
    } else if (isExpressionConcept(classifier) ) {
        if (classifier.base !== undefined) {
            if (classifier.base.ref !== undefined) {
                result.push(classifier.base.ref)
            }
        }
        if (classifier.implements !== undefined) {
            for(const intface of classifier.implements.intfaces) {
                if (intface !== undefined && intface.ref !== undefined) {
                    result.push(intface.ref)
                }
            }
        }
    }
// // } else {
    // //     throw new Error(`concept type ${typeof classifier} not handled`)
    // }
    console.log(`all supers of ${classifier.name} : ${result.map(r => r.name)}`)
    return result
}