/* ==========================================================================
   main.js
   1. Scroll reveal      (styles: ANIMATIONS in style.css)
   2. Scroll progress bar (styles: ANIMATIONS in style.css)
   3. Mobile menu         (styles: HEADER in style.css)
   4. Project slider      (styles: PROJECTS in style.css)
   5. Custom cursor       (styles: CUSTOM CURSOR in style.css)
   6. Grid alignment      (styles: SECTION BACKGROUNDS in style.css)
   7. Floating back-to-top (styles: .to-top-float in style.css)
   8. Dark / light mode    (styles: :root[data-theme="light"] in style.css)
   ========================================================================== */
(function () {
  "use strict";

  /* 1. SCROLL REVEAL ------------------------------------------------------
     Elements matching these selectors fade in when they enter the viewport.
     Siblings are staggered by 0.12s so a row of cards appears one by one. */
  var REVEAL_SELECTORS = [
    ".hero .wrap > div",
    "section > .wrap > .eyebrow",
    "section > .wrap > h2",
    "section > .wrap > p",
    ".svc a",
    ".work",
    ".post",
    ".cta",
    ".about .wrap > div > *",
  ].join(",");

  var observer =
    "IntersectionObserver" in window
      ? new IntersectionObserver(onIntersect, {
          threshold: 0.12,
          rootMargin: "0px 0px -6% 0px",
        })
      : null;

  function onIntersect(entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      observer.unobserve(entry.target);
    });
  }

  // The "js" class lets the CSS hide elements only when scripting works.
  document.documentElement.classList.add("js");

  Array.prototype.forEach.call(
    document.querySelectorAll(REVEAL_SELECTORS),
    function (el) {
      var position = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.classList.add("rv");
      el.style.setProperty("--d", (position % 3) * 0.12 + "s");
      if (observer) observer.observe(el);
      else el.classList.add("in");
    },
  );

  /* 2. SCROLL PROGRESS BAR ------------------------------------------------
     Scales the #prog bar from 0 to 1 as the page is scrolled. */
  var progressBar = document.getElementById("prog");
  var ticking = false;

  function updateProgress() {
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    progressBar.style.transform = "scaleX(" + ratio + ")";
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateProgress);
    },
    { passive: true },
  );
  updateProgress();

  /* 3. SIDE MENU ----------------------------------------------------------
     The round button slides a white panel in from the right and turns into an X.
     It closes with the X, the Escape key, a click outside the panel or a click on a link. */
  var menuButton = document.getElementById("menu");
  var nav = document.getElementById("nav");
  var root = document.documentElement;

  function setMenu(open) {
    nav.classList.toggle("open", open);
    root.classList.toggle("menu-open", open);
    nav.setAttribute("aria-hidden", open ? "false" : "true");
    menuButton.setAttribute("aria-expanded", open);
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  menuButton.addEventListener("click", function () {
    setMenu(!nav.classList.contains("open"));
  });

  nav.addEventListener("click", function (event) {
    if (event.target.closest && event.target.closest("a")) setMenu(false);
  });

  document.addEventListener("click", function (event) {
    if (!nav.classList.contains("open")) return;
    if (nav.contains(event.target) || menuButton.contains(event.target)) return;
    setMenu(false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && nav.classList.contains("open")) {
      setMenu(false);
      menuButton.focus();
    }
  });

  /* 4. PROJECT SLIDER -----------------------------------------------------
     Drag or swipe the cards, or use the arrows, dots and arrow keys.
     Three cards show at once, starting flush at the left edge. */
  (function () {
    var root = document.querySelector(".work");
    if (!root) return;

    var track = root.querySelector(".work-track");
    var slides = Array.prototype.slice.call(track.children);
    var prev = document.querySelector(".work-arrows .prev");
    var next = document.querySelector(".work-arrows .next");
    var dotsBox = document.querySelector(".work-dots");
    var cursor = root.querySelector(".work-cursor");
    var fine =
      window.matchMedia &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    var index = 0,
      maxIndex = 0,
      offset = 0,
      startX = 0,
      dx = 0,
      down = false,
      moved = false;

    var dots = slides.map(function (_, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", "Project " + (i + 1));
      b.addEventListener("click", function () {
        go(i);
      });
      dotsBox.appendChild(b);
      return b;
    });

    /* The first visible card sits flush with the left edge; the track stops
       when the last card reaches the right edge, so no empty space shows. */
    function minOffset() {
      var last = slides[slides.length - 1];
      return Math.min(0, root.clientWidth - (last.offsetLeft + last.offsetWidth));
    }

    function offsetFor(i) {
      return Math.max(minOffset(), -slides[i].offsetLeft);
    }

    function render() {
      var min = minOffset();
      maxIndex = slides.length - 1;
      for (var k = 0; k < slides.length; k++) {
        if (-slides[k].offsetLeft <= min) {
          maxIndex = k;
          break;
        }
      }
      index = Math.min(index, maxIndex);
      offset = offsetFor(index);
      track.style.transform = "translate3d(" + offset + "px,0,0)";
      slides.forEach(function (s, i) {
        s.classList.toggle("active", i === index);
        if (i === index) s.setAttribute("aria-current", "true");
        else s.removeAttribute("aria-current");
      });
      dots.forEach(function (d, i) {
        d.hidden = i > maxIndex;
        d.setAttribute("aria-selected", i === index ? "true" : "false");
      });
      if (prev) prev.disabled = index === 0;
      if (next) next.disabled = index === maxIndex;
    }

    function go(i) {
      index = Math.max(0, Math.min(maxIndex, i));
      render();
    }

    function onMove(e) {
      if (!down) return;
      dx = e.clientX - startX;
      if (Math.abs(dx) > 5) {
        moved = true;
        root.classList.add("is-dragging");
      }
      var d = dx;
      if ((index === 0 && d > 0) || (index === maxIndex && d < 0))
        d *= 0.35; // edge resistance
      track.style.transform = "translate3d(" + (offset + d) + "px,0,0)";
    }

    function onUp() {
      if (!down) return;
      down = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      track.classList.remove("dragging");
      root.classList.remove("is-dragging");
      var limit = Math.min(120, slides[index].offsetWidth * 0.18);
      if (dx < -limit) go(index + 1);
      else if (dx > limit) go(index - 1);
      else render();
    }

    root.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      down = true;
      moved = false;
      dx = 0;
      startX = e.clientX;
      track.classList.add("dragging");
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    });

    // A drag must not count as a click on the link.
    root.addEventListener(
      "click",
      function (e) {
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
          moved = false;
          return;
        }
      },
      true,
    );

    track.addEventListener("dragstart", function (e) {
      e.preventDefault();
    });

    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(index - 1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(index + 1);
      }
    });

    if (prev)
      prev.addEventListener("click", function () {
        go(index - 1);
      });
    if (next)
      next.addEventListener("click", function () {
        go(index + 1);
      });

    if (fine && cursor) {
      root.addEventListener("mousemove", function (e) {
        var r = root.getBoundingClientRect();
        cursor.style.transform =
          "translate(" +
          (e.clientX - r.left) +
          "px," +
          (e.clientY - r.top) +
          "px)";
        root.classList.add("show-cursor");
      });
      root.addEventListener("mouseleave", function () {
        root.classList.remove("show-cursor");
      });
    }

    window.addEventListener("resize", render);
    window.addEventListener("load", render);
    if (document.fonts && document.fonts.ready)
      document.fonts.ready.then(render);
    render();
  })();

  /* 5. CUSTOM CURSOR ------------------------------------------------------
     A dot that follows the mouse exactly and a ring that trails behind it.
     The ring grows over links and buttons and shrinks while pressed.
     Only runs on mouse devices; the normal pointer is restored if the mouse leaves the page. */
  (function () {
    var fine =
      window.matchMedia &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;

    var root = document.documentElement;
    var dot = document.createElement("div");
    var ring = document.createElement("div");
    dot.className = "cursor-dot";
    ring.className = "cursor-ring";
    dot.setAttribute("aria-hidden", "true");
    ring.setAttribute("aria-hidden", "true");
    document.body.appendChild(ring);
    document.body.appendChild(dot);

    var calm =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var x = 0,
      y = 0,
      rx = 0,
      ry = 0,
      running = false;
    var CLICKABLE =
      'a, button, select, label, [role="tab"], [role="button"], summary';

    function frame() {
      rx += (x - rx) * (calm ? 1 : 0.18);
      ry += (y - ry) * (calm ? 1 : 0.18);
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
      if (Math.abs(x - rx) > 0.1 || Math.abs(y - ry) > 0.1) {
        requestAnimationFrame(frame);
      } else {
        running = false;
      }
    }

    document.addEventListener("mousemove", function (e) {
      if (!root.classList.contains("has-cursor")) {
        rx = e.clientX;
        ry = e.clientY;
        root.classList.add("has-cursor");
      }
      x = e.clientX;
      y = e.clientY;
      dot.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      if (!running) {
        running = true;
        requestAnimationFrame(frame);
      }

      var t = e.target;
      ring.classList.toggle("is-link", !!(t.closest && t.closest(CLICKABLE)));
      root.classList.toggle(
        "over-slider",
        !!(t.closest && t.closest(".work-track")),
      );
    });

    document.addEventListener("mouseleave", function () {
      root.classList.remove("has-cursor");
    });
    /* mailto:/tel: links open a browser popup, so the page stops getting mouse events
       and the custom cursor would stay hidden. Restore the normal pointer on click
       (and when the window loses focus); the custom cursor returns on the next mouse move. */
    function showNativeCursor() {
      root.classList.remove("has-cursor");
      ring.classList.remove("is-down");
    }
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (a && /^(mailto|tel):/i.test(a.getAttribute("href"))) showNativeCursor();
    });
    window.addEventListener("blur", showNativeCursor);
    document.addEventListener("mousedown", function () {
      ring.classList.add("is-down");
    });
    document.addEventListener("mouseup", function () {
      ring.classList.remove("is-down");
    });
  })();

  /* 6. GRID ALIGNMENT -----------------------------------------------------
     Each section draws its own grid. This sets --goy on each so every grid starts on the
     same 56px lines as the hero grid, which makes the lines continue across sections. */
  (function () {
    var hero = document.getElementById("home");
    if (!hero) return;
    var CELL = 56,
      REACH = 360; // CELL = grid size, REACH = how far a section's background extends past it
    var ids = ["about", "experience", "contact"];

    function align() {
      var top = hero.getBoundingClientRect().top;
      ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var t = el.getBoundingClientRect().top - top - REACH;
        var off = ((-t % CELL) + CELL) % CELL;
        el.style.setProperty("--goy", off + "px");
      });
    }

    align();
    window.addEventListener("load", align);
    window.addEventListener("resize", align);
    if (document.fonts && document.fonts.ready)
      document.fonts.ready.then(align);
    if (window.ResizeObserver) new ResizeObserver(align).observe(document.body);
  })();

  /* 7. FLOATING BACK-TO-TOP -----------------------------------------------
     The round button in the corner appears once About is reached and hides again when the
     footer comes into view. While it shows, the dark / light toggle sits above it. */
  (function () {
    var floatBtn = document.querySelector(".to-top-float");
    var about = document.getElementById("about");
    if (!floatBtn || !about) return;
    var queued = false;

    function update() {
      queued = false;
      var vh = window.innerHeight;
      var show = about.getBoundingClientRect().top <= vh * 0.5;
      floatBtn.classList.toggle("show", show);
      var themeBtn = document.getElementById("theme");
      if (themeBtn) themeBtn.classList.toggle("lifted", show);
    }

    function queue() {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    update();
  })();

  /* 8. DARK / LIGHT MODE --------------------------------------------------
     The sun / moon button in the bottom-right corner sets data-theme="light" on <html> (or removes it for
     dark) and remembers the choice in this browser. A tiny script in <head> applies the saved
     choice before the page paints, so there is no flash. */
  (function () {
    var button = document.getElementById("theme");
    if (!button) return;
    var rootEl = document.documentElement;

    function paint() {
      var light = rootEl.getAttribute("data-theme") === "light";
      button.setAttribute(
        "aria-label",
        light ? "Switch to dark mode" : "Switch to light mode",
      );
    }

    button.addEventListener("click", function () {
      var light = rootEl.getAttribute("data-theme") === "light";
      rootEl.classList.add("theme-fade");
      if (light) rootEl.removeAttribute("data-theme");
      else rootEl.setAttribute("data-theme", "light");
      try {
        localStorage.setItem("theme", light ? "dark" : "light");
      } catch (e) {
        /* ignore */
      }
      paint();
      setTimeout(function () {
        rootEl.classList.remove("theme-fade");
      }, 400);
    });

    paint();
  })();
})();
