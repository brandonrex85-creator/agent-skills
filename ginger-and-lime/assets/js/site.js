/* Ginger & Lime — small, dependency-free site behaviour.
   Everything here is progressive: with JS off the site still reads fine. */
(function () {
  "use strict";

  /* ---- Mobile navigation ------------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a") && window.innerWidth <= 860) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---- Photo placeholders ------------------------------------------
     Until the real food photos are dropped into assets/img/, any missing
     file shows a labelled placeholder instead of a broken-image icon. */
  function flagMissing(img) {
    var frame = img.closest(".frame");
    if (frame) { frame.classList.add("is-missing"); }
  }
  Array.prototype.forEach.call(document.querySelectorAll(".frame img"), function (img) {
    if (img.complete && img.naturalWidth === 0) { flagMissing(img); }
    img.addEventListener("error", function () { flagMissing(img); });
  });

  /* ---- Open / closed indicator --------------------------------------
     Hours are the same every day: 10:30 AM – 7:00 PM, restaurant local
     time (America/New_York), so the badge is correct for out-of-state
     visitors too. */
  var OPEN_MINUTES = 10 * 60 + 30;
  var CLOSE_MINUTES = 19 * 60;

  function restaurantMinutes() {
    try {
      var parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "numeric",
        hour12: false
      }).formatToParts(new Date());
      var hour = 0, minute = 0;
      parts.forEach(function (part) {
        if (part.type === "hour") { hour = parseInt(part.value, 10) % 24; }
        if (part.type === "minute") { minute = parseInt(part.value, 10); }
      });
      return hour * 60 + minute;
    } catch (error) {
      var now = new Date();
      return now.getHours() * 60 + now.getMinutes();
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-open-status]"), function (el) {
    var minutes = restaurantMinutes();
    var isOpen = minutes >= OPEN_MINUTES && minutes < CLOSE_MINUTES;
    el.textContent = isOpen ? "Open now until 7:00 PM" : "Opens daily at 10:30 AM";
    el.hidden = false;
  });

  /* ---- Footer year --------------------------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-year]"), function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---- Gallery lightbox ---------------------------------------------- */
  var lightbox = document.querySelector(".lightbox");
  if (lightbox) {
    var items = Array.prototype.slice.call(document.querySelectorAll(".gallery__item"));
    var lightboxImg = lightbox.querySelector("img");
    var lightboxCaption = lightbox.querySelector("figcaption");
    var lastFocused = null;
    var index = 0;

    function show(next) {
      if (!items.length) { return; }
      index = (next + items.length) % items.length;
      var source = items[index].querySelector("img");
      lightboxImg.src = source.getAttribute("src");
      lightboxImg.alt = source.getAttribute("alt") || "";
      lightboxCaption.textContent = items[index].getAttribute("data-caption") || source.getAttribute("alt") || "";
    }

    function open(start) {
      lastFocused = document.activeElement;
      show(start);
      lightbox.classList.add("is-open");
      document.body.classList.add("is-locked");
      lightbox.querySelector(".lightbox__close").focus();
    }

    function close() {
      lightbox.classList.remove("is-open");
      document.body.classList.remove("is-locked");
      if (lastFocused) { lastFocused.focus(); }
    }

    items.forEach(function (item, position) {
      item.addEventListener("click", function () {
        /* A photo that never loaded has nothing worth enlarging. */
        if (item.querySelector(".frame").classList.contains("is-missing")) { return; }
        open(position);
      });
    });

    lightbox.addEventListener("click", function (event) {
      var action = event.target.closest("[data-lightbox]");
      if (action) {
        var kind = action.getAttribute("data-lightbox");
        if (kind === "close") { close(); }
        if (kind === "prev") { show(index - 1); }
        if (kind === "next") { show(index + 1); }
        return;
      }
      if (event.target === lightbox) { close(); }
    });

    document.addEventListener("keydown", function (event) {
      if (!lightbox.classList.contains("is-open")) { return; }
      if (event.key === "Escape") { close(); }
      if (event.key === "ArrowLeft") { show(index - 1); }
      if (event.key === "ArrowRight") { show(index + 1); }
    });
  }
})();
