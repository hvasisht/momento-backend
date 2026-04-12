/* ── GUTENBERG + EPUB ── */

var GUTENDEX_BASE = 'https://gutendex.com/books';

/* Try each proxy in order — don't encode URL (corsproxy.io needs raw URL) */
var CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://api.codetabs.com/v1/proxy?quest=',
];

/* Fixed shelf – covers use bundled data URIs when available, fall back to remote URL */
function _shelfCover(gutId, fallback) {
  try { if (typeof BOOK_COVERS !== 'undefined' && BOOK_COVERS[gutId]) return BOOK_COVERS[gutId]; } catch(e) {}
  return fallback;
}

var FIXED_SHELF = [
  {
    gutId: '84',
    title: 'Frankenstein',
    author: 'Mary Shelley',
    get cover() { return _shelfCover('84', 'https://covers.openlibrary.org/b/isbn/9780486282114-L.jpg'); },
    localEpubPath: './vendor/books/pg84.epub',
    epubUrl: 'https://www.gutenberg.org/ebooks/84.epub.noimages',
    textUrl: 'https://www.gutenberg.org/files/84/84-0.txt',
  },
  {
    gutId: '1342',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    get cover() { return _shelfCover('1342', 'https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg'); },
    localEpubPath: './vendor/books/pg1342.epub',
    epubUrl: 'https://www.gutenberg.org/ebooks/1342.epub.noimages',
    textUrl: 'https://www.gutenberg.org/files/1342/1342-0.txt',
  },
  {
    gutId: '64317',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    get cover() { return _shelfCover('64317', 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg'); },
    localEpubPath: './vendor/books/pg64317.epub',
    epubUrl: 'https://www.gutenberg.org/ebooks/64317.epub.noimages',
    textUrl: 'https://www.gutenberg.org/files/64317/64317-0.txt',
  },
  {
    gutId: '1260',
    title: 'Jane Eyre',
    author: 'Charlotte Brontë',
    get cover() { return _shelfCover('1260', 'https://covers.openlibrary.org/b/isbn/9780141441146-L.jpg'); },
    localEpubPath: './vendor/books/pg1260.epub',
    epubUrl: 'https://www.gutenberg.org/ebooks/1260.epub.noimages',
    textUrl: 'https://www.gutenberg.org/files/1260/1260-0.txt',
  },
  {
    gutId: '48320',
    title: 'The Adventures of Sherlock Holmes',
    author: 'Arthur Conan Doyle',
    get cover() { return _shelfCover('48320', 'https://covers.openlibrary.org/b/isbn/9780140439076-L.jpg'); },
    localEpubPath: './vendor/books/pg48320.epub',
    epubUrl: 'https://www.gutenberg.org/ebooks/48320.epub.noimages',
    textUrl: 'https://www.gutenberg.org/files/48320/48320-0.txt',
  },
];

/* In-memory cache: gutId → MomentoBook | 'loading' | 'error' */
var EPUB_CACHE = {};

/* ── Fetch via proxy (tries each in order, raw URL) ── */
function fetchViaProxy(url, asBinary) {
  function tryProxy(i) {
    if (i >= CORS_PROXIES.length) return Promise.reject(new Error('All proxies failed for: ' + url));
    var proxyUrl = CORS_PROXIES[i] + url;
    return fetch(proxyUrl).then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return asBinary ? res.arrayBuffer() : res.text();
    }).then(function(data) {
      var size = asBinary ? data.byteLength : data.length;
      if (size < 2000) throw new Error('Response too small (' + size + ')');
      return data;
    }).catch(function() {
      return tryProxy(i + 1);
    });
  }
  return tryProxy(0);
}

