// ===============================================
// PASSO 1: CONFIGURAÇÃO INICIAL E ELEMENTOS DO HTML
// ===============================================

// Elementos da Interface
const telaLogin = document.getElementById('telaLogin');
const formLogin = document.getElementById('formLogin');
const inputNome = document.getElementById('nome');
const inputEmail = document.getElementById('email');
const inputSenha = document.getElementById('senha');
const inputCelular = document.getElementById('celular');
const sistemaContainer = document.getElementById('sistemaContainer');
const botaoLogout = document.getElementById('botaoLogout');
const menuLinks = document.querySelectorAll('#menuLateral a');
const menuItemUsuarios = document.getElementById('menu-item-usuarios');
const secoesConteudo = document.querySelectorAll('.secao-conteudo');
const filtroUsuariosInput = document.getElementById('filtroUsuarios');
const corpoTabelaUsuarios = document.getElementById('corpoTabelaUsuarios');
const toggleMenuBtn = document.getElementById('toggleMenuBtn');
const themeSwitch = document.getElementById('checkbox');

// Elementos do Jogo
const canvas = document.getElementById('telaJogo');
const ctx = canvas.getContext('2d');
const somDoClique = new Audio('click.mp3'); 

// Elementos de Fim de Jogo e Pausa
const fimDeJogoContainer = document.getElementById('fimDeJogoContainer');
const fimDeJogoTitulo = document.getElementById('fimDeJogoTitulo');
const fimDeJogoMensagem = document.getElementById('fimDeJogoMensagem');
const botaoReiniciar = document.getElementById('botaoReiniciar');
const botaoPausar = document.getElementById('botaoPausar');

// Credenciais do Administrador
const ADMIN_EMAIL = 'admin@senac.com';
const ADMIN_SENHA = 'admin123';

// Variáveis de Estado do Jogo
let pontuacao = 0;
let estadoDoJogo = 'login';
let nivelAtual = 0;
let jogadorAtual = null; 
let cronometro; 
let tempoRestante; 

const PONTUACAO_VITORIA = 3000;
const VELOCIDADE_MAXIMA = 12;

// ===============================================
// PASSO 2: CONFIGURAÇÃO DOS NÍVEIS
// ===============================================

const niveis = [
    { pontuacaoParaPassar: 100,  velocidadeBase: 2, tamanhoAlvo: 50, cor: '#005594', tempo: 20 },
    { pontuacaoParaPassar: 300,  velocidadeBase: 3, tamanhoAlvo: 40, cor: '#0073b1', tempo: 25 },
    { pontuacaoParaPassar: 700,  velocidadeBase: 4, tamanhoAlvo: 30, cor: '#f7941d', tempo: 30 },
    { pontuacaoParaPassar: 3000, velocidadeBase: 5, tamanhoAlvo: 25, cor: '#cc0000', tempo: 35 }
];

// ===============================================
// PASSO 3: GERENCIAMENTO DE DADOS (LOCALSTORAGE)
// ===============================================

function getUsuarios() { return JSON.parse(localStorage.getItem('usuariosJogo')) || []; }
function salvarUsuarios(usuarios) { localStorage.setItem('usuariosJogo', JSON.stringify(usuarios)); }

function cadastrarOuLogarUsuario(nome, email, celular) {
    let usuarios = getUsuarios();
    let usuarioExistente = usuarios.find(u => u.email === email);

    if (usuarioExistente) {
        jogadorAtual = usuarioExistente;
    } else {
        jogadorAtual = {
            id: Date.now(), nome, email, celular,
            dataCadastro: new Date().toLocaleDateString('pt-BR'),
            pontuacaoMaxima: 0, nivelMaximo: 1,
            role: 'player'
        };
        usuarios.push(jogadorAtual);
        salvarUsuarios(usuarios);
    }
    if (!jogadorAtual.role) jogadorAtual.role = 'player';
}

// ===============================================
// PASSO 4: OBJETO DE JOGO E FUNÇÕES DO JOGO
// ===============================================

const alvo = { x: 50, y: 50, largura: 50, altura: 50, cor: '#005594', velocidadeY: 2 };
function resetarPosicaoAlvo() {
    alvo.y = -alvo.altura; 
    alvo.x = Math.random() * (canvas.width - alvo.largura);
}

