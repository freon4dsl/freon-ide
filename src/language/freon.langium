grammar FreonAst

entry Freon:
    WS? (ast=FreonModel | edit=FreonEditor | scoper=Scoper_Definition | validator=Validator_Definition | typer=TyperDefinition );


FreonModel:
    'language' WS name=Identifier WS? 
    (models+=Model | classifiers+=Classifier)*;

Model:
    kind='model' WS name=Identifier WS? CURLY_BEGIN WS?
        (properties+=Property)*
    CURLY_END WS;

ModelUnit:
    kind='modelunit' WS name=Identifier WS? (implements=Implements WS?)? CURLY_BEGIN WS?
        (properties+=Property)*
        ('file-extension' WS? '=' WS? STRING WS? SEMI WS?)?
    CURLY_END WS?;

Classifier:
    Concept | Interface | ExpressionConcept | Limited | ModelUnit | TypeConcept;

Limited:
    kind='limited' WS? name=Identifier WS? ('base' WS cbase=[ConceptOrLimited] WS)? implements=Implements? CURLY_BEGIN WS?
        (properties+=Property)* 
        (instances+=Instance)*
    CURLY_END WS?;

type ConceptOrLimited = Concept | Limited;

Instance:
    Instance1 | Instance2;

Instance1:
    name=PropertyIdentifier WS? '=' WS? CURLY_BEGIN WS? props=PropDefList CURLY_END WS?;

// shorthand for "{name: "name"}"
Instance2:
    name=PropertyIdentifier WS? SEMI WS?;

PropDefList:
    head=PropDef WS? (COMMA WS? v+=PropDef WS?)*;


// the name may or may not be surrounded by quotes
PropDef:
    name=STRING WS? COLON WS? value=PropValue WS?
    |
    name=Identifier WS? COLON WS? value=PropValue WS?;

PropValue:
      value=STRING
    | 'false' WS?
    | 'true' WS?
    | number=Numberliteral
    | PROJECTION_BEGIN WS? list=PropValueList WS? PROJECTION_END  WS?
    | "[]" WS?
    | instance=LimitedExpression WS? 
    ;

LimitedExpression:
    concept=[Limited] WS? COLON WS? instance=[Instance] WS?;

Numberliteral:
    value=INT WS?;

PropValueList:
    head=PropValue WS? (COMMA WS? v+=PropValue WS?)*;

Concept:
    (abstract?='abstract' WS?)? kind='concept' WS name=Identifier WS? ('base' WS base=[Concept] WS?)? implements=Implements? CURLY_BEGIN WS?
        (properties+=Property)*
    CURLY_END WS?;

Interface:
    (abstract?='abstract' WS)? kind='interface' WS name=Identifier WS? extends=InterfaceImplements? CURLY_BEGIN WS?
        (properties+=Property)*
    CURLY_END WS?;

Property:
    ('private' WS?)? (reference?='reference' WS)? name=PropertyIdentifier WS? (optional?='?' WS?)? 
    COLON WS? (propertyType=ClassifierType | propertyPrimiytiveType=PrimitiveType) WS? (list?='[]' WS?)? (InitialValue WS?)?SEMI WS?;

Implements:
    kind='implements' WS intfaces+=[Interface] WS? (COMMA WS? intfaces+=[Interface] WS?)*  ;

InterfaceImplements:
    k='base' WS intfaces+=[Interface] WS? (COMMA WS? intfaces+=[Interface] WS?)*  ;

ExpressionConcept:
    (abstract?='abstract' WS)? (binary?='binary' WS)? kind='expression' WS  name=Identifier WS? ('base' WS base=[Classifier] WS?)? implements=Implements? CURLY_BEGIN WS?
        (properties+=Property)*
        ('priority' WS? '=' WS? priority=INT WS? SEMI WS?)?
    CURLY_END WS?;

PrimitiveType returns string:
        ('string' | 'boolean' | 'number' | 'identifier' );

ClassifierType:
    (conceptType=[Classifier]);

InitialValue: '=' WS? value=PropValue;
// TODO Does not work classifierType only has undefined members
// ClassifierType:
//     classifierType=([Concept] | [Interface] | [ExpressionConcept] | [Limited] | [ModelUnit]);

/*****************************************************************************
 *                                EDITOR
 *****************************************************************************/
