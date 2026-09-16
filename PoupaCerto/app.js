/* =====================================================
   FINANCEflow – app.js v3.0 (Purple Edition)
   Personal Finance Dashboard – Complete Logic
===================================================== */

// ── CONSTANTS ────────────────────────────────────────
const USERS_KEY = 'poupacerto_users';
const SESSION_KEY = 'poupacerto_session';
const BUDGET_KEY = 'poupacerto_budget';
const CARDS_KEY_SUFFIX = '_cards';
const INSTALLMENTS_KEY_SUFFIX = '_installments';
const SCHEDULED_KEY_SUFFIX = '_scheduled';

// ── STATE ────────────────────────────────────────────
let state = {
  transactions: [],
  cards: [],
  installments: [],
  scheduledPayments: [],
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  currentYearView: new Date().getFullYear(),
  isLoggedIn: false,
  currentUser: null,
  theme: 'dark'
};

let budget = {
  expenseLimit: 3000,
  savingsGoal: 20,
  emergencyGoal: 10000,
  categoryLimits: { mercado: 800, pessoal: 500, contas: 600, trabalho: 300, outros: 200 }
};

// ── CATEGORIES ───────────────────────────────────────
const INCOME_CATS = {
  salario: { label: 'Salário', icon: '💰', color: '#10b981' },
  freelance: { label: 'Freelance', icon: '💻', color: '#06b6d4' },
  investimento: { label: 'Investimento', icon: '📈', color: '#8b5cf6' },
  outros: { label: 'Outros', icon: '➕', color: '#64748b' }
};

const EXPENSE_CATS = {
  mercado: { label: 'Mercado', icon: '🛒', color: '#f59e0b' },
  pessoal: { label: 'Pessoal', icon: '👤', color: '#ec4899' },
  contas: { label: 'Contas', icon: '📋', color: '#06b6d4' },
  trabalho: { label: 'Trabalho', icon: '💼', color: '#10b981' },
  outros: { label: 'Outros', icon: '📦', color: '#64748b' }
};

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAYS_PT = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

let charts = {};

// ══════════════════════════════════════════════════════
// ── USER DATABASE (localStorage) ─────────────────────
// ══════════════════════════════════════════════════════

