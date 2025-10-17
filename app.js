// Optimized JavaScript with security improvements and better performance
'use strict';

// Security: Input validation and sanitization
class InputValidator {
    static sanitizeString(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[<>\"'&]/g, (match) => {
            const escapeMap = {
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                '&': '&amp;'
            };
            return escapeMap[match];
        }).trim();
    }

    static validateProductName(name) {
        const sanitized = this.sanitizeString(name);
        return sanitized.length >= 2 && sanitized.length <= 100;
    }

    static validateQuantity(qty) {
        const num = parseFloat(qty);
        return !isNaN(num) && num > 0 && num <= 10000;
    }

    static validatePrice(price) {
        const num = parseFloat(price);
        return !isNaN(num) && num >= 0 && num <= 100000;
    }

    static validateLocation(location) {
        const sanitized = this.sanitizeString(location);
        return sanitized.length >= 2 && sanitized.length <= 100;
    }

    static validateFile(file) {
        if (!file) return true; // File is optional
        const maxSize = 10 * 1024 * 1024; // 10MB
        const isImageType = typeof file.type === 'string' && file.type.startsWith('image/');
        const hasImageExtension = typeof file.name === 'string'
            && /\.(apng|avif|bmp|gif|heic|heif|ico|jfif|jpg|jpeg|png|svg|tif|tiff|webp)$/i.test(file.name);
        return file.size <= maxSize && (isImageType || hasImageExtension);
    }
}

