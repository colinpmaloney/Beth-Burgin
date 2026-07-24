/**
 * beth-burgin.com site behaviour
 *
 * Four small, independent pieces:
 *   1. Mobile menu (open/close, backdrop, Escape, scroll lock, focus return)
 *   2. Header background once the page is scrolled
 *   3. Scroll-spy to mark the current section in the desktop nav
 *   4. Reveal-on-scroll, and the footer year
 *
 * Each is wrapped so a missing element on some future page can't break the rest.
 */
(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ *
   * 1. Mobile menu
   * ------------------------------------------------------------------ */
  (function mobileMenu() {
    const toggle = document.querySelector("[data-menu-toggle]");
    const panel = document.querySelector("[data-menu-panel]");
    if (!toggle || !panel) return;

    const drawer = panel.querySelector("[data-menu-drawer]");
    const backdrop = panel.querySelector("[data-menu-backdrop]");
    const closeBtn = panel.querySelector("[data-menu-close]");
    const links = panel.querySelectorAll("[data-menu-link]");

    let isOpen = false;
    let scrollY = 0;

    function open() {
      if (isOpen) return;
      isOpen = true;

      // Lock the page behind the drawer without losing scroll position.
      scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      panel.hidden = false;
      panel.classList.remove("pointer-events-none");
      toggle.setAttribute("aria-expanded", "true");

      // Next frame, so the transition actually runs from the closed state.
      requestAnimationFrame(function () {
        if (backdrop) backdrop.classList.replace("opacity-0", "opacity-100");
        if (drawer) drawer.classList.remove("translate-x-full");
      });

      if (closeBtn) closeBtn.focus({ preventScroll: true });
      document.addEventListener("keydown", onKeydown);
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;

      if (backdrop) backdrop.classList.replace("opacity-100", "opacity-0");
      if (drawer) drawer.classList.add("translate-x-full");
      panel.classList.add("pointer-events-none");
      toggle.setAttribute("aria-expanded", "false");

      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo({ top: scrollY, behavior: "instant" });

      document.removeEventListener("keydown", onKeydown);

      const hide = function () {
        if (!isOpen) panel.hidden = true;
      };
      if (prefersReducedMotion || !drawer) hide();
      else window.setTimeout(hide, 300);

      toggle.focus({ preventScroll: true });
    }

    function onKeydown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      // Keep tabbing inside the drawer while it's open.
      if (event.key === "Tab" && drawer) {
        const focusable = drawer.querySelectorAll(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    toggle.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (backdrop) backdrop.addEventListener("click", close);

    // Close on navigation. In-page anchors need the drawer gone *before* the
    // scroll happens, or the scroll lock swallows it.
    links.forEach(function (link) {
      link.addEventListener("click", function (event) {
        const href = link.getAttribute("href") || "";
        if (!href.startsWith("#")) {
          close();
          return;
        }

        event.preventDefault();
        close();

        const target = document.querySelector(href);
        if (!target) return;

        window.setTimeout(
          function () {
            target.scrollIntoView({
              behavior: prefersReducedMotion ? "auto" : "smooth",
              block: "start",
            });
            history.replaceState(null, "", href);
          },
          prefersReducedMotion ? 0 : 320
        );
      });
    });

    // Reset if the viewport grows past the mobile breakpoint while open.
    window.matchMedia("(min-width: 1024px)").addEventListener("change", function (event) {
      if (event.matches) close();
    });
  })();

  /* ------------------------------------------------------------------ *
   * 2. Header background on scroll
   * ------------------------------------------------------------------ */
  (function stickyHeader() {
    const header = document.querySelector("[data-header]");
    if (!header) return;

    const scrolledClasses = ["bg-bone/85", "backdrop-blur-md", "shadow-soft"];

    function update() {
      header.classList.toggle(scrolledClasses[0], window.scrollY > 16);
      header.classList.toggle(scrolledClasses[1], window.scrollY > 16);
      header.classList.toggle(scrolledClasses[2], window.scrollY > 16);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
  })();

  /* ------------------------------------------------------------------ *
   * 3. Scroll-spy for the desktop nav
   * ------------------------------------------------------------------ */
  (function scrollSpy() {
    const navList = document.querySelector("[data-nav-list]");
    if (!navList || !("IntersectionObserver" in window)) return;

    const links = Array.prototype.slice.call(navList.querySelectorAll('a[href^="#"]'));
    const sections = links
      .map(function (link) {
        return document.querySelector(link.getAttribute("href"));
      })
      .filter(Boolean);

    if (!sections.length) return;

    const visible = new Set();

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });

        // Whichever tracked section sits highest on screen wins.
        const current = sections.find(function (section) {
          return visible.has(section.id);
        });

        links.forEach(function (link) {
          const isCurrent = !!current && link.getAttribute("href") === "#" + current.id;
          if (isCurrent) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  })();

  /* ------------------------------------------------------------------ *
   * 4. Reveal on scroll + footer year
   * ------------------------------------------------------------------ */
  (function reveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );

    // Stagger siblings slightly so groups of cards cascade rather than snap in together.
    items.forEach(function (item) {
      const siblings = item.parentElement
        ? Array.prototype.slice.call(item.parentElement.children).filter(function (el) {
            return el.classList.contains("reveal");
          })
        : [];
      const index = siblings.indexOf(item);
      if (index > 0) item.style.transitionDelay = Math.min(index, 5) * 70 + "ms";

      observer.observe(item);
    });
  })();

  (function footerYear() {
    const el = document.querySelector("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  })();
})();
