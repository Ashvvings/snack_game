from enum import Enum
import pygame, json, sys
import random, time

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


    # Met à jour la direction en fonction des touches appuyées
    def take_direction(self, event):
        if event.type == pygame.KEYDOWN:
        # Flèches directionnelles
            if event.key == pygame.K_UP or event.key == pygame.K_z:
                if self.player.size>1 and self.player.fils is not None:
                    if (self.player.position[0],self.player.position[1]-1)==self.player.fils.position : return
                    if (self.player.position[0],self.grid.y)==self.player.fils.position : return
                self.direction=Direction.HAUT
                return
            if event.key == pygame.K_DOWN or event.key == pygame.K_s:
                if self.player.size>1 and self.player.fils is not None:
                    if (self.player.position[0],self.player.position[1]+1)==self.player.fils.position : return
                    if (self.player.position[0],0)==self.player.fils.position : return
                self.direction=Direction.BAS
                return
            if event.key == pygame.K_LEFT or event.key == pygame.K_q:
                if self.player.size>1 and self.player.fils is not None:
                    if (self.player.position[0]-1,self.player.position[1])==self.player.fils.position : return
                    if (self.grid.x,self.player.position[1])==self.player.fils.position : return
                self.direction=Direction.GAUCHE
                return
            if event.key == pygame.K_RIGHT or event.key == pygame.K_d:
                if self.player.size>1 and self.player.fils is not None:
                    if (self.player.position[0]+1,self.player.position[1])==self.player.fils.position : return
                    if (0,self.player.position[1])==self.player.fils.position : return
                self.direction=Direction.DROITE
                return


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


    # Lancement de la boucle de jeu
    def go(self):
        running = True
        while running:
            game.draw()
            pygame.display.update()
            self.fpsClock.tick(self.player.speed)
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

