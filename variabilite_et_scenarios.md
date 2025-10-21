# Variabilités et Scénarios

## Variabilité : compile-time vs run-time

Dans notre projet, nous distinguons clairement les paramètres qui agissent à la compilation (Compile-Time, CT) de ceux modifiables en cours de jeu (Run-Time, RT).
Paramètres à la compilation (Compile-Time)

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
Paramètres à l’exécution (Run-Time)

Ces paramètres sont dynamiques et peuvent être ajustés pendant la partie sans modifier la logique de base :

- Réglage de la vitesse du jeu (accélération ou ralentissement en temps réel)

- Contrôle de la direction du(des) serpent(s)

- Affichage ou masquage des points et autres éléments visuels

Ils modifient la présentation ou le niveau de défi sans changer les règles fondamentales.

## Scénarios d’usage

Nous proposons trois scénarios illustrant l’impact concret de ces paramètres :

- Jeu Snake classique :

    Grille 10x9, serpent de taille 2, 1 fruit.

    Fin de jeu si serpent se mord.

    Manger un fruit augmente la taille du serpent.

- Variante bord fermé :

    Même grille et serpent.

    Les bords provoquent aussi la fin du jeu.

    Même croissance du serpent.

- SnakeAdder :

    Grille 16x16, serpent taille 2, 1 fruit.

    Fruits ont une valeur entière, matrice des multiples autorisés.

    Collision avec serpent éliminante, mais pas avec les bords.

    Fruits peuvent terminer la partie selon leur valeur.

    Fruits augmentent la taille et le score si non fatals.


<!-- 

## À la compilation (Compile-Time)
- Vitesse du jeu au démarrage
- Présence d'une chronomètre/décompte
- Taille de la grille
- Grille fermée ou non
- Taille du Serpent au démarrage
- (Nombre de Serpents)
- Nombre de Fruits au démarrage
- Mode d'apparition des Fruits
- Type de Fruits
- Est-ce que les bords mettent fin au jeu ?
- Est-ce que le serpent se mord ?
- 

## À l'exécution (Run-Time)
- Réglage de la vitesse du jeu
- Direction du(des) Serpent(s)
- Affichage des points (afficher/cacher)
- 

## Scénarios concrets
- Jeu de "Snake" classique : <br>
    - grille de 10x9, serpent de 2 de long au démarrage, 1 Fruit au démarrage. 
    - Le serpent met fin au jeu en cas de collisionavec lui même. 
    - Manger un Fruit avec le Serpent fait croître la longueur du Serpent de 1.
- Variante du jeu classique : 
    - Même disposition au démarrage. 
    - Les bords et le Serpent mettent fin au jeu en cas de collision. 
    - Même augmentation de taille par les fruits.
- SnakeAdder : 
    - Grille de 16x16, Serpent de taille 2, 1 Fruit, un nombre de départ indiquant les premiers multiples autorisés. 
    - Les Fruits ont une valeur entière. Les bords de la grille ne mettent pas fin au jeu en cas de collision, le Serpent met fin au jeu en cas de collision avec lui même, les Fruits mettent fin en jeu lorsque mangés si leur valeur n'est pas un multiple du nombre courant. 
    - Les Fruits augmentent la taille du Serpent de 1 et le score de 1 lorsque mangés s'ils ne terminent pas la partie. 
-->