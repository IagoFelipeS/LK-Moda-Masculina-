

camisa = 50
calca = 120
jaqueta = 200
produtos = ['camisa', 'calça', 'jaqueta']

print("Produtos disponiveis:", produtos)

escolha = input("Qual produto você deseja comprar?  ")

if escolha =="camisa":
    print("O preço da camisa é R$", camisa)
elif escolha == "calça":
    print("O preço da calça é R$", calca)
elif escolha == "jaqueta":
    print("O preço da jaqueta é R$", jaqueta)
else:
    print("Produto não encontrado.")

quantidade = int(input("Quantas unidades você deseja comprar? "))

vip = input("Você é um cliente VIP? (sim/não) ")
if vip.lower() == "sim":
    desconto = 0.1
    print("Você tem direito a um desconto de 10%!")
else:    desconto = 0
preco_final = 0
if escolha == "camisa":
    preco_final = camisa * (1 - desconto)
elif escolha == "calça":
    preco_final = calca * (1 - desconto)
elif escolha == "jaqueta":
    preco_final = jaqueta * (1 - desconto)

print("O preço final do produto é R$", preco_final * quantidade)
print("")
print("Obrigado pela preferência!")
