Chart.register(ChartDataLabels);
let dados = { fixas: [], lazer: [], compras: [], extras: [] };
let grafico = null;

// Carrega do Google assim que abre
window.onload = async () => {
    await carregarDaNuvem();
};

async function adicionar(tipo) {
    const nome = document.getElementById(`${tipo === 'fixo' ? 'fixa' : tipo}-nome`).value;
    const valor = parseFloat(document.getElementById(`${tipo === 'fixo' ? 'fixa' : tipo}-valor`).value);
    const parcEl = document.getElementById('fixa-parcelas');
    
    if (!nome || isNaN(valor)) return;

    const item = { 
        nome, valor, 
        parcelas: (tipo === 'fixo' && parcEl.value) ? parseInt(parcEl.value) : "Sempre" 
    };

    if(tipo === 'fixo') dados.fixas.push(item);
    else if(tipo === 'lazer') dados.lazer.push(item);
    else if(tipo === 'compra') dados.compras.push(item);
    else dados.extras.push(item);

    atualizarTudo();
    salvarNaNuvem();
}

async function fecharMes() {
    const sal = parseFloat(document.getElementById('salario').value) || 0;
    const ant = parseFloat(document.getElementById('valor-anterior').value) || 0;
    const tE = dados.extras.reduce((a, b) => a + b.valor, 0);
    const gastos = dados.fixas.reduce((a,b)=>a+b.valor,0) + dados.lazer.reduce((a,b)=>a+b.valor,0) + dados.compras.reduce((a,b)=>a+b.valor,0);
    const sobra = (sal + ant + tE) - gastos;

    if(!confirm(`Fechar mês? Sobra de R$ ${sobra.toFixed(2)} será acumulada.`)) return;

    document.getElementById('valor-anterior').value = sobra > 0 ? sobra : 0;

    // Abatimento de Parcelas (image_79eb01.png)
    dados.fixas = dados.fixas.map(it => {
        if(typeof it.parcelas === 'number') it.parcelas -= 1;
        return it;
    }).filter(it => it.parcelas === "Sempre" || it.parcelas > 0);

    dados.lazer = []; dados.compras = []; dados.extras = [];
    
    atualizarTudo();
    await salvarNaNuvem();
    alert("Mês encerrado e dados salvos no Google!");
}

function atualizarTudo() {
    renderizar('lista-fixas', dados.fixas, 'fixo');
    renderizar('lista-lazer', dados.lazer, 'lazer');
    renderizar('lista-compras', dados.compras, 'compra');
    renderizar('lista-extras', dados.extras, 'extra');

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

    desenharGrafico(gF, gL, gC, sobra);
}

function desenharGrafico(fVal, lVal, cVal, sVal) {
    const ctx = document.getElementById('graficoPizza').getContext('2d');
    if (grafico) grafico.destroy();
    grafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Fixos', 'Lazer', 'Compras', 'Sobra'],
            datasets: [{
                data: [fVal, lVal, cVal, sVal > 0 ? sVal : 0],
                backgroundColor: ['#3182ce', '#d69e2e', '#805ad5', '#48bb78']
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    color: '#fff', font: { weight: 'bold' },
                    formatter: (v) => v > 0 ? f(v) : ""
                }
            }
        }
    });
}

function renderizar(id, lista, tipo) {
    const el = document.getElementById(id);
    el.innerHTML = "";
    lista.forEach((it, i) => {
        const p = it.parcelas === "Sempre" ? "" : ` (${it.parcelas}x)`;
        el.innerHTML += `<li>${it.nome}${p} <span>${f(it.valor)} <b onclick="remover('${tipo}',${i})" style="color:red;cursor:pointer">x</b></span></li>`;
    });
}

function f(v) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

async function remover(t, i) { 
    const key = t === 'fixo' ? 'fixas' : t === 'lazer' ? 'lazer' : t === 'compra' ? 'compras' : 'extras';
    dados[key].splice(i, 1); 
    atualizarTudo(); 
    await salvarNaNuvem();
}

async function salvarNaNuvem() {
    const docRef = window.doc(window.db, "usuarios", "perfil_magno");
    await window.setDoc(docRef, {
        dados, 
        salario: document.getElementById('salario').value,
        saldoAnterior: document.getElementById('valor-anterior').value
    });
}

async function carregarDaNuvem() {
    const docRef = window.doc(window.db, "usuarios", "perfil_magno");
    const snap = await window.getDoc(docRef);
    if (snap.exists()) {
        const info = snap.data();
        dados = info.dados;
        document.getElementById('salario').value = info.salario;
        document.getElementById('valor-anterior').value = info.saldoAnterior;
        atualizarTudo();
    }
}

function limparSistema() { if(confirm("Zerar tudo no Google?")) { dados = {fixas:[],lazer:[],compras:[],extras:[]}; salvarNaNuvem(); location.reload(); } }