FreonEditor:
    'editor' WS name=Identifier WS ('precedence' WS precedence=INT WS?)?
     ('global' WS CURLY_BEGIN WS globals+=SingleGlobalProjection* WS? CURLY_END WS?)?
    (projections+=Projection)*;

SingleGlobalProjection:
    'boolean' WS? (kind=DisplayType WS?)? (key=KeywordDecl WS?)? 
    |
    'referenceSeparator' WS? PROJECTION_BEGIN t+=TextItem* PROJECTION_END WS?
    |
    'number' WS (kind=DisplayType WS?)?
    |
    'limited' PROJECTION_BEGIN PROJECTION_END WS (kind=DisplayType WS?)?
    |
    'external' WS? CURLY_BEGIN WS? externals+=ExternalDeclaration (COMMA WS? externals+=ExternalDeclaration)* CURLY_END WS?
    ;

ExternalDeclaration: name=Identifier WS?;

FragmentProjection:
    'fragment' WS? name=Identifier WS?
        text_projection=TextProjection?;

SuperProjection:
    SUPER WS? cls=[Classifier] WS? (COLON ed=[FreonEditor] WS?)? PROJECTION_END;

Projection:
    classifier=ClassifierType WS? CURLY_BEGIN WS?
        text_projection=TextProjection? table_projection=TableProjection? 
        (fragment+=FragmentProjection)*
        ex=ExtraClassifierInfo?
    CURLY_END WS?;

Trigger:           (trigger+='trigger' WS? '=' WS? STRING WS?);
ReferenceShortcut: (referenceShortcut+='referenceShortcut' WS? '=' WS? PROPERTY_REF_BEGIN WS? ('self' WS? DOT WS?)? propName=[Property] WS? CURLY_END  WS?);
// Symbols is reserved JS word, not allowed by Langium
SymbolK:            (symbol='symbol' WS? '=' WS? STRING WS?);

/* rules that make the order of extra info flexible */
ExtraClassifierInfo:
    trigger=Trigger
    sub=ExtraChoiceSub1?
    | symbol=SymbolK
      sub=ExtraChoiceSub2?
    | referenceShortcut=ReferenceShortcut
      sub=ExtraChoiceSub3?;

ExtraChoiceSub1: 
    referenceShortcut=ReferenceShortcut
    symbol=SymbolK?
    | symbol=SymbolK
      referenceShortcut=ReferenceShortcut?;

ExtraChoiceSub2: 
    referenceShortcut=ReferenceShortcut
    trigger=Trigger?
    | trigger=Trigger
      referenceShortcut=ReferenceShortcut?;

ExtraChoiceSub3: 
    symbol=SymbolK
    trigger=Trigger?
    | trigger=Trigger
      symbol=SymbolK?
      ;
/* END of rules that make order of extra info flexible */

// TableOrNormal:
//     normal=TextProjection   table=TableProjection? ;

TableProjection:
    kind='table' WS? PROJECTION_BEGIN WS?
        (th=TableHeader WS?)?
        p+=Property_projection WS? (PROJECTION_SEPARATOR WS? p+=Property_projection)*
    PROJECTION_END WS?;

PropertyRefOnly: 
    PROPERTY_REF_BEGIN WS? propName=[Property] (COLON Identifier)? WS? CURLY_END  WS?;
TableHeader:
    t+=TableTextItem WS? (t+=TableTextItem WS?)* (PROJECTION_SEPARATOR WS? t+=TableTextItem WS? (t+=TableTextItem WS?)*)*;

TextProjection: 
    PROJECTION_BEGIN
        (lines+=LineWithOptional)*
    PROJECTION_END WS?;

LineWithOptional:
    // WS? items+=( TextItem | OptionalProjection | Simple_external | Fragment_projection | Property_projection | SuperProjection | NEWLINE )+;
    ( t+=TextItem |  p+=Property_projection | o+=OptionalProjection | frag+=FragmentReference | ext+=Simple_external | u+=SuperProjection | WS | NEWLINE )+;

LineWithoutOptional:
    // items+=(TextItem | Simple_external | Fragment_projection | Property_projection | SuperProjection | NEWLINE | WS)+;
    ( t+=TextItem | p+=Property_projection | frag+=FragmentReference | ext+=Simple_external| u+=SuperProjection | WS | NEWLINE )+;

