from PIL import Image
import os

input_path = r"C:\Users\Iago Felipe\OneDrive\Imagens\logo kamper.jpg"
output_path = r"C:\Users\Iago Felipe\OneDrive\Imagens\logo_sem_fundo.png"

# Verificação
if not os.path.exists(input_path):
    print("❌ Imagem não encontrada!")
else:
    img = Image.open(input_path).convert("RGBA")

    new_data = []

    for pixel in img.getdata():
        r, g, b, a = pixel

        # Remove fundo preto
        if r < 40 and g < 40 and b < 40:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append((r, g, b, a))

    img.putdata(new_data)
    img.save(output_path)

    print("✅ Fundo removido com sucesso!")