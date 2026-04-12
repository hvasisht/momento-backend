const fs = require("fs");
const path = require("path");
const vm = require("vm");
const https = require("https");

const projectRoot = path.resolve(__dirname, "..");
const babelPath = path.join(projectRoot, "vendor", "babel.min.js");
const outputPath = path.join(projectRoot, "src", "app.compiled.js");
const bundledBooksPath = path.join(projectRoot, "src", "books.bundled.js");
const catalogPath     = path.join(projectRoot, "src", "books.catalog.js");
const coversPath      = path.join(projectRoot, "src", "books.covers.js");

const sourceFiles = [
  "src/api.js",
  "src/core/globals.js",
  "src/data/library.js",
  "src/shared/book-art.jsx",
  "src/features/read/data.js",
  "src/features/read/gutenberg.js",
  "src/features/read/ReadPanel.jsx",
  "src/features/moments/data.js",
  "src/features/moments/MomentCard.jsx",
  "src/features/moments/BookBrowse.jsx",
  "src/features/moments/MomentsPanel.jsx",
  "src/features/worth/MatchBar.jsx",
  "src/features/worth/charting.jsx",
  "src/features/worth/data.js",
  "src/features/worth/whispers.jsx",
  "src/features/worth/presentation.jsx",
  "src/features/worth/WorthPanel.jsx",
  "src/features/sharing/SharingPanel.jsx",
  "src/shared/BottomTab.jsx",
  "src/shared/HeroTaglineAnchor.jsx",
  "src/shared/CreateAccountOverlay.jsx",
  "src/shared/EmailVerificationOverlay.jsx",
  "src/shared/GoogleCompleteProfileOverlay.jsx",
  "src/shared/SignInOverlay.jsx",
  "src/shared/ConsentScreen.jsx",
  "src/shared/ReaderOnboardingOverlay.jsx",
  "src/shared/IntroOverlay.jsx",
  "src/main/TopChrome.jsx",
  "src/main/ProfileDrawer.jsx",
  "src/main/CubeHint.jsx",
  "src/main/MomentApp.jsx",
];

/* ── Books to pre-bundle at build time ── */
var BOOKS_TO_BUNDLE = [
  { gutId: "84",    title: "Frankenstein",                   author: "Mary Shelley",        textUrl: "https://www.gutenberg.org/files/84/84-0.txt",    coverUrl: "https://covers.openlibrary.org/b/isbn/9780486282114-L.jpg" },
  { gutId: "1342",  title: "Pride and Prejudice",            author: "Jane Austen",         textUrl: "https://www.gutenberg.org/files/1342/1342-0.txt", coverUrl: "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg" },
  { gutId: "64317", title: "The Great Gatsby",               author: "F. Scott Fitzgerald", textUrl: "https://www.gutenberg.org/files/64317/64317-0.txt",coverUrl: "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg" },
  { gutId: "1260",  title: "Jane Eyre",                      author: "Charlotte Brontë",    textUrl: "https://www.gutenberg.org/files/1260/1260-0.txt", coverUrl: "https://covers.openlibrary.org/b/isbn/9780141441146-L.jpg" },
  { gutId: "48320", title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle", textUrl: "https://www.gutenberg.org/files/48320/48320-0.txt", coverUrl: "https://covers.openlibrary.org/b/isbn/9780140439076-L.jpg" },
];

function fetchTextFromUrl(url) {
  return new Promise(function (resolve, reject) {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, function (res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchTextFromUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error("HTTP " + res.statusCode + " for " + url));
      res.setEncoding("utf8");
      var data = "";
      res.on("data", function (chunk) { data += chunk; });
      res.on("end", function () { resolve(data); });
    }).on("error", reject);
  });
}

function fetchBinaryFromUrl(url) {
  return new Promise(function(resolve, reject) {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, function(res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBinaryFromUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error("HTTP " + res.statusCode + " for " + url));
      var chunks = [];
      res.on("data", function(chunk) { chunks.push(chunk); });
      res.on("end", function() { resolve(Buffer.concat(chunks)); });
    }).on("error", reject);
  });
}

function bundleCovers() {
  var promises = BOOKS_TO_BUNDLE.map(function(book) {
    if (!book.coverUrl) return Promise.resolve(null);
    return fetchBinaryFromUrl(book.coverUrl).then(function(buf) {
      var mime = book.coverUrl.endsWith(".png") ? "image/png" : "image/jpeg";
      var dataUrl = "data:" + mime + ";base64," + buf.toString("base64");
      console.log("  Cover: " + book.title + " (" + Math.round(buf.length / 1024) + " KB)");
      return { gutId: book.gutId, dataUrl: dataUrl };
    }).catch(function(err) {
      console.warn("  WARNING: Could not fetch cover for " + book.title + ": " + err.message);
      return null;
    });
  });
  return Promise.all(promises).then(function(results) {
    var obj = {};
    results.forEach(function(r) { if (r) obj[r.gutId] = r.dataUrl; });
    return obj;
  });
}

