# Travail de grammaire du langage sur Langium

Le fichier suivant a pour objectif de conserver l'avancement du travail effectué sur Langium, car la page web oublie les modifications lors d'un refresh.

Proposition de nom de langage : "FourchLangium".

## Première version du langage

- Grammaire :
```
grammar FourchLang

entry Model:
    (grid+=Grid 
    | gameMode+=GameMode
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

GameMode:
    'game' 'mode' mode=('snake'|'pacman'|'adder');

BorderRule:
    'border' direction=('horizontally'|'vertically') 'crossable';

FruitConfiguration:
    'fruits' 
    (reappear?='reappear' ('every' seconds=NUM 'seconds')? ('when' 'eaten')?)?
    ('grow' 'snake' 'by' growthLength=NUM)?;

Player:
    'player' name=ID? 'at' '(' x=NUM ',' y=NUM ')' 
    ('with' 'size' len=NUM)?
    ('with' 'speed' speed=NUM ('variable')?)?
    ('with' 'color' color=COLOR ('variable')?)?;

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

COLOR returns string:
    'red' | 'green' | 'blue' | 'yellow' | 'black' | 'white' | 'gray' | 'magenta' | 'cyan';

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal NUM: /-?[0-9]+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

```


- Exemple utilisation :


```
grid size 4 x 9

border horizontally crossable
border vertically not crossable

fruits reappear when eaten grow snake by 1
// fruits reappear when eaten grow snake by 0 // snake doesn't grow -> Pacman

player minu at (2,4) with size 2

enemy at (0,1) can move

snake body bod at (3,4) following minu

wall at (2,8)

fruit at (1,7) worth -4
// fruit at (243513264, 2) // not correct, should be flagged at validation

game over when hitting snake_body
game over when hitting border

```