import tkinter as tk
from tkinter import messagebox, simpledialog
import random

class CassinoGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Cassino - Slot Machine 🎰")
        self.root.geometry("420x370")
        self.root.configure(bg="#22223b")
        self.saldo = 0
        self.jogo_ativo = False
        self.deposito_realizado = False
        self.setup_deposito()

    def setup_deposito(self):
        for widget in self.root.winfo_children():
            widget.destroy()
        frame = tk.Frame(self.root, bg="#22223b")
        frame.pack(expand=True)
        tk.Label(frame, text="Cassino DevCore", font=("Arial Black", 22), fg="#f2e9e4", bg="#22223b").pack(pady=(18, 8))
        tk.Label(frame, text="Depósito obrigatório para apostar", font=("Arial", 14, "bold"), fg="#e07a5f", bg="#22223b").pack(pady=(0, 10))
        box = tk.Frame(frame, bg="#f2e9e4", bd=2, relief="groove")
        box.pack(pady=8, padx=10)
        tk.Label(box, text="Chave PIX para depósito", font=("Arial", 12, "bold"), fg="#22223b", bg="#f2e9e4").pack(pady=(10,2), padx=18)
        tk.Label(box, text="528.410.718-71", font=("Arial Black", 16), fg="#4a4e69", bg="#f2e9e4").pack(pady=(0,10), padx=18)
        tk.Label(frame, text="Após o depósito, insira o valor para liberar o saldo.", font=("Arial", 11), fg="#c9ada7", bg="#22223b").pack(pady=(8, 2))
        tk.Label(frame, text="Valor do depósito:", font=("Arial", 13), fg="#c9ada7", bg="#22223b").pack(pady=(10, 2))
        self.deposito_entry = tk.Entry(frame, font=("Arial", 14), width=15, bg="#f2e9e4", fg="#22223b", justify="center")
        self.deposito_entry.pack(pady=5)
        tk.Button(frame, text="Depositar e Jogar", font=("Arial", 12, "bold"), bg="#9a8c98", fg="#fff", activebackground="#4a4e69", activeforeground="#fff", command=self.fazer_deposito, relief="raised", bd=3, width=18).pack(pady=18)

    def fazer_deposito(self):
        try:
            valor = int(self.deposito_entry.get())
            if valor <= 0:
                raise ValueError
        except ValueError:
            messagebox.showerror("Erro", "Digite um valor de depósito válido!")
            return
        self.saldo = valor
        self.deposito_realizado = True
        self.jogo_ativo = True
        messagebox.showinfo("Depósito realizado", f"Depósito de R$ {valor} efetuado com sucesso!")
        self.setup_jogo()

    def iniciar_jogo(self):
        try:
            saldo = int(self.saldo_entry.get())
            if saldo <= 0:
                raise ValueError
        except ValueError:
            messagebox.showerror("Erro", "Digite um saldo inicial válido!")
            return
        self.saldo = saldo
        self.jogo_ativo = True
        self.setup_jogo()

    def setup_jogo(self):
        for widget in self.root.winfo_children():
            widget.destroy()
        frame = tk.Frame(self.root, bg="#22223b")
        frame.pack(expand=True, fill="both")
        self.saldo_label = tk.Label(frame, text=f"Saldo atual: R$ {self.saldo}", font=("Arial", 15, "bold"), fg="#f2e9e4", bg="#22223b")
        self.saldo_label.pack(pady=(18, 10))
        tk.Label(frame, text="Quanto quer apostar?", font=("Arial", 13), fg="#c9ada7", bg="#22223b").pack()
        self.aposta_entry = tk.Entry(frame, font=("Arial", 13), width=12, bg="#f2e9e4", fg="#22223b", justify="center")
        self.aposta_entry.pack(pady=7)
        self.resultado_label = tk.Label(frame, text="", font=("Arial Black", 32), fg="#f2e9e4", bg="#22223b")
        self.resultado_label.pack(pady=18)
        self.jogar_btn = tk.Button(frame, text="Jogar", font=("Arial", 13, "bold"), bg="#9a8c98", fg="#fff", activebackground="#4a4e69", activeforeground="#fff", command=self.jogar, relief="raised", bd=3, width=12)
        self.jogar_btn.pack(pady=8)
        self.sair_btn = tk.Button(frame, text="Sair", font=("Arial", 11), bg="#4a4e69", fg="#fff", activebackground="#c9ada7", activeforeground="#22223b", command=self.encerrar_jogo, relief="groove", bd=2, width=10)
        self.sair_btn.pack(pady=5)

    def jogar(self):
        if not self.jogo_ativo:
            return
        try:
            aposta = int(self.aposta_entry.get())
        except ValueError:
            messagebox.showerror("Erro", "Digite apenas números!")
            return
        if aposta <= 0:
            messagebox.showerror("Erro", "A aposta deve ser maior que zero!")
            return
        if aposta > self.saldo:
            messagebox.showerror("Erro", "Saldo insuficiente!")
            return
        simbolos = ["🍒", "🍋", "🍉", "⭐"]
        # Animação de rolagem dos emojis
        import time
        rolo = ["", "", ""]
        for i in range(3):
            for _ in range(12 + i * 6):
                rolo[i] = random.choice(simbolos)
                self.resultado_label.config(text=" | ".join(rolo))
                self.resultado_label.update()
                self.root.update()
                time.sleep(0.07 + i*0.03)
        # Resultado final
        if rolo[0] == rolo[1] == rolo[2]:
            ganho = aposta * 10
            self.saldo += ganho
            self.resultado_label.config(fg="#b7e778")
            messagebox.showinfo("Parabéns!", f"Você ganhou R$ {ganho}")
        else:
            self.saldo -= aposta
            self.resultado_label.config(fg="#e07a5f")
            messagebox.showinfo("Que pena!", "Você perdeu a aposta.")
        self.saldo_label.config(text=f"Saldo atual: R$ {self.saldo}")
        self.aposta_entry.delete(0, tk.END)
        if self.saldo <= 0:
            messagebox.showinfo("Fim de Jogo", "Você ficou sem saldo!")
            self.encerrar_jogo()
        else:
            self.perguntar_continuar()

    def perguntar_continuar(self):
        continuar = messagebox.askyesno("Continuar?", "Deseja continuar jogando?")
        if not continuar:
            self.encerrar_jogo()

    def encerrar_jogo(self):
        messagebox.showinfo("Cassino", f"Obrigado por jogar!\nSaldo final: R$ {self.saldo}")
        self.jogo_ativo = False
        self.deposito_realizado = False
        self.setup_deposito()

if __name__ == "__main__":
    root = tk.Tk()
    app = CassinoGUI(root)
    root.mainloop()