TextItemWithoutSeparator :
    text=(
    COLON | CURLY_BEGIN | CURLY_END | SEMI 
    | INT | COMMA | DOT | EXCL 
    | AT | '%' | '^' | PAR_OPEN 
    | PAR_CLOSE | AMPERSAND | MULTI | SINGLE_QUOTE 
    | BACK_QUOTE | PLUS | MINUS | SLASH 
    | EscapedChar | '?' | PROJECTION_BEGIN | Comparator
    | ListInfoType | ListDirection
    | PropertyIdentifier
    
    | 'self'
    );

TextItem: TextItemWithoutSeparator | PROJECTION_SEPARATOR ;

TableTextItem:
    text=(COLON | CURLY_BEGIN | CURLY_END |SEMI| INT | COMMA | DOT | EXCL | AT | '%' | '^'
    | PAR_OPEN | PAR_CLOSE | AMPERSAND | MULTI | SINGLE_QUOTE | BACK_QUOTE | '=' | PLUS | MINUS | SLASH | BACK_SLASH | EscapedChar 
    | PROJECTION_BEGIN | Comparator
    | ListInfoType | ListDirection
    | PrimitiveType
    | Identifier
    | Keyword
    );

Identifier returns string:  
      ID 
    // | Keyword
    | 'table'
    | 'typeof'
    | DisplayType;

PropertyIdentifier returns string:  
      ID 
    | KeywordAllowedAsProperty
    | 'table'
    | PrimitiveType
    | DisplayType;

Keyword returns string:
    KeywordAllowedAsProperty
    // | 'istype' | 'hastype' | 'type'
    // | 'anytype' 
    | 'self'
    ;

KeywordAllowedAsProperty returns string:
    'base' | 'implements' | 'concept' | 'model' | 'modelunit' | 'language' | 'editor' | 'trigger' | 'referenceShortcut' | 'symbol' 
    | 'interface' | 'private'
    | 'abstract' | 'precedence' | 'priority' | 'reference' | 'true' | 'false' | 'for' | 'in'
    | 'rows' | 'columns' | 'wrap' | 'replace' | 'expression' | 'binary' | 'limited'
    | 'fragment' | 'external' | 'type' | 'file-extension'
    | 'istype' | 'hastype' | 'anytype'
    | 'scoper' | 'namespace_addition' | 'isnamespace' | 'scope'
    | 'validIdentifier' |'notEmpty' |'typecheck' | 'equalsType' | 'conformsTo' | 'isunique' | 'property'
    | 'typer' | 'validator'
    | 'infertype' | 'conformsto' | 'equalsto' | 'new' | 'where' | 'let'
    | FunctionName
    | ListInfoType
    | TEXT
    ;


OptionalProjection:
    kind=OPTIONAL (lines+=LineWithoutOptional)* PROJECTION_END WS?;

Simple_external:
    '[external' WS? '=' WS? external=[ExternalDeclaration] WS? p+=Parameter* PROJECTION_END WS?;

Parameter: key=PropertyIdentifier WS? '=' WS? value=STRING WS?;

FragmentReference:
    kind=FRAGMENT WS? fregment=Identifier WS? ('wrap' WS? '=' WS? name=Identifier WS?)?  PROJECTION_END;

Property_projection:
    // SingleProperty 
    //|  l=ListProperty;// 
    Button_projection
    | SingleProperty 
    ;

Button_projection: BUTTON_START WS? (TEXT WS? '=' WS? s+=STRING WS?)? 'boxRole' WS? '=' WS? s+=STRING WS? PROJECTION_END WS?;

SingleProperty:
    PROPERTY_REF_BEGIN WS?
        ('self' WS? (DOT WS?)?)? propName=[Property] (COLON projName=Identifier)? WS? 
        // (ListInfo WS?)?
        (TEXT WS?)?
        (DisplayType WS?)? 
        KeywordDecl?
        ExternalInfo?
        ('table' WS? ((r='rows' | c='columns') WS?)?)?
        (dir=ListDirection WS?)? (type=ListInfoType WS? PROJECTION_BEGIN (t+=TextItem+ | s+=WS)+ PROJECTION_END WS? )?
    CURLY_END WS?;

