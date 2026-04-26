const MODES = ["native", "1200px", "1600px", "95vw"];
const STORAGE_KEY = "qmWideGptWidth";
const STYLE_ID = "qm-widegpt-style";
const BUTTON_ID = "qm-widegpt-button";

let currentIndex = 0;

init();

function init() {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const savedWidth = result[STORAGE_KEY];

    if (savedWidth && MODES.includes(savedWidth)) {
      currentIndex = MODES.indexOf(savedWidth);
    }

    applyWidth(MODES[currentIndex]);
    injectButtonStyles();
    waitForHeader();
  });
}

function applyWidth(mode) {
  let style = document.getElementById(STYLE_ID);

  // If native → remove styles entirely
  if (mode === "native") {
    if (style) style.remove();
    return;
  }

  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }

  style.textContent = `
    main,
    main * {
      --thread-content-max-width: ${mode} !important;
      --content-width: ${mode} !important;
    }

    main .max-w-3xl,
    main .max-w-4xl,
    main .max-w-5xl,
    main [class*="max-w-3xl"],
    main [class*="max-w-4xl"],
    main [class*="max-w-5xl"] {
      max-width: ${mode} !important;
    }

    form,
    form > div,
    main form {
      max-width: ${mode} !important;
    }
  `;
}

function injectButtonStyles() {
  if (document.getElementById(`${BUTTON_ID}-styles`)) return;

  const style = document.createElement("style");
  style.id = `${BUTTON_ID}-styles`;

  style.textContent = `
    #${BUTTON_ID} {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 32px;
      padding: 0 10px;
      border-radius: 8px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--text-primary, currentColor);
      font-size: 13px;
      line-height: 1;
      cursor: pointer;
      white-space: nowrap;
      opacity: 0.9;
    }

    #${BUTTON_ID}:hover {
      background: var(--surface-hover, rgba(0, 0, 0, 0.06));
      border-color: var(--border-light, rgba(0, 0, 0, 0.08));
      opacity: 1;
    }

    #${BUTTON_ID}:active {
      background: var(--surface-active, rgba(0, 0, 0, 0.1));
    }

    #${BUTTON_ID} .qm-widegpt-icon {
      font-size: 15px;
      line-height: 1;
      opacity: 0.85;
    }

    #${BUTTON_ID} .qm-widegpt-label {
      font-weight: 500;
    }
  `;

  document.head.appendChild(style);
}

function waitForHeader() {
  const observer = new MutationObserver(() => {
    const header = document.querySelector("header");

    if (header && !document.getElementById(BUTTON_ID)) {
      insertButton(header);
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  const header = document.querySelector("header");
  if (header && !document.getElementById(BUTTON_ID)) {
    insertButton(header);
  }
}

function insertButton(header) {
  const button = document.createElement("button");
  button.id = BUTTON_ID;
  button.type = "button";
  button.title = "Toggle ChatGPT width";
  button.setAttribute("aria-label", "Toggle ChatGPT width");

  button.innerHTML = `
    <span class="qm-widegpt-icon">↔</span>
    <span class="qm-widegpt-label"></span>
  `;

  button.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % MODES.length;
    const newMode = MODES[currentIndex];

    applyWidth(newMode);
    updateButtonLabel(button);

    chrome.storage.local.set({
      [STORAGE_KEY]: newMode
    });
  });

  const target =
    header.querySelector("nav") ||
    header.querySelector('[role="navigation"]') ||
    header;

  target.appendChild(button);
  updateButtonLabel(button);
}

function updateButtonLabel(button) {
  const labels = {
    "native": "native",
    "1200px": "1200",
    "1600px": "1600",
    "95vw": "Full"
  };

  button.querySelector(".qm-widegpt-label").textContent =
    labels[MODES[currentIndex]];
}