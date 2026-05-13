
prisem = float(input("Digite a nota do primeiro semestre: "))
segsem = float(input("Digite a nota do segundo semestre: "))
tersem = float(input("Digite a nota do terceiro semestre: "))
quatsem = float(input("Digite a nota do quarto semestre: "))
if prisem < 0 or prisem > 10 or segsem < 0 or segsem > 10 or tersem < 0 or tersem > 10 or quatsem < 0 or quatsem > 10:
    print("Nota inválida! As notas devem estar entre 0 e 10.")
    exit()
media = (prisem + segsem + tersem + quatsem) / 4

if media >= 7:
    print(f"Média final: {media:.2f}")
    print("Aprovado")
if media >= 5 and media < 7:
    print(f"Média final: {media:.2f}")
    print("Recuperação")
if media < 5:
    print(f"Média final: {media:.2f}")
    print("Reprovado")
