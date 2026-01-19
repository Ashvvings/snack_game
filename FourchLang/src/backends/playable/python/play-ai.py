from enum import Enum
import json
import sys
import random, time
import pygame
import regex as re
sys.path.append('./')
# sys.path.insert(1, './FourchLang/src/llm/runner')
from SnakeAIPlayer import run as SnakeAIPlayerRun
sys.path.insert(1, './FourchLang/src/llm/runner')
from openrouter import call_llm_openrouter as LLMAIPlayerRun
from openrouter import extract_move as getLLMMove
from openrouter import extract_explanation as getLLMExplanation

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

    SCORE_BAR_HEIGHT = 40
    MIN_WINDOW_WIDTH = 200
    MIN_WINDOW_HEIGHT = 200

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
    body_counter = 0
    pending_growth = 0
    fruit_timers = []
    score = 0
    initial_body_count = 0
    variant = None
    moves_done = []
    moves_explanations = []
    
    variant_context = {
        "1" : "1 fruit is worth 1 point, makes you grow by 1 point, and reappears when eaten. The game ends if the snake bites itself. You can cross the edges.",
        "2" : "1 fruit is worth 1 point, and a new one appears randomly every 2 seconds. Contact with the edges ends the game.",
        "3" : "1 fruit is worth 1 point, increases your score by 1, and reappears when eaten. A snake enemy is on the grid. The game ends if the snake bites itself or comes into contact with the enemy or the enemy's body.",
        "4" : "This variant is like Pac-Man. The edges can only be crossed horizontally. Walls cannot be crossed. There are 4 enemies on the map. The enemies cannot cross walls. The game ends if the snake comes into contact with any part of the enemy.",
        "5" : ""
    }
    
    def JSONtoPython(self, file_path : str):
        with open(file_path, "r") as f:
            game = json.load(f)
        
        variant = re.findall(r'\d+', file_path)[0]
        print(variant)
        self.variant = variant

        match game["game-mode"]:
            case "snake":
                self.gameMode = self.GameMode(Mode.SNAKE)
                pygame.display.set_caption("Snake Game - Mode Snake")
            case "pacman":
                self.gameMode = self.GameMode(Mode.PACMAN)
                pygame.display.set_caption("Snake Game - Mode Pacman")
            case "adder":
                self.gameMode = self.GameMode(Mode.ADDER)
                pygame.display.set_caption("Snake Game - Mode Adder")
            case _:
                print("Mode de jeu non renseigné, mode Snake par défault.")
                self.gameMode = self.GameMode(Mode.SNAKE)
                pygame.display.set_caption("Snake Game - Mode Snake")
        
        # Convertir la couleur du joueur en enum Colors
        player_color_str = game["player"]["color"]
        if player_color_str == "undefined":
            player_color = Colors.GREEN
        else:
            # Chercher la couleur correspondante dans l'enum
            player_color = Colors.GREEN  # Valeur par défaut
            for color in Colors:
                if color.value == player_color_str or color.name.lower() == player_color_str.lower():
                    player_color = color
                    break
        
        # Convertir la vitesse en entier (avec valeur par défaut si undefined)
        player_speed = game["player"]["speed"]
        if player_speed == "undefined" or player_speed is None:
            player_speed = 5
        else:
            player_speed = int(player_speed)

        self.player = self.Player(
            game["player"]["id"],
            game["player"]["position"]["x"],
            game["player"]["position"]["y"],
            game["player"]["size"],
            player_speed,
            player_color
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
            if snakeBody["follows"] == game["player"]["id"] :
                tempx = self.player.position[1] - snakeBody["position"]["x"]
                tempy = self.player.position[0] - snakeBody["position"]["y"]
                if tempx > 0 :
                    self.direction = Direction.BAS
                elif tempx < 0 :
                    self.direction = Direction.HAUT
                elif tempy > 0 :
                    self.direction = Direction.DROITE
                elif tempy < 0 :
                    self.direction = Direction.GAUCHE

        
        # Initialiser le compteur avec le nombre total de segments de corps
        self.body_counter = len(self.snakeBodies)
                    
        if self.snakeBodies!=[]:
            for body in self.snakeBodies:
                if body.parent_id == self.player.id:
                    self.player.fils = body
        
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

        # Mémoriser la taille initiale pour le calcul du score
        self.initial_body_count = len(self.snakeBodies)
        self.score = 0
    
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
        for rule in game["border-rules"]:
            if "vertically" in rule and rule["vertically"]:
                vertically = True
            if "horizontally" in rule and rule["horizontally"]:
                horizontally = True
        
        self.grid = self.Grid(game["grid"]["x"], game["grid"]["y"], vertically, horizontally)

        self.game_over_conditions = []
        for condition in game["game-over-conditions"]:
            self.game_over_conditions.append(self.GameOverCondition([condition["target"]]))
    
        # Calcul de la taille de fenêtre avec minimum
        game_width = self.grid.y * 20
        game_height = self.grid.x * 20 + self.SCORE_BAR_HEIGHT
        window_width = max(game_width, self.MIN_WINDOW_WIDTH)
        window_height = max(game_height, self.MIN_WINDOW_HEIGHT + self.SCORE_BAR_HEIGHT)
        self.fenetre = pygame.display.set_mode((window_width, window_height))
    
    def toString (self) :
        print(self.player.id)
    
    def __init__(self):
        pass    

    # Déplace lae joueureuse dans la direction actuelle
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
        
        # Déplacer le corps
        if self.player.position != previous_position:
            # Déplacer tous les segments
            for i in range(len(self.player.snake_bodies)-1, -1, -1):
                body = self.player.snake_bodies[i]
                if i == 0:
                    # Premier segment suit la tête
                    body.position = previous_position
                else:
                    # Les autres segments suivent le segment précédent
                    body.position = self.player.snake_bodies[i-1].position

    def add_body_segment(self, count: int = 1):
        """Ajoute un ou plusieurs nouveaux segments au corps du serpent"""
        for _ in range(count):
            self.body_counter += 1
            new_id = f"body_{self.body_counter}"
            
            # Déterminer la position et le parent du nouveau segment
            if len(self.player.snake_bodies) == 0:
                # Premier segment : suit la tête
                parent_id = self.player.id
                position = self.player.position
            else:
                # Nouveau segment : suit le dernier segment
                last_body = self.player.snake_bodies[-1]
                parent_id = last_body.id
                position = last_body.position
            
            # Le constructeur SnakeBody attend (x, y) et stocke position = (y, x)
            # position est déjà au format (y, x), donc on inverse pour passer (x, y)
            new_body = self.SnakeBody(new_id, position[1], position[0], parent_id)
            self.player.snake_bodies.append(new_body)
            self.snakeBodies.append(new_body)
            
            # Mettre à jour le fils du joueur si c'est le premier segment
            if len(self.player.snake_bodies) == 1:
                self.player.fils = new_body

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
            for target in goc.type:
                match target :
                    case "snake_body" :
                        for body in self.snakeBodies :
                            if pos_fut == body.position : return True
                    case "enemy" :
                        for enemy in self.enemies :
                            if pos_fut == enemy.position : return True
                        for body in self.enemyBodies :
                            if pos_fut == body.position : return True
                    case "wall" :
                        for wall in self.walls :
                            if pos_fut == wall.position : return True
                    case "border" :
                        # Vérifier les bordures selon les règles de wrap
                        # Si horizontally est False, toucher le bord vertical (droite/gauche) = game over
                        if not self.grid.vertically:
                            if pos_fut[1] < 0 or pos_fut[1] >= self.grid.x:
                                return True
                        # Si vertically est False, toucher le bord horizontal (haut/bas) = game over
                        if not self.grid.horizontally:
                            if pos_fut[0] < 0 or pos_fut[0] >= self.grid.y:
                                return True
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
                
                self.score += self.fruits[a].points
                self.fruits.remove(self.fruits[a])
                if(self.fruits_config.respawn != "undefined" and self.fruits_config.respawn != None):
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
        window_width, window_height = self.fenetre.get_size()
        
        # Taille de cellule
        cell_size = 20
        
        # Calcul des offsets pour centrer la zone de jeu
        game_area_width = self.grid.y * cell_size
        game_area_height = self.grid.x * cell_size
        offset_x = (window_width - game_area_width) // 2
        offset_y = self.SCORE_BAR_HEIGHT + (window_height - self.SCORE_BAR_HEIGHT - game_area_height) // 2
        
        # Fond gris pour toute la fenêtre
        self.fenetre.fill(Colors.GRAY.value)
        
        # Zone de jeu noire (centrée)
        pygame.draw.rect(self.fenetre, Colors.BLACK.value, pygame.Rect(offset_x, offset_y, game_area_width, game_area_height))
        
        # Contour gris autour de la zone de jeu
        pygame.draw.rect(self.fenetre, Colors.GRAY.value, pygame.Rect(offset_x, offset_y, game_area_width, game_area_height), 2)
        
        # Score dans le bandeau
        font = pygame.font.Font(None, 36)
        score_text = font.render(f"Score : {self.score}", True, Colors.WHITE.value)
        self.fenetre.blit(score_text, (10, (self.SCORE_BAR_HEIGHT - score_text.get_height()) // 2))
            
        # Serpent - tête
        pygame.draw.circle(self.fenetre, self.player.color.value, [offset_x + ((self.player.position[0]+0.5)*cell_size), ((self.player.position[1]+0.5)*cell_size) + offset_y], cell_size/2, 0)
        
        # Serpent - corps
        for body in self.snakeBodies:
            pygame.draw.circle(self.fenetre, self.player.color.value, [offset_x + ((body.position[0]+0.5)*cell_size), ((body.position[1]+0.5)*cell_size) + offset_y], (cell_size/2)-2, 0)
        
        # Fruits
        for fruit in self.fruits:
            pygame.draw.circle(self.fenetre, Colors.MAGENTA.value, [offset_x + ((fruit.position[0]+0.5)*cell_size), ((fruit.position[1]+0.5)*cell_size) + offset_y], (cell_size/2), 0)
        
        # Ennemis
        for enemy in self.enemies:
            pygame.draw.circle(self.fenetre, enemy.color.value, [offset_x + ((enemy.position[0]+0.5)*cell_size), ((enemy.position[1]+0.5)*cell_size) + offset_y], cell_size/2, 0)
        # Ennemis - corps
        for body in self.enemyBodies:
            pygame.draw.circle(self.fenetre, Colors.RED.value, [offset_x + ((body.position[0]+0.5)*cell_size), ((body.position[1]+0.5)*cell_size) + offset_y], (cell_size/2)-2, 0)
        
        # Murs
        for wall in self.walls:
            pygame.draw.rect(self.fenetre, Colors.GRAY.value, pygame.Rect(offset_x + (wall.position[0])*cell_size, (wall.position[1])*cell_size + offset_y, cell_size, cell_size))
         
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
        height = self.grid.y + 2
        width = self.grid.x + 2
        
        # Initialiser la grille avec des espaces vides
        grid = [['. ' for _ in range(height)] for _ in range(width)]
        
        # Placer les murs (bordures)
        for x in range(width):
            grid[x][0] = '# '
            grid[x][height - 1] = '# '
        for y in range(height):
            grid[0][y] = '# '
            grid[width - 1][y] = '# '
        
        # Placer le joueur (serpent)
        py, px = game.player.position
        grid[px + 1][py + 1] = 'O '
        
        # Placer le corps du serpent
        for body in game.snakeBodies:
            by, bx = body.position
            grid[bx + 1][by + 1] = 'S '
        
        # Placer les fruits
        for fruit in game.fruits:
            fy, fx = fruit.position
            grid[fx + 1][fy + 1] = 'F '
        
        # Placer les ennemis
        for enemy in game.enemies:
            ey, ex = enemy.position
            grid[ex + 1][ey + 1] = 'M '
        for body in game.enemyBodies:
            eby, ebx = body.position
            grid[ebx + 1][eby + 1] = 'X '

        # Placer les murs internes
        for wall in game.walls:
            wy, wx = wall.position
            grid[wx + 1][wy + 1] = '# '
        
        # Convertir la grille en chaîne de caractères
        for row in grid:
            grid_lines.append(''.join(row))
        
        return '\n'.join(grid_lines)
    
    def get_legal_moves(self):
        legal_moves = ["UP", "DOWN", "LEFT", "RIGHT"]
        if self.gameMode.gameMode == Mode.SNAKE or self.gameMode.gameMode == Mode.ADDER :
            if self.direction == Direction.HAUT:
                legal_moves.remove("DOWN")
            elif self.direction == Direction.BAS:
                legal_moves.remove("UP")
            elif self.direction == Direction.GAUCHE:
                legal_moves.remove("RIGHT")
            elif self.direction == Direction.DROITE:
                legal_moves.remove("LEFT")
        elif self.gameMode.gameMode == Mode.PACMAN:
            for dx, dy, direction in [(0, -1, "UP"),
                                      (0, 1, "DOWN"),
                                      (-1, 0, "LEFT"),
                                      (1, 0, "RIGHT")]:
                if (self.player.position[0]+dx, self.player.position[1]+dy) in [wall.position for wall in self.walls]:
                    legal_moves.remove(direction)
        return legal_moves

    def get_game_over_conditions(self):
        conditions = []
        for goc in self.game_over_conditions:
            for target in goc.type:
                conditions.append("hitting "+target)
        return conditions

    def json_prompt(self):
        prompt = f"# RULES\n\
- Game: reforged Snake, objective is to EAT AS MUCH FRUITS AS POSSIBLE and to survive.\n\
- Variant context: {self.variant_context[self.variant]}\n\
- The y coordinate corresponds to the line of the grid, the x coordinate corresponds to the column of the grid.\n\
- Symbols:\n\
\t- '#' = wall / border\n\
\t- 'F' = fruit\n\
\t- 'O' = player-controlled snake head\n\
\t- 'S' = player snake body\n\
\t- 'M' = enemy head\n\
\t- 'X' = enemy body\n\
\t- '.' = empty cells\n\
- Move constraints: move must be one of [\"UP\", \"DOWN\", \"RIGHT\", \"LEFT\"].\n\
- \"UP\" = (y, x-1), \"DOWN\" = (y, x+1), \"RIGHT\" = (y+1, x), \"LEFT\" = (y-1, x)\n\
- End conditions: {self.get_game_over_conditions()}\n\
\n\
# STATE\n\
The current grid is given as ASCII text between GRID_TXT_BEGIN and GRID_TXT_END.\n\
GRID_TXT_BEGIN\n\
{self.game_to_grid_string()}\n\
GRID_TXT_END\n\
\n\
# LEGAL_MOVES\n\
All directions except the one that is the exact opposite of the current snake direction.\n\
Concrete list of allowed moves for THIS state:\n\
{self.get_legal_moves()}\n\
\n\
# OUTPUT SCHEMA (strict)\n\
{{\"move\":\"UP\",\"explain\":\"optional, single sentence\"}} or {{\"pass\":true}} or {{\"resign\":true}}\
"
#  [\"UP\",\"RIGHT\",\"DOWN\",\"LEFT\"]\n\
        return prompt

    def ninety_degrees_fix(self, direction: str) -> str:
        match direction:
            case "UP":
                return "LEFT"
            case "LEFT":
                return "UP"
            case "DOWN":
                return "RIGHT"
            case "RIGHT":
                return "DOWN"
        return direction

    # Lancement de la boucle de jeu
    def go(self, ai_type : str):
        next_move = None
        last_move = None
        next_json = None
        if ai_type != "llm" and ai_type != "snake-ai":
            print("Type d'IA non reconnu.")
            return
        running = True
        while running:
            self.draw()
            pygame.display.update()
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
            # Appeler l'IA externe
            if ai_type == "snake-ai":
                # Appel de l'IA SnakeAIPlayer (A*)
                next_move = SnakeAIPlayerRun(self.game_to_grid_string(),
                                             self.grid.vertically,
                                             self.grid.horizontally)
                if next_move == "pass":
                    next_move = last_move
            elif ai_type == "llm":
                # Appel à une IA de type LLM par endpoint D'OpenAI
                prompt = self.json_prompt()
                # with open("./prompt.txt", "w") as f:
                #     f.write(prompt)
                # return
                ret = LLMAIPlayerRun(prompt, max_tokens=200)
                next_move = getLLMMove(ret)
                # next_move = self.ninety_degrees_fix(getLLMMove(ret))
                print(f"Move given by LLM: {ret}")
                self.moves_explanations.append(getLLMExplanation(ret))
                # print(f"rotated move: {next_move}")
                if next_move == "pass":
                    next_move = last_move
                elif next_move == "resign":
                    print("L'IA a abandonné la partie.")
                    running = False
                    break
                elif next_move == "ERROR":
                    print("ERREUR : L'IA n'a pas su fournir de mouvement valide.")
                    running = False
                    break
            time.sleep(0.2) # Modulable selon la vitesse voulue
            # Ecrire le mouvement défini dans le fichier next_state.json
            self.moves_done.append(next_move)
            if ai_type == "llm":
                next_json = {"number_of_moves_done" : len(self.moves_done), "moves": self.moves_done, "explanations": self.moves_explanations}
            else:
                next_json = {"number_of_moves_done" : len(self.moves_done), "moves": self.moves_done}
            with open("next_state.json", "w") as f:
                json.dump(next_json, f)
            # Mettre à jour le jeu avec le mouvement défini par l'IA
            self.take_direction(next_move)
            self.player_forward()
            if self.is_game_over:
                running = False
            self.fruit_eat()
            self.reappear_fruit()
            last_move = next_move
            next_move = None

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else None
    pygame.init()
    game = Jeu()
    game.JSONtoPython(path)
    game.draw()
    
    ai_type = sys.argv[2] if len(sys.argv) > 2 else None
    game.go(ai_type)

    print(f"Game Over\n Score obtenu : ${game.score}")

        
    
    
    
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

