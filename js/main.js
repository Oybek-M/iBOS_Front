/* js/main.js — UMD/browser (no import) */

(function () {
  "use strict";

  // CHECK I18N LIB AVAILABILITY
  if (typeof window.I18n === "undefined") {
    console.error(
      "i18n-js (I18n) is not found. Make sure you included the CDN <script> before main.js."
    );
    return;
  }
  const I18n = window.I18n;

  // ---------- Config ----------
  I18n.fallbacks = true;
  const LOCALES = {
    en: "../locales/en.json",
    uz: "../locales/uz.json",
    ru: "../locales/ru.json",
  };

  // Spinner HTML template (will be created if not present)
  const SPINNER_HTML = `
  <div id="spinner" class="show bg-white position-fixed translate-middle w-100 vh-100 top-50 start-50 d-flex align-items-center justify-content-center" style="z-index: 99999;">
    <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
      <span class="sr-only">Loading...</span>
    </div>
  </div>`;

  // ---------- Utilities ----------
  function safeSetText(el, text) {
    if (!el) return;
    if (el.children.length === 0) {
      el.textContent = text;
      return;
    }
    for (let node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        node.nodeValue = text;
        return;
      }
    }
    el.insertBefore(document.createTextNode(text), el.firstChild);
  }

  function hideSpinner() {
    const sp = document.getElementById("spinner");
    if (!sp) return;
    sp.classList.remove("show");
    sp.classList.add("d-none");
    sp.style.display = "none";
  }

  function showSpinner() {
    let sp = document.getElementById("spinner");
    if (!sp) {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = SPINNER_HTML.trim();
      document.body.appendChild(wrapper.firstChild);
      sp = document.getElementById("spinner");
    } else {
      sp.classList.add("show");
      sp.classList.remove("d-none");
      sp.style.display = "";
    }
  }

  // ---------- Translations loading ----------
  // old loadLocales o'rniga quyidagini qo'ying
  async function loadLocales() {
    const entries = Object.entries(LOCALES);
    const results = {};
    let fetchFailed = false;

    await Promise.all(
      entries.map(async ([key, url]) => {
        try {
          const res = await fetch(url, { cache: "no-cache" });
          if (!res.ok) throw new Error("HTTP " + res.status);
          results[key] = await res.json();
        } catch (err) {
          console.warn("Failed to fetch locale", key, url, err);
          fetchFailed = true;
          results[key] = {}; // bo'sh fallback
        }
      })
    );

    // Agar fetch muvaffaqiyatsiz bo'lsa va window.LOCALES mavjud bo'lsa, undan foydalan
    if (fetchFailed && window.LOCALES) {
      console.info("Using inline window.LOCALES fallback (fetch failed).");
      // merge: only fill into results keys that are empty
      Object.keys(window.LOCALES).forEach((k) => {
        results[k] = window.LOCALES[k] || results[k] || {};
      });
    }

    return results;
  }

  // ---------- update translations (data attributes) ----------
  function updateTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      const t = I18n.t(key);
      safeSetText(el, t);
    });

    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      if (!key) return;
      el.innerHTML = I18n.t(key);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (!key) return;
      el.setAttribute("placeholder", I18n.t(key));
    });

    document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
      const key = el.getAttribute("data-i18n-alt");
      if (!key) return;
      el.setAttribute("alt", I18n.t(key));
    });

    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      if (!key) return;
      el.setAttribute("title", I18n.t(key));
    });

    document.querySelectorAll("[data-i18n-value]").forEach((el) => {
      const key = el.getAttribute("data-i18n-value");
      if (!key) return;
      el.value = I18n.t(key);
    });

    const titleTag = document.querySelector("title[data-i18n]");
    if (titleTag) document.title = I18n.t(titleTag.getAttribute("data-i18n"));
  }

  // Fallback selectors (keeps compatibility if some elements lack data-i18n)
  const FALLBACK_SELECTORS = [
    { sel: ".navbar .nav-link", key: "nav.home" },
    { sel: ".navbar .nav-link[href='about.html']", key: "nav.about" },
    { sel: ".navbar .nav-link[href='courses.html']", key: "nav.courses" },
    { sel: ".nav-item.dropdown > .nav-link.dropdown-toggle", key: "nav.pages" },
    { sel: ".dropdown-menu .dropdown-item:nth-of-type(1)", key: "nav.team" },
    {
      sel: ".dropdown-menu .dropdown-item:nth-of-type(2)",
      key: "nav.testimonial",
    },
    { sel: ".dropdown-menu .dropdown-item:nth-of-type(3)", key: "nav.error" },
    { sel: ".navbar .nav-link[href='contact.html']", key: "nav.contact" },
    { sel: ".btn.btn-primary.py-4.px-lg-5", key: "nav.join" },
  ];

  function applyFallbackTranslations() {
    FALLBACK_SELECTORS.forEach((item) => {
      try {
        const el = document.querySelector(item.sel);
        if (el) {
          const val = I18n.t(item.key);
          safeSetText(el, val);
        }
      } catch (e) {
        // ignore selector errors
      }
    });
  }

  // ---------- Language change ----------
  function changeLanguage(lang) {
    if (!lang) return;
    I18n.locale = lang;
    try {
      localStorage.setItem("lang", lang);
    } catch (e) {
      /* no-op */
    }
    updateTranslations();
    applyFallbackTranslations();
  }

  function ensureLangSelector() {
    let sel = document.getElementById("lang-select");
    if (!sel) {
      sel = document.createElement("select");
      sel.id = "lang-select";
      sel.className = "form-select form-select-sm w-auto ms-3";
      sel.setAttribute("aria-label", "Language select");
      sel.innerHTML = `
        <option value="uz">🇺🇿 Oʻzbekcha</option>
        <option value="en">🇬🇧 English</option>
        <option value="ru">🇷🇺 Русский</option>
      `;
      const collapse = document.querySelector(
        ".navbar .collapse.navbar-collapse"
      );
      if (collapse) collapse.appendChild(sel);
      else document.body.appendChild(sel);
    }
    sel.value = I18n.locale || "uz";

    const onChange = (e) => {
      const v = e.target.value;
      changeLanguage(v);
    };
    sel.removeEventListener("change", onChange);
    sel.addEventListener("change", onChange);
    sel.addEventListener("input", onChange);
  }

  // ---------- INIT ----------
  async function init() {
    showSpinner();

    const locales = await loadLocales();
    I18n.translations = locales;

    // localStorage dan olish to'g'ri, agar yo'q bo'lsa DEFAULT = 'uz'
    const saved = localStorage.getItem("lang");
    if (saved) {
      I18n.locale = saved;
    } else {
      I18n.locale = "uz"; // default o'zbekcha
    }

    const domReady = () => {
      ensureLangSelector();
      updateTranslations();
      applyFallbackTranslations();

      if (document.readyState === "complete") hideSpinner();
      else window.addEventListener("load", hideSpinner);

      setTimeout(hideSpinner, 5000);
    };

    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", domReady);
    else domReady();
  }

  init();

  // expose changeLanguage for debug
  window.changeLanguage = changeLanguage;
})();
