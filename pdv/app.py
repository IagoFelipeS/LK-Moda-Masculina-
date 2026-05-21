from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import sqlite3
import os
import random
import string
from datetime import datetime
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'jessica-thais-pdv-chave-secreta-2025'
DB_PATH = os.path.join(os.path.dirname(__file__), 'pdv.db')


# ── Banco de dados ──────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        nome TEXT NOT NULL,
        perfil TEXT DEFAULT 'vendedor',
        ativo INTEGER DEFAULT 1,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        categoria TEXT DEFAULT '',
        preco_custo REAL DEFAULT 0,
        margem REAL DEFAULT 0,
        preco_venda REAL DEFAULT 0,
        estoque INTEGER DEFAULT 0,
        ativo INTEGER DEFAULT 1,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS vendas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        usuario_nome TEXT,
        total REAL NOT NULL,
        pagamento TEXT NOT NULL,
        valor_pago REAL DEFAULT 0,
        troco REAL DEFAULT 0,
        status TEXT DEFAULT 'concluida',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS itens_venda (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venda_id INTEGER,
        produto_id INTEGER,
        codigo TEXT,
        nome TEXT,
        quantidade INTEGER,
        preco_unit REAL,
        subtotal REAL
    )''')
    if not c.execute('SELECT id FROM usuarios WHERE usuario=?', ('admin',)).fetchone():
        c.execute('INSERT INTO usuarios (usuario,senha,nome,perfil) VALUES (?,?,?,?)',
                  ('admin', generate_password_hash('admin123'), 'Administrador', 'admin'))
    conn.commit()
    conn.close()


# ── Decorators ─────────────────────────────────────────────
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'uid' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'uid' not in session:
            return redirect(url_for('login'))
        if session.get('perfil') != 'admin':
            flash('Acesso restrito ao administrador.', 'erro')
            return redirect(url_for('dashboard'))
        return f(*args, **kwargs)
    return decorated


def gerar_codigo():
    return ''.join(random.choices(string.digits, k=8))


# ── Rotas ───────────────────────────────────────────────────
@app.route('/', methods=['GET', 'POST'])
def login():
    if 'uid' in session:
        return redirect(url_for('dashboard'))
    if request.method == 'POST':
        usuario = request.form.get('usuario', '').strip()
        senha = request.form.get('senha', '')
        conn = get_db()
        u = conn.execute('SELECT * FROM usuarios WHERE usuario=? AND ativo=1', (usuario,)).fetchone()
        conn.close()
        if u and check_password_hash(u['senha'], senha):
            session['uid'] = u['id']
            session['nome'] = u['nome']
            session['perfil'] = u['perfil']
            session['usuario'] = u['usuario']
            return redirect(url_for('dashboard'))
        flash('Usuário ou senha incorretos.', 'erro')
    return render_template('login.html')


@app.route('/sair')
def sair():
    session.clear()
    return redirect(url_for('login'))


@app.route('/dashboard')
@login_required
def dashboard():
    conn = get_db()
    hoje = datetime.now().strftime('%Y-%m-%d')
    vh = conn.execute(
        "SELECT COUNT(*) c, COALESCE(SUM(total),0) t FROM vendas WHERE DATE(criado_em)=? AND status='concluida'",
        (hoje,)).fetchone()
    tp = conn.execute("SELECT COUNT(*) c FROM produtos WHERE ativo=1").fetchone()
    eb = conn.execute("SELECT COUNT(*) c FROM produtos WHERE ativo=1 AND estoque<=5").fetchone()
    recentes = conn.execute(
        "SELECT * FROM vendas WHERE status='concluida' ORDER BY criado_em DESC LIMIT 8").fetchall()
    conn.close()
    return render_template('dashboard.html', vh=vh, tp=tp, eb=eb, recentes=recentes)


@app.route('/pdv')
@login_required
def pdv():
    return render_template('pdv.html')


@app.route('/api/buscar')
@login_required
def api_buscar():
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify([])
    conn = get_db()
    rows = conn.execute(
        "SELECT id,codigo,nome,preco_venda,estoque,categoria FROM produtos WHERE ativo=1 AND estoque>0 AND (codigo LIKE ? OR nome LIKE ?) LIMIT 12",
        (f'%{q}%', f'%{q}%')).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route('/api/venda', methods=['POST'])
@login_required
def api_venda():
    data = request.get_json()
    itens = data.get('itens', [])
    pagamento = data.get('pagamento', '')
    valor_pago = float(data.get('valor_pago', 0))
    if not itens or not pagamento:
        return jsonify({'ok': False, 'msg': 'Dados inválidos'})
    total = sum(i['subtotal'] for i in itens)
    troco = max(0, valor_pago - total) if pagamento == 'dinheiro' else 0
    conn = get_db()
    try:
        cur = conn.execute(
            'INSERT INTO vendas (usuario_id,usuario_nome,total,pagamento,valor_pago,troco) VALUES (?,?,?,?,?,?)',
            (session['uid'], session['nome'], total, pagamento, valor_pago, troco))
        vid = cur.lastrowid
        for i in itens:
            conn.execute(
                'INSERT INTO itens_venda (venda_id,produto_id,codigo,nome,quantidade,preco_unit,subtotal) VALUES (?,?,?,?,?,?,?)',
                (vid, i['id'], i['codigo'], i['nome'], i['quantidade'], i['preco_unit'], i['subtotal']))
            conn.execute('UPDATE produtos SET estoque=estoque-? WHERE id=?', (i['quantidade'], i['id']))
        conn.commit()
        return jsonify({'ok': True, 'venda_id': vid, 'total': total, 'troco': troco})
    except Exception as e:
        return jsonify({'ok': False, 'msg': str(e)})
    finally:
        conn.close()


@app.route('/produtos')
@login_required
def produtos():
    q = request.args.get('q', '')
    cat = request.args.get('cat', '')
    conn = get_db()
    sql = 'SELECT * FROM produtos WHERE ativo=1'
    params = []
    if q:
        sql += ' AND (nome LIKE ? OR codigo LIKE ?)'
        params += [f'%{q}%', f'%{q}%']
    if cat:
        sql += ' AND categoria=?'
        params.append(cat)
    sql += ' ORDER BY nome'
    lista = conn.execute(sql, params).fetchall()
    cats = conn.execute("SELECT DISTINCT categoria FROM produtos WHERE ativo=1 AND categoria!='' ORDER BY categoria").fetchall()
    conn.close()
    return render_template('produtos.html', lista=lista, cats=cats, q=q, cat_sel=cat)


@app.route('/produtos/novo', methods=['GET', 'POST'])
@login_required
def novo_produto():
    if request.method == 'POST':
        codigo = request.form.get('codigo', '').strip()
        nome = request.form.get('nome', '').strip()
        categoria = request.form.get('categoria', '').strip()
        preco_custo = float(request.form.get('preco_custo', 0) or 0)
        margem = float(request.form.get('margem', 0) or 0)
        preco_venda = float(request.form.get('preco_venda', 0) or 0)
        estoque = int(request.form.get('estoque', 0) or 0)
        if not nome:
            flash('Nome do produto é obrigatório.', 'erro')
            return render_template('novo_produto.html')
        if not codigo:
            conn = get_db()
            while True:
                codigo = gerar_codigo()
                if not conn.execute('SELECT id FROM produtos WHERE codigo=?', (codigo,)).fetchone():
                    break
            conn.close()
        conn = get_db()
        try:
            conn.execute(
                'INSERT INTO produtos (codigo,nome,categoria,preco_custo,margem,preco_venda,estoque) VALUES (?,?,?,?,?,?,?)',
                (codigo, nome, categoria, preco_custo, margem, preco_venda, estoque))
            conn.commit()
            flash('Produto cadastrado com sucesso!', 'ok')
            return redirect(url_for('produtos'))
        except sqlite3.IntegrityError:
            flash('Este código já está cadastrado.', 'erro')
        finally:
            conn.close()
    return render_template('novo_produto.html')


@app.route('/produtos/editar/<int:pid>', methods=['GET', 'POST'])
@login_required
def editar_produto(pid):
    conn = get_db()
    p = conn.execute('SELECT * FROM produtos WHERE id=?', (pid,)).fetchone()
    if not p:
        conn.close()
        flash('Produto não encontrado.', 'erro')
        return redirect(url_for('produtos'))
    if request.method == 'POST':
        conn.execute(
            'UPDATE produtos SET nome=?,categoria=?,preco_custo=?,margem=?,preco_venda=?,estoque=? WHERE id=?',
            (request.form['nome'], request.form['categoria'],
             float(request.form.get('preco_custo', 0) or 0),
             float(request.form.get('margem', 0) or 0),
             float(request.form.get('preco_venda', 0) or 0),
             int(request.form.get('estoque', 0) or 0), pid))
        conn.commit()
        conn.close()
        flash('Produto atualizado!', 'ok')
        return redirect(url_for('produtos'))
    conn.close()
    return render_template('editar_produto.html', p=p)


@app.route('/produtos/excluir/<int:pid>', methods=['POST'])
@admin_required
def excluir_produto(pid):
    conn = get_db()
    conn.execute('UPDATE produtos SET ativo=0 WHERE id=?', (pid,))
    conn.commit()
    conn.close()
    flash('Produto removido.', 'ok')
    return redirect(url_for('produtos'))


@app.route('/usuarios')
@admin_required
def usuarios():
    conn = get_db()
    lista = conn.execute('SELECT * FROM usuarios WHERE ativo=1 ORDER BY nome').fetchall()
    conn.close()
    return render_template('usuarios.html', lista=lista)


@app.route('/usuarios/novo', methods=['GET', 'POST'])
@admin_required
def novo_usuario():
    if request.method == 'POST':
        usuario = request.form.get('usuario', '').strip()
        nome = request.form.get('nome', '').strip()
        senha = request.form.get('senha', '')
        perfil = request.form.get('perfil', 'vendedor')
        if not all([usuario, nome, senha]):
            flash('Preencha todos os campos.', 'erro')
            return render_template('novo_usuario.html')
        conn = get_db()
        try:
            conn.execute('INSERT INTO usuarios (usuario,senha,nome,perfil) VALUES (?,?,?,?)',
                         (usuario, generate_password_hash(senha), nome, perfil))
            conn.commit()
            flash('Usuário criado com sucesso!', 'ok')
            return redirect(url_for('usuarios'))
        except sqlite3.IntegrityError:
            flash('Este nome de usuário já existe.', 'erro')
        finally:
            conn.close()
    return render_template('novo_usuario.html')


@app.route('/usuarios/excluir/<int:uid>', methods=['POST'])
@admin_required
def excluir_usuario(uid):
    if uid == session['uid']:
        flash('Você não pode excluir seu próprio usuário.', 'erro')
        return redirect(url_for('usuarios'))
    conn = get_db()
    conn.execute('UPDATE usuarios SET ativo=0 WHERE id=?', (uid,))
    conn.commit()
    conn.close()
    flash('Usuário removido.', 'ok')
    return redirect(url_for('usuarios'))


@app.route('/usuarios/senha/<int:uid>', methods=['POST'])
@admin_required
def alterar_senha(uid):
    nova = request.form.get('nova_senha', '')
    if len(nova) < 4:
        flash('A senha deve ter pelo menos 4 caracteres.', 'erro')
        return redirect(url_for('usuarios'))
    conn = get_db()
    conn.execute('UPDATE usuarios SET senha=? WHERE id=?', (generate_password_hash(nova), uid))
    conn.commit()
    conn.close()
    flash('Senha alterada com sucesso!', 'ok')
    return redirect(url_for('usuarios'))


@app.route('/relatorios')
@admin_required
def relatorios():
    ini = request.args.get('ini', datetime.now().strftime('%Y-%m-%d'))
    fim = request.args.get('fim', datetime.now().strftime('%Y-%m-%d'))
    conn = get_db()
    vendas = conn.execute(
        "SELECT v.*, GROUP_CONCAT(i.nome||' x'||i.quantidade, ' | ') itens_str "
        "FROM vendas v LEFT JOIN itens_venda i ON v.id=i.venda_id "
        "WHERE DATE(v.criado_em) BETWEEN ? AND ? AND v.status='concluida' "
        "GROUP BY v.id ORDER BY v.criado_em DESC", (ini, fim)).fetchall()
    totais = conn.execute(
        "SELECT COUNT(*) qtd, COALESCE(SUM(total),0) val, "
        "SUM(CASE WHEN pagamento='dinheiro' THEN 1 ELSE 0 END) qtd_din, "
        "SUM(CASE WHEN pagamento='pix' THEN 1 ELSE 0 END) qtd_pix, "
        "SUM(CASE WHEN pagamento='cartao' THEN 1 ELSE 0 END) qtd_cart, "
        "COALESCE(SUM(CASE WHEN pagamento='dinheiro' THEN total ELSE 0 END),0) val_din, "
        "COALESCE(SUM(CASE WHEN pagamento='pix' THEN total ELSE 0 END),0) val_pix, "
        "COALESCE(SUM(CASE WHEN pagamento='cartao' THEN total ELSE 0 END),0) val_cart "
        "FROM vendas WHERE DATE(criado_em) BETWEEN ? AND ? AND status='concluida'",
        (ini, fim)).fetchone()
    conn.close()
    return render_template('relatorios.html', vendas=vendas, totais=totais, ini=ini, fim=fim)


if __name__ == '__main__':
    init_db()
    print('\n' + '='*52)
    print('  Jessica Thaís — Sistema PDV')
    print('='*52)
    print('  Acesse: http://localhost:5000')
    print('  Usuário: admin   |   Senha: admin123')
    print('='*52 + '\n')
    app.run(debug=True, host='0.0.0.0', port=5000)
