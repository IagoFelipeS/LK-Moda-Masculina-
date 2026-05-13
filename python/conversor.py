#Conversor de Moedas
input("Bem Vindo ao Conversor de Moedas! Pressione Enter para Continuar...")
reais = float(input("Digite o valor em Reais (R$) que deseja converter: ") )
escolha = input("Digite a moeda para a qual deseja converter (Dolar, Euro ou Yen): ").lower()
dolar = reais * 5.25
euro = reais * 5.90
yen = reais * 0.048
if escolha == "dolar":
    print(f"O valor de R${reais:.2f} convertido para Dolar é: ${dolar:.2f}")
elif escolha == "euro":
      print(f"O valor de R${reais:.2f} convertido para Euro é: €{euro:.2f}")
elif escolha == "yen":
      print(f"O valor de R${reais:.2f} convertido para Yen é: ¥{yen:.2f}")
else:
      print("Moeda não suportada. Por favor, escolha entre Dolar, Euro ou Yen.")