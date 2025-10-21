# Variabilités et Scénarios

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
