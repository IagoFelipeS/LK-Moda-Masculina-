#biblioteca de manipulação de dados
import pandas as pd

#carregar o banco
banco = pd.read_csv('Aulas/banco de dados.csv', sep=';', encoding='latin1')

#visualizar o banco
print(banco)

#mostrar primeiros registros
banco.head(2)

#mostrar o final
banco.tail(2)

#quantas linhas e colunas a tabela tem
print(banco.shape)

#filtrar registros com nome "iago"
bancofiltrado = banco[banco["NOME"].str.contains("iago", case=False)]
print(bancofiltrado)

