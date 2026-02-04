// ==================== FIREBASE CONFIG ====================
const firebaseConfig = {
    apiKey: "AIzaSyD_example_key_here",
    authDomain: "seu-projeto.firebaseapp.com",
    databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com",
    projectId: "seu-projeto",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

let currentUser = null;
let userRef = null;

// ==================== DADOS ====================
let dados = {
    salario: 0,
    fixas: [],
    lazer: [],
    compras: [],
    extras: [],
    anterior: 0,
    historico: [],
    lembretes: [],
    vicios: []
};

let periodoAtual = 'mensal';
let mesCalendario = new Date().getMonth();
let anoCalendario = new Date().getFullYear();
let grafico = null;

// ==================== UTILS ====================
const f = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function salvar() {
    if (userRef) {
        userRef.set(dados);
    }
}

function carregar() {
    return new Promise((resolve) => {
        if (userRef) {
            userRef.once('value').then((snapshot) => {
                const data = snapshot.val();
                if (data) {
                    dados = data;
                    // Garante que arrays existam
                    dados.fixas = dados.fixas || [];
                    dados.lazer = dados.lazer || [];
                    dados.compras = dados.compras || [];
                    dados.extras = dados.extras || [];
                    dados.historico = dados.historico || [];
                    dados.lembretes = dados.lembretes || [];
                    dados.vicios = dados.vicios || [];
                }
                resolve();
            });
        } else {
            resolve();
        }
    });
}

// ==================== AUTENTICAÇÃO ====================
function mostrarApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
    document.getElementById('user-email').textContent = currentUser.email;
}

function mostrarLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
}

function mostrarErro(msg) {
    document.getElementById('login-error').textContent = msg;
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    
    try {
        await auth.signInWithEmailAndPassword(email, senha);
    } catch (error) {
        let msg = 'Erro ao fazer login';
        if (error.code === 'auth/user-not-found') msg = 'Usuário não encontrado';
        if (error.code === 'auth/wrong-password') msg = 'Senha incorreta';
        if (error.code === 'auth/invalid-email') msg = 'E-mail inválido';
        mostrarErro(msg);
    }
});

document.getElementById('btn-cadastrar').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    
    if (!email || !senha) {
        mostrarErro('Preencha e-mail e senha');
        return;
    }
    
    if (senha.length < 6) {
        mostrarErro('A senha deve ter pelo menos 6 caracteres');
        return;
    }
    
    try {
        await auth.createUserWithEmailAndPassword(email, senha);
    } catch (error) {
        let msg = 'Erro ao criar conta';
        if (error.code === 'auth/email-already-in-use') msg = 'Este e-mail já está em uso';
        if (error.code === 'auth/invalid-email') msg = 'E-mail inválido';
        if (error.code === 'auth/weak-password') msg = 'Senha muito fraca';
        mostrarErro(msg);
    }
});

function logout() {
    auth.signOut();
}

document.getElementById('btn-logout').addEventListener('click', logout);

// Listener de autenticação
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        userRef = database.ref('users/' + user.uid);
        
        // Escuta mudanças em tempo real
        userRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                dados = data;
                dados.fixas = dados.fixas || [];
                dados.lazer = dados.lazer || [];
                dados.compras = dados.compras || [];
                dados.extras = dados.extras || [];
                dados.historico = dados.historico || [];
                dados.lembretes = dados.lembretes || [];
                dados.vicios = dados.vicios || [];
                
                if (dados.salario) {
                    document.getElementById('salario').value = dados.salario;
                }
                
                atualizarTudo();
                renderizarCalendario();
                renderizarLembretes();
                renderizarVicios();
            }
        });
        
        mostrarApp();
        initApp();
    } else {
        currentUser = null;
        if (userRef) {
            userRef.off();
        }
        userRef = null;
        mostrarLogin();
    }
});

// ==================== NAVEGAÇÃO ====================
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item, .mobile-nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.dataset.tab;
            
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.mobile-nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll(`[data-tab="${tab}"]`).forEach(n => n.classList.add('active'));
            
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById(`tab-${tab}`).classList.add('active');
        });
    });
}