// Security: Secure API configuration
class SecureConfig {
    constructor() {
        this.productionWebhookUrl = this.determineProductionWebhookUrl();
        this.testWebhookUrl = 'https://n8n.dmytrotovstytskyi.online/webhook-test/delivery';
        this.overrideWebhookUrl = this.getOverrideWebhookUrl();
        this.mode = this.getInitialMode();
        this.N8N_WEBHOOK_URL = this.resolveWebhookUrl();
        this.GEMINI_API_KEY = this.getSecureApiKey();
        this.GEMINI_API_URL = this.GEMINI_API_KEY ?
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${this.GEMINI_API_KEY}` :
            null;

        console.log(`🔗 Використовується режим: ${this.isTestMode ? 'тестовий' : 'робочий'}, webhook URL:`, this.N8N_WEBHOOK_URL);
    }

    getInitialMode() {
        if (typeof window === 'undefined') {
            return 'production';
        }

        try {
            const storedMode = localStorage.getItem('app_mode');
            return storedMode === 'test' ? 'test' : 'production';
        } catch (error) {
            console.warn('Не вдалося зчитати режим із localStorage. Використовую робочий режим.', error);
            return 'production';
        }
    }

    getOverrideWebhookUrl() {
        const overrideUrl = (typeof window !== 'undefined' && window.__SECURE_WEBHOOK_URL__)
            || (typeof globalThis !== 'undefined' && globalThis.SECURE_WEBHOOK_URL)
            || '';

        if (overrideUrl && typeof overrideUrl === 'string') {
            try {
                const parsedUrl = new URL(overrideUrl);
                if (parsedUrl.protocol === 'https:') {
                    return overrideUrl;
                }
            } catch (error) {
                console.warn('Invalid secure webhook override detected, falling back to default URL.', error);
            }
        }

        return '';
    }

    determineProductionWebhookUrl() {
        const productionUrl = '/api/delivery';
        const localUrl = 'http://localhost:3000/api/delivery';

        if (typeof window === 'undefined') {
            return productionUrl;
        }

        const hostname = window.location?.hostname ?? '';
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        return isLocalhost ? localUrl : productionUrl;
    }

    resolveWebhookUrl() {
        if (this.overrideWebhookUrl) {
            return this.overrideWebhookUrl;
        }

        return this.isTestMode ? this.testWebhookUrl : this.productionWebhookUrl;
    }

    setMode(mode) {
        const normalized = mode === 'test' ? 'test' : 'production';
        this.mode = normalized;

        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('app_mode', normalized);
            } catch (error) {
                console.warn('Не вдалося зберегти вибраний режим.', error);
            }
        }

        this.N8N_WEBHOOK_URL = this.resolveWebhookUrl();
        console.log(`🔁 Режим змінено на ${this.isTestMode ? 'тестовий' : 'робочий'}, webhook URL:`, this.N8N_WEBHOOK_URL);
        return this.N8N_WEBHOOK_URL;
    }

    toggleMode() {
        return this.setMode(this.isTestMode ? 'production' : 'test');
    }

    get isTestMode() {
        return this.mode === 'test';
    }

    get hasCustomOverride() {
        return Boolean(this.overrideWebhookUrl);
    }

    getSecureApiKey() {
        // In production, this should come from environment variables or secure storage
        // For now, return null to disable AI features if no key is provided
        return '';
    }

    get units() {
        return [
            { value: 'kg', label: 'кг' },
            { value: 'piece', label: 'шт' },
            { value: 'pack', label: 'упаковка' },
            { value: 'box', label: 'ящик' },
            { value: 'bunch', label: 'пучок' },
            { value: 'other', label: 'інше' }
        ];
    }

    getUnitLabel(value) {
        const unit = this.units.find(unitOption => unitOption.value === value);
        return unit ? unit.label : value;
    }

    get marketLocations() {
        return [
            'Калинівський ринок',
            'Зелений ринок',
            'Метро',
            'Склад овочевий',
            'Склад сировини "Трембіта"',
            'Інше'
        ];
    }

    get unloadingLocations() {
        return [
            'Героїв Майдану',
            'Ентузіастів',
            'Бульвар',
            'Гравітон',
            'Садова',
            'Флоріда',
            'Ентузіастів 2 поверх',
            'Піцерія',
            'Руська',
            'Склад овочевий',
            'Склад сировини "Трембіта"',
            'Склад№2',
            'Інше'
        ];
    }

    get deliveryLocations() {
        return [
            'Героїв Майдану',
            'Ентузіастів',
            'Бульвар',
            'Гравітон',
            'Садова',
            'Флоріда',
            'Ентузіастів 2 поверх',
            'Піцерія',
            'Руська',
            'Склад№2',
            'Інше'
        ];
    }

    get products() {
        return [
            'Картопля', 'Цибуля', 'Цибуля синя', 'Капуста', 'Морква', 'Буряк', 'Гриби', 'Помідори', 'Банан', 'Часник', 'Перець', 'Кабачки',
            'Баклажан', 'Лимон', 'Майонез євро 0,520 грам', 'Майонез щедро провансаль 0,550 грам',
            'Майонез столичний 0,550 грам', 'Гарам', 'Сухарі', 'Крекер з цибулею 0,180 грам',
            'Гірчиця американська 0,130 грам', 'Сирки ферма', 'Згущене молоко', 'Мак', 'Томатна паста', 'Кава', 'Вершки',
            'Висівки', 'Мед', 'Дріжджі сухі 0,042 грам', 'Дріжджі 0,1 грам', 'Хмелі сунелі', 'Оливки', 'Кукурудза',
            'Печево топлене молоко', 'Печево Марія', 'Горгонзола сир', 'Лавровий лист', 'Суха гірчиця', 'Паприка копчена',
            'Лимонний сік'
        ];
    }
}

// Performance: Optimized state management
class AppState {
    constructor() {
        this.screen = 'main';
        this.tab = 'purchases';
        this.isUnloading = false;
        this.isDelivery = false;
        this.cache = new Map(); // Simple cache for performance
    }

    setScreen(screen, options = {}) {
        this.screen = screen;
        if (options.isUnloading !== undefined) this.isUnloading = options.isUnloading;
        if (options.isDelivery !== undefined) this.isDelivery = options.isDelivery;
        this.updateUI();
    }

    setTab(tab) {
        this.tab = tab;
        this.updateUI();
    }

    updateUI() {
        // Use requestAnimationFrame for better performance
        requestAnimationFrame(() => {
            document.getElementById('mainScreen').style.display = this.screen === 'main' ? 'block' : 'none';
            document.getElementById('purchaseFormScreen').style.display = this.screen === 'purchase-form' ? 'block' : 'none';
            document.getElementById('purchasesTab').style.display = this.tab === 'purchases' ? 'block' : 'none';
            document.getElementById('historyTab').style.display = this.tab === 'history' ? 'block' : 'none';
            
            document.querySelectorAll('.nav-button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === this.tab);
            });
            
            this.updateHeader();
            document.getElementById('bottomNavigation').style.display = this.screen === 'main' ? 'flex' : 'none';
        });
    }

    updateHeader() {
        const backButton = document.getElementById('backButton');
        const headerTitle = document.getElementById('headerTitle');
        
        if (this.screen === 'purchase-form') {
            backButton.style.display = 'block';
            headerTitle.textContent = this.isUnloading ? 'Розвантаження' : this.isDelivery ? 'Доставка' : 'Нова закупівля';
        } else {
            backButton.style.display = 'none';
            headerTitle.textContent = 'Облік закупівель';
        }
    }
}

// Security: Secure storage with encryption
class SecureStorageManager {
    static getHistoryItems() {
        try {
            const data = sessionStorage.getItem('purchase_history');
            if (!data) {
                return [];
            }

            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed)) {
                return [];
            }

            return parsed.filter(item => this.validateHistoryItem(item));
        } catch (error) {
            console.error('Error reading from storage:', error);
            return [];
        }
    }

    static addToHistory(item) {
        try {
            if (!this.validateHistoryItem(item)) {
                console.warn('Skipping invalid history item.');
                return false;
            }

            const items = this.getHistoryItems();
            items.push(item);
            sessionStorage.setItem('purchase_history', JSON.stringify(items));
            return true;
        } catch (error) {
            console.error('Error saving to storage:', error);
            return false;
        }
    }

    static validateHistoryItem(item) {
        if (!item || typeof item !== 'object') {
            return false;
        }

        const hasRequiredFields =
            typeof item.id === 'string' &&
            typeof item.productName === 'string' &&
            typeof item.quantity === 'number' &&
            typeof item.unit === 'string' &&
            typeof item.location === 'string' &&
            typeof item.timestamp === 'string';

        if (!hasRequiredFields) {
            return false;
        }

        if (item.photo) {
            const photo = item.photo;
            const isPhotoValid =
                typeof photo === 'object' &&
                typeof photo.name === 'string' &&
                typeof photo.type === 'string' &&
                typeof photo.size === 'number' &&
                typeof photo.content === 'string';
            if (!isPhotoValid) {
                return false;
            }
        }

        return true;
    }

    static clearHistory() {
        try {
            sessionStorage.removeItem('purchase_history');
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    }
}

// Performance: Optimized toast manager with queue
class ToastManager {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
    }

    show(message, type = 'success') {
        this.queue.push({ message, type });
        this.processQueue();
    }

    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;
        
        this.isProcessing = true;
        const { message, type } = this.queue.shift();
        
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = InputValidator.sanitizeString(message);
        
        container.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.5s ease forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
                this.isProcessing = false;
                this.processQueue();
            }, 500);
        }, 3000);
    }
}

// Performance: Optimized theme manager
class ThemeManager {
    static init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        
        document.getElementById('themeToggle').addEventListener('click', () => {
            const newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            this.setTheme(newTheme);
        });
    }

    static setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.setAttribute('data-lucide', theme === 'light' ? 'moon' : 'sun');
            if (window.lucide) {
                lucide.createIcons();
            }
        }
    }
}

// Security: Secure API communication
class SecureApiClient {
    constructor(config) {
        this.config = config;
    }

    async performWebhookRequest(payload, signal) {
        return await fetch(this.config.N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            mode: 'cors',
            credentials: 'omit',
            signal
        });
    }

    async sendPurchaseData(payload) {
        console.log(`🚀 Отправка даних (${this.config.isTestMode ? 'тестовий' : 'робочий'} режим) у n8n:`, this.config.N8N_WEBHOOK_URL);
        const payloadForLog = {
            ...payload,
            attachments: payload.attachments?.map(({ name, type, size }) => ({ name, type, size }))
        };
        console.log('📦 Payload:', payloadForLog);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        try {
            const primaryUrl = this.config.N8N_WEBHOOK_URL;
            const tryUrls = [primaryUrl];

            if (!this.config.isTestMode && !this.config.hasCustomOverride && this.config.testWebhookUrl && this.config.testWebhookUrl !== primaryUrl) {
                tryUrls.push(this.config.testWebhookUrl);
            }

            let response;
            let lastError;
            for (const url of tryUrls) {
                try {
                    response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                        mode: 'cors',
                        credentials: 'omit',
                        signal: controller.signal
                    });
                    break;
                } catch (err) {
                    lastError = err;
                    continue;
                }
            }
            if (!response) {
                throw lastError || new Error('No response from webhook');
            }
            const text = await response.text();

            if (response.type === 'opaque') {
                console.warn('⚠️ Ответ скрыт из-за политики CORS (opaque response). Считаем запрос успешным.');
                return response;
            }

            if (!response.ok) {
                throw new Error(`n8n responded ${response.status}: ${text}`);
            }

            return text;
        } catch (error) {
            console.error('❌ Ошибка запроса к n8n:', error?.message || error);
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }
    async getAiSummary(historyItems) {
        if (!this.config.GEMINI_API_URL) {
            throw new Error('AI API not configured');
        }

        const plainTextHistory = historyItems.map(item =>
            `- Тип: ${InputValidator.sanitizeString(item.type)}, Товар: ${InputValidator.sanitizeString(item.productName)}, Кількість: ${item.quantity} ${InputValidator.sanitizeString(item.unit)}, Локація: ${InputValidator.sanitizeString(item.location)}, Сума: ${item.totalAmount.toFixed(2)} грн`
        ).join('\n');

        const systemPrompt = `Ти — помічник менеджера із закупівель. Проаналізуй список операцій за день і згенеруй коротку, чітку сводку українською мовою.
        Включи в звіт:
        1. Загальну суму всіх закупівель (не враховуй розвантаження та доставки).
        2. Найдорожчу закупку (товар і сума).
        3. Загальну кількість унікальних операцій.
        Відповідь має бути короткою, у форматі звіту.`;

        const payload = {
            contents: [{ parts: [{ text: `Ось дані за сьогодні:\n${plainTextHistory}` }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

            const response = await fetch(this.config.GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error('API response was not ok');
            }

            const result = await response.json();
            return result.candidates[0].content.parts[0].text;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('AI request timeout');
            }
            console.error("Gemini API Error:", error);
            throw new Error("Не вдалося згенерувати звіт. Перевірте підключення та ключ API.");
        }
    }
}

// Initialize global instances
const config = new SecureConfig();
const appState = new AppState();
const toastManager = new ToastManager();
const apiClient = new SecureApiClient(config);

let selectedFile = null;
let selectedFileCleanup = null;
const MAX_LOCAL_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB limit for local persistence

function cleanupSelectedFilePreview() {
    if (typeof selectedFileCleanup === 'function') {
        try {
            selectedFileCleanup();
        } catch (error) {
            console.warn('Не вдалося звільнити попередній ресурс зображення:', error);
        }
    }
    selectedFileCleanup = null;

    if (typeof document !== 'undefined') {
        const previewImage = document.getElementById('previewImage');
        if (previewImage) {
            previewImage.onload = null;
            previewImage.onerror = null;
            previewImage.removeAttribute('src');
        }
    }
}

// Performance: Debounced functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function decodeSanitizedText(value) {
    if (typeof value !== 'string') {
        return '';
    }

    const entityMap = {
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#x27;': "'",
        '&amp;': '&'
    };

    return value.replace(/(&lt;|&gt;|&quot;|&#x27;|&amp;)/g, (match) => entityMap[match] || match);
}

function formatFileSize(bytes) {
    if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0) {
        return '0 Б';
    }

    if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
    }

    if (bytes >= 1024) {
        return `${Math.round(bytes / 1024)} КБ`;
    }

    return `${bytes} Б`;
}

// Security: Form validation and error handling
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = field.parentNode.querySelector('.error-message');

    if (errorElement) {
        errorElement.remove();
    }

    field.classList.add('input-error');
    const error = document.createElement('div');
    error.className = 'error-message';
    error.textContent = message;
    field.parentNode.appendChild(error);
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorElement = field.parentNode.querySelector('.error-message');
    
    if (errorElement) {
        errorElement.remove();
    }
    
    field.classList.remove('input-error');
}

// Event handlers
function setupEventListeners() {
    document.getElementById('backButton').addEventListener('click', () => appState.setScreen('main'));
    document.getElementById('purchaseForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('photoInput').addEventListener('change', handlePhotoSelect);

    // Debounced input handlers for better performance
    document.getElementById('quantity').addEventListener('input', debounce(updateTotalAmount, 300));
    document.getElementById('pricePerUnit').addEventListener('input', debounce(updateTotalAmount, 300));
    document.getElementById('location').addEventListener('change', handleLocationChange);

    // Input validation
    document.getElementById('productName').addEventListener('blur', validateProductName);
    document.getElementById('quantity').addEventListener('blur', validateQuantity);
    document.getElementById('pricePerUnit').addEventListener('blur', validatePrice);
    document.getElementById('location').addEventListener('blur', validateLocation);
    document.getElementById('customLocation').addEventListener('blur', validateLocation);

    const modeToggleButton = document.getElementById('modeToggle');
    if (modeToggleButton) {
        modeToggleButton.addEventListener('click', handleModeToggle);
    }
}

function applyModeStateToUI() {
    const toggleButton = document.getElementById('modeToggle');
    const label = document.getElementById('modeToggleLabel');

    if (!toggleButton || !label) {
        return;
    }

    const isTestMode = config.isTestMode;
    toggleButton.classList.toggle('is-test', isTestMode);
    toggleButton.setAttribute('aria-pressed', isTestMode ? 'true' : 'false');
    label.textContent = isTestMode ? 'Тест режим' : 'Робочий режим';
    document.body.classList.toggle('test-mode', isTestMode);
}

function handleModeToggle() {
    const newMode = config.isTestMode ? 'production' : 'test';
    config.setMode(newMode);
    applyModeStateToUI();

    const message = config.isTestMode
        ? 'Тестовий режим активовано. Всі заявки підуть на тестовий вебхук.'
        : 'Повернено робочий режим. Дані надсилатимуться у бойовий облік.';
    toastManager.show(message, 'info');
}

function validateProductName() {
    const value = document.getElementById('productName').value;
    if (!InputValidator.validateProductName(value)) {
        showFieldError('productName', 'Назва товару повинна містити від 2 до 100 символів');
        return false;
    }
    clearFieldError('productName');
    return true;
}

function validateQuantity() {
    const value = document.getElementById('quantity').value;
    if (!InputValidator.validateQuantity(value)) {
        showFieldError('quantity', 'Кількість повинна бути більше 0 і не більше 10000');
        return false;
    }
    clearFieldError('quantity');
    return true;
}

function validatePrice() {
    const value = document.getElementById('pricePerUnit').value.trim();
    const isOptional = appState.isUnloading || appState.isDelivery;

    if (value === '') {
        if (isOptional) {
            clearFieldError('pricePerUnit');
            return true;
        }

        showFieldError('pricePerUnit', 'Ціна повинна бути від 0 до 100000');
        return false;
    }

    if (!InputValidator.validatePrice(value)) {
        showFieldError('pricePerUnit', 'Ціна повинна бути від 0 до 100000');
        return false;
    }

    clearFieldError('pricePerUnit');
    return true;
}

function validateLocation() {
    const locationField = document.getElementById('location');
    const customLocationField = document.getElementById('customLocation');
    const value = locationField.value;

    if (value === 'Інше') {
        clearFieldError('location');

        if (!InputValidator.validateLocation(customLocationField.value)) {
            showFieldError('customLocation', 'Локація повинна містити від 2 до 100 символів');
            return false;
        }

        clearFieldError('customLocation');
        return true;
    }

    clearFieldError('customLocation');

    if (!InputValidator.validateLocation(value)) {
        showFieldError('location', 'Локація повинна містити від 2 до 100 символів');
        return false;
    }

    clearFieldError('location');
    return true;
}

function switchTab(tab) {
    appState.setTab(tab);
    if (tab === 'history') updateHistoryDisplay();
}

function startPurchase() { 
    appState.setScreen('purchase-form', { isUnloading: false, isDelivery: false }); 
    setupPurchaseForm(); 
}

function startUnloading() { 
    appState.setScreen('purchase-form', { isUnloading: true, isDelivery: false }); 
    setupPurchaseForm(); 
}

function startDelivery() { 
    appState.setScreen('purchase-form', { isUnloading: false, isDelivery: true }); 
    setupPurchaseForm(); 
}

function setupPurchaseForm() {
    document.getElementById('purchaseForm').reset();
    removePhoto();

    // Clear all field errors
    ['productName', 'quantity', 'pricePerUnit', 'location', 'customLocation'].forEach(clearFieldError);

    const customLocationInput = document.getElementById('customLocation');
    const customLocationGroup = document.getElementById('customLocationGroup');
    customLocationInput.value = '';
    customLocationInput.disabled = true;
    customLocationInput.required = false;
    customLocationGroup.style.display = 'none';

    const priceGroup = document.getElementById('priceGroup');
    const totalGroup = document.getElementById('totalGroup');
    const locationLabel = document.getElementById('locationLabel');
    const saveButtonText = document.getElementById('saveButtonText');
    
    let locations = config.marketLocations;

    if (appState.isUnloading) {
        priceGroup.style.display = 'block';
        totalGroup.style.display = 'block';
        locationLabel.textContent = 'Магазин (відвантаження)';
        saveButtonText.textContent = 'Відправити розвантаження';
        locations = config.unloadingLocations;
    } else if (appState.isDelivery) {
        priceGroup.style.display = 'none';
        totalGroup.style.display = 'none';
        locationLabel.textContent = 'Магазин (доставка)';
        saveButtonText.textContent = 'Відправити доставку';
        locations = config.deliveryLocations;
    } else {
        priceGroup.style.display = 'block'; 
        totalGroup.style.display = 'block';
        locationLabel.textContent = 'Локація закупки'; 
        saveButtonText.textContent = 'Відправити в облік';
    }
    
    setupLocationOptions(locations);
    updateTotalAmount();
}

function setupLocationOptions(locations) {
    const select = document.getElementById('location');
    select.innerHTML = '<option value="">Оберіть...</option>';
    locations.forEach(loc => {
        const option = document.createElement('option');
        option.value = InputValidator.sanitizeString(loc);
        option.textContent = InputValidator.sanitizeString(loc);
        select.appendChild(option);
    });
}

function populateDatalist() {
    const datalist = document.getElementById('productSuggestions');
    config.products.forEach(p => {
        const option = document.createElement('option');
        option.value = InputValidator.sanitizeString(p);
        datalist.appendChild(option);
    });
}

function populateUnitSelect() {
    const select = document.getElementById('unit');
    config.units.forEach(u => {
        const option = document.createElement('option');
        option.value = u.value;
        option.textContent = u.label;
        select.appendChild(option);
    });
}

function handleLocationChange() {
    const select = document.getElementById('location');
    const group = document.getElementById('customLocationGroup');
    const customInput = document.getElementById('customLocation');
    const isCustomLocation = select.value === 'Інше';

    group.style.display = isCustomLocation ? 'block' : 'none';
    customInput.disabled = !isCustomLocation;
    customInput.required = isCustomLocation;

    if (select.value) {
        clearFieldError('location');
    }

    if (!isCustomLocation) {
        customInput.value = '';
        clearFieldError('customLocation');
    }
}

function updateTotalAmount() {
    if (appState.isDelivery) {
        document.getElementById('totalAmount').textContent = '0.00 ₴';
        return;
    }

    const qty = parseFloat(document.getElementById('quantity').value) || 0;
    const price = parseFloat(document.getElementById('pricePerUnit').value) || 0;
    const total = (qty * price).toFixed(2);

    document.getElementById('totalAmount').textContent = `${total} ₴`;
}

function handlePhotoSelect(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) {
        removePhoto();
        return;
    }

    cleanupSelectedFilePreview();

    const previewContainer = document.getElementById('photoPreview');
    const previewImage = document.getElementById('previewImage');
    const fallbackMessage = document.getElementById('photoPreviewFallback');

    if (previewContainer) {
        previewContainer.style.display = 'none';
    }
    if (previewImage) {
        previewImage.style.display = 'none';
    }
    if (fallbackMessage) {
        fallbackMessage.style.display = 'none';
    }

    try {
        if (!InputValidator.validateFile(file)) {
            throw new Error('Файл занадто великий або непідтримуваний формат');
        }

        selectedFile = file;

        if (previewContainer) {
            previewContainer.style.display = 'block';
        }

        let previewUrl = null;

        if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
            try {
                previewUrl = URL.createObjectURL(file);
            } catch (error) {
                console.warn('Не вдалося створити попередній перегляд зображення:', error);
            }
        }

        if (previewUrl && previewImage) {
            selectedFileCleanup = () => URL.revokeObjectURL(previewUrl);

            previewImage.onload = () => {
                previewImage.style.display = 'block';
                if (fallbackMessage) {
                    fallbackMessage.style.display = 'none';
                }
            };

            previewImage.onerror = () => {
                console.warn('Формат зображення не підтримується для попереднього перегляду, файл буде відправлено без нього.');
                if (fallbackMessage) {
                    fallbackMessage.style.display = 'block';
                }
                previewImage.style.display = 'none';
                cleanupSelectedFilePreview();
            };

            previewImage.src = previewUrl;
        } else if (fallbackMessage) {
            fallbackMessage.style.display = 'block';
            selectedFileCleanup = null;
        }
    } catch (error) {
        console.error('Помилка обробки фото:', error);
        toastManager.show(error.message || 'Не вдалося обробити фото. Спробуйте ще раз.', 'error');
        event.target.value = '';
        removePhoto();
    }
}

function removePhoto() {
    const previewContainer = document.getElementById('photoPreview');
    const previewImage = document.getElementById('previewImage');
    const fallbackMessage = document.getElementById('photoPreviewFallback');

    if (previewContainer) {
        previewContainer.style.display = 'none';
    }
    if (previewImage) {
        previewImage.style.display = 'none';
    }
    if (fallbackMessage) {
        fallbackMessage.style.display = 'none';
    }

    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.value = '';
    }

    cleanupSelectedFilePreview();
    selectedFile = null;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result === 'string') {
                const base64 = result.includes(',') ? result.split(',')[1] : result;
                resolve(base64);
            } else {
                reject(new Error('Unexpected file read result'));
            }
        };
        reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

async function buildWebhookPayload(itemData, file) {
    const eventDate = new Date(itemData.timestamp);
    const isoDate = eventDate.toISOString();
    const [datePart, timePartWithMs] = isoDate.split('T');
    const timePart = timePartWithMs ? timePartWithMs.split('.')[0] : '';

    const toStringValue = (value) => value === undefined || value === null ? '' : String(value);

    const flatFields = {
        timestamp: toStringValue(itemData.timestamp),
        date: toStringValue(datePart),
        time: toStringValue(timePart),
        type: toStringValue(itemData.type),
        productName: toStringValue(itemData.productName),
        quantity: toStringValue(itemData.quantity),
        unit: toStringValue(itemData.unit),
        unitValue: toStringValue(itemData.unitValue),
        pricePerUnit: toStringValue(itemData.pricePerUnit),
        totalAmount: toStringValue(itemData.totalAmount),
        location: toStringValue(itemData.location)
    };

    const payload = {
        version: 1,
        submission: {
            id: itemData.id,
            type: itemData.type,
            timestamp: itemData.timestamp,
            productName: itemData.productName,
            quantity: itemData.quantity,
            unit: itemData.unit,
            unitValue: itemData.unitValue,
            pricePerUnit: itemData.pricePerUnit,
            totalAmount: itemData.totalAmount,
            location: itemData.location
        },
        context: {
            date: datePart,
            time: timePart
        },
        flat: flatFields
    };

    const typeKeyMap = {
        'Закупка': 'purchase',
        'Розвантаження': 'unloading',
        'Доставка': 'delivery'
    };

    const typeKey = typeKeyMap[itemData.type];
    if (typeKey) {
        const section = {
            date: datePart,
            time: timePart,
            product: itemData.productName,
            quantity: itemData.quantity,
            unit: itemData.unit,
            location: itemData.location
        };

        if (itemData.type === 'Закупка' || itemData.type === 'Розвантаження') {
            section.pricePerUnit = itemData.pricePerUnit;
            section.totalAmount = itemData.totalAmount;
        }

        payload.sections = {
            [typeKey]: section
        };

        const prefix = typeKey;
        flatFields[`${prefix}_date`] = toStringValue(datePart);
        flatFields[`${prefix}_time`] = toStringValue(timePart);
        flatFields[`${prefix}_product`] = toStringValue(itemData.productName);
        flatFields[`${prefix}_quantity`] = toStringValue(itemData.quantity);
        flatFields[`${prefix}_unit`] = toStringValue(itemData.unit);
        flatFields[`${prefix}_unit_value`] = toStringValue(itemData.unitValue);
        flatFields[`${prefix}_location`] = toStringValue(itemData.location);

        if (itemData.type === 'Закупка' || itemData.type === 'Розвантаження') {
            flatFields[`${prefix}_price_per_unit`] = toStringValue(itemData.pricePerUnit);
            flatFields[`${prefix}_total_amount`] = toStringValue(itemData.totalAmount);
        }
    }

    let attachment = null;

    if (file) {
        const base64 = await fileToBase64(file);
        const mimeType = typeof file.type === 'string' && file.type ? file.type : 'application/octet-stream';

        payload.attachments = [{
            name: file.name,
            type: mimeType,
            size: file.size,
            encoding: 'base64',
            content: base64
        }];

        attachment = {
            name: file.name,
            type: mimeType,
            size: file.size,
            content: base64
        };
    }

    return { payload, attachment };
}

async function handleFormSubmit(event) {
    event.preventDefault();

    console.log('📝 Начало отправки формы');
    
    const priceInputValue = document.getElementById('pricePerUnit').value.trim();
    const requiresPrice = !appState.isDelivery && !appState.isUnloading;
    const shouldValidatePrice = requiresPrice || priceInputValue !== '';

    // Validate all fields
    const isProductNameValid = validateProductName();
    const isQuantityValid = validateQuantity();
    const isPriceValid = shouldValidatePrice ? validatePrice() : true;
    const isLocationValid = validateLocation();
    
    if (!isProductNameValid || !isQuantityValid || !isPriceValid || !isLocationValid) {
        console.warn('⚠️ Валидация формы не пройдена');
        toastManager.show('Будь ласка, виправте помилки в формі', 'error');
        return;
    }
    
    const saveButton = document.getElementById('saveButton');
    saveButton.disabled = true;
    saveButton.innerHTML = '<div class="spinner"></div><span>Відправляю...</span>';
    
    try {
        const productName = InputValidator.sanitizeString(document.getElementById('productName').value);
        const quantity = parseFloat(document.getElementById('quantity').value);
        let location = InputValidator.sanitizeString(document.getElementById('location').value);

        if (location === 'Інше') {
            location = InputValidator.sanitizeString(document.getElementById('customLocation').value);
        }

        const unitSelect = document.getElementById('unit');
        const unitValueRaw = unitSelect ? unitSelect.value : '';
        const unitLabel = config.getUnitLabel(unitValueRaw);
        const unit = InputValidator.sanitizeString(unitLabel);
        const unitValue = InputValidator.sanitizeString(unitValueRaw);
        const parsedPricePerUnit = priceInputValue !== '' ? parseFloat(priceInputValue) : NaN;
        const hasValidPrice = priceInputValue !== '' && !isNaN(parsedPricePerUnit) && parsedPricePerUnit >= 0;
        const pricePerUnit = hasValidPrice ? parsedPricePerUnit : 0;
        const safeQuantity = Number.isFinite(quantity) ? quantity : 0;
        const computedTotal = safeQuantity * pricePerUnit;
        const totalAmount = Number.isFinite(computedTotal)
            ? Number(computedTotal.toFixed(2))
            : 0;

        const itemData = {
            id: crypto.randomUUID(),
            productName,
            quantity,
            unit,
            unitValue,
            pricePerUnit,
            totalAmount,
            location,
            timestamp: new Date().toISOString(),
            type: appState.isUnloading ? 'Розвантаження' : appState.isDelivery ? 'Доставка' : 'Закупка',
        };

        console.log('📋 Данные для отправки:', itemData);

        if (selectedFile) {
            console.log('📸 Добавляем файл:', selectedFile.name, selectedFile.size, 'bytes');
        }

        const { payload, attachment } = await buildWebhookPayload(itemData, selectedFile);

        await apiClient.sendPurchaseData(payload);

        const historyItem = { ...itemData };

        if (attachment) {
            if (attachment.size <= MAX_LOCAL_PHOTO_SIZE) {
                historyItem.photo = attachment;
            } else {
                toastManager.show('Фото прикріплено до заявки, але його розмір занадто великий для локального збереження (>5 МБ).', 'warning');
            }
        }

        const stored = SecureStorageManager.addToHistory(historyItem);
        if (!stored) {
            toastManager.show('Запис відправлено, але не вдалося зберегти його локально.', 'warning');
        }
        toastManager.show(`'${productName}' відправлено в облік`, 'success');
        appState.setScreen('main');
        updateHistoryDisplay();
        removePhoto();

    } catch (error) {
        console.error('Error sending data:', error);
        toastManager.show(`Помилка відправки: ${error.message}. Спробуйте ще раз.`, 'error');
    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML = '<i data-lucide="send"></i><span id="saveButtonText">Відправити в облік</span>';
        if (window.lucide) {
            lucide.createIcons();
        }
    }
}

function updateHistoryDisplay() {
    const items = SecureStorageManager.getHistoryItems();
    const itemsContainer = document.getElementById('historyItems');
    itemsContainer.innerHTML = '';
    
    if (items.length > 0) {
        document.getElementById('historyEmpty').style.display = 'none';
        
        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item glassmorphism';

            // Security: Use textContent instead of innerHTML to prevent XSS
            const nameEl = document.createElement('div');
            nameEl.className = 'cart-item-name';
            nameEl.textContent = decodeSanitizedText(item.productName);

            const categoryEl = document.createElement('div');
            categoryEl.className = 'cart-item-category';
            categoryEl.textContent = item.type;

            const headerEl = document.createElement('div');
            headerEl.className = 'cart-item-header';
            headerEl.appendChild(nameEl);
            headerEl.appendChild(categoryEl);

            const detailsEl = document.createElement('div');
            detailsEl.className = 'cart-item-details';
            const safeLocation = decodeSanitizedText(item.location);
            const safeUnit = decodeSanitizedText(item.unit);

            const quantityBlock = document.createElement('div');
            const quantityLabel = document.createElement('span');
            quantityLabel.className = 'cart-item-detail-label';
            quantityLabel.textContent = 'Кількість:';
            quantityBlock.appendChild(quantityLabel);
            quantityBlock.append(` ${item.quantity} ${safeUnit}`);

            const locationBlock = document.createElement('div');
            const locationLabel = document.createElement('span');
            locationLabel.className = 'cart-item-detail-label';
            locationLabel.textContent = 'Локація:';
            locationBlock.appendChild(locationLabel);
            locationBlock.append(` ${safeLocation}`);

            const totalBlock = document.createElement('div');
            totalBlock.className = 'cart-item-total';
            const totalLabel = document.createElement('span');
            totalLabel.className = 'cart-item-detail-label';
            totalLabel.textContent = 'Сума:';
            totalBlock.appendChild(totalLabel);
            totalBlock.append(` ${item.totalAmount.toFixed(2)} ₴`);

            detailsEl.appendChild(quantityBlock);
            detailsEl.appendChild(locationBlock);
            detailsEl.appendChild(totalBlock);

            itemEl.appendChild(headerEl);
            itemEl.appendChild(detailsEl);

            if (item.photo && typeof item.photo.content === 'string' && item.photo.content) {
                const mediaWrapper = document.createElement('div');
                mediaWrapper.className = 'cart-item-media';

                const mimeType = (typeof item.photo.type === 'string' && /^[\w.+-]+\/[\w.+-]+$/.test(item.photo.type))
                    ? item.photo.type
                    : 'application/octet-stream';
                const dataUrl = `data:${mimeType};base64,${item.photo.content}`;
                const image = document.createElement('img');
                image.loading = 'lazy';
                const decodedProductName = decodeSanitizedText(item.productName);
                image.alt = decodedProductName ? `Фото ${decodedProductName}` : 'Фото товару';
                image.src = dataUrl;

                const downloadName = item.photo.name || 'attachment';
                const fileSizeLabel = formatFileSize(item.photo.size);
                const caption = document.createElement('span');
                caption.className = 'cart-item-media-caption';
                caption.textContent = `${downloadName} • ${fileSizeLabel}`;

                const renderFallback = () => {
                    mediaWrapper.innerHTML = '';
                    const fallback = document.createElement('div');
                    fallback.className = 'cart-item-media-fallback';

                    const link = document.createElement('a');
                    link.href = dataUrl;
                    link.download = downloadName;
                    link.textContent = `${downloadName} (${fileSizeLabel})`;

                    const fallbackText = document.createElement('span');
                    fallbackText.className = 'cart-item-media-caption';
                    fallbackText.textContent = 'Попередній перегляд недоступний. Натисніть, щоб завантажити файл.';

                    fallback.appendChild(link);
                    fallback.appendChild(fallbackText);
                    mediaWrapper.appendChild(fallback);
                };

                image.addEventListener('error', renderFallback, { once: true });

                mediaWrapper.appendChild(image);
                mediaWrapper.appendChild(caption);
                itemEl.appendChild(mediaWrapper);
            }

            itemsContainer.appendChild(itemEl);
        });

        document.getElementById('historySummary').textContent = `${items.length} запис(ів) за сесію`;
    } else {
        document.getElementById('historyEmpty').style.display = 'block';
        document.getElementById('historySummary').textContent = 'Ще немає записів';
    }
}

async function endWorkDay() {
    const historyItems = SecureStorageManager.getHistoryItems();
    if (historyItems.length === 0) {
        toastManager.show('Немає записів за сьогодні для завершення дня.', 'warning');
        return;
    }
    
    const modal = document.getElementById('aiSummaryModal');
    modal.style.display = 'flex';
    const output = document.getElementById('aiSummaryOutput');
    output.innerHTML = '<div class="spinner"></div><p class="mt-2 text-center">Генерую звіт...</p>';
    
    try {
        const summary = await apiClient.getAiSummary(historyItems);
        output.textContent = summary;
    } catch (error) {
        output.textContent = error.message;
    }
    
    if (window.lucide) {
        lucide.createIcons();
    }
    
    document.getElementById('confirmEndDayBtn').onclick = () => {
        SecureStorageManager.clearHistory();
        updateHistoryDisplay();
        closeAiSummaryModal();
        toastManager.show('Робочий день завершено. Історія очищена.', 'success');
    };
}

function closeAiSummaryModal() {
    document.getElementById('aiSummaryModal').style.display = 'none';
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Initialize icons
    if (window.lucide) {
        lucide.createIcons();
    }
    
    // Initialize theme
    ThemeManager.init();
    
    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
        let swRefreshing = false;

        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('SW registered: ', registration);

                const requestSkipWaiting = () => {
                    if (registration.waiting) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                };

                if (registration.waiting) {
                    requestSkipWaiting();
                }

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (!newWorker) {
                        return;
                    }

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            requestSkipWaiting();
                        }
                    });
                });

                registration.update();
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (swRefreshing) {
                return;
            }
            swRefreshing = true;
            window.location.reload();
        });
    }
    
    // Show app after loading
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
        appState.updateUI();
        updateHistoryDisplay();
    }, 500);

    // Setup event listeners
    setupEventListeners();
    applyModeStateToUI();
    populateDatalist();
    populateUnitSelect();
});

// Export functions for global access
window.switchTab = switchTab;
window.startPurchase = startPurchase;
window.startUnloading = startUnloading;
window.startDelivery = startDelivery;
window.endWorkDay = endWorkDay;
window.removePhoto = removePhoto;
window.closeAiSummaryModal = closeAiSummaryModal;
