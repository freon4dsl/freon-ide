grammar FreonAst

entry Freon:
    (ast=FreonModel | edit=FreonEditor);


FreonModel:
    'language' name=ID
    (models+=Model | classifiers+=Classifier)*;

Model:
    kind='model' name=ID CURLY_BEGIN
        (properties+=Property)*
    CURLY_END;

ModelUnit:
    kind='modelunit' name=ID implements=Implements? CURLY_BEGIN
        (properties+=Property)*
        ('file-extension' '=' STRING)?
    CURLY_END;

Classifier:
    Concept | Interface | Expression | Limited | ModelUnit;

Limited:
    kind='limited' name=ID ('base' base=[Limited])? CURLY_BEGIN
        (properties+=Property)*
    CURLY_END;

Concept:
    (abstract?='abstract')? kind='concept' name=ID ('base' base=[Concept])? implements=Implements? CURLY_BEGIN
        (properties+=Property)*
    CURLY_END;

Interface:
    (abstract?='abstract')? kind='interface' name=ID ('base' base=[Interface])? CURLY_BEGIN
        (properties+=Property)*
    CURLY_END;

Property:
    (reference?='reference')? name=ID (optional?='?')? COLON type=(ClassifierType | PrimitiveType) (list?='[]')? SEMI;

Implements:
    kind='implements' (intfaces+=[Interface])+ ;

Expression:
    (abstract?='abstract')? (binary?='binary')? kind='expression'  name=ID ('base' base=[Concept])? implements=Implements? CURLY_BEGIN
        (properties+=Property)*
        ('priority' '=' priority=INT SEMI)?
    CURLY_END;

PrimitiveType:
        type=(STRING_TYPE | BOOLEAN_TYPE | NUMBER_TYPE | IDENTIFIER_TYPE);

ClassifierType:
    (conceptType=[Classifier] | intfaceType=[Interface] | expressionType=[Expression] | limitedType=[Limited] | modelunitType=[ModelUnit]);
// TOD Does not work classifierType only has undefined members
// ClassifierType:
//     classifierType=([Concept] | [Interface] | [Expression] | [Limited] | [ModelUnit]);

FreonEditor:
    'editor' name=ID
    (projections+=Projection)*;

Projection:
    classifier=ClassifierType CURLY_BEGIN
        projection=TableOrNormal
    CURLY_END;

TableOrNormal:
    table=TableProjection | normal=TextProjection;

TableProjection:
    kind=TABLE;

TextProjection: 
    PROJECTION_BEGIN
        (lines+=LineWithOptional)*
    PROJECTION_END;

LineWithOptional:
    (items+=(TemplateSpace | TextItem | OptionalProjection | Simple_external | Fragment_projection | Property_projection | SuperProjection | NEWLINE ))+;

LineWithoutOptional:
    items+=(TemplateSpace | TextItem | Simple_external | Fragment_projection | Property_projection | SuperProjection | NEWLINE )+;

TextItem:
    kind='ti';
OptionalProjection:
    kind=OPTIONAL (lines+=LineWithoutOptional)* PROJECTION_END;
Simple_external:
    kind='te';
Fragment_projection:
    kind='tf';

Property_projection:
    SingleProperty |  l=ListProperty;// | button_projection;

SingleProperty:
    PROPERTY_REF_BEGIN 
        "self."? propName=[Property] (COLON projName=ID)? DisplayType?  KeywordDecl? ExternalInfo?
    CURLY_END;

terminal DisplayType:
    "text" | "checkbox" | "radio" | "switch" | "inner-switch" | "slider";

ListProperty:
    kind='list';

KeywordDecl:
    PROJECTION_BEGIN name=ID (PROJECTION_SEPARATOR ID)? PROJECTION_END;

ExternalInfo:
    ("wrap" '=' wrap=ID  params+=Key_value_pair*)
    | 
    ("replace" '=' replace=ID  params+=Key_value_pair*);

Key_value_pair:
    key=ID '=' STRING ;

SuperProjection:
    kind='tsu';

TemplateSpace:
    char+=ID+ ;

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
terminal OPTIONAL: '[?';
terminal NEWLINE: '\n';
// terminal ANY_CHAR: /[*a-zA-Z0-9'\-[\]\|+<>=#$_.,!?@~%^&*-=+(){}:;<>?]/;

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
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
