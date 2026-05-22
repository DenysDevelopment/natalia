/* app.js — Natalia Rudnik landing
   -------------------------------------------------------------------------
   No framework. Three jobs:
     1. i18n   — swap UA ⇄ PL by rewriting [data-i18n*] nodes from content.js.
     2. UI     — FAQ accordion.
     3. Motion — scroll-reveal, parallax, progress bar, active-nav.
   The UA copy is already in the static HTML, so crawlers and a no-JS visitor
   see the full page; this script only enhances and translates it.
   ------------------------------------------------------------------------- */
(function () {
  "use strict";

  var CONTENT = window.CONTENT;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── helpers ──────────────────────────────────────────────────────────── */
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  // Walk a dotted path ("services.items.0.name") into a nested object/array.
  function get(obj, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc == null ? acc : acc[key];
    }, obj);
  }
  function lastWordsItalic(str, n) {
    var words = str.split(" ");
    var tail = words.slice(-n).join(" ");
    var head = words.slice(0, -n).join(" ");
    return (head ? esc(head) + " " : "") + '<span class="it">' + esc(tail) + "</span>";
  }

  /* ── HTML builders for headings that carry an italic accent ───────────── */
  // Keyed by the element's data-i18n-html value. Each returns innerHTML.
  var HTML_BUILDERS = {
    "hero.h1":         function (c) { return lastWordsItalic(c.hero.h1, 1); },
    "about.title":     function (c) { return lastWordsItalic(c.about.title, 2); },
    "services.title":  function (c) { return lastWordsItalic(c.services.title, 2); },
    "courses.title":   function (c) { return lastWordsItalic(c.courses.title, 1); },
    "mini.title":      function (c) { return lastWordsItalic(c.mini.title, 3); },
    "meditations.title": function (c) { return lastWordsItalic(c.meditations.title, 1); },
    "reviews.title":   function (c) { return lastWordsItalic(c.reviews.title, 1); },
    "faq.title":       function (c) { return lastWordsItalic(c.faq.title, 1); },
    "contacts.title":  function (c) { return lastWordsItalic(c.contacts.title, 2); },
    "footer.tagline":  function (c) { return '— <span class="it">' + esc(c.footer.tagline) + "</span>"; }
  };

  /* ── i18n: apply a language ───────────────────────────────────────────── */
  function applyLang(lang) {
    var c = CONTENT[lang] || CONTENT.uk;
    var doc = document;

    doc.documentElement.lang = lang;
    doc.title = c.seo.title;

    // Head meta (kept in sync so shares/SEO reflect the chosen language).
    setMeta('meta[name="description"]', "content", c.seo.description);
    setMeta('meta[property="og:title"]', "content", c.seo.title);
    setMeta('meta[property="og:description"]', "content", c.seo.description);
    setMeta('meta[property="og:locale"]', "content", c.seo.ogLocale);
    setMeta('meta[name="twitter:title"]', "content", c.seo.title);
    setMeta('meta[name="twitter:description"]', "content", c.seo.description);

    // Plain text nodes.
    each("[data-i18n]", function (el) {
      var v = get(c, el.getAttribute("data-i18n"));
      if (v != null) el.textContent = v;
    });
    // Headings with an italic accent.
    each("[data-i18n-html]", function (el) {
      var key = el.getAttribute("data-i18n-html");
      if (HTML_BUILDERS[key]) el.innerHTML = HTML_BUILDERS[key](c);
    });
    // Attribute translations: "attr:path".
    each("[data-i18n-attr]", function (el) {
      var spec = el.getAttribute("data-i18n-attr").split(":");
      var v = get(c, spec[1]);
      if (v != null) el.setAttribute(spec[0], v);
    });

    // Language toggle state.
    each(".lang-toggle button", function (btn) {
      btn.setAttribute("data-on", btn.getAttribute("data-lang") === lang ? "1" : "0");
    });

    // Reflect the choice in the URL + storage so it is shareable.
    try { localStorage.setItem("nata-lang", lang); } catch (e) {}
    var url = new URL(window.location.href);
    if (lang === "uk") url.searchParams.delete("lang");
    else url.searchParams.set("lang", lang);
    history.replaceState(null, "", url.pathname + (url.search || "") + url.hash);
  }

  function setMeta(sel, attr, val) {
    var el = document.querySelector(sel);
    if (el) el.setAttribute(attr, val);
  }
  function each(sel, fn) {
    var nodes = document.querySelectorAll(sel);
    for (var i = 0; i < nodes.length; i++) fn(nodes[i]);
  }

  /* ── FAQ accordion (single panel open) ────────────────────────────────── */
  function initFAQ() {
    var items = document.querySelectorAll(".faq-item");
    function toggle(item) {
      var isOpen = item.getAttribute("data-open") === "1";
      for (var i = 0; i < items.length; i++) {
        items[i].setAttribute("data-open", "0");
        items[i].querySelector(".faq-q").setAttribute("aria-expanded", "false");
      }
      if (!isOpen) {
        item.setAttribute("data-open", "1");
        item.querySelector(".faq-q").setAttribute("aria-expanded", "true");
      }
    }
    each(".faq-q", function (q) {
      q.addEventListener("click", function () { toggle(q.parentElement); });
      q.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(q.parentElement); }
      });
    });
  }

  /* ── Mobile menu (burger) ─────────────────────────────────────────────── */
  function initMobileMenu() {
    var burger = document.querySelector(".nav-burger");
    var menu = document.getElementById("mobileMenu");
    if (!burger || !menu) return;
    function setOpen(open) {
      menu.setAttribute("data-open", open ? "1" : "0");
      menu.setAttribute("aria-hidden", open ? "false" : "true");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("menu-open", open);
    }
    burger.addEventListener("click", function () {
      setOpen(menu.getAttribute("data-open") !== "1");
    });
    each("#mobileMenu a", function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.getAttribute("data-open") === "1") setOpen(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 760) setOpen(false);
    });
  }

  /* ── Scroll engine: reveal · parallax · progress · active-nav ──────────── */
  function initMotion() {
    var revealTargets = function () {
      return document.querySelectorAll('[data-reveal]:not([data-reveal="in"])');
    };
    var reveal = function (el) {
      if (el.getAttribute("data-reveal") !== "in") el.setAttribute("data-reveal", "in");
    };
    var inView = function (el, slop) {
      var r = el.getBoundingClientRect();
      return r.top < window.innerHeight - (slop || 0) && r.bottom > (slop || 0);
    };

    // Reveal anything already on-screen at load.
    [].forEach.call(revealTargets(), function (el) { if (inView(el, 0)) reveal(el); });

    // IntersectionObserver — primary reveal mechanism.
    if (typeof IntersectionObserver !== "undefined") {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
      [].forEach.call(revealTargets(), function (el) { io.observe(el); });
    }

    // Active-nav links keyed to section ids.
    var navLinks = {};
    each(".nav-links a", function (a) {
      var id = a.getAttribute("href").slice(1);
      if (id) navLinks[id] = a;
    });
    var watched = ["about", "services", "courses", "meditations", "reviews", "contacts"];
    function updateNav() {
      var active = "", mid = window.innerHeight * 0.32;
      watched.forEach(function (id) {
        var sec = document.getElementById(id);
        if (!sec) return;
        var r = sec.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) active = id;
      });
      watched.forEach(function (id) {
        if (navLinks[id]) navLinks[id].setAttribute("data-active", id === active ? "1" : "0");
      });
    }

    // Per-element parallax: each [data-parallax] drifts by its own speed,
    // measured from viewport centre so it works anywhere down the page.
    var pxEls = [].slice.call(document.querySelectorAll("[data-parallax]"));
    function applyParallax(vh) {
      for (var i = 0; i < pxEls.length; i++) {
        var el = pxEls[i];
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0;
        var r = el.getBoundingClientRect();
        var center = r.top + r.height / 2 - vh / 2;
        el.style.setProperty("--ty", (-center * speed).toFixed(1) + "px");
      }
    }

    var progress = document.querySelector(".scroll-progress");
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY || window.pageYOffset;
        if (!reduceMotion) {
          document.body.style.setProperty("--py", y + "px");
          applyParallax(window.innerHeight);
        }
        if (progress) {
          var max = document.documentElement.scrollHeight - window.innerHeight;
          progress.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
        }
        [].forEach.call(revealTargets(), function (el) { if (inView(el, 60)) reveal(el); });
        updateNav();
        ticking = false;
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    // Safety net — nothing should ever stay hidden.
    setTimeout(function () { [].forEach.call(revealTargets(), reveal); }, 2500);
  }

  /* ── boot ─────────────────────────────────────────────────────────────── */
  function pickLang() {
    var q = new URL(window.location.href).searchParams.get("lang");
    if (q && CONTENT[q]) return q;
    try {
      var stored = localStorage.getItem("nata-lang");
      if (stored && CONTENT[stored]) return stored;
    } catch (e) {}
    return "uk";
  }

  function boot() {
    applyLang(pickLang());
    each(".lang-toggle button", function (btn) {
      btn.addEventListener("click", function () { applyLang(btn.getAttribute("data-lang")); });
    });
    initFAQ();
    initMobileMenu();
    initMotion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
