
while True:
    try:
        velocidade = float(input("Digite a velocidade do carro em km/h: "))
        break
    except ValueError:
        print("Valor inválido. Digite um número válido.")

if velocidade > 100:
    multa = (velocidade - 100) * 5
    print("Multado! Você excedeu o limite de velocidade de 100 km/h.")
    print(f"Sua multa é de R$ {multa:.2f}")
else:
    print("Dentro do limite de velocidade. Tenha um bom dia!")
