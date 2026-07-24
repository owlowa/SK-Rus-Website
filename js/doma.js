(function() {
    'use strict';

    // ========== БАЗА РЕГИОНОВ (телефон) ==========
    const countryData = {
        "7": { digitsAfterCode: 10, pattern: "+7 (XXX) XXX-XX-XX" },
        "375": { digitsAfterCode: 9, pattern: "+375 (XX) XXX-XX-XX" },
        "998": { digitsAfterCode: 9, pattern: "+998 (XX) XXX-XX-XX" },
        "992": { digitsAfterCode: 9, pattern: "+992 (XX) XXX-XX-XX" }
    };

    function getDigits(value) { return value.replace(/\D/g, ''); }
    function detectCountryCode(digits) {
        let matchedCode = null, maxLen = 0;
        for (const code in countryData) {
            if (digits.startsWith(code) && code.length > maxLen) {
                matchedCode = code; maxLen = code.length;
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
        for (let i = 0; i < oldCursor && i < oldValue.length; i++) if (/\d/.test(oldValue[i])) digitsBeforeOld++;
        let digitsSeen = 0;
        for (let i = 0; i < newValue.length; i++) {
            if (/\d/.test(newValue[i])) digitsSeen++;
            if (digitsSeen === digitsBeforeOld) return i + 1;
        }
        return newValue.length;
    }
    function formatPhoneInput(input) {
        const oldValue = input.value, oldCursor = input.selectionStart;
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

    function isValidName(name) { return /^[A-Za-zА-Яа-яЁё\s\-]+$/.test(name); }
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
            return digits.length - countryCode.length === rule.digitsAfterCode;
        }
        return false;
    }

    // ========== МОДАЛЬНОЕ ОКНО ==========
    const modalOverlay = document.getElementById('modalOverlay');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const orderBtns = document.querySelectorAll('.order-btn');
    const priceNotes = document.querySelectorAll('.price-note');

    let previousFocus;

    function openModal() {
        if (!modalOverlay) return;
        modalOverlay.hidden = false;
        previousFocus = document.activeElement;
        const focusable = modalOverlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length) focusable[0].focus();
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!modalOverlay) return;
        modalOverlay.hidden = true;
        document.body.style.overflow = '';
        if (previousFocus) previousFocus.focus();
    }

    window.openModal = openModal;

    orderBtns.forEach(btn => btn.addEventListener('click', openModal));
    priceNotes.forEach(note => note.addEventListener('click', openModal));
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modalOverlay) {
        modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
        document.addEventListener('keydown', e => { if (!modalOverlay.hidden && e.key === 'Escape') closeModal(); });
    }

    // ========== ФОРМА ==========
    const form = document.getElementById('feedbackForm');
    if (form) {
        const nameInput = form.querySelector('input[name="name"]');
        const phoneInput = form.querySelector('input[name="phone"]');
        if (nameInput) attachNameValidation(nameInput);
        if (phoneInput) attachPhoneMask(phoneInput);

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = nameInput ? nameInput.value.trim() : '';
            if (!name) { alert('Введите имя'); return; }
            if (!isValidName(name)) { alert('Имя может содержать только буквы'); return; }
            const phone = phoneInput ? phoneInput.value.trim() : '';
            if (!phone) { alert('Введите телефон'); return; }
            if (!isValidPhone(phone)) { alert('Введите корректный номер'); return; }

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
                        alert('Ошибка при отправке.');
                    }
                } else {
                    alert('Ошибка сервера.');
                }
            } catch (error) {
                alert('Ошибка соединения.');
            }
        });
    }

    // ========== ГАЛЕРЕЯ ИЗОБРАЖЕНИЙ ==========
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

    // ========== АККОРДЕОН (ПРОСТОЙ И НАДЁЖНЫЙ) ==========
    function toggleItem(item) {
        const details = item.querySelector('.item-details');
        const toggleBtn = item.querySelector('.toggle-details');
        if (!details || !toggleBtn) return;

        const isOpen = details.classList.contains('show');
        if (!isOpen) {
            details.classList.add('show');
            toggleBtn.textContent = 'Свернуть';
        } else {
            details.classList.remove('show');
            toggleBtn.textContent = 'Подробнее';
        }
    }

    // Обработчики для кнопок "Подробнее"
    document.querySelectorAll('.toggle-details').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const item = this.closest('.catalog-item');
            if (item) toggleItem(item);
        });
    });

    // Обработчики для клика по заголовку карточки
    document.querySelectorAll('.item-header').forEach(header => {
        header.addEventListener('click', function(e) {
            // Игнорируем клики по кнопкам и галерее
            if (e.target.closest('.item-btn') || e.target.closest('.price-note') || e.target.closest('.gallery-thumb')) return;
            const item = this.closest('.catalog-item');
            if (item) toggleItem(item);
        });
    });

})();