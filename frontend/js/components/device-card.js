import { UI } from '../core/ui.js';
import { api } from '../core/api-client.js';

export function renderDeviceCard(device, projectTariff = 8.0, onUpdate = null) {
  const card = document.createElement('div');
  const watts = Number(device.powerRatingWatts || 0);
  const hours = Number(device.dailyUsageHours || 0);
  const days = Number(device.daysUsedPerMonth || 30);
  const tariff = Number(device.electricityTariffPerKwh || projectTariff);

  const dailyKwh = (watts * hours) / 1000;
  const monthlyKwh = dailyKwh * days;
  const monthlyCost = monthlyKwh * tariff;

  const tier = device.isFitting
    ? 'tier-fitting'
    : watts > 1000
    ? 'tier-high'
    : watts > 200
    ? 'tier-medium'
    : 'tier-low';

  card.className = `device-card ${tier}`;
  card.id = `device-card-${device._id}`;

  const iconClass = getCategoryIcon(device.category, device.canonicalName);
  const sourceBadge = getSourceBadge(device.powerRatingSource, device.powerRatingVerified);

  card.innerHTML = `
    <div>
      <div class="device-header">
        <div class="d-flex align-items-center">
          <div class="device-icon-wrapper">
            <i class="bi ${iconClass}"></i>
          </div>
          <div class="device-title-area">
            <div class="device-name text-truncate" style="max-width: 200px;" title="${escapeHtml(device.displayName)}">
              ${escapeHtml(device.displayName)}
            </div>
            <div class="device-meta">
              <span class="text-capitalize">${device.category.replace('_', ' ')}</span>
              ${device.manufacturer ? `• ${escapeHtml(device.manufacturer)}` : ''}
              ${device.modelNumber ? `(${escapeHtml(device.modelNumber)})` : ''}
            </div>
          </div>
        </div>
        <div class="text-end">
          <span class="badge bg-dark border border-secondary text-muted" title="Detection Confidence">
            <i class="bi bi-eye me-1 text-emerald"></i>${Math.round((device.detectionConfidence || 0.8) * 100)}%
          </span>
        </div>
      </div>

      ${
        device.isFitting
          ? `
        <!-- Electrical Fitting Passive Box -->
        <div class="power-rating-box" style="border-color: rgba(148, 163, 184, 0.2);">
          <div class="d-flex justify-content-between align-items-center">
            <span class="power-rating-label"><i class="bi bi-toggles me-1"></i>Electrical Fitting</span>
            <span class="badge badge-fitting text-uppercase">${device.fittingType}</span>
          </div>
          <div class="mt-2 text-muted small">
            State: <span class="text-info text-capitalize">${device.fittingStatus}</span> (Passive circuit component - does not draw power directly).
          </div>
        </div>
      `
          : `
        <!-- CRITICAL USER-EDITABLE POWER RATING UI -->
        <div class="power-rating-box ${device.powerRatingVerified ? 'has-user-rating' : ''}">
          <div class="power-rating-header">
            <span class="power-rating-label">Electrical Power Rating</span>
            ${sourceBadge}
          </div>
          <div class="d-flex align-items-center justify-content-between">
            <div class="power-input-group">
              <input
                type="number"
                class="form-control power-rating-input"
                id="input-watts-${device._id}"
                value="${watts}"
                min="1"
                max="25000"
                step="1"
                aria-label="Power Rating Watts"
              />
              <span class="power-unit">W</span>
            </div>
            <button class="btn btn-vt-primary btn-sm save-power-btn" id="btn-save-watts-${device._id}" title="Save custom wattage">
              <i class="bi bi-check2"></i> Save
            </button>
          </div>
          <div class="rating-source-row">
            <span>
              ${device.isVariablePower ? '<i class="bi bi-info-circle text-warning me-1"></i>Variable draw (estimate)' : '<i class="bi bi-check2-circle text-emerald me-1"></i>Constant load'}
            </span>
            ${
              device.powerRatingSource === 'user_entered'
                ? `<button class="btn btn-link btn-sm text-dim p-0 reset-power-btn" id="btn-reset-${device._id}">Reset to AI estimate</button>`
                : '<span class="text-dim">Editable</span>'
            }
          </div>
        </div>

        <!-- Usage Parameters (Editable Hours) -->
        <div class="row g-2 mb-3">
          <div class="col-6">
            <label class="form-label small text-dim mb-1">Hours / Day</label>
            <input
              type="number"
              class="form-control form-control-sm text-center font-monospace"
              id="input-hours-${device._id}"
              value="${hours}"
              min="0.1"
              max="24"
              step="0.5"
            />
          </div>
          <div class="col-6">
            <label class="form-label small text-dim mb-1">Days / Month</label>
            <input
              type="number"
              class="form-control form-control-sm text-center font-monospace"
              id="input-days-${device._id}"
              value="${days}"
              min="1"
              max="31"
              step="1"
            />
          </div>
        </div>

        <!-- Calculated Energy & Cost Breakdown -->
        <div class="device-metrics-grid">
          <div class="metric-mini-item">
            <div class="metric-mini-label">Daily</div>
            <div class="metric-mini-value" id="val-daily-kwh-${device._id}">${dailyKwh.toFixed(2)} <span class="small text-muted font-sans">kWh</span></div>
          </div>
          <div class="metric-mini-item">
            <div class="metric-mini-label">Monthly</div>
            <div class="metric-mini-value" id="val-monthly-kwh-${device._id}">${monthlyKwh.toFixed(1)} <span class="small text-muted font-sans">kWh</span></div>
          </div>
          <div class="metric-mini-item">
            <div class="metric-mini-label">Est. Cost</div>
            <div class="metric-mini-value text-emerald" id="val-cost-${device._id}">₹${monthlyCost.toFixed(0)}</div>
          </div>
        </div>
      `
      }
    </div>

    <!-- Card Action Buttons -->
    <div class="device-actions justify-content-between">
      <button class="btn btn-vt-secondary btn-sm edit-details-btn" id="btn-edit-details-${device._id}">
        <i class="bi bi-pencil-square me-1"></i> Details
      </button>
      <button class="btn btn-vt-danger btn-sm delete-device-btn" id="btn-delete-${device._id}" title="Remove false detection">
        <i class="bi bi-trash3"></i>
      </button>
    </div>
  `;

  // Attach event handlers
  if (!device.isFitting) {
    const saveBtn = card.querySelector(`#btn-save-watts-${device._id}`);
    const inputWatts = card.querySelector(`#input-watts-${device._id}`);
    const inputHours = card.querySelector(`#input-hours-${device._id}`);
    const inputDays = card.querySelector(`#input-days-${device._id}`);

    const handleSave = async () => {
      const newWatts = parseFloat(inputWatts.value);
      const newHours = parseFloat(inputHours.value);
      const newDays = parseInt(inputDays.value, 10);

      if (isNaN(newWatts) || newWatts < 1 || newWatts > 25000) {
        UI.showToast('Please enter a valid power rating between 1 and 25,000 Watts.', 'danger');
        return;
      }

      UI.setLoading(saveBtn, true, 'Saving...');
      try {
        const res = await api.patch(`/devices/${device._id}/power-rating`, {
          powerRatingWatts: newWatts,
          powerRatingSource: 'user_entered',
          dailyUsageHours: newHours,
          daysUsedPerMonth: newDays
        });

        UI.showToast(`Saved ${newWatts}W rating for ${device.displayName}! Energy recalculated.`, 'success');
        if (onUpdate) onUpdate(res.device || res);
      } catch (err) {
        UI.showToast(err.message || 'Failed to update power rating', 'danger');
      } finally {
        UI.setLoading(saveBtn, false);
      }
    };

    saveBtn.addEventListener('click', handleSave);

    // Save on Enter in watts input
    inputWatts.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSave();
    });

    const resetBtn = card.querySelector(`#btn-reset-${device._id}`);
    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        try {
          const res = await api.post(`/devices/${device._id}/power-rating/reset`);
          UI.showToast(`Reset ${device.displayName} to reference estimate.`, 'info');
          if (onUpdate) onUpdate(res.device || res);
        } catch (err) {
          UI.showToast(err.message, 'danger');
        }
      });
    }
  }

  // Delete device
  const deleteBtn = card.querySelector(`#btn-delete-${device._id}`);
  deleteBtn.addEventListener('click', async () => {
    if (confirm(`Remove "${device.displayName}" from room inventory?`)) {
      try {
        await api.delete(`/devices/${device._id}`);
        card.remove();
        UI.showToast(`Removed ${device.displayName}`, 'info');
        if (onUpdate) onUpdate();
      } catch (err) {
        UI.showToast(err.message, 'danger');
      }
    }
  });

  return card;
}