// ==================== TOGGLE PERÍODO ====================
function initPeriodToggle() {
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            periodoAtual = btn.dataset.period;
            atualizarCards();
        });
    });
}

// ==================== FINANÇAS ====================
function adicionar(tipo) {
    const nome = document.getElementById(`${tipo}-nome`).value;
    const valor = parseFloat(document.getElementById(`${tipo}-valor`).value);
    const parcelas = document.getElementById(`${tipo}-parcelas`)?.value;
    
    if (!nome || !valor) {
        alert('Preencha nome e valor!');
        return;
    }
    
    const item = {
        id: Date.now(),
        nome,
        valor,
        data: new Date().toISOString()
    };
    
    if (tipo === 'fixo') {
        item.parcelas = parcelas ? parseInt(parcelas) : 'Sempre';
        dados.fixas.push(item);
    } else if (tipo === 'lazer') {
        dados.lazer.push(item);
    } else if (tipo === 'compras') {
        dados.compras.push(item);
    } else if (tipo === 'extras') {
        dados.extras.push(item);
    }
    
    document.getElementById(`${tipo}-nome`).value = '';
    document.getElementById(`${tipo}-valor`).value = '';
    if (parcelas !== undefined) {
        document.getElementById(`${tipo}-parcelas`).value = '';
    }
    
    salvar();
    atualizarTudo();
}

function removerItem(tipo, id) {
    if (tipo === 'fixo') dados.fixas = dados.fixas.filter(i => i.id !== id);
    else if (tipo === 'lazer') dados.lazer = dados.lazer.filter(i => i.id !== id);
    else if (tipo === 'compras') dados.compras = dados.compras.filter(i => i.id !== id);
    else if (tipo === 'extras') dados.extras = dados.extras.filter(i => i.id !== id);
    
    salvar();
    atualizarTudo();
}

function renderizarLista(elementoId, array, tipo) {
    const ul = document.getElementById(elementoId);
    ul.innerHTML = '';
    
    array.forEach(item => {
        const li = document.createElement('li');
        const parcText = item.parcelas !== undefined
            ? (item.parcelas === 'Sempre' ? ' (Fixo)' : ` (${item.parcelas}x)`)
            : '';
        
        li.innerHTML = `
            <span>${item.nome}${parcText}</span>
            <span>
                ${f(item.valor)}
                <button class="btn-del" onclick="removerItem('${tipo}', ${item.id})">X</button>
            </span>
        `;
        ul.appendChild(li);
    });
}

function calcularTotais() {
    const totalFixas = dados.fixas.reduce((a, b) => a + b.valor, 0);
    const totalLazer = dados.lazer.reduce((a, b) => a + b.valor, 0);
    const totalCompras = dados.compras.reduce((a, b) => a + b.valor, 0);
    const totalExtras = dados.extras.reduce((a, b) => a + b.valor, 0);
    
    return { totalFixas, totalLazer, totalCompras, totalExtras };
}

function atualizarCards() {
    const { totalFixas, totalLazer, totalCompras, totalExtras } = calcularTotais();
    const salario = parseFloat(document.getElementById('salario').value) || 0;
    
    let divisor = 1;
    if (periodoAtual === 'quinzenal') divisor = 2;
    if (periodoAtual === 'semanal') divisor = 4;
    
    const entradas = (salario + dados.anterior + totalExtras) / divisor;
    const saidas = (totalFixas + totalLazer + totalCompras) / divisor;
    const total = entradas - saidas;
    
    document.getElementById('card-total').textContent = f(total);
    document.getElementById('card-entradas').textContent = f(entradas);
    document.getElementById('card-saidas').textContent = f(saidas);
    
    document.getElementById('card-total').style.color = total >= 0 ? 'var(--green)' : 'var(--red)';
}