// ListProperty:
//     PROPERTY_REF_BEGIN WS? 
//         "self."? propName=[Property] WS? (COLON WS? projName=Identifier WS?)? (ListInfo WS?)? (DisplayType WS?)?  KeywordDecl? ExternalInfo?
//     CURLY_END WS?;

terminal TEXT:/\btext\b/;
terminal DisplayType:
     'checkbox' | 'radio' | 'switch' | 'inner-switch' | 'slider';

ListDirection returns string:
    'horizontal' | 'vertical';

ListInfoType returns string:
    'separator' | 'terminator' | 'initiator';

KeywordDecl:
    PROJECTION_BEGIN WS? t+=TextItemWithoutSeparator+ WS? (PROJECTION_SEPARATOR WS? tt+=TextItemWithoutSeparator+ WS?)? PROJECTION_END WS?;

ExternalInfo:
    ('wrap' WS? '=' WS? wrap=Identifier WS? (params+=Key_value_pair WS?)*)
    | 
    ('replace' WS? '=' WS? replace=Identifier WS?  (params+=Key_value_pair WS?)*);

Key_value_pair:
    key=Identifier WS? '=' WS? STRING WS? ;

/****************************************************************
 *                            Scoper
 ****************************************************************/

Scoper_Definition:
    'scoper' WS name=Identifier WS 'for' WS 'language' WS languageName=Identifier WS ns=Namespaces WS? defs+=ConceptDefinition*;

Namespaces:
    isnamespaceKey='isnamespace' WS? CURLY_BEGIN WS? 
                                        head=[Classifier] WS?
                                        (COMMA WS? v+=[Classifier] WS? )*
                                 CURLY_END WS?;

ConceptDefinition:
    cref=ClassifierType WS? CURLY_BEGIN WS?
        (nsDef=NamespaceAddition)? 
        (alternativeScope=AlternativeScope?) 
    CURLY_END WS?;

NamespaceAddition: 
    kind='namespace_addition' WS? '=' WS? list=Expressionlist  SEMI WS?;

// TODO
Expressionlist:
        // (WS | t+=DummyItem)+ ;
      head=LangExpression WS?
      (PLUS WS? v+=LangExpression)*;

// TODO
AlternativeScope:
    // kind='scope' WS? EQUALS (WS | t+=DummyItem)* SEMI WS?;
    kind='scope' WS? '=' WS? exp=LangExpression SEMI WS?;

/****************************************************************
 *                           Expressions
 ****************************************************************/
LangExpression:
    ( functionExpression=FunctionExpression  
    | instanceExpression=InstanceExpression 
    | expression=Expression                 
    | simpleExpression=SimpleExpression) WS? ;
    // FunctionExpression |InstanceExpression | Expression | SimpleExpression;

InstanceExpression: conceptName=[Limited] WS? type=COLON WS? instance=[Instance] WS?;

Expression: sourceName=('self' | 'container') WS? (appliedfeature=DotExpression)?;

DotExpression: DOT WS? propName=[Property] WS? (appliedfeature=DotExpression?)?  ;

FunctionExpression: 
    sourceName=Identifier PAR_OPEN ( WS?
      head=LangExpression
      (COMMA WS? v+=LangExpression)*
    )?
    PAR_CLOSE WS?
     appliedfeature=DotExpression? ;

SimpleExpression: 
    number=INT WS?;

 /****************************************************************
 *                           VALIDATOR
 ****************************************************************/
Validator_Definition:
    'validator' WS validatorName=Identifier WS 'for' WS 'language' WS languageName=Identifier WS? cr+=(ConceptRule)*;

ConceptRule:
    conceptRef=ClassifierType WS? CURLY_BEGIN WS? rules+=Rule* CURLY_END WS?;

Rule:
      (rule1=TypeEqualsRule   SEMI 
      | rule2=TypeConformsRule SEMI 
      | rule3=NotEmptyRule     SEMI 
      | rule4=ValidNameRule    SEMI
      | rule5=ExpressionRule   SEMI 
      | rule6=IsUniqueRule     SEMI) WS?; 

RuleExtras:
    CURLY_BEGIN WS? severity=Severity WS? (COMMA WS? e=Errormessage WS?)? CURLY_END WS? 
    | CURLY_BEGIN WS? message=Errormessage WS? (COMMA WS? s+=Severity WS?)? CURLY_END WS?;

