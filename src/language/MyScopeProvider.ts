import { ReferenceInfo, Scope, ScopeProvider, AstUtils, LangiumCoreServices, AstNodeDescriptionProvider,
     MapScope, EMPTY_SCOPE, DefaultScopeProvider, AstNode, Reference, AstNodeDescription } from "langium";
import { Classifier, ClassifierType, Concept, ExpressionConcept, Interface, isClassifier, isClassifierType, isClassifierTypeSpec, isConcept,
     isConceptDefinition, isConceptRule, isExpressionConcept, isFreonModel, isFretCreateExp, isFretWhereExp, isInterface, isIsUniqueRule, isModelUnit, isProjection, isTyperExp, Limited, ModelUnit, PrimitiveType, Property, 
     TypeConcept} from "./generated/ast.js";
import { visitAndMap } from "../utils/graphs.js";
import * as LANGIUM from 'langium';

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
        console.log(`getScope for ${context.property} ${context.container.$type}`)
        let result: Scope = EMPTY_SCOPE
        switch(context.property) {
            case 'propName': {
                console.log(("propName"))
                const projection = this.containerOfType(context.container, "Projection")
                if (isProjection(projection)) {
                    result = this.getProperties(projection.classifier)
                } else {
                    const scopeDef = this.containerOfType(context.container, "ConceptDefinition")
                    if (isConceptDefinition(scopeDef)) {
                        result = this.getProperties(scopeDef.cref)
                    } else {
                        const validDef = this.containerOfType(context.container, "ConceptRule")
                        if (isConceptRule(validDef)) {
                            result = this.getProperties(validDef.conceptRef)
                        } else {
                            const typeSpec = this.containerOfType(context.container, "ClassifierTypeSpec")
                            if (isClassifierTypeSpec(typeSpec)) {
                                result = this.getProperties(typeSpec.cref);
                            } else {
                                console.log("ERROR 6")
                            }
                        }
                    }
                }
                break
            }
            case 'propInstanceName': {
                console.log("propInstanceName")
                const createExp = this.containerOfType(context.container, "FretCreateExp")
                if (isFretCreateExp(createExp)) {
                    result = this.getProperties(createExp.cref)
                } else {
                    console.log("ERROR 4")
                }
                break
            }
            case 'varPropName': {
                const whereExp = this.containerOfType(context.container, "FretWhereExp")
                if (isFretWhereExp(whereExp)) {
                    result = this.getProperties(whereExp.var.cref)
                } else {
                    console.log("ERROR 2")
                }
                break
            }
            case 'nextPropName': {
                console.log("nextPropName")
                const typerExp = this.containerOfType(context.container, "TyperExp")
                if (isTyperExp(typerExp)) {
                    const previous: Property | undefined = typerExp?.propName?.ref
                    if (previous !== undefined) {
                        const previousTypeRef: ClassifierType | PrimitiveType | undefined = previous.propertyType
                        if (isClassifierType(previousTypeRef)) {
                            result = this.getProperties(previousTypeRef)
                        } else {
                            console.log("ERROR 5")
                        }
                    } else {
                        console.log("ERROR 7")
                    }
                } else {
                    console.log("ERROR 1")
                }
                break;
            }
            case 'isUniqueName': {
                console.log("isUniqueName ")
                const uniqueExp = this.containerOfType(context.container, "IsUniqueRule")
                const ruleExp = this.containerOfType(context.container, "ConceptRule")
                if (isConceptRule(ruleExp) && isIsUniqueRule(uniqueExp)) {
                    const list: Property | undefined= uniqueExp.propName?.ref
                    console.log("    isunique list " + list)
                    if (list !== undefined) {
                        const contextTypeRef: ClassifierType | PrimitiveType | undefined = list.propertyType
                        console.log("    type " + contextTypeRef)
                        if (isClassifierType(contextTypeRef)) {
                            result = this.getProperties(contextTypeRef)
                        } else {
                            console.log("ERROR 8")
                        }
                    } else {
                        console.log("ERROR 9")
                    }
                } else {
                    console.log("ERROR 33")
                }
                break
            }
            default: {
                const refpath = LANGIUM.AstUtils.getDocument(context.container).uri.fsPath
                const directory = refpath?.substring(0, refpath.lastIndexOf("/"))
                result = this.getScopeForDirectory(context, directory)
                // result = super.getScope(context)
            }
        }
        if (context.property === "conceptType") {
            if (this.containerOfType(context.container, "TypeConcept") !== undefined) {
                console.log("ADDING FreType")
                result = new MapScope(result.getAllElements().toArray().concat(this.FRE_NODE))
            }
        }
