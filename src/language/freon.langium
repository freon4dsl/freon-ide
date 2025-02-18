grammar FreonAst

entry Freon:
    WS? (ast=FreonModel | edit=FreonEditor | scoper=Scoper_Definition | validator=Validator_Definition );


FreonModel:
    'language' WS name=ID WS? 
    (models+=Model | classifiers+=Classifier)*;

Model:
    kind='model' WS name=ID WS? CURLY_BEGIN WS?
        (properties+=Property)*
    CURLY_END WS;

ModelUnit:
    kind='modelunit' WS name=ID WS implements=Implements? CURLY_BEGIN WS?
        (properties+=Property)*
        ('file-extension' WS? EQUALS WS? STRING WS? SEMI WS?)?
    CURLY_END WS?;

Classifier:
    Concept | Interface | ExpressionConcept | Limited | ModelUnit;

Limited:
    kind='limited' WS name=ID WS ('base' WS base=[Limited] WS)? implements=Implements? CURLY_BEGIN WS?
        (properties+=Property)* 
        (instances+=Instance)*
    CURLY_END WS?;


Instance:
    Instance1 | Instance2;

Instance1:
    name=ID WS? EQUALS WS? CURLY_BEGIN WS? props=PropDefList CURLY_END WS?;

PropDefList:
    head=PropDef WS? (COMMA WS? v+=PropDef WS?)*;


// the name may or may not be surrounded by quotes
PropDef:
    name=STRING WS? COLON WS? value=PropValue WS?
    |
    name=ID WS? COLON WS? value=PropValue WS?;

PropValue:
      value=STRING
    | 'false' WS?
    | 'true' WS?
    | number=Numberliteral
    | PROJECTION_BEGIN WS? list=PropValueList WS? PROJECTION_END  WS?
    | "[]" WS?
    // | instance=LimitedExpression WS? 
    ;

// LimitedExpression:
//     concept=[Limited] WS? COLON WS? instance=[Instance] WS?;

Numberliteral:
    value=INT WS?;

PropValueList:
    head=PropValue WS? (COMMA WS? v+=PropValue WS?)*;

// shorthand for "{name: "name"}"
Instance2:
    name=ID WS? SEMI WS?;

Concept:
    (abstract?='abstract' WS?)? kind='concept' WS name=ID WS? ('base' WS base=[Concept] WS?)? implements=Implements? CURLY_BEGIN WS?
        (properties+=Property)*
    CURLY_END WS?;

Interface:
    (abstract?='abstract' WS)? kind='interface' WS name=ID WS? extends=InterfaceImplements? CURLY_BEGIN WS?
        (properties+=Property)*
    CURLY_END WS?;

Property:
    (reference?='reference' WS)? name=ID WS? (optional?='?' WS?)? COLON WS? type=(ClassifierType | PrimitiveType) WS? (list?='[]' WS?)? SEMI WS?;

Implements:
    kind='implements' WS intfaces+=[Interface] WS? (COMMA WS? intfaces+=[Interface] WS?)*  ;

InterfaceImplements:
    k='base' WS intfaces+=[Interface] WS? (COMMA WS? intfaces+=[Interface] WS?)*  ;

ExpressionConcept:
    (abstract?='abstract' WS)? (binary?='binary' WS)? kind='expression' WS  name=ID WS? ('base' WS base=[Classifier] WS?)? implements=Implements? CURLY_BEGIN WS?
        (properties+=Property)*
        ('priority' WS? EQUALS WS? priority=INT WS? SEMI WS?)?
    CURLY_END WS?;

PrimitiveType:
        type=(STRING_TYPE | BOOLEAN_TYPE | NUMBER_TYPE | IDENTIFIER_TYPE);

ClassifierType:
    (conceptType=[Classifier] | intfaceType=[Interface] | expressionType=[ExpressionConcept] | limitedType=[Limited] | modelunitType=[ModelUnit]);
// TOD Does not work classifierType only has undefined members
// ClassifierType:
//     classifierType=([Concept] | [Interface] | [ExpressionConcept] | [Limited] | [ModelUnit]);

/*****************************************************************************
 *                                EDITOR
 *****************************************************************************/
FreonEditor:
    'editor' WS name=ID WS ('precedence' WS precedence=INT WS?)?
    (projections+=Projection)*
     ('global' WS CURLY_BEGIN WS list+=SingleGlobalProjection* WS? CURLY_END WS?)?;

