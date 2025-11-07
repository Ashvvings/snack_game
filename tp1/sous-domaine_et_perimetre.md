# Sous-domaine et périmètre

Titre du sous-domaine : *Matrice 2D "snake-like"*

## Concepts centraux

Le sous-domaine s’appuie sur une grille discrète représentant l’espace de jeu, dans laquelle évolue un·e ou plusieurs joueur·euse·s (ou serpents) dont la taille peut varier au fil du temps. Les déplacements sont limités aux quatre directions principales (haut, bas, gauche, droite). Le système gère les collisions, qui peuvent être bloquantes (fin de partie), non bloquantes (récupération d’objets) ou éliminantes. Des objets apparaissent de manière aléatoire sur la grille et peuvent être ramassés pour accumuler des points ou modifier la taille de la ou du joueur·euse. Enfin, la situation de fin de partie (game over) est définie selon plusieurs critères, comme une collision avec soi-même, un mur, ou un dépassement de chronomètre.

## Familles de jeux visées

Ce sous-domaine vise exclusivement les jeux 2D se déroulant sur une grille discrète, centrés sur des mécaniques proches du jeu Snake classique et ses variantes. Il exclut expressément les jeux 3D, les jeux multijoueur·euse·s, les systèmes complexes de tournoi multi-tables, et tout gameplay basé sur des mécanismes autres que le déplacement et la collecte sur grille (par exemple, pas de physique continue ni d’environnement ouvert).

## Pourquoi c’est atteignable et fécond en variantes

Le jeu repose sur des états successifs simples, clairement définis et entièrement descriptibles, ce qui facilite la modélisation et la mise en œuvre.
Les concepts fondamentaux du sous-domaine (taille du ou de la joueur·euse, collisions, apparition d’objets, type d’objets) sont indépendants mais peuvent être combinés et paramétrés de nombreuses manières, générant ainsi une grande diversité de variantes possibles. Par exemple, on peut ajuster la taille de la grille, le comportement aux bordures, la nature des objets ou les règles de fin de partie.

<!--


## Concepts centraux :
    - Grille
    - Déplacements
    - Taille du ou de la joueur·euse variable
    - Collisions
    - Apparition aléatoire des objets
    - Récupérer objets
    - GAME OVER

### Grille

Le jeu sera basé sur une grille de taille variable. Chaque cellule de la grille peut contenir un objet ou être vide. Selon la variante choisie, le ou la joueur·euse peut ou non traverser les bords de la grille (effet "téléportation"). Il peut aussi prendre plusieurs cases (taille variable) s'il augmente de taille.

### Déplacements

La ou le joueur·euse peut se déplacer dans les 4 directions (haut, bas, gauche, droite) sur la grille. Selon certaines variantes, soit le ou la joueur·euse avance par défaut et peut seulement changer de direction, soit la ou le joueur·euse peut se déplacer librement.
De plus, le temps entre deux déplacements peut être fixe ou variable (accélération progressive, ralentissement, etc.).

### Taille du ou de la joueur·euse variable

Dans la version classique du Snake, le serpent grandit au fur et à mesure qu'il mange des objets.

### Collisions

Les collisions peuvent être de différents types : collision bloquante, collision non bloquante (récupération objet par exemple), collision éliminante.

### Apparition aléatoire des objets

Les objets apparaissent aléatoirement sur la grille sur les x laps de temps.

### Récupérer objets

Une fois entré en collision avec un objet, le ou la joueur·euse le récupère et gagne des points. Selon la variante choisie, certains objets peuvent faire grandir le ou la joueur·euse, d'autres peuvent lui faire perdre des points ou des vies, etc.

### GAME OVER

Le principe de vie et de mort dans le jeu. Peut correspondre à plusieurs situations : une collision(avec soi-même, des murs ou des ennemis), une fin de chronomètre, etc.


## Famille de jeux vidéos visés

Pas de 3D
Pas de multi-tables
Pas de tournois
Pas de multi-joueur·euse·s


## Pourquoi est-ce atteignable et fécond en variantes

Présence d'états successifs exhaustivement descriptibles
Plusieurs concepts centraux indépendants, paramétrables et combinables
-->

