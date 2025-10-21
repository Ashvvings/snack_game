grammar FourchLang

// TODO: Declare your grammar
// See doc : https://langium.org/docs/learn/workflow/write_grammar/

entry Model:
    (grid+=Grid 
    | fruit_generation+=FruitGenerator
    | player+=Player 
    | ennemies+=Ennemy 
    | scoring=Scoring 
    | fruits+=Fruit
    | game_over_conditions+=GameOverCondition)*;

Grid:
    'grid' 'size' x=NUM ('x'|'*') y=NUM;

FruitGenerator:
    'fruits' ('does' 'not')? 'reappear' ('every' seconds=NUM)?('when' 'eaten')?;

Player:
    'player' ('in' '('x=NUM',' y=NUM')')? 'with' 'size' len=NUM ('with' 'speed' speed=NUM ('variable')?)?;

Ennemy:
    'ennemy' 'in' '('x=NUM',' y=NUM')' ('moves' ('with' 'speed' speed=NUM)?)?;

Scoring:
    'fruits' 'score' point=NUM ('and' 'grow' length=NUM)?;

Fruit:
    'fruit' 'in' '('x=NUM',' y=NUM')';

GameOverCondition:
    end=('ennemies'| 'borders' | 'fruits') 'end' 'game';

hidden terminal WS: /\s+/;
// terminal ID: /[_a-zA-Z][\w_]*/;
terminal NUM: /[0-9]+[\w_]*/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
