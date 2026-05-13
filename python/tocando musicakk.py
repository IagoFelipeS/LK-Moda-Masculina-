import pygame

pygame.init()
pygame.mixer.init()  # inicializa o mixer de áudio

pygame.mixer.music.load("acdc.mp3")
pygame.mixer.music.play()

# Mantém o programa rodando enquanto a música toca
while pygame.mixer.music.get_busy():
    pygame.time.Clock().tick(10)

pygame.quit()

