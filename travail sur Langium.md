# Travail de grammaire du langage sur Langium

Le fichier suivant a pour objectif de conserver l'avancement du travail effectué sur Langium, car la page web oublie les modifications lors d'un refresh.

Proposition de nom de langage : "FourchLangium".

## Première version du langage

- Grammaire :
```
grammar FourchLangium

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
    'player' ('in' '('x=NUM',' y=NUM')')? 'with' 'size' len=NUM (',' 'speed' speed=NUM ('variable')?)?;

Ennemy:
    type=('ennemy'|('snake body')) 'in' '('x=NUM',' y=NUM')' ('moves' ('with' 'speed' speed=NUM)?)?;

Scoring:
    'fruits' 'score' point=NUM ('and' 'grow' length=NUM)?;

Fruit:
    'fruit' 'in' '('x=NUM',' y=NUM')';

GameOverCondition:
    end=('snake'|'ennemies'|'borders'|'fruits') 'end' 'game';

hidden terminal WS: /\s+/;
// terminal ID: /[_a-zA-Z][\w_]*/;
terminal NUM: /[0-9]+[\w_]*/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

```


- Exemple utilisation :
```
grid size 5 x 5

fruits reappear when eaten

player in (2,2) with size 0
//player // snake then placed at random
//player in (2,2) with speed 4 // gotta go fast
player in (2,2) with size 3, speed 1 variable // display way to modulate speed

snake body in (3,4)
ennemy in (2,3)
ennemy in (2,4) moves
ennemy in (2,5) moves with speed 2

fruits score 3 and grow 1
// fruits score 1 // snake doesn't grow -> Pacman

fruit in (2,2)
fruit in (4 ,2)
fruit in (2, 4)
// fruit in (243513264, 2) // not correct, should be flagged at validation

ennemies end game
borders end game
```