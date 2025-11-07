import { ReferenceInfo, Scope, 
    // AstUtils,
     LangiumCoreServices, AstNodeDescriptionProvider,
     MapScope, EMPTY_SCOPE, DefaultScopeProvider, AstNode, Reference, AstNodeDescription } from "langium";
import { Classifier, ClassifierType, ClassifierTypeSpec, Concept, ExpressionConcept, Instance, Interface, isClassifier, isClassifierType, isClassifierTypeSpec, isConcept,
        isConceptDefinition, isConceptRule, isDotExpression, isScoperDotExpression, isExpressionConcept, isFretCreateExp, isFretWhereExp, isInterface,
         isIsUniqueRule, isLimited, isLimitedValueExpression, isModelUnit, isProjection, Limited, LimitedType, ModelUnit, PrimitiveType, Property, 
     TypeConcept,
     isAppliedExpression,
     ScoperDotExpression,
     Model,
     isModel,
    //  isFreonModel,
     AppliedExpression,
     isFreonModel} from "./generated/ast.js";
import { visitAndMap } from "../utils/graphs.js";
import * as LANGIUM from 'langium';
// import { dot } from "node:test/reporters";

const on: boolean = false
let i = 1;
function LOG(msg: string) {
    if (on) {
        console.log(i + " " + msg)
    }
}

export class FreonScopeProvider extends DefaultScopeProvider {
    private astNodeDescriptionProvider: AstNodeDescriptionProvider;

    constructor(services: LangiumCoreServices) {
        super(services);
        //get some helper services
        this.astNodeDescriptionProvider = services.workspace.AstNodeDescriptionProvider;
    }

