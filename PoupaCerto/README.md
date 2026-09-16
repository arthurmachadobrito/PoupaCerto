# 💰 PoupaCerto – Dashboard Financeiro

**PoupaCerto** é uma aplicação web de finanças pessoais que funciona como um dashboard completo para gerenciar receitas, despesas, metas e cartões de crédito. É um **PWA (Progressive Web App)**, ou seja, pode ser instalado no celular ou desktop e usado offline.

> *Seu futuro financeiro começa aqui* 🚀

---

## ✨ Funcionalidades

- 🔐 **Sistema de login/registro** — cada usuário tem seus próprios dados isolados
- 📊 **Visão Geral** — KPIs de saldo, receitas, gastos e taxa de poupança, com gráficos interativos
- 📅 **Análise Semanal** — desempenho por dia da semana, com insights automáticos
- 📆 **Análise Anual** — comparativo mensal, evolução do saldo e gastos por categoria no ano
- 💵 **Recebimentos** — cadastro e acompanhamento de entradas por categoria (salário, freelance, investimento...)
- 💸 **Gastos** — controle por categoria (mercado, pessoal, contas, trabalho, outros) com filtros
- ⚖️ **Balanço** — visão consolidada de receitas × despesas e saldo acumulado
- 📋 **Histórico** — busca de lançamentos, exportação em **CSV** e **PDF**
- 🎯 **Metas e Orçamento** — limite de gastos mensal, meta de poupança, reserva de emergência e metas por categoria
- 💳 **Cartão de Crédito** — gestão de cartões (fechamento/vencimento/limite), **compras parceladas** e **pagamentos agendados** (mensal, semanal, quinzenal, anual)
- 🌙 **Tema claro/escuro**
- 📥 **Importação de CSV** para migrar dados de outras ferramentas
- 📱 **PWA instalável** com suporte offline via Service Worker

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| **HTML5 / CSS3 / JavaScript (Vanilla)** | Estrutura, estilo e lógica da aplicação — sem frameworks |
| [Chart.js](https://www.chartjs.org/) | Gráficos interativos (linhas, barras e rosca) |
| [Google Fonts – Inter](https://fonts.google.com/specimen/Inter) | Tipografia |
| **localStorage** | Persistência de usuários, sessões e dados financeiros |
| **Service Worker + Web App Manifest** | Funcionalidade PWA (instalação e offline) |

## 📁 Estrutura do Projeto

```
├── finanças.html    # Página principal (login + dashboard + modais)
├── style.css        # Estilos (tema escuro/claro, layout responsivo)
├── app.js           # Lógica completa (auth, transações, gráficos, PWA)
├── manifest.json    # Manifesto da PWA
├── sw.js            # Service Worker (cache offline)
├── icons/           # Ícones do app (192px e 512px)
└── assets/          # Recursos estáticos
```

## 🚀 Como Executar

1. Clone ou baixe o projeto
2. Abra o arquivo `finanças.html` no navegador, **ou** sirva a pasta com um servidor local (recomendado para o PWA funcionar):

```bash
# Exemplo com Python
python -m http.server 8080

# Exemplo com Node.js
npx serve
```

3. Acesse `http://localhost:8080/finanças.html`
4. Crie uma conta ou faça login e comece a registrar seus lançamentos 💸

> 💡 Para instalar como app, abra a página em um navegador moderno e use a opção **"Instalar PoupaCerto"** que aparecerá (ou o ícone de instalação na barra de endereço).

## 📥 Formato de Importação CSV

```
data,descricao,tipo,categoria,valor
2026-06-15,Salario,salario,receita,5000
2026-06-20,Supermercado,mercado,despesa,350.90
```

## ⚠️ Observações

- Os dados são armazenados **localmente no navegador** (localStorage) — não há backend nem sincronização entre dispositivos
- Recomenda-se usar a **exportação CSV** como backup periódico dos dados
- As senhas são salvas localmente sem criptografia; trata-se de um projeto para uso pessoal/estudo

---

## 👨‍💻 Criador

Projeto desenvolvido por **Arthur Brito** 🧑‍🚀
