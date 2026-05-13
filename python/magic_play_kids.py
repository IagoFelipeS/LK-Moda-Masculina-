import tkinter as tk
from tkinter import messagebox
import time
import json
import os
import winsound  # Biblioteca para alertas sonoros no Windows

class MagicPlayKidsGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Magic Play Kids | Gestão Profissional")
        
        # Configuração de Tela Cheia
        self.root.attributes('-fullscreen', True) 
        self.root.bind("<Escape>", lambda event: self.root.attributes("-fullscreen", False))
        
        # Inicialização de Dados
        self.arquivo_dados = "dados_magicplay.json"
        self.criancas = []
        self.historico_transacoes = []
        self.faturamento_total = 0.0
        
        # Carregar dados salvos anteriormente
        self.carregar_dados()
        
        # Paleta de Cores Midnight Premium
        self.cores = {
            "bg_dark": "#121212",      
            "card_bg": "#1E1E26",      
            "accent": "#00ADB5",       
            "text": "#EEEEEE",         
            "danger": "#FF2E63",       
            "success": "#08D9D6",      
            "gray": "#888888"
        }

        self.setup_menu()
        self.atualizar_contagem_principal()

    # --- FUNÇÕES DE PERSISTÊNCIA (SALVAMENTO) ---
    def salvar_dados(self):
        """Salva o estado atual do sistema em um arquivo JSON"""
        dados = {
            "faturamento": self.faturamento_total,
            "historico": self.historico_transacoes,
            "ativas": self.criancas
        }
        with open(self.arquivo_dados, "w") as f:
            json.dump(dados, f, indent=4)

    def carregar_dados(self):
        """Carrega os dados do arquivo se ele existir"""
        if os.path.exists(self.arquivo_dados):
            try:
                with open(self.arquivo_dados, "r") as f:
                    dados = json.load(f)
                    self.faturamento_total = dados.get("faturamento", 0.0)
                    self.historico_transacoes = dados.get("historico", [])
                    self.criancas = dados.get("ativas", [])
            except Exception as e:
                print(f"Erro ao carregar dados: {e}")

    # --- INTERFACE E LÓGICA ---
    def setup_menu(self):
        for widget in self.root.winfo_children():
            widget.destroy()

        self.main_frame = tk.Frame(self.root, bg=self.cores["bg_dark"])
        self.main_frame.pack(fill="both", expand=True)

        self.label_contagem = tk.Label(
            self.main_frame, text="ATIVAS: 0", 
            font=("Segoe UI", 18, "bold"), bg=self.cores["card_bg"], fg=self.cores["accent"],
            padx=30, pady=20, bd=0
        )
        self.label_contagem.place(x=50, y=100)

        tk.Label(self.main_frame, text="MAGIC PLAY KIDS", font=("Segoe UI Light", 60), 
                 fg=self.cores["text"], bg=self.cores["bg_dark"]).pack(pady=(120, 10))
        
        line = tk.Frame(self.main_frame, bg=self.cores["accent"], height=2, width=500)
        line.pack(pady=(0, 70))

        btn_frame = tk.Frame(self.main_frame, bg=self.cores["bg_dark"])
        btn_frame.pack()

        def criar_btn(texto, comando, cor=None):
            b = tk.Button(btn_frame, text=texto, command=comando, font=("Segoe UI", 14, "bold"), 
                          bg=self.cores["card_bg"], fg=self.cores["text"], width=40, height=2, relief="flat")
            b.bind("<Enter>", lambda e: b.config(bg="#2D2D3A", fg=cor or self.cores["accent"]))
            b.bind("<Leave>", lambda e: b.config(bg=self.cores["card_bg"], fg=self.cores["text"]))
            return b

        criar_btn("✨ NOVO CADASTRO", self.cadastrar_crianca).pack(pady=10)
        criar_btn("🕒 MONITORAR TEMPO", self.janela_ver_criancas).pack(pady=10)
        criar_btn("📊 RELATÓRIO FINANCEIRO", self.mostrar_faturamento, self.cores["success"]).pack(pady=10)
        
        tk.Button(self.main_frame, text="SAIR (ESC)", font=("Segoe UI", 10), bg=self.cores["bg_dark"], 
                  fg=self.cores["danger"], relief="flat", command=self.root.quit).pack(side="bottom", pady=50)

    def atualizar_contagem_principal(self):
        self.label_contagem.config(text=f"ATIVAS: {len(self.criancas)}")
        self.root.after(1000, self.atualizar_contagem_principal)

    def cadastrar_crianca(self):
        popup = tk.Toplevel(self.root)
        popup.title("Cadastro")
        popup.geometry("400x520")
        popup.configure(bg=self.cores["card_bg"])
        popup.grab_set()

        def input_field(label):
            tk.Label(popup, text=label, font=("Segoe UI", 9, "bold"), bg=self.cores["card_bg"], fg=self.cores["gray"]).pack(anchor="w", padx=60)
            entry = tk.Entry(popup, font=("Segoe UI", 14), bg="#2D2D3A", fg="white", borderwidth=0, insertbackground="white")
            entry.pack(fill="x", padx=60, pady=(5, 20), ipady=8)
            return entry

        ent_nome = input_field("NOME DA CRIANÇA")
        ent_resp = input_field("RESPONSÁVEL")
        ent_valor = input_field("VALOR (R$)")

        def salvar():
            try:
                nome, resp, valor = ent_nome.get().upper(), ent_resp.get().upper(), float(ent_valor.get())
                dados = {'id': time.time(), 'nome': nome, 'responsavel': resp, 'inicio': time.time(), 'valor': valor}
                self.criancas.append(dados)
                self.historico_transacoes.append(dados)
                self.faturamento_total += valor
                self.salvar_dados() # SALVAR NO ARQUIVO
                popup.destroy()
            except: messagebox.showerror("Erro", "Valor inválido.")

        tk.Button(popup, text="CONFIRMAR", bg=self.cores["accent"], fg="white", font=("Segoe UI", 12, "bold"),
                  relief="flat", height=2, command=salvar).pack(fill="x", padx=60, pady=20)

    def janela_ver_criancas(self):
        self.win_tempo = tk.Toplevel(self.root)
        self.win_tempo.title("Monitoramento")
        self.win_tempo.geometry("800x650")
        self.win_tempo.configure(bg=self.cores["bg_dark"])
        self.frame_lista = tk.Frame(self.win_tempo, bg=self.cores["bg_dark"])
        self.frame_lista.pack(fill="both", expand=True, padx=50, pady=20)
        self.atualizar_janela_tempo()

    def remover_crianca(self, crianca_id):
        self.criancas = [c for c in self.criancas if c['id'] != crianca_id]
        self.salvar_dados() # SALVAR APÓS REMOVER
        self.atualizar_janela_tempo()

    def atualizar_janela_tempo(self):
        if not self.win_tempo.winfo_exists(): return
        for w in self.frame_lista.winfo_children(): w.destroy()

        agora = time.time()
        for c in self.criancas:
            restante = 600 - (agora - c['inicio'])
            
            if restante <= 0:
                texto_t = "EXPIRADO"
                status_cor = self.cores["danger"]
                # Alerta sonoro quando o tempo acaba (Frequência 1000Hz, Duração 200ms)
                winsound.Beep(1000, 200) 
            else:
                texto_t = f"{int(restante // 60):02d}:{int(restante % 60):02d}"
                status_cor = self.cores["success"] if restante > 300 else "#FFA500"

            item = tk.Frame(self.frame_lista, bg=self.cores["card_bg"], pady=10)
            item.pack(fill="x", pady=5)
            
            tk.Label(item, text=f"{c['nome']}\nResp: {c['responsavel']}", font=("Segoe UI", 10), 
                     bg=self.cores["card_bg"], fg=self.cores["text"], justify="left").pack(side="left", padx=20)
            
            tk.Button(item, text="FINALIZAR", bg=self.cores["danger"], fg="white", relief="flat",
                      command=lambda id=c['id']: self.remover_crianca(id)).pack(side="right", padx=20)
            
            tk.Label(item, text=texto_t, font=("Consolas", 20, "bold"), bg=self.cores["card_bg"], fg=status_cor).pack(side="right", padx=20)

        self.win_tempo.after(1000, self.atualizar_janela_tempo)

    def mostrar_faturamento(self):
        janela_fat = tk.Toplevel(self.root)
        janela_fat.geometry("550x700")
        janela_fat.configure(bg=self.cores["bg_dark"])
        
        dash = tk.Frame(janela_fat, bg=self.cores["card_bg"], pady=30, padx=20)
        dash.pack(fill="x", padx=50, pady=30)
        
        total_atend = len(self.historico_transacoes)
        tkt_medio = self.faturamento_total / total_atend if total_atend > 0 else 0

        def metrica(l, v, c):
            f = tk.Frame(dash, bg=self.cores["card_bg"])
            f.pack(fill="x", pady=8)
            tk.Label(f, text=l, bg=self.cores["card_bg"], fg=self.cores["gray"]).pack(side="left")
            tk.Label(f, text=v, font=("Segoe UI", 14, "bold"), bg=self.cores["card_bg"], fg=c).pack(side="right")

        metrica("FATURAMENTO TOTAL:", f"R$ {self.faturamento_total:.2f}", self.cores["success"])
        metrica("TICKET MÉDIO:", f"R$ {tkt_medio:.2f}", self.cores["accent"])

        def resetar():
            if messagebox.askyesno("Limpar", "Deseja zerar o histórico?"):
                self.faturamento_total, self.historico_transacoes = 0.0, []
                self.salvar_dados()
                janela_fat.destroy()

        tk.Button(janela_fat, text="ZERAR CAIXA", bg=self.cores["danger"], fg="white", relief="flat",
                  command=resetar, height=2).pack(fill="x", padx=50, pady=20)

if __name__ == '__main__':
    root = tk.Tk()
    app = MagicPlayKidsGUI(root)
    root.mainloop()