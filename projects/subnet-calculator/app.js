// IPv4 Subnet Calculator
var ipEl = document.getElementById("ip");
var cidrEl = document.getElementById("cidr");
var slider = document.getElementById("slider");
var errEl = document.getElementById("err");

// "192.168.1.10" -> 32-bit unsigned integer, or null if invalid
function parseIp(str) {
  var parts = str.trim().split(".");
  if (parts.length !== 4) return null;
  var n = 0;
  for (var i = 0; i < 4; i++) {
    if (!/^\d{1,3}$/.test(parts[i])) return null;
    var v = Number(parts[i]);
    if (v > 255) return null;
    n = n * 256 + v;
  }
  return n;
}

function toIp(n) {
  return [24, 16, 8, 0].map(function (s) { return Math.floor(n / Math.pow(2, s)) % 256; }).join(".");
}

function maskFor(prefix) {
  return prefix === 0 ? 0 : (Math.pow(2, 32) - Math.pow(2, 32 - prefix));
}

function ipClass(firstOctet) {
  if (firstOctet < 128) return "A";
  if (firstOctet < 192) return "B";
  if (firstOctet < 224) return "C";
  if (firstOctet < 240) return "D (multicast)";
  return "E (reserved)";
}

function isPrivate(n) {
  var a = Math.floor(n / 16777216), b = Math.floor(n / 65536) % 256;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

function binaryRow(label, n, prefix) {
  var bits = n.toString(2).padStart(32, "0");
  var html = '<div class="bin-row"><span class="lbl">' + label + "</span>";
  for (var o = 0; o < 4; o++) {
    html += '<span class="octet">';
    for (var b = 0; b < 8; b++) {
      var idx = o * 8 + b;
      html += '<span class="bit ' + (idx < prefix ? "n" : "h") + '">' + bits[idx] + "</span>";
    }
    html += "</span>";
  }
  return html + "</div>";
}

function calc() {
  var ip = parseIp(ipEl.value);
  var prefix = Number(cidrEl.value);
  var prefixOk = Number.isInteger(prefix) && prefix >= 0 && prefix <= 32;

  ipEl.classList.toggle("invalid", ip === null);
  cidrEl.classList.toggle("invalid", !prefixOk);
  if (ip === null) { errEl.textContent = "Enter an IP address as four numbers from 0 to 255, like 192.168.1.10."; return; }
  if (!prefixOk) { errEl.textContent = "The prefix must be a whole number from 0 to 32."; return; }
  errEl.textContent = "";

  var mask = maskFor(prefix);
  var size = Math.pow(2, 32 - prefix);
  var network = ip - (ip % size);
  var broadcast = network + size - 1;
  var first, last, hosts;

  if (prefix === 32) { first = last = network; hosts = 1; }
  else if (prefix === 31) { first = network; last = broadcast; hosts = 2; } // point-to-point links (RFC 3021)
  else { first = network + 1; last = broadcast - 1; hosts = size - 2; }

  document.getElementById("r-net").textContent = toIp(network) + "/" + prefix;
  document.getElementById("r-bc").textContent = toIp(broadcast);
  document.getElementById("r-mask").textContent = toIp(mask);
  document.getElementById("r-wild").textContent = toIp(Math.pow(2, 32) - 1 - mask);
  document.getElementById("r-range").textContent = toIp(first) + " – " + toIp(last);
  document.getElementById("r-hosts").textContent = hosts.toLocaleString("en-PH");
  document.getElementById("r-class").textContent = ipClass(Math.floor(ip / 16777216)) + (isPrivate(ip) ? " · Private" : " · Public");

  document.getElementById("bin").innerHTML =
    binaryRow("IP", ip, prefix) + binaryRow("Mask", mask, prefix) + binaryRow("Network", network, prefix);
}

ipEl.addEventListener("input", calc);
cidrEl.addEventListener("input", function () { slider.value = cidrEl.value; calc(); });
slider.addEventListener("input", function () { cidrEl.value = slider.value; calc(); });
document.getElementById("form").addEventListener("submit", function (e) { e.preventDefault(); });
document.querySelector(".presets").addEventListener("click", function (e) {
  var b = e.target.closest("button");
  if (!b) return;
  var v = b.dataset.v.split("/");
  ipEl.value = v[0]; cidrEl.value = v[1]; slider.value = v[1];
  calc();
});

calc();
