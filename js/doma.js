(function() {
    'use strict';

    // ========== БАЗА РЕГИОНОВ (телефон) ==========
    const countryData = {
        "7": { digitsAfterCode: 10, pattern: "+7 (XXX) XXX-XX-XX" },    // Россия, Казахстан
        "375": { digitsAfterCode: 9, pattern: "+375 (XX) XXX-XX-XX" },   // Беларусь
        "998": { digitsAfterCode: 9, pattern: "+998 (XX) XXX-XX-XX" },   // Узбекистан
        "992": { digitsAfterCode: 9, pattern: "+992 (XX) XXX-XX-XX" }    // Таджикистан
    };

    // ---------- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ТЕЛЕФОНА ----------
    function getDigits(value) {
        return value.replace(/\D/g, '');
    }

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

    function formatDigits(digits) {
        if (!digits.length) return '';
        const countryCode = detectCountryCode(digits);
        if (!countryCode) {
            let result = '+' + digits.slice(0, Math.min(3, digits.length));
            let rest = digits.slice(result.length - 1);
            if (rest.length) result += ' ' + rest;
            return result;
        }

        const rule = countryData[countryCode];
        const codeLen = countryCode.length;
        const subscriberDigits = digits.slice(codeLen, codeLen + rule.digitsAfterCode);
        let formatted = rule.pattern;
        let digitIndex = 0;
        formatted = formatted.replace(/X/g, () => digitIndex < subscriberDigits.length ? subscriberDigits[digitIndex++] : '_');
        return formatted;
    }

    function getNewCursorPosition(oldValue, newValue, oldCursor) {
        let digitsBeforeOld = 0;
        for (let i = 0; i < oldCursor && i < oldValue.length; i++) {
            if (/\d/.test(oldValue[i])) digitsBeforeOld++;
        }
        let digitsSeen = 0;
        for (let i = 0; i < newValue.length; i++) {
            if (/\d/.test(newValue[i])) digitsSeen++;
            if (digitsSeen === digitsBeforeOld) return i + 1;
        }
        return newValue.length;
    }

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
        phoneInput.addEventListener('input', () => formatPhoneInput(phoneInput));
        phoneInput.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasted = (e.clipboardData || window.clipboardData).getData('text');
            if (pasted) {
                const digits = getDigits(pasted);
                phoneInput.value = digits;
                formatPhoneInput(phoneInput);
            }
        });
        formatPhoneInput(phoneInput);
    }

    // ---------- ВАЛИДАЦИЯ ИМЕНИ ----------
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
        return false;
    }

    // ---------- МОДАЛЬНОЕ ОКНО (ОСНОВНАЯ ЛОГИКА) ----------
    const modalOverlay = document.getElementById('modalOverlay');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const offerBtn = document.querySelector('.offer-btn');
    const orderBtns = document.querySelectorAll('.order-btn');
    const priceNotes = document.querySelectorAll('.price-note');

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

    window.openModal = openModal;

    if (openModalBtn) openModalBtn.addEventListener('click', openModal);
    if (offerBtn) offerBtn.addEventListener('click', openModal);
    orderBtns.forEach(btn => btn.addEventListener('click', openModal));
    priceNotes.forEach(note => note.addEventListener('click', openModal));
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modalOverlay) {
        modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
        document.addEventListener('keydown', e => { if (!modalOverlay.hidden && e.key === 'Escape') closeModal(); });
    }

    // ---------- ФОРМА С ВАЛИДАЦИЕЙ ----------
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

    // ---------- ГАЛЕРЕЯ ИЗОБРАЖЕНИЙ ----------
    const imageModalOverlay = document.getElementById('imageModalOverlay');
    const closeImageModalBtn = document.getElementById('closeImageModalBtn');
    const modalImage = document.getElementById('modalImage');

    function openImageModal(src) {
        if (!imageModalOverlay) return;
        modalImage.src = src;
        imageModalOverlay.hidden = false;
        document.body.style.overflow = 'hidden';
        closeImageModalBtn?.focus();
    }

    function closeImageModal() {
        if (!imageModalOverlay) return;
        imageModalOverlay.hidden = true;
        document.body.style.overflow = '';
    }

    document.querySelectorAll('.gallery-thumb').forEach(thumb => {
        thumb.addEventListener('click', function(e) {
            e.stopPropagation();
            const src = this.dataset.src;
            if (src) openImageModal(src);
        });
    });
    if (closeImageModalBtn) closeImageModalBtn.addEventListener('click', closeImageModal);
    if (imageModalOverlay) {
        imageModalOverlay.addEventListener('click', e => { if (e.target === imageModalOverlay) closeImageModal(); });
        document.addEventListener('keydown', e => { if (!imageModalOverlay.hidden && e.key === 'Escape') closeImageModal(); });
    }

    // ---------- АККОРДЕОН (УНИВЕРСАЛЬНЫЙ) ----------
    document.querySelectorAll('.toggle-details').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const item = this.closest('.catalog-item');
            if (!item) return;
            const details = item.querySelector('.item-details');
            const actions = item.querySelector('.item-actions');
            const originalPrice = item.querySelector('.item-price');
            if (!details || !actions || !originalPrice) return;

            const isOpen = details.classList.contains('show');
            if (!isOpen) {
                originalPrice.style.display = 'none';
                const priceClone = document.createElement('div');
                priceClone.className = 'item-price-clone';
                priceClone.textContent = originalPrice.textContent;
                const toggleBtn = actions.querySelector('.toggle-details');
                if (toggleBtn) {
                    toggleBtn.insertAdjacentElement('afterend', priceClone);
                } else {
                    actions.appendChild(priceClone);
                }
                const orderBtn = actions.querySelector('.order-btn');
                if (orderBtn) orderBtn.style.display = 'none';
                this.textContent = 'Свернуть';
            } else {
                originalPrice.style.display = '';
                const priceClone = actions.querySelector('.item-price-clone');
                if (priceClone) priceClone.remove();
                const orderBtn = actions.querySelector('.order-btn');
                if (orderBtn) orderBtn.style.display = '';
                this.textContent = 'Подробнее';
            }
            details.classList.toggle('show');
            if (actions.classList.contains('hidden')) actions.classList.remove('hidden');
        });
    });

    document.querySelectorAll('.item-header').forEach(header => {
        header.addEventListener('click', function(e) {
            if (e.target.closest('.item-btn') || e.target.closest('.price-note') || e.target.closest('.gallery-thumb')) return;
            const item = this.closest('.catalog-item');
            if (!item) return;
            const details = item.querySelector('.item-details');
            const actions = item.querySelector('.item-actions');
            const originalPrice = item.querySelector('.item-price');
            if (!details || !actions || !originalPrice) return;

            const isOpen = details.classList.contains('show');
            if (!isOpen) {
                originalPrice.style.display = 'none';
                const priceClone = document.createElement('div');
                priceClone.className = 'item-price-clone';
                priceClone.textContent = originalPrice.textContent;
                const toggleBtn = actions.querySelector('.toggle-details');
                if (toggleBtn) {
                    toggleBtn.insertAdjacentElement('afterend', priceClone);
                } else {
                    actions.appendChild(priceClone);
                }
                const orderBtn = actions.querySelector('.order-btn');
                if (orderBtn) orderBtn.style.display = 'none';
                const btn = this.querySelector('.toggle-details');
                if (btn) btn.textContent = 'Свернуть';
            } else {
                originalPrice.style.display = '';
                const priceClone = actions.querySelector('.item-price-clone');
                if (priceClone) priceClone.remove();
                const orderBtn = actions.querySelector('.order-btn');
                if (orderBtn) orderBtn.style.display = '';
                const btn = this.querySelector('.toggle-details');
                if (btn) btn.textContent = 'Подробнее';
            }
            details.classList.toggle('show');
            if (actions.classList.contains('hidden')) actions.classList.remove('hidden');
        });
    });
})();