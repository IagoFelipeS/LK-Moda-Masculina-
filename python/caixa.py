saldo = 1000.00

desejo = str(input("O que deseja fazer: Depositar, Sacar, Ver saldo: "))

if desejo == "depositar":
    deposito = float(input("Qual valor deseja depositar: "))

    saldo = saldo + deposito   

    print("O valor",deposito, "foi adicionado na sua conta! " )
    escolha = str(input("Deseja ver seu saldo sim / não: "))

    if escolha == "sim":
        print("Seu saldo atual é de: ",saldo)

    if escolha == "não": 
        print("Seção encerrada! ")

if desejo == "sacar": 
    sacar = float(input("Qual valor deseja sacar: "))

    saldo = saldo - sacar


    print("O valor" ,sacar, "tirado na sua conta! ")
    escolha = str(input("Deseja ver seu saldo sim / não: "))
    if escolha == "sim":
        print("Seu saldo atual é de: ",saldo)
        
    if escolha == "não": 
        print("Seção encerrada! ")

if desejo == "ver saldo":
    print("Seu saldo é de: ",saldo)


