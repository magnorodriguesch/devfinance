let dados = { salario: 0, fixas: [], lazer: [], compras: [], extras: [], anterior: 0 };

// Função para formatar dinheiro
const f = (v) => v.toLocaleString('pt-br', {style: 'currency', currency: 'BRL'});

// SALVAR NA NUVEM
async function salvarNaNuvem() {
    const docRef = window.doc(window.db, "usuarios", "perfil_magno");
    await window.setDoc(docRef, dados);
}

// CARREGAR DA NUVEM
async function carregarDaNuvem() {
    const docRef = window.doc(window.db, "usuarios", "perfil_magno");
    const snap = await window.getDoc(docRef);
    if (snap.exists()) {
        dados = snap.data();
        document.getElementById('salario').value = dados.salario || "";
        document.getElementById('valor-anterior').value = dados.anterior || 0;
        atualizarTudo();
    }
}

// ZERAR TUDO (CORRIGIDO)
async function limparSistema() {
    if(!confirm("⚠️ ISSO VAI APAGAR TUDO (incluindo histórico)! Tem certeza?")) return;
    
    // Limpa Objeto
    dados = { salario: 0, fixas: [], lazer: [], compras: [], extras: [], anterior: 0 };
    
    // Limpa Firestore principal
    await window.deleteDoc(window.doc(window.db, "usuarios", "perfil_magno"));
    
    // Limpa campos da tela
    document.getElementById('salario').value = "";
    document.getElementById('valor-anterior').value = 0;
    
    atualizarTudo();
    alert("Sistema resetado com sucesso!");
    location.reload(); // Recarrega para limpar histórico da tela
}

// ADICIONAR ITEM
function adicionar(tipo) {
    const nome = document.getElementById(`${tipo}-nome`).value;
    const valor = parseFloat(document.getElementById(`${tipo}-valor`).value);
    const parc = document.getElementById(`${tipo}-parcelas`)?.value;

    if(!nome || !valor) return alert("Preencha nome e valor!");

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

// FECHAR MÊS E SALVAR HISTÓRICO
async function fecharMes() {
    const mesAtual = new Intl.DateTimeFormat('pt-BR', {month: 'long'}).format(new Date());
    const totalGasto = (dados.fixas.reduce((a,b)=>a+b.valor,0)) + (dados.lazer.reduce((a,b)=>a+b.valor,0)) + (dados.compras.reduce((a,b)=>a+b.valor,0));
    const sobra = (parseFloat(document.getElementById('salario').value) || 0) + (parseFloat(dados.anterior) || 0) + (dados.extras.reduce((a,b)=>a+b.valor,0)) - totalGasto;

    if(!confirm(`Deseja encerrar ${mesAtual}?`)) return;

    // Salva no Histórico
    const histRef = window.doc(window.db, "usuarios", "perfil_magno", "historico", `${mesAtual}_${Date.now()}`);
    await window.setDoc(histRef, { mes: mesAtual, sobra, totalGasto, data: new Date() });

    // Lógica de parcelas e reset
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

// CARREGAR E APAGAR HISTÓRICO
async function carregarHistorico() {
    const colRef = window.collection(window.db, "usuarios", "perfil_magno", "historico");
    const snap = await window.getDocs(colRef);
    const container = document.getElementById('lista-historico');
    container.innerHTML = "";

    snap.forEach((d) => {
        const h = d.data();
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <button class="btn-delete-hist" onclick="apagarMes('${d.id}')">Apagar</button>
            <h4>📅 ${h.mes}</h4>
            <p>Gastos: ${f(h.totalGasto)}</p>
            <p style="color: green">Sobra: ${f(h.sobra)}</p>
        `;
        container.appendChild(div);
    });
}

async function apagarMes(id) {
    if(!confirm("Apagar este mês do histórico?")) return;
    await window.deleteDoc(window.doc(window.db, "usuarios", "perfil_magno", "historico", id));
    carregarHistorico();
}

// Tornar apagarMes global
window.apagarMes = apagarMes;

// INICIALIZAÇÃO
window.onload = async () => {
    await carregarDaNuvem();
    await carregarHistorico();
};

// ... (Mantenha as funções de atualizarTudo e Grafico que já tínhamos) ...
