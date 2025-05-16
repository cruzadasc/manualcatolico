/**
 * Ofício Divino - Script Principal
 * Sistema com carregamento de páginas HTML completas
 */

const APP = {
    // Configurações da aplicação
    config: {
        languages: ['pt', 'en'],
        defaultLanguage: 'pt',
        defaultTheme: 'light',
        horaOficio: {
            matinas: { hora: 3, minuto: 0 },
            laudes: { hora: 5, minuto: 0 },
            prima: { hora: 6, minuto: 30 },
            terca: { hora: 9, minuto: 0 },
            sexta: { hora: 12, minuto: 0 },
            noa: { hora: 15, minuto: 0 },
            vesperas: { hora: 18, minuto: 0 },
            completas: { hora: 21, minuto: 0 }
        }
    },
    
    // Cache de elementos DOM
    elements: {
        get: function(id) {
            const el = document.getElementById(id);
            if (!el) console.warn(`Elemento com ID "${id}" não encontrado`);
            return el;
        },
        
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
    
    // Armazenamento de dados
    data: {
        searchItems: [],
        translations: {},
        notificationTimer: null
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
        this.initLanguageSystem();
        this.initThemeSystem();
        this.initSearchSystem();
        this.initHoraSystem();
        this.initEventListeners();
        this.detectCurrentPage();
        console.log('Aplicação inicializada com sucesso!');
    },
    
    // Detectar a página atual
    detectCurrentPage: function() {
        let path = window.location.pathname;
        let filename = path.substring(path.lastIndexOf('/') + 1);
        let pageName = filename.replace(/\.html$/, '');
        
        if (pageName === '' || pageName === 'index') pageName = 'index';
        
        console.log('Página atual detectada:', pageName);
        this.state.currentPage = pageName;
        
        if (pageName === 'index') this.hora.updateHoraUI();
    },
    
    // Sistema de idiomas
    language: {
        init: function() {
            const savedLang = localStorage.getItem('preferredLanguage') || APP.config.defaultLanguage;
            APP.state.currentLanguage = savedLang;
            this.loadTranslations().then(() => {
                this.setupToggleUI();
                this.applyLanguage(savedLang);
                this.initSearchData();
                console.log('Sistema de idiomas inicializado:', savedLang);
            });
        },
        
        setupToggleUI: function() {
            const languageButton = APP.elements.languageToggle();
            const dropdown = APP.elements.languageDropdown();
            const currentLangEl = APP.elements.currentLanguage();
            
            if (!languageButton || !dropdown || !currentLangEl) {
                console.error("Elementos do seletor de idioma não encontrados");
                return;
            }
            
            currentLangEl.textContent = APP.state.currentLanguage.toUpperCase();
            
            // Esconder todos os ícones de verificação inicialmente
            dropdown.querySelectorAll('.language-option i').forEach(icon => {
                icon.style.visibility = 'hidden';
            });
            
            // Mostrar apenas o ícone do idioma atual
            const currentOption = dropdown.querySelector(`.language-option[data-lang="${APP.state.currentLanguage}"]`);
            if (currentOption) {
                const icon = currentOption.querySelector('i');
                if (icon) icon.style.visibility = 'visible';
            }
            
            // Adicionar event listeners para as opções
            const options = dropdown.querySelectorAll('.language-option');
            options.forEach(option => {
                option.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const lang = this.getAttribute('data-lang');
                    currentLangEl.textContent = lang.toUpperCase();
                    APP.language.updateCheckIcons(dropdown, lang);
                    APP.language.applyLanguage(lang);
                    dropdown.classList.remove('show');
                });
            });
            
            // Toggle do dropdown
            languageButton.addEventListener('click', function(e) {
                e.stopPropagation();
                dropdown.classList.toggle('show');
            });
            
            // Fechar dropdown ao clicar fora
            document.addEventListener('click', function() {
                dropdown.classList.remove('show');
            });
        },
        
        updateCheckIcons: function(dropdown, selectedLang) {
            dropdown.querySelectorAll('.language-option i').forEach(icon => {
                icon.style.visibility = 'hidden';
            });
            
            const selectedOption = dropdown.querySelector(`.language-option[data-lang="${selectedLang}"]`);
            if (selectedOption) {
                const icon = selectedOption.querySelector('i');
                if (icon) icon.style.visibility = 'visible';
            }
        },
        
        applyLanguage: function(lang) {
            if (!lang) return;
            
            APP.state.currentLanguage = lang;
            localStorage.setItem('preferredLanguage', lang);
            
            // Atualizar elementos com data-lang
            document.querySelectorAll('[data-lang]').forEach(element => {
                element.style.display = element.getAttribute('data-lang') === lang ? 'block' : 'none';
            });
            
            // Atualizar a hora atual antes de aplicar as traduções
            if (APP.state.horaAtual) {
                const horaId = APP.state.horaAtual.id;
                APP.state.horaAtual.nome = this.getHourName(horaId, lang);
                APP.state.horaAtual.descricao = this.getHourDescription(horaId, lang);
            }
            
            // Atualizar elementos traduzíveis
            this.updateTranslatableElements(lang);
            
            // Atualizar nomes das horas quando o idioma muda
            if (APP.state.currentPage === 'index') {
                APP.hora.updateHoraUI();
            }
            
            console.log('Idioma aplicado:', lang);
        },
        
        updateTranslatableElements: function(lang) {
            document.querySelectorAll('[data-translate]').forEach(element => {
                const key = element.getAttribute('data-translate');
                
                // Verifica se há atributos data-var-* para substituir variáveis na tradução
                const variables = {};
                for (const attr of element.attributes) {
                    if (attr.name.startsWith('data-var-')) {
                        const varName = attr.name.substring(9); // remove 'data-var-'
                        variables[varName] = attr.value;
                    }
                }
                
                // Para variáveis dinâmicas como hora atual
                if (APP.state.horaAtual) {
                    variables.nomeDaHora = APP.state.horaAtual.nome;
                    variables.descricaoDaHora = APP.state.horaAtual.descricao;
                }
                
                const translation = this.getTranslation(key, lang, variables);
                
                if (translation) {
                    element.innerHTML = translation;
                } else {
                    console.warn(`Tradução ausente: ${key} (${lang})`);
                }
            });
        },
        
        getTranslation: function(key, lang, variables = {}) {
            const translations = APP.data.translations;

            // Primeiro verificamos se existe uma tradução específica para a página atual
            const currentPageKey = APP.state.currentPage || 'index';
            let translation = null;
            
            if (translations[currentPageKey] && 
                translations[currentPageKey][key] && 
                translations[currentPageKey][key][lang]) {
                translation = translations[currentPageKey][key][lang];
            }
            // Se não encontrar, verifica nas traduções globais
            else if (translations.global && 
                translations.global[key] && 
                translations.global[key][lang]) {
                translation = translations.global[key][lang];
            }
            
            // Se encontrou uma tradução, processa as variáveis
            if (translation) {
                // Substitui todas as variáveis no formato ${nome}
                return translation.replace(/\${(\w+)}/g, function(match, varName) {
                    return variables[varName] !== undefined ? variables[varName] : match;
                });
            }
            
            return null;
        },
        
        loadTranslations: async function() {
            try {
                const response = await fetch('principal.md');
                if (!response.ok) {
                    throw new Error(`Erro ao carregar traduções: ${response.status}`);
                }
                
                const text = await response.text();
                APP.data.translations = this.parseTranslations(text);
                console.log('Traduções carregadas com sucesso:', APP.data.translations);
                return true;
            } catch (error) {
                console.error('Erro ao carregar traduções:', error);
                APP.data.translations = {};
                return false;
            }
        },
        
        parseTranslations: function(mdContent) {
            const result = {
                global: {},
                index: {},
                matinas: {},
                laudes: {},
                prima: {},
                terca: {},
                sexta: {},
                noa: {},
                vesperas: {},
                completas: {}
            };
            
            // Dividir o conteúdo em seções usando cabeçalhos de nível 2
            const sections = mdContent.split(/^## /m).slice(1);
            
            for (const section of sections) {
                // Extrair o título da seção (pode conter uma indicação de página)
                const titleLine = section.split('\n')[0].trim();
                let key = titleLine.replace(/[\[\]]/g, '').trim();
                let page = 'global'; // Por padrão, todas as traduções são globais
                
                // Verifica se o título contém indicação de página específica
                const pageMatch = key.match(/^(\w+):/);
                if (pageMatch) {
                    page = pageMatch[1];
                    key = key.substring(page.length + 1).trim();
                }
                
                // Inicializar o objeto para esta chave se não existir
                if (!result[page]) result[page] = {};
                result[page][key] = {};
                
                // Processar cada linha para extrair traduções específicas do idioma
                const lines = section.split('\n');
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    
                    // Formato esperado: - **pt**: texto de tradução
                    const langMatch = line.match(/^-\s+\*{0,2}(\w{2})\*{0,2}:\s+(.+)/);
                    if (langMatch) {
                        const [_, lang, text] = langMatch;
                        result[page][key][lang] = text.trim();
                    }
                }
            }
            
            return result;
        },
        
        initSearchData: function() {
            // Preencher dados de pesquisa com base nas horas do ofício
            APP.data.searchItems = Object.entries(APP.config.horaOficio).map(([key, value]) => {
                const horaNome = this.getHourName(key, APP.state.currentLanguage);
                const horaDesc = this.getHourDescription(key, APP.state.currentLanguage);
                
                return {
                    id: key,
                    title: horaNome,
                    description: horaDesc,
                    link: 'horas/' + key + '.html'
                };
            });
        },
        
        getHourName: function(horaId, lang) {
            // Primeiro tenta obter do sistema de traduções
            const translation = this.getTranslation(`hora_${horaId}`, lang);
            if (translation) return translation;
            
            // Fallback para nomes predefinidos
            const defaultNames = {
                matinas: { pt: 'Matinas', en: 'Matins' },
                laudes: { pt: 'Laudes', en: 'Lauds' },
                prima: { pt: 'Prima', en: 'Prime' },
                terca: { pt: 'Terça', en: 'Terce' },
                sexta: { pt: 'Sexta', en: 'Sext' },
                noa: { pt: 'Noa', en: 'None' },
                vesperas: { pt: 'Vésperas', en: 'Vespers' },
                completas: { pt: 'Completas', en: 'Compline' }
            };
            
            return defaultNames[horaId]?.[lang] || horaId;
        },
        
        getHourDescription: function(horaId, lang) {
            // Primeiro tenta obter do sistema de traduções
            const translation = this.getTranslation(`desc_${horaId}`, lang);
            if (translation) return translation;
            
            // Fallback para descrições predefinidas
            const defaultDescriptions = {
                matinas: { pt: 'Oração durante a noite', en: 'Night prayer' },
                laudes: { pt: 'Oração da manhã', en: 'Morning prayer' },
                prima: { pt: 'Primeira hora do dia (6h)', en: 'First hour of the day (6am)' },
                terca: { pt: 'Terceira hora do dia (9h)', en: 'Third hour of the day (9am)' },
                sexta: { pt: 'Oração do meio-dia', en: 'Midday prayer' },
                noa: { pt: 'Nona hora do dia (15h)', en: 'Ninth hour of the day (3pm)' },
                vesperas: { pt: 'Oração do entardecer', en: 'Evening prayer' },
                completas: { pt: 'Oração antes de dormir', en: 'Prayer before sleep' }
            };
            
            return defaultDescriptions[horaId]?.[lang] || '';
        }
    },
    
    // Sistema de tema
    theme: {
        init: function() {
            const savedTheme = localStorage.getItem('theme') || APP.config.defaultTheme;
            APP.state.currentTheme = savedTheme;
            this.apply(savedTheme);
            console.log('Sistema de tema inicializado:', savedTheme);
        },
        
        apply: function(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            APP.state.currentTheme = theme;
            
            const darkIcon = APP.elements.darkIcon();
            const lightIcon = APP.elements.lightIcon();
            
            if (darkIcon && lightIcon) {
                darkIcon.style.display = theme === 'dark' ? 'none' : 'inline';
                lightIcon.style.display = theme === 'dark' ? 'inline' : 'none';
            }
        },
        
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
            const searchResults = APP.elements.searchResults();
            if (searchResults) this.displayResults([], '');
        },
        
        perform: function(query) {
            if (!query || query.trim() === '') {
                this.displayResults([], '');
                return;
            }
            
            query = query.toLowerCase().trim();
            const results = APP.data.searchItems.filter(item => 
                item.title.toLowerCase().includes(query) || 
                item.description.toLowerCase().includes(query)
            );
            
            this.displayResults(results, query);
        },
        
        displayResults: function(results, query) {
            const searchResults = APP.elements.searchResults();
            if (!searchResults) return;
            
            if (!query) {
                const placeHolderText = APP.language.getTranslation('search_placeholder', APP.state.currentLanguage) || 'Digite algo para pesquisar...';
                searchResults.innerHTML = `<p>${placeHolderText}</p>`;
                return;
            }
            
            if (results.length === 0) {
                const variables = { query: query };
                const noResultsText = APP.language.getTranslation('search_no_results', APP.state.currentLanguage, variables) || 
                    `Nenhum resultado encontrado para "${query}"`;
                searchResults.innerHTML = `<p>${noResultsText}</p>`;
                return;
            }
            
            let html = '';
            results.forEach(item => {
                const openText = APP.language.getTranslation('open_button', APP.state.currentLanguage) || 'Abrir';
                html += `
                    <div class="search-result-item">
                        <h3>${item.title}</h3>
                        <p>${item.description}</p>
                        <a href="${item.link}" class="btn btn-outline">${openText}</a>
                    </div>
                `;
            });
            
            searchResults.innerHTML = html;
        },
        
        open: function() {
            const searchModal = APP.elements.searchModal();
            const modalInput = APP.elements.modalSearchInput();
            
            if (searchModal) {
                searchModal.classList.add('active');
                if (modalInput) setTimeout(() => modalInput.focus(), 100);
            }
        },
        
        close: function() {
            const searchModal = APP.elements.searchModal();
            if (searchModal) searchModal.classList.remove('active');
        }
    },
    
    // Sistema de horas
    hora: {
        init: function() {
            console.log('Sistema de horário inicializado');
            this.updateCurrentHour();
            setInterval(() => this.updateCurrentHour(), 60000);
        },
        
        updateCurrentHour: function() {
            const horaId = this.determinarHoraAtual();
            const horaNome = APP.language.getHourName(horaId, APP.state.currentLanguage);
            const horaDesc = APP.language.getHourDescription(horaId, APP.state.currentLanguage);
            
            APP.state.horaAtual = {
                id: horaId,
                nome: horaNome,
                descricao: horaDesc
            };
            
            if (APP.state.currentPage === 'index') this.updateHoraUI();
        },
        
        updateHoraUI: function() {
            const container = APP.elements.conteudo();
            if (!container) return;
            
            const horaAtualDiv = container.querySelector('.horario-atual');
            if (horaAtualDiv) {
                const horaInfo = APP.state.horaAtual;
                
                // Atualizar elementos específicos da hora atual que usam textContent
                const horaAtualNome = horaAtualDiv.querySelector('.hora-atual-nome');
                const horaAtualDesc = horaAtualDiv.querySelector('.hora-atual-desc');
                
                if (horaAtualNome) horaAtualNome.textContent = horaInfo.nome;
                if (horaAtualDesc) horaAtualDesc.textContent = horaInfo.descricao;
                
                // Re-aplicar traduções com variáveis atualizadas
                APP.language.updateTranslatableElements(APP.state.currentLanguage);
                
                // Atualizar elementos data-hora-* com os valores atuais
                const elementos = document.querySelectorAll('[data-hora-nome]');
                elementos.forEach(el => {
                    el.textContent = horaInfo.nome;
                });
                
                const descElements = document.querySelectorAll('[data-hora-desc]');
                descElements.forEach(el => {
                    el.textContent = horaInfo.descricao;
                });
                
                // Atualizar href do botão da hora atual
                const horaAtualBtn = horaAtualDiv.querySelector('a.btn');
                if (horaAtualBtn) {
                    horaAtualBtn.href = 'horas/' + horaInfo.id + '.html';
                    horaAtualBtn.onclick = function(e) {
                        e.preventDefault();
                        window.location.href = 'horas/' + horaInfo.id + '.html';
                        return false;
                    };
                }
            }
        },
        
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
            return 'matinas';
        }
    },
    
    // Sistema de notificações
    notifications: {
        configure: function() {
            if (!("Notification" in window)) {
                const message = APP.language.getTranslation('notifications_not_supported', APP.state.currentLanguage) || 
                    "Este navegador não suporta notificações.";
                alert(message);
                return;
            }
            
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    localStorage.setItem("notificar_todas", "sim");
                    const message = APP.language.getTranslation('notifications_enabled', APP.state.currentLanguage) || 
                        "Notificações ativadas! Você receberá lembretes para cada hora do Ofício.";
                    alert(message);
                    this.schedule();
                }
            });
        },
        
        schedule: function() {
            if (APP.data.notificationTimer) {
                clearInterval(APP.data.notificationTimer);
            }
            
            APP.data.notificationTimer = setInterval(() => {
                const agora = new Date();
                const horaAtual = agora.getHours();
                const minutoAtual = agora.getMinutes();
                
                Object.entries(APP.config.horaOficio).forEach(([horaId, horaInfo]) => {
                    if (localStorage.getItem("notificar_todas") === "sim" && 
                        horaAtual === horaInfo.hora && 
                        minutoAtual === horaInfo.minuto) {
                        
                        const horaNome = APP.language.getHourName(horaId, APP.state.currentLanguage);
                        const variables = { nomeDaHora: horaNome };
                        const title = APP.language.getTranslation('notification_title', APP.state.currentLanguage, variables) || 
                            `Hora do Ofício: ${horaNome}`;
                        const body = APP.language.getTranslation('notification_body', APP.state.currentLanguage, variables) || 
                            `É hora de rezar ${horaNome}.`;
                            
                        new Notification(title, {
                            body: body
                        });
                    }
                });
            }, 60000);
        }
    },
    
    // Event listeners
    initEventListeners: function() {
        console.log('Inicializando event listeners...');
        
        const themeToggle = this.elements.themeToggle();
        if (themeToggle) themeToggle.addEventListener('click', () => this.theme.toggle());
        
        const searchInput = this.elements.searchInput();
        if (searchInput) searchInput.addEventListener('focus', () => this.search.open());
        
        const closeSearch = this.elements.closeSearch();
        if (closeSearch) closeSearch.addEventListener('click', () => this.search.close());
        
        const modalSearchInput = this.elements.modalSearchInput();
        if (modalSearchInput) {
            modalSearchInput.addEventListener('input', function() {
                APP.search.perform(this.value);
            });
        }
        
        const dataAtualEl = document.getElementById('dataAtual');
        if (dataAtualEl) {
            const hoje = new Date();
            const opcoes = { day: 'numeric', month: 'long', year: 'numeric' };
            const lang = APP.state.currentLanguage || 'pt-BR';
            const localeMap = {
                'pt': 'pt-BR',
                'en': 'en-US'
            };
            dataAtualEl.textContent = hoje.toLocaleDateString(localeMap[lang] || lang, opcoes);
        }
        
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                APP.search.open();
            }
            
            if (e.key === 'Escape') APP.search.close();
        });
        
        // Adicionar function para o botão de notificações
        window.configurarNotificacoes = function() {
            APP.notifications.configure();
        };
        
        this.adaptLinks();
    },
    
    adaptLinks: function() {
        document.querySelectorAll('[onclick*="carregarPagina"]').forEach(el => {
            const match = el.getAttribute('onclick').match(/carregarPagina\('([^']+)'\)/);
            if (match && match[1]) {
                const pagina = match[1];
                el.setAttribute('onclick', '');
                if (Object.keys(APP.config.horaOficio).includes(pagina)) {
                    el.setAttribute('href', 'horas/' + pagina + '.html');
                } else {
                    el.setAttribute('href', pagina + '.html');
                }
            }
        });
    },
    
    // Inicialização dos subsistemas
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

// Expor a aplicação globalmente
window.APP = APP;

// Inicialização quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    APP.init();
});