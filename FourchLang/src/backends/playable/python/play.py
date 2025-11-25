from enum import Enum
import json
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
            if color == "undefined":
                self.color = Colors.GREEN
            else:
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

    # TODO Jules
    def check_tile_is_empty(self, x : int, y : int):
        input_position = (x,y)
        if ((x < 0 or x > self.grid.x) or (y < 0 or y > self.grid.y)) : return False
        if self.player.position == input_position : return False
        for enemy in self.enemies:
            if enemy.position == input_position : return False
        for body in self.enemyBodies:
            if body.position == input_position : return False
        for body in self.snakeBodies:
            if body.position == input_position : return False
        for fruit in self.fruits:
            if fruit.position == input_position : return False
        for wall in self.walls:
            if wall.position == input_position : return False
        return True
        
        
    # Supprime le fruit mangé et augmente la taille du serpent
    # DONE
    def fruit_eat(self):
        for a in len(self.fruits):
            if self.player.position==self.fruits[a].position:
                self.player.size+=1
                self.fruits.remove(self.fruits[a])
    
    # TODO Axelle
    def reappear_fruit(self):
        if self.gameMode.gameMode==Mode.SNAKE or self.gameMode.gameMode==Mode.ADDER:
            if self.fruits_config.respaw_time==0 and self.fruits_config.reappear:
                # on est dans le mode : nb de fruits fixe, dès qu'un fruit disparaît il réapparaît
                if len(self.fruits)==self.fruit.initial_number:
                    pass
                #elif len(self.fruits)>self.fruit.initial_number:
                    # Ajouter un message d'erreur
                    #pass
                else :
                    # on fait réapparaître un fruit de manière aléatiore en vérifiant qu'il n'y a rien sur la case
                    # on appelle la fonction check_tile_is_empty et tant que c'est faux on crée une autre position aléatoire
                    # TODO
                    pass
            elif self.fruits_config.respaw_time!=0 and self.fruits_config.reappear:
                # on attend le nombre de secondes spécifié dans self.fruits_config.respaw_time
                # TODO
                # on fait apparaître un fruit de manière aléatiore en vérifiant qu'il n'y a rien sur la case
                # on appelle la fonction check_tile_is_empty et tant que c'est faux on crée une autre position aléatoire
                pass

                    

        """
        if len(fruits)==2:
            new_apple=snake[0]
            while new_apple in snake:
                new_apple=(randint(0,31),randint(0,19))
            cercle(new_apple,red)
            fruit.append(new_apple)
        return(apple)
    """
    # TODO ALice
    # Dessine le serpent, les fruits, les ennemis et les murs dans une fenêtre    
    def draw(self):
        # Taille fenêtre (définie dans JSONtoPython)
        
        # Taille de cellule
        cell_size = 20
        
        # Fond
        self.fenetre.fill(Colors.BLACK.value)
        
        # Bordures
        # Haut
        if self.grid.vertically:
            pygame.draw.rect(self.fenetre, Colors.GRAY.value, pygame.Rect(0, 0, (self.grid.y+2)*cell_size, cell_size))
        # Bas
        if self.grid.vertically:
            pygame.draw.rect(self.fenetre, Colors.GRAY.value, pygame.Rect(0, (self.grid.x + 1) * cell_size, (self.grid.y + 2) * cell_size, cell_size))
        # Gauche
        if self.grid.horizontally:
            pygame.draw.rect(self.fenetre, Colors.GRAY.value, pygame.Rect(0, 0, cell_size, (self.grid.x + 2) * cell_size))
        # Droite
        if self.grid.horizontally:
            pygame.draw.rect(self.fenetre, Colors.GRAY.value, pygame.Rect((self.grid.y + 1) * cell_size, 0, cell_size, (self.grid.x + 2) * cell_size))
        print(self.gameMode.gameMode)
        if self.gameMode.gameMode==Mode.PACMAN:
            # Ouvertures bordures
            # Haut
            pygame.draw.rect(self.fenetre, Colors.GRAY.value, pygame.Rect(((self.grid.y+2)//2)*cell_size, 0, cell_size, cell_size))
            # Bas
            pygame.draw.rect(self.fenetre, Colors.GRAY.value, pygame.Rect(((self.grid.y+2)//2)*cell_size, (self.grid.x + 1) * cell_size, cell_size, cell_size))
            # Gauche
            pygame.draw.rect(self.fenetre, Colors.GRAY.value, pygame.Rect(0, ((self.grid.x + 2)//2)*cell_size, cell_size, cell_size))
            # Droite
            pygame.draw.rect(self.fenetre, Colors.GRAY.value, pygame.Rect((self.grid.y + 1) * cell_size, ((self.grid.x + 2)//2)*cell_size, cell_size, cell_size))

        # Serpent
        pygame.draw.circle(self.fenetre, self.player.color.value, [((self.player.position[0]+1)*cell_size), ((self.player.position[1]+1)*cell_size)], cell_size/2, 0)
        
        # Serpent - corps
        for body in self.snakeBodies:
            pygame.draw.circle(self.fenetre, self.player.color.value, [((body.position[0]+1)*cell_size), ((body.position[1]+1)*cell_size)], (cell_size/2)-2, 0)
        
        # Fruits
        for fruit in self.fruits:
            pygame.draw.circle(self.fenetre, Colors.MAGENTA.value, [((fruit.position[0]+1)*cell_size), ((fruit.position[1]+1)*cell_size)], (cell_size/2), 0)
        
        # Ennemis
        for enemy in self.enemies:
            pygame.draw.circle(self.fenetre, enemy.color.value, [((enemy.position[0]+1)*cell_size), ((enemy.position[1]+1)*cell_size)], cell_size/2, 0)
        # Ennemis - corps
        for body in self.enemyBodies:
            pygame.draw.circle(self.fenetre, Colors.RED.value, [((body.position[0]+1)*cell_size), ((body.position[1]+1)*cell_size)], (cell_size/2)-2, 0)
        
        # Murs
        for wall in self.walls:
            pygame.draw.rect(self.fenetre, Colors.GRAY.value, pygame.Rect((wall.position[1]+1)*cell_size, (wall.position[0]+1)*cell_size, cell_size, cell_size))
        
    # TODO
    # Lancement de la boucle de jeu
    def go(self):
        """ while True:
            direction = attendre_direction()
            print(f'Touche détectée : {direction}') """

        """ snake=[(15,10)]
        snake_length=1
        score=0
        game_over=False
        direction=1
        cercle(snake[0],green)
        cercle(apple[0],red)
        cercle(apple[1],red)
        cercle(apple[2],red)
        while game_over!=True:
            for i in range(10):
                direction=take_direction(direction,snake)
                score+=(0.001+0.004*(1/round(sqrt(snake_length),4)))*snake_length
                sleep(self.0.001+0.004*(1/roundsnake_length),4)
            game_over=verif_over(direction,snake)
            if game_over:
                break
            snake=pllayer_forward(direction,snake,snake_length)
            fruit_eat(apple,snake)
            apple=apple_new(apple,snake)
            draw_string(str(snake_length),280,1)
            draw_string(str(int(score)),150,1)
        l=["GAME OVER !","Pas mal !","Tu geres !","Dommage !","Retente ta chance !","Bravo !"]
        draw_string(l[randint(0,4)],0,1) """
    





if __name__ == "__main__":
    pygame.init()
    game = Jeu()
    game.JSONtoPython("/home/jchaidro/DSL/snack_game/FourchLang/examples/variant-4/json/output.json")
    print(game.grid)
    game.draw()
    
    running = True
    while running:
        pygame.display.update()
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
    
    
    
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

