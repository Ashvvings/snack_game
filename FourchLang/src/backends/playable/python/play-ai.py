from enum import Enum
import json
import sys
import pygame

""" from math import *
from random import *
from time import *"""

class Direction(Enum) :
    HAUT = 1
    GAUCHE = 2
    BAS = 3
    DROITE = 4

class Colors(Enum) :
    WHITE = "#FFFFFF"
    GREEN = "#42F54E"
    RED = "#C4040E"
    YELLOW = "#E6CC07"
    BLUE = "#0707E6"
    BLACK = "#000000"
    GRAY = "#707070"
    CYAN = "#14DEB9"
    MAGENTA = "#AB14DE"
    
class Mode(Enum) :
    SNAKE = 1
    PACMAN = 2
    ADDER = 3
    
class Jeu :
    class Player:
        def __init__(self, id : str, x : int, y : int, size : int, speed : int, color : Colors, initial_fruit_number : int = 1, fils : str = None, snake_bodies : list = [] ) :
            self.id = id
            self.position = (x,y)
            self.size = size
            self.speed = speed
            self.color = color
            self.fils = fils
            self.initial_fruit_number = initial_fruit_number
            self.snake_bodies = snake_bodies
    
    class Fruit:
        def __init__(self, x : int, y : int, points : int) :
            self.position = (x,y)
            self.points = points

    class FruitConfig:
        def __init__(self, reappear : bool, respawn_time : int, snake_growth : int):
            self.reappear = reappear
            self.respawn = respawn_time
            self.snake_growth = snake_growth
    
    class Enemy:
        def __init__(self, id : str, x : int, y : int, size : int, speed : int, color : Colors, fils : str = None, enemy_bodies : list = [] ) :
            self.id = id
            self.position = (x,y)
            self.size = size
            self.speed = speed
            self.color = color
            self.fils = fils
            self.enemy_bodies = enemy_bodies
    
    class Grid:
        def __init__(self, x : int, y : int, vertically : bool, horizontally : bool) :
            self.x = x
            self.y = y
            self.vertically = vertically
            self.horizontally = horizontally
    
    class SnakeBody:
        def __init__(self, id : str, x : int, y : int, parent_id : str) :
            self.id = id
            self.position = (x,y)
            self.parent_id = parent_id
    
    class Wall:
        def __init__(self, x : int, y : int) :
            self.position = (x,y)
    
    class EnemyBody:
        def __init__(self, id : str, x : int, y : int, parent_id : str) :
            self.id = id
            self.position = (x,y)
            self.parent_id = parent_id

    class GameMode:
        def __init__(self, mode : Mode) :
            self.gameMode = mode
    
    class GameOverCondition :
        def __init__(self, type : list) : 
            self.type = type

    gameMode = None
    player = None
    enemies = []
    walls = []
    fruits = []
    grid = None
    border_rules = []
    fruits_config = None
    game_over_conditions = []
    direction = Direction.GAUCHE
    fenetre = None
    
    
    def JSONtoPython(self, file_path : str):
        with open(file_path, "r") as f:
            game = json.load(f)
        
        self.gameMode = self.GameMode(game["game-mode"])
        self.player = self.Player(
            game["player"]["id"],
            game["player"]["position"]["x"],
            game["player"]["position"]["y"],
            game["player"]["size"],
            game["player"]["speed"],
            game["player"]["color"]
        )
        
        self.enemies = []
        for enemy in game["enemies"]:
            self.enemies.append(self.Enemy(
                enemy["id"],
                enemy["position"]["x"],
                enemy["position"]["y"],
                enemy["size"],
                enemy["speed"],
                enemy["color"]
            ))
    
        self.snakeBodies = []
        for snakeBody in game["snake-body"]:
            self.snakeBodies.append(self.SnakeBody(
                snakeBody["id"],
                snakeBody["position"]["x"],
                snakeBody["position"]["y"],
                snakeBody["follows"]
            ))
        if self.snakeBodies!=[]:
            for body in self.snakeBodies:
                if body.parent_id == self.player.id:
                    self.player.fils = body
                    if body.position == (self.player.position[0],self.player.position[1]-1):
                        self.direction = Direction.DROITE
        ordered_bodies = []
        current_parent_id = self.player.id
        while True:
            found = False
            for body in self.snakeBodies:
                if body.parent_id == current_parent_id:
                    ordered_bodies.append(body)
                    current_parent_id = body.id
                    found = True
                    break
            if not found:
                break
        self.snakeBodies = ordered_bodies
    
        self.enemyBodies = []
        for enemyBody in game["enemy-bodies"]:
            self.enemyBodies.append(self.EnemyBody(
                enemyBody["id"],
                enemyBody["position"]["x"],
                enemyBody["position"]["y"],
                enemyBody["follows"]
            ))
        ordered_bodies = []
        for enemy in self.enemies:
            current_parent_id = enemy.id
            while True:
                found = False
                for body in self.enemyBodies:
                    if body.parent_id == current_parent_id:
                        ordered_bodies.append(body)
                        current_parent_id = body.id
                        found = True
                        break
                if not found:
                    break
        self.enemyBodies = ordered_bodies
        
    
        self.walls = []
        for wall in game["walls"]:
            self.walls.append(self.Wall(wall["position"]["x"], wall["position"]["y"]))
    
        self.fruits = []
        for fruit in game["fruits"]:
            self.fruits.append(self.Fruit(
                fruit["position"]["x"],
                fruit["position"]["y"],
                fruit["points"]
            ))
    
        self.fruits_config = self.FruitConfig(
            game["fruits-config"]["reappear"],
            game["fruits-config"]["respawn-time"],
            game["fruits-config"]["snake-growth"])

        vertically = False
        horizontally = False
        if "vertically" in game["border-rules"]:
            vertically = True
        
        if "horizontally" in game["border-rules"]:
            horizontally = True
        
        self.grid = self.Grid(game["grid"]["x"], game["grid"]["y"], vertically, horizontally)

        self.game_over_conditions = []
        for condition in game["game-over-conditions"]:
            self.game_over_conditions.append(self.GameOverCondition([condition["target"]]))
    
        print("Bravo ! Le jeu a bien été chargé depuis le fichier JSON.")
        self.fenetre = pygame.display.set_mode(((self.grid.y+2)*20, (self.grid.x+2)*20))
    
    def toString (self) :
        print(self.player.id)
    
    def __init__(self):
        pass


    # Met à jour la direction en fonction des touches appuyées
    # DONE
    def take_direction(self):
        while True:
            for event in pygame.event.get():
                if event.type == pygame.KEYDOWN:
                    # Flèches directionnelles
                    if event.key == pygame.K_UP or event.key == pygame.K_z:
                        if len(self.player)>1:
                            if (self.player.position[0]-1,self.player.position[1])==self.player.fils.position:
                                pass
                        self.direction=Direction.HAUT
                        return
                    if event.key == pygame.K_DOWN or event.key == pygame.K_s:
                        if len(self.player)>1:
                            if (self.player.position[0]+1,self.player.position[1])==self.player.fils.position:
                                pass
                        self.direction=Direction.BAS
                    if event.key == pygame.K_LEFT or event.key == pygame.K_q:
                        if len(self.player)>1:
                            if (self.player.position[0],self.player.position[1]-1)==self.player.fils.position:
                                pass
                        self.direction=Direction.GAUCHE
                    if event.key == pygame.K_RIGHT or event.key == pygame.K_d:
                        if len(self.player)>1:
                            if (self.player.position[0],self.player.position[1]+1)==self.player.fils.position:
                                pass
                        self.direction=Direction.DROITE

    

    # Déplace le joueur dans la direction actuelle
    # DONE
    def player_forward(self):
        for body in self.player.snake_bodies.reverse():
            if body.parent_id==self.player.id:
                body.position=self.player.position
            else:
                for b in self.snakeBodies:
                    if body.parent_id==b.id:
                        body.position=b.position
        if self.direction==Direction.HAUT:
            self.player.position = (self.player.position[0]-1,self.player.position[1])
        if self.direction==Direction.BAS:
            self.player.position = (self.player.position[0]+1,self.player.position[1])
        if self.direction==Direction.GAUCHE:
            self.player.position = (self.player.position[0],self.player.position[1]-1)
        if self.direction==Direction.DROITE:
            self.player.position = (self.player.position[0],self.player.position[1]+1)

    # TODO Dorian
    def enemy_forward(self, enemyID):
        for enemy in self.enemies:
            pass
        
        if self.direction==Direction.HAUT:
            self.player.position = (self.player.position[0]-1,self.player.position[1])
        if self.direction==Direction.BAS:
            self.player.position = (self.player.position[0]+1,self.player.position[1])
        if self.direction==Direction.GAUCHE:
            self.player.position = (self.player.position[0],self.player.position[1]-1)
        if self.direction==Direction.DROITE:
            self.player.position = (self.player.position[0],self.player.position[1]+1)
    
    # TODO Jules
    def verif_over(self, d):
        if d==Direction.HAUT:
            pos_fut=(self.player.position[0]-1, self.player.position[1])
        if d==Direction.BAS:
            pos_fut=(self.player.position[0]+1, self.player.position[1])
        if d==Direction.GAUCHE:
            pos_fut=(self.player.position[0], self.player.position[1]-1)
        if d==Direction.GAUCHE:
            pos_fut=(self.player.position[0], self.player.position[1]+1)
        for goc in self.game_over_conditions :
            match goc :
                case "border" :
                    return (
                        ((not self.grid.horizontally) and (pos_fut[1] < 0 or pos_fut[1] > self.grid.y)) 
                        or ((not self.grid.vertically) and (pos_fut[0] < 0 or pos_fut[0] > self.grid.x)))
                case "snake_body" :
                    for body in self.snakeBodies :
                        if pos_fut == body.position : return True
                    return False
                case "enemy" :
                    for enemy in self.enemies :
                        if pos_fut == enemy.position : return True
                    for body in self.enemyBodies :
                        if pos_fut == body.position : return True
                    return False
                case "wall" :
                    for wall in self.walls :
                        if pos_fut == wall.position : return True
                    return False
                
    def verif_wall(self, d):
        if d==Direction.HAUT:
            pos_fut=(self.player.position[0], self.player.position[1]-1)
        if d==Direction.BAS:
            pos_fut=(self.player.position[0], self.player.position[1]+1)
        if d==Direction.GAUCHE:
            pos_fut=(self.player.position[0]-1, self.player.position[1])
        if d==Direction.DROITE:
            pos_fut=(self.player.position[0]+1, self.player.position[1])
        for wall in self.walls :
            if pos_fut == wall.position : return True
        if self.gameMode.gameMode==Mode.PACMAN:
            if (pos_fut[1]<0 or pos_fut[1]>self.grid.x-1):
                return True
        return False
    
    def check_tile_is_empty(self, pos0 : int, pos1 : int, verbose : bool = False):
        # pos0 et pos1 correspondent à position[0] et position[1]
        # Le dessin utilise position[0] pour X (0 à grid.y-1) et position[1] pour Y (0 à grid.x-1)
        input_position = (pos0, pos1)
        if ((pos0 < 0 or pos0 > self.grid.y-1) or (pos1 < 0 or pos1 > self.grid.x-1)) : 
            return False
        if self.player.position == input_position :
            return False
        for enemy in self.enemies:
            if enemy.position == input_position : 
                return False
        for body in self.enemyBodies:
            if body.position == input_position : 
                return False
        for body in self.snakeBodies:
            if body.position == input_position :
                return False
        for fruit in self.fruits:
            if fruit.position == input_position : 
                return False
        for wall in self.walls:
            if wall.position == input_position : 
                return False
        return True
    
    def get_empty_tiles(self):
        """Retourne une liste de toutes les cases vides (pos0, pos1)"""
        empty_tiles = []
        for pos0 in range(self.grid.y):  # position[0] va de 0 à grid.y-1
            for pos1 in range(self.grid.x):  # position[1] va de 0 à grid.x-1
                if self.check_tile_is_empty(pos0, pos1):
                    empty_tiles.append((pos0, pos1))
        return empty_tiles
        
    # Supprime le fruit mangé et augmente la taille du serpent
    def fruit_eat(self):
        for a in range(len(self.fruits)):
            if self.player.position==self.fruits[a].position:
                # Augmenter la taille et ajouter les segments immédiatement
                if not self.gameMode.gameMode==Mode.PACMAN:
                    growth = self.fruits_config.snake_growth
                    self.player.size += growth
                    self.add_body_segment(growth)
                
                self.fruits.remove(self.fruits[a])
                if(self.fruits_config.respawn != None):
                    self.fruit_timers.append(int(time.time())+self.fruits_config.respawn)
                self.reappear_fruit()
                break
    
    def reappear_fruit(self):
        if self.gameMode.gameMode == Mode.SNAKE or self.gameMode.gameMode == Mode.ADDER:
            # Réapparition immédiate si configuré
            if self.fruits_config.reappear:
                # Si on a déjà au moins le nombre initial de fruits, on ne fait rien
                if len(self.fruits) >= self.fruits_config.initial_fruit_number:
                    return
                # Sinon on recrée des fruits jusqu'à atteindre le nombre initial
                while len(self.fruits) < self.fruits_config.initial_fruit_number-len(self.fruit_timers):
                    empty_tiles = self.get_empty_tiles()
                    if empty_tiles:
                        pos0, pos1 = random.choice(empty_tiles)
                        # Fruit(x, y) stocke position = (y, x)
                        # Pour avoir position = (pos0, pos1), on appelle Fruit(pos1, pos0)
                        new_fruit = self.Fruit(pos1, pos0, self.fruits_config.default_points)
                        self.fruits.append(new_fruit)
                    else:
                        break
                for timer in self.fruit_timers:
                    if int(time.time()) >= timer:
                        empty_tiles = self.get_empty_tiles()
                        if empty_tiles:
                            pos0, pos1 = random.choice(empty_tiles)
                            new_fruit = self.Fruit(pos1, pos0, self.fruits_config.default_points)
                            self.fruits.append(new_fruit)
                            self.fruit_timers.remove(timer)
                        else:
                            break

    # Dessine le serpent, les fruits, les ennemis et les murs dans une fenêtre    
    def draw(self):
        # Taille fenêtre (définie dans JSONtoPython)
        
        # Taille de cellule
        cell_size = 20
        
        # Fond
        self.fenetre.fill(Colors.BLACK.value)
            
        # Serpent - tête
        pygame.draw.circle(self.fenetre, self.player.color.value, [((self.player.position[0]+0.5)*cell_size), ((self.player.position[1]+0.5)*cell_size)], cell_size/2, 0)
        
        # Serpent - corps
        for body in self.snakeBodies:
            pygame.draw.circle(self.fenetre, self.player.color.value, [((body.position[0]+0.5)*cell_size), ((body.position[1]+0.5)*cell_size)], (cell_size/2)-2, 0)
        
        # Fruits
        for fruit in self.fruits:
            pygame.draw.circle(self.fenetre, Colors.MAGENTA.value, [((fruit.position[0]+0.5)*cell_size), ((fruit.position[1]+0.5)*cell_size)], (cell_size/2), 0)
        
        # Ennemis
        for enemy in self.enemies:
            pygame.draw.circle(self.fenetre, enemy.color.value, [((enemy.position[0]+0.5)*cell_size), ((enemy.position[1]+0.5)*cell_size)], cell_size/2, 0)
        # Ennemis - corps
        for body in self.enemyBodies:
            pygame.draw.circle(self.fenetre, Colors.RED.value, [((body.position[0]+0.5)*cell_size), ((body.position[1]+0.5)*cell_size)], (cell_size/2)-2, 0)
        
        # Murs
        for wall in self.walls:
            pygame.draw.rect(self.fenetre, Colors.GRAY.value, pygame.Rect((wall.position[0])*cell_size, (wall.position[1])*cell_size, cell_size, cell_size))
         

    # Lancement de la boucle de jeu
    def go(self, ai_path : str, grid_path : str, next_move_path : str):
        next_move = ""
        running = True
        while running:
            self.draw()
            pygame.display.update()
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
            with open(grid_path, "w") as f:
                f.write(self.game_to_grid_string())
            # Appeler l'IA externe
            # TO-DO
            # Lire le prochain mouvement
            while not next_move:
                try:
                    with open(next_move_path, "r") as f:
                        next_move = f.read().strip()
                except FileNotFoundError:
                    pass
                print(f"Prochaine direction : {next_move}")
            with open(next_move_path, "w") as f:
                f.write("")
            # Mettre à jour le jeu avec le mouvement
            self.take_direction(next_move)
            self.player_forward()
            next_move = ""
            # if self.is_game_over:
            #     running = False
            self.fruit_eat()
            self.reappear_fruit()
    

    def take_direction(self, direction):
        if direction == "UP":
            if self.player.size>1:
                if (self.player.position[0],self.player.position[1]-1)==self.player.fils.position : return
                if (self.player.position[0],self.grid.y)==self.player.fils.position : return
            self.direction=Direction.HAUT
            return
        if direction == "DOWN":
            if self.player.size>1:
                if (self.player.position[0],self.player.position[1]+1)==self.player.fils.position : return
                if (self.player.position[0],0)==self.player.fils.position : return
            self.direction=Direction.BAS
            return
        if direction == "LEFT":
            if self.player.size>1:
                if (self.player.position[0]-1,self.player.position[1])==self.player.fils.position : return
                if (self.grid.x,self.player.position[1])==self.player.fils.position : return
            self.direction=Direction.GAUCHE
            return
        if direction == "RIGHT":
            if self.player.size>1:
                if (self.player.position[0]+1,self.player.position[1])==self.player.fils.position : return
                if (0,self.player.position[1])==self.player.fils.position : return
            self.direction=Direction.DROITE
            return

    def game_to_grid_string(self) -> str:
        grid_lines = []
        width = self.grid.y + 2
        height = self.grid.x + 2
        
        # Initialiser la grille avec des espaces vides
        grid = [[' ' for _ in range(width)] for _ in range(height)]
        
        # Placer les murs (bordures)
        for x in range(width):
            grid[0][x] = '#'
            grid[height - 1][x] = '#'
        for y in range(height):
            grid[y][0] = '#'
            grid[y][width - 1] = '#'
        
        # Placer le joueur (serpent)
        px, py = game.player.position
        grid[px + 1][py + 1] = 'S'
        
        # Placer le corps du serpent
        for body in game.snakeBodies:
            bx, by = body.position
            grid[bx + 1][by + 1] = 's'
        
        # Placer les fruits
        for fruit in game.fruits:
            fx, fy = fruit.position
            grid[fx + 1][fy + 1] = 'F'
        
        # Convertir la grille en chaîne de caractères
        for row in grid:
            grid_lines.append(''.join(row))
        
        return '\n'.join(grid_lines)

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else None
    pygame.init()
    game = Jeu()
    game.JSONtoPython(path)
    print(game.grid)
    game.draw()
    to_call = ""
    ai_type = sys.argv[2] if len(sys.argv) > 2 else None
    if ai_type == "snake-ai":
        to_call = "./Snake-AI-player.py"
    elif ai_type == "llm":
        to_call = "./FourchLang/src/llm/runner/openrouter.ts"

    grid_path = "./grid.txt"
    next_move_path = "./AI_response.txt"
    game.go(to_call, grid_path, next_move_path)

    
    print("Game Over")

        
    
    
    
    #            /^\/^\
    #          _|o_|  O|
    # \/     /~     \_/ \
    #  \____|__________/  \
    #         \_______      \
    #                 `\     \                 \
    #                   |     |                  \
    #                  /      /                    \
    #                 /     /                       \\
    #               /      /                         \ \
    #              /     /                            \  \
    #            /     /             _----_            \   \
    #           /     /           _-~      ~-_         |   |
    #          (      (        _-~    _--_    ~-_     _/   |
    #           \      ~-____-~    _-~    ~-_    ~-_-~    /
    #             ~-_           _-~          ~-_       _-~
    #                ~--______-~                ~-___-~

