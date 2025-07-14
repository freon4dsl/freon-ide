import { ReferenceInfo, Scope, ScopeProvider, AstUtils, LangiumCoreServices, AstNodeDescriptionProvider,
     MapScope, EMPTY_SCOPE, DefaultScopeProvider, AstNode, Reference, AstNodeDescription } from "langium";
import { Classifier, ClassifierType, ClassifierTypeSpec, Concept, ExpressionConcept, Instance, Interface, isClassifier, isClassifierType, isClassifierTypeSpec, isConcept,
        isConceptDefinition, isConceptRule, isDotExpression, isScoperDotExpression, isExpressionConcept, isFreonModel, isFretCreateExp, isFretWhereExp, isInterface,
         isIsUniqueRule, isLimited, isLimitedValueExpression, isModelUnit, isProjection, Limited, LimitedType, ModelUnit, PrimitiveType, Property, 
     TypeConcept,
     isAppliedExpression,
     ScoperDotExpression} from "./generated/ast.js";
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
        // console.log(`getScope for ${context.property} ${context.container.$type}`)
        let result: Scope = EMPTY_SCOPE
        switch(context.property) {
            case 'propName': {
                // console.log(("propName"))
                const projection = this.containerOfType(context.container, "Projection")
                if (isProjection(projection)) {
                    result = this.getProperties(projection.classifier)
                } else {
                    const scopeDef = this.containerOfType(context.container, "ConceptDefinition")
                    if (isConceptDefinition(scopeDef)) {
                        // Check whether this propName comes after a dot
                        const dotExp = this.containerOfType(context.container, "ScoperDotExpression")
                        if (isScoperDotExpression(dotExp)) {
                            result = this.getScopeFromDotExpression(dotExp, context);
                        }
                        else {
                            result = this.getProperties(scopeDef.cref)
                        }
                    } else {
                        const validDef = this.containerOfType(context.container, "ConceptRule")
                        if (isConceptRule(validDef)) {
                            result = this.getProperties(validDef.conceptRef)
                        } else {
                            const typeSpec = this.containerOfType(context.container, "ClassifierTypeSpec") as ClassifierTypeSpec
                            // console.log("ClassifierTypeSpec for property propName: " + typeSpec)
                            if (isClassifierTypeSpec(typeSpec)) {
                                result = this.getProperties(typeSpec.cref);
                            } else {
                                console.log(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected Projection, ConceptDefinition, ConceptRule or ClassifierTypeSpec for 'propName'`)
                            }
                        }
                    }
                }
                break
            }
            case 'propInstanceName': {
                // console.log("propInstanceName")
                const createExp = this.containerOfType(context.container, "FretCreateExp")
                if (isFretCreateExp(createExp)) {
                    result = this.getProperties(createExp.cref)
                } else {
                    console.log(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: expected Create Expression for 'propInstanceName'`)
                }
                break
            }
            case 'varPropName': {
                const whereExp = this.containerOfType(context.container, "FretWhereExp")
                if (isFretWhereExp(whereExp)) {
                    result = this.getProperties(whereExp.var.cref)
                } else {
                    console.log(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected Where Expression for 'varPropName'`)
                }
                break
            }
            case 'nextPropName': {
                // console.log("nextPropName")
                const typerExp = this.containerOfType(context.container, "DotExpression")
                if (isDotExpression(typerExp)) {
                    const previous: Property | undefined = typerExp?.propName?.ref
                    if (previous !== undefined) {
                        const previousTypeRef: ClassifierType | PrimitiveType | undefined = previous.propertyType
                        if (isClassifierType(previousTypeRef)) {
                            result = this.getProperties(previousTypeRef)
                        } else {
                            console.log(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected previous property type to be a Classifier for 'nextPropName'`)
                        }
                    } else {
                        console.log(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected previous PropertyRef for 'nextPropName'`)
                    }
                } else {
                    console.log(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected DotExpression for 'nextPropName'`)
                }
                break;
            }
            case 'isUniqueName': {
                // console.log("isUniqueName ")
                const uniqueExp = this.containerOfType(context.container, "IsUniqueRule")
                const ruleExp = this.containerOfType(context.container, "ConceptRule")
                if (isConceptRule(ruleExp) && isIsUniqueRule(uniqueExp)) {
                    const list: Property | undefined = uniqueExp.propName?.ref
                    if (list !== undefined) {
                        const contextTypeRef: ClassifierType | PrimitiveType | undefined = list.propertyType
                        if (isClassifierType(contextTypeRef)) {
                            result = this.getProperties(contextTypeRef)
                        } else {
                            console.log(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected ClassifierType for 'isUniqueName'`)
                        }
                    } else {
                        console.log(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected Property for 'isUniqueName', propName is ${uniqueExp.propName} `)
                        console.log(`context ${context.container?.$cstNode?.length}, ${context.container?.$cstNode?.offset}, ${context.container?.$cstNode?.range}, ${context.container?.$cstNode?.end}`)
                    }
                } else {
                    console.log(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected IsUniqueRule and ConceptRule for 'isUniqueName'`)
                }
                break
            }
            case 'limitedInstance': { // limited instance reference in typer
                const limitedValueExpression = this.containerOfType(context.container, "LimitedValueExpression")
                if (isLimitedValueExpression(limitedValueExpression)) {
                    const cref = limitedValueExpression.cref
                    if (cref !== undefined) {
                        result = this.getInstances(cref)
                    }
                } else {
                    // simple limited instance in FretLimitedRule
                    const typeSpec = this.containerOfType(context.container, "ClassifierTypeSpec")
                    if (isClassifierTypeSpec(typeSpec)) {
                        // console.log(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: typespec ${typeSpec.cref?.conceptType}`)
                        if (isLimited(typeSpec.cref?.conceptType?.ref)) {
                            // console.log("LIMITED~")
                            result = this.getLimitedInstances(typeSpec.cref?.conceptType?.ref)
                        }
                    } else {
                        console.log(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected LimitedValueExpression for 'limitedInstance'`)
                    }
                }
                break
            }
            default: {
                const refpath = LANGIUM.AstUtils.getDocument(context.container).uri.path
                const directory = refpath?.substring(0, refpath.lastIndexOf("/"))
                result = this.getScopeForDirectory(context, directory)
                // result = super.getScope(context)
            }
        }
        if (context.property === "conceptType") {
            if (this.containerOfType(context.container, "TypeConcept") !== undefined) {
                // console.log("ADDING FreType")
                result = new MapScope(result.getAllElements().toArray().concat(this.FRE_NODE))
            }
        }
        return result;
    }
    FRE_NODE: AstNodeDescription = {
        name: "FreType",
        documentUri: LANGIUM.URI.parse('file://freon/predefined_typper_type.type'),
        type: "TypeConcept",
        path: ""
    }

    // Get the scope for the dot expression in the ConceptDefinition of the Freon scoper 
    // (And later: in the ConceptRule of the Freon validator)
    private getScopeFromDotExpression(dotExp: ScoperDotExpression, context: ReferenceInfo) {
        let result: Scope = EMPTY_SCOPE
        const appliedExp = this.containerOfType(dotExp, "AppliedExpression");
        if (isAppliedExpression(appliedExp)) {
            const referencedProperty: Property | undefined = appliedExp?.propName?.ref;
            if (referencedProperty !== undefined) {
                const referencedType: ClassifierType | PrimitiveType | undefined = referencedProperty.propertyType;
                if (isClassifierType(referencedType)) {
                    result = this.getProperties(referencedType);
                } else {
                    console.log(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected referenced property type to be a Classifier for 'afterDotExp'`);
                }
            } else if (appliedExp?.appliedKwd !== undefined) {
                switch (appliedExp?.appliedKwd) {
                    case 'self': {
                        const conceptDef = this.containerOfType(appliedExp, "ConceptDefinition");
                        if (isConceptDefinition(conceptDef)) {
                            result = this.getProperties(conceptDef?.cref);
                        }
                        break;
                    }
                    case 'if': {
                        const typeParam = appliedExp?.typeParam;
                        if (typeParam !== undefined) {
                            result = this.getProperties(typeParam);
                        }
                        break;
                    }
                    case 'owner': {
                        const conceptDef = this.containerOfType(appliedExp, "ConceptDefinition")
                        if (isConceptDefinition(conceptDef)) {
                            const conceptNode = conceptDef?.cref?.conceptType.ref
                            // Find owners of this concept:  classifiers that have it as a property
                            if (conceptNode !== undefined) {
                                const ownerCandidates = AstUtils.findLocalReferences(conceptNode);
                                ownerCandidates.forEach((oc) => {
                                    if (oc.$refNode?.astNode !== undefined && isClassifierType(oc.$refNode?.astNode)) {
                                        const propertyNode = this.containerOfType(oc.$refNode?.astNode, "Property");                                        
                                        if (propertyNode !== undefined && !(propertyNode as Property).reference) {
                                            console.log(`Debug referencing property: ${propertyNode?.$document}`);
                                            const classifierNode = propertyNode.$container;
                                            result = this.appendScopes(result, this.getPropertiesOfClassifier(classifierNode as Classifier));
                                        }
                                    }
                                })                                
                            }
                            else {
                                console.log(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected to find Classifier node for the ClassifierDefinition`);
                            }
                        }
                        break;
                    }
                    // There is no case of `type`, as type() may not be followed by '.'
                    default:
                        console.log(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected one of the special keywords, but got ${appliedExp?.appliedKwd}`);
                }
            } else {
                console.log(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected property reference or a special keyword for 'afterDotExp'`);
            }
        } else {
            console.log(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected AppliedExpression for 'afterDotExp'`);
        }
        return result;
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

        // TODO Find the uri's of the files in the current directory first and give that as secpond parameter to the indexManager.allElemen(tS9)...)
        
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

    private getProperties(cref: ClassifierType, log: boolean = false): Scope {
        const classifierReference = getClassifierType(cref);
        const classifierRef = classifierReference?.ref;
        if (isClassifier(classifierRef)) {
            const descriptions = allProperties(classifierRef).flatMap(p => (isOk(p) ? this.astNodeDescriptionProvider.createDescription(p, p.name) : []));
            if (log) {
                console.log("   getProperties isClassifier:     " + descriptions.map(d => d.name).join(", "))
            }
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
        if (log) {
            console.log("   getProperties is NOT Classifier ================================ ")
        }
        return EMPTY_SCOPE;
    }

    private getPropertiesOfClassifier(classifier: Classifier, log: boolean = false): Scope {        
        if (isClassifier(classifier)) {
            const descriptions = allProperties(classifier).flatMap(p => (isOk(p) ? this.astNodeDescriptionProvider.createDescription(p, p.name) : []));
            if (log) {
                console.log("   getProperties isClassifier:     " + descriptions.map(d => d.name).join(", "))
            }
            if (isModelUnit(classifier) && !descriptions.some(d => d.name === "name")) {
                const MODELUNIT_NAME: AstNodeDescription = {
                    name: "name",
                    documentUri: LANGIUM.AstUtils.getDocument(classifier).uri,
                    type: "Property",
                    path: ""
                }
            
                descriptions.push(MODELUNIT_NAME )
            }
            return new MapScope(descriptions);
        }
        if (log) {
            console.log("   getProperties is NOT Classifier ================================ ")
        }
        return EMPTY_SCOPE;
    }

    private appendScopes(scope1: Scope, scope2: Scope): Scope {
        return new MapScope(scope1.getAllElements().concat(scope2.getAllElements()));
    }

    private getInstances(lt: LimitedType, log: boolean = false): Scope {
        const limitedReference = lt.conceptType;
        const limitedRef = limitedReference?.ref;
        if (isLimited(limitedRef)) {
            const descriptions = allInstances(limitedRef).flatMap(p => (isOkInstance(p) ? this.astNodeDescriptionProvider.createDescription(p, p.name) : []));
            if (log) {
                console.log("   getInstances:     " + descriptions.map(d => d.name).join(", "))
            }
            return new MapScope(descriptions);
        }
        if (log) {
            console.log("   getIntsancesis NOT Classifier ================================ ")
        }
        return EMPTY_SCOPE;       
    }
    private getLimitedInstances(lt: Limited, log: boolean = false): Scope {
        const descriptions = allInstances(lt).flatMap(p => (isOkInstance(p) ? this.astNodeDescriptionProvider.createDescription(p, p.name) : []));
        if (log) {
            console.log("   getInstances:     " + descriptions.map(d => d.name).join(", "))
        }
        return new MapScope(descriptions);
    }
    
    dir(desc: AstNodeDescription): string {
        const path = desc.documentUri.path
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
export function     isOkInstance(p: Instance): boolean {
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

function allInstances(limited: Limited | undefined): Instance[] {
    if (limited === undefined) {
        return [];
    }
    const result: Instance[] = []
    result.push(...limited.instances)
    allSuperClassifiers(limited).forEach(cref => {
        if (isLimited(cref)) {
            result.push(...cref.instances)
        }
    })
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