import math

operacao = input("Digite qual operação deseja: soma, subtração, multiplicação ou divisão: ")
if operacao == "soma":
    num1 = float(input("Digite o primeiro número: "))
    num2 = float(input("Digite o segundo número: "))
    resultado = num1 + num2
    print("O resultado da soma é:", resultado)

if operacao == "subtração":
    num1 = float(input("Digite o primeiro número: "))
    num2 = float(input("Digite o segundo número: "))
    resultado = num1 - num2
    print("O resultado da subtração é:", resultado)

if operacao == "multiplicação":
    num1 = float(input("Digite o primeiro número: "))
    num2 = float(input("Digite o segundo número: "))
    resultado = num1 * num2
    print("O resultado da multiplicação é:", resultado)

if operacao == "divisão":
    num1 = float(input("Digite o primeiro número: "))
    num2 = float(input("Digite o segundo número: "))
    if num2 == 0:
        print("Não é possível dividir por zero!")
    else:
        resultado = num1 / num2
        print("O resultado da divisão é:", resultado)
        