SingleGlobalProjection:
    BOOLEAN_TYPE WS (kind=DisplayType WS?) (key=KeywordDecl WS?)? 
    |
    'referenceSeparator' WS? PROJECTION_BEGIN t+=TextItem* PROJECTION_END WS?
    |
    NUMBER_TYPE WS (kind=DisplayType WS?)?
    |
    'limited' PROJECTION_BEGIN PROJECTION_END WS (kind=DisplayType WS?)?
    |
    'external' WS? CURLY_BEGIN WS? list=ListOfExternals WS? CURLY_END WS?
    ;

ListOfExternals:
    id+=ID WS? (COMMA WS? id+=ID WS?)*;

Projection:
    classifier=ClassifierType WS? CURLY_BEGIN WS?
        text_projection=TextProjection? table_projection=TableProjection? 
        (referenceShortcut='referenceShortcut' WS? EQUALS WS? PROPERTY_REF_BEGIN WS? propName=[Property] WS? CURLY_END  WS?)?
        (trigger='trigger' WS? EQUALS WS? STRING WS?)?
        (symbol='symbol' WS? EQUALS WS? STRING WS?)?
    CURLY_END WS?;

// TableOrNormal:
//     normal=TextProjection   table=TableProjection? ;

TableProjection:
    kind=TABLE WS? PROJECTION_BEGIN WS?
        (th=TableHeader WS?)?
        p=Property_projection WS? (PROJECTION_SEPARATOR WS? pp+=Property_projection)*
    PROJECTION_END WS?;

PropertyRefOnly: 
    PROPERTY_REF_BEGIN WS? propName=[Property] (COLON ID)? WS? CURLY_END  WS?;
TableHeader:
    t+=TableTextItem+ WS? (PROJECTION_SEPARATOR WS? tt+=TableTextItem+ WS?)*;

TextProjection: 
    PROJECTION_BEGIN
        (lines+=LineWithOptional)*
    PROJECTION_END WS?;

LineWithOptional:
    // WS? items+=( TextItem | OptionalProjection | Simple_external | Fragment_projection | Property_projection | SuperProjection | NEWLINE )+;
    ( t+=TextItem | p+=Property_projection | o+=OptionalProjection | WS | NEWLINE )+;

LineWithoutOptional:
    // items+=(TextItem | Simple_external | Fragment_projection | Property_projection | SuperProjection | NEWLINE | WS)+;
    ( t+=TextItem | p+=Property_projection | WS | NEWLINE )+;

TextItem:
    (a=COLON | b=CURLY_BEGIN | d=CURLY_END |c=SEMI| e=INT | COMMA | DOT | EXCL | AT | w=PROJECTION_SEPARATOR |  text=ID |
    PAR_OPEN | PAR_CLOSE | AMPERSAND | MULTI | SINGLE_QUOTE | BACK_QUOTE | e=EQUALS | PLUS | MINUS | SLASH | BACK_SLASH | ESCAPED |
    'base' | 'implements' | 'concept' | 'model' | 'language' | 'editor' | 'trigger' | 'referenceShortcut' | 'symbol' |
    'abstract' | 'precedence' | 'priority' | 'reference' | 'true' | 'false' | 'self' | 'for'
    );
TableTextItem:
    (a=COLON | b=CURLY_BEGIN | d=CURLY_END |c=SEMI| e=INT | COMMA | DOT | EXCL | AT |  text=ID |
    PAR_OPEN | PAR_CLOSE | AMPERSAND | MULTI | SINGLE_QUOTE | BACK_QUOTE | e=EQUALS | PLUS | MINUS | SLASH | BACK_SLASH |
    b='base' | i='implements' | 'concept' | 'model' );

OptionalProjection:
    kind=OPTIONAL (lines+=LineWithoutOptional)* PROJECTION_END;

Simple_external:
    kind='te';
Fragment_projection:
    kind='tf';

Property_projection:
    SingleProperty ;//|  l=ListProperty;// | button_projection;

SingleProperty:
    PROPERTY_REF_BEGIN WS?
        ('self' WS? (DOT? WS?))? propName=[Property] (COLON projName=ID)? WS? 
        (ListInfo WS?)? 
        (DisplayType WS?)?  KeywordDecl? ExternalInfo?
    CURLY_END WS?;

// ListProperty:
//     PROPERTY_REF_BEGIN WS? 
//         "self."? propName=[Property] WS? (COLON WS? projName=ID WS?)? (ListInfo WS?)? (DisplayType WS?)?  KeywordDecl? ExternalInfo?
//     CURLY_END WS?;

terminal DisplayType:
    "text" | "checkbox" | "radio" | "switch" | "inner-switch" | "slider";

ListInfo:
    t=TableInfo | l=ListNoTableInfo;

TableInfo:
    kind=TABLE WS? ((r='rows' | c='columns') WS?)?;