function atualizarTudo() {
    dados.salario = parseFloat(document.getElementById('salario').value) || 0;
    
    renderizarLista('lista-fixas', dados.fixas, 'fixo');
    renderizarLista('lista-lazer', dados.lazer, 'lazer');
    renderizarLista('lista-compras', dados.compras, 'compras');
    renderizarLista('lista-extras', dados.extras, 'extras');
    
    const { totalFixas, totalLazer, totalCompras, totalExtras } = calcularTotais();
    
    document.getElementById('total-fixas').textContent = f(totalFixas);
    document.getElementById('total-lazer').textContent = f(totalLazer);
    document.getElementById('total-compras').textContent = f(totalCompras);
    document.getElementById('total-extras').textContent = f(totalExtras);
    
    const totalEntradas = dados.salario + dados.anterior + totalExtras;
    const totalGastos = totalFixas + totalLazer + totalCompras;
    const sobra = totalEntradas - totalGastos;
    
    document.getElementById('display-anterior').textContent = f(dados.anterior);
    document.getElementById('res-total').textContent = f(totalEntradas);
    document.getElementById('res-sobra').textContent = f(sobra);
    document.getElementById('res-sobra').style.color = sobra >= 0 ? 'var(--green)' : 'var(--red)';
    
    atualizarCards();
    atualizarGrafico(totalFixas, totalLazer, totalCompras, totalExtras, sobra > 0 ? sobra : 0);
    renderizarHistorico();
}

function atualizarGrafico(fixas, lazer, compras, extras, sobra) {
    const canvas = document.getElementById('graficoPizza');
    const ctx = canvas.getContext('2d');
    
    if (grafico) {
        grafico.destroy();
        grafico = null;
    }
    
    const labels = [];
    const values = [];
    const colors = [];
    
    if (fixas > 0) { labels.push('Contas Fixas'); values.push(fixas); colors.push('#3b82f6'); }
    if (lazer > 0) { labels.push('Lazer'); values.push(lazer); colors.push('#f59e0b'); }
    if (compras > 0) { labels.push('Compras'); values.push(compras); colors.push('#8b5cf6'); }
    if (extras > 0) { labels.push('Ganhos Extras'); values.push(extras); colors.push('#10b981'); }
    if (sobra > 0) { labels.push('Sobra'); values.push(sobra); colors.push('#22c55e'); }
    
    if (values.length === 0) {
        labels.push('Sem dados');
        values.push(1);
        colors.push('#e2e8f0');
    }
    
    grafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: 'transparent',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 16,
                        usePointStyle: true,
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

function fecharMes() {
    const mesAtual = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date());
    const { totalFixas, totalLazer, totalCompras, totalExtras } = calcularTotais();
    const totalGasto = totalFixas + totalLazer + totalCompras;
    const sobra = dados.salario + dados.anterior + totalExtras - totalGasto;
    
    if (!confirm(`Deseja encerrar ${mesAtual}?`)) return;
    
    dados.historico.push({
        id: Date.now(),
        mes: mesAtual,
        ano: new Date().getFullYear(),
        sobra,
        totalGasto,
        data: new Date().toISOString()
    });
    
    dados.anterior = sobra > 0 ? sobra : 0;
    dados.lazer = [];
    dados.compras = [];
    dados.extras = [];
    dados.fixas = dados.fixas.map(it => {
        if (typeof it.parcelas === 'number') it.parcelas -= 1;
        return it;
    }).filter(it => it.parcelas === 'Sempre' || it.parcelas > 0);
    
    salvar();
    alert('Mês arquivado!');
    atualizarTudo();
}

