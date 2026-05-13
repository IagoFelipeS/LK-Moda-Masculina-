
escolha = 0
gui = ["Guilherme Num: 123456"]
iago = ["Iago Num: 456123"]

while escolha != "nao":

    nome_novo = str(input("Nome de contato: "))
    num_novo = int(input("Numero: "))

    novo = [nome_novo, num_novo]
    print("")
    print("Um novo contato foi adicionado! ")
    print("")

    escolha = str(input("Deseja ver seus contatos sim / não "))
    if escolha == "sim" :
     print(gui, iago, novo)

    if escolha == "nao":
     print("")
     print("Serviço terminado! ")



