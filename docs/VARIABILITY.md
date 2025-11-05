# Variabilités et Scénarios

## Variabilité : compile-time vs run-time

### Paramètres à la compilation (Compile-Time)

Ces paramètres définissent la structure ou la logique fixe de la variante du jeu. Ils sont figés au moment de construire la version du jeu et influencent son comportement profond :

- Vitesse du jeu au démarrage (ex : vitesse initiale fixe avant réglage dynamique)

- Présence d’un chronomètre ou décompte, qui conditionne la limite de temps

- Taille et forme de la grille, car elles déterminent l’espace de jeu

- Grille fermée ou non (effet téléportation aux bords ou collision fatale)

- Taille initiale du serpent et nombre de serpents en jeu

- Nombre initial de fruits

- Mode d’apparition et type des fruits (ex : fruits avec valeurs, fruits classiques)

- Règles de fin de partie liées aux bords ou à la morsure du serpent

Ces choix peuvent impacter la structure du plateau, les règles et la sémantique du jeu.

### Paramètres à l’exécution (Run-Time)

Ces paramètres sont dynamiques et peuvent être ajustés pendant la partie sans modifier la logique de base :

- Réglage de la vitesse du jeu (accélération ou ralentissement en temps réel)

- Contrôle de la direction du(des) serpent(s)

- Affichage ou masquage des points et autres éléments visuels

Ils modifient la présentation ou le niveau de défi sans changer les règles fondamentales.

## Scénarios d’usage

Nous proposons trois scénarios illustrant l’impact concret de ces paramètres :

- Jeu Snake classique :

    Grille 10x9, serpent de taille 3.

    1 fruit qui vaut 1, fait grandir de 1 et réapparaît quand il est mangé.

    Fin de jeu si serpent se mord.

- Variante bord fermé :

    Même grille et serpent.

    1 fruit qui vaut 1, fait grandir de 1 et réapparaît quand il est mangé.

    Des fruits apparaissent aléatoirement toutes les 2 secondes.

    Les bords provoquent la fin du jeu.

    Même croissance du serpent.

- SnakeAdder :

    Grille 16x16, serpent taille 2.

    4 fruits (3, 12, 9, 21)

    Fruits ont une valeur entière, matrice des multiples de 3 autorisés.

    Collision avec serpent éliminante, mais pas avec les bords.

    Fruits peuvent terminer la partie selon leur valeur.

    Fruits augmentent la taille et le score si non fatals.

- Pac-Man :

    Grille x, serpent taille 1, y fruits, 4 ennemis, des murs.

    Collision avec les ennemis éliminante, mais pas avec les bords ni les murs.

    Fruits augmentent le score mais pas la taille du serpent.

    Les ennemis se déplacent indépendemment du serpent.

    Manger les y fruits termine la partie (victoire).

## Presets dans notre grammaire

- Jeu Snake classique :
    grid size 10 x 9

    border horizontally crossable
    border vertically crossable

    fruits reappear when eaten grow snake by 1

    player blob at (3, 3) with size 3

    snake body bodA at (3,4) following blob
    snake body bodB at (3,5) following bodA

    fruit at (7, 6) worth 1

    game over when hitting snake_body

    
- Variante bords fermés :
    grid size 10 x 9

    fruits reappear every 2 seconds

    player blob at (3, 3) with size 3

    snake body bobA at (2, 3) following blob
    snake body bobB at (1, 3) following bobA

    fruit at (7, 6) worth 1

    game over when hitting border


- SnakeAdder :
    grid size 16 x 16

    game mode adder

    fruits reappear every 3 seconds

    player snackinou at (14,3) with size 2

    snake body bodA at (14,4) following snackinou

    fruit at (1,2) worth 3
    fruit at (1,5) worth 12
    fruit at (8,9) worth 9
    fruit at (5,2) worth 21

    enemy pasMultiple at (7,7) 

- Pac-Man :
