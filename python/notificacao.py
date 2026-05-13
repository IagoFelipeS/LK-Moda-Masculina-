import time
import notification

def lembrete():
    notification.notify(
        title="Já se Hidratou hoje?",
        message="Hora de beber água!",
        timeout=10
    )

    while True:
        lembrete()
        time.sleep(10)  # uma pausa de 60 segundos antes de mostrar a próxima notificação