// Configuração do Gráfico
Chart.register(ChartDataLabels);
let dados = { fixas: [], lazer: [], compras: [], extras: [], anterior: 0 };
let meuGrafico = null;

const f = (v) => v.toLocaleString('pt-br', {style: 'currency', currency: 'BRL'});

// SALVAR NO FIREBASE
async function salvarNaNuvem() {
    if (!window.db) return;
    const docRef = window.doc(window.db, "usuarios", "perfil_magno");
    dados.salario = parseFloat(document.getElementById('salario').value) || 0;
    dados.anterior = parseFloat(document.getElementById('valor-anterior').value) || 0;
    await window.setDoc(docRef, dados);
}

// CARREGAR TUDO AO INICIAR
window.onload = async () => {
    // Espera um pouco o Firebase conectar
    setTimeout(async () => {
        const docRef = window.doc(window.db, "usuarios", "perfil_magno");
        const snap = await window.getDoc(docRef);
        if (snap.exists()) {
            dados = snap.data();
            document.getElementById('salario').value = dados.salario || "";
            document.getElementById('valor-anterior').value = dados.anterior || 0;
        }
        atualizarTudo();
        await carregarHistorico();
    }, 1000);
};

function adicionar(tipo) {
    const nome = document.getElementById(`${tipo}-nome`).value;
    const valor = parseFloat(document.getElementById(`${tipo}-valor`).value);
    const parc = document.getElementById(`${tipo}-parcelas`)?.value;

    if(!nome || isNaN(valor)) return alert("Preencha os campos corretamente!");

    const item = { nome, valor, id: Date.now() };
    if(tipo === 'fixo') item.parcelas = parc ? parseInt(parc) : "Sempre";

    if(tipo === 'fixo') dados.fixas.push(item);
    else if(tipo === 'lazer') dados.lazer.push(item);
    else if(tipo === 'compra') dados.compras.push(item);
    else if(tipo === 'extra') dados.extras.push(item);

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

    const totalDisp = sal + ant + tE;
    const sobra = totalDisp - (gF + gL + gC);

    document.getElementById('display-anterior').innerText = f(ant);
    document.getElementById('res-total').innerText = f(totalDisp);
    document.getElementById('res-sobra').innerText = f(sobra);
    document.getElementById('valor-anterior').value = ant;

    desenharGrafico(gF, gL, gC, sobra > 0 ? sobra : 0);
}

function render(id, lista, tipo) {
    const el = document.getElementById(id);
    el.innerHTML = "";
    lista.forEach(it => {
        const p = it.parcelas ? ` (${it.parcelas}x)` : "";
        el.innerHTML += `<li>${it.nome}${p} <span>${f(it.valor)} <b class="btn-del-small" onclick="remover('${tipo}', ${it.id})">x</b></span></li>`;
    });
    document.getElementById(`total-${tipo === 'fixo' ? 'fixas' : tipo + 's'}`).innerText = f(lista.reduce((a,b)=>a+b.valor,0));
}

function desenharGrafico(fVal, lVal, cVal, sVal) {
    const ctx = document.getElementById('graficoPizza');
    if (!ctx) return;
    
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
        options: {
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold' },
                    formatter: (v) => v > 0 ? f(v) : ""
                }
            }
        }
    });
}

async function fecharMes() {
    const mesAtual = new Intl.DateTimeFormat('pt-BR', {month: 'long'}).format(new Date());
    const gTotal = (dados.fixas.reduce((a,b)=>a+b.valor,0)) + (dados.lazer.reduce((a,b)=>a+b.valor,0)) + (dados.compras.reduce((a,b)=>a+b.valor,0));
    const totalD = (parseFloat(document.getElementById('salario').value) || 0) + (parseFloat(dados.anterior) || 0) + (dados.extras.reduce((a,b)=>a+b.valor,0));
    const sobra = totalD - gTotal;

    if(!confirm(`Fechar ${mesAtual} e salvar no histórico?`)) return;

    // Salva Histórico no Firebase
    const histRef = window.doc(window.db, "usuarios", "perfil_magno", "historico", `${Date.now()}`);
    await window.setDoc(histRef, { mes: mesAtual, sobra, gTotal, data: new Date() });

    // Atualiza dados para novo mês
    dados.anterior = sobra > 0 ? sobra : 0;
    dados.lazer = []; dados.compras = []; dados.extras = [];
    dados.fixas = dados.fixas.map(it => {
        if(typeof it.parcelas === 'number') it.parcelas -= 1;
        return it;
    }).filter(it => it.parcelas === "Sempre" || it.parcelas > 0);

    await salvarNaNuvem();
    alert("Mês arquivado!");
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
                <button class="btn-del-hist" onclick="apagarMes('${d.id}')">Apagar</button>
                <h4>📅 ${h.mes}</h4>
                <p>Gastos: ${f(h.gTotal)}</p>
                <p style="color: green; font-weight:bold">Sobra: ${f(h.sobra)}</p>
            </div>
        `;
    });
}

async function apagarMes(id) {
    if(!confirm("Apagar este registro?")) return;
    await window.deleteDoc(window.doc(window.db, "usuarios", "perfil_magno", "historico", id));
    carregarHistorico();
}

async function limparSistema() {
    if(!confirm("⚠️ AVISO: Isso apaga SEUS DADOS e TODO O HISTÓRICO no Google. Confirmar?")) return;
    const docRef = window.doc(window.db, "usuarios", "perfil_magno");
    await window.deleteDoc(docRef);
    
    // Apaga coleção de histórico
    const colRef = window.collection(window.db, "usuarios", "perfil_magno", "historico");
    const snap = await window.getDocs(colRef);
    for (const d of snap.docs) {
        await window.deleteDoc(window.doc(window.db, "usuarios", "perfil_magno", "historico", d.id));
    }
    
    alert("Sistema totalmente resetado!");
    location.reload();
}

// Tornar funções globais
window.limparSistema = limparSistema;
window.apagarMes = apagarMes;
window.fecharMes = fecharMes;
window.adicionar = adicionar;
window.remover = remover;
window.atualizarTudo = atualizarTudo;
