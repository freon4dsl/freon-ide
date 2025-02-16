grammar FreonAst

entry Freon:
    WS? (ast=FreonModel | edit=FreonEditor);


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
    Concept | Interface | Expression | Limited | ModelUnit;

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
    | instance=InstanceExpression WS? ;

InstanceExpression:
    concept=[Limited] WS? COLON WS? instance=[Instance] WS?;

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
    (abstract?='abstract' WS)? kind='interface' WS name=ID WS? ('base' WS base=[Interface] WS?)? CURLY_BEGIN WS?
        (properties+=Property)*
    CURLY_END WS?;

Property:
    (reference?='reference' WS)? name=ID WS? (optional?='?' WS?)? COLON WS? type=(ClassifierType | PrimitiveType) WS? (list?='[]' WS?)? SEMI WS?;

Implements:
    kind='implements' WS (intfaces+=[Interface] WS)+  ;

Expression:
    (abstract?='abstract' WS)? (binary?='binary' WS)? kind='expression' WS  name=ID WS? ('base' WS base=[Classifier] WS?)? implements=Implements? CURLY_BEGIN WS?
        (properties+=Property)*
        ('priority' WS? EQUALS WS? priority=INT WS? SEMI WS?)?
    CURLY_END WS?;

PrimitiveType:
        type=(STRING_TYPE | BOOLEAN_TYPE | NUMBER_TYPE | IDENTIFIER_TYPE);

ClassifierType:
    (conceptType=[Classifier] | intfaceType=[Interface] | expressionType=[Expression] | limitedType=[Limited] | modelunitType=[ModelUnit]);
// TOD Does not work classifierType only has undefined members
// ClassifierType:
//     classifierType=([Concept] | [Interface] | [Expression] | [Limited] | [ModelUnit]);

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
    PAR_OPEN | PAR_CLOSE | AMPERSAND | MULTI | SINGLE_QUOTE | BACK_QUOTE | e=EQUALS | PLUS | MINUS | SLASH |
    'base' | 'implements' | 'concept' | 'model' | 'language' | 'editor' | 'trigger' | 'referenceShortcut' | 'symbol' |
    'abstract' | 'precedence' | 'priority' | 'reference' | 'true' | 'false'
    );
TableTextItem:
    (a=COLON | b=CURLY_BEGIN | d=CURLY_END |c=SEMI| e=INT | COMMA | DOT | EXCL | AT |  text=ID |
    PAR_OPEN | PAR_CLOSE | AMPERSAND | MULTI | SINGLE_QUOTE | BACK_QUOTE | e=EQUALS | PLUS | MINUS | SLASH |
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
        ('self.')? propName=[Property] (COLON projName=ID)? WS? 
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

SuperProjection:
    kind='tsu' WS?;

// TemplateSpace:
//     char+=ID+ ;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\// WS?;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/ WS?;

terminal SLASH: '/';
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
//     UNESCAPED
//   | ESCAPE
//     (
//         '"'
//       | "\\"
//       | "/"
//       | "|"
//       | "["
//       | "]"
//       | "{"
//       | "}"
//       | "$"
//       | "b" 
//       | "f" 
//       | "n" 
//       | "r" 
//       | "t" 
//     );

// terminal ESCAPE: "\\";

// terminal UNESCAPED: /[^\0-\x1F\x22\x5C]/;
// terminal ANYTHING_BUT: !("${")+;
