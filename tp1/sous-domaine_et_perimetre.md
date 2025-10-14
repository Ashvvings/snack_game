# Matrice 2D "snake-like"

## Concepts centraux :
    - Grille
    - Déplacements
    - Taille du joueur variable
    - Collisions
    - Apparition aléatoire des objets
    - Récupérer objets
    - GAME OVER

### Grille

Le jeu sera basé sur une grille de taille variable. Chaque cellule de la grille peut contenir un objet ou être vide. Selon la variante choisie, le joueur peut ou non traverser les bords de la grille (effet "téléportation"). Il peut aussi prendre plusieurs cases (taille variable) s'il augmente de taille.

### Déplacements

Le joueur peut se déplacer dans les 4 directions (haut, bas, gauche, droite) sur la grille. Selon certaines variantes, soit le joueur avance par défaut et peut seulement changer de direction, soit le joueur peut se déplacer librement.
De plus, le temps entre deux déplacements peut être fixe ou variable (accélération progressive, ralentissement, etc.).

### Taille du joueur variable

Dans la version classique du Snake, le serpent grandit au fur et à mesure qu'il mange des objets.

### Collisions

Les collisions peuvent être de différents types : collision bloquante, collision non bloquante (récupération objet par exemple), collision éliminante.

### Apparition aléatoire des objets

Les objets apparaissent aléatoirement sur la grille sur les x laps de temps.

### Récupérer objets

Une fois entré en collision avec un objet, le joueur le récupère et gagne des points. Selon la variante choisie, certains objets peuvent faire grandir le joueur, d'autres peuvent lui faire perdre des points ou des vies, etc.

### GAME OVER

Le principe de vie et de mort dans le jeu. Peut correspondre à plusieurs situations : une collision(avec soi-même, des murs ou des ennemis), une fin de chronomètre, etc.


## Famille de jeux vidéos visés

Pas de 3D
Pas de multi-tables
Pas de tournois
Pas de multi-joueurs


## Pourquoi est-ce atteignable et fécond en variantes

Présence d'états successifs exhaustivement descriptibles
Plusieurs concepts centraux indépendants, paramétrables et combinables


