(function() {
    'use strict';

    // ========== БАЗА РЕГИОНОВ ==========
    const countryData = {
        "7": {   // Россия и Казахстан
            digitsAfterCode: 10,
            pattern: "+7 (XXX) XXX-XX-XX"
        },
        "375": { // Беларусь
            digitsAfterCode: 9,
            pattern: "+375 (XX) XXX-XX-XX"
        },
        "998": { // Узбекистан
            digitsAfterCode: 9,
            pattern: "+998 (XX) XXX-XX-XX"
        },
        "992": { // Таджикистан
            digitsAfterCode: 9,
            pattern: "+992 (XX) XXX-XX-XX"
        }
    };

    // Получить чистые цифры
    function getDigits(value) {
        return value.replace(/\D/g, '');
    }

    // Определить код страны по первым цифрам
    function detectCountryCode(digits) {
        let matchedCode = null;
        let maxLen = 0;
        for (const code in countryData) {
            if (digits.startsWith(code) && code.length > maxLen) {
                matchedCode = code;
                maxLen = code.length;
            }
        }
        return matchedCode;
    }

    // Отформатировать номер на основе чистых цифр
    function formatDigits(digits) {
        if (!digits.length) return '';
        const countryCode = detectCountryCode(digits);
        if (!countryCode) {
            // Неизвестный код — просто + и первые цифры
            let result = '+' + digits.slice(0, Math.min(3, digits.length));
            let rest = digits.slice(result.length - 1);
            if (rest.length) result += ' ' + rest;
            return result;
        }

        const rule = countryData[countryCode];
        const codeLen = countryCode.length;
        const subscriberDigits = digits.slice(codeLen, codeLen + rule.digitsAfterCode);
        let formatted = rule.pattern;

        // Заменяем X на цифры или подчёркивания
        let digitIndex = 0;
        formatted = formatted.replace(/X/g, () => {
            return digitIndex < subscriberDigits.length ? subscriberDigits[digitIndex++] : '_';
        });
        return formatted;
    }

    // Вычислить новую позицию курсора на основе количества цифр до курсора
    function getNewCursorPosition(oldValue, newValue, oldCursor) {
        // Подсчитываем, сколько цифр было до курсора в старом значении
        let digitsBeforeOld = 0;
        for (let i = 0; i < oldCursor && i < oldValue.length; i++) {
            if (/\d/.test(oldValue[i])) digitsBeforeOld++;
        }

        // Теперь ищем в новом значении позицию, после которой находится столько же цифр
        let digitsSeen = 0;
        for (let i = 0; i < newValue.length; i++) {
            if (/\d/.test(newValue[i])) digitsSeen++;
            if (digitsSeen === digitsBeforeOld) return i + 1; // после последней учтённой цифры
        }
        // Если не нашли, ставим курсор в конец
        return newValue.length;
    }

    // Основная функция форматирования при вводе
    function formatPhoneInput(input) {
        const oldValue = input.value;
        const oldCursor = input.selectionStart;
        const digits = getDigits(oldValue);
        const newValue = formatDigits(digits);
        if (newValue === oldValue) return;
        input.value = newValue;
        const newCursor = getNewCursorPosition(oldValue, newValue, oldCursor);
        input.setSelectionRange(newCursor, newCursor);
    }

    function attachPhoneMask(phoneInput) {
        if (!phoneInput) return;
        phoneInput.addEventListener('input', function() {
            formatPhoneInput(this);
        });
        phoneInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const pasted = (e.clipboardData || window.clipboardData).getData('text');
            if (pasted) {
                const digits = getDigits(pasted);
                this.value = digits;
                formatPhoneInput(this);
            }
        });
        // Инициализация при загрузке
        formatPhoneInput(phoneInput);
    }

    // ========== ВАЛИДАЦИЯ ИМЕНИ ==========
    function isValidName(name) {
        return /^[A-Za-zА-Яа-яЁё\s\-]+$/.test(name);
    }

    function attachNameValidation(nameInput) {
        if (!nameInput) return;
        nameInput.addEventListener('input', function() {
            const raw = this.value;
            const filtered = raw.replace(/[^A-Za-zА-Яа-яЁё\s\-]/g, '');
            if (filtered !== raw) this.value = filtered;
        });
    }

    function isValidPhone(phone) {
        const digits = getDigits(phone);
        if (!digits.length) return false;
        const countryCode = detectCountryCode(digits);
        if (countryCode) {
            const rule = countryData[countryCode];
            const actual = digits.length - countryCode.length;
            return actual === rule.digitsAfterCode;
        }
        return false; // неизвестный код не принимаем
    }

    // ========== МОДАЛЬНОЕ ОКНО ==========
    const modalOverlay = document.getElementById('modalOverlay');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const offerBtn = document.querySelector('.offer-btn');
    const orderBtns = document.querySelectorAll('.order-btn');
    let firstFocusable, lastFocusable, previousFocus;

    function openModal() {
        if (!modalOverlay) return;
        modalOverlay.hidden = false;
        previousFocus = document.activeElement;
        const focusable = modalOverlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        firstFocusable = focusable[0];
        lastFocusable = focusable[focusable.length - 1];
        firstFocusable?.focus();
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!modalOverlay) return;
        modalOverlay.hidden = true;
        document.body.style.overflow = '';
        if (previousFocus) previousFocus.focus();
    }

    if (openModalBtn) openModalBtn.addEventListener('click', openModal);
    if (offerBtn) offerBtn.addEventListener('click', openModal);
    orderBtns.forEach(btn => btn.addEventListener('click', openModal));
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modalOverlay) {
        modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
        document.addEventListener('keydown', e => { if (!modalOverlay.hidden && e.key === 'Escape') closeModal(); });
    }

    // ========== ОТПРАВКА ФОРМЫ ==========
    const form = document.getElementById('feedbackForm');
    if (form) {
        const nameInput = form.querySelector('input[name="name"]');
        const phoneInput = form.querySelector('input[name="phone"]');
        if (nameInput) attachNameValidation(nameInput);
        if (phoneInput) attachPhoneMask(phoneInput);

        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = nameInput ? nameInput.value.trim() : '';
            if (!name) {
                alert('Пожалуйста, введите ваше имя.');
                nameInput?.focus();
                return;
            }
            if (!isValidName(name)) {
                alert('Имя может содержать только буквы (русские или английские), пробелы и дефис.');
                nameInput?.focus();
                return;
            }

            const phone = phoneInput ? phoneInput.value.trim() : '';
            if (!phone) {
                alert('Пожалуйста, введите номер телефона.');
                phoneInput?.focus();
                return;
            }
            if (!isValidPhone(phone)) {
                alert('Введите корректный номер телефона для выбранной страны.');
                phoneInput?.focus();
                return;
            }

            const formData = new FormData(form);
            try {
                const response = await fetch('send.php', { method: 'POST', body: formData });
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        alert('Спасибо! Мы свяжемся с вами.');
                        closeModal();
                        form.reset();
                        if (phoneInput) phoneInput.value = '';
                    } else {
                        alert('Ошибка при отправке. Попробуйте позже.');
                    }
                } else {
                    alert('Ошибка сервера. Попробуйте позже.');
                }
            } catch (error) {
                alert('Ошибка соединения. Проверьте интернет.');
            }
        });
    }
})();