function renderizarHistorico() {
    const container = document.getElementById('lista-historico');
    container.innerHTML = '';
    
    dados.historico.forEach(h => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <button class="btn-del-hist" onclick="apagarMes(${h.id})">X</button>
            <h4>${h.mes} ${h.ano || ''}</h4>
            <p>Gastos: ${f(h.totalGasto)}</p>
            <p class="sobra">Sobra: ${f(h.sobra)}</p>
        `;
        container.appendChild(div);
    });
}

function apagarMes(id) {
    if (!confirm('Apagar este mês do histórico?')) return;
    dados.historico = dados.historico.filter(h => h.id !== id);
    salvar();
    renderizarHistorico();
}

// ==================== CALENDÁRIO ====================
function renderizarCalendario() {
    const container = document.getElementById('calendario-dias');
    const mesAnoEl = document.getElementById('mes-ano');
    
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    mesAnoEl.textContent = `${meses[mesCalendario]} ${anoCalendario}`;
    
    const primeiroDia = new Date(anoCalendario, mesCalendario, 1).getDay();
    const diasNoMes = new Date(anoCalendario, mesCalendario + 1, 0).getDate();
    const hoje = new Date();
    
    container.innerHTML = '';
    
    for (let i = 0; i < primeiroDia; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day empty';
        container.appendChild(div);
    }
    
    for (let dia = 1; dia <= diasNoMes; dia++) {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        
        if (dia === hoje.getDate() && mesCalendario === hoje.getMonth() && anoCalendario === hoje.getFullYear()) {
            div.classList.add('today');
        }
        
        const totalDia = calcularTotalDia(dia, mesCalendario, anoCalendario);
        
        div.innerHTML = `
            <span>${dia}</span>
            ${totalDia > 0 ? `<span class="day-total">${f(totalDia)}</span>` : ''}
        `;
        
        div.onclick = () => mostrarDetalhesDia(dia, mesCalendario, anoCalendario);
        container.appendChild(div);
    }
}

function calcularTotalDia(dia, mes, ano) {
    const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    let total = 0;
    
    [...dados.fixas, ...dados.lazer, ...dados.compras].forEach(item => {
        if (item.data && item.data.startsWith(dataStr)) {
            total += item.valor;
        }
    });
    
    return total;
}

function mostrarDetalhesDia(dia, mes, ano) {
    const container = document.getElementById('dia-detalhes');
    const titulo = document.getElementById('dia-selecionado-titulo');
    const lista = document.getElementById('dia-transacoes');
    
    const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    
    const transacoes = [...dados.fixas, ...dados.lazer, ...dados.compras, ...dados.extras]
        .filter(item => item.data && item.data.startsWith(dataStr));
    
    titulo.textContent = `${dia}/${mes + 1}/${ano}`;
    lista.innerHTML = '';
    
    if (transacoes.length === 0) {
        lista.innerHTML = '<li>Nenhuma transação neste dia</li>';
    } else {
        transacoes.forEach(t => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${t.nome}</span><span>${f(t.valor)}</span>`;
            lista.appendChild(li);
        });
    }
    
    container.style.display = 'block';
}

function mudarMes(dir) {
    mesCalendario += dir;
    if (mesCalendario > 11) {
        mesCalendario = 0;
        anoCalendario++;
    } else if (mesCalendario < 0) {
        mesCalendario = 11;
        anoCalendario--;
    }
    renderizarCalendario();
}

// ==================== LEMBRETES ====================
function adicionarLembrete() {
    const titulo = document.getElementById('lembrete-titulo').value;
    const data = document.getElementById('lembrete-data').value;
    const hora = document.getElementById('lembrete-hora').value;
    const local = document.getElementById('lembrete-local').value;
    
    if (!titulo || !data) {
        alert('Preencha título e data!');
        return;
    }
    
    dados.lembretes.push({
        id: Date.now(),
        titulo,
        data,
        hora: hora || '00:00',
        local: local || ''
    });
    
    document.getElementById('lembrete-titulo').value = '';
    document.getElementById('lembrete-data').value = '';
    document.getElementById('lembrete-hora').value = '';
    document.getElementById('lembrete-local').value = '';
    
    salvar();
    renderizarLembretes();
}

function removerLembrete(id) {
    dados.lembretes = dados.lembretes.filter(l => l.id !== id);
    salvar();
    renderizarLembretes();
}

function renderizarLembretes() {
    const lista = document.getElementById('lista-lembretes');
    lista.innerHTML = '';
    
    const lembretes = dados.lembretes.sort((a, b) => new Date(a.data) - new Date(b.data));
    
    lembretes.forEach(l => {
        const li = document.createElement('li');
        li.className = 'reminder-item';
        
        const dataFormatada = new Date(l.data + 'T00:00:00').toLocaleDateString('pt-BR');
        
        li.innerHTML = `
            <div class="reminder-info">
                <h4>${l.titulo}</h4>
                <p>${dataFormatada} às ${l.hora}${l.local ? ` - ${l.local}` : ''}</p>
            </div>
            <button class="btn-del" onclick="removerLembrete(${l.id})">X</button>
        `;
        lista.appendChild(li);
    });
}

