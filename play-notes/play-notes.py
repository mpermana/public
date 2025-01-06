import pygame
import sys

# Initialize pygame mixer and library
pygame.init()
pygame.mixer.init()

# Map keyboard keys to note files
key_note_map = {
    pygame.K_a: "c.wav",
    pygame.K_s: "d.wav",
    pygame.K_d: "e.wav",
    pygame.K_f: "f.wav",
    pygame.K_g: "g.wav",
    pygame.K_h: "a.wav",
    pygame.K_j: "b.wav",
    pygame.K_k: "c_high.wav"  # C'
}

# Load the sounds
sounds = {key: pygame.mixer.Sound(note_file) for key, note_file in key_note_map.items()}

# Create a pygame window to capture events
screen = pygame.display.set_mode((400, 300))
pygame.display.set_caption("Keyboard Piano")

print("Press A, S, D, F, G, H, J, K to play notes (C, D, E, F, G, A, B, C').")

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN:
            if event.key in sounds:
                sounds[event.key].play()

pygame.quit()
sys.exit()