function getUsers() {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getStorageKey(email) {
  return 'financeflow_data_' + email.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function loadUserData(email) {
  const key = getStorageKey(email);
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved).transactions || [] : [];
}

function saveUserData(email, transactions) {
  const key = getStorageKey(email);
  localStorage.setItem(key, JSON.stringify({ transactions }));
}

function getCardsKey(email) {
  return 'financeflow_cards_' + email.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function getInstallmentsKey(email) {
  return 'financeflow_inst_' + email.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function getScheduledKey(email) {
  return 'financeflow_sched_' + email.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function loadCards(email) {
  const data = localStorage.getItem(getCardsKey(email));
  return data ? JSON.parse(data) : [];
}

function loadInstallments(email) {
  const data = localStorage.getItem(getInstallmentsKey(email));
  return data ? JSON.parse(data) : [];
}

function loadScheduled(email) {
  const data = localStorage.getItem(getScheduledKey(email));
  return data ? JSON.parse(data) : [];
}

function saveCards() {
  if (state.currentUser) {
    localStorage.setItem(getCardsKey(state.currentUser.email), JSON.stringify(state.cards));
  }
}

function saveInstallments() {
  if (state.currentUser) {
    localStorage.setItem(getInstallmentsKey(state.currentUser.email), JSON.stringify(state.installments));
  }
}

function saveScheduled() {
  if (state.currentUser) {
    localStorage.setItem(getScheduledKey(state.currentUser.email), JSON.stringify(state.scheduledPayments));
  }
}

function saveSession(email) {
  localStorage.setItem(SESSION_KEY, email);
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function loadSession() {
  return localStorage.getItem(SESSION_KEY);
}

// ══════════════════════════════════════════════════════
// ── AUTH FUNCTIONS ───────────────────────────────────
// ══════════════════════════════════════════════════════

function showLoginForm() {
  document.getElementById('loginForm').style.display = 'flex';
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginTabBtn').classList.add('active');
  document.getElementById('registerTabBtn').classList.remove('active');
}

function showRegisterForm() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'flex';
  document.getElementById('loginTabBtn').classList.remove('active');
  document.getElementById('registerTabBtn').classList.add('active');
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const pass = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;

  if (!name || !email || !pass || !confirm) {
    showToast('Preencha todos os campos.', 'error');
    return;
  }
  if (pass.length < 6) {
    showToast('A senha deve ter no mínimo 6 caracteres.', 'error');
    return;
  }
  if (pass !== confirm) {
    showToast('As senhas não conferem.', 'error');
    return;
  }

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    showToast('Este e-mail já está cadastrado.', 'error');
    return;
  }

  users.push({ name, email, password: pass, createdAt: new Date().toISOString() });
  saveUsers(users);
  showToast('Conta criada com sucesso! Faça login.', 'success');
  document.getElementById('regName').value = '';
  document.getElementById('regEmail').value = '';
  document.getElementById('regPassword').value = '';
  document.getElementById('regConfirm').value = '';
  showLoginForm();
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass = document.getElementById('loginPassword').value;

  if (!email || !pass) {
    showToast('Preencha e-mail e senha.', 'error');
    return;
  }

  const users = getUsers();
  // Auto-register if no users exist (first run)
  if (users.length === 0) {
    const name = email.split('@')[0];
    users.push({ name, email, password: pass, createdAt: new Date().toISOString() });
    saveUsers(users);
    state.currentUser = { name, email };
  } else {
    const user = users.find(u => u.email === email && u.password === pass);
    if (!user) {
      showToast('E-mail ou senha inválidos.', 'error');
      return;
    }
    state.currentUser = { name: user.name, email: user.email };
  }

  completeLogin();
}

function completeLogin() {
  const user = state.currentUser;
  state.isLoggedIn = true;
  state.transactions = loadUserData(user.email);
  state.cards = loadCards(user.email);
  state.installments = loadInstallments(user.email);
  state.scheduledPayments = loadScheduled(user.email);
  saveSession(user.email);

  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appContainer').style.display = 'flex';

  // Avatar and name
  const initials = user.name.substring(0, 2).toUpperCase();
  document.getElementById('userAvatar').textContent = initials;
  document.getElementById('userEmailTop').textContent = user.email;

  showToast('Bem-vindo, ' + user.name.split(' ')[0] + '!', 'success');
  initDashboard();
}

function handleLogout() {
  if (!confirm('Tem certeza que deseja sair?')) return;
  state.isLoggedIn = false;
  state.currentUser = null;
  state.transactions = [];
  state.cards = [];
  state.installments = [];
  state.scheduledPayments = [];
  clearSession();
  document.getElementById('appContainer').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginPassword').value = '';
  // Destroy all charts
  Object.keys(charts).forEach(k => destroyChart(k));
}

// ══════════════════════════════════════════════════════
// ── PERSISTÊNCIA ─────────────────────────────────────
// ══════════════════════════════════════════════════════

function saveData() {
  if (state.currentUser) {
    saveUserData(state.currentUser.email, state.transactions);
  }
}

function saveBudget() {
  localStorage.setItem(BUDGET_KEY, JSON.stringify(budget));
}

function saveTheme() {
  localStorage.setItem('financeflow_theme', state.theme);
}

function loadData() {
  const savedBudget = localStorage.getItem(BUDGET_KEY);
  if (savedBudget) budget = JSON.parse(savedBudget);
  const savedTheme = localStorage.getItem('financeflow_theme');
  if (savedTheme) state.theme = savedTheme;
}

// ── FORMATTING ───────────────────────────────────────
function fmt(val) {
  return 'R$ ' + Math.abs(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtSigned(val) {
  return (val >= 0 ? '+' : '−') + ' R$ ' + Math.abs(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseDate(str) { return new Date(str + 'T12:00:00'); }

function inCurrentPeriod(tx) {
  const d = parseDate(tx.date);
  return d.getMonth() === state.currentMonth && d.getFullYear() === state.currentYear;
}

function getFiltered() { return state.transactions.filter(inCurrentPeriod); }

function getTotalIncome(list) { return list.filter(t => t.type === 'income').reduce((s,t) => s + t.value, 0); }

function getTotalExpense(list) { return list.filter(t => t.type === 'expense').reduce((s,t) => s + t.value, 0); }

function getCatColor(type, cat) { return type === 'income' ? (INCOME_CATS[cat]?.color || '#64748b') : (EXPENSE_CATS[cat]?.color || '#64748b'); }

function getCatLabel(type, cat) { return type === 'income' ? (INCOME_CATS[cat]?.label || cat) : (EXPENSE_CATS[cat]?.label || cat); }

function getCatIcon(type, cat) { return type === 'income' ? (INCOME_CATS[cat]?.icon || '📌') : (EXPENSE_CATS[cat]?.icon || '📌'); }

function formatK(v) { return Math.abs(v) >= 1000 ? (v/1000).toFixed(1) + 'k' : v.toFixed(0); }

function uuid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function destroyChart(id) { if (charts[id]) { charts[id].destroy(); delete charts[id]; } }

function groupByCat(list) { const m = {}; list.forEach(t => { m[t.category] = (m[t.category]||0) + t.value; }); return m; }

// Chart.js defaults
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.plugins.legend.display = false;
Chart.defaults.plugins.tooltip.backgroundColor = '#1e2a42';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.1)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.titleFont = { weight: '700', size: 13 };
const GRID_COLOR = 'rgba(255,255,255,0.05)';
const PURPLE = '#8b5cf6';
const PURPLE_LIGHT = '#a78bfa';
const PURPLE_GLOW = 'rgba(139,92,246,0.2)';

// ── TOAST ────────────────────────────────────────────
function showToast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast ' + (type || 'info');
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 3000);
}

// ── KPIs ─────────────────────────────────────────────
function renderKPIs(income, expense, balance, savings, filtered) {
  const saldoEl = document.getElementById('kpi-saldo-value');
  saldoEl.textContent = fmt(balance);
  saldoEl.style.color = balance >= 0 ? 'var(--green-light)' : 'var(--red-light)';
  document.getElementById('kpi-saldo-sub').textContent = fmtSigned(balance);
  document.getElementById('kpi-saldo-bar').style.width = Math.max(0, income > 0 ? Math.min(100,(balance/income)*100) : 0) + '%';
  document.getElementById('kpi-income-value').textContent = fmt(income);
  const incCount = filtered.filter(t => t.type==='income').length;
  document.getElementById('kpi-income-sub').textContent = incCount + ' lançamento' + (incCount!==1?'s':'');
  document.getElementById('kpi-expense-value').textContent = fmt(expense);
  const expCount = filtered.filter(t => t.type==='expense').length;
  document.getElementById('kpi-expense-sub').textContent = expCount + ' lançamento' + (expCount!==1?'s':'');
  document.getElementById('kpi-expense-bar').style.width = (income>0 ? Math.min(100,(expense/income)*100) : expense>0?100:0) + '%';
  const savPct = Math.round(savings*100);
  document.getElementById('kpi-savings-value').textContent = savPct + '%';
  document.getElementById('kpi-savings-bar').style.width = Math.min(100,savPct) + '%';
}

// ── UTILITÁRIOS DE GRÁFICO ────────────────────────────
function getLast6Months() {
  const result = [];
  for (let i=5; i>=0; i--) {
    let m = state.currentMonth - i, y = state.currentYear;
    while (m < 0) { m += 12; y--; }
    result.push({ month: m, year: y });
  }
  return result;
}

function sumByMonth(transactions, type, month, year) {
  return transactions
    .filter(t => { if (t.type!==type) return false; const d=parseDate(t.date); return d.getMonth()===month&&d.getFullYear()===year; })
    .reduce((s,t) => s+t.value, 0);
}

// ── GRÁFICOS VISÃO GERAL ──────────────────────────────
function renderOverviewCharts(filtered, income, expense, balance) {
  const months6 = getLast6Months();
  const inc6 = months6.map(m => sumByMonth(state.transactions,'income',m.month,m.year));
  const exp6 = months6.map(m => sumByMonth(state.transactions,'expense',m.month,m.year));

  destroyChart('incomeExpense');
  charts.incomeExpense = new Chart(document.getElementById('incomeExpenseChart'), {
    type: 'bar',
    data: {
      labels: months6.map(m => MONTHS_PT[m.month].substring(0,3)),
      datasets: [
        { label:'Receitas', data:inc6, backgroundColor:'rgba(16,185,129,0.7)', borderColor:'#10b981', borderWidth:1, borderRadius:6 },
        { label:'Gastos', data:exp6, backgroundColor:'rgba(239,68,68,0.7)', borderColor:'#ef4444', borderWidth:1, borderRadius:6 },
      ],
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      scales: { x:{grid:{color:GRID_COLOR}}, y:{grid:{color:GRID_COLOR},ticks:{callback:v=>'R$'+formatK(v)}} },
      plugins: { legend:{display:true,position:'top'} },
    },
  });

  const expByCat = groupByCat(filtered.filter(t=>t.type==='expense'));
  const dLabels=Object.keys(expByCat), dData=dLabels.map(k=>expByCat[k]), dColors=dLabels.map(k=>EXPENSE_CATS[k]?.color||'#64748b');
  destroyChart('expenseDonut');
  charts.expenseDonut = new Chart(document.getElementById('expenseDonutChart'), {
    type:'doughnut',
    data:{ labels:dLabels.map(k=>EXPENSE_CATS[k]?.label||k), datasets:[{data:dData,backgroundColor:dColors,borderWidth:2}] },
    options:{ responsive:true,maintainAspectRatio:false,cutout:'68%' },
  });
  document.getElementById('donutLegend').innerHTML = dLabels.length===0
    ? '<span style="color:var(--text-muted);font-size:12px">Sem dados</span>'
    : dLabels.map((k,i)=>`<div class="donut-legend-item"><div class="donut-legend-dot" style="background:${dColors[i]}"></div><span>${EXPENSE_CATS[k]?.label||k}</span></div>`).join('');

  const bal6 = months6.map((_,i)=>{ let c=0; for(let j=0;j<=i;j++){c+=inc6[j]-exp6[j];} return c; });
  destroyChart('balanceEvolution');
  const ctx3=document.getElementById('balanceEvolutionChart').getContext('2d');
  const g3=ctx3.createLinearGradient(0,0,0,240);
  g3.addColorStop(0,'rgba(139,92,246,0.3)');
  g3.addColorStop(1,'rgba(139,92,246,0)');
  charts.balanceEvolution = new Chart(ctx3, {
    type:'line',
    data:{ labels:months6.map(m=>MONTHS_PT[m.month].substring(0,3)), datasets:[{label:'Saldo',data:bal6,borderColor:PURPLE,backgroundColor:g3,borderWidth:2.5,fill:true,tension:0.4}] },
    options:{ responsive:true,maintainAspectRatio:false, scales:{x:{grid:{color:GRID_COLOR}},y:{grid:{color:GRID_COLOR},ticks:{callback:v=>'R$'+formatK(v)}}} },
  });

  destroyChart('categoryBar');
  charts.categoryBar = new Chart(document.getElementById('categoryBarChart'), {
    type:'bar',
    data:{ labels:Object.values(EXPENSE_CATS).map(c=>c.label), datasets:[{label:'Gasto',data:Object.keys(EXPENSE_CATS).map(k=>filtered.filter(t=>t.type==='expense'&&t.category===k).reduce((s,t)=>s+t.value,0)),backgroundColor:Object.values(EXPENSE_CATS).map(c=>c.color+'cc'),borderRadius:6}] },
    options:{ indexAxis:'y',responsive:true,maintainAspectRatio:false, scales:{x:{grid:{color:GRID_COLOR},ticks:{callback:v=>'R$'+formatK(v)}},y:{grid:{color:'transparent'}}}} },
  );
}

// ══════════════════════════════════════════════════════
// ── NAVEGAÇÃO ─────────────────────────────────────────
// ══════════════════════════════════════════════════════
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const tab = document.getElementById('tab-' + tabId);
  if (tab) tab.classList.add('active');
  const nav = document.querySelector('[data-tab="' + tabId + '"]');
  if (nav) nav.classList.add('active');
  const titles = {
    overview: 'Visão Geral', weekly: 'Análise Semanal', annual: 'Análise Anual',
    income: 'Recebimentos', expenses: 'Gastos', balance: 'Balanço',
    history: 'Histórico', budget: 'Metas', card: 'Cartão'
  };
  document.getElementById('topbarTitle').textContent = titles[tabId] || tabId;
  renderTab(tabId);
  // Close sidebar on mobile after navigation
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
  }
}

function renderTab(tabId) {
  const filtered = getFiltered();
  const income = getTotalIncome(filtered);
  const expense = getTotalExpense(filtered);
  const balance = income - expense;
  const savings = income > 0 ? (balance / income) : 0;
  switch (tabId) {
    case 'overview': renderKPIs(income, expense, balance, savings, filtered); renderOverviewCharts(filtered, income, expense, balance); break;
    case 'weekly': renderWeekly(filtered); break;
    case 'annual': renderAnnual(); break;
    case 'income': renderIncome(filtered); break;
    case 'expenses': renderExpenses(filtered); break;
    case 'balance': renderBalance(filtered, income, expense, balance); break;
    case 'history': renderHistory(); break;
    case 'budget': renderBudget(filtered, income, expense); break;
    case 'card': renderCardTab(); break;
  }
}

// ══════════════════════════════════════════════════════
// ── ANÁLISE SEMANAL (Mês corrente) ───────────────────
// ══════════════════════════════════════════════════════

/** Retorna as semanas de um mês: array de { weekIndex, start, end } */
function getWeeksOfMonth(month, year) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const weeks = [];
  let cursor = new Date(firstDay);
  let idx = 1;
  while (cursor <= lastDay) {
    const start = new Date(cursor);
    const end = new Date(cursor);
    end.setDate(end.getDate() + 6);
    // Clamp end to last day of month
    if (end > lastDay) {
      weeks.push({ weekIndex: idx, start, end: new Date(lastDay) });
      break;
    }
    weeks.push({ weekIndex: idx, start, end });
    cursor.setDate(cursor.getDate() + 7);
    idx++;
    // Safety: if cursor jumped past last day, push final partial week
    if (cursor <= lastDay && cursor.getDate() <= start.getDate() && idx > 5) break;
  }
  // Ensure last week is captured if month ends mid-week
  const lastStart = new Date(year, month, lastDay.getDate() - lastDay.getDay());
  if (!weeks.length || weeks[weeks.length - 1].end < lastDay) {
    const start = weeks.length ? new Date(weeks[weeks.length - 1].end) : new Date(firstDay);
    start.setDate(start.getDate() + 1);
    if (start <= lastDay) {
      weeks.push({ weekIndex: weeks.length + 1, start, end: new Date(lastDay) });
    }
  }
  return weeks;
}

function getMonthWeekTransactions(transactions, weekIndex, month, year) {
  const weeks = getWeeksOfMonth(month, year);
  const w = weeks.find(w => w.weekIndex === weekIndex);
  if (!w) return [];
  return transactions.filter(t => {
    const d = parseDate(t.date);
    return d >= w.start && d <= w.end && d.getMonth() === month && d.getFullYear() === year;
  });
}

function getDayTotals(transactions, type) {
  const days = [0,0,0,0,0,0,0];
  transactions.filter(t=>t.type===type).forEach(t => {
    const d = parseDate(t.date);
    days[d.getDay()] += t.value;
  });
  return days;
}

function renderWeekly(filtered) {
  const weekSelect = document.getElementById('weekSelect');
  const month = state.currentMonth;
  const year = state.currentYear;
  const weeks = getWeeksOfMonth(month, year);

  // Dynamically populate week select with correct number of weeks
  const currentVal = weekSelect.value;
  weekSelect.innerHTML = weeks.map((w, i) =>
    `<option value="${w.weekIndex}">Semana ${i + 1}</option>`
  ).join('');
  // Restore selection or pick first
  let selected = parseInt(currentVal);
  if (!weeks.find(w => w.weekIndex === selected)) selected = weeks[0]?.weekIndex || 1;
  weekSelect.value = selected;

  const weekInfo = weeks.find(w => w.weekIndex === selected) || weeks[0];
  const fmtD = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  document.getElementById('weekRangeLabel').textContent =
    weekInfo ? fmtD(weekInfo.start) + ' — ' + fmtD(weekInfo.end) : '—';

  const weekTxs = getMonthWeekTransactions(state.transactions, selected, month, year);
  const weekIncome = getTotalIncome(weekTxs);
  const weekExpense = getTotalExpense(weekTxs);
  const weekBalance = weekIncome - weekExpense;

  // KPIs
  document.getElementById('weekly-expense').textContent = fmt(weekExpense);
  document.getElementById('weekly-expense-count').textContent = weekTxs.filter(t=>t.type==='expense').length + ' transações';
  document.getElementById('weekly-income').textContent = fmt(weekIncome);
  document.getElementById('weekly-income-count').textContent = weekTxs.filter(t=>t.type==='income').length + ' transações';
  document.getElementById('weekly-balance').textContent = fmt(weekBalance);
  document.getElementById('weekly-balance-diff').textContent = fmtSigned(weekBalance);

  // Insights
  const insights = document.getElementById('weeklyInsights');
  const catExp = groupByCat(weekTxs.filter(t=>t.type==='expense'));
  const topCat = Object.keys(catExp).sort((a,b)=>catExp[b]-catExp[a])[0];
  const topInc = weekTxs.filter(t=>t.type==='income').sort((a,b)=>b.value-a.value)[0];
  insights.innerHTML = '';
  const cards = [
    { emoji: '🔥', title: 'Maior Gasto', value: Object.keys(catExp).length ? fmt(Math.max(...Object.values(catExp))) : 'R$ 0,00', desc: topCat ? 'Categoria: ' + getCatLabel('expense', topCat) : 'Sem gastos' },
    { emoji: '💰', title: 'Maior Receita', value: topInc ? fmt(topInc.value) : 'R$ 0,00', desc: topInc ? getCatLabel('income', topInc.category) : 'Sem receitas' },
    { emoji: '📊', title: 'Transações', value: weekTxs.length.toString(), desc: weekTxs.length === 1 ? '1 lançamento' : weekTxs.length + ' lançamentos' }
  ];
  cards.forEach(c => {
    insights.innerHTML += `<div class="insight-card"><div class="insight-emoji">${c.emoji}</div><div class="insight-title">${c.title}</div><div class="insight-value">${c.value}</div><div class="insight-desc">${c.desc}</div></div>`;
  });

  // Chart: Receitas vs Gastos por dia da semana
  const expDays = getDayTotals(weekTxs, 'expense');
  const incDays = getDayTotals(weekTxs, 'income');
  destroyChart('weeklyDay');
  charts.weeklyDay = new Chart(document.getElementById('weeklyDayChart'), {
    type:'bar',
    data:{
      labels:DAYS_PT,
      datasets:[
        {label:'Receitas', data:incDays, backgroundColor:'rgba(16,185,129,0.7)', borderRadius:6},
        {label:'Gastos', data:expDays, backgroundColor:'rgba(239,68,68,0.7)', borderRadius:6}
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      scales:{y:{grid:{color:GRID_COLOR},ticks:{callback:v=>'R$'+formatK(v)}},x:{grid:{color:'transparent'}}},
      plugins:{legend:{display:true,position:'top'}}
    }
  });

  // Chart: Categoria de Gastos donut
  const expCat = groupByCat(weekTxs.filter(t=>t.type==='expense'));
  const expKeys = Object.keys(expCat);
  const expVals = expKeys.map(k=>expCat[k]);
  const expColors = expKeys.map(k=>EXPENSE_CATS[k]?.color||'#64748b');
  destroyChart('weeklyCatDonut');
  charts.weeklyCatDonut = new Chart(document.getElementById('weeklyCatDonut'), {
    type:'doughnut',
    data:{ labels:expKeys.map(k=>EXPENSE_CATS[k]?.label||k), datasets:[{data:expVals,backgroundColor:expColors,borderWidth:2}] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'68%', plugins:{legend:{display:false}} }
  });
  document.getElementById('weeklyCatLegend').innerHTML = expKeys.length===0
    ? '<span style="color:var(--text-muted);font-size:12px">Sem gastos</span>'
    : expKeys.map((k,i)=>`<div class="donut-legend-item"><div class="donut-legend-dot" style="background:${expColors[i]}"></div><span>${EXPENSE_CATS[k]?.label||k}</span></div>`).join('');

  // Chart: Categoria de Receitas donut
  const incCat = groupByCat(weekTxs.filter(t=>t.type==='income'));
  const incKeys = Object.keys(incCat);
  const incVals = incKeys.map(k=>incCat[k]);
  const incColors = incKeys.map(k=>INCOME_CATS[k]?.color||'#64748b');
  destroyChart('weeklyIncDonut');
  charts.weeklyIncDonut = new Chart(document.getElementById('weeklyIncDonut'), {
    type:'doughnut',
    data:{ labels:incKeys.map(k=>INCOME_CATS[k]?.label||k), datasets:[{data:incVals,backgroundColor:incColors,borderWidth:2}] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'68%', plugins:{legend:{display:false}} }
  });
  document.getElementById('weeklyIncLegend').innerHTML = incKeys.length===0
    ? '<span style="color:var(--text-muted);font-size:12px">Sem receitas</span>'
    : incKeys.map((k,i)=>`<div class="donut-legend-item"><div class="donut-legend-dot" style="background:${incColors[i]}"></div><span>${INCOME_CATS[k]?.label||k}</span></div>`).join('');

  // Table: Transações da semana
  const tbody = document.getElementById('weeklyTableBody');
  const sorted = [...weekTxs].sort((a,b)=>b.date.localeCompare(a.date));
  if (!sorted.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="5">Nenhuma transação nesta semana.</td></tr>';
  } else {
    tbody.innerHTML = sorted.map(t => `
      <tr>
        <td>${t.date}</td>
        <td>${t.description}${t.note ? '<br><small style="color:var(--text-muted)">' + t.note + '</small>' : ''}</td>
        <td><span class="type-badge ${t.type}">${t.type==='income'?'Receita':'Despesa'}</span></td>
        <td><span class="cat-badge">${getCatIcon(t.type, t.category)} ${getCatLabel(t.type, t.category)}</span></td>
        <td class="${t.type==='income'?'value-positive':'value-negative'}">${t.type==='income'?'':'- '}${fmt(t.value)}</td>
      </tr>
    `).join('');
  }
}

// ══════════════════════════════════════════════════════
// ── ANÁLISE ANUAL ────────────────────────────────────
// ══════════════════════════════════════════════════════
function getYearTransactions(year) {
  return state.transactions.filter(t => parseDate(t.date).getFullYear() === year);
}

function renderAnnual() {
  const year = state.currentYearView;
  document.getElementById('yearLabel').textContent = year;
  const yearTxs = getYearTransactions(year);
  const yearIncome = getTotalIncome(yearTxs);
  const yearExpense = getTotalExpense(yearTxs);
  const yearBalance = yearIncome - yearExpense;
  const yearSavings = yearIncome > 0 ? (yearBalance / yearIncome) : 0;

  document.getElementById('annual-balance').textContent = fmt(yearBalance);
  document.getElementById('annual-balance-sub').textContent = yearBalance >= 0 ? 'Superávit' : 'Déficit';
  document.getElementById('annual-income').textContent = fmt(yearIncome);
  document.getElementById('annual-income-count').textContent = yearTxs.filter(t=>t.type==='income').length + ' recebimentos';
  document.getElementById('annual-expense').textContent = fmt(yearExpense);
  document.getElementById('annual-expense-count').textContent = yearTxs.filter(t=>t.type==='expense').length + ' gastos';
  document.getElementById('annual-savings').textContent = Math.round(yearSavings * 100) + '%';

  // Monthly compare
  const mInc = MONTHS_PT.map((_,i) => sumByMonth(yearTxs, 'income', i, year));
  const mExp = MONTHS_PT.map((_,i) => sumByMonth(yearTxs, 'expense', i, year));
  destroyChart('annualCompare');
  charts.annualCompare = new Chart(document.getElementById('annualCompareChart'), {
    type:'bar',
    data:{ labels:MONTHS_PT.map(m=>m.substring(0,3)), datasets:[
      {label:'Receitas',data:mInc,backgroundColor:'rgba(16,185,129,0.7)',borderRadius:6},
      {label:'Gastos',data:mExp,backgroundColor:'rgba(239,68,68,0.7)',borderRadius:6}
    ]},
    options:{ responsive:true,maintainAspectRatio:false,scales:{y:{grid:{color:GRID_COLOR},ticks:{callback:v=>'R$'+formatK(v)}},x:{grid:{color:'transparent'}}},plugins:{legend:{display:true,position:'top'}} }
  });

  // Balance evolution
  let balAcc = 0;
  const balData = mInc.map((inc,i)=>{ balAcc += inc - mExp[i]; return balAcc; });
  destroyChart('annualBalance');
  const ctxAB = document.getElementById('annualBalanceChart').getContext('2d');
  const gradAB = ctxAB.createLinearGradient(0,0,0,240);
  gradAB.addColorStop(0,'rgba(139,92,246,0.3)');
  gradAB.addColorStop(1,'rgba(139,92,246,0)');
  charts.annualBalance = new Chart(ctxAB, {
    type:'line',
    data:{ labels:MONTHS_PT.map(m=>m.substring(0,3)), datasets:[{label:'Saldo',data:balData,borderColor:PURPLE,backgroundColor:gradAB,borderWidth:2.5,fill:true,tension:0.4}] },
    options:{ responsive:true,maintainAspectRatio:false,scales:{y:{grid:{color:GRID_COLOR},ticks:{callback:v=>'R$'+formatK(v)}},x:{grid:{color:'transparent'}}} }
  });

  // Category donut
  const yearExpByCat = groupByCat(yearTxs.filter(t=>t.type==='expense'));
  const catLabels = Object.keys(yearExpByCat);
  const catData = catLabels.map(k=>yearExpByCat[k]);
  const catColors = catLabels.map(k=>EXPENSE_CATS[k]?.color||'#64748b');
  destroyChart('annualCategory');
  charts.annualCategory = new Chart(document.getElementById('annualCategoryChart'), {
    type:'doughnut',
    data:{ labels:catLabels.map(k=>EXPENSE_CATS[k]?.label||k), datasets:[{data:catData,backgroundColor:catColors,borderWidth:2}] },
    options:{ responsive:true,maintainAspectRatio:false,cutout:'68%' }
  });
  document.getElementById('annualCatLegend').innerHTML = catLabels.length===0
    ? '<span style="color:var(--text-muted);font-size:12px">Sem dados</span>'
    : catLabels.map((k,i)=>`<div class="donut-legend-item"><div class="donut-legend-dot" style="background:${catColors[i]}"></div><span>${EXPENSE_CATS[k]?.label||k}</span></div>`).join('');

  // Insights
  const insights = document.getElementById('annualInsights');
  const bestMonth = balData.indexOf(Math.max(...balData));
  const worstMonth = balData.indexOf(Math.min(...balData));
  insights.innerHTML = '';
  const cards = [
    { emoji: '📊', title: 'Total de Transações', value: yearTxs.length.toString(), desc: 'no ano' },
    { emoji: '📈', title: 'Melhor Mês', value: MONTHS_PT[bestMonth], desc: 'Maior saldo do ano' },
    { emoji: '📉', title: 'Pior Mês', value: balData[worstMonth] < 0 ? MONTHS_PT[worstMonth] : 'Nenhum', desc: balData[worstMonth] < 0 ? 'Saldo negativo' : 'Todos os meses positivos' }
  ];
  cards.forEach(c => {
    insights.innerHTML += `<div class="insight-card"><div class="insight-emoji">${c.emoji}</div><div class="insight-title">${c.title}</div><div class="insight-value">${c.value}</div><div class="insight-desc">${c.desc}</div></div>`;
  });
}

// ══════════════════════════════════════════════════════
// ── RECEBIMENTOS ─────────────────────────────────────
// ══════════════════════════════════════════════════════
function renderIncome(filtered) {
  const incTxs = filtered.filter(t=>t.type==='income');
  const total = getTotalIncome(incTxs);
  const max = incTxs.length ? Math.max(...incTxs.map(t=>t.value)) : 0;
  const maxTx = incTxs.find(t=>t.value===max);
  document.getElementById('income-total').textContent = fmt(total);
  document.getElementById('income-count').textContent = incTxs.length + ' lançamento' + (incTxs.length!==1?'s':'');
  document.getElementById('income-max').textContent = fmt(max);
  document.getElementById('income-max-label').textContent = maxTx ? maxTx.description : '—';

  const incByCat = groupByCat(incTxs);
  const cats = Object.keys(incByCat);
  const data = cats.map(k=>incByCat[k]);
  const colors = cats.map(k=>INCOME_CATS[k]?.color||'#64748b');
  destroyChart('incomeCategory');
  charts.incomeCategory = new Chart(document.getElementById('incomeCategoryChart'), {
    type:'doughnut',
    data:{ labels:cats.map(k=>INCOME_CATS[k]?.label||k), datasets:[{data,backgroundColor:colors,borderWidth:2}] },
    options:{ responsive:true,maintainAspectRatio:false,cutout:'68%' }
  });

  const sorted = [...incTxs].sort((a,b)=>parseDate(a.date)-parseDate(b.date));
  destroyChart('incomeHistory');
  charts.incomeHistory = new Chart(document.getElementById('incomeHistoryChart'), {
    type:'line',
    data:{ labels:sorted.map(t=>t.date.substring(5)), datasets:[{label:'Entradas',data:sorted.map(t=>t.value),borderColor:'#10b981',backgroundColor:'rgba(16,185,129,0.1)',borderWidth:2.5,fill:true,tension:0.4}] },
    options:{ responsive:true,maintainAspectRatio:false,scales:{y:{grid:{color:GRID_COLOR}},x:{grid:{color:'transparent'}}} }
  });

  const tbody = document.getElementById('incomeTableBody');
  if (!incTxs.length) { tbody.innerHTML = '<tr class="empty-row"><td colspan="5">Nenhum recebimento cadastrado.</td></tr>'; return; }
  tbody.innerHTML = incTxs.sort((a,b)=>b.date.localeCompare(a.date)).map(t => `
    <tr>
      <td>${t.date}</td>
      <td>${t.description}${t.note ? '<br><small style="color:var(--text-muted)">' + t.note + '</small>' : ''}</td>
      <td><span class="cat-badge">${getCatIcon('income', t.category)} ${getCatLabel('income', t.category)}</span></td>
      <td class="value-positive">${fmt(t.value)}</td>
      <td><button class="btn-delete" onclick="deleteTransaction('${t.id}')" title="Excluir">✕</button></td>
    </tr>
  `).join('');
}

// ══════════════════════════════════════════════════════
// ── GASTOS ───────────────────────────────────────────
// ══════════════════════════════════════════════════════
function renderExpenses(filtered) {
  const expTxs = filtered.filter(t=>t.type==='expense');
  const filterCat = document.getElementById('filterCategory').value;
  const filteredExp = filterCat ? expTxs.filter(t=>t.category===filterCat) : expTxs;

  const byCat = groupByCat(expTxs);
  Object.keys(EXPENSE_CATS).forEach(k => {
    const el = document.getElementById('exp-' + k);
    if (el) el.textContent = fmt(byCat[k] || 0);
  });

  destroyChart('expCategoryDonut');
  const catLabels = Object.keys(EXPENSE_CATS);
  const catData = catLabels.map(k => byCat[k] || 0);
  const catColors = catLabels.map(k => EXPENSE_CATS[k].color);
  charts.expCategoryDonut = new Chart(document.getElementById('expCategoryDonut'), {
    type:'doughnut',
    data:{ labels:catLabels.map(k=>EXPENSE_CATS[k].label), datasets:[{data:catData,backgroundColor:catColors,borderWidth:2}] },
    options:{ responsive:true,maintainAspectRatio:false,cutout:'68%' }
  });

  const sorted = [...expTxs].sort((a,b)=>parseDate(a.date)-parseDate(b.date));
  destroyChart('expEvolution');
  charts.expEvolution = new Chart(document.getElementById('expEvolutionChart'), {
    type:'line',
    data:{ labels:sorted.map(t=>t.date.substring(5)), datasets:[{label:'Gastos',data:sorted.map(t=>t.value),borderColor:'#ef4444',backgroundColor:'rgba(239,68,68,0.1)',borderWidth:2.5,fill:true,tension:0.4}] },
    options:{ responsive:true,maintainAspectRatio:false,scales:{y:{grid:{color:GRID_COLOR}},x:{grid:{color:'transparent'}}} }
  });

  const tbody = document.getElementById('expenseTableBody');
  if (!filteredExp.length) { tbody.innerHTML = '<tr class="empty-row"><td colspan="5">Nenhum gasto cadastrado.</td></tr>'; return; }
  tbody.innerHTML = filteredExp.sort((a,b)=>b.date.localeCompare(a.date)).map(t => `
    <tr>
      <td>${t.date}</td>
      <td>${t.description}${t.note ? '<br><small style="color:var(--text-muted)">' + t.note + '</small>' : ''}</td>
      <td><span class="cat-badge">${getCatIcon('expense', t.category)} ${getCatLabel('expense', t.category)}</span></td>
      <td class="value-negative">${fmt(t.value)}</td>
      <td><button class="btn-delete" onclick="deleteTransaction('${t.id}')" title="Excluir">✕</button></td>
    </tr>
  `).join('');
}

// ══════════════════════════════════════════════════════
// ── BALANÇO ──────────────────────────────────────────
// ══════════════════════════════════════════════════════
function renderBalance(filtered, income, expense, balance) {
  document.getElementById('bal-income').textContent = fmt(income);
  document.getElementById('bal-expense').textContent = fmt(expense);
  const saldoEl = document.getElementById('bal-saldo');
  saldoEl.textContent = fmt(balance);
  saldoEl.style.color = balance >= 0 ? 'var(--green-light)' : 'var(--red-light)';

  const months6 = getLast6Months();
  const inc6 = months6.map(m => sumByMonth(state.transactions,'income',m.month,m.year));
  const exp6 = months6.map(m => sumByMonth(state.transactions,'expense',m.month,m.year));
  const labels = months6.map(m => MONTHS_PT[m.month].substring(0,3));

  destroyChart('balanceBar');
  charts.balanceBar = new Chart(document.getElementById('balanceBarChart'), {
    type:'bar',
    data:{ labels, datasets:[
      {label:'Receitas',data:inc6,backgroundColor:'rgba(16,185,129,0.7)',borderRadius:6},
      {label:'Despesas',data:exp6,backgroundColor:'rgba(239,68,68,0.7)',borderRadius:6}
    ]},
    options:{ responsive:true,maintainAspectRatio:false,scales:{y:{grid:{color:GRID_COLOR},ticks:{callback:v=>'R$'+formatK(v)}},x:{grid:{color:'transparent'}}},plugins:{legend:{display:true,position:'top'}} }
  });

  destroyChart('balancePie');
  charts.balancePie = new Chart(document.getElementById('balancePieChart'), {
    type:'doughnut',
    data:{ labels:['Receitas','Despesas'], datasets:[{data:[income,expense],backgroundColor:['#10b981','#ef4444'],borderWidth:2}] },
    options:{ responsive:true,maintainAspectRatio:false,cutout:'68%' }
  });

  // Cumulative
  let cum = 0;
  const cumData = months6.map((m,i)=>{ cum += inc6[i] - exp6[i]; return cum; });
  destroyChart('cumulativeBalance');
  const ctxCB = document.getElementById('cumulativeBalanceChart').getContext('2d');
  const gradCB = ctxCB.createLinearGradient(0,0,0,300);
  gradCB.addColorStop(0,'rgba(139,92,246,0.3)');
  gradCB.addColorStop(1,'rgba(139,92,246,0)');
  charts.cumulativeBalance = new Chart(ctxCB, {
    type:'line',
    data:{ labels, datasets:[{label:'Saldo Acumulado',data:cumData,borderColor:PURPLE,backgroundColor:gradCB,borderWidth:2.5,fill:true,tension:0.4}] },
    options:{ responsive:true,maintainAspectRatio:false,scales:{y:{grid:{color:GRID_COLOR},ticks:{callback:v=>'R$'+formatK(v)}},x:{grid:{color:'transparent'}}} }
  });

  // Insights
  const insights = document.getElementById('insightCards');
  const savings = income > 0 ? ((income - expense) / income * 100) : 0;
  const avgExpense = expense > 0 && filtered.filter(t=>t.type==='expense').length ? expense / filtered.filter(t=>t.type==='expense').length : 0;
  insights.innerHTML = [
    { emoji: '📊', title: 'Taxa de Poupança', value: Math.round(savings) + '%', desc: savings >= 20 ? 'Dentro da meta! 🎉' : 'Abaixo da meta de 20%' },
    { emoji: '💸', title: 'Gasto Médio', value: fmt(avgExpense), desc: 'por transação' },
    { emoji: balance >= 0 ? '✅' : '⚠️', title: 'Situação', value: balance >= 0 ? 'Positiva' : 'Negativa', desc: balance >= 0 ? 'Receitas cobrem despesas' : 'Despesas superam receitas' }
  ].map(c => `<div class="insight-card"><div class="insight-emoji">${c.emoji}</div><div class="insight-title">${c.title}</div><div class="insight-value">${c.value}</div><div class="insight-desc">${c.desc}</div></div>`).join('');
}

// ══════════════════════════════════════════════════════
// ── HISTÓRICO ────────────────────────────────────────
// ══════════════════════════════════════════════════════
function renderHistory() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  let list = state.transactions;
  if (q) list = list.filter(t => t.description.toLowerCase().includes(q) || (t.note||'').toLowerCase().includes(q));
  list = [...list].sort((a,b) => b.date.localeCompare(a.date));

  const tbody = document.getElementById('historyTableBody');
  if (!list.length) { tbody.innerHTML = '<tr class="empty-row"><td colspan="6">Nenhum lançamento encontrado.</td></tr>'; return; }
  tbody.innerHTML = list.map(t => `
    <tr>
      <td>${t.date}</td>
      <td>${t.description}${t.note ? '<br><small style="color:var(--text-muted)">' + t.note + '</small>' : ''}</td>
      <td><span class="type-badge ${t.type}">${t.type==='income'?'Receita':'Despesa'}</span></td>
      <td><span class="cat-badge">${getCatIcon(t.type, t.category)} ${getCatLabel(t.type, t.category)}</span></td>
      <td class="${t.type==='income'?'value-positive':'value-negative'}">${t.type==='income'?'':'- '}${fmt(t.value)}</td>
      <td><button class="btn-delete" onclick="deleteTransaction('${t.id}')" title="Excluir">✕</button></td>
    </tr>
  `).join('');
}

// ══════════════════════════════════════════════════════
// ── METAS ────────────────────────────────────────────
// ══════════════════════════════════════════════════════
function renderBudget(filtered, income, expense) {
  document.getElementById('budgetExpenseLimit').value = budget.expenseLimit;
  document.getElementById('budgetSavingsGoal').value = budget.savingsGoal;
  document.getElementById('budgetExpenseUsed').textContent = 'Usado: ' + fmt(expense) + ' de ' + fmt(budget.expenseLimit);
  const pctUsed = budget.expenseLimit > 0 ? Math.min(100, (expense/budget.expenseLimit)*100) : 0;
  document.getElementById('budgetExpenseBar').style.width = pctUsed + '%';

  const savings = income > 0 ? ((income - expense) / income * 100) : 0;
  document.getElementById('budgetSavingsCurrent').textContent = 'Atual: ' + Math.round(savings) + '%';
  document.getElementById('budgetSavingsBar').style.width = Math.min(100, savings) + '%';

  const balance = income - expense;
  const emergency = Math.max(0, balance);
  document.getElementById('emergencyReserve').textContent = fmt(emergency);
  document.getElementById('emergencyGoal').textContent = 'Meta: ' + fmt(budget.emergencyGoal);
  document.getElementById('emergencyBar').style.width = budget.emergencyGoal > 0 ? Math.min(100, (emergency/budget.emergencyGoal)*100) + '%' : '0%';

  // Category limits
  const expByCat = groupByCat(filtered.filter(t=>t.type==='expense'));
  const catList = document.getElementById('budgetCatList');
  catList.innerHTML = Object.keys(EXPENSE_CATS).map(k => `
    <div class="budget-cat-item">
      <span>${EXPENSE_CATS[k].icon} ${EXPENSE_CATS[k].label}:</span>
      <input type="number" class="budget-input cat-limit-input" data-cat="${k}" value="${budget.categoryLimits[k]||0}" min="0" step="10" />
      <span class="budget-label">/mês</span>
      <span style="font-size:12px;color:${(expByCat[k]||0) > (budget.categoryLimits[k]||999999) ? 'var(--red-light)' : 'var(--text-muted)'}">
        (${fmt(expByCat[k]||0)})
      </span>
    </div>
  `).join('');

  // Progress chart
  const catKeys = Object.keys(EXPENSE_CATS);
  const spent = catKeys.map(k => expByCat[k] || 0);
  const limits = catKeys.map(k => budget.categoryLimits[k] || 1);
  destroyChart('budgetProgress');
  charts.budgetProgress = new Chart(document.getElementById('budgetProgressChart'), {
    type:'bar',
    data:{ labels:catKeys.map(k=>EXPENSE_CATS[k].label), datasets:[
      {label:'Gasto',data:spent,backgroundColor:'rgba(239,68,68,0.7)',borderRadius:6},
      {label:'Meta',data:limits,backgroundColor:'rgba(139,92,246,0.5)',borderRadius:6,type:'line',borderColor:PURPLE,borderWidth:2,pointRadius:4}
    ]},
    options:{ responsive:true,maintainAspectRatio:false,scales:{y:{grid:{color:GRID_COLOR},ticks:{callback:v=>'R$'+formatK(v)}},x:{grid:{color:'transparent'}}},plugins:{legend:{display:true,position:'top'}} }
  });
}

// ══════════════════════════════════════════════════════
// ── CARTÃO / PARCELAS / AGENDAMENTOS ─────────────────
// ══════════════════════════════════════════════════════

/* ── Utilitários ──────────────────────────────────── */
function getCardById(id) {
  return state.cards.find(c => c.id === id);
}

function getCardSpending(cardId, month, year) {
  return state.transactions
    .filter(t => t.cardId === cardId && t.type === 'expense')
    .filter(t => {
      const d = parseDate(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((s, t) => s + t.value, 0);
}

function getCardInstallmentsTotal(cardId, month, year) {
  return state.transactions
    .filter(t => t.cardId === cardId && t.type === 'expense' && t.installmentGroup)
    .filter(t => {
      const d = parseDate(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((s, t) => s + t.value, 0);
}

function getNextBillingDate(card) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  // This month's closing
  const closing = new Date(currentYear, currentMonth, card.closingDay);
  if (now > closing) {
    // Next month's closing
    closing.setMonth(closing.getMonth() + 1);
  }
  const due = new Date(closing.getFullYear(), closing.getMonth(), card.dueDay);
  return { closing, due };
}

function getInstallmentStatus(inst) {
  const paid = state.transactions.filter(t => t.installmentGroup === inst.id).length;
  const total = inst.totalInstallments;
  return { paid, total, remaining: total - paid };
}

function getScheduledNextDate(sched) {
  const start = parseDate(sched.startDate);
  const now = new Date();
  if (start > now) return start;
  
  // Find the next occurrence after now
  let d = new Date(start);
  let iterations = 0;
  const maxIter = 120; // safety
  
  while (d <= now && iterations < maxIter) {
    iterations++;
    switch (sched.frequency) {
      case 'weekly': d.setDate(d.getDate() + 7); break;
      case 'biweekly': d.setDate(d.getDate() + 14); break;
      case 'monthly': d.setMonth(d.getMonth() + 1); break;
      case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
    }
  }
  
  // Check if past end date
  if (sched.endDate && d > parseDate(sched.endDate)) return null;
  return d;
}

function deleteCardTransactions(cardId) {
  // We just delete the card, but keep transactions
  state.cards = state.cards.filter(c => c.id !== cardId);
  // Unlink transactions from deleted card
  state.transactions.forEach(t => {
    if (t.cardId === cardId) {
      delete t.cardId;
    }
  });
  saveCards();
  saveData();
}

function deleteInstallmentTransactions(instId) {
  state.installments = state.installments.filter(i => i.id !== instId);
  // Remove all transactions belonging to this installment group
  state.transactions = state.transactions.filter(t => t.installmentGroup !== instId);
  saveInstallments();
  saveData();
}

/* ── Render Tab Principal ─────────────────────────── */
function renderCardTab() {
  renderCards();
  renderInstallments();
  renderScheduledPayments();
}

/* ── CARTÕES ──────────────────────────────────────── */
function renderCards() {
  const grid = document.getElementById('cardsGrid');
  
  if (!state.cards.length) {
    grid.innerHTML = `
      <div class="cards-empty">
        <span class="cards-empty-icon">💳</span>
        <div class="cards-empty-text">Nenhum cartão cadastrado</div>
        <p style="font-size:13px;margin-bottom:16px">Adicione seus cartões para controlar a fatura e os gastos.</p>
        <button class="btn-primary" onclick="openCardModal()">+ Adicionar Cartão</button>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = state.cards.map(card => {
    const spending = getCardSpending(card.id, state.currentMonth, state.currentYear);
    const instTotal = getCardInstallmentsTotal(card.id, state.currentMonth, state.currentYear);
    const totalBill = spending + instTotal;
    const usagePct = card.limit > 0 ? Math.min(100, (totalBill / card.limit) * 100) : 0;
    const dates = getNextBillingDate(card);
    const fmtDate = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    
    let barClass = 'credit-card-progress-fill';
    if (usagePct > 80) barClass += ' danger';
    else if (usagePct > 60) barClass += ' warning';
    
    return `
      <div class="credit-card">
        <div class="credit-card-top">
          <div class="credit-card-name">${card.name}</div>
          <div class="credit-card-chip"></div>
        </div>
        <div class="credit-card-balance">
          <div class="credit-card-balance-label">Fatura Atual</div>
          <div class="credit-card-balance-value">${fmt(totalBill)}</div>
        </div>
        <div class="credit-card-progress">
          <div class="credit-card-progress-bar">
            <div class="${barClass}" style="width:${usagePct}%"></div>
          </div>
          <div class="credit-card-progress-label">
            <span>${usagePct.toFixed(1)}% usado</span>
            <span>Limite: ${fmt(card.limit)}</span>
          </div>
        </div>
        <div class="credit-card-details">
          <div>
            <div class="credit-card-detail-label">Fechamento</div>
            <div class="credit-card-detail-value">Dia ${card.closingDay} • ${fmtDate(dates.closing)}</div>
          </div>
          <div>
            <div class="credit-card-detail-label">Vencimento</div>
            <div class="credit-card-detail-value">Dia ${card.dueDay} • ${fmtDate(dates.due)}</div>
          </div>
          <div>
            <div class="credit-card-detail-label">Disponível</div>
            <div class="credit-card-detail-value" style="color:var(--green-light)">${fmt(card.limit - totalBill)}</div>
          </div>
          <div>
            <div class="credit-card-detail-label">Parcelas</div>
            <div class="credit-card-detail-value">${fmt(instTotal)}</div>
          </div>
        </div>
        <div class="credit-card-actions">
          <button class="btn-icon" onclick="deleteCard('${card.id}')" title="Excluir Cartão">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
  
  // Update installment modal card select
  populateCardSelect();
}

function populateCardSelect() {
  const sel = document.getElementById('instCard');
  if (!sel) return;
  sel.innerHTML = '<option value="">Nenhum (gasto normal)</option>' +
    state.cards.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function openCardModal() {
  document.getElementById('cardName').value = '';
  document.getElementById('cardClosingDay').value = '';
  document.getElementById('cardDueDay').value = '';
  document.getElementById('cardLimit').value = '';
  document.getElementById('cardModalOverlay').classList.add('open');
}

function closeCardModal() {
  document.getElementById('cardModalOverlay').classList.remove('open');
}

function handleAddCard(e) {
  e.preventDefault();
  const name = document.getElementById('cardName').value.trim();
  const closingDay = parseInt(document.getElementById('cardClosingDay').value);
  const dueDay = parseInt(document.getElementById('cardDueDay').value);
  const limit = parseFloat(document.getElementById('cardLimit').value);
  
  if (!name || !closingDay || !dueDay || !limit) {
    showToast('Preencha todos os campos do cartão.', 'error');
    return;
  }
  if (closingDay < 1 || closingDay > 31 || dueDay < 1 || dueDay > 31) {
    showToast('Dia de fechamento e vencimento devem estar entre 1 e 31.', 'error');
    return;
  }
  
  const card = {
    id: uuid(),
    name,
    closingDay,
    dueDay,
    limit
  };
  state.cards.push(card);
  saveCards();
  closeCardModal();
  showToast('Cartão ' + name + ' adicionado!', 'success');
  renderCards();
}

function deleteCard(id) {
  const card = getCardById(id);
  if (!card) return;
  if (!confirm('Excluir cartão ' + card.name + '? As transações vinculadas serão desassociadas.')) return;
  deleteCardTransactions(id);
  showToast('Cartão excluído.', 'info');
  renderCards();
}

/* ── PARCELAS ─────────────────────────────────────── */
function renderInstallments() {
  const tbody = document.getElementById('installmentTableBody');
  
  if (!state.installments.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">Nenhuma compra parcelada.</td></tr>';
    return;
  }
  
  tbody.innerHTML = state.installments.map(inst => {
    const { paid, total, remaining } = getInstallmentStatus(inst);
    const pct = total > 0 ? (paid / total) * 100 : 0;
    const cardName = inst.cardId ? (getCardById(inst.cardId)?.name || '—') : '—';
    const instValue = inst.totalValue / inst.totalInstallments;
    
    return `
      <tr>
        <td>
          <strong>${inst.description}</strong>
          ${inst.note ? '<br><small style="color:var(--text-muted)">' + inst.note + '</small>' : ''}
        </td>
        <td>${cardName}</td>
        <td class="value-negative">${fmt(inst.totalValue)}</td>
        <td>
          <span style="font-size:13px;font-weight:600">${inst.totalInstallments}x</span>
          <span style="font-size:11px;color:var(--text-muted)">de ${fmt(instValue)}/mês</span>
        </td>
        <td>
          <div class="installment-progress">
            <div class="installment-progress-bar">
              <div class="installment-progress-fill" style="width:${pct}%"></div>
            </div>
            <span class="installment-progress-text">${paid}/${total}</span>
          </div>
        </td>
        <td>
          <button class="btn-delete" onclick="deleteInstallment('${inst.id}')" title="Excluir parcelamento">✕</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openInstallmentModal() {
  document.getElementById('instDesc').value = '';
  document.getElementById('instTotal').value = '';
  document.getElementById('instCount').value = '';
  document.getElementById('instDate').value = new Date().toISOString().substring(0, 10);
  document.getElementById('instNote').value = '';
  populateCardSelect();
  document.getElementById('installmentModalOverlay').classList.add('open');
}

function closeInstallmentModal() {
  document.getElementById('installmentModalOverlay').classList.remove('open');
}

function handleAddInstallment(e) {
  e.preventDefault();
  const desc = document.getElementById('instDesc').value.trim();
  const cardId = document.getElementById('instCard').value;
  const totalValue = parseFloat(document.getElementById('instTotal').value);
  const totalInstallments = parseInt(document.getElementById('instCount').value);
  const startDate = document.getElementById('instDate').value;
  const category = document.getElementById('instCategory').value;
  const note = document.getElementById('instNote').value.trim();
  
  if (!desc || !totalValue || !totalInstallments || !startDate) {
    showToast('Preencha todos os campos obrigatórios.', 'error');
    return;
  }
  if (totalValue <= 0 || totalInstallments < 1) {
    showToast('Valor e número de parcelas inválidos.', 'error');
    return;
  }
  
  const instId = uuid();
  const instValue = totalValue / totalInstallments;
  const start = parseDate(startDate);
  
  // Create the installment record
  const inst = {
    id: instId,
    cardId: cardId || null,
    description: desc,
    totalValue,
    totalInstallments,
    startDate,
    category,
    note
  };
  state.installments.push(inst);
  
  // Generate transaction for each installment
  for (let i = 0; i < totalInstallments; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    const dateStr = d.toISOString().substring(0, 10);
    const tx = {
      id: uuid(),
      date: dateStr,
      description: desc + ' (' + (i + 1) + '/' + totalInstallments + ')',
      type: 'expense',
      category,
      value: instValue,
      note: note || '',
      installmentGroup: instId,
      installmentNumber: i + 1,
      cardId: cardId || undefined
    };
    state.transactions.push(tx);
  }
  
  saveInstallments();
  saveData();
  closeInstallmentModal();
  showToast('Compra parcelada criada! ' + totalInstallments + 'x de ' + fmt(instValue), 'success');
  renderInstallments();
}

function deleteInstallment(id) {
  const inst = state.installments.find(i => i.id === id);
  if (!inst) return;
  if (!confirm('Excluir parcelamento de ' + inst.description + '? Todas as parcelas serão removidas.')) return;
  deleteInstallmentTransactions(id);
  showToast('Parcelamento excluído.', 'info');
  renderInstallments();
  // Reload current tab if viewing other tabs
  const activeTab = document.querySelector('.nav-item.active')?.dataset?.tab || 'overview';
  if (activeTab !== 'card') renderTab(activeTab);
}

/* ── AGENDAMENTOS ─────────────────────────────────── */
function renderScheduledPayments() {
  const tbody = document.getElementById('scheduledTableBody');
  
  if (!state.scheduledPayments.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">Nenhum pagamento agendado.</td></tr>';
    return;
  }
  
  tbody.innerHTML = state.scheduledPayments.map(sched => {
    const nextDate = getScheduledNextDate(sched);
    const now = new Date();
    
    let status, statusClass;
    if (sched.endDate && parseDate(sched.endDate) < now) {
      status = 'Expirado';
      statusClass = 'expired';
    } else if (nextDate && (nextDate - now) < 7 * 24 * 60 * 60 * 1000) {
      status = 'Próximo!';
      statusClass = 'pending';
    } else if (nextDate) {
      status = 'Ativo';
      statusClass = 'active';
    } else {
      status = 'Expirado';
      statusClass = 'expired';
    }
    
    const freqLabels = {
      weekly: 'Semanal',
      biweekly: 'Quinzenal',
      monthly: 'Mensal',
      yearly: 'Anual'
    };
    const freqIcons = {
      weekly: '📅',
      biweekly: '📅',
      monthly: '📆',
      yearly: '🗓️'
    };
    
    return `
      <tr>
        <td>
          <strong>${sched.description}</strong>
          ${sched.note ? '<br><small style="color:var(--text-muted)">' + sched.note + '</small>' : ''}
        </td>
        <td class="value-negative">${fmt(sched.value)}</td>
        <td>
          <span class="freq-label">
            <span class="freq-icon">${freqIcons[sched.frequency]}</span>
            ${freqLabels[sched.frequency]}
          </span>
        </td>
        <td style="font-size:13px">
          ${nextDate ? nextDate.toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
        </td>
        <td><span class="sched-badge ${statusClass}">${status}</span></td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn-delete" onclick="generateScheduledPayment('${sched.id}')" title="Gerar transação">➕</button>
            <button class="btn-delete" onclick="deleteScheduledPayment('${sched.id}')" title="Excluir">✕</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openScheduledModal() {
  document.getElementById('schedDesc').value = '';
  document.getElementById('schedValue').value = '';
  document.getElementById('schedStart').value = new Date().toISOString().substring(0, 10);
  document.getElementById('schedEnd').value = '';
  document.getElementById('schedNote').value = '';
  document.getElementById('scheduledModalOverlay').classList.add('open');
}

function closeScheduledModal() {
  document.getElementById('scheduledModalOverlay').classList.remove('open');
}

function handleAddScheduledPayment(e) {
  e.preventDefault();
  const desc = document.getElementById('schedDesc').value.trim();
  const value = parseFloat(document.getElementById('schedValue').value);
  const frequency = document.getElementById('schedFrequency').value;
  const category = document.getElementById('schedCategory').value;
  const startDate = document.getElementById('schedStart').value;
  const endDate = document.getElementById('schedEnd').value || '';
  const note = document.getElementById('schedNote').value.trim();
  
  if (!desc || !value || !startDate) {
    showToast('Preencha todos os campos obrigatórios.', 'error');
    return;
  }
  if (value <= 0) {
    showToast('Valor deve ser maior que zero.', 'error');
    return;
  }
  
  const sched = {
    id: uuid(),
    description: desc,
    value,
    frequency,
    category,
    startDate,
    endDate,
    note,
    createdAt: new Date().toISOString()
  };
  state.scheduledPayments.push(sched);
  saveScheduled();
  closeScheduledModal();
  showToast('Pagamento agendado: ' + desc, 'success');
  renderScheduledPayments();
}

function deleteScheduledPayment(id) {
  const sched = state.scheduledPayments.find(s => s.id === id);
  if (!sched) return;
  if (!confirm('Excluir agendamento de ' + sched.description + '?')) return;
  state.scheduledPayments = state.scheduledPayments.filter(s => s.id !== id);
  saveScheduled();
  showToast('Agendamento excluído.', 'info');
  renderScheduledPayments();
}

function generateScheduledPayment(id) {
  const sched = state.scheduledPayments.find(s => s.id === id);
  if (!sched) return;
  
  const nextDate = getScheduledNextDate(sched);
  if (!nextDate) {
    showToast('Este agendamento já expirou.', 'error');
    return;
  }
  
  const dateStr = nextDate.toISOString().substring(0, 10);
  const tx = {
    id: uuid(),
    date: dateStr,
    description: sched.description + ' (Agendado)',
    type: 'expense',
    category: sched.category,
    value: sched.value,
    note: sched.note || '',
    scheduledId: sched.id
  };
  state.transactions.push(tx);
  saveData();
  showToast('Transação gerada: ' + fmt(sched.value), 'success');
  renderScheduledPayments();
  // Reload current tab if viewing other tabs
  const activeTab = document.querySelector('.nav-item.active')?.dataset?.tab || 'overview';
  if (activeTab !== 'card') renderTab(activeTab);
}

// ══════════════════════════════════════════════════════
// ── MODAL ────────────────────────────────────────────
// ══════════════════════════════════════════════════════
let modalType = 'income';

function openModal(type) {
  modalType = type || 'income';
  document.getElementById('modalTitle').textContent = 'Adicionar ' + (modalType === 'income' ? 'Recebimento' : 'Gasto');
  document.getElementById('modalTabIncome').classList.toggle('active', modalType === 'income');
  document.getElementById('modalTabExpense').classList.toggle('active', modalType === 'expense');
  document.getElementById('incomeCatGroup').style.display = modalType === 'income' ? 'flex' : 'none';
  document.getElementById('expenseCatGroup').style.display = modalType === 'expense' ? 'flex' : 'none';
  document.getElementById('txDate').value = new Date().toISOString().substring(0,10);
  document.getElementById('txDesc').value = '';
  document.getElementById('txValue').value = '';
  document.getElementById('txNote').value = '';
  document.getElementById('modalOverlay').classList.add('open');
}

function setModalType(type) { openModal(type); }

function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }

// ══════════════════════════════════════════════════════
// ── TRANSAÇÕES ───────────────────────────────────────
// ══════════════════════════════════════════════════════
function addTransaction(e) {
  e.preventDefault();
  const date = document.getElementById('txDate').value;
  const desc = document.getElementById('txDesc').value.trim();
  const value = parseFloat(document.getElementById('txValue').value);
  const note = document.getElementById('txNote').value.trim();
  const category = modalType === 'income'
    ? document.getElementById('txIncomeCategory').value
    : document.getElementById('txExpenseCategory').value;
  if (!date || !desc || !value || value <= 0) { showToast('Preencha todos os campos obrigatórios.', 'error'); return; }
  const tx = { id: uuid(), date, description: desc, type: modalType, category, value, note };
  state.transactions.push(tx);
  saveData();
  closeModal();
  showToast((modalType==='income'?'Recebimento':'Gasto') + ' adicionado com sucesso!', 'success');
  const filtered = getFiltered();
  const income = getTotalIncome(filtered);
  const expense = getTotalExpense(filtered);
  const balance = income - expense;
  const savings = income > 0 ? (balance / income) : 0;
  renderKPIs(income, expense, balance, savings, filtered);
  renderTab(document.querySelector('.nav-item.active')?.dataset?.tab || 'overview');
}

function deleteTransaction(id) {
  if (!confirm('Excluir este lançamento?')) return;
  state.transactions = state.transactions.filter(t => t.id !== id);
  saveData();
  showToast('Lançamento excluído.', 'info');
  const activeTab = document.querySelector('.nav-item.active')?.dataset?.tab || 'overview';
  renderTab(activeTab);
}

// ══════════════════════════════════════════════════════
// ── EXPORT / IMPORT ──────────────────────────────────
// ══════════════════════════════════════════════════════
function exportCSV() {
  if (!state.transactions.length) { showToast('Nenhum dado para exportar.', 'error'); return; }

  const user = state.currentUser?.name || 'Usuário';
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const monthLabel = MONTHS_PT[state.currentMonth] + '/' + state.currentYear;

  // ── Organize transactions ──
  const sorted = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date));
  const incomes = sorted.filter(t => t.type === 'income');
  const expenses = sorted.filter(t => t.type === 'expense');

  const totalIncome = getTotalIncome(incomes);
  const totalExpense = getTotalExpense(expenses);
  const balance = totalIncome - totalExpense;

  // ── Helper: format value for CSV ──
  const csvVal = (v) => 'R$ ' + v.toFixed(2).replace('.', ',');
  const esc = (s) => '"' + (s || '').replace(/"/g, '""') + '"';

  // ── Build CSV content ──
  const lines = [];

  // Header / Title
  lines.push(`RELATÓRIO FINANCEIRO - ${esc(user)}`);
  lines.push(`Exportado em:,${esc(dateStr)}`);
  lines.push(`Período:,${esc(monthLabel)}`);
  lines.push('');

  // ═══ RECEITAS ═══
  lines.push('═══ RECEITAS ═══');
  lines.push('Data;Descrição;Categoria;Valor;Observação');
  if (incomes.length === 0) {
    lines.push('(Nenhuma receita no período)');
  } else {
    incomes.forEach(t => {
      const cat = getCatLabel('income', t.category);
      lines.push(`${t.date};${esc(t.description)};${cat};${csvVal(t.value)};${esc(t.note || '')}`);
    });
  }
  lines.push(`;;Total Receitas;${csvVal(totalIncome)};`);
  lines.push('');

  // ═══ DESPESAS ═══
  lines.push('═══ DESPESAS ═══');
  lines.push('Data;Descrição;Categoria;Valor;Observação');
  if (expenses.length === 0) {
    lines.push('(Nenhuma despesa no período)');
  } else {
    expenses.forEach(t => {
      const cat = getCatLabel('expense', t.category);
      lines.push(`${t.date};${esc(t.description)};${cat};${csvVal(t.value)};${esc(t.note || '')}`);
    });
  }
  lines.push(`;;Total Despesas;${csvVal(totalExpense)};`);
  lines.push('');

  // ═══ RESUMO ═══
  lines.push('═══ RESUMO ═══');
  lines.push(`Total Receitas;${csvVal(totalIncome)}`);
  lines.push(`Total Despesas;${csvVal(totalExpense)}`);
  lines.push(`Saldo Líquido;${csvVal(balance)}`);
  if (totalIncome > 0) {
    const savingsPct = ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1);
    lines.push(`Taxa de Poupança;${savingsPct.replace('.', ',')}%`);
  }
  lines.push('');
  lines.push('═══ TRANSAÇÕES POR CATEGORIA ═══');
  lines.push('Categoria;Total');
  const grouped = groupByCat(sorted);
  Object.keys(grouped)
    .sort((a, b) => grouped[b] - grouped[a])
    .forEach(k => {
      const label = getCatLabel(sorted.find(t => t.category === k)?.type || 'expense', k);
      lines.push(`${label};${csvVal(grouped[k])}`);
    });

  const content = lines.join('\r\n');
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'PoupaCerto_relatorio_' + now.toISOString().substring(0, 10) + '.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Relatório CSV exportado com sucesso!', 'success');
}

function exportPDF() {
  if (!state.transactions.length) { showToast('Nenhum dado para exportar.', 'error'); return; }

  const user = state.currentUser?.name || 'Usuário';
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const monthLabel = MONTHS_PT[state.currentMonth] + ' de ' + state.currentYear;

  const sorted = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date));
  const incomes = sorted.filter(t => t.type === 'income');
  const expenses = sorted.filter(t => t.type === 'expense');
  const totalIncome = getTotalIncome(sorted);
  const totalExpense = getTotalExpense(sorted);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100) : 0;

  // ── Build HTML for the printable report ──
  const buildTableRows = (list, type) => list.map(t => `
    <tr>
      <td>${t.date}</td>
      <td>${escHtml(t.description)}</td>
      <td>${getCatIcon(type, t.category)} ${getCatLabel(type, t.category)}</td>
      <td class="${type === 'income' ? 'val-pos' : 'val-neg'}">R$ ${t.value.toFixed(2).replace('.', ',')}</td>
      ${t.note ? `<td style="color:#94a3b8;font-size:11px">${escHtml(t.note)}</td>` : '<td></td>'}
    </tr>
  `).join('');

  const escHtml = (s) => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const grouped = groupByCat(sorted);
  const catRows = Object.keys(grouped)
    .sort((a, b) => grouped[b] - grouped[a])
    .map(k => {
      const tx = sorted.find(t => t.category === k);
      const label = getCatLabel(tx?.type || 'expense', k);
      const icon = getCatIcon(tx?.type || 'expense', k);
      return `<tr><td>${icon} ${label}</td><td class="val-neg">R$ ${grouped[k].toFixed(2).replace('.', ',')}</td></tr>`;
    }).join('');

  const reportHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório Financeiro - PoupaCerto</title>
  <style>
    @page { margin: 20mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, 'Segoe UI', sans-serif;
      color: #1e293b;
      background: #fff;
      font-size: 12px;
      line-height: 1.5;
      padding: 10px 0;
    }
    .report-header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 3px solid #8b5cf6;
      margin-bottom: 24px;
    }
    .report-header h1 {
      font-size: 26px;
      font-weight: 900;
      color: #1e293b;
      letter-spacing: -0.5px;
    }
    .report-header .subtitle {
      color: #64748b;
      font-size: 13px;
      margin-top: 4px;
    }
    .report-header .user-info {
      color: #475569;
      font-size: 12px;
      margin-top: 6px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }
    .summary-box {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      text-align: center;
    }
    .summary-box .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #94a3b8;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .summary-box .value {
      font-size: 20px;
      font-weight: 800;
    }
    .summary-box .value.green { color: #10b981; }
    .summary-box .value.red { color: #ef4444; }
    .summary-box .value.purple { color: #8b5cf6; }

    h2 {
      font-size: 16px;
      font-weight: 800;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    h2 .badge {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 10px;
      border-radius: 20px;
      color: #fff;
    }
    .badge.green { background: #10b981; }
    .badge.red { background: #ef4444; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 11px;
    }
    th {
      text-align: left;
      padding: 8px 10px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      background: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #f1f5f9;
    }
    tr:hover td { background: #f8fafc; }

    .val-pos { color: #10b981; font-weight: 700; text-align: right; }
    .val-neg { color: #ef4444; font-weight: 700; text-align: right; }

    .subtotal td {
      font-weight: 800;
      font-size: 12px;
      border-top: 2px solid #1e293b;
      padding-top: 10px;
    }
    .total-row td {
      font-weight: 900;
      font-size: 13px;
      background: #f1f5f9;
      border-top: 2px solid #8b5cf6;
      padding: 10px;
    }
    .total-row .val-pos { color: #10b981; }
    .total-row .val-neg { color: #ef4444; }

    .section-spacer { height: 8px; }

    table.cat-table td:first-child { font-weight: 600; }
    table.cat-table td:last-child { text-align: right; font-weight: 700; }

    .footer {
      text-align: center;
      color: #94a3b8;
      font-size: 10px;
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }

    .empty-state {
      text-align: center;
      color: #94a3b8;
      padding: 20px;
      font-size: 12px;
    }

    @media print {
      body { padding: 0; }
      .no-print { display: none; }
      .summary-grid { page-break-inside: avoid; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="report-header">
    <h1>💰 PoupaCerto</h1>
    <div class="subtitle">Relatório Financeiro</div>
    <div class="user-info">${escHtml(user)} • ${monthLabel} • Gerado em ${dateStr}</div>
  </div>

  <!-- SUMMARY -->
  <div class="summary-grid">
    <div class="summary-box">
      <div class="label">Total Receitas</div>
      <div class="value green">R$ ${totalIncome.toFixed(2).replace('.', ',')}</div>
    </div>
    <div class="summary-box">
      <div class="label">Total Despesas</div>
      <div class="value red">R$ ${totalExpense.toFixed(2).replace('.', ',')}</div>
    </div>
    <div class="summary-box">
      <div class="label">Saldo Líquido</div>
      <div class="value ${balance >= 0 ? 'green' : 'red'}">R$ ${balance.toFixed(2).replace('.', ',')}</div>
    </div>
    <div class="summary-box">
      <div class="label">Taxa de Poupança</div>
      <div class="value purple">${savingsRate.toFixed(1).replace('.', ',')}%</div>
    </div>
  </div>

  <!-- INCOME TABLE -->
  <h2>📈 Receitas <span class="badge green">${incomes.length}</span></h2>
  ${incomes.length === 0
    ? '<div class="empty-state">Nenhuma receita registrada neste período.</div>'
    : `<table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Descrição</th>
          <th>Categoria</th>
          <th style="text-align:right">Valor</th>
          <th>Obs.</th>
        </tr>
      </thead>
      <tbody>
        ${buildTableRows(incomes, 'income')}
        <tr class="subtotal">
          <td colspan="3"><strong>Total de Receitas</strong></td>
          <td class="val-pos">R$ ${totalIncome.toFixed(2).replace('.', ',')}</td>
          <td></td>
        </tr>
      </tbody>
    </table>`}

  <!-- EXPENSE TABLE -->
  <h2>💸 Despesas <span class="badge red">${expenses.length}</span></h2>
  ${expenses.length === 0
    ? '<div class="empty-state">Nenhuma despesa registrada neste período.</div>'
    : `<table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Descrição</th>
          <th>Categoria</th>
          <th style="text-align:right">Valor</th>
          <th>Obs.</th>
        </tr>
      </thead>
      <tbody>
        ${buildTableRows(expenses, 'expense')}
        <tr class="subtotal">
          <td colspan="3"><strong>Total de Despesas</strong></td>
          <td class="val-neg">R$ ${totalExpense.toFixed(2).replace('.', ',')}</td>
          <td></td>
        </tr>
      </tbody>
    </table>`}

  <!-- BALANCE ROW -->
  <table>
    <tr class="total-row">
      <td colspan="3" style="font-size:14px"><strong>📊 Saldo Líquido</strong></td>
      <td class="${balance >= 0 ? 'val-pos' : 'val-neg'}" style="font-size:16px">
        R$ ${balance.toFixed(2).replace('.', ',')}
      </td>
      <td></td>
    </tr>
  </table>

  <!-- CATEGORY SUMMARY -->
  <h2>📊 Gastos por Categoria</h2>
  ${Object.keys(grouped).length === 0
    ? '<div class="empty-state">Nenhum gasto registrado.</div>'
    : `<table class="cat-table">
      <thead>
        <tr>
          <th>Categoria</th>
          <th style="text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${catRows}
      </tbody>
    </table>`}

  <div class="footer">
    Relatório gerado por PoupaCerto • ${dateStr} • Todos os valores em R$
  </div>

  <div class="no-print" style="text-align:center;margin-top:20px">
    <button onclick="window.print()" style="
      padding: 12px 32px;
      background: #8b5cf6;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
    ">🖨️ Imprimir / Salvar PDF</button>
    <button onclick="window.close()" style="
      padding: 12px 24px;
      background: #e2e8f0;
      color: #475569;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      margin-left: 10px;
    ">✕ Fechar</button>
  </div>

  <script>
    // Auto-print after a brief moment to let styles render
    setTimeout(() => { window.print(); }, 500);
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (printWindow) {
    printWindow.document.write(reportHTML);
    printWindow.document.close();
  } else {
    // Fallback if popup blocker
    showToast('Permita pop-ups para visualizar o relatório PDF.', 'error');
  }
  showToast('Relatório PDF gerado!', 'success');
}

function importCSV() {
  const file = document.getElementById('csvFileInput').files[0];
  if (!file) { showToast('Selecione um arquivo CSV.', 'error'); return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const lines = text.split('\n').filter(l=>l.trim());
    let count = 0;
    lines.forEach((line, i) => {
      if (i === 0 && line.toLowerCase().includes('data')) return;
      const parts = line.split(',').map(s=>s.trim().replace(/^"|"$/g,''));
      if (parts.length < 5) return;
      const [date, desc, type, cat, val, note] = parts;
      if (!date || !desc || !type || !cat || !val) return;
      const value = parseFloat(val.replace(',','.'));
      if (isNaN(value) || value <= 0) return;
      const txType = type === 'receita' || type === 'income' ? 'income' : 'expense';
      const tx = { id: uuid(), date, description: desc, type: txType, category: cat.toLowerCase(), value, note: note || '' };
      state.transactions.push(tx);
      count++;
    });
    if (count > 0) {
      saveData();
      showToast(count + ' lançamento' + (count!==1?'s':'') + ' importado' + (count!==1?'s':'') + '!', 'success');
      const activeTab = document.querySelector('.nav-item.active')?.dataset?.tab || 'overview';
      renderTab(activeTab);
      document.getElementById('csvModalOverlay').classList.remove('open');
      document.getElementById('csvFileInput').value = '';
    } else {
      showToast('Nenhum dado válido encontrado.', 'error');
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (!confirm('Tem certeza? Isso vai apagar TODOS os dados financeiros (transações, cartões, parcelas e agendamentos)!')) return;
  if (!confirm('Esta ação é irreversível. Continuar?')) return;
  state.transactions = [];
  state.cards = [];
  state.installments = [];
  state.scheduledPayments = [];
  saveData();
  saveCards();
  saveInstallments();
  saveScheduled();
  showToast('Todos os dados foram limpos.', 'info');
  const activeTab = document.querySelector('.nav-item.active')?.dataset?.tab || 'overview';
  renderTab(activeTab);
}

// ══════════════════════════════════════════════════════
// ── TEMA ─────────────────────────────────────────────
// ══════════════════════════════════════════════════════
function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.body.classList.toggle('light', state.theme === 'light');
  document.getElementById('themeToggle').textContent = state.theme === 'dark' ? '🌙' : '☀️';
  saveTheme();
}

// ══════════════════════════════════════════════════════
// ── INIT ─────────────────────────────────────────────
// ══════════════════════════════════════════════════════
function initDashboard() {
  const filtered = getFiltered();
  const income = getTotalIncome(filtered);
  const expense = getTotalExpense(filtered);
  const balance = income - expense;
  const savings = income > 0 ? (balance / income) : 0;
  renderKPIs(income, expense, balance, savings, filtered);
  renderOverviewCharts(filtered, income, expense, balance);
  renderBudget(filtered, income, expense);
  updateMonthLabel();
}

function updateMonthLabel() {
  document.getElementById('monthLabel').textContent = MONTHS_PT[state.currentMonth] + ' ' + state.currentYear;
}

// ══════════════════════════════════════════════════════
// ── EVENT LISTENERS ──────────────────────────────────
// ══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  loadData();

  // Theme
  if (state.theme === 'light') {
    document.body.classList.add('light');
    document.getElementById('themeToggle').textContent = '☀️';
  }

  // Auto-login from session
  const sessionEmail = loadSession();
  if (sessionEmail) {
    const users = getUsers();
    const user = users.find(u => u.email === sessionEmail);
    if (user) {
      state.currentUser = { name: user.name, email: user.email };
      completeLogin();
    }
  }

  // Auth forms
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);

  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() { switchTab(this.dataset.tab); });
  });

  // Month nav
  document.getElementById('prevMonth').addEventListener('click', function() {
    state.currentMonth--;
    if (state.currentMonth < 0) { state.currentMonth = 11; state.currentYear--; }
    updateMonthLabel();
    renderTab(document.querySelector('.nav-item.active')?.dataset?.tab || 'overview');
  });
  document.getElementById('nextMonth').addEventListener('click', function() {
    state.currentMonth++;
    if (state.currentMonth > 11) { state.currentMonth = 0; state.currentYear++; }
    updateMonthLabel();
    renderTab(document.querySelector('.nav-item.active')?.dataset?.tab || 'overview');
  });

  // Year nav
  document.getElementById('prevYear').addEventListener('click', function() { state.currentYearView--; renderAnnual(); });
  document.getElementById('nextYear').addEventListener('click', function() { state.currentYearView++; renderAnnual(); });

  // Week select
  document.getElementById('weekSelect').addEventListener('change', function() { renderWeekly(getFiltered()); });

  // Modal
  document.getElementById('openModalBtn').addEventListener('click', function() { openModal('income'); });
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', function(e) { if (e.target === this) closeModal(); });
  document.getElementById('transactionForm').addEventListener('submit', addTransaction);

  // CSV modal
  document.getElementById('importCsvBtn').addEventListener('click', function() { document.getElementById('csvModalOverlay').classList.add('open'); });
  document.getElementById('closeCsvModalBtn').addEventListener('click', function() { document.getElementById('csvModalOverlay').classList.remove('open'); });
  document.getElementById('cancelCsvBtn').addEventListener('click', function() { document.getElementById('csvModalOverlay').classList.remove('open'); });
  document.getElementById('csvModalOverlay').addEventListener('click', function(e) { if (e.target === this) { this.classList.remove('open'); } });
  document.getElementById('importCsvConfirmBtn').addEventListener('click', importCSV);

  // Export & clear
  document.getElementById('exportBtn').addEventListener('click', exportCSV);
  document.getElementById('exportPdfBtn').addEventListener('click', exportPDF);
  document.getElementById('clearAllBtn').addEventListener('click', clearAllData);

  // Search
  document.getElementById('searchInput').addEventListener('input', renderHistory);

  // Filter
  document.getElementById('filterCategory').addEventListener('change', function() { renderExpenses(getFiltered()); });

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // ── Card Modal ──
  document.getElementById('cardForm').addEventListener('submit', handleAddCard);
  document.getElementById('closeCardModalBtn').addEventListener('click', closeCardModal);
  document.getElementById('cancelCardBtn').addEventListener('click', closeCardModal);
  document.getElementById('cardModalOverlay').addEventListener('click', function(e) { if (e.target === this) closeCardModal(); });

  // ── Installment Modal ──
  document.getElementById('installmentForm').addEventListener('submit', handleAddInstallment);
  document.getElementById('closeInstallmentModalBtn').addEventListener('click', closeInstallmentModal);
  document.getElementById('cancelInstallmentBtn').addEventListener('click', closeInstallmentModal);
  document.getElementById('installmentModalOverlay').addEventListener('click', function(e) { if (e.target === this) closeInstallmentModal(); });

  // ── Scheduled Modal ──
  document.getElementById('scheduledForm').addEventListener('submit', handleAddScheduledPayment);
  document.getElementById('closeScheduledModalBtn').addEventListener('click', closeScheduledModal);
  document.getElementById('cancelScheduledBtn').addEventListener('click', closeScheduledModal);
  document.getElementById('scheduledModalOverlay').addEventListener('click', function(e) { if (e.target === this) closeScheduledModal(); });

  // Budget save
  document.getElementById('saveBudgetBtn').addEventListener('click', function() {
    budget.expenseLimit = parseFloat(document.getElementById('budgetExpenseLimit').value) || 0;
    budget.savingsGoal = parseFloat(document.getElementById('budgetSavingsGoal').value) || 0;
    document.querySelectorAll('.cat-limit-input').forEach(inp => {
      budget.categoryLimits[inp.dataset.cat] = parseFloat(inp.value) || 0;
    });
    saveBudget();
    showToast('Metas salvas!', 'success');
    renderBudget(getFiltered(), getTotalIncome(getFiltered()), getTotalExpense(getFiltered()));
  });

  // Hamburguer
  document.getElementById('hamburger').addEventListener('click', function(e) {
    e.stopPropagation();
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('open');
    if (sidebar.classList.contains('open')) {
      overlay.classList.add('visible');
    } else {
      overlay.classList.remove('visible');
    }
  });

  // Click overlay to close sidebar
  document.getElementById('sidebarOverlay').addEventListener('click', function() {
    document.getElementById('sidebar').classList.remove('open');
    this.classList.remove('visible');
  });

  // Click outside sidebar to close
  document.getElementById('mainContent').addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      overlay.classList.remove('visible');
    }
  });
});
