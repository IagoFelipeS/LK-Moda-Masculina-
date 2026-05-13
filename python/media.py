notax = float(input("Digite sua nota:"))
notay = float(input("Digite sua nota:"))
notaz = float(input("Digite sua nota:"))

media = (notax + notay + notaz) / 3

print("Sua media é de:", media)

if media >= 6:
    print("Aluno Aprovado!")

if media < 6:
    print("Aluno Reprovado!")
