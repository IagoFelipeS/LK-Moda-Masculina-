import random
aluno1 = input('Digite seu nome:')
aluno2 = input('Digite seu nome:')
aluno3 = input('Digite seu nome:')
aluno4 = input('Digite seu nome:')
lista = [aluno1, aluno2, aluno3, aluno4]
sorteado = random.choice(lista)
print("O aluno sorteado foi:", sorteado)
# random.choice escolhe um elemento aleatório da lista