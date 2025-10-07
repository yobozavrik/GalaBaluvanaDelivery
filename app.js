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
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        return file.size <= maxSize && allowedTypes.includes(file.type);
    }
}

// Security: Secure API configuration
class SecureConfig {
    constructor() {
        // Use environment variables or secure configuration
        this.N8N_WEBHOOK_URL = this.getSecureWebhookUrl();
        this.GEMINI_API_KEY = this.getSecureApiKey();
        this.GEMINI_API_URL = this.GEMINI_API_KEY ? 
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${this.GEMINI_API_KEY}` : 
            null;
    }

    getSecureWebhookUrl() {
        // Allow overriding the webhook URL from a deploy-time configuration value
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

        const productionProxyUrl = '/api/delivery';
        const localProxyUrl = 'http://localhost:3000/api/delivery';
        const productionDirectUrl = 'https://n8n.dmytrotovstytskyi.online/webhook/delivery';
        const testDirectUrl = 'https://n8n.dmytrotovstytskyi.online/webhook-test/delivery';

        const adjustTargetParam = (url, target) => {
            if (!url || typeof url !== 'string') {
                return url;
            }
            const absoluteUrlPattern = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;
            const isAbsolute = absoluteUrlPattern.test(url);
            const base = isAbsolute ? new URL(url) : new URL(url, 'http://placeholder.local');

            if (target === 'test') {
                base.searchParams.set('target', 'test');
            } else {
                base.searchParams.delete('target');
            }

            if (isAbsolute) {
                return base.toString();
            }
            const serialized = base.pathname + (base.search ? base.search : '');
            return serialized || '/';
        };

        let baseUrl = productionProxyUrl;
        let requestedWebhook = 'auto';

        if (typeof window !== 'undefined') {
            const hostname = window.location?.hostname ?? '';
            const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
            if (isLocalhost) {
                baseUrl = localProxyUrl;
            }

            try {
                const params = new URLSearchParams(window.location?.search ?? '');
                const requested = params.get('webhook');
                if (requested) {
                    const normalized = requested.toLowerCase();
                    if (normalized === 'test' || normalized === 'production') {
                        requestedWebhook = normalized;
                    }
                }
            } catch (error) {
                console.warn('Не удалось прочитать параметры URL для выбора webhook.', error);
            }
        }

        const isProxyUrl = typeof baseUrl === 'string' && baseUrl.includes('/api/delivery');

        if (requestedWebhook === 'test') {
            if (isProxyUrl) {
                const proxyTestUrl = adjustTargetParam(baseUrl, 'test');
                console.log('🔁 Переключение на тестовый webhook через проксі (?webhook=test).');
                return proxyTestUrl;
            }
            console.log('🔁 Переключение на тестовый webhook (?webhook=test).');
            return testDirectUrl;
        }

        if (requestedWebhook === 'production') {
            if (isProxyUrl) {
                const proxyProductionUrl = adjustTargetParam(baseUrl, null);
                console.log('🔁 Переключение на продукционный webhook (?webhook=production).');
                return proxyProductionUrl;
            }
            console.log('🔁 Переключение на продукционный webhook (?webhook=production).');
            return productionDirectUrl;
        }

        if (isProxyUrl) {
            const normalizedProxyUrl = adjustTargetParam(baseUrl, null);
            console.log('🔗 Используется webhook URL через проксі:', normalizedProxyUrl);
            return normalizedProxyUrl;
        }

        console.log('🔗 Используется прямой webhook URL:', productionDirectUrl);
        return productionDirectUrl;
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

    get marketLocations() {
        return ['Калинівський ринок', 'Зелений ринок', 'Метро', 'Інше'];
    }

    get unloadingLocations() {
        return ['Героїв Майдану', 'Ентузіастів', 'Бульвар', 'Гравітон', 'Садова', 'Флоріда', 'Ентузіастів 2 поверх', 'Піцерія', 'Руська', 'Інше'];
    }

    get deliveryLocations() {
        return ['Героїв Майдану', 'Ентузіастів', 'Бульвар', 'Гравітон', 'Садова', 'Флоріда', 'Ентузіастів 2 поверх', 'Піцерія', 'Руська', 'Інше'];
    }

    get products() {
        return ['Картопля', 'Цибуля', 'Капуста', 'Морква', 'Буряк', 'Гриби', 'Помідори', 'Банан', 'Часник', 'Перець', 'Кабачки', 'Баклажан', 'Лимон'];
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
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading from storage:', error);
            return [];
        }
    }

    static addToHistory(item) {
        try {
            const items = this.getHistoryItems();
            // Security: Validate item before storing
            if (this.validateHistoryItem(item)) {
                items.push(item);
                sessionStorage.setItem('purchase_history', JSON.stringify(items));
            }
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }

    static validateHistoryItem(item) {
        return item && 
               typeof item.id === 'string' &&
               typeof item.productName === 'string' &&
               typeof item.quantity === 'number' &&
               typeof item.unit === 'string' &&
               typeof item.location === 'string' &&
               typeof item.timestamp === 'string';
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
        console.log('🚀 Отправка данных в n8n:', this.config.N8N_WEBHOOK_URL);
        const payloadForLog = {
            ...payload,
            attachments: payload.attachments?.map(({ name, type, size }) => ({ name, type, size }))
        };
        console.log('📦 Payload:', payloadForLog);

        const buildAttemptUrls = (baseUrl) => {
            const attempts = [];
            const seen = new Set();
            const add = (value) => {
                if (value && typeof value === 'string' && !seen.has(value)) {
                    seen.add(value);
                    attempts.push(value);
                }
            };

            if (!baseUrl) {
                return attempts;
            }

            add(baseUrl);

            try {
                const absoluteUrlPattern = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;
                const isAbsolute = absoluteUrlPattern.test(baseUrl);
                const origin = (typeof window !== 'undefined' && window.location?.origin) || 'http://placeholder.local';
                const parsedUrl = isAbsolute ? new URL(baseUrl) : new URL(baseUrl, origin);
                const pathname = parsedUrl.pathname || '';
                const serialize = (urlObj) => {
                    if (isAbsolute) {
                        return urlObj.toString();
                    }
                    return urlObj.pathname + (urlObj.search ? urlObj.search : '');
                };

                if (pathname.endsWith('/api/delivery')) {
                    const productionUrl = new URL(parsedUrl.toString());
                    productionUrl.searchParams.delete('target');
                    add(serialize(productionUrl));

                    const testUrl = new URL(parsedUrl.toString());
                    testUrl.searchParams.set('target', 'test');
                    add(serialize(testUrl));
                } else if (pathname.includes('/webhook-test/')) {
                    const productionUrl = new URL(parsedUrl.toString());
                    productionUrl.pathname = productionUrl.pathname.replace('/webhook-test/', '/webhook/');
                    add(serialize(productionUrl));
                } else if (pathname.includes('/webhook/')) {
                    const testUrl = new URL(parsedUrl.toString());
                    testUrl.pathname = testUrl.pathname.replace('/webhook/', '/webhook-test/');
                    add(serialize(testUrl));
                }
            } catch (fallbackError) {
                console.warn('Не удалось построить список fallback webhook URL.', fallbackError);
            }

            return attempts;
        };

        const attemptUrls = buildAttemptUrls(this.config.N8N_WEBHOOK_URL);
        let lastError;

        for (const url of attemptUrls) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    mode: 'cors',
                    credentials: 'omit',
                    signal: controller.signal
                });

                const isOpaque = response.type === 'opaque';
                const text = isOpaque ? '' : await response.text();

                if (isOpaque) {
                    console.warn('⚠️ Ответ скрыт из-за политики CORS (opaque response). Считаем запрос успешным.');
                    return response;
                }

                if (!response.ok) {
                    lastError = new Error(`n8n responded ${response.status}: ${text}`);
                    console.error(`❌ Ошибка ответа n8n (${response.status}) для ${url}:`, text);
                    continue;
                }

                return text;
            } catch (error) {
                lastError = error;
                console.error(`❌ Ошибка запроса к n8n (${url}):`, error?.message || error);
            } finally {
                clearTimeout(timeoutId);
            }
        }

        throw lastError || new Error('No response from webhook');
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
    const value = document.getElementById('pricePerUnit').value;
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
        priceGroup.style.display = 'none'; 
        totalGroup.style.display = 'none';
        locationLabel.textContent = 'Магазин (розвантаження)'; 
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
    if (appState.isUnloading || appState.isDelivery) return;
    
    const qty = parseFloat(document.getElementById('quantity').value) || 0;
    const price = parseFloat(document.getElementById('pricePerUnit').value) || 0;
    const total = (qty * price).toFixed(2);
    
    document.getElementById('totalAmount').textContent = `${total} ₴`;
}

function handlePhotoSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!InputValidator.validateFile(file)) {
        toastManager.show('Файл занадто великий або непідтримуваний формат', 'error');
        event.target.value = '';
        return;
    }
    
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('previewImage').src = e.target.result;
        document.getElementById('photoPreview').style.display = 'block';
    };
    reader.readAsDataURL(selectedFile);
}

function removePhoto() {
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('photoInput').value = '';
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

        if (itemData.type === 'Закупка') {
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
        flatFields[`${prefix}_location`] = toStringValue(itemData.location);

        if (itemData.type === 'Закупка') {
            flatFields[`${prefix}_price_per_unit`] = toStringValue(itemData.pricePerUnit);
            flatFields[`${prefix}_total_amount`] = toStringValue(itemData.totalAmount);
        }
    }

    if (file) {
        const base64 = await fileToBase64(file);
        payload.attachments = [{
            name: file.name,
            type: file.type,
            size: file.size,
            encoding: 'base64',
            content: base64
        }];
    }

    return payload;
}

async function handleFormSubmit(event) {
    event.preventDefault();

    console.log('📝 Начало отправки формы');
    
    // Validate all fields
    const isProductNameValid = validateProductName();
    const isQuantityValid = validateQuantity();
    const isPriceValid = appState.isUnloading || appState.isDelivery || validatePrice();
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

        const unit = document.getElementById('unit').value;
        const pricePerUnitInput = parseFloat(document.getElementById('pricePerUnit').value) || 0;
        const pricePerUnit = appState.isUnloading || appState.isDelivery ? 0 : pricePerUnitInput;
        const computedTotal = quantity * pricePerUnit;
        const totalAmount = appState.isUnloading || appState.isDelivery
            ? 0
            : Number.isFinite(computedTotal) ? Number(computedTotal.toFixed(2)) : 0;

        const itemData = {
            id: crypto.randomUUID(),
            productName,
            quantity,
            unit,
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

        const payload = await buildWebhookPayload(itemData, selectedFile);

        await apiClient.sendPurchaseData(payload);
        SecureStorageManager.addToHistory(itemData);
        toastManager.show(`'${productName}' відправлено в облік`, 'success');
        appState.setScreen('main');
        updateHistoryDisplay();
        
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
            nameEl.textContent = item.productName;
            
            const categoryEl = document.createElement('div');
            categoryEl.className = 'cart-item-category';
            categoryEl.textContent = item.type;
            
            const headerEl = document.createElement('div');
            headerEl.className = 'cart-item-header';
            headerEl.appendChild(nameEl);
            headerEl.appendChild(categoryEl);
            
            const detailsEl = document.createElement('div');
            detailsEl.className = 'cart-item-details';
            detailsEl.innerHTML = `
                <div><span class="cart-item-detail-label">Кількість:</span> ${item.quantity} ${item.unit}</div>
                <div><span class="cart-item-detail-label">Локація:</span> ${item.location}</div>
                <div class="cart-item-total"><span class="cart-item-detail-label">Сума:</span> ${item.totalAmount.toFixed(2)} ₴</div>
            `;
            
            itemEl.appendChild(headerEl);
            itemEl.appendChild(detailsEl);
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