Severity: 'severity' WS? COLON WS? value=Identifier WS? ;

Errormessage: 'message' WS? COLON WS? content=STRING WS? ;

MessageContent: head=MessagePart WS? (WS v+=MessagePart WS? )*;

MessagePart: ref=ModelReference ;

ModelReference: PROPERTY_REF_BEGIN WS? exp=Expression WS? CURLY_END WS? ;

ValidNameRule: 'validIdentifier' WS? property=LangExpression? extra=RuleExtras? ;

NotEmptyRule: 'notEmpty' WS? property=LangExpression extra=RuleExtras? ;

// TODO change this grammar rule into something else than a function call
TypeEqualsRule:
    'typecheck' WS? 'equalsType' WS? PAR_OPEN WS? type1=LangExpression WS? COMMA WS? type2=LangExpression PAR_CLOSE WS? extra=RuleExtras? ;

// TODO change this grammar rule into something else than a function call
TypeConformsRule:
     'typecheck' WS? "conformsTo" WS? PAR_OPEN WS? type1=LangExpression WS? COMMA WS? type2=LangExpression PAR_CLOSE WS? extra=RuleExtras? ;

ExpressionRule:
     exp1=LangExpression Comparator WS? exp2=LangExpression extra=RuleExtras? ;

IsUniqueRule:
    'isunique' WS? 'in' WS? 'self' WS? DOT WS? propName=[Property] WS? 'property' WS? isUniqueName=[Property] WS? extra=RuleExtras? ;
    // 'isunique' WS? isUniqueName=[Property] WS? 'in' WS? 'self' WS? DOT WS? propName=[Property]  WS?  extra=RuleExtras? ;

Comparator returns string: "<=" | '=' | ">=" | ">" | "<";
/****************************************************************
 *                           Typer
 ****************************************************************/
TyperDefinition:
    'typer' WS?

    is=IsType?
    tc+=TypeConcept*
    has=HasType?
    a=AnyTypeRule?
    c+=ClassifierTypeSpec*
    ;

IsType: 'istype' WS? CURLY_BEGIN WS? (cref=ClassifierType WS?)? (COMMA WS? cc+=[Classifier] WS?)* CURLY_END WS?;
HasType:'hastype' WS? CURLY_BEGIN WS? (c+=[Classifier] WS?)? (COMMA WS? c+=[Classifier] WS?)* CURLY_END WS?;

// TODO use real references [...]
TypeConcept: kind='type' WS? name=Identifier WS? CURLY_BEGIN WS? 
                (properties+=Property)*
    CURLY_END WS?;

AnyTypeRule: kind='anytype' WS? CURLY_BEGIN WS? r+=TyperStatement* WS? CURLY_END WS?;
// const validFunctionNames: string[] = ["conformsTo", "equalsType", "typeof", "commonSuperTypeOf", "ancestor"];

ClassifierTypeSpec : cref=ClassifierType WS? CURLY_BEGIN WS? rule+=TyperStatement* CURLY_END WS? ;

TyperStatement: FretInferenceRule
    | FretConformanceRule
    | FretEqualsRule
    | FretLimitedRule 
    ;

FretInferenceRule: kind='infertype' WS? exp=TyperExp WS? SEMI WS?;
FretConformanceRule: kind='conformsto' WS? exp=TyperExp WS? SEMI WS? ;
FretEqualsRule: kind='equalsto' WS? exp=TyperExp WS? SEMI WS?;
FretLimitedRule: (ie+=InstanceRuleExpression WS?) 'conformsto' WS? (TyperExp ) WS? SEMI WS?;

TyperExp: (
         self=TyperSelfExp 
        | any=AnyTypeExp
        | w=FretWhereExp 
        | c=FretCreateExp
        | f=FretFunctionCallExp
        | l=InstanceRuleExpression
    )
    ;

InstanceRuleExpression: (conceptName=[Limited] WS? type=COLON WS?)? instance=[Instance] WS?;
// FretLimitedInstanceExp: conceptName=[Limited] COLON i=PropertyIdentifier WS?;

TyperSelfExp: kind='self' WS? (  (DOT WS? propName=[Property] WS? (DOT WS? nextPropName+=[Property] WS?)* ) )?;
AnyTypeExp: kind='anytype' WS? ;