/* ── EPUB buffer parser (Promise-chain, no async/await) ── */
function parseEpubBuffer(buf, bookTitle, bookAuthor, parasPerPage) {
  parasPerPage = parasPerPage || 20;
  var px = new DOMParser();

  return JSZip.loadAsync(buf).then(function(zip) {
    var containerFile = zip.file('META-INF/container.xml');
    if (!containerFile) throw new Error('Not a valid EPUB');

    return containerFile.async('string').then(function(cxml) {
      var cDoc = px.parseFromString(cxml, 'application/xml');
      var rootfile = cDoc.querySelector('rootfile');
      if (!rootfile) throw new Error('No rootfile');
      var opfPath = rootfile.getAttribute('full-path');
      var opfDir  = opfPath.includes('/') ? opfPath.split('/').slice(0, -1).join('/') : '';
      var opfFile = zip.file(opfPath);
      if (!opfFile) throw new Error('OPF not found');

      return opfFile.async('string').then(function(opfXml) {
        var oDoc = px.parseFromString(opfXml, 'application/xml');

        var manifest = {};
        var items = oDoc.querySelectorAll('item');
        for (var i = 0; i < items.length; i++) {
          manifest[items[i].getAttribute('id')] = items[i].getAttribute('href');
        }
        var itemrefs = oDoc.querySelectorAll('itemref');
        var spineIds = [];
        for (var j = 0; j < itemrefs.length; j++) {
          spineIds.push(itemrefs[j].getAttribute('idref'));
        }

        function getMeta(sel) {
          try { var el = oDoc.querySelector(sel); if (el && el.textContent.trim()) return el.textContent.trim(); } catch(e) {}
          return null;
        }
        var title  = bookTitle || getMeta('dc\\:title')   || getMeta('title')   || 'Unknown';
        var author = getMeta('dc\\:creator') || getMeta('creator') || bookAuthor || 'Unknown';
        var pages  = [];

        function processSpine(idx) {
          if (idx >= spineIds.length) {
            return Promise.resolve({ id: 'epub_' + Date.now(), title: title, author: author, year: '', pages: pages });
          }
          var href  = manifest[spineIds[idx]];
          if (!href) return processSpine(idx + 1);
          var full  = opfDir ? opfDir + '/' + href : href;
          var entry = zip.file(full) || zip.file(href);
          if (!entry) return processSpine(idx + 1);

          return entry.async('string').then(function(html) {
            var doc    = px.parseFromString(html, 'application/xhtml+xml');
            var hEl    = doc.querySelector('h1, h2, h3');
            var chLabel = (hEl && hEl.textContent.trim()) || ('Part ' + (pages.length + 1));

            /* Check the page has real content */
            var pEls = doc.querySelectorAll('p');
            var hasContent = false;
            for (var k = 0; k < pEls.length; k++) {
              if (pEls[k].textContent.trim().length > 40) { hasContent = true; break; }
            }
            if (!hasContent) return processSpine(idx + 1);

            /* Sanitize: strip scripts, styles, broken image refs */
            var toRemove = doc.querySelectorAll('script,style,link,meta,img');
            for (var r = 0; r < toRemove.length; r++) {
              if (toRemove[r].parentNode) toRemove[r].parentNode.removeChild(toRemove[r]);
            }
            /* Strip href/src/onclick attributes to neutralise any remaining links */
            var allEls = doc.querySelectorAll('[onclick],[onload],[onerror]');
            for (var a = 0; a < allEls.length; a++) {
              allEls[a].removeAttribute('onclick');
              allEls[a].removeAttribute('onload');
              allEls[a].removeAttribute('onerror');
            }

            var bodyEl = doc.querySelector('body') || doc.documentElement;
            pages.push({ chapter: chLabel, html: bodyEl.innerHTML });
            return processSpine(idx + 1);
          }).catch(function() { return processSpine(idx + 1); });
        }
        return processSpine(0);
      });
    });
  });
}

