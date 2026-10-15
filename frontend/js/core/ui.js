export class UI {
  static showToast(message, type = 'success') {
    let container = document.querySelector('.vt-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'vt-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `vt-toast border-${type}`;

    const icon = type === 'success'
      ? '<i class="bi bi-check-circle-fill text-success fs-5"></i>'
      : type === 'danger'
      ? '<i class="bi bi-exclamation-triangle-fill text-danger fs-5"></i>'
      : '<i class="bi bi-info-circle-fill text-info fs-5"></i>';

    toast.innerHTML = `
      ${icon}
      <div class="flex-grow-1">${message}</div>
      <button type="button" class="btn-close btn-close-white ms-2" aria-label="Close"></button>
    `;

    toast.querySelector('.btn-close').addEventListener('click', () => {
      toast.remove();
    });

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  static toast(message, type = 'success') {
    const mappedType = type === 'error' ? 'danger' : type;
    return UI.showToast(message, mappedType);
  }

  static formatWatts(watts) {
    if (!watts || watts <= 0) return '0 W';
    return `${Number(watts).toLocaleString()} W`;
  }

  static formatCurrency(val, symbol = '₹') {
    return `${symbol}${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  static formatKwh(val) {
    return `${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh`;
  }

  static setLoading(button, isLoading, loadingText = 'Saving...') {
    if (!button) return;
    if (isLoading) {
      button.dataset.originalText = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>${loadingText}`;
    } else {
      button.disabled = false;
      button.innerHTML = button.dataset.originalText || button.innerHTML;
    }
  }
}

if (typeof window !== 'undefined') {
  window.UI = UI;
  window.toast = UI.toast;
  window.showToast = UI.showToast;
}

export const toast = (msg, type) => UI.toast(msg, type);
export const showToast = (msg, type) => UI.showToast(msg, type);
export default UI;
