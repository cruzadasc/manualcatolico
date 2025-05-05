// =============================================
// CONFIGURAÇÕES GLOBAIS
// =============================================
const CONFIG = {
  defaultLang: 'pt',
  defaultTheme: 'light',
  defaultFontSize: 16,
  minFontSize: 12,
  maxFontSize: 24
};

// =============================================
// ESTADO DA APLICAÇÃO
// =============================================
const STATE = {
  translations: {},
  currentLang: localStorage.getItem('preferredLanguage') || CONFIG.defaultLang,
  currentTheme: localStorage.getItem('theme') || CONFIG.defaultTheme,
  currentFontSize: parseInt(localStorage.getItem('fontSize')) || CONFIG.defaultFontSize,
  currentPage: document.body.dataset.page || 'matinas'
};

// =============================================
// FUNÇÕES PRINCIPAIS
// =============================================

/**
 * Carrega o arquivo de traduções
 */
async function loadTranslations() {
  try {
    const response = await fetch('translations.md'); // Arquivo renomeado
    if (!response.ok) throw new Error('Erro ao carregar traduções');
    return parseTranslations(await response.text());
  } catch (error) {
    console.error('Erro:', error);
    return {};
  }
}

/**
 * Converte o Markdown para um objeto de traduções
 */
function parseTranslations(mdContent) {
  const result = {};
  let currentPage = '';
  
  // Split by pages
  const pageSections = mdContent.split(/# Página: /);
  
  pageSections.forEach(section => {
    if (!section.trim()) return;
    
    // Get page name (first line)
    const lines = section.split('\n');
    currentPage = lines[0].trim().toLowerCase();
    result[currentPage] = {};
    
    // Process translation blocks
    const translationBlocks = section.split('## [');
    for (let i = 1; i < translationBlocks.length; i++) {
      const block = translationBlocks[i];
      const keyEnd = block.indexOf(']');
      if (keyEnd === -1) continue;
      
      const key = block.substring(0, keyEnd).trim();
      result[currentPage][key] = {};
      
      // Extract language translations
      const langLines = block.substring(keyEnd + 1).split('\n');
      langLines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('-')) {
          const langMatch = trimmed.match(/^\s*-\s+(\*{0,2})(\w{2})(\*{0,2}):\s+(.+)/);
          if (langMatch) {
            const [_, bold1, lang, bold2, text] = langMatch;
            result[currentPage][key][lang] = text.trim();
          }
        }
      });
    }
  });
  
  return result;
}

/**
 * Aplica as traduções à página atual
 */
function applyTranslations() {
  const pageTranslations = STATE.translations[STATE.currentPage] || {};

  document.querySelectorAll('[data-translate]').forEach(el => {
    const key = el.getAttribute('data-translate');
    const translation = pageTranslations[key]?.[STATE.currentLang];

    if (translation) {
      el.innerHTML = translation
        .replace(/\\n/g, '<br>')
        .replace(/\+(.*?)\+/g, '<span class="rubric-mark">$1</span>');
    } else {
      console.warn(`Tradução ausente: ${key} (${STATE.currentLang})`);
    }
  });

  substituirAlleluia(); // Aplica as substituições após traduzir
}

/**
 * Alterna entre idiomas
 */
function setLanguage(lang) {
  STATE.currentLang = lang;
  localStorage.setItem('preferredLanguage', lang);
  
  // Atualiza a UI
  const langDisplay = document.getElementById('currentLanguage');
  if (langDisplay) langDisplay.textContent = lang.toUpperCase();

  document.querySelectorAll('.language-option i').forEach(icon => {
    icon.style.visibility = 'hidden';
  });

  const activeIcon = document.querySelector(`.language-option[data-lang="${lang}"] i`);
  if (activeIcon) activeIcon.style.visibility = 'visible';

  substituirAlleluia();
  applyTranslations();
}

/**
 * Alterna entre temas claro/escuro
 */
function toggleTheme() {
  STATE.currentTheme = STATE.currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', STATE.currentTheme);
  localStorage.setItem('theme', STATE.currentTheme);

  // Atualiza ícones
  const darkIcon = document.getElementById('darkIcon');
  const lightIcon = document.getElementById('lightIcon');
  if (darkIcon && lightIcon) {
    darkIcon.style.display = STATE.currentTheme === 'dark' ? 'none' : 'block';
    lightIcon.style.display = STATE.currentTheme === 'dark' ? 'block' : 'none';
  }
}

/**
 * Ajusta o tamanho da fonte
 */
function adjustFontSize(change) {
  STATE.currentFontSize = Math.max(
    CONFIG.minFontSize,
    Math.min(CONFIG.maxFontSize, STATE.currentFontSize + change)
  );
  
  document.documentElement.style.fontSize = `${STATE.currentFontSize}px`;
  localStorage.setItem('fontSize', STATE.currentFontSize);
}

/**
 * Alterna modos de exibição (latim/vernáculo/ambos)
 */
function setDisplayMode(mode) {
  document.body.classList.remove('latin-only', 'vernacular-only');
  
  if (mode !== 'both') {
    document.body.classList.add(`${mode}-only`);
  }
  
  // Remove a classe active de todos os botões
  document.querySelectorAll('.display-mode-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Adiciona a classe active ao botão atual
  document.querySelector(`.display-mode-btn[data-mode="${mode}"]`).classList.add('active');
  
  localStorage.setItem('displayMode', mode === 'both' ? '' : `${mode}-only`);
}

/**
 * Calcula as datas litúrgicas importantes
 */
function calcularDatasLiturgicas(ano) {
    // Algoritmo de Gauss para calcular a Páscoa
    const a = ano % 19;
    const b = Math.floor(ano / 100);
    const c = ano % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    
    const pascoa = new Date(ano, mes, dia);
    const quintaFeiraSanta = new Date(pascoa);
    quintaFeiraSanta.setDate(pascoa.getDate() - 3);
    
    const septuagesima = new Date(pascoa);
    septuagesima.setDate(pascoa.getDate() - 63); // 9 semanas antes da Páscoa
    
    return { pascoa, quintaFeiraSanta, septuagesima };
}

/**
 * Verifica se estamos no período sem Alleluia
 */
function estaNoPeriodoSemAlleluia() {
    const hoje = new Date();    
    const ano = hoje.getFullYear();
    const { quintaFeiraSanta, septuagesima } = calcularDatasLiturgicas(ano);
    
    return hoje >= septuagesima && hoje <= quintaFeiraSanta;
}

const SUBSTITUICOES_LITURGICAS = {
  'la': { // Latim
    original: /Allelúia/gi, 
    substituto: '</br>Laus tibi, Dómine, Rex aetérnae glóriae',
    alvo: ['latin'] // Aplica apenas à coluna latim
  },
  'pt': { // Português
    original: /Aleluia/gi, 
    substituto: '</br>Louvor a Vós, Rei da Eterna Glória',
    alvo: ['vernacular']
  },
  'en': { // Inglês
    original: /Alleluia|Hallelujah/gi, 
    substituto: '</br>Ceaseless praise to Thee be given, O Eternal King of Heaven',
    alvo: ['vernacular']
  }
  // Adicione outras línguas conforme necessário
};

function substituirAlleluia() {
  if (!estaNoPeriodoSemAlleluia()) return;

  // Aplica substituição no latim (sempre)
  const substituicaoLatim = SUBSTITUICOES_LITURGICAS['la'];
  document.querySelectorAll('.prayer-column.latin').forEach(coluna => {
    coluna.innerHTML = coluna.innerHTML.replace(
      substituicaoLatim.original, 
      substituicaoLatim.substituto
    );
  });

  // Aplica substituição no vernáculo (de acordo com o idioma atual)
  const idiomaAtual = STATE.currentLang || 'pt';
  const substituicaoVernaculo = SUBSTITUICOES_LITURGICAS[idiomaAtual];
  
  if (substituicaoVernaculo) {
    document.querySelectorAll('.prayer-column.vernacular').forEach(coluna => {
      coluna.innerHTML = coluna.innerHTML.replace(
        substituicaoVernaculo.original, 
        substituicaoVernaculo.substituto
      );
    });
  }

  console.log(`Substituição litúrgica ativa (Latim: ${substituicaoLatim.substituto}, ${idiomaAtual}: ${substituicaoVernaculo?.substituto || 'não aplicável'})`);
}

// Adicione esta linha ao evento DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // ... código existente ...
    
    substituirAlleluia(); // Adicione esta linha
});

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Carrega traduções
  STATE.translations = await loadTranslations();

  // 2. Configura tema
  document.documentElement.setAttribute('data-theme', STATE.currentTheme);
  if (document.getElementById('darkIcon') && document.getElementById('lightIcon')) {
    document.getElementById('darkIcon').style.display = STATE.currentTheme === 'dark' ? 'none' : 'block';
    document.getElementById('lightIcon').style.display = STATE.currentTheme === 'dark' ? 'block' : 'none';
  }

  // 3. Configura idioma
  setLanguage(STATE.currentLang);

  // 4. Configura tamanho da fonte
  document.documentElement.style.fontSize = `${STATE.currentFontSize}px`;

  // 5. Configura modo de exibição
  const savedMode = localStorage.getItem('displayMode');
    if (savedMode) {
    document.body.classList.add(savedMode);

    // Define o botão correto como ativo
    const activeMode = savedMode === 'latin-only' ? 'latin' : 
                        savedMode === 'vernacular-only' ? 'vernacular' : 'both';

    document.querySelectorAll('.display-mode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === activeMode) {
        btn.classList.add('active');
        }
    });
    } else {
    // Seleciona o modo "both" como padrão
    document.querySelector('.display-mode-btn[data-mode="both"]').classList.add('active');
    }

  // =============================================
  // EVENT LISTENERS
  // =============================================

  // Alternador de tema
  const themeToggle = document.getElementById('toggleTheme');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  // Seletor de idioma
  const languageToggle = document.getElementById('languageToggle');
  if (languageToggle) {
    languageToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('languageDropdown').classList.toggle('show');
    });

    document.addEventListener('click', () => {
      document.getElementById('languageDropdown').classList.remove('show');
    });

    document.querySelectorAll('.language-option').forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        setLanguage(option.dataset.lang);
      });
    });
  }

  // Controles de tamanho de texto
  document.getElementById('decreaseText')?.addEventListener('click', () => adjustFontSize(-1));
  document.getElementById('resetText')?.addEventListener('click', () => {
    STATE.currentFontSize = CONFIG.defaultFontSize;
    document.documentElement.style.fontSize = `${CONFIG.defaultFontSize}px`;
    localStorage.setItem('fontSize', CONFIG.defaultFontSize);
  });
  document.getElementById('increaseText')?.addEventListener('click', () => adjustFontSize(1));

  // Modos de exibição
  document.querySelectorAll('.display-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => setDisplayMode(btn.dataset.mode));
  });

  // Barra de pesquisa
  const searchInput = document.getElementById('searchInput');
  const searchModal = document.getElementById('searchModal');
  if (searchInput && searchModal) {
    searchInput.addEventListener('focus', () => searchModal.classList.add('active'));
    document.getElementById('closeSearch')?.addEventListener('click', () => {
      searchModal.classList.remove('active');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') searchModal.classList.remove('active');
    });
  }

  // Progresso de leitura
  const progressoIndicador = document.getElementById('progressoIndicador');
  if (progressoIndicador) {
    window.addEventListener('scroll', () => {
      const totalHeight = document.body.scrollHeight - window.innerHeight;
      const progresso = (window.scrollY / totalHeight) * 100;
      progressoIndicador.style.width = `${progresso}%`;
    });
  }

  // No final do DOMContentLoaded, adicione:
  handleAlleluiaReplacement();
});

// =============================================
// FUNÇÕES AUXILIARES (OPCIONAIS)
// =============================================

/**
 * Editor de traduções inline (duplo-clique)
 */
document.addEventListener('dblclick', (e) => {
  const target = e.target.closest('[data-translate]');
  if (target && confirm('Editar esta tradução?')) {
    const key = target.getAttribute('data-translate');
    const newText = prompt('Novo texto:', target.textContent);
    if (newText) {
      // Aqui você implementaria a lógica para salvar no backend
      console.log(`Pretendia salvar "${newText}" para a chave ${key}`);
    }
  }
});

/**
 * Notificações (exemplo)
 */
function setupNotifications() {
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification('Matinas', { 
          body: 'Lembrete para rezar o Ofício' 
        });
      }
    });
  }
}

// Inicializa notificações (opcional)
// setupNotifications();

