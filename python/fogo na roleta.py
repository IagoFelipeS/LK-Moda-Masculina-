import random
import time



def slot_machine(saldo):
    print(f"\n💰 Saldo atual: R$ {saldo}")

    try:
        aposta = float(input("Quanto quer apostar? R$ "))
    except ValueError:
        print("❌ Digite apenas números!")
        return saldo

    if aposta <= 0:
        print("❌ A aposta deve ser maior que zero!")
        return saldo

    if aposta > saldo:
        print("❌ Saldo insuficiente!")
        return saldo

    simbolos = ["🍒", "🍋", "🍉", "⭐"]
    rolo = ["", "", ""]

    print("\n🎰 Girando...")

    
    for i in range(3):
        for _ in range(10 + i * 5):
            rolo[i] = random.choice(simbolos)
            print(" | ".join(rolo), end="\r")
            time.sleep(0.12)
        print()

    # resultado final
    if rolo[0] == rolo[1] == rolo[2]:
        ganho = aposta * 5
        print("🎉🎉🎉 JACKPOT!!! 🎉🎉🎉")
        print(f"Você ganhou R$ {ganho}")
        saldo += ganho
    else:
        print("😢 Não foi dessa vez")
        saldo -= aposta

    return saldo


def cassino():
    try:
        saldo = int(input("Digite seu saldo inicial: R$ "))
    except ValueError:
        print("Saldo inválido!")
        return

    while saldo > 0:
        saldo = slot_machine(saldo)

        if saldo <= 0:
            print("\n💸 Você ficou sem saldo!")
            break

        continuar = input("\nDeseja continuar jogando? (s/n): ").lower()

        if continuar != "s":
            print("\n👋 Obrigado por jogar!")
            break

    print(f"\n💰 Saldo final: R$ {saldo}")


# 🚀 INICIAR O JOGO
cassino()
