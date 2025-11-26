from enum import Enum
import pygame, json, sys
import random, time

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

    FPS = 5
    fpsClock = pygame.time.Clock()

    class Player:
        def __init__(self, id : str, x : int, y : int, size : int, speed : int, color : Colors, fils : str = None, snake_bodies : list = [] ) :
            self.id = id
            self.position = (y,x)
            self.size = size
            self.speed = speed
            if color == "undefined":
                self.color = Colors.GREEN
            else:
                self.color = color
            self.fils = fils
            self.snake_bodies = snake_bodies
    
    class Fruit:
        def __init__(self, x : int, y : int, points : int) :
            self.position = (y,x)
            self.points = points

    class FruitConfig:
        def __init__(self, reappear : bool, respawn_time : int, snake_growth : int, initial_fruit_number : int, default_points : int = 1) :
            self.reappear = reappear
            self.respawn = respawn_time
            self.snake_growth = snake_growth
            self.initial_fruit_number = initial_fruit_number
            self.default_points=default_points
    
    class Enemy:
        def __init__(self, id : str, x : int, y : int, size : int, speed : int, color : Colors, fils : str = None, enemy_bodies : list = [] ) :
            self.id = id
            self.position = (y,x)
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
            self.position = (y,x)
            self.parent_id = parent_id
    
    class Wall:
        def __init__(self, x : int, y : int) :
            self.position = (y,x)
    
    class EnemyBody:
        def __init__(self, id : str, x : int, y : int, parent_id : str) :
            self.id = id
            self.position = (y,x)
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
    direction = None
    fenetre = None
    is_game_over = False
    
    
    def JSONtoPython(self, file_path : str):
        with open(file_path, "r") as f:
            game = json.load(f)
        
        match game["game-mode"]:
            case "snake":
                self.gameMode = self.GameMode(Mode.SNAKE)
                pygame.display.set_caption("Snake Game - Mode Snake")
            case "pacman":
                self.gameMode = self.GameMode(Mode.PACMAN)
                pygame.display.set_caption("Snake Game - Mode Pacman")
            case "adder":
                # ce code est merveilleux, il faut au moins 18/20
                self.gameMode = self.GameMode(Mode.ADDER)
                pygame.display.set_caption("Snake Game - Mode Adder")
            case _:
                print("Mode de jeu non renseigné, mode Snake par défault.")
                self.gameMode = self.GameMode(Mode.SNAKE)
                pygame.display.set_caption("Snake Game - Mode Snake")
        
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
                Colors.RED
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
        #             if body.position == (self.player.position[0]-1,self.player.position[1]):
        #                 self.direction = Direction.DROITE
        #             if body.position == (self.player.position[0],self.player.position[1]-1):
        #                 self.direction = Direction.HAUT
        #             if body.position == (self.player.position[0]-1,self.player.position[1]+1):
        #                 self.direction = Direction.BAS
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
        self.player.snake_bodies = self.snakeBodies
    
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
            game["fruits-config"]["snake-growth"],
            len(self.fruits))

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
    
        self.fenetre = pygame.display.set_mode(((self.grid.y)*20, (self.grid.x)*20))
    
    def toString (self) :
        print(self.player.id)
    
    def __init__(self):
        pass


    # Met à jour la direction en fonction des touches appuyées
    def take_direction(self, event):
        if event.type == pygame.KEYDOWN:
        # Flèches directionnelles
            if event.key == pygame.K_UP or event.key == pygame.K_z:
                if self.player.size>1:
                    if (self.player.position[0],self.player.position[1]-1)==self.player.fils.position : return
                    if (self.player.position[0],self.grid.y)==self.player.fils.position : return
                self.direction=Direction.HAUT
                return
            if event.key == pygame.K_DOWN or event.key == pygame.K_s:
                if self.player.size>1:
                    if (self.player.position[0],self.player.position[1]+1)==self.player.fils.position : return
                    if (self.player.position[0],0)==self.player.fils.position : return
                self.direction=Direction.BAS
                return
            if event.key == pygame.K_LEFT or event.key == pygame.K_q:
                if self.player.size>1:
                    if (self.player.position[0]-1,self.player.position[1])==self.player.fils.position : return
                    if (self.grid.x,self.player.position[1])==self.player.fils.position : return
                self.direction=Direction.GAUCHE
                return
            if event.key == pygame.K_RIGHT or event.key == pygame.K_d:
                if self.player.size>1:
                    if (self.player.position[0]+1,self.player.position[1])==self.player.fils.position : return
                    if (0,self.player.position[1])==self.player.fils.position : return
                self.direction=Direction.DROITE
                return


    # Déplace lae joueureuse dans la direction actuelle
    # Super méthode, on va avoir pas moins de 18/20
    def player_forward(self):
        previous_position = self.player.position
        if self.direction==Direction.HAUT:
            if not self.verif_over(Direction.HAUT):
                if not self.verif_wall(Direction.HAUT): 
                    if not (self.player.position[1]==0):
                        self.player.position = (self.player.position[0],self.player.position[1]-1)
                    else:
                        self.player.position = (self.player.position[0],self.grid.x-1)
            else:
                self.is_game_over = True
        if self.direction==Direction.BAS:
            if not self.verif_over(Direction.BAS):
                if not self.verif_wall(Direction.BAS): 
                    if not (self.player.position[1]==self.grid.x-1):
                        self.player.position = (self.player.position[0],self.player.position[1]+1)
                    else:
                        self.player.position = (self.player.position[0],0)
            else:
                self.is_game_over = True
        if self.direction==Direction.GAUCHE:
            if not self.verif_over(Direction.GAUCHE):
                if not self.verif_wall(Direction.GAUCHE): 
                    if not (self.player.position[0]==0):
                        self.player.position = (self.player.position[0]-1,self.player.position[1])
                    else:
                        self.player.position = (self.grid.y-1,self.player.position[1])
            else:
                self.is_game_over = True
        if self.direction==Direction.DROITE:
            if not self.verif_over(Direction.DROITE):
                if not self.verif_wall(Direction.DROITE): 
                    if not (self.player.position[0]==self.grid.y-1):
                        self.player.position = (self.player.position[0]+1,self.player.position[1])
                    else:
                        self.player.position = (0,self.player.position[1])
            else:
                self.is_game_over = True
        if self.player.position != previous_position:
            for body in self.player.snake_bodies[::-1]:
                if body.parent_id==self.player.id:
                    body.position=previous_position
                else:
                    for b in self.snakeBodies:
                        if body.parent_id==b.id:
                            body.position=b.position

    def enemy_forward(self, enemyID):
        for enemy in self.enemies:
            pass
        
        if self.direction==Direction.HAUT:
            self.player.position = (self.player.position[0],self.player.position[1]-1)
        if self.direction==Direction.BAS:
            self.player.position = (self.player.position[0],self.player.position[1]+1)
        if self.direction==Direction.GAUCHE:
            self.player.position = (self.player.position[0]-1,self.player.position[1])
        if self.direction==Direction.DROITE:
            self.player.position = (self.player.position[0]+1,self.player.position[1])
    
    def verif_over(self, d):
        if d==Direction.HAUT:
            pos_fut=(self.player.position[0], self.player.position[1]-1)
        if d==Direction.BAS:
            pos_fut=(self.player.position[0], self.player.position[1]+1)
        if d==Direction.GAUCHE:
            pos_fut=(self.player.position[0]-1, self.player.position[1])
        if d==Direction.DROITE:
            pos_fut=(self.player.position[0]+1, self.player.position[1])
        for goc in self.game_over_conditions :
            match goc :
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
                case "border" :
                    return (
                        ((not self.grid.horizontally) and (pos_fut[1] < 0 or pos_fut[1] > self.grid.y)) 
                        or ((not self.grid.vertically) and (pos_fut[0] < 0 or pos_fut[0] > self.grid.x)))
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


    def check_tile_is_empty(self, x : int, y : int):
        print("check tile for position : (",x,",",y,")")
        input_position = (x,y)
        if ((x < 0 or x > self.grid.x-1) or (y < 0 or y > self.grid.y-1)) : 
            print("Nope, out of borders.")
            return False
        if self.player.position == input_position :
            print("Nope, player there.")
            return False
        for enemy in self.enemies:
            if enemy.position == input_position : 
                print("Nope, enemy there.")
                return False
        for body in self.enemyBodies:
            if body.position == input_position : 
                print("Nope, enemy body there.")
                return False
        for body in self.snakeBodies:
            if body.position == input_position :
                print("Nope, player body there.") 
                return False
        for fruit in self.fruits:
            if fruit.position == input_position : 
                print("Nope, fruit already there.")
                return False
        for wall in self.walls:
            if wall.position == input_position : 
                print("Nope, wall there.")
                return False
        return True
        
        
    # Supprime le fruit mangé et augmente la taille du serpent
    def fruit_eat(self):
        for a in range(len(self.fruits)):
            if self.player.position==self.fruits[a].position:
                if not self.gameMode.gameMode==Mode.PACMAN:
                    self.player.size+=1
                self.fruits.remove(self.fruits[a])
                # on lance le timer
                if not hasattr(self, "last_fruit_disappear_time"):
                    self.last_fruit_disappear_time = 0
                else:
                    self.last_fruit_disappear_time = 0

                # On déclenche la logique de réapparition
                self.reappear_fruit()
                break

    def reappear_fruit(self):
        if self.gameMode.gameMode == Mode.SNAKE or self.gameMode.gameMode == Mode.ADDER:
            # Mode 1 : réapparition immédiate, nombre de fruits fixe
            if self.fruits_config.reappear and self.fruits_config.respawn == 0:
                # Si on a déjà au moins le nombre initial de fruits, on ne fait rien
                if len(self.fruits) >= self.fruits_config.initial_fruit_number:
                    return
                # Sinon on recrée des fruits jusqu'à atteindre le nombre initial
                print("1 - Starting loop")
                while len(self.fruits) < self.fruits_config.initial_fruit_number:
                    # Recherche aléatoire d'une case vide
                    print("1 - iterating until initial number of fruits is met...")
                    while True:
                        x = random.randint(0, self.grid.y-1)
                        y = random.randint(0, self.grid.x-1)
                        print("1 - testing position : (",x,",",y,")")
                        if self.check_tile_is_empty(x, y):
                            break
                    # On crée un fruit avec un nombre de points par défaut (1)
                    print("1 - New fruit in (",x,", ",y,")")
                    self.fruits.append(self.Fruit(x, y, self.fruits_config.default_points))

            # Mode 2 : réapparition différée après un certain temps
            elif self.fruits_config.reappear and self.fruits_config.respawn != 0:
                # Initialisation de l'attribut de temps si nécessaire
                if not hasattr(self, "last_fruit_disappear_time"):
                    self.last_fruit_disappear_time = None
                # Si un fruit manque et qu'aucun timer n'est lancé, on mémorise le moment
                if len(self.fruits) < self.fruits_config.initial_fruit_number and self.last_fruit_disappear_time is None:
                    self.last_fruit_disappear_time = time.time()
                # Si on attend depuis assez longtemps, on fait réapparaître un fruit
                if (
                    self.last_fruit_disappear_time is not None
                    and time.time() - self.last_fruit_disappear_time >= self.fruits_config.respawn
                ):
                    print("2 - Starting loop")
                    while True:
                        x = random.randint(0, self.grid.y-1)
                        y = random.randint(0, self.grid.x-1)
                        print("2 - testing position : (",x,",",y,")")
                        if self.check_tile_is_empty(x, y):
                            print(" --- Position found !! --- ")
                            break
                        print(" ---- INVALID POSITION, TRYING AGAIN ---- ")
                    print("2 - New fruit in (",x,", ",y,")")
                    self.fruits.append(self.Fruit(x, y, 1))
                    # Réinitialisation du timer
                    self.last_fruit_disappear_time = None
                    

    # Dessine le serpent, les fruits, les ennemis et les murs dans une fenêtre    
    def draw(self):
        # Taille fenêtre (définie dans JSONtoPython)
        
        # Taille de cellule
        cell_size = 20
        
        # Fond
        self.fenetre.fill(Colors.BLACK.value)
            
        # Serpent
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
    def go(self):
        running = True
        while running:
            game.draw()
            pygame.display.update()
            self.fpsClock.tick(self.FPS)
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                else:
                    self.take_direction(event)
            self.player_forward()
            if self.is_game_over:
                running = False
            self.fruit_eat()
            self.reappear_fruit()
        print("Game Over")
    


if __name__ == "__main__":
    path = sys.argv[1]
    pygame.init()
    game = Jeu()
    game.JSONtoPython(path)
    game.go()
    
    
    
    
    #            /^\/^\
    #          _|_o|O  |
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

