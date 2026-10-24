const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.desktop-nav');
const requestDialog = document.querySelector('#request-dialog');
const requestForm = document.querySelector('#request-form');
const formStatus = document.querySelector('#form-status');
const fileInput = document.querySelector('#request-files');
const attachmentList = document.querySelector('.attachment-list');
let requestTrigger = null;
let selectedFiles = [];

function closeMenu({ restoreFocus = false } = {}) {
  const wasOpen = document.body.classList.contains('menu-open');
  document.body.classList.remove('menu-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Открыть меню');
  if (wasOpen && restoreFocus) menuButton?.focus();
}

menuButton?.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  if (open) navigation?.querySelector('a')?.focus();
});

navigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu()));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu({ restoreFocus: true });
  if (event.key !== 'Tab' || !document.body.classList.contains('menu-open')) return;
  const items = [...navigation.querySelectorAll('a'), menuButton];
  const first = items[0];
  const last = items.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

const desktopMedia = matchMedia('(min-width: 1201px)');
desktopMedia.addEventListener('change', (event) => { if (event.matches) closeMenu(); });

document.querySelectorAll('[data-open-request]').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    closeMenu();
    requestTrigger = trigger;
    formStatus.textContent = '';
    const comment = document.querySelector('#request-comment');
    if (trigger.dataset.service && !comment.value.trim()) comment.value = `Интересует: ${trigger.dataset.service}.\n`;
    requestDialog.showModal();
    document.body.classList.add('dialog-open');
    document.querySelector('#request-name').focus({ preventScroll: true });
  });
});

document.querySelector('.dialog-close')?.addEventListener('click', () => requestDialog.close());
requestDialog?.addEventListener('click', (event) => {
  if (event.target !== requestDialog) return;
  const bounds = requestDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) requestDialog.close();
});
requestDialog?.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  requestTrigger?.focus({ preventScroll: true });
});

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

function renderAttachments() {
  attachmentList.replaceChildren();
  selectedFiles.forEach((file, index) => {
    const row = document.createElement('li');
    const name = document.createElement('span');
    name.className = 'attachment-name';
    name.textContent = file.name;
    const size = document.createElement('span');
    size.className = 'attachment-size';
    size.textContent = formatFileSize(file.size);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'attachment-remove';
    remove.setAttribute('aria-label', `Убрать файл ${file.name}`);
    remove.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#icon-close"/></svg>';
    remove.addEventListener('click', () => {
      selectedFiles.splice(index, 1);
      renderAttachments();
      const remainingButtons = attachmentList.querySelectorAll('button');
      (remainingButtons[Math.min(index, remainingButtons.length - 1)] || fileInput).focus();
      formStatus.textContent = '';
    });
    row.append(name, size, remove);
    attachmentList.append(row);
  });
}

fileInput?.addEventListener('change', () => {
  for (const file of fileInput.files) {
    if (!selectedFiles.some((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified)) selectedFiles.push(file);
  }
  fileInput.value = '';
  renderAttachments();
  formStatus.textContent = '';
});

requestForm?.addEventListener('input', () => { formStatus.textContent = ''; });

requestForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const phone = document.querySelector('#request-phone');
  const digits = phone.value.replace(/\D/g, '');
  phone.setCustomValidity(digits.length >= 10 && digits.length <= 15 ? '' : 'Укажите номер телефона: от 10 до 15 цифр.');
  if (!requestForm.reportValidity()) return;
  // Demo only: do not transmit form fields or files, and do not store personal data.
  const attachmentMessage = selectedFiles.length ? ` Прикреплено файлов: ${selectedFiles.length}.` : '';
  formStatus.textContent = `Поля заполнены корректно.${attachmentMessage} Это демоверсия: заявка и документы не отправлены. Доставка на info@kontakt-clean.ru будет подключена после настройки почты.`;
  formStatus.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
});

document.querySelector('#request-phone')?.addEventListener('input', (event) => event.target.setCustomValidity(''));

const worksTrack = document.querySelector('.works-track');
const previousPhoto = document.querySelector('.gallery-prev');
const nextPhoto = document.querySelector('.gallery-next');
const galleryCount = document.querySelector('.gallery-count');
const slides = [...document.querySelectorAll('.work-slide')];

function photoPositions() {
  const maximum = Math.max(0, worksTrack.scrollWidth - worksTrack.clientWidth);
  return slides.map((slide) => Math.min(slide.offsetLeft - slides[0].offsetLeft, maximum));
}

function currentPhoto() {
  const positions = photoPositions();
  let closest = 0;
  positions.forEach((position, index) => {
    if (Math.abs(position - worksTrack.scrollLeft) < Math.abs(positions[closest] - worksTrack.scrollLeft)) closest = index;
  });
  return closest;
}

function updateGallery() {
  const maximum = worksTrack.scrollWidth - worksTrack.clientWidth;
  previousPhoto.disabled = worksTrack.scrollLeft <= 2;
  nextPhoto.disabled = worksTrack.scrollLeft >= maximum - 2;
  const number = nextPhoto.disabled ? slides.length : currentPhoto() + 1;
  galleryCount.textContent = `${String(number).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
}

function moveGallery(direction) {
  const positions = photoPositions();
  const index = currentPhoto();
  const target = direction > 0 ? Math.min(index + 1, positions.length - 1) : Math.max(index - 1, 0);
  const position = direction < 0 && nextPhoto.disabled ? [...new Set(positions)].at(-2) ?? 0 : positions[target];
  worksTrack.scrollTo({ left: position, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}

if (worksTrack) {
  previousPhoto.addEventListener('click', () => moveGallery(-1));
  nextPhoto.addEventListener('click', () => moveGallery(1));
  worksTrack.addEventListener('scroll', updateGallery, { passive: true });
  worksTrack.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveGallery(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  new ResizeObserver(updateGallery).observe(worksTrack);
  updateGallery();
}
