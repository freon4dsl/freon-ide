import { AstNode } from 'langium';
import { AbstractSemanticTokenProvider, LangiumServices, SemanticTokenAcceptor } from 'langium/lsp';
import { SemanticTokenTypes } from 'vscode-languageserver';
import { isClassifierType, isInterface, isProperty, isSingleProperty, isTextItem, isTextItemWithoutSeparator } from './generated/ast.js';

export class MySemanticTokenProvider extends AbstractSemanticTokenProvider {

    constructor(services: LangiumServices) {
        super(services)
    }
    protected override highlightElement(node: AstNode, acceptor: SemanticTokenAcceptor): void {
    
        if (isTextItem(node)) {
            acceptor({
                node,
                property: 'text',
                type: SemanticTokenTypes.comment
            });
        } else if (isTextItemWithoutSeparator(node)){
            acceptor({
                node,
                property: 'text',
                type: SemanticTokenTypes.enum
            });
        } else if (isClassifierType(node)){
            acceptor({
                node,
                property: 'conceptType',
                type: SemanticTokenTypes.enum
            });
        } else if (isProperty(node)){
            acceptor({
                node,
                property: 'name',
                type: SemanticTokenTypes.property
            });
            acceptor({
                node,
                property: 'propertyType',
                type: SemanticTokenTypes.typeParameter
            });
        // class does not exist in WebStorm
        // } else if (isConcept(node)){
        //     acceptor({
        //         node,
        //         property: 'name',
        //         type: SemanticTokenTypes.class
        //     });
    } else if (isInterface(node)){
        acceptor({
            node,
            property: 'name',
            type: SemanticTokenTypes.interface
        });
    } else if (isSingleProperty(node)){
        acceptor({
            node,
            property: 'propName',
            type: SemanticTokenTypes.property
        });
}
    }
}