// if (result === EMPTY_SCOPE) {
        //     const refpath = LANGIUM.AstUtils.getDocument(context.container).uri.fsPath
        //     const directory = refpath?.substring(0, refpath.lastIndexOf("/"))
        //     result = this.getScopeForDirectory(context, directory)
        // }
        return result;
    }
    FRE_NODE: AstNodeDescription = {
        name: "FreType",
        documentUri: LANGIUM.URI.parse('file://freon/predefined_typper_type.type'),
        type: "TypeConcept",
        path: ""
    }

            // const instanceExpr = this.containerOfType(context.container, "InstanceExpression")
        // if (isInstanceExpression(instanceExpr)) {
        //     if (context.property="instance") {
        //         // TODO take supers of Limited into account
        //             const node: InstanceExpression = instanceExpr as InstanceExpression
        //             console.log("== node.conceptName " + node.conceptName.$refText)
        //             console.log("== node.description " + node.conceptName.$nodeDescription)
        //             const nodeRefOk = node.conceptName?.ref !== undefined
        //             const REF = node.conceptName?.ref  
        //             if (nodeRefOk && isLimited(REF)) {
        //                 const limited: Limited = node.conceptName.ref as Limited
        //                 if (limited.instances !== undefined) {
        //                     const instances: Instance[] = limited.instances
        //                     const descript: AstNodeDescription[] = instances.map(ins => this.astNodeDescriptionProvider.createDescription(ins, ins.name))
        //                     return new MapScope(descript)
        //                 }
        //             }
        //     }
        // }
        // return default


    getScopeForDirectory(context: ReferenceInfo, dir: string): Scope {
        const scopes: Array<LANGIUM.Stream<AstNodeDescription>> = [];
        const referenceType = this.reflection.getReferenceType(context);

        const precomputed = LANGIUM.AstUtils.getDocument(context.container).precomputedScopes;
        if (precomputed) {
            let currentNode: AstNode | undefined = context.container;
            do {
                const allDescriptions = precomputed.get(currentNode);
                if (allDescriptions.length > 0) {
                    scopes.push(LANGIUM.stream(allDescriptions).filter(
                        desc => this.reflection.isSubtype(desc.type, referenceType)));
                }
                currentNode = currentNode.$container;
            } while (currentNode);
        }

        let result: Scope = this.getGlobalScopeForDirectory(referenceType, context, dir);
        for (let i = scopes.length - 1; i >= 0; i--) {
            result = this.createScope(scopes[i], result);
        }
        return result;
    }

        /**
     * Create a global scope filtered for the given reference type.
     */
    protected getGlobalScopeForDirectory(referenceType: string, _context: ReferenceInfo, dir: string): Scope {

        const elements: AstNodeDescription[] = this.indexManager.allElements(referenceType).filter(elem => {
            const same = this.dir(elem) === dir
            return same
        }).toArray();
        // Since we always filter, there is no sense of having a cache for the filtered results, 
        // they will be different each time.
        // TODO:
        // - Either have a global cache with doubles,
        // - Or have a global cache per folder, in effect a collection of global caches.
        // The second will probablly give the best performance. 
        // Fort now we just clean the cache :-)
        this.globalScopeCache.delete(referenceType)
        return  this.globalScopeCache.get(referenceType, () => new MapScope(elements));
    }


    private getProperties(cref: ClassifierType) {
        const classifierReference = getClassifierType(cref);
        const classifierRef = classifierReference?.ref;
        if (isClassifier(classifierRef)) {
            const descriptions = allProperties(classifierRef).flatMap(p => (isOk(p) ? this.astNodeDescriptionProvider.createDescription(p, p.name) : []));
            if (isModelUnit(classifierRef) && !descriptions.some(d => d.name === "name")) {
                const MODELUNIT_NAME: AstNodeDescription = {
                    name: "name",
                    documentUri: LANGIUM.AstUtils.getDocument(classifierRef).uri,
                    type: "Property",
                    path: ""
                }
            
                descriptions.push(MODELUNIT_NAME )
            }
            return new MapScope(descriptions);
        }
        return EMPTY_SCOPE;
    }

    dir(desc: AstNodeDescription): string {
        const path = desc.documentUri.fsPath
        return path?.substring(0, path.lastIndexOf("/"))
    }

    /**
     * 
     * @param node Find the nearest container of type `type`.
     * @param type 
     * @returns 
     */
    containerOfType(node: AstNode, type: string): AstNode | undefined {
        let result: AstNode | undefined = node
        while (result !== undefined) {
            if (result.$type === type) {
                return result;
            }
            result = result.$container
        }
        return result
    }
}

export function     isOk(p: Property): boolean {
    return (p !== undefined && p !== null && p.name !== undefined)
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
    // console.log(`All proprties of ${classifier.name}: ${result.map(p => p.name)}`)
    return result;
}

function getClassifierType(ct: ClassifierType): Reference<Concept | ExpressionConcept | Interface | Limited | ModelUnit| TypeConcept> | undefined {
    if (ct.conceptType !== undefined) {
        return ct.conceptType
    }
    // if (ct.expressionType !== undefined) {
    //     return ct.expressionType
    // }
    // if (ct.intfaceType !== undefined) {
    //     return ct.intfaceType
    // }
    // if (ct.limitedType !== undefined) {
    //     return ct.limitedType
    // }
    // if (ct.modelunitType !== undefined) {
    //     return ct.modelunitType
    // }
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
    } else if (isModelUnit(classifier) ) {
        if (classifier.implements !== undefined) {
            for(const intface of classifier.implements.intfaces) {
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
    // console.log(`all supers of ${classifier.name} : ${result.map(r => r.name)}`)
    return result
}

/**
* 
* @param node Find the nearest container of type `type`.
* @param type 
* @returns 
*/
// function containerOfType(node: AstNode, type: string): AstNode | undefined {
//    // console.log(`containerOfType ${node.$type}`)
//    let result: AstNode | undefined = node
//    while (result !== undefined) {
//        // console.log(`    RcontainerOfType ${result.$type}`)
//        if (result.$type === type) {
//            return result;
//        }
//        result = result.$container
//    }
//    return result
// }

// export function contextProjection(context: ReferenceInfo, propName: string, containerType: string): Scope | undefined {
//     if (context.property === propName) {
//         const projection = containerOfType(context.container, containerType)
//         if ( isProjection(projection) ) {
//             const classifierReference = getClassifierType(projection.classifier)
//             const classifierRef = classifierReference?.ref
//             if (isClassifier(classifierRef)) {
//                 const descriptions = allProperties(classifierRef).flatMap(p => (isOk(p) ? this.astNodeDescriptionProvider.createDescription(p, p.name) : []));
//                 return new MapScope(descriptions)
//             }
//    }
//     }
//     return undefined
// }