// FretVarCallExp: p=[Property] WS?;

FretCreateExp: kind='new' WS? cref=ClassifierType WS? CURLY_BEGIN WS? (i+=FretPropInstance WS? (COMMA WS? i+=FretPropInstance WS?)* ) CURLY_END WS? ;

FretPropInstance: propInstanceName=[Property] WS? COLON WS? e=TyperExp WS?;



FretWhereExp: var=FretVarDecl 'where' WS? CURLY_BEGIN WS?
	 ( b+=Binary_FretExp SEMI WS? )*
	 CURLY_END WS? ;

FretVarDecl: 'let' WS? name=Identifier WS? COLON WS? cref=ClassifierType WS? ;

FretFunctionCallExp: i=FunctionName WS? PAR_OPEN WS? (f+=TyperExp WS? (COMMA  WS? t+=TyperExp WS?)*)? PAR_CLOSE WS?;

FunctionName returns string: 'typeof' | 'commonSuperType' | 'ownerOfType';

VarRef: var=[FretVarDecl] WS? DOT WS? varPropName=[Property] WS?;
WhereTyperExp: VarRef | TyperSelfExp | AnyTypeExp;
Binary_FretExp: l=WhereTyperExp (BinaryTypeOperator WS? r+=WhereTyperExp WS?);

BinaryTypeOperator returns string: 'conformsto' | 'equalsto' ;

 /**************************************************************/

// TemplateSpace:
//     char+=ID+ ;

EscapedChar returns string: 
    ESCAPED | BACK_SLASH | ESCAPED_PROJECTION_BEGIN | ESCAPED_PROJECTION_END | ESCAPED_DOLLAR;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\// WS?;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/ WS?;

// terminal GREATER_THAN: '>';
// terminal LESS_THAN: '<';
terminal SLASH: '/';
terminal ESCAPED: '\\"';
terminal ESCAPED_PROJECTION_BEGIN: '\\[';
terminal ESCAPED_PROJECTION_END: '\\]';
terminal ESCAPED_DOLLAR: '\\$';
terminal BACK_SLASH: '\\';

// terminal EQUALS: '=';
terminal PLUS: '+';
terminal MINUS: '-';
terminal UNDERSCORE: '_';
terminal SINGLE_QUOTE: "'";
terminal DOUBLE_QUOTE: '"';
terminal BACK_QUOTE: "`";
terminal DOT: '.';
terminal COMMA: ',';
terminal EXCL: '!';
terminal AT: '@';
terminal BUTTON_START: '[button';
terminal FRAGMENT: '[fragment';
terminal OPTIONAL: '[?';
terminal SUPER: '[=>';
terminal PAR_OPEN: '(';
terminal PAR_CLOSE: ')';
terminal MULTI: '*';
terminal AMPERSAND: '&';
terminal PROJECTION_BEGIN: '[';
terminal PROJECTION_END: ']';
terminal PROJECTION_SEPARATOR: '|';
terminal CURLY_BEGIN: '{';
terminal CURLY_END: '}';
terminal COLON: ':';
terminal PROPERTY_REF_BEGIN: '${';
terminal SEMI: ';';
terminal TABLE:/\btable\b/;
terminal NEWLINE: '\n';
// terminal ANY_CHAR: /[*a-zA-Z0-9'\-[\]\|+<>=#$_.,!?@~%^&*-=+(){}:;<>?]/;

// terminal SPACE: /[ \t]/;
// terminal WSONLY: SPACE+;
terminal WS: /\s+/;
// terminal WS: (SPACE | NEWLINE)+;

terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
// terminal ANYCHAR: CURLY_BEGIN | CURLY_END | COLON | QUESTION | SEMI ;
// terminal CHAR:
//     '\\'
//     (
//         '"'
    //   | '\\'
    //   | '/'
    //   | '|'
    //   | '['
    //   | ']'
    //   | '{'
    //   | '}'
    //   | '$'
    //   | 'b' 
    //   | 'f' 
    //   | 'n' 
    //   | 'r' 
    //   | 't' 
    // );

// terminal ESCAPE: "\\";

// terminal UNESCAPED: /[^\0-\x1F\x22\x5C]/;
// terminal ANYTHING_BUT: !("${")+;