/* ── Plain text parser (fallback) ── */
function parseGutenbergText(raw, gutId, title, author, parasPerPage) {
  parasPerPage = parasPerPage || 20;
  var startRx = /\*{3}\s*START OF (THE|THIS) PROJECT GUTENBERG[^*]*\*{3}/i;
  var endRx   = /\*{3}\s*END OF (THE|THIS) PROJECT GUTENBERG[^*]*\*{3}/i;
  var sm = raw.match(startRx), em = raw.match(endRx);
  var body = sm ? raw.slice(raw.indexOf(sm[0]) + sm[0].length) : raw;
  if (em) body = body.slice(0, body.indexOf(em[0]));

  var chRx = /\n[ \t]*(CHAPTER|Chapter|LETTER|Letter|PART|Part)\s+([IVXLCDM\d]+)[^\n]*/g;
  var matches = [], m;
  while ((m = chRx.exec(body)) !== null) matches.push({ index: m.index, text: m[0] });

  var rawChapters = matches.length >= 2
    ? matches.map(function(mc, idx) {
        var end = idx + 1 < matches.length ? matches[idx + 1].index : body.length;
        return { heading: mc.text.trim(), body: body.slice(mc.index + mc.text.length, end) };
      })
    : [{ heading: title, body: body }];

  var pages = [];
  var limit = Math.min(rawChapters.length, 80);
  for (var ci = 0; ci < limit; ci++) {
    var ch = rawChapters[ci];
    var paras = ch.body.split(/\n\n+/).map(function(p) {
      return p.replace(/[ \t]+/g, ' ').replace(/\n/g, ' ').trim();
    }).filter(function(p) { return p.length > 60 && !/^\*{3,}$/.test(p); });
    if (!paras.length) continue;
    var totalParts = Math.ceil(paras.length / parasPerPage);
    for (var i = 0; i < paras.length; i += parasPerPage) {
      var pn    = Math.floor(i / parasPerPage) + 1;
      var label = totalParts === 1 ? ch.heading : ch.heading + ' (' + pn + '/' + totalParts + ')';
      pages.push({ chapter: label, text: paras.slice(i, i + parasPerPage).join('\n\n') });
    }
  }
  return { id: 'gut_' + gutId, title: title, author: author, year: '', pages: pages };
}

/* ── Load book: pre-bundled first, then EPUB, then text fallback ── */
function loadGutenbergBook(book) {
  /* Check pre-bundled data — only use if it has HTML pages (EPUB format).
     Text-format bundles fall through so the EPUB is fetched for proper layout. */
  if (typeof PREBUNDLED_BOOKS !== 'undefined' && book.gutId && PREBUNDLED_BOOKS[book.gutId]) {
    var bundled = PREBUNDLED_BOOKS[book.gutId];
    if (bundled.pages && bundled.pages.length && bundled.pages[0].html) {
      return Promise.resolve(bundled);
    }
    /* Text-format bundle — fall through to try EPUB first */
  }

  /* Check localStorage — saved after a successful EPUB or text fetch */
  if (book.gutId) {
    try {
      var stored = localStorage.getItem('momento_book_' + book.gutId);
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed && parsed.pages && parsed.pages.length) {
          return Promise.resolve(parsed);
        }
      }
    } catch(e) {}
  }

  /* Try EPUB — local file first (fixed shelf), then remote via proxy (user-added books) */
  function tryEpub() {
    function fetchAndParse(fetchPromise) {
      return fetchPromise.then(function(momentoBook) {
        if (!momentoBook.pages.length) throw new Error('EPUB produced no pages');
        if (book.gutId) {
          try { localStorage.setItem('momento_book_' + book.gutId, JSON.stringify(momentoBook)); } catch(e) {}
        }
        return momentoBook;
      });
    }

    if (book.localEpubPath) {
      /* Local file — direct fetch, no proxy needed */
      return fetchAndParse(
        fetch(book.localEpubPath).then(function(res) {
          if (!res.ok) throw new Error('Local EPUB not found');
          return res.arrayBuffer();
        }).then(function(buf) {
          return parseEpubBuffer(buf, book.title, book.author, 20);
        })
      ).catch(function() {
        /* Local file failed — fall back to remote */
        if (!book.epubUrl) return Promise.reject(new Error('no epub'));
        return fetchAndParse(
          fetchViaProxy(book.epubUrl, true).then(function(buf) {
            return parseEpubBuffer(buf, book.title, book.author, 20);
          })
        );
      });
    }

    if (!book.epubUrl) return Promise.reject(new Error('no epub'));
    return fetchAndParse(
      fetchViaProxy(book.epubUrl, true).then(function(buf) {
        return parseEpubBuffer(buf, book.title, book.author, 20);
      })
    );
  }

  /* Fallback: plain text — tries multiple URL patterns */
  function tryText() {
    var id = book.gutId || '';
    var urls = [];
    if (book.textUrl) urls.push(book.textUrl);
    if (id) {
      urls.push('https://www.gutenberg.org/files/' + id + '/' + id + '-0.txt');
      urls.push('https://www.gutenberg.org/files/' + id + '/' + id + '.txt');
      urls.push('https://www.gutenberg.org/cache/epub/' + id + '/pg' + id + '.txt');
    }
    /* Deduplicate */
    var seen = {};
    urls = urls.filter(function(u) { if (seen[u]) return false; seen[u] = true; return true; });
    if (!urls.length) return Promise.reject(new Error('no text url'));

    function tryUrl(i) {
      if (i >= urls.length) return Promise.reject(new Error('all text URLs failed'));
      return fetchViaProxy(urls[i], false).then(function(raw) {
        return parseGutenbergText(raw, book.gutId, book.title, book.author, 20);
      }).then(function(momentoBook) {
        if (!momentoBook.pages.length) throw new Error('no pages');
        return momentoBook;
      }).catch(function() { return tryUrl(i + 1); });
    }
    return tryUrl(0);
  }

  return tryEpub().catch(function() { return tryText(); });
}

