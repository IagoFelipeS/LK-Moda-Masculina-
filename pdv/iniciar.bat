@echo off
title Jessica Thais PDV
color 0A
echo.
echo  ============================================
echo   Jessica Thais - Sistema PDV
echo  ============================================
echo.

:: Verifica Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERRO: Python nao encontrado!
    echo  Baixe em: https://www.python.org/downloads/
    pause
    exit
)

:: Instala dependencias se necessario
if not exist "venv" (
    echo  Criando ambiente virtual...
    python -m venv venv
    echo  Instalando dependencias...
    call venv\Scripts\activate
    pip install -r requirements.txt --quiet
) else (
    call venv\Scripts\activate
)

echo  Iniciando servidor...
echo  Acesse: http://localhost:5000
echo  Usuario: admin   Senha: admin123
echo.
echo  Pressione Ctrl+C para encerrar
echo.

:: Abre o navegador automaticamente apos 2 segundos
start "" timeout /t 2 >nul && start "" "http://localhost:5000"

python app.py
pause