// ==================== VÍCIOS ====================
function adicionarVicio() {
    const nome = document.getElementById('vicio-nome').value;
    
    if (!nome) {
        alert('Digite o nome do vício!');
        return;
    }
    
    dados.vicios.push({
        id: Date.now(),
        nome,
        inicio: new Date().toISOString()
    });
    
    document.getElementById('vicio-nome').value = '';
    
    salvar();
    renderizarVicios();
}

function resetarVicio(id) {
    const vicio = dados.vicios.find(v => v.id === id);
    if (vicio) {
        vicio.inicio = new Date().toISOString();
        salvar();
        renderizarVicios();
    }
}

function removerVicio(id) {
    dados.vicios = dados.vicios.filter(v => v.id !== id);
    salvar();
    renderizarVicios();
}

function renderizarVicios() {
    const container = document.getElementById('lista-vicios');
    container.innerHTML = '';
    
    dados.vicios.forEach(v => {
        const div = document.createElement('div');
        div.className = 'vice-card card';
        div.innerHTML = `
            <h3>${v.nome}</h3>
            <div class="vice-timer" id="timer-${v.id}"></div>
            <div class="vice-actions">
                <button class="btn-reset" onclick="resetarVicio(${v.id})">Resetar</button>
                <button class="btn-remove" onclick="removerVicio(${v.id})">Remover</button>
            </div>
        `;
        container.appendChild(div);
    });
    
    atualizarTimers();
}

function atualizarTimers() {
    dados.vicios.forEach(v => {
        const timerEl = document.getElementById(`timer-${v.id}`);
        if (!timerEl) return;
        
        const inicio = new Date(v.inicio);
        const agora = new Date();
        const diff = agora - inicio;
        
        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diff % (1000 * 60)) / 1000);
        
        timerEl.innerHTML = `
            <div class="timer-block">
                <span class="number">${dias}</span>
                <span class="label">dias</span>
            </div>
            <div class="timer-block">
                <span class="number">${horas}</span>
                <span class="label">horas</span>
            </div>
            <div class="timer-block">
                <span class="number">${minutos}</span>
                <span class="label">min</span>
            </div>
            <div class="timer-block">
                <span class="number">${segundos}</span>
                <span class="label">seg</span>
            </div>
        `;
    });
}

// ==================== TEMA ====================
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('devfinance_theme', theme);
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

function loadTheme() {
    const saved = localStorage.getItem('devfinance_theme') || 'light';
    setTheme(saved);
}

// ==================== LIMPAR TUDO ====================
function limparTudo() {
    if (!confirm('ATENÇÃO: Isso irá apagar TODOS os seus dados permanentemente. Continuar?')) return;
    
    dados = {
        salario: 0,
        fixas: [],
        lazer: [],
        compras: [],
        extras: [],
        anterior: 0,
        historico: [],
        lembretes: [],
        vicios: []
    };
    
    document.getElementById('salario').value = '';
    
    salvar();
    atualizarTudo();
    renderizarCalendario();
    renderizarLembretes();
    renderizarVicios();
    
    alert('Todos os dados foram apagados!');
}

// ==================== INIT ====================
function initApp() {
    loadTheme();
    initNavigation();
    initPeriodToggle();
    
    if (dados.salario) {
        document.getElementById('salario').value = dados.salario;
    }
    
    document.getElementById('salario').addEventListener('input', () => {
        dados.salario = parseFloat(document.getElementById('salario').value) || 0;
        salvar();
        atualizarTudo();
    });
    
    atualizarTudo();
    renderizarCalendario();
    renderizarLembretes();
    renderizarVicios();
    
    setInterval(atualizarTimers, 1000);
}

// Funções globais para onclick
window.adicionar = adicionar;
window.removerItem = removerItem;
window.fecharMes = fecharMes;
window.apagarMes = apagarMes;
window.mudarMes = mudarMes;
window.adicionarLembrete = adicionarLembrete;
window.removerLembrete = removerLembrete;
window.adicionarVicio = adicionarVicio;
window.resetarVicio = resetarVicio;
window.removerVicio = removerVicio;
window.setTheme = setTheme;
window.limparTudo = limparTudo;
window.logout = logout;