/* Load EPUB from a local File object (for Harry Potter / 1984) */
function loadEpubFromFile(file) {
  return file.arrayBuffer().then(function(buf) {
    return parseEpubBuffer(buf, file.name.replace(/\.epub$/i, ''), '', 20);
  });
}

/* Pre-populate cache from pre-bundled data (sync), then fetch EPUBs in background */
function prefetchShelf() {
  FIXED_SHELF.forEach(function(book) {
    if (!book.gutId) return;
    /* Already cached with HTML pages */
    if (EPUB_CACHE[book.gutId] && EPUB_CACHE[book.gutId] !== 'error' && EPUB_CACHE[book.gutId] !== 'loading') {
      var cached = EPUB_CACHE[book.gutId];
      if (cached.pages && cached.pages.length && cached.pages[0].html) return;
    }
    /* Fetch via loadGutenbergBook — checks localStorage first (instant if already fetched),
       then EPUB, then text. This runs in the background at startup so books are ready to open. */
    EPUB_CACHE[book.gutId] = 'loading';
    loadGutenbergBook(book).then(function(momentoBook) {
      EPUB_CACHE[book.gutId] = momentoBook;
    }).catch(function() {
      EPUB_CACHE[book.gutId] = 'error';
    });
  });
}

/* ── Gutendex search (Discover / search beyond fixed shelf) ── */
function fetchGutenbergTop(count) {
  var books = [];
  function fetchPage(url) {
    if (!url || books.length >= count) return Promise.resolve(books.slice(0, count));
    return fetch(url).then(function(res) {
      if (!res.ok) throw new Error('Gutendex error: ' + res.status);
      return res.json();
    }).then(function(data) {
      for (var i = 0; i < data.results.length && books.length < count; i++) {
        books.push(normalizeGutenbergItem(data.results[i]));
      }
      return fetchPage(books.length < count ? data.next : null);
    });
  }
  return fetchPage(GUTENDEX_BASE + '?sort=popular&languages=en');
}

function normalizeGutenbergItem(item) {
  var fmt    = item.formats || {};
  var epubUrl = fmt['application/epub+zip'] || null;
  var textUrl = fmt['text/plain; charset=utf-8'] || fmt['text/plain'] || null;
  var cover   = fmt['image/jpeg'] || fmt['image/png'] || null;
  var author  = 'Unknown';
  if (item.authors && item.authors.length) {
    author = item.authors.map(function(a) { return formatAuthorName(a.name); }).join(', ');
  }
  return { gutId: String(item.id), title: item.title || 'Untitled', author: author, cover: cover, epubUrl: epubUrl, textUrl: textUrl };
}

function formatAuthorName(name) {
  if (!name) return 'Unknown';
  var parts = name.split(',').map(function(s) { return s.trim(); });
  return parts.length > 1 ? parts.slice(1).join(' ') + ' ' + parts[0] : parts[0];
}