function iniciarCronometro() {
    clearInterval(cronometro); 
    cronometro = setInterval(() => {
        tempoRestante--;
        if (tempoRestante <= 0 && estadoDoJogo === 'jogando') {
            clearInterval(cronometro);
            estadoDoJogo = 'gameOver';
            atualizarPontuacaoJogador();
        }
    }, 1000);
}

function iniciarNivel(indiceNivel) {
    if (indiceNivel >= niveis.length) return;
    const configNivel = niveis[indiceNivel];
    
    alvo.largura = configNivel.tamanhoAlvo;
    alvo.altura = configNivel.tamanhoAlvo;
    alvo.cor = configNivel.cor;
    alvo.velocidadeY = configNivel.velocidadeBase;
    
    resetarPosicaoAlvo();

    if (!tempoRestante || tempoRestante <= 0) {
        tempoRestante = configNivel.tempo;
    }
    iniciarCronometro();
}


function reiniciarJogo() {
    pontuacao = 0;
    nivelAtual = 0;
    tempoRestante = 0;
    estadoDoJogo = 'jogando';
    fimDeJogoContainer.classList.add('escondido');
    iniciarNivel(nivelAtual);
}

function alternarPausa() {
    if (estadoDoJogo === 'jogando') {
        estadoDoJogo = 'pausado';
        clearInterval(cronometro);
        botaoPausar.textContent = '▶';
        botaoPausar.classList.add('pausado');
    } else if (estadoDoJogo === 'pausado') {
        estadoDoJogo = 'jogando';
        iniciarCronometro();
        botaoPausar.textContent = '❚❚';
        botaoPausar.classList.remove('pausado');
    }
}


// ===============================================
// PASSO 5: LÓGICA DE NAVEGAÇÃO E INTERFACE
// ===============================================

function ajustarTamanhoCanvas() {
    const container = document.getElementById('containerJogo');
    if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }
}

formLogin.addEventListener('submit', function(evento) {
    evento.preventDefault();
    const nome = inputNome.value.trim();
    const email = inputEmail.value.trim();
    const senha = inputSenha.value;
    const celular = inputCelular.value.trim();

    if (email === ADMIN_EMAIL) {
        if (senha === ADMIN_SENHA) {
            jogadorAtual = { nome: 'Administrador', email: ADMIN_EMAIL, role: 'admin' };
            menuItemUsuarios.classList.remove('escondido');
            iniciarSessao();
            mostrarSecao('usuarios');
        } else {
            alert('Senha de administrador incorreta.');
        }
    }
    else {
        if (nome === '' || email === '' || celular === '') {
            alert('Para jogar, seu Nome, E-mail e Celular são obrigatórios!');
            return;
        }
        cadastrarOuLogarUsuario(nome, email, celular);
        menuItemUsuarios.classList.add('escondido');
        iniciarSessao();
        mostrarSecao('jogar');
    }
});

function iniciarSessao() {
    telaLogin.classList.add('escondido');
    sistemaContainer.classList.remove('escondido');
    document.body.classList.add('loggedin');
    ajustarTamanhoCanvas();
    window.addEventListener('resize', ajustarTamanhoCanvas);
    gameLoop(); 
}

botaoLogout.addEventListener('click', () => location.reload());
botaoReiniciar.addEventListener('click', () => {
    fimDeJogoContainer.classList.add('escondido');
    estadoDoJogo = 'preparado';
});
botaoPausar.addEventListener('click', alternarPausa);

if (toggleMenuBtn) { 
    toggleMenuBtn.addEventListener('click', () => {
        const isMobile = window.innerWidth <= 800;
        
        if (isMobile) {
            document.body.classList.toggle('menu-mobile-aberto');
        } else {
            document.body.classList.toggle('menu-fechado');
        }
    });
}

menuLinks.forEach(link => {
    link.addEventListener('click', (evento) => {
        evento.preventDefault();
        const targetId = link.dataset.target;
        mostrarSecao(targetId);

        if (document.body.classList.contains('menu-mobile-aberto')) {
            document.body.classList.remove('menu-mobile-aberto');
        }
    });
});


