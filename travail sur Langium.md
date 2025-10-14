# Travail de grammaire du langage sur Langium

Le fichier suivant a pour objectif de conserver l'avancement du travail effectué sur Langium, car la page web oublie les modifications lors d'un refresh.

Proposition de nom de langage : "FourchLangium".

## Première version du langage

- Grammaire :
```
grammar SnakeGame

entry Model:
    (grid+=Grid 
    | player+=Player 
    | ennemies+=Ennemy 
    | scoring=Scoring 
    | fruits+=Fruit
    | game_over_conditions+=GameOverCondition)*;

Grid:
    'grid' 'size' x=NUM ('x'|'*') y=NUM;

Player:
    'player' ('in' '('x=NUM',' y=NUM')')?;

Ennemy:
    'ennemy' 'in' '('x=NUM',' y=NUM')';

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

```


- Exemple utilisation :
```
grid size 5 x 5

player in (2,2)
//player // snake then placed at random

ennemy in (3,3)
ennemy in (2,3)

fruits score 3 and grow 1
// fruits score 1 // snake doesn't grow -> Pacman

fruit in (2,2)
fruit in (4 ,2)
fruit in (2, 4)
// fruit in (243513264, 2) // not correct, should be flagged at validation

ennemies end game
borders end game
```