## Cartographie de l'existant

| Name                          | Category                | Lang/Runtime           | License         | Game families                      | Rules expressivity (état/hasard/info cachée) | Variability (compile/run)   | Interop (formats/protocoles)            | Maturity & activity        | URL                                                       |
|-------------------------------|------------------------|-----------------------|-----------------|----------------------------------|-----------------------------------------------|-----------------------------|----------------------------------------|----------------------------|-----------------------------------------------------------|
| Game Description Language (GDL)| DSL / Rules Description | Logic (KIF/Datalog)    | Open (Academic) | Logic, board, turn-based games   | Élevée (état, transitions, déterministe)      | Compile (règles statiques)   | Peut compiler vers GGP Base              | Mature, utilisé en compétitions GGP | https://en.wikipedia.org/wiki/Game_Description_Language |
| GAML (GAMA Platform)           | DSL / Rules + Simulation | Java                  | GPLv3           | Grilles, agents, environnement dynamique | Très forte (états, hasard, interactions)     | Compile & Run               | REST/JSON                             | Actif (Inria, Univ. Hanoï)  | https://gama-platform.org/wiki/Home                           |
| Godot Engine (GDScript)        | UI / Game Framework      | GDScript (Python-like) | MIT             | 2D Arcade, Tile-based, Snake-like| Moyenne (logique scriptée)                     | Run (export desktop/web)    | JSON, WebSocket APIs                   | Très actif             | https://godotengine.org/                                   |
| Pygame                        | UI / 2D Engine           | Python + SDL           | LGPL            | Arcade, Grid games               | Moyenne (états manuels)                         | Run (paramètres dynamiques) | Formats image/sprite standard          | Stable                     | https://www.pygame.org/                                    |
| PettingZoo / RLlib             | AI / Reinforcement Learning Framework | Python          | MIT / Apache 2.0 | Multi-agent, Snake, board games | Élevée (observations, états partiels, apprentissage) | Run (entraînement dynamique) | OpenAI Gym API compatible             | Actif               | https://pettingzoo.farama.org/ / https://docs.ray.io/en/latest/rllib/ |
| Snake + RL (Q-learning/DQN exemples) | AI / Example Game Engine | Python (Pygame + PyTorch) | MIT        | Snake (grid-based)              | Moyenne (discret, complet)                      | Run                         | Compatible avec RLlib et Gym           | Ressources pédagogiques récentes | https://towardsdatascience.com/teaching-a-computer-how-to-play-snake-with-q-learning-93d0a316ddc0/ |
| SnakeGameAI                    | AI / Reinforcement Learning + Game Engine | Python (Pygame + Stable Baselines3 + OpenCV) | MIT          | Snake (grid-based)            | Forte (apprentissage, vision par ordinateur, états dynamiques) | Run (environnements et agents configurables) | Compatible OpenAI Gym, Tensorboard, modèles pré-entraînés | Actif (2023, dépôt GitHub bien maintenu) | https://github.com/khanglam/SnakeGameAI                         |

## Note d’originalité

D'après nos recherches, il n’existe pas de langage externe qui corresponde exactement à l’idée de notre DSL dédié aux jeux Snake en 2D sur grille en temps réel. Certains langages comme GAML, utilisés pour modéliser des environnements avec des agents sur grille, sont relativement proches, mais ils restent plus généraux et ne ciblent pas spécifiquement le jeu Snake.

Notre DSL se distingue par plusieurs points techniques importants :

Il est pensé spécifiquement pour le jeu Snake, avec des éléments comme le serpent, les fruits, et des règles précises pour gérer les collisions et la fin de la partie. Ce ciblage simplifie la modélisation par rapport à des langages plus larges.

Il gère explicitement des paramètres variables, par exemple la taille de la grille, les types de fruits, ou encore les règles pour finir la partie. Cette gestion de la variabilité, aussi bien à la compilation qu’à l’exécution, n’est pas toujours simple ou standard dans les langages généraux.

La syntaxe est simple et dédiée au domaine, ce qui doit permettre une écriture rapide et modifiable des variantes du jeu sans la complexité des langages plus universels.

En conclusion, même si certains langages peuvent être source d’inspiration, le projet apporte une solution spécifique et adaptée à la modélisation rapide de jeux Snake 2D en temps réel sur grille.