ListNoTableInfo:
    dir=ListDirection WS? (type=ListInfoType WS? PROJECTION_BEGIN t+=TextItem+ PROJECTION_END WS? )?;

ListDirection:
    h='horizontal' | v='vertical';

ListInfoType:
    s='separator' | t='terminator' | i='initiator';

KeywordDecl:
    PROJECTION_BEGIN WS? name=ID WS? (PROJECTION_SEPARATOR WS? ID WS?)? PROJECTION_END WS?;

ExternalInfo:
    ("wrap" WS? EQUALS WS? wrap=ID WS? (params+=Key_value_pair WS?)*)
    | 
    ("replace" WS? EQUALS WS? replace=ID WS?  (params+=Key_value_pair WS?)*);

Key_value_pair:
    key=ID WS? EQUALS WS? STRING WS? ;

/****************************************************************
 *                            Scoper
 ****************************************************************/

Scoper_Definition:
    'scoper' WS name=ID WS 'for' WS 'language' WS languageName=ID WS ns=Namespaces WS? defs+=ConceptDefinition*;

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
    kind='namespace_addition' WS? EQUALS WS? list=Expressionlist  SEMI WS?;

// TODO
Expressionlist:
        // (WS | t+=DummyItem)+ ;
      head=LangExpression WS?
      (PLUS WS? v+=LangExpression)*;

// TODO
AlternativeScope:
    // kind='scope' WS? EQUALS (WS | t+=DummyItem)* SEMI WS?;
    kind='scope' WS? EQUALS WS? exp=LangExpression SEMI WS?;

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
    sourceName=ID PAR_OPEN ( WS?
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
    'validator' WS validatorName=ID WS 'for' WS 'language' WS languageName=ID WS? cr+=(ConceptRule)*;

// validnameKey = "validIdentifier" ws
// typecheckKey = "typecheck" rws
// notEmptyKey  = "notEmpty" rws
// isuniqueKey  = "isunique" rws
// inKey        = "in" rws
// severityKey  = "severity" ws
// messageKey   = "message" ws
// comparator   = "<=" / "=" / ">=" / ">" / "<"
// modelReferenceStart = "${"
// modelReferenceEnd = "}"

ConceptRule:
    conceptRef=ClassifierType WS? CURLY_BEGIN WS? rules+=Rule* CURLY_END WS?;

Rule:
      (rule1=TypeEqualsRule   SEMI 
      | rule2=TypeConformsRule SEMI 
      | rule3=NotEmptyRule     SEMI 
      | rule4=ValidNameRule    SEMI
      | rule5=ExpressionRule   SEMI 
      | rule6=IsuniqueRule     SEMI) WS?; 

RuleExtras:
    CURLY_BEGIN WS? severity=Severity WS? (COMMA WS? e=Errormessage WS?)? CURLY_END WS? 
    | CURLY_BEGIN WS? message=Errormessage WS? (COMMA WS? s+=Severity WS?)? CURLY_END WS?;

Severity: 'severity' WS? COLON WS? value=ID WS? ;

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

IsuniqueRule:
    'isunique' WS? propName=[Property] WS? 'in' WS? exp2=LangExpression extra=RuleExtras? ;

Comparator: c=("<=" | EQUALS | ">=" | ">" | "<");
/****************************************************************
 *                           Typer
 ****************************************************************/


// const validFunctionNames: string[] = ["conformsTo", "equalsType", "typeof", "commonSuperTypeOf", "ancestor"];



 /**************************************************************/
// TODO
SuperProjection:
    kind='tsu' WS?;

// TemplateSpace:
//     char+=ID+ ;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\// WS?;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/ WS?;

terminal SLASH: '/';
terminal ESCAPED: '\\"';
terminal BACK_SLASH: '\\';
terminal EQUALS: '=';
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
terminal OPTIONAL: '[?';
terminal QUESTION: '?';
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
terminal TABLE:'table';
terminal STRING_TYPE: 'string';
terminal BOOLEAN_TYPE: 'boolean';
terminal NUMBER_TYPE: 'number';
terminal IDENTIFIER_TYPE: 'identifier';
terminal NEWLINE: '\n';
// terminal ANY_CHAR: /[*a-zA-Z0-9'\-[\]\|+<>=#$_.,!?@~%^&*-=+(){}:;<>?]/;

// terminal SPACE: /[ \t]/;
// terminal WSONLY: SPACE+;
terminal WS: /\s+/;
// terminal WS: (SPACE | NEWLINE)+;

terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
terminal ANYCHAR: CURLY_BEGIN | CURLY_END | COLON | QUESTION | SEMI ;
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
