// Inicialização global
let dados = { fixas: [], lazer: [], compras: [], extras: [], anterior: 0 };
let meuGrafico = null;
const f = (v) => v.toLocaleString('pt-br', {style: 'currency', currency: 'BRL'});

// Carregamento inicial (Firebase)
window.onload = async () => {
    // Tenta carregar dados, mas não trava se falhar
    try {
        const docRef = window.doc(window.db, "usuarios", "perfil_magno");
        const snap = await window.getDoc(docRef);
        if (snap.exists()) {
            dados = snap.data();
            document.getElementById('salario').value = dados.salario || "";
            document.getElementById('valor-anterior').value = dados.anterior || 0;
        }
    } catch (e) { console.log("Aguardando Firebase..."); }
    
    atualizarTudo();
    carregarHistorico();
};

function adicionar(tipo) {
    const nome = document.getElementById(`${tipo}-nome`).value;
    const valor = parseFloat(document.getElementById(`${tipo}-valor`).value);
    const parc = document.getElementById(`${tipo}-parcelas`)?.value;

    if(!nome || isNaN(valor)) return alert("Preencha nome e valor!");

    const item = { nome, valor, id: Date.now() };
    if(tipo === 'fixo') item.parcelas = parc ? parseInt(parc) : "Sempre";

    // Adiciona na lista correta
    if(tipo === 'fixo') dados.fixas.push(item);
    else if(tipo === 'lazer') dados.lazer.push(item);
    else if(tipo === 'compra') dados.compras.push(item);
    else if(tipo === 'extra') dados.extras.push(item);

    // Limpa campos
    document.getElementById(`${tipo}-nome`).value = "";
    document.getElementById(`${tipo}-valor`).value = "";
    
    atualizarTudo();
    salvarNaNuvem();
}

function remover(tipo, id) {
    const lista = tipo === 'fixo' ? 'fixas' : tipo === 'lazer' ? 'lazer' : tipo === 'compra' ? 'compras' : 'extras';
    dados[lista] = dados[lista].filter(it => it.id !== id);
    atualizarTudo();
    salvarNaNuvem();
}

function atualizarTudo() {
    render('lista-fixas', dados.fixas, 'fixo');
    render('lista-lazer', dados.lazer, 'lazer');
    render('lista-compras', dados.compras, 'compra');
    render('lista-extras', dados.extras, 'extra');

    const sal = parseFloat(document.getElementById('salario').value) || 0;
    const ant = parseFloat(document.getElementById('valor-anterior').value) || 0;
    const tE = dados.extras.reduce((a,b)=>a+b.valor,0);
    const gF = dados.fixas.reduce((a,b)=>a+b.valor,0);
    const gL = dados.lazer.reduce((a,b)=>a+b.valor,0);
    const gC = dados.compras.reduce((a,b)=>a+b.valor,0);

    const sobra = (sal + ant + tE) - (gF + gL + gC);

    document.getElementById('display-anterior').innerText = f(ant);
    document.getElementById('res-total').innerText = f(sal + ant + tE);
    document.getElementById('res-sobra').innerText = f(sobra);

    desenharGrafico(gF, gL, gC, sobra > 0 ? sobra : 0);
}

function render(id, lista, tipo) {
    const el = document.getElementById(id);
    el.innerHTML = "";
    lista.forEach(it => {
        el.innerHTML += `<li>${it.nome} <span>${f(it.valor)} <b style="color:red;cursor:pointer" onclick="remover('${tipo}', ${it.id})">x</b></span></li>`;
    });
    const totalId = `total-${tipo === 'fixo' ? 'fixas' : tipo + 's'}`;
    document.getElementById(totalId).innerText = f(lista.reduce((a,b)=>a+b.valor,0));
}

function desenharGrafico(fVal, lVal, cVal, sVal) {
    const ctx = document.getElementById('graficoPizza');
    if (meuGrafico) meuGrafico.destroy();
    meuGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Fixos', 'Lazer', 'Compras', 'Sobra'],
            datasets: [{
                data: [fVal, lVal, cVal, sVal],
                backgroundColor: ['#3182ce', '#d69e2e', '#805ad5', '#48bb78']
            }]
        },
        options: { maintainAspectRatio: false }
    });
}

async function salvarNaNuvem() {
    const docRef = window.doc(window.db, "usuarios", "perfil_magno");
    dados.salario = parseFloat(document.getElementById('salario').value) || 0;
    dados.anterior = parseFloat(document.getElementById('valor-anterior').value) || 0;
    await window.setDoc(docRef, dados);
}

async function fecharMes() {
    if(!confirm("Deseja fechar o mês?")) return;
    const mesAtual = new Intl.DateTimeFormat('pt-BR', {month: 'long'}).format(new Date());
    const gTotal = (dados.fixas.reduce((a,b)=>a+b.valor,0)) + (dados.lazer.reduce((a,b)=>a+b.valor,0)) + (dados.compras.reduce((a,b)=>a+b.valor,0));
    const sobra = (parseFloat(document.getElementById('salario').value) || 0) + (parseFloat(dados.anterior) || 0) + (dados.extras.reduce((a,b)=>a+b.valor,0)) - gTotal;

    const histRef = window.doc(window.db, "usuarios", "perfil_magno", "historico", `${Date.now()}`);
    await window.setDoc(histRef, { mes: mesAtual, sobra, gTotal });

    dados.anterior = sobra > 0 ? sobra : 0;
    dados.lazer = []; dados.compras = []; dados.extras = [];
    dados.fixas = dados.fixas.map(it => {
        if(typeof it.parcelas === 'number') it.parcelas -= 1;
        return it;
    }).filter(it => it.parcelas === "Sempre" || it.parcelas > 0);

    await salvarNaNuvem();
    location.reload();
}

async function carregarHistorico() {
    const container = document.getElementById('lista-historico');
    const colRef = window.collection(window.db, "usuarios", "perfil_magno", "historico");
    const snap = await window.getDocs(colRef);
    container.innerHTML = "";
    snap.forEach(d => {
        const h = d.data();
        container.innerHTML += `
            <div class="history-item">
                <button class="btn-del-hist" onclick="apagarMes('${d.id}')">x</button>
                <h4>${h.mes}</h4>
                <p>Gasto: ${f(h.gTotal)}</p>
                <p style="color:green">Sobra: ${f(h.sobra)}</p>
            </div>`;
    });
}

async function apagarMes(id) {
    await window.deleteDoc(window.doc(window.db, "usuarios", "perfil_magno", "historico", id));
    carregarHistorico();
}

async function limparSistema() {
    if(!confirm("Zerar tudo?")) return;
    await window.deleteDoc(window.doc(window.db, "usuarios", "perfil_magno"));
    location.reload();
}

// Globaliza funções
window.adicionar = adicionar; window.remover = remover; window.fecharMes = fecharMes; 
window.apagarMes = apagarMes; window.limparSistema = limparSistema; window.atualizarTudo = atualizarTudo;
