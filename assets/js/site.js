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

    // 95% rather than something more see-through: the nav is text-muted, and
    // when a dark section slides under a thinner background the effective
    // contrast drops under 4.5:1.
    const scrolledClasses = ["bg-bone/95", "backdrop-blur-md", "shadow-header"];

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

    function show(item) {
      item.classList.add("is-visible");
      observer.unobserve(item);
      // The stagger belongs to the entrance only. Left in place, the inline
      // delay would also hold back the hover lift, since .js .card-lift now
      // transitions box-shadow and transform through the same declaration.
      // Longest entrance is 350ms of delay plus a 700ms fade.
      window.setTimeout(function () {
        item.style.transitionDelay = "";
      }, 1100);
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) show(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );

    // Safety net. A fast flick can scroll an element past the viewport between
    // observer callbacks, and since each element is unobserved once revealed,
    // one that never fires would stay invisible for good. Anything already
    // scrolled past gets revealed regardless. Detaches once nothing is left.
    let pending = items.length;
    let ticking = false;

    function sweep() {
      pending = 0;
      items.forEach(function (item) {
        if (item.classList.contains("is-visible")) return;
        // Only rescue what has left the viewport entirely. Anything looser
        // fires before the observer's rootMargin and threshold would have, so
        // the net quietly becomes the real trigger and the tuned entrance
        // never runs.
        if (item.getBoundingClientRect().bottom < 0) show(item);
        else pending++;
      });
      if (!pending) window.removeEventListener("scroll", onScroll);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        sweep();
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });

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

  /* ------------------------------------------------------------------ *
   * 5. Testimonial carousel
   * ------------------------------------------------------------------ */
  (function testimonials() {
    const root = document.querySelector("[data-carousel]");
    if (!root) return;

    const track = root.querySelector("[data-carousel-track]");
    const slides = Array.prototype.slice.call(root.querySelectorAll("[data-carousel-slide]"));
    if (!track || slides.length < 2) return;

    const dotsWrap = root.querySelector("[data-carousel-dots]");
    const status = root.querySelector("[data-carousel-status]");
    const toggle = root.querySelector("[data-carousel-toggle]");
    const toggleLabel = root.querySelector("[data-carousel-toggle-label]");
    const iconPause = root.querySelector("[data-carousel-icon-pause]");
    const iconPlay = root.querySelector("[data-carousel-icon-play]");

    const count = slides.length;
    const half = Math.floor(count / 2);
    const DELAY = 7000;
    const SWIPE = 40;

    let active = 0;
    let timer = null;
    let hovering = false;
    // Auto-rotation is motion, so it starts off for anyone who asked for less.
    let wanted = !prefersReducedMotion;
    let dragFrom = null;
    let swiped = false;

    const dots = slides.map(function (_, i) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot";
      dot.setAttribute("aria-label", "Show review " + (i + 1) + " of " + count);
      dot.addEventListener("click", function () {
        show(i, true);
      });
      if (dotsWrap) dotsWrap.appendChild(dot);
      return dot;
    });

    // Shortest signed distance from the active slide, so the row wraps around
    // instead of running out at either end.
    function distance(i) {
      let d = i - active;
      if (d > half) d -= count;
      if (d < -half) d += count;
      return d;
    }

    // Reviews differ a lot in length. Give every card the tallest one's height
    // so the section keeps a steady size as it rotates, and a short review sits
    // in a card of its own rather than marooned in a tall empty box.
    // From 40rem up there's enough width that every card can share the tallest
    // one's height without the short reviews looking hollow, and a fixed frame
    // is calmer. On a phone the same trick leaves the short reviews mostly
    // empty, so there each card keeps its own height and the track follows
    // whichever one is in focus.
    const wide = window.matchMedia("(min-width: 40rem)");

    // Only run on load, resize, and webfont swap. It reads geometry after
    // writing styles, which forces a reflow, so reads and writes are kept in
    // separate passes and the results are cached for render() to reuse.
    let heights = [];
    let tallest = 0;
    let step = 0;

    function measure() {
      // Clear first so each card reports its natural height again.
      slides.forEach(function (slide) {
        slide.style.height = "";
      });

      // Read pass.
      heights = slides.map(function (slide) {
        return slide.offsetHeight;
      });
      tallest = Math.max.apply(null, heights);
      step = slides[0].offsetWidth * 0.72;

      // Write pass.
      if (wide.matches) {
        slides.forEach(function (slide) {
          slide.style.height = tallest + "px";
        });
      }
      fitTrack();
    }

    function fitTrack() {
      track.style.height = (wide.matches ? tallest : heights[active]) + "px";
    }

    // Writes only. Reading the card width here instead would force a reflow on
    // every rotation rather than only when the layout actually changes.
    function render() {
      slides.forEach(function (slide, i) {
        const d = distance(i);
        const away = Math.abs(d);

        // A card wrapping from one end of the row to the other would otherwise
        // animate across the whole section. It's invisible at both ends, so
        // move it with the transition switched off.
        const was = slide.dataset.d;
        const jumped = was !== undefined && Math.abs(d - Number(was)) > 1;
        if (jumped) slide.style.transition = "none";

        slide.style.transform =
          "translate(calc(-50% + " + d * step + "px), -50%) scale(" + (d === 0 ? 1 : 0.86) + ")";
        slide.style.opacity = away === 0 ? "1" : away === 1 ? "0.4" : "0";
        slide.style.filter = d === 0 ? "none" : "blur(3px)";
        slide.style.zIndex = String(10 - away);
        slide.style.boxShadow = d === 0 ? "var(--shadow-e3)" : "var(--shadow-e1)";
        slide.style.pointerEvents = away <= 1 ? "auto" : "none";
        slide.setAttribute("aria-hidden", d === 0 ? "false" : "true");
        slide.dataset.position = d === 0 ? "active" : "side";

        if (jumped) {
          void slide.offsetWidth;
          slide.style.transition = "";
        }
        slide.dataset.d = String(d);
      });

      dots.forEach(function (dot, i) {
        if (i === active) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });

      // Cheap: heights were cached by measure(), so this writes without reading.
      fitTrack();

      if (status) status.textContent = "Review " + (active + 1) + " of " + count;
    }

    function show(index, fromUser) {
      active = ((index % count) + count) % count;
      render();
      if (fromUser) schedule();
    }

    function schedule() {
      window.clearInterval(timer);
      timer = null;
      if (!wanted || hovering || document.hidden) return;
      timer = window.setInterval(function () {
        show(active + 1);
      }, DELAY);
    }

    function syncToggle() {
      if (iconPause) iconPause.hidden = !wanted;
      if (iconPlay) iconPlay.hidden = wanted;
      if (toggleLabel) {
        toggleLabel.textContent = wanted
          ? "Pause automatic rotation"
          : "Resume automatic rotation";
      }
      // Announcing every automatic change would be constant chatter, so the
      // live region only speaks once the visitor is the one driving.
      if (status) status.setAttribute("aria-live", wanted ? "off" : "polite");
    }

    const prev = root.querySelector("[data-carousel-prev]");
    const next = root.querySelector("[data-carousel-next]");
    if (prev) prev.addEventListener("click", function () { show(active - 1, true); });
    if (next) next.addEventListener("click", function () { show(active + 1, true); });

    if (toggle) {
      toggle.addEventListener("click", function () {
        wanted = !wanted;
        syncToggle();
        schedule();
      });
    }

    // Clicking a card on either side brings it to the middle.
    slides.forEach(function (slide, i) {
      slide.addEventListener("click", function () {
        if (swiped || slide.dataset.position !== "side") return;
        show(i, true);
      });
    });

    root.addEventListener("mouseenter", function () { hovering = true; schedule(); });
    root.addEventListener("mouseleave", function () { hovering = false; schedule(); });
    root.addEventListener("focusin", function () { hovering = true; schedule(); });
    root.addEventListener("focusout", function () {
      if (!root.contains(document.activeElement)) {
        hovering = false;
        schedule();
      }
    });

    root.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") { event.preventDefault(); show(active - 1, true); }
      else if (event.key === "ArrowRight") { event.preventDefault(); show(active + 1, true); }
    });

    // Swipe. Deliberately touch and pen only: with a mouse, dragging across a
    // quote is how you select it, and hijacking that to change slides means you
    // can't copy a review. Mouse users have the arrows, dots, and side cards.
    track.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "mouse") return;
      dragFrom = { x: event.clientX, y: event.clientY };
      swiped = false;
    });
    track.addEventListener("pointerup", function (event) {
      if (!dragFrom) return;
      const dx = event.clientX - dragFrom.x;
      const dy = event.clientY - dragFrom.y;
      dragFrom = null;
      // Ignore anything that was mostly a vertical scroll.
      if (Math.abs(dx) < SWIPE || Math.abs(dx) < Math.abs(dy)) return;
      swiped = true;
      show(active + (dx < 0 ? 1 : -1), true);
      // Let the click that follows the swipe pass by before re-arming.
      window.setTimeout(function () { swiped = false; }, 0);
    });
    track.addEventListener("pointercancel", function () { dragFrom = null; });

    document.addEventListener("visibilitychange", schedule);

    // Crossing 40rem switches between shared and natural card heights.
    wide.addEventListener("change", function () {
      measure();
      render();
    });

    let resizeTimer = null;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        measure();
        render();
      }, 150);
    });

    // Card heights depend on the webfont, so measure again once it lands.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        measure();
        render();
      });
    }

    syncToggle();
    measure();
    render();
    schedule();
  })();

  (function footerYear() {
    const el = document.querySelector("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  })();
})();
