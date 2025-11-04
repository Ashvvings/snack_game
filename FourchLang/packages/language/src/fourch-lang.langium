grammar FourchLang

entry Model:
    (grid+=Grid 
    | borderRules+=BorderRule
    | fruitConfig+=FruitConfiguration
    | player+=Player 
    | enemies+=Enemy 
    | snakeBodies+=SnakeBody
    | enemyBodies+=EnemyBody
    | walls+=Wall
    | fruits+=Fruit
    | game_over_conditions+=GameOverCondition)*;

Grid:
    'grid' 'size' x=NUM ('x'|'*') y=NUM;

BorderRule:
    'border' direction=('horizontal'|'vertical') (crossable?='crossable' | 'uncrossable');

FruitConfiguration:
    'fruits' 
    (reappear?='reappear' ('every' seconds=NUM 'seconds')? ('when' 'eaten')?)?
    ('grow' 'snake' 'by' growthLength=NUM)?;

Player:
    'player' name=ID? 'at' '(' x=NUM ',' y=NUM ')' 
    ('with' 'size' len=NUM)?;

Enemy:
    'enemy' name=ID? 'at' '(' x=NUM ',' y=NUM ')'
    ('with' 'size' len=NUM)?
    (movable?=('moves') ('speed' speed=NUM)?)?;

ToFollowSnake:
    Player | SnakeBody;

ToFollowEnemy:
    Enemy | EnemyBody;

SnakeBody:
    'snake' 'body' name=ID? 'at' '(' x=NUM ',' y=NUM ')'
    'following' (parent=[ToFollowSnake:ID]);

EnemyBody:
    'enemy' 'body' name=ID? 'at' '(' x=NUM ',' y=NUM ')'
    'following' (parent=[ToFollowEnemy:ID]);

Wall:
    'wall' 'at' '(' x=NUM ',' y=NUM ')';

Fruit:
    'fruit' 'at' '(' x=NUM ',' y=NUM ')' 'worth' points=NUM;

GameOverCondition:
    'game' 'over' 'when' 'hitting' target=('snake_body'|'enemy'|'border');

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal NUM: /[0-9]+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
