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
