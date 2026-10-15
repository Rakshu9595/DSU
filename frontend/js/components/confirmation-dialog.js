function createDialog(title) {
  const dialog = document.createElement("dialog");
  dialog.className = "app-dialog";
  const form = document.createElement("form");
  form.method = "dialog";
  const heading = document.createElement("h2");
  heading.textContent = title;
  form.append(heading);
  dialog.append(form);
  document.body.append(dialog);
  return { dialog, form };
}

function finishDialog(dialog, value, resolve) {
  dialog.close();
  dialog.remove();
  resolve(value);
}

export function showFormDialog({ title, fields, confirmLabel = "Save" }) {
  return new Promise((resolve) => {
    const { dialog, form } = createDialog(title);
    for (const field of fields) {
      const label = document.createElement("label");
      label.className = "form-label d-block mt-3";
      label.htmlFor = `dialog-${field.name}`;
      label.textContent = field.label;
      const input = document.createElement("input");
      input.className = "form-control";
      input.id = label.htmlFor;
      input.name = field.name;
      input.type = field.type || "text";
      input.value = field.value ?? "";
      input.required = field.required !== false;
      if (field.min !== undefined) input.min = String(field.min);
      if (field.max !== undefined) input.max = String(field.max);
      if (field.step !== undefined) input.step = String(field.step);
      form.append(label, input);
    }
    const actions = document.createElement("div");
    actions.className = "app-dialog-actions";
    const cancel = document.createElement("button");
    cancel.className = "btn-outline-soft";
    cancel.type = "button";
    cancel.textContent = "Cancel";
    const confirm = document.createElement("button");
    confirm.className = "btn-primary-soft";
    confirm.type = "submit";
    confirm.textContent = confirmLabel;
    actions.append(cancel, confirm);
    form.append(actions);
    cancel.addEventListener("click", () => finishDialog(dialog, null, resolve));
    dialog.addEventListener("cancel", (event) => { event.preventDefault(); finishDialog(dialog, null, resolve); }, { once:true });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      finishDialog(dialog, Object.fromEntries(new FormData(form)), resolve);
    });
    dialog.showModal();
    form.querySelector("input")?.focus();
  });
}

export function confirmAction(message, title = "Confirm action") {
  return new Promise((resolve) => {
    const { dialog, form } = createDialog(title);
    const text = document.createElement("p");
    text.textContent = message;
    const actions = document.createElement("div");
    actions.className = "app-dialog-actions";
    const cancel = document.createElement("button");
    cancel.className = "btn-outline-soft";
    cancel.type = "button";
    cancel.textContent = "Cancel";
    const confirm = document.createElement("button");
    confirm.className = "btn-primary-soft";
    confirm.type = "button";
    confirm.textContent = "Confirm";
    actions.append(cancel, confirm);
    form.append(text, actions);
    cancel.addEventListener("click", () => finishDialog(dialog, false, resolve));
    confirm.addEventListener("click", () => finishDialog(dialog, true, resolve));
    dialog.addEventListener("cancel", (event) => { event.preventDefault(); finishDialog(dialog, false, resolve); }, { once:true });
    dialog.showModal();
    cancel.focus();
  });
}

export function showDetailsDialog(title, details) {
  return new Promise((resolve) => {
    const { dialog, form } = createDialog(title);
    const copy = document.createElement("p");
    copy.textContent = details;
    const actions = document.createElement("div");
    actions.className = "app-dialog-actions";
    const close = document.createElement("button");
    close.className = "btn-primary-soft";
    close.type = "button";
    close.textContent = "Close";
    actions.append(close);
    form.append(copy, actions);
    close.addEventListener("click", () => finishDialog(dialog, undefined, resolve));
    dialog.addEventListener("cancel", (event) => { event.preventDefault(); finishDialog(dialog, undefined, resolve); }, { once:true });
    dialog.showModal();
    close.focus();
  });
}
