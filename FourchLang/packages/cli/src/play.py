from enum import Enum
import json

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
    
class Jeu :
    class Player:
        def __init__(self, id : str, x : int, y : int, size : int, speed : int, color : Colors, fils : str = None) :
            self.id = id
            self.position = (x,y)
            self.size = size
            self.speed = speed
            self.color = color
            self.fils = fils
    
    class Fruit:
        def __init__(self, x : int, y : int, points : int, reappear : bool, respawn_time : int, snake_growth : int) :
            self.position = (x,y)
            self.points = points
            self.reappear = reappear
            self.respawn = respawn_time
            self.snake_growth = snake_growth
    
    class Enemy:
        def __init__(self, id : str, x : int, y : int, size : int, speed : int, color : Colors) :
            self.id = id
            self.position = (x,y)
            self.size = size
            self.speed = speed
            self.color = color
    
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
    
    class GameOverCondition :
        def __init__(self, type : list) : 
            self.type = type

    player = None
    enemies = []
    snakeBodies = []
    enemyBodies = []
    walls = []
    fruits = []
    grid = None
    border_rules = []
    fruits_config = None
    game_over_conditions = []
    direction = Direction.GAUCHE
    
    def isOver():
        pass
    
    def JSONtoPython(self, file_path : str):
        with open(file_path, "r") as f:
            game = json.load(f)
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
    
        self.enemyBodies = []
        for enemyBody in game["enemy-bodies"]:
            self.enemyBodies.append(self.EnemyBody(
                enemyBody["id"],
                enemyBody["position"]["x"],
                enemyBody["position"]["y"],
                enemyBody["follows"]
            ))
    
        self.walls = []
        for wall in game["walls"]:
            self.walls.append(self.Wall(wall["position"]["x"], wall["position"]["y"]))
    
        self.fruits = []
        for fruit in game["fruits"]:
            self.fruits.append(self.Fruit(
                fruit["position"]["x"],
                fruit["position"]["y"],
                fruit["points"],
                game["fruits-config"]["reappear"],
                game["fruits-config"]["respawn-time"],
                game["fruits-config"]["snake-growth"]
            ))
    
        vertically = False
        horizontally = False
        if "vertically" in game["border-rules"]:
            vertically = True
        
        if "horizontally" in game["border-rules"]:
            horizontally = True
        
        self.grid = self.Grid(game["grid"]["x"], game["grid"]["y"], vertically, horizontally)

        self.game_over_conditions = []
        for condition in game["game-over-conditions"]:
            self.game_over_conditions.append(self.GameOverCondition([condition]))
    
        print("Bravo ! Le jeu a bien été chargé depuis le fichier JSON.")
    
    def toString (self) :
        print(self.player.id)
    
    def __init__(self):
        pass

    



















    

    

    
    def take_direction(self):
        # vérifie si l'input de direction est légal (le serpent ne peut pas faire demi-tour)
        # TODO inverser les x et les y
        if keydown(KEY_LEFT):
            if len(self.player)>1:
                if (self.player.position[0]-1,self.player.position[1])==self.player.fils.position:
                    return(self.Direction)
            return(Direction.GAUCHE)
        if keydown(KEY_DOWN):
            if len(self.player)>1:
                if (self.player.position[0],self.player.position[1]+1)==self.player.fils.position:
                    return(self.direction)
            return(Direction.BAS)
        if keydown(KEY_RIGHT):
            if len(self.player)>1:
                if (self.player.position[0]+1,self.player.position[1])==self.player.fils.position:
                    return(self.Direction)
            return(Direction.DROITE)
        if keydown(KEY_UP):
            if len(self.player)>1:
                if (self.player.position[0],self.player.position[1]-1)==self.player.fils.position:
                    return(self.Direction)
            return(Direction.HAUT)
        return(direction)
    
    def snake_forward(d,snake,sl):
        if d==0:
            snake.insert(0,(snake[0][0],snake[0][1]-1))
        if d==1:
            snake.insert(0,(snake[0][0]+1,snake[0][1]))
        if d==2:
            snake.insert(0,(snake[0][0],snake[0][1]+1))
        if d==3:
            snake.insert(0,(snake[0][0]-1,snake[0][1]))
        cercle(snake[0],green)
        if sl<len(snake):
            cercle(snake[len(snake)-1],white)
            snake.pop()
        return(snake)
    
    def verif_over(d,snake):
        if d==0:
            pos_fut=(snake[0][0],snake[0][1]-1)
        if d==1:
            pos_fut=(snake[0][0]+1,snake[0][1])
        if d==2:
            pos_fut=(snake[0][0],snake[0][1]+1)
        if d==3:
            pos_fut=(snake[0][0]-1,snake[0][1])
        if -1<pos_fut[0]<32 and -1<pos_fut[1]<20 and pos_fut not in snake:
            return(False)
        else:
            return(True)
    
    def apple_eat(apple,sl,snake):
        if snake[0]==apple[0]:
            sl+=1
            apple.remove(apple[0])
        elif snake[0]==apple[1]:
            sl+=1
            apple.remove(apple[1])
        elif snake[0]==apple[2]:
            sl+=1
            apple.remove(apple[2])
        return((apple,sl))
    
    def apple_new(apple,snake):
        if len(apple)==2:
            new_apple=snake[0]
            while new_apple in snake:
                new_apple=(randint(0,31),randint(0,19))
            cercle(new_apple,red)
            apple.append(new_apple)
        return(apple)
    
    def go():
        snake=[(15,10)]
        snake_length=1
        apple=[(20,10),(22,10),(24,10)]
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
                sleep(0.001+0.004*(1/round(sqrt(snake_length),4)))
            game_over=verif_over(direction,snake)
            if game_over:
                break
            snake=snake_forward(direction,snake,snake_length)
            (apple,snake_length)=apple_eat(apple,snake_length,snake)
            apple=apple_new(apple,snake)
            draw_string(str(snake_length),280,1)
            draw_string(str(int(score)),150,1)
        l=["GAME OVER !","Pas mal !","Tu geres !","Dommage !","Retente ta chance !","Bravo !"]
        draw_string(l[randint(0,4)],0,1)
    



















if __name__ == "__main__":
    game = Jeu()
    game.JSONtoPython("./FourchLang/packages/cli/src/generated.json")
    game.toString()
    
    
    
    #            /^\/^\
    #          _|__|O  |
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