function mostrarSecao(id) {
    if (id === 'usuarios' && jogadorAtual.role !== 'admin') {
        alert('Acesso negado.');
        return;
    }

    secoesConteudo.forEach(secao => secao.classList.add('escondido'));
    menuLinks.forEach(link => link.classList.remove('active'));
    document.getElementById(id)?.classList.remove('escondido');
    document.querySelector(`a[data-target="${id}"]`)?.classList.add('active');

    if (id === 'dashboard') {
        atualizarIndicadores();
        botaoPausar.classList.add('escondido');
    } else if (id === 'usuarios') {
        popularTabelaUsuarios();
        botaoPausar.classList.add('escondido');
    } else if (id === 'jogar') {
        if (['login', 'inativo', 'gameOver', 'vitoria'].includes(estadoDoJogo)) {
            estadoDoJogo = 'preparado';
        }
        botaoPausar.classList.remove('escondido');
    }
}

function popularTabelaUsuarios() {
    const usuarios = getUsuarios();
    corpoTabelaUsuarios.innerHTML = '';
    usuarios.sort((a, b) => b.pontuacaoMaxima - a.pontuacaoMaxima).forEach(usuario => {
        const celularUsuario = usuario.celular || usuario.telefone || 'Não informado';
        corpoTabelaUsuarios.innerHTML += `<tr><td>${usuario.nome}</td><td>${usuario.email}</td><td>${celularUsuario}</td><td>${usuario.dataCadastro}</td><td>${usuario.pontuacaoMaxima}</td></tr>`;
    });
}

function atualizarIndicadores() {
    const usuarios = getUsuarios();
    const totalUsuarios = usuarios.length;
    let somaPontuacoes = 0, pontuacaoMaximaGlobal = 0, somaNiveis = 0;
    usuarios.forEach(u => {
        somaPontuacoes += u.pontuacaoMaxima;
        if (u.pontuacaoMaxima > pontuacaoMaximaGlobal) pontuacaoMaximaGlobal = u.pontuacaoMaxima;
        somaNiveis += u.nivelMaximo;
    });
    const mediaPontuacao = totalUsuarios > 0 ? (somaPontuacoes / totalUsuarios).toFixed(0) : 0;
    const nivelMedio = totalUsuarios > 0 ? (somaNiveis / totalUsuarios).toFixed(1) : 0;
    document.getElementById('totalUsuarios').textContent = totalUsuarios;
    document.getElementById('mediaPontuacao').textContent = mediaPontuacao;
    document.getElementById('pontuacaoMaximaGlobal').textContent = pontuacaoMaximaGlobal;
    document.getElementById('nivelMedio').textContent = nivelMedio;
}

if (filtroUsuariosInput) { filtroUsuariosInput.addEventListener('keyup', () => {
    const termoBusca = filtroUsuariosInput.value.toLowerCase();
    for (let linha of corpoTabelaUsuarios.rows) {
        const nomeUsuario = linha.cells[0]?.textContent.toLowerCase() || '';
        linha.style.display = nomeUsuario.includes(termoBusca) ? '' : 'none';
    }
});}

if (themeSwitch) {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeSwitch.checked = true;
    }
    themeSwitch.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });
}

// ===============================================
// PASSO 6: LÓGICA DE CONTROLES (TECLADO E MOUSE)
// ===============================================

window.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
        if (estadoDoJogo === 'jogando' || estadoDoJogo === 'pausado') {
            alternarPausa();
        }
    }
    if (evento.key === 'Enter' || evento.code === 'Space') {
        if (estadoDoJogo === 'nivelConcluido') {
            evento.preventDefault();
            nivelAtual++;
            estadoDoJogo = 'jogando';
            iniciarNivel(nivelAtual);
        }
    }
});

function tratarCliqueOuToque(evento) {
    evento.preventDefault(); 
    if (estadoDoJogo === 'nivelConcluido') {
        nivelAtual++;
        estadoDoJogo = 'jogando';
        iniciarNivel(nivelAtual);
        return;
    }
    if (estadoDoJogo === 'preparado') { reiniciarJogo(); return; }
    if (estadoDoJogo !== 'jogando') return;
    const rect = canvas.getBoundingClientRect();
    const clientX = evento.touches ? evento.touches[0].clientX : evento.clientX;
    const clientY = evento.touches ? evento.touches[0].clientY : evento.clientY;
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    const padding = 15; 
    if (mouseX >= alvo.x - padding && mouseX <= alvo.x + alvo.largura + padding &&
        mouseY >= alvo.y - padding && mouseY <= alvo.y + alvo.altura + padding) {
        somDoClique.currentTime = 0;
        somDoClique.play().catch(e => console.log("Erro ao tocar som:", e));
        pontuacao += 10;
        tempoRestante += 2; 
        alvo.velocidadeY += 0.04; 
        if (alvo.velocidadeY > VELOCIDADE_MAXIMA) alvo.velocidadeY = VELOCIDADE_MAXIMA;
        resetarPosicaoAlvo();
        if (nivelAtual < niveis.length && pontuacao >= niveis[nivelAtual].pontuacaoParaPassar) {
            if (pontuacao < PONTUACAO_VITORIA) {
                 estadoDoJogo = 'nivelConcluido';
                 clearInterval(cronometro); 
            }
        }
        if (pontuacao >= PONTUACAO_VITORIA) {
            estadoDoJogo = 'vitoria';
            atualizarPontuacaoJogador();
        }
    }
}

