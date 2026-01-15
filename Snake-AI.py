from collections import deque
import heapq

def parse_grid(ascii_grid):
    """Parse la grille ASCII et retourne les positions importantes"""
    lines = [line.strip() for line in ascii_grid.strip().split('\n')]
    head, body, fruit = None, [], None
    
    for y, line in enumerate(lines):
        for x, char in enumerate(line.split()):
            if char == 'O':
                head = (x, y)
            elif char == 'S':
                body.append((x, y))
            elif char == 'F':
                fruit = (x, y)
    
    return head, body, fruit, len(lines[0].split()), len(lines)

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

def is_safe(pos, body, borders):
    """Vérifie si une position est sûre (pas de collision)"""
    return pos not in body and pos not in borders

def a_star(start, goal, body, width, height):
    """A* pour trouver le chemin vers le fruit"""
    borders = set()
    for x in range(width):
        borders.add((x, 0))
        borders.add((x, height - 1))
    for y in range(height):
        borders.add((0, y))
        borders.add((width - 1, y))
    
    def heuristic(pos):
        return abs(pos[0] - goal[0]) + abs(pos[1] - goal[1])
    
    frontier = [(0, start, [])]
    visited = set()
    
    while frontier:
        _, current, path = heapq.heappop(frontier)
        
        if current == goal:
            return path
        
        if current in visited:
            continue
        visited.add(current)
        
        for next_pos, direction in get_neighbors(current, width, height):
            if is_safe(next_pos, body, borders) and next_pos not in visited:
                new_path = path + [direction]
                priority = len(new_path) + heuristic(next_pos)
                heapq.heappush(frontier, (priority, next_pos, new_path))
    
    return None

def has_escape_after_eating(pos, body, width, height):
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
                is_safe(next_pos, new_body, borders)):
                visited.add(next_pos)
                queue.append(next_pos)
    
    # Il faut au moins autant d'espace que la longueur du snake
    return accessible_count >= len(new_body)

def find_safe_move(head, body, width, height):
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
        if not is_safe(next_pos, body, borders):
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
                    is_safe(neighbor, body, borders)):
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
    head, body, fruit, width, height = parse_grid(ascii_grid)
    
    if not head or not fruit:
        return 'UP'  # Défaut si parsing échoue
    
    # Cherche un chemin vers le fruit
    path = a_star(head, fruit, body, width, height)
    
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
        if next_pos == fruit:
            if has_escape_after_eating(next_pos, body, width, height):
                return path[0]
            # Sinon, cherche un mouvement alternatif
        else:
            return path[0]
    
    # Pas de chemin direct : cherche un mouvement sûr qui maximise l'espace
    safe_move = find_safe_move(head, body, width, height)
    return safe_move if safe_move else 'UP'


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
    
    next_move = get_next_move(grid)
    print(f"Prochaine direction : {next_move}")