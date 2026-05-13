

nome = input("Digite seu nome: ")
cpf = input("Digite seu CPF: ")
nascimento = input("Digite sua data de nascimento (dd/mm/aaaa): ")
email = input("Digite seu email: ")
senha = input("Digite sua senha: ")
confirmacao_senha = input("Confirme sua senha: ")

if senha != confirmacao_senha:
    print("As senhas não coincidem. Por favor, tente novamente.")
else:
    print("")

lista_cadastros = [nome, cpf, nascimento, email]
print("Confirme seus dados:")
print("Nome:", nome)
print("CPF:", cpf)
print("Data de nascimento:", nascimento)
print("Email:", email)

confirmacao = input("Os dados estão corretos? (sim/não): ")
if confirmacao.lower() == "sim":
    print("Cadastro confirmado!")
    
else:
    print("Cadastro cancelado. Por favor, revise seus dados e tente novamente.")
