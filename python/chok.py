#gerando qrcode

import qrcode
url = input("Digite o pix da empresa: ")
img = qrcode.make(url)
img.save("qrcode.png")  
print("QR code gerado e salvo como 'qrcode.png'.")