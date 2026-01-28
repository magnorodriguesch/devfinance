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

// Tornar funções globais para os onclick do HTML
window.adicionar = adicionar;
window.fecharMes = fecharMes;
window.limparSistema = limparSistema;
window.atualizarTudo = atualizarTudo;
window.removerItem = removerItem;

// Variável global do gráfico
let grafico = null;

// REMOVER ITEM
function removerItem(tipo, id) {
    if(tipo === 'fixo') dados.fixas = dados.fixas.filter(i => i.id !== id);
    else if(tipo === 'lazer') dados.lazer = dados.lazer.filter(i => i.id !== id);
    else if(tipo === 'compra') dados.compras = dados.compras.filter(i => i.id !== id);
    else if(tipo === 'extra') dados.extras = dados.extras.filter(i => i.id !== id);
    
    atualizarTudo();
    salvarNaNuvem();
}

// ATUALIZAR TUDO (Interface + Gráfico)
function atualizarTudo() {
    // Atualiza salário no objeto
    dados.salario = parseFloat(document.getElementById('salario').value) || 0;
    
    // Renderiza listas
    renderizarLista('lista-fixas', dados.fixas, 'fixo');
    renderizarLista('lista-lazer', dados.lazer, 'lazer');
    renderizarLista('lista-compras', dados.compras, 'compra');
    renderizarLista('lista-extras', dados.extras, 'extra');
    
    // Calcula totais
    const totalFixas = dados.fixas.reduce((a, b) => a + b.valor, 0);
    const totalLazer = dados.lazer.reduce((a, b) => a + b.valor, 0);
    const totalCompras = dados.compras.reduce((a, b) => a + b.valor, 0);
    const totalExtras = dados.extras.reduce((a, b) => a + b.valor, 0);
    
    // Exibe totais nas categorias
    document.getElementById('total-fixas').textContent = f(totalFixas);
    document.getElementById('total-lazer').textContent = f(totalLazer);
    document.getElementById('total-compras').textContent = f(totalCompras);
    document.getElementById('total-extras').textContent = f(totalExtras);
    
    // Calcula saldos
    const anterior = parseFloat(document.getElementById('valor-anterior').value) || 0;
    const totalEntradas = dados.salario + anterior + totalExtras;
    const totalGastos = totalFixas + totalLazer + totalCompras;
    const sobra = totalEntradas - totalGastos;
    
    // Exibe saldos
    document.getElementById('display-anterior').textContent = f(anterior);
    document.getElementById('res-total').textContent = f(totalEntradas);
    document.getElementById('res-sobra').textContent = f(sobra);
    document.getElementById('res-sobra').style.color = sobra >= 0 ? '#38a169' : '#e53e3e';
    
    // Atualiza gráfico
    atualizarGrafico(totalFixas, totalLazer, totalCompras, totalExtras, sobra > 0 ? sobra : 0);
}

// RENDERIZAR LISTA
function renderizarLista(elementoId, array, tipo) {
    const ul = document.getElementById(elementoId);
    ul.innerHTML = '';
    
    array.forEach(item => {
        const li = document.createElement('li');
        const parcText = item.parcelas !== undefined ? 
            (item.parcelas === "Sempre" ? " (Fixo)" : ` (${item.parcelas}x)`) : '';
        
        li.innerHTML = `
            <span>${item.nome}${parcText}</span>
            <span>
                ${f(item.valor)}
                <span class="btn-del-small" onclick="removerItem('${tipo}', ${item.id})">X</span>
            </span>
        `;
        ul.appendChild(li);
    });
}

// ATUALIZAR GRÁFICO
function atualizarGrafico(fixas, lazer, compras, extras, sobra) {
    const ctx = document.getElementById('graficoPizza').getContext('2d');
    
    // Destrói gráfico anterior se existir
    if(grafico) {
        grafico.destroy();
    }
    
    const temDados = fixas > 0 || lazer > 0 || compras > 0 || extras > 0 || sobra > 0;
    
    if(!temDados) {
        // Gráfico vazio - mostra mensagem
        grafico = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Sem dados'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#e2e8f0'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
        return;
    }
    
    grafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Contas Fixas', 'Lazer', 'Compras', 'Ganhos Extras', 'Sobra'],
            datasets: [{
                data: [fixas, lazer, compras, extras, sobra],
                backgroundColor: [
                    '#3182ce', // Azul - Fixas
                    '#d69e2e', // Amarelo - Lazer
                    '#805ad5', // Roxo - Compras
                    '#38a169', // Verde - Extras
                    '#48bb78'  // Verde claro - Sobra
                ],
                borderColor: '#ffffff',
                borderWidth: 3,
                hoverOffset: 10
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
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            family: "'Poppins', sans-serif",
                            size: 12
                        },
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    return {
                                        text: `${label}: ${f(value)}`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        hidden: value === 0,
                                        index: i
                                    };
                                }).filter(item => !item.hidden);
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(45, 55, 72, 0.95)',
                    titleFont: { family: "'Poppins', sans-serif", size: 14, weight: 'bold' },
                    bodyFont: { family: "'Poppins', sans-serif", size: 13 },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const value = context.raw;
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return ` ${f(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true
            }
        }
    });
}

// INICIALIZAÇÃO
window.onload = async () => {
    await carregarDaNuvem();
    await carregarHistorico();
    atualizarTudo();
};
