confirmacao = 0

while confirmacao != "nao":
 nome_produto = str(input("Nome do produto: "))
 cod_fabricante = int(input("Codigo do fabricante: "))
 cod_de_barras = int(input("Codigo de barras: ")) 
 print("")
 lastro = int(input("Lastro: "))
 camada = int(input("Camada: "))   
 cx_plt = lastro * camada
 print("Quantidade de caixas por palete: ", cx_plt)
 print("")
 Cubagem_altura = float(input("Cubagem (altura): "))
 Cubagem_largura = float(input("Cubagem (largura): "))
 Cubagem_comprimento = float(input("Cubagem (comprimento): "))
 Cubagem = Cubagem_altura * Cubagem_largura * Cubagem_comprimento
 print("Cubagem do produto: ", Cubagem)
 print("")
 confirmacao = print(nome_produto, cod_fabricante, cod_de_barras, lastro, camada, cx_plt, Cubagem), input("Confirma os dados do produto? sim / não: ")
 if confirmacao == "sim":
     print("Produto cadastrado com sucesso! ")
 if confirmacao == "nao" :
     print("Produto não cadastrado! ")
     print("")
    
 