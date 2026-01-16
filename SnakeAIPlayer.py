from collections import deque
import heapq
import sys

def parse_grid(ascii_grid):
    """Parse la grille ASCII et retourne les positions importantes"""
    lines = [line.strip().replace(' ', '') for line in ascii_grid.strip().split('\n')]
    print(lines)
    head, body, fruits, enemies = None, [], [], []
    
    for x, line in enumerate(lines):
        for y in range(len(line)):
            if line[y] == 'O':
                head = (x, y)
            elif line[y] == 'S':
                body.append((x, y))
            elif line[y] == 'F':
                fruits.append((x, y))
            elif line[y] == 'M':
                enemies.append((x, y))
            elif line[y] == 'X':
                enemies.append((x, y))   

    return head, body, fruits, enemies, len(lines[0]), len(lines)

def get_neighbors(pos, width, height):
    """Retourne les voisins valides d'une position"""
    x, y = pos
    neighbors = []
    # Haut, Bas, Gauche, Droite
    for dx, dy, direction in [(0, -1, 'UP'), (0, 1, 'DOWN'), 
                               (-1, 0, 'LEFT'), (1, 0, 'RIGHT')]:
        nx, ny = x + dx, y + dy
        if 0 <= nx < width and 0 <= ny < height:
            neighbors.append(((nx, ny), direction))
    return neighbors

def is_safe(pos, body, enemies, borders):
    """Vérifie si une position est sûre (pas de collision)"""
    return pos not in body and pos not in enemies and pos not in borders

def a_star(start, goals, body, enemies, width, height):
    """A* pour trouver le chemin vers le fruit"""
    borders = set()
    for x in range(width):
        borders.add((x, 0))
        borders.add((x, height - 1))
    for y in range(height):
        borders.add((0, y))
        borders.add((width - 1, y))
    
    def heuristic(pos):
        min_distance = float('inf')
        for goal in goals:
            distance = abs(pos[0] - goal[0]) + abs(pos[1] - goal[1])
            if distance < min_distance:
                min_distance = distance
        return min_distance

    frontier = [(0, start, [])]
    visited = set()
    
    while frontier:
        _, current, path = heapq.heappop(frontier)
        
        if current in goals:
            return path
        
        if current in visited:
            continue
        visited.add(current)
        
        for next_pos, direction in get_neighbors(current, width, height):
            if is_safe(next_pos, body, enemies, borders) and next_pos not in visited:
                new_path = path + [direction]
                priority = len(new_path) + heuristic(next_pos)
                heapq.heappush(frontier, (priority, next_pos, new_path))
    
    return None

def has_escape_after_eating(pos, body, enemies, width, height):
    """Vérifie qu'après avoir mangé le fruit, le snake peut encore bouger"""
    borders = set()
    for x in range(width):
        borders.add((x, 0))
        borders.add((x, height - 1))
    for y in range(height):
        borders.add((0, y))
        borders.add((width - 1, y))
    
    # Simule le corps après avoir mangé (la queue ne bouge pas)
    new_body = [pos] + body
    
    # Compte les espaces accessibles via BFS
    queue = deque([pos])
    visited = {pos}
    accessible_count = 0
    
    while queue:
        current = queue.popleft()
        accessible_count += 1
        
        for next_pos, _ in get_neighbors(current, width, height):
            if (next_pos not in visited and 
                is_safe(next_pos, new_body, enemies, borders)):
                visited.add(next_pos)
                queue.append(next_pos)
    
    # Il faut au moins autant d'espace que la longueur du snake
    return accessible_count >= len(new_body)

def find_safe_move(head, body, enemies, width, height):
    """Trouve un mouvement sûr en cas d'absence de chemin vers le fruit"""
    borders = set()
    for x in range(width):
        borders.add((x, 0))
        borders.add((x, height - 1))
    for y in range(height):
        borders.add((0, y))
        borders.add((width - 1, y))
    
    best_move = None
    max_space = -1
    
    for next_pos, direction in get_neighbors(head, width, height):
        if not is_safe(next_pos, body, enemies, borders):
            continue
        
        # Compte l'espace accessible depuis cette position
        queue = deque([next_pos])
        visited = {next_pos}
        space_count = 0
        
        while queue:
            current = queue.popleft()
            space_count += 1
            
            for neighbor, _ in get_neighbors(current, width, height):
                if (neighbor not in visited and 
                    is_safe(neighbor, body, enemies, borders)):
                    visited.add(neighbor)
                    queue.append(neighbor)
        
        if space_count > max_space:
            max_space = space_count
            best_move = direction
    
    return best_move

