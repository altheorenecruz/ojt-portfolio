// Theme toggle (light / dark) and active-section highlighting.
(function () {
  var root = document.documentElement;
  var toggle = document.getElementById("theme-toggle");
  var label = document.getElementById("theme-label");

  // Use the saved choice, otherwise follow the device setting.
  function currentTheme() {
    var t = root.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    var next = theme === "dark" ? "Light" : "Dark";
    label.textContent = next;
    toggle.setAttribute("aria-label", "Switch to " + next.toLowerCase() + " mode");
  }

  apply(currentTheme());

  toggle.addEventListener("click", function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    apply(next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });

  // Highlight the nav link for the section in view.
  var links = document.querySelectorAll(".topnav a");
  function update() {
    var y = window.scrollY + 120;
    links.forEach(function (link) {
      var s = document.querySelector(link.getAttribute("href"));
      var active = s && s.offsetTop <= y && s.offsetTop + s.offsetHeight > y;
      link.classList.toggle("active", !!active);
    });
  }
  window.addEventListener("scroll", update, { passive: true });
  update();
})();