function getCategoryIcon(category, canonical) {
  if (canonical === 'ceiling_fan') return 'bi-fan';
  if (canonical === 'air_conditioner') return 'bi-snow';
  if (canonical === 'television') return 'bi-tv';
  if (canonical === 'laptop') return 'bi-laptop';
  if (canonical === 'lamp') return 'bi-lightbulb';
  if (canonical === 'refrigerator') return 'bi-refrigerator';
  if (canonical === 'switch') return 'bi-toggles';
  if (canonical === 'socket') return 'bi-plug';

  switch (category) {
    case 'cooling': return 'bi-snow';
    case 'entertainment': return 'bi-tv';
    case 'computing': return 'bi-laptop';
    case 'kitchen': return 'bi-cup-hot';
    case 'lighting': return 'bi-lightbulb';
    case 'electrical_fittings': return 'bi-toggles';
    default: return 'bi-plug';
  }
}

function getSourceBadge(source, verified) {
  if (source === 'user_entered' || verified) {
    return `<span class="vt-badge badge-source-user" title="Verified by User"><i class="bi bi-patch-check-fill"></i> User Entered</span>`;
  }
  if (source === 'manufacturer_specification') {
    return `<span class="vt-badge badge-source-mfg" title="From Manufacturer Spec"><i class="bi bi-building"></i> Mfg Spec</span>`;
  }
  return `<span class="vt-badge badge-source-ref" title="Default Reference Estimate"><i class="bi bi-calculator"></i> AI Estimate</span>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
