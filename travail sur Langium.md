# Travail de grammaire du langage sur Langium

Le fichier suivant a pour objectif de conserver l'avancement du travail effectué sur Langium, car la page web oublie les modifications lors d'un refresh.

## Première version du langage

- Grammaire :
```
grammar SnakeGame

entry Model:
    (snake+=Snake | grid+=Grid | fruits+=Fruit)*;

Snake:
    'snake' 'size' size=NUM;

Grid:
    'grid' 'size' x=NUM 'x' y=NUM;

Fruit:
    'fruit' 'in' '('x=NUM',' y=NUM')';

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal NUM: /[0-9]+[\w_]*/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
```


- Exemple utilisation :
```
snake size 3
grid size 10 x 9
fruit in (2,2)
fruit in (4 ,2)
fruit in (2, 4)
```