def get_next_move(ascii_grid):
    """
    Fonction principale : retourne la prochaine direction
    
    Args:
        ascii_grid: string représentant l'état du jeu
        
    Returns:
        string: 'UP', 'DOWN', 'LEFT', ou 'RIGHT'
    """
    head, body, fruits, enemies, width, height = parse_grid(ascii_grid)
    
    if not head or not fruits:
        return 'UP'  # Défaut si parsing échoue
    
    # Cherche un chemin vers le fruit
    path = a_star(head, fruits, body, enemies, width, height)
    if path:
        # Vérifie que le mouvement vers le fruit est sûr
        next_pos = None
        if path[0] == 'UP':
            next_pos = (head[0], head[1] - 1)
        elif path[0] == 'DOWN':
            next_pos = (head[0], head[1] + 1)
        elif path[0] == 'LEFT':
            next_pos = (head[0] - 1, head[1])
        elif path[0] == 'RIGHT':
            next_pos = (head[0] + 1, head[1])
        
        # Si c'est le fruit, vérifie qu'on aura une sortie après
        if next_pos in fruits:
            if has_escape_after_eating(next_pos, body, enemies, width, height):
                return path[0]
            # Sinon, cherche un mouvement alternatif
        else:
            return path[0]
    
    # Pas de chemin direct : cherche un mouvement sûr qui maximise l'espace
    safe_move = find_safe_move(head, body, enemies, width, height)
    return safe_move if safe_move else 'UP'

def valider_grille(grille_str):
    """
    Vérifie si la chaîne représente une grille valide.
    
    Format attendu :
    - Bordures en '#' (haut, bas, gauche, droite)
    - Intérieur avec '.', 'F', 'S', 'O', 'M', 'X' et espaces
    - Grille rectangulaire
    
    Renvoie:
        True si valide, False sinon
    """
    lignes = grille_str.strip().split('\n')
    if len(lignes) < 3:
        return False # Pas de place pour un serpent, donc impossible de jouer
    
    # Retirer les espaces inutiles
    lignes = [ligne.strip().replace(' ', '') for ligne in lignes]

    # Vérifier que toutes les lignes ont la même longueur
    longueurs = [len(ligne) for ligne in lignes]
    if len(set(longueurs)) != 1:
        return False
    
    # Vérifier la première et dernière ligne (que des '#' et espaces)
    for ligne in [lignes[0], lignes[-1]]:
        if not all(c in ['#', ' '] for c in ligne):
            return False
        if ligne.strip().replace('#', '') != '':
            return False
    
    # Vérifier les lignes du milieu
    caracteres_valides = {'#', '.', 'F', 'S', 'O', 'M', 'X'}
    for ligne in lignes[1:-1]:
        # Vérifier que la ligne contient uniquement des caractères valides
        if not all(c in caracteres_valides for c in ligne):
            return False
        
        # Vérifier que la ligne commence et finit par '#'
        ligne_stripped = ligne.strip()
        if not ligne_stripped.startswith('#') or not ligne_stripped.endswith('#'):
            return False
    
    return True

def run():
    param_grid = ""
    grid = ""
    with open("./grid.txt", 'r') as fichier:
        param_grid = fichier.read()
        if valider_grille(param_grid):
            grid = param_grid
    
    next_move = get_next_move(grid)
    print(f"Direction sélectionnée : {next_move}")
    
    with open("./AI_response.txt", "w") as f:
        f.write(next_move + "\n")

# Exemple d'utilisation
if __name__ == "__main__":
    grid = """
# # # # # # # # # # # # 
# . . . . . . . . . . #
# . . . . . . . . . . #
# . . . . . . . . . . #
# . S S O . . . . . . #
# . . . . . . . . . . #
# . . . . . . . . . . #
# . . . . . . . F . . #
# . . . . . . . . . . #
# . . . . . . . . . . #
# # # # # # # # # # # # 
"""
    path_grid = sys.argv[1] if len(sys.argv) > 1 else None
    with open(path_grid, 'r') as fichier:
        param_grid = fichier.read()
        if valider_grille(param_grid):
            grid = param_grid
    
    next_move = get_next_move(grid)
    print(f"Prochaine direction : {next_move}")
    
    with open("AI_response.txt", "w") as f:
        f.write(next_move + "\n")