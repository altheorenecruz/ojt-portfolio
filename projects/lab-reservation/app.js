// CIT Computer Lab Reservation
var LABS = ["CompLab 1", "CompLab 2", "Network Lab"];
var DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
var TIMES = ["7:30–9:00", "9:00–10:30", "10:30–12:00", "1:00–2:30", "2:30–4:00", "4:00–5:30"];

// Fixed class schedules per lab: "day-time" -> class name
var CLASSES = {
  "CompLab 1": { "0-0": "BIT-CT 3A", "0-1": "BIT-CT 3A", "2-3": "IIDD 2", "2-4": "IIDD 2", "4-0": "BIT-CT 4B" },
  "CompLab 2": { "1-1": "Programming 2", "1-2": "Programming 2", "3-0": "BIT-CT 2C", "3-3": "Database Lab" },
  "Network Lab": { "0-3": "Networking 1", "0-4": "Networking 1", "2-0": "CCNA Lab", "4-2": "CCNA Lab" }
};

var KEY = "cit-lab-reservations";
var reservations = load(); // "lab|day-time" -> { name, purpose, mine }
var lab = LABS[0];
var selected = null;
var detailKey = null; // slot shown in the detail panel

function load() {
  try {
    var saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && typeof saved === "object") return saved;
  } catch (e) { /* storage unavailable */ }
  // Sample bookings from other users so the grid shows how it works.
  return {
    "CompLab 1|1-3": { name: "M. Santos", purpose: "Thesis / capstone work" },
    "CompLab 1|3-1": { name: "BIT-CT Org", purpose: "Org meeting" },
    "CompLab 2|0-4": { name: "J. Reyes", purpose: "Group study" },
    "Network Lab|1-0": { name: "K. Lim", purpose: "Make-up laboratory" }
  };
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(reservations)); } catch (e) { /* ignore */ }
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function renderLabs() {
  document.getElementById("labs").innerHTML = LABS.map(function (l) {
    return '<button type="button" role="tab" aria-selected="' + (l === lab) + '" data-lab="' + l + '">' + l + "</button>";
  }).join("");
}

function renderGrid() {
  var html = '<div class="h">Time</div>' + DAYS.map(function (d) { return '<div class="h">' + d + "</div>"; }).join("");
  TIMES.forEach(function (time, t) {
    html += '<div class="t">' + time + "</div>";
    DAYS.forEach(function (day, d) {
      var key = d + "-" + t;
      var cls = CLASSES[lab][key];
      var res = reservations[lab + "|" + key];
      if (cls) {
        html += '<div class="slot class"><strong>' + cls + "</strong>Class</div>";
      } else if (res) {
        html += '<button type="button" class="slot ' + (res.mine ? "mine" : "res") + '" data-key="' + key + '"><strong>' +
          esc(res.name) + "</strong>" + esc(res.purpose) + "</button>";
      } else {
        html += '<button type="button" class="slot' + (selected === key ? " selected" : "") + '" data-key="' + key + '" aria-label="Reserve ' + day + " " + time + '">Open</button>';
      }
    });
  });
  document.getElementById("grid").innerHTML = html;
}

function slotLabel(key) {
  var p = key.split("-");
  return lab + " · " + DAYS[p[0]] + " " + TIMES[p[1]];
}

function showPanel(mode, key) {
  var form = document.getElementById("form");
  var detail = document.getElementById("detail");
  var hint = document.getElementById("hint");
  form.hidden = detail.hidden = hint.hidden = true;

  if (mode === "form") {
    document.getElementById("slot-title").textContent = "Reserve " + slotLabel(key);
    form.hidden = false;
    document.getElementById("f-name").focus();
  } else if (mode === "detail") {
    detailKey = key;
    var r = reservations[lab + "|" + key];
    detail.innerHTML = "<h2>" + slotLabel(key) + "</h2><p>Reserved by " + esc(r.name) + " for " + esc(r.purpose) + ".</p>" +
      (r.mine ? '<button type="button" class="btn danger" id="cancel-res">Cancel my reservation</button>'
              : "<p>This slot is taken. Choose another open slot.</p>");
    detail.hidden = false;
  } else if (mode === "done") {
    detail.innerHTML = '<p class="ok">' + key + "</p>";
    detail.hidden = false;
  } else {
    hint.hidden = false;
  }
}

document.getElementById("labs").addEventListener("click", function (e) {
  var b = e.target.closest("button");
  if (!b) return;
  lab = b.dataset.lab; selected = null;
  renderLabs(); renderGrid(); showPanel("hint");
});

document.getElementById("grid").addEventListener("click", function (e) {
  var b = e.target.closest("button.slot");
  if (!b) return;
  var key = b.dataset.key;
  if (reservations[lab + "|" + key]) { selected = null; renderGrid(); showPanel("detail", key); return; }
  selected = key; renderGrid(); showPanel("form", key);
});

document.getElementById("form").addEventListener("submit", function (e) {
  e.preventDefault();
  var id = lab + "|" + selected;
  if (reservations[id] || CLASSES[lab][selected]) { showPanel("done", "That slot was just taken. Pick another one."); return; }
  reservations[id] = {
    name: document.getElementById("f-name").value.trim(),
    purpose: document.getElementById("f-purpose").value,
    mine: true
  };
  var label = slotLabel(selected);
  save(); selected = null;
  document.getElementById("form").reset();
  renderGrid(); showPanel("done", "Reserved " + label + ".");
});

document.getElementById("close").addEventListener("click", function () {
  selected = null; renderGrid(); showPanel("hint");
});

document.getElementById("detail").addEventListener("click", function (e) {
  if (e.target.id !== "cancel-res") return;
  delete reservations[lab + "|" + detailKey];
  detailKey = null;
  save(); renderGrid(); showPanel("done", "Reservation cancelled.");
});

renderLabs(); renderGrid();
