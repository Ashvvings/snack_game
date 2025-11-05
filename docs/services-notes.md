# Services & attentes

## Services

Pour chaque boîte verte de la figure, écrivez 2–3 phrases dans docs/services-notes.md expliquant ce que votre DSL devra permettre, par exemple en étant plus précis que les descriptions génériques ci-dessous:

### Légalité & coups

Notre DSL devra permettre de décrire précisément l’état de la grille et de la partie, en listant la position de chaque élément du jeu (joueur·euse, ennemis, fruits, obstacles). Les règles intégrées empêcheront tout chevauchement ou toute action illégale, comme placer deux objets sur la même case. Cela garantira que chaque coup possible est cohérent avec les règles du jeu et que le système peut déterminer quand une partie se termine (par collision ou condition de victoire).

### Complexité

Le DSL exposera différents paramètres liés à la complexité du jeu, tels que la taille de la grille, la vitesse initiale, ou la densité d’objets présents au départ. Ces paramètres permettront de créer et de comparer plusieurs variantes du jeu Snake avec des niveaux de difficulté différents. En ajustant ces valeurs, un utilisateur pourra ainsi explorer l’impact de chaque choix sur la profondeur de jeu ou le nombre de coups possibles à chaque étape.

### Mode textuel

Le DSL offrira une notation textuelle claire et stable pour représenter l’état du jeu à un instant donné. Chaque ligne pourra décrire la configuration de la grille (positions du serpent, des fruits, etc.) sans exécuter la logique de déplacement. L’objectif est de garder une syntaxe simple mais expressive, utile pour sauvegarder, rejouer ou charger une situation de manière reproductible.

### Graphique/skin

Le rendu graphique du jeu sera affiché dans une interface web illustrant la grille, le score et les éléments en temps réel. Il n'y a pas de skin prévu pour le moment.

### IA basique

Notre langage pourra être utilisé pour entraîner et faire fonctionner une IA basique, par exemple un joueur automatique se déplaçant aléatoirement ou suivant une heuristique simple (chercher le fruit le plus proche). Cela permettra de tester la cohérence du DSL et la robustesse des variantes du jeu sans intervention humaine. L’objectif n’est pas la performance, mais l’expérimentation de comportements logiques simples.

### IA plus forte (optionnel)

Nous n'avons pas prévu de faire fonctionner notre langage avec une IA plus forte.

### LLM

Nous souhaitons qu’un modèle de langage puisse comprendre et utiliser notre DSL pour interagir avec le jeu Snake et ses variantes. Le LLM devra être capable de lire les états du jeu, d’exprimer des coups valides et de tester des configurations différentes. Cette compatibilité facilitera la génération automatique de scénarios et la comparaison entre comportements humains et générés.
