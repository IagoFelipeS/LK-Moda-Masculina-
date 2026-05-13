import random
import time

escolha = str(input("Escolha entre Pedra, Papel e tesoura:  "))

lista = ["pedra", "papel", "tesoura"]

lista = random.choice(lista)

print(escolha,"VS",lista)



if (escolha == lista):
    print("Empate")

if (escolha == "pedra") and (lista == "tesoura"):
    print("Você Venceu!")

if (escolha == "pedra") and (lista == "papel"):
    print("Você Perdeu! ")

if (escolha == "papel") and (lista == "pedra"):
    print("Você Venceu! ")

if (escolha == "papel") and (lista == "tesoura"):
    print("Você perdeu! ")

if (escolha == "tesoura") and (lista == "papel"):
    print("Você Venceu! ")

if (escolha == "tesoura") and (lista == "pedra"):
    print("Você perdeu! ")