    override getScope(context: ReferenceInfo): Scope {
        LOG(`getScope for ${context.property} ${context.container.$type}`)
        let result: Scope = EMPTY_SCOPE
        switch(context.property) {
            case 'propName': {
                LOG((`getScope propName ${context.property}`))
                const projection = this.containerOfType(context.container, "Projection")
                if (isProjection(projection)) {
                    result = this.getProperties(projection.classifier)
                } else {
                    const scopeDef = this.containerOfType(context.container, "ConceptDefinition")
                    if (isConceptDefinition(scopeDef)) {
                        // Check whether this propName comes after a dot
                        const dotExp = this.containerOfType(context.container, "ScoperDotExpression")
                        if (isScoperDotExpression(dotExp)) {
                            LOG(`Scoper calling getClassifierForDotExpression !!! `)
                            const classifier = this.getClassifierForDotExpression(dotExp);
                            if (classifier !== undefined) {
                                result = this.getPropertiesOfClassifier(classifier)
                            } else {
                                LOG(`getScope 8 result from getScopeFromDotExpression is undefined`)
                            }
                        } else {
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
                                LOG(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected Projection, ConceptDefinition, ConceptRule or ClassifierTypeSpec for 'propName'`)
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
                    LOG(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: expected Create Expression for 'propInstanceName'`)
                }
                break
            }
            case 'varPropName': {
                const whereExp = this.containerOfType(context.container, "FretWhereExp")
                if (isFretWhereExp(whereExp)) {
                    result = this.getProperties(whereExp.var.cref)
                } else {
                    LOG(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected Where Expression for 'varPropName'`)
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
                            LOG(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected previous property type to be a Classifier for 'nextPropName'`)
                        }
                    } else {
                        LOG(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected previous PropertyRef for 'nextPropName'`)
                    }
                } else {
                    LOG(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected DotExpression for 'nextPropName'`)
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
                            LOG(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected ClassifierType for 'isUniqueName'`)
                        }
                    } else {
                        // The error below only seem to happen iof there is no .ast file, therefore commenting them.
                        // console.log(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected Property for 'isUniqueName', propName is ${uniqueExp.propName} `)
                        // console.log(`context ${context.container?.$cstNode?.length}, ${context.container?.$cstNode?.offset}, ${context.container?.$cstNode?.range}, ${context.container?.$cstNode?.end}`)
                    }
                } else {
                    LOG(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected IsUniqueRule and ConceptRule for 'isUniqueName'`)
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
                        LOG(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected LimitedValueExpression for 'limitedInstance'`)
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

    i: number = 1
    // Get the scope for the dot expression in the ConceptDefinition of the Freon scoper 
    // (And later: in the ConceptRule of the Freon validator)
    /**
     * 
     * @param dotExp  The containing dot expression
     * @param context The info for which we calculate the scope 
     * @returns 
     */
    private getClassifierForDotExpression(dotExp: ScoperDotExpression): Classifier | undefined {
        // if (this.i > 1000) {
        //     return undefined
        // }
        // if (isScoperDotExpression(context.container)) {
        //     // const dot: ScoperDotExpression = context.container
        //     console.log(`getScopeFromDotExpression 1 for ${context.property} afterdot is ${dotExp?.afterDotExp?.appliedKwd}'`)
        // } else {
        //     console.log(`getScopeFromDotExpression 2 ERROR for ${context.property} is not a diot expression`)
        // }
        LOG(`getClassifierForDotExpression 1 '${dotExp?.afterDotExp?.appliedKwd}' cont ${dotExp.$container.propName}`)
        const appliedExp = this.containerOfType(dotExp, "AppliedExpression");
        if (isAppliedExpression(appliedExp)) {
            LOG(`getClassifierForDotExpression 2 container of type applied '${appliedExp.appliedKwd}'`)
            const referencedProperty: Property | undefined = appliedExp?.propName?.ref;
            if (referencedProperty !== undefined) {
                LOG(`getClassifierForDotExpression 2a property ref '${referencedProperty.name}'`)
                const referencedType: ClassifierType | PrimitiveType | undefined = referencedProperty.propertyType;
                if (isClassifierType(referencedType)) {
                    return referencedType.conceptType.ref
                    // result = this.getProperties(referencedType);
                } else {
                    LOG(`getClassifierForDotExpression 3 ${LANGIUM.AstUtils.getDocument(dotExp).uri.fsPath}: Expected referenced property type to be a Classifier for 'afterDotExp'`);
                }
            } else if (appliedExp?.appliedKwd !== undefined) {
                LOG(`getClassifierForDotExpression 2b applied with keyword '${appliedExp.appliedKwd}'`)
                switch (appliedExp?.appliedKwd) {
                    case 'self': {
                        const conceptDef = this.containerOfType(appliedExp, "ConceptDefinition");
                        if (isConceptDefinition(conceptDef)) {
                            LOG(`getClassifierForDotExpression 20 returnign concept ${conceptDef.cref?.conceptType?.$refText}`)
                            return conceptDef.cref.conceptType.ref;
                        } else {
                            LOG(`getClassifierForDotExpression 6 no concept for self`)
                        }
                        break;
                    }
                    case 'if': {
                        const typeParam = appliedExp?.typeParam;
                        if (typeParam !== undefined) {
                            LOG(`getClassifierForDotExpression 13 if found ${typeParam.conceptType.ref?.name}`)
                            return typeParam.conceptType.ref;
                        } else {
                            LOG(`getClassifierForDotExpression 7 no concept for if`)
                        }
                        break;
                    }
                    case 'owner': {
                        LOG(`getClassifierForDotExpression 5 FreonScopeProvider: owner`)
                        // var conceptNode = undefined;    
                        // Find for which classifier we invoke the owner()
                        const previousDotExp = this.containerOfType(appliedExp, "ScoperDotExpression")
                        if (isScoperDotExpression(previousDotExp)) {
                            const classifier = this.getClassifierForDotExpression(previousDotExp);
                            if (classifier !== undefined) {
                                // Find owners of this concept:  classifiers that have it as a property
                                // TODO inheritance is not taken into account
                                const ownerCandidates: LANGIUM.Stream<Reference<AstNode>> = LANGIUM.AstUtils.findLocalReferences(classifier);
                                LOG(`getClassifierForDotExpression:   debug number of owner candidates: ${ownerCandidates.count()}`);
                                let result = undefined
                                ownerCandidates.forEach((oc) => {
                                    if (oc.$refNode?.astNode !== undefined) { 
                                        if (isClassifierType(oc.$refNode?.astNode)) {
                                            const propertyNode = this.containerOfType(oc.$refNode?.astNode, "Property");   
                                            if (propertyNode !== undefined && !(propertyNode as Property).reference) {
                                                // console.log(`Debug referencing property: ${propertyNode?.$document} = ${propertyNode.$cstNode?.text} -- ${propertyNode.$type}`);
                                                const classifierNode = propertyNode.$container;
                                                // This can be a classifier, but also a model (which is not a classifier)!
                                                if (isClassifier(classifierNode) || isModel(classifierNode)) {
                                                    result = classifierNode;
                                                }
                                            }
                                        } else if (isFreonModel(oc.$refNode?.astNode)) {
                                            LOG(`getClassifierForDotExpression    found model for ${oc.$refText}`)
                                        }
                                    }
                                })                                 
                                return result
                            } else {
                                LOG(`getClassifierForDotExpression 9 result from getScopeFromDotExpression is undefined`)
                            }
                        } else {
                            const cd = this.containerOfType(dotExp, "ConceptDefinition")
                            if (isConceptDefinition(cd)) {
                                return cd.cref.conceptType.ref
                            } else {
                                LOG(`getClassifierForDotExpression 10 owner found in non-scoper definition`)
                            }
                        }                                               
                        break;
                    }
                    // There is no case of `type`, as type() may not be followed by '.'
                    default:
                        // console.log(`${LANGIUM.AstUtils.getDocument(context.container).uri.fsPath}: Expected one of the special keywords, but got ${appliedExp?.appliedKwd}`);
                }
            } else {
                LOG(`getClassifierForDotExpression 4 ${LANGIUM.AstUtils.getDocument(dotExp).uri.fsPath}: Expected property reference or a special keyword for 'afterDotExp'`);
            }
        } else {
            LOG(`getClassifierForDotExpression 11 ERROR ERROR`)
            LOG(`${LANGIUM.AstUtils.getDocument(dotExp).uri.fsPath}: Expected AppliedExpression for 'afterDotExp'`);
        }
        return undefined;
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


        /**
         * @param appliedEx
         * @returns 
         */
    getClassifierOrModel(appliedExp: AppliedExpression): Classifier | Model| undefined {
        if (appliedExp.appliedKwd === "self") {
            // start of expression
            const conceptDef = this.containerOfType(appliedExp, "ConceptDefinition");
            if (isConceptDefinition(conceptDef)) {
                // return this.getProperties(conceptDef?.cref);
                return conceptDef.cref.conceptType.ref
            }
        } else if (appliedExp.appliedKwd === 'owner') {

        } else if (appliedExp.appliedKwd === 'if') {
            const typeParam = appliedExp?.typeParam;
            if (typeParam !== undefined) {
                // return this.getProperties(typeParam);
                return typeParam.conceptType.ref
            }
        } else if (appliedExp.appliedKwd === 'type') {

        } else {
            // property
            return appliedExp.propName?.ref?.propertyType?.conceptType.ref
        }
        return undefined

    }
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

    private getProperties(cref: ClassifierType): Scope {
        const classifierReference = getClassifierType(cref);
        const classifierRef = classifierReference?.ref;
        if (isClassifier(classifierRef)) {
            const descriptions = allProperties(classifierRef).flatMap(p => (isOk(p) ? this.astNodeDescriptionProvider.createDescription(p, p.name) : []));
            LOG("   getProperties isClassifier:     " + descriptions.map(d => d.name).join(", "))
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
        LOG("   getProperties is NOT Classifier ================================ ")
        return EMPTY_SCOPE;
    }

    private getPropertiesOfClassifier(classifier: Classifier | Model): Scope {        
        if (isClassifier(classifier) || isModel(classifier)) {
            const descriptions = allProperties(classifier).flatMap(p => (isOk(p) ? this.astNodeDescriptionProvider.createDescription(p, p.name) : []));
            LOG("   getProperties isClassifier:     " + descriptions.map(d => d.name).join(", "))
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
        LOG("   getProperties is NOT Classifier ================================ ")
        return EMPTY_SCOPE;
    }

    // private appendScopes(scope1: Scope, scope2: Scope): Scope {
    //     return new MapScope(scope1.getAllElements().concat(scope2.getAllElements()));
    // }

    private getInstances(lt: LimitedType, log: boolean = false): Scope {
        const limitedReference = lt.conceptType;
        const limitedRef = limitedReference?.ref;
        if (isLimited(limitedRef)) {
            const descriptions = allInstances(limitedRef).flatMap(p => (isOkInstance(p) ? this.astNodeDescriptionProvider.createDescription(p, p.name) : []));
            LOG("   getInstances:     " + descriptions.map(d => d.name).join(", "))
            return new MapScope(descriptions);
        }
        LOG("   getIntsancesis NOT Classifier ================================ ")
        return EMPTY_SCOPE;       
    }
    private getLimitedInstances(lt: Limited, log: boolean = false): Scope {
        const descriptions = allInstances(lt).flatMap(p => (isOkInstance(p) ? this.astNodeDescriptionProvider.createDescription(p, p.name) : []));
        LOG("   getInstances:     " + descriptions.map(d => d.name).join(", "))
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

function allProperties(classifier: Classifier | Model | undefined): Property[] {
    if (classifier === undefined) {
        return [];
    }
    const result: Property[] = []
    result.push(...classifier.properties)
    if (isClassifier(classifier)) {
    allSuperClassifiers(classifier).forEach(cref =>
        result.push(...cref.properties)
    )
}
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