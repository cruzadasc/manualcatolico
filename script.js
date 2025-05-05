/**
 * Ofício Divino - Script Principal
 * Sistema com carregamento de páginas HTML completas
 */

// Namespaces e constantes globais
const APP = {
    // Configurações da aplicação
    config: {
        languages: ['pt', 'en', 'la'],
        defaultLanguage: 'pt',
        defaultTheme: 'light',
        horaOficio: {
            matinas: { hora: 3, minuto: 0, nome: 'Matinas', descricao: 'Oração durante a noite' },
            laudes: { hora: 5, minuto: 0, nome: 'Laudes', descricao: 'Oração da manhã' },
            prima: { hora: 6, minuto: 30, nome: 'Prima', descricao: 'Primeira hora do dia (6h)' },
            terca: { hora: 9, minuto: 0, nome: 'Terça', descricao: 'Terceira hora do dia (9h)' },
            sexta: { hora: 12, minuto: 0, nome: 'Sexta', descricao: 'Oração do meio-dia' },
            noa: { hora: 15, minuto: 0, nome: 'Nona', descricao: 'Nona hora do dia (15h)' },
            vesperas: { hora: 18, minuto: 0, nome: 'Vésperas', descricao: 'Oração do entardecer' },
            completas: { hora: 21, minuto: 0, nome: 'Completas', descricao: 'Oração antes de dormir' }
        }
    },
    
    // Cache de elementos DOM para melhor performance
    elements: {
        // Retorna o elemento ou null se não encontrado
        get: function(id) {
            const el = document.getElementById(id);
            if (!el) {
                console.warn(`Elemento com ID "${id}" não encontrado`);
            }
            return el;
        },
        
        // Mapeamento de IDs para elementos DOM
        languageToggle: () => APP.elements.get('languageToggle'),
        currentLanguage: () => APP.elements.get('currentLanguage'),
        languageDropdown: () => APP.elements.get('languageDropdown'),
        themeToggle: () => APP.elements.get('toggleTheme'),
        darkIcon: () => APP.elements.get('darkIcon'),
        lightIcon: () => APP.elements.get('lightIcon'),
        searchInput: () => APP.elements.get('searchInput'),
        modalSearchInput: () => APP.elements.get('modalSearchInput'),
        searchModal: () => APP.elements.get('searchModal'),
        closeSearch: () => APP.elements.get('closeSearch'),
        searchResults: () => APP.elements.get('searchResults'),
        conteudo: () => APP.elements.get('conteudo'),
    },
    
    // Armazenamento de dados para a aplicação
    data: {
        // Dados para o sistema de pesquisa
        searchItems: []
    },
    
    // Estado da aplicação
    state: {
        currentLanguage: null,
        currentTheme: null,
        currentPage: null,
        horaAtual: null
    },
    
    // Inicialização do aplicativo
    init: function() {
        console.log('Inicializando aplicação...');
        
        // Inicializar subsistemas
        this.initData();
        this.initLanguageSystem();
        this.initThemeSystem();
        this.initSearchSystem();
        this.initHoraSystem();
        this.initEventListeners();
        
        // Detectar a página atual com base na URL
        this.detectCurrentPage();
        
        console.log('Aplicação inicializada com sucesso!');
    },
    
    // Inicialização de dados
    initData: function() {
        // Preencher dados de pesquisa com base nas horas do ofício
        this.data.searchItems = Object.entries(this.config.horaOficio).map(([key, value]) => {
            return {
                title: value.nome,
                description: value.descricao,
                link: 'horas/' + key + '.html'
            };
        });
    },
    
    // Detectar a página atual com base na URL
    detectCurrentPage: function() {
        // Obter o caminho atual
        let path = window.location.pathname;
        let filename = path.substring(path.lastIndexOf('/') + 1);
        
        // Remover a extensão .html do nome do arquivo
        let pageName = filename.replace(/\.html$/, '');
        
        // Se for página vazia ou index, considerar como página principal
        if (pageName === '' || pageName === 'index') {
            pageName = 'index';
        }
        
        console.log('Página atual detectada:', pageName);
        this.state.currentPage = pageName;
        
        // Inicializar UI específica para a página atual
        if (pageName === 'index') {
            this.hora.updateHoraUI();
        }
    },
    
    // Sistema de idiomas
    language: {
        // Inicialização do sistema de idiomas
        init: function() {
            // Carregar o idioma salvo ou o padrão
            const savedLang = localStorage.getItem('preferredLanguage') || APP.config.defaultLanguage;
            APP.state.currentLanguage = savedLang;
            
            // Inicializar UI dos idiomas
            this.setupToggleUI();
            
            // Aplicar o idioma atual
            this.applyLanguage(savedLang);
            
            console.log('Sistema de idiomas inicializado:', savedLang);
        },
        
        // Configurar a interface do seletor de idiomas
        setupToggleUI: function() {
            const languageButton = APP.elements.languageToggle();
            const dropdown = APP.elements.languageDropdown();
            const currentLangEl = APP.elements.currentLanguage();
            
            if (!languageButton || !dropdown || !currentLangEl) {
                console.error("Elementos do seletor de idioma não encontrados");
                return;
            }
            
            // Atualizar texto do idioma atual
            currentLangEl.textContent = APP.state.currentLanguage.toUpperCase();
            
            // Configurar eventos de clique para as opções de idioma
            const options = dropdown.querySelectorAll('.language-option');
            options.forEach(option => {
                option.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const lang = this.getAttribute('data-lang');
                    
                    // Atualizar UI
                    currentLangEl.textContent = lang.toUpperCase();
                    APP.language.updateCheckIcons(dropdown, lang);
                    
                    // Mudar idioma
                    APP.language.applyLanguage(lang);
                    
                    // Fechar dropdown
                    dropdown.classList.remove('show');
                });
            });
            
            // Abrir/fechar dropdown ao clicar no botão
            languageButton.addEventListener('click', function(e) {
                e.stopPropagation();
                dropdown.classList.toggle('show');
            });
            
            // Fechar dropdown ao clicar em qualquer lugar
            document.addEventListener('click', function() {
                dropdown.classList.remove('show');
            });
        },
        
        // Atualizar os ícones de verificação no dropdown
        updateCheckIcons: function(dropdown, selectedLang) {
            // Esconder todos os ícones
            dropdown.querySelectorAll('.language-option i').forEach(icon => {
                icon.style.visibility = 'hidden';
            });
            
            // Mostrar apenas o ícone do idioma selecionado
            const selectedOption = dropdown.querySelector(`.language-option[data-lang="${selectedLang}"]`);
            if (selectedOption) {
                const icon = selectedOption.querySelector('i');
                if (icon) {
                    icon.style.visibility = 'visible';
                }
            }
        },
        
        // Aplicar o idioma selecionado à interface
        applyLanguage: function(lang) {
            if (!lang) return;
            
            // Atualizar estado e salvar preferência
            APP.state.currentLanguage = lang;
            localStorage.setItem('preferredLanguage', lang);
            
            // Mostrar/ocultar elementos específicos de idioma
            document.querySelectorAll('[data-lang]').forEach(element => {
                if (element.getAttribute('data-lang') === lang) {
                    element.style.display = 'block';
                } else {
                    element.style.display = 'none';
                }
            });
            
            // Modo especial para latim (se necessário)
            document.documentElement.classList.toggle('latin-mode', lang === 'la');
            
            // Atualizar elementos traduzíveis
            this.updateTranslatableElements(lang);
            
            // Atualizar título da página
            this.updatePageTitle(lang);
            
            console.log('Idioma aplicado:', lang);
        },
        
        // Obter todas as traduções disponíveis
        getAllTranslations: function() {
            // Iniciar com traduções comuns (se disponíveis)
            let allTranslations = {};
            
            if (typeof commonTranslations !== 'undefined') {
                allTranslations = { ...commonTranslations };
            }
            
            // Adicionar outras traduções específicas da página (se disponíveis)
            if (typeof matinasTranslations !== 'undefined') {
                Object.assign(allTranslations, matinasTranslations);
            }
            
            return allTranslations;
        },
        
        // Atualizar elementos com atributo data-translate
        updateTranslatableElements: function(lang) {
            const translations = this.getAllTranslations();
            
            document.querySelectorAll('[data-translate]').forEach(element => {
                const key = element.getAttribute('data-translate');
                if (translations[key] && translations[key][lang]) {
                    element.innerHTML = translations[key][lang].replace(/\n/g, '<br>');
                }
            });
        },
        
        // Atualizar o título da página de acordo com o idioma
        updatePageTitle: function(lang) {
            // Títulos padrão por idioma
            const defaultTitles = {
                'pt': 'Ofício Divino',
                'en': 'Divine Office',
                'la': 'Officium Divinum'
            };
            
            // Determinar o título com base na página atual e traduções disponíveis
            let title = defaultTitles[lang];
            const translations = this.getAllTranslations();
            
            if (APP.state.currentPage === 'matinas' && translations['matins-title']?.[lang]) {
                title = translations['matins-title'][lang];
            } else if (translations['site-title']?.[lang]) {
                title = translations['site-title'][lang];
            }
            
            document.title = title;
        },
        
        // Obter o nome completo do idioma
        getLanguageName: function(langCode) {
            const names = {
                'pt': 'Português',
                'en': 'English',
                'la': 'Latina'
            };
            
            return names[langCode] || langCode;
        }
    },
    
    // Sistema de tema claro/escuro
    theme: {
        init: function() {
            // Carregar tema salvo ou padrão
            const savedTheme = localStorage.getItem('theme') || APP.config.defaultTheme;
            APP.state.currentTheme = savedTheme;
            
            // Aplicar tema
            this.apply(savedTheme);
            
            console.log('Sistema de tema inicializado:', savedTheme);
        },
        
        // Aplicar tema (claro ou escuro)
        apply: function(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            APP.state.currentTheme = theme;
            
            // Atualizar ícones de acordo com o tema
            const darkIcon = APP.elements.darkIcon();
            const lightIcon = APP.elements.lightIcon();
            
            if (darkIcon && lightIcon) {
                darkIcon.style.display = theme === 'dark' ? 'none' : 'inline';
                lightIcon.style.display = theme === 'dark' ? 'inline' : 'none';
            }
        },
        
        // Alternar entre temas claro e escuro
        toggle: function() {
            const newTheme = APP.state.currentTheme === 'light' ? 'dark' : 'light';
            this.apply(newTheme);
            
            console.log('Tema alternado para:', newTheme);
        }
    },
    
    // Sistema de pesquisa
    search: {
        init: function() {
            console.log('Sistema de pesquisa inicializado');
            
            // Inicializar resultados vazios
            const searchResults = APP.elements.searchResults();
            if (searchResults) {
                this.displayResults([], '');
            }
        },
        
        // Realizar pesquisa com base na consulta
        perform: function(query) {
            if (!query || query.trim() === '') {
                this.displayResults([], '');
                return;
            }
            
            query = query.toLowerCase().trim();
            
            // Filtrar itens que correspondem à consulta
            const results = APP.data.searchItems.filter(item => 
                item.title.toLowerCase().includes(query) || 
                item.description.toLowerCase().includes(query)
            );
            
            // Exibir resultados
            this.displayResults(results, query);
        },
        
        // Exibir resultados da pesquisa
        displayResults: function(results, query) {
            const searchResults = APP.elements.searchResults();
            if (!searchResults) return;
            
            if (!query) {
                searchResults.innerHTML = '<p>Digite algo para pesquisar...</p>';
                return;
            }
            
            if (results.length === 0) {
                searchResults.innerHTML = '<p>Nenhum resultado encontrado para "' + query + '"</p>';
                return;
            }
            
            let html = '';
            results.forEach(item => {
                html += `
                    <div class="search-result-item">
                        <h3>${item.title}</h3>
                        <p>${item.description}</p>
                        <a href="${item.link}" class="btn btn-outline">Abrir</a>
                    </div>
                `;
            });
            
            searchResults.innerHTML = html;
        },
        
        // Abrir modal de pesquisa
        open: function() {
            const searchModal = APP.elements.searchModal();
            const modalInput = APP.elements.modalSearchInput();
            
            if (searchModal) {
                searchModal.classList.add('active');
                
                if (modalInput) {
                    setTimeout(() => modalInput.focus(), 100);
                }
            }
        },
        
        // Fechar modal de pesquisa
        close: function() {
            const searchModal = APP.elements.searchModal();
            if (searchModal) {
                searchModal.classList.remove('active');
            }
        }
    },
    
    // Sistema de hora atual e horários do ofício
    hora: {
        init: function() {
            console.log('Sistema de horário inicializado');
            this.updateCurrentHour();
            
            // Atualizar a hora atual a cada minuto
            setInterval(() => this.updateCurrentHour(), 60000);
        },
        
        // Atualizar informações sobre a hora atual
        updateCurrentHour: function() {
            const horaId = this.determinarHoraAtual();
            const horaInfo = APP.config.horaOficio[horaId];
            
            APP.state.horaAtual = {
                id: horaId,
                nome: horaInfo.nome,
                descricao: horaInfo.descricao
            };
            
            // Atualizar UI se estiver na página principal
            if (APP.state.currentPage === 'index') {
                this.updateHoraUI();
            }
        },
        
        // Atualizar a UI com informações da hora atual
        updateHoraUI: function() {
            const container = APP.elements.conteudo();
            if (!container) return;
            
            // Encontrar a div da hora atual (se existir)
            const horaAtualDiv = container.querySelector('.horario-atual');
            if (horaAtualDiv) {
                // Atualizar o conteúdo com a hora atual
                const horaInfo = APP.state.horaAtual;
                
                // Construir o HTML com as informações atualizadas
                horaAtualDiv.innerHTML = `
                    <h2>Hora atual do Ofício</h2>
                    <p>De acordo com o horário do seu dispositivo, agora é tempo de rezar: <strong>${horaInfo.nome}</strong></p>
                    <div>
                        <a href="horas/${horaInfo.id}.html" class="btn">Rezar ${horaInfo.nome} agora</a>
                        <button class="btn btn-outline" onclick="APP.notifications.configure()">Ativar notificações</button>
                    </div>
                    `;
            }
        },
        
        // Determinar qual hora do ofício deve ser rezada agora
        determinarHoraAtual: function() {
            const agora = new Date();
            const hora = agora.getHours();
            
            if (hora >= 5 && hora < 6) return 'laudes';
            if (hora >= 6 && hora < 9) return 'prima';
            if (hora >= 9 && hora < 12) return 'terca';
            if (hora >= 12 && hora < 15) return 'sexta';
            if (hora >= 15 && hora < 18) return 'noa';
            if (hora >= 18 && hora < 21) return 'vesperas';
            if (hora >= 21 || hora < 3) return 'completas';
            return 'matinas'; // Entre 3h e 5h
        },
        
        // Navegar diretamente para a hora atual
        irParaHoraAtual: function() {
            if (APP.state.horaAtual) {
                window.location.href = 'horas/' + APP.state.horaAtual.id + '.html';
            }
        }
    },
    
    // Sistema de notificações
    notifications: {
        // Configurar notificações para todas as horas
        configure: function() {
            if (!("Notification" in window)) {
                alert("Este navegador não suporta notificações.");
                return;
            }
            
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    localStorage.setItem("notificar_todas", "sim");
                    alert("Notificações ativadas! Você receberá lembretes para cada hora do Ofício.");
                    this.schedule();
                } else {
                    alert("Você precisa permitir as notificações para receber lembretes das horas do Ofício.");
                }
            });
        },
        
        // Configurar notificação para uma hora específica
        configureHora: function(hora) {
            if (!("Notification" in window)) {
                alert("Este navegador não suporta notificações.");
                return;
            }
            
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    const horaInfo = APP.config.horaOficio[hora];
                    localStorage.setItem(`notificar_${hora}`, "sim");
                    alert(`Notificações ativadas para ${horaInfo.nome}!`);
                } else {
                    alert("Você precisa permitir as notificações para receber lembretes das horas do Ofício.");
                }
            });
        },
        
        // Agendar verificação de notificações
        schedule: function() {
            // Verificar a cada minuto
            const notificationTimer = setInterval(() => {
                const agora = new Date();
                const horaAtual = agora.getHours();
                const minutoAtual = agora.getMinutes();
                
                // Verificar cada hora do ofício
                Object.entries(APP.config.horaOficio).forEach(([horaId, horaInfo]) => {
                    const notificarTodas = localStorage.getItem("notificar_todas") === "sim";
                    const notificarEsta = localStorage.getItem(`notificar_${horaId}`) === "sim";
                    
                    if ((notificarTodas || notificarEsta) && 
                        horaAtual === horaInfo.hora && 
                        minutoAtual === horaInfo.minuto) {
                        
                        // Enviar notificação
                        new Notification(`Hora do Ofício: ${horaInfo.nome}`, {
                            body: `É hora de rezar ${horaInfo.nome}.`,
                            icon: '/api/placeholder/64/64'
                        });
                        
                        // Redirecionar para a página da hora correspondente se permitido
                        const autoDirecionamento = localStorage.getItem("auto_direcionar") === "sim";
                        if (autoDirecionamento) {
                            window.location.href = 'horas/' + horaId + '.html';
                        }
                    }
                });
            }, 60000);
            
            // Guardar o timer para futura referência
            APP.data.notificationTimer = notificationTimer;
        }
    },
    
    // Inicialização de event listeners
    initEventListeners: function() {
        console.log('Inicializando event listeners...');
        
        // Botão de alternância de tema
        const themeToggle = this.elements.themeToggle();
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.theme.toggle());
        }
        
        // Eventos de pesquisa
        const searchInput = this.elements.searchInput();
        if (searchInput) {
            searchInput.addEventListener('focus', () => this.search.open());
        }
        
        const closeSearch = this.elements.closeSearch();
        if (closeSearch) {
            closeSearch.addEventListener('click', () => this.search.close());
        }
        
        const modalSearchInput = this.elements.modalSearchInput();
        if (modalSearchInput) {
            modalSearchInput.addEventListener('input', function() {
                APP.search.perform(this.value);
            });
        }
        
        // Atualizar a data atual no formato brasileiro
        const dataAtualEl = document.getElementById('dataAtual');
        if (dataAtualEl) {
            const hoje = new Date();
            const opcoes = { day: 'numeric', month: 'long', year: 'numeric' };
            dataAtualEl.textContent = hoje.toLocaleDateString('pt-BR', opcoes);
        }
        
        // Atalhos de teclado
        document.addEventListener('keydown', function(e) {
            // Ctrl+K ou Cmd+K para pesquisa
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                APP.search.open();
            }
            
            // Esc para fechar modais
            if (e.key === 'Escape') {
                APP.search.close();
            }
        });
        
        // Adaptar links para novo sistema de navegação
        this.adaptLinks();
    },
    
    // Adaptar links do antigo sistema de rotas para o novo
    adaptLinks: function() {
        // Substituir chamadas para carregarPagina() com links HTML reais
        document.querySelectorAll('[onclick*="carregarPagina"]').forEach(el => {
            const match = el.getAttribute('onclick').match(/carregarPagina\('([^']+)'\)/);
            if (match && match[1]) {
                const pagina = match[1];
                el.setAttribute('onclick', '');
                // Verificar se é uma página de hora ou outra página
                if (Object.keys(APP.config.horaOficio).includes(pagina)) {
                    el.setAttribute('href', 'horas/' + pagina + '.html');
                } else {
                    el.setAttribute('href', pagina + '.html');
                }
            }
        });
    },
    
    // Inicializar os subsistemas em ordem
    initLanguageSystem: function() {
        this.language.init();
    },
    
    initThemeSystem: function() {
        this.theme.init();
    },
    
    initSearchSystem: function() {
        this.search.init();
    },
    
    initHoraSystem: function() {
        this.hora.init();
    }
};

// Expor a aplicação globalmente para interação da página
window.APP = APP;

// Inicialização da aplicação quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    APP.init();
});