function parseTextAtBuildTime(raw, gutId, title, author) {
  var parasPerPage = 20;
  var startRx = /\*{3}\s*START OF (THE|THIS) PROJECT GUTENBERG[^*]*\*{3}/i;
  var endRx   = /\*{3}\s*END OF (THE|THIS) PROJECT GUTENBERG[^*]*\*{3}/i;
  var sm = raw.match(startRx), em = raw.match(endRx);
  var body = sm ? raw.slice(raw.indexOf(sm[0]) + sm[0].length) : raw;
  if (em) body = body.slice(0, body.indexOf(em[0]));

  var chRx = /\n[ \t]*(CHAPTER|Chapter|LETTER|Letter|PART|Part)\s+([IVXLCDM\d]+)[^\n]*/g;
  var matches = [], m;
  while ((m = chRx.exec(body)) !== null) matches.push({ index: m.index, text: m[0] });

  var rawChapters = matches.length >= 2
    ? matches.map(function (mc, idx) {
        var end = idx + 1 < matches.length ? matches[idx + 1].index : body.length;
        return { heading: mc.text.trim(), body: body.slice(mc.index + mc.text.length, end) };
      })
    : [{ heading: title, body: body }];

  var pages = [];
  var limit = Math.min(rawChapters.length, 80);
  for (var ci = 0; ci < limit; ci++) {
    var ch = rawChapters[ci];
    var paras = ch.body.split(/\n\n+/).map(function (p) {
      return p.replace(/[ \t]+/g, " ").replace(/\n/g, " ").trim();
    }).filter(function (p) { return p.length > 60 && !/^\*{3,}$/.test(p); });
    if (!paras.length) continue;
    var totalParts = Math.ceil(paras.length / parasPerPage);
    for (var i = 0; i < paras.length; i += parasPerPage) {
      var pn    = Math.floor(i / parasPerPage) + 1;
      var label = totalParts === 1 ? ch.heading : ch.heading + " (" + pn + "/" + totalParts + ")";
      pages.push({ chapter: label, text: paras.slice(i, i + parasPerPage).join("\n\n") });
    }
  }
  return { id: "gut_" + gutId, title: title, author: author, year: "", pages: pages };
}

function bundleBooks() {
  var promises = BOOKS_TO_BUNDLE.map(function (book) {
    return fetchTextFromUrl(book.textUrl).then(function (raw) {
      var parsed = parseTextAtBuildTime(raw, book.gutId, book.title, book.author);
      console.log("  Bundled: " + book.title + " (" + parsed.pages.length + " pages)");
      return { gutId: book.gutId, data: parsed };
    }).catch(function (err) {
      console.warn("  WARNING: Could not fetch " + book.title + ": " + err.message);
      return null;
    });
  });
  return Promise.all(promises).then(function (results) {
    var obj = {};
    results.forEach(function (r) { if (r) obj[r.gutId] = r.data; });
    return obj;
  });
}

/* ── Fetch Gutenberg catalog (top 500 by popularity) ── */
function fetchJsonUrl(url) {
  return new Promise(function(resolve, reject) {
    try {
      var req = https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, function(res) {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          var loc = res.headers.location;
          if (!loc.startsWith("http")) loc = "https://gutendex.com" + loc;
          return fetchJsonUrl(loc).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) return reject(new Error("HTTP " + res.statusCode + " for " + url));
        res.setEncoding("utf8");
        var data = "";
        res.on("data", function(c) { data += c; });
        res.on("end", function() { try { resolve(JSON.parse(data)); } catch(e) { reject(new Error("JSON parse failed: " + e.message)); } });
      });
      req.on("error", function(e) { reject(new Error("Request error for " + url + ": " + e.message)); });
    } catch(e) {
      reject(new Error("fetchJsonUrl threw for URL [" + url + "]: " + e.message));
    }
  });
}

function normalizeCatalogItem(item) {
  var fmt = item.formats || {};
  var epubUrl = fmt["application/epub+zip"] || null;
  var textUrl = fmt["text/plain; charset=utf-8"] || fmt["text/plain"] || null;
  var cover   = fmt["image/jpeg"] || fmt["image/png"] || null;
  var author  = "Unknown";
  if (item.authors && item.authors.length) {
    author = item.authors.map(function(a) {
      var parts = a.name.split(",").map(function(s) { return s.trim(); });
      return parts.length > 1 ? parts.slice(1).join(" ") + " " + parts[0] : parts[0];
    }).join(", ");
  }
  return { gutId: String(item.id), title: item.title || "Untitled", author: author, cover: cover, epubUrl: epubUrl, textUrl: textUrl };
}

function fetchJsonUrlWithRetry(url, retries) {
  retries = retries || 5;
  return fetchJsonUrl(url).catch(function(err) {
    if (retries <= 0) return Promise.reject(err);
    var delay = (6 - retries) * 2000;
    process.stdout.write("\n  Retrying in " + (delay/1000) + "s (" + retries + " left)...");
    return new Promise(function(res) { setTimeout(res, delay); }).then(function() {
      return fetchJsonUrlWithRetry(url, retries - 1);
    });
  });
}

function fetchGutenbergCatalog(target) {
  var books = [];
  function fetchPage(url) {
    if (!url || books.length >= target) return Promise.resolve(books.slice(0, target));
    return fetchJsonUrlWithRetry(url).then(function(data) {
      (data.results || []).forEach(function(item) {
        if (books.length < target) books.push(normalizeCatalogItem(item));
      });
      process.stdout.write("\r  Catalog: " + books.length + "/" + target + " books fetched...");
      var next = data.next || null;
      if (next && !next.startsWith("http")) next = "https://gutendex.com" + next;
      return fetchPage(books.length < target ? next : null);
    });
  }
  return fetchPage("https://gutendex.com/books?sort=popular&languages=en");
}

function loadBabel() {
  const babelCode = fs.readFileSync(babelPath, "utf8");
  const ctx = { window: {}, self: {}, globalThis: {} };
  ctx.window = ctx;
  ctx.self = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(babelCode, ctx);
  return ctx.Babel;
}

function buildSource() {
  return sourceFiles
    .map((relativePath) => {
      const absolutePath = path.join(projectRoot, relativePath);
      const content = fs.readFileSync(absolutePath, "utf8");
      return `\n/* FILE: ${relativePath} */\n${content}\n`;
    })
    .join("\n");
}

function compileOnly() {
  const Babel = loadBabel();
  const source = buildSource();
  const compiled = Babel.transform(source, { presets: ["react"] }).code;
  fs.writeFileSync(outputPath, compiled, "utf8");
  console.log("Built " + path.relative(projectRoot, outputPath) + " from " + sourceFiles.length + " source files.");
}

function main() {
  const force = process.argv.includes("--force");
  const hasBundled = fs.existsSync(bundledBooksPath);
  const hasCatalog = fs.existsSync(catalogPath);
  const hasCovers  = fs.existsSync(coversPath);

  if (!force && hasBundled && hasCatalog && hasCovers) {
    console.log("Books, covers and catalog already exist — skipping fetch (use --force to re-fetch).");
    compileOnly();
    return;
  }

  const Babel = loadBabel();
  console.log("Fetching books to bundle (requires internet)...");
  bundleBooks().then(function(bundled) {
    var count = Object.keys(bundled).length;
    console.log("Bundled " + count + "/" + BOOKS_TO_BUNDLE.length + " books.");
    var bundledJs = "/* Auto-generated by build-v64.js — do not edit */\nvar PREBUNDLED_BOOKS = " + JSON.stringify(bundled) + ";\n";
    fs.writeFileSync(bundledBooksPath, bundledJs, "utf8");
    var bundledKB = Math.round(fs.statSync(bundledBooksPath).size / 1024);
    console.log("Wrote src/books.bundled.js (" + bundledKB + " KB)");

    console.log("Fetching book covers...");
    return bundleCovers().then(function(covers) {
      var coversJs = "/* Auto-generated by build-v64.js — do not edit */\nvar BOOK_COVERS = " + JSON.stringify(covers) + ";\n";
      fs.writeFileSync(coversPath, coversJs, "utf8");
      var coversKB = Math.round(fs.statSync(coversPath).size / 1024);
      console.log("Wrote src/books.covers.js (" + coversKB + " KB)");

      console.log("Fetching Gutenberg catalog for search...");
      return fetchGutenbergCatalog(1000).then(function(catalog) {
        console.log("\n  Fetched " + catalog.length + " catalog entries.");
        var catalogJs = "/* Auto-generated by build-v64.js — do not edit */\nvar GUTENBERG_CATALOG = " + JSON.stringify(catalog) + ";\n";
        fs.writeFileSync(catalogPath, catalogJs, "utf8");
        var catalogKB = Math.round(fs.statSync(catalogPath).size / 1024);
        console.log("Wrote src/books.catalog.js (" + catalogKB + " KB)");

        const source = buildSource();
        const compiled = Babel.transform(source, { presets: ["react"] }).code;
        fs.writeFileSync(outputPath, compiled, "utf8");
        console.log("Built " + path.relative(projectRoot, outputPath) + " from " + sourceFiles.length + " source files.");
      });
    });
  }).catch(function(err) {
    console.error("Build failed:", err.message);
    process.exit(1);
  });
}

main();