canvas.addEventListener('click', tratarCliqueOuToque);
canvas.addEventListener('touchstart', tratarCliqueOuToque, { passive: false });

// ===============================================
// PASSO 7: GAME LOOP PRINCIPAL
// ===============================================

function gameLoop() {
    requestAnimationFrame(gameLoop);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const fundoCor = document.body.classList.contains('dark-mode') ? '#1f2a47' : '#f0f2f5';
    ctx.fillStyle = fundoCor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (estadoDoJogo === 'preparado') {
        fimDeJogoContainer.classList.add('escondido');
        ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#E0E0E0' : '#333';
        ctx.textAlign = 'center';
        ctx.font = 'bold 30px Poppins, sans-serif';
        ctx.fillText('Clique para Iniciar', canvas.width / 2, canvas.height / 2);
        ctx.font = '20px Poppins, sans-serif';
        ctx.fillText(`Seu recorde atual: ${jogadorAtual?.pontuacaoMaxima || 0}`, canvas.width / 2, canvas.height / 2 + 40);
    }
    else if (estadoDoJogo === 'nivelConcluido') {
        const proximoNivel = nivelAtual + 2;
        ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#E0E0E0' : '#333';
        ctx.textAlign = 'center';
        ctx.font = 'bold 30px Poppins, sans-serif';
        ctx.fillText(`Parabéns, você concluiu o Nível ${nivelAtual + 1}!`, canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '20px Poppins, sans-serif';
        ctx.fillText(`Pressione Enter ou Toque na Tela para o Nível ${proximoNivel}`, canvas.width / 2, canvas.height / 2 + 30);
    }
    else if (estadoDoJogo === 'pausado') {
        ctx.fillStyle = alvo.cor;
        ctx.fillRect(alvo.x, alvo.y, alvo.largura, alvo.altura);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.font = 'bold 50px Poppins, sans-serif';
        ctx.fillText('PAUSADO', canvas.width / 2, canvas.height / 2);
    }
    else if (estadoDoJogo === 'jogando') {
        alvo.y += alvo.velocidadeY;
        if (alvo.y > canvas.height) {
            tempoRestante -= 2;
            resetarPosicaoAlvo();
        }
        ctx.fillStyle = alvo.cor;
        ctx.fillRect(alvo.x, alvo.y, alvo.largura, alvo.altura);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, 50);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        let tamanhoFonte = canvas.width < 600 ? 14 : 20;
        let yPosTexto = 32;
        ctx.font = `bold ${tamanhoFonte}px Poppins, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`Pontos: ${pontuacao}`, 15, yPosTexto);
        ctx.textAlign = 'center';
        ctx.fillText(`Recorde: ${jogadorAtual?.pontuacaoMaxima || 0}`, canvas.width / 2, yPosTexto);
        ctx.textAlign = 'right';
        ctx.fillText(`Nível: ${nivelAtual + 1} | Tempo: ${Math.max(0, tempoRestante)}`, canvas.width - 15, yPosTexto);
        ctx.shadowColor = 'transparent';
    } else if (estadoDoJogo === 'vitoria' || estadoDoJogo === 'gameOver') {
        fimDeJogoContainer.classList.remove('escondido');
        if (estadoDoJogo === 'vitoria') {
            fimDeJogoTitulo.textContent = 'PARABÉNS!';
            fimDeJogoMensagem.textContent = `Você atingiu ${pontuacao} pontos e concluiu o jogo! Novo recorde: ${jogadorAtual.pontuacaoMaxima}`;
        } else { 
            fimDeJogoTitulo.textContent = 'GAME OVER';
            fimDeJogoMensagem.textContent = `O tempo acabou! Sua pontuação foi ${pontuacao}. Tente novamente!`;
        }
        clearInterval(cronometro);
    }
}