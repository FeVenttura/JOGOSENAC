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
let geradorDeAlvosInterval; 

const VELOCIDADE_MAXIMA = 18;

const CURSOS_ALVO = ['ADS', 'Administração', 'Enfermagem', 'Processos Gerenciais', 'Gastronomia', 'Estética', 'Farmácia', 'Radiologia', 'Recursos Humanos', 'Meio Ambiente', 'Secretariado', 'Logística', 'Internet das Coisas'];
const ITEM_PERIGO = '💣';


// ===============================================
// PASSO 2: CONFIGURAÇÃO DOS NÍVEIS
// ===============================================

const PONTUACAO_VITORIA = 2500;

// ALTERADO: Adicionado 'intervaloGeracao' para controlar o fluxo de palavras
const niveis = [
    { pontuacaoParaPassar: 100,  velocidadeBase: 3.5, cor: '#005594', tempo: 40, intervaloGeracao: 1200 }, // ms
    { pontuacaoParaPassar: 300,  velocidadeBase: 4.5, cor: '#0073b1', tempo: 35, intervaloGeracao: 1000 },
    { pontuacaoParaPassar: 600,  velocidadeBase: 5.5, cor: '#f7941d', tempo: 30, intervaloGeracao: 900 },
    { pontuacaoParaPassar: 1000, velocidadeBase: 6.5, cor: '#d9534f', tempo: 25, intervaloGeracao: 800 },
    { pontuacaoParaPassar: 1600, velocidadeBase: 7.5, cor: '#cc0000', tempo: 20, intervaloGeracao: 700 },
    { pontuacaoParaPassar: 2500, velocidadeBase: 8.5, cor: '#8c0000', tempo: 20, intervaloGeracao: 600 }
];

// ===============================================
// PASSO 3: GERENCIAMENTO DE DADOS
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

function atualizarPontuacaoJogador() {
    if (!jogadorAtual || jogadorAtual.role !== 'player') return;

    let usuarios = getUsuarios();
    let usuarioParaAtualizar = usuarios.find(u => u.id === jogadorAtual.id);

    if (usuarioParaAtualizar) {
        if (pontuacao > usuarioParaAtualizar.pontuacaoMaxima) {
            usuarioParaAtualizar.pontuacaoMaxima = pontuacao;
            jogadorAtual.pontuacaoMaxima = pontuacao;
        }
        usuarioParaAtualizar.nivelMaximo = Math.max(usuarioParaAtualizar.nivelMaximo, nivelAtual + 1);
        salvarUsuarios(usuarios);
    }
}


// ===============================================
// PASSO 4: OBJETO DE JOGO E FUNÇÕES DO JOGO
// ===============================================

// Array de alvos
let alvos = [];

// Esta função agora CRIA um novo alvo e o adiciona ao array
function criarNovoAlvo() {
    if (estadoDoJogo !== 'jogando') return;

    const configNivel = niveis[nivelAtual];
    let texto, tamanhoFonte;

    // Decide se é bomba ou curso
    if (Math.random() < 0.35) {
        texto = ITEM_PERIGO;
        tamanhoFonte = 32;
    } else {
        texto = CURSOS_ALVO[Math.floor(Math.random() * CURSOS_ALVO.length)];
        tamanhoFonte = 22;
    }
    
    // Calcula o hitbox
    ctx.font = `bold ${tamanhoFonte}px Gotham, Poppins, sans-serif`;
    const textMetrics = ctx.measureText(texto);
    const largura = textMetrics.width + 20;
    const altura = tamanhoFonte + 20;
    const x = Math.random() * (canvas.width - largura);
    
    // Cria e adiciona o novo alvo ao array
    alvos.push({
        x: x,
        y: -altura,
        largura: largura,
        altura: altura,
        cor: configNivel.cor,
        velocidadeY: configNivel.velocidadeBase,
        texto: texto
    });
}

// Função para controlar o intervalo de geração de alvos
function iniciarGeradorDeAlvos() {
    clearInterval(geradorDeAlvosInterval);
    const intervalo = niveis[nivelAtual].intervaloGeracao;
    geradorDeAlvosInterval = setInterval(criarNovoAlvo, intervalo);
}

function iniciarCronometro() {
    clearInterval(cronometro); 
    cronometro = setInterval(() => {
        tempoRestante--;
        if (tempoRestante <= 0 && estadoDoJogo === 'jogando') {
            clearInterval(geradorDeAlvosInterval);
            clearInterval(cronometro);
            estadoDoJogo = 'gameOver';
            atualizarPontuacaoJogador();
        }
    }, 1000);
}

function iniciarNivel(indiceNivel) {
    if (indiceNivel >= niveis.length) return;
    const configNivel = niveis[indiceNivel];
    
    // Limpa os alvos da tela anterior
    alvos = []; 
    
    // O tempo REINICIA a cada nível
    tempoRestante = configNivel.tempo;
    
    iniciarCronometro();
    iniciarGeradorDeAlvos(); // Inicia o novo fluxo de palavras
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
        clearInterval(geradorDeAlvosInterval); // Pausa a geração de novos alvos
        botaoPausar.textContent = '▶';
        botaoPausar.classList.add('pausado');
    } else if (estadoDoJogo === 'pausado') {
        estadoDoJogo = 'jogando';
        iniciarCronometro();
        iniciarGeradorDeAlvos(); // Retoma a geração de novos alvos
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
        estadoDoJogo = 'preparado'; 
        iniciarSessao();
        mostrarSecao('jogar');
    }
});

function iniciarSessao() {
    sessionStorage.setItem('jogadorLogado', JSON.stringify(jogadorAtual));
    telaLogin.classList.add('escondido');
    sistemaContainer.classList.remove('escondido');
    document.body.classList.add('loggedin');

    configurarInterfacePorRole();
    ajustarTamanhoCanvas();
    window.addEventListener('resize', ajustarTamanhoCanvas);
    
    if (typeof gameLoop.initialized === 'undefined') {
        gameLoop();
        gameLoop.initialized = true;
    }
}

botaoLogout.addEventListener('click', () => {
    sessionStorage.removeItem('jogadorLogado');
    location.reload();
});

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

function configurarInterfacePorRole() {
    if(jogadorAtual.role === 'admin') {
        menuItemUsuarios.classList.remove('escondido');
    } else {
        menuItemUsuarios.classList.add('escondido');
    }
}

// ===============================================
// PASSO 6: LÓGICA DE CONTROLES E INICIALIZAÇÃO
// ===============================================

window.addEventListener('load', () => {
    const jogadorSalvo = sessionStorage.getItem('jogadorLogado');
    if (jogadorSalvo) {
        jogadorAtual = JSON.parse(jogadorSalvo);
        estadoDoJogo = 'preparado';
        iniciarSessao();
        const telaInicial = jogadorAtual.role === 'admin' ? 'usuarios' : 'jogar';
        mostrarSecao(telaInicial);
    }
});


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

// Itera sobre múltiplos alvos
function tratarCliqueOuToque(evento) {
    evento.preventDefault(); 
    
    if (estadoDoJogo === 'nivelConcluido') {
        if (evento.type === 'touchstart' || evento.type === 'click') { // Permitindo clique também para desktop
            nivelAtual++;
            estadoDoJogo = 'jogando';
            iniciarNivel(nivelAtual);
        }
        return; 
    }
    
    if (estadoDoJogo === 'preparado') { 
        reiniciarJogo(); 
        return; 
    }
    
    if (estadoDoJogo !== 'jogando') return;

    const rect = canvas.getBoundingClientRect();
    const clientX = evento.touches ? evento.touches[0].clientX : evento.clientX;
    const clientY = evento.touches ? evento.touches[0].clientY : evento.clientY;
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    
    // Itera de trás para frente para poder remover itens com segurança
    for (let i = alvos.length - 1; i >= 0; i--) {
        const alvo = alvos[i];
        if (mouseX >= alvo.x && mouseX <= alvo.x + alvo.largura &&
            mouseY >= alvo.y && mouseY <= alvo.y + alvo.altura) {
            
            somDoClique.currentTime = 0;
            somDoClique.play().catch(e => console.log("Erro ao tocar som:", e));
            
            if (alvo.texto === ITEM_PERIGO) {
                tempoRestante -= 2;
            } else {
                pontuacao += 10;
                tempoRestante += 2; 
                
                if (nivelAtual < niveis.length - 1 && pontuacao >= niveis[nivelAtual].pontuacaoParaPassar) {
                    estadoDoJogo = 'nivelConcluido';
                    clearInterval(cronometro);
                    clearInterval(geradorDeAlvosInterval);
                } else if (pontuacao >= PONTUACAO_VITORIA) {
                    estadoDoJogo = 'vitoria';
                    clearInterval(cronometro);
                    clearInterval(geradorDeAlvosInterval);
                    atualizarPontuacaoJogador();
                }
            }
            
            alvos.splice(i, 1); // Remove o alvo clicado
            return; // Sai da função após o primeiro acerto para evitar múltiplos cliques
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
        ctx.fillText(`Clique ou Pressione Enter para o Nível ${proximoNivel}`, canvas.width / 2, canvas.height / 2 + 30);
    }
    else if (estadoDoJogo === 'pausado') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.font = 'bold 50px Gotham, Poppins, sans-serif';
        ctx.fillText('PAUSADO', canvas.width / 2, canvas.height / 2);
    }
    else if (estadoDoJogo === 'jogando') {
        // Itera sobre todos os alvos para movê-los e desenhá-los
        for (let i = alvos.length - 1; i >= 0; i--) {
            const alvo = alvos[i];
            alvo.y += alvo.velocidadeY;

            // Se o alvo saiu da tela
            if (alvo.y > canvas.height) {
                if (alvo.texto !== ITEM_PERIGO) {
                    tempoRestante -= 2;
                }
                alvos.splice(i, 1); // Remove o alvo
                continue; // Pula para a próxima iteração
            }
            
            let tamanhoFonte;
            if (alvo.texto === ITEM_PERIGO) {
                tamanhoFonte = 32;
            } else {
                tamanhoFonte = 22;
            }
            ctx.font = `bold ${tamanhoFonte}px Gotham, Poppins, sans-serif`;
            ctx.fillStyle = alvo.texto === ITEM_PERIGO ? '#FF5733' : alvo.cor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(alvo.texto, alvo.x + alvo.largura / 2, alvo.y + alvo.altura / 2);
        }

        // Barra de informações superior
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, 50);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        let tamanhoFonteInfo = canvas.width < 600 ? 14 : 20;
        let yPosTexto = 32;
        ctx.font = `bold ${tamanhoFonteInfo}px Poppins, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic'; 
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
        clearInterval(geradorDeAlvosInterval);
    }
}