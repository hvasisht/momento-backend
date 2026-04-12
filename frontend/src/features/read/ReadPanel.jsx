
/* ── Drag-select snip overlay ── */
function SnipOverlay({ readingAreaRef, active, onCapture, onCancel }) {
  /* useRef for drag start — avoids stale-closure bug where handleMouseUp
     reads an outdated (null) dragStart from a previous render's closure */
  var dragRef = useRef(null);
  var _rect  = useState(null);  var drawRect   = _rect[0];  var setDrawRect   = _rect[1];
  var _error = useState(null);  var snipError  = _error[0]; var setSnipError  = _error[1];
  var _flash = useState(false); var flash      = _flash[0]; var setFlash      = _flash[1];

  useEffect(function() {
    if (!active) { dragRef.current = null; setDrawRect(null); setSnipError(null); }
  }, [active]);

  useEffect(function() {
    if (!active) return;
    var fn = function(e) { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', fn);
    return function() { window.removeEventListener('keydown', fn); };
  }, [active, onCancel]);

  function handleMouseDown(e) {
    e.preventDefault();
    var r = e.currentTarget.getBoundingClientRect();
    var p = { x: e.clientX - r.left, y: e.clientY - r.top };
    dragRef.current = p;
    setDrawRect({ start: p, current: p });
    setSnipError(null);
  }

  function handleMouseMove(e) {
    if (!dragRef.current) return;
    var r = e.currentTarget.getBoundingClientRect();
    var cur = { x: e.clientX - r.left, y: e.clientY - r.top };
    setDrawRect({ start: dragRef.current, current: cur });
  }

  function handleMouseUp(e) {
    var ds = dragRef.current;
    if (!ds) return;
    dragRef.current = null;
    setDrawRect(null);

    var or = e.currentTarget.getBoundingClientRect();
    var selRect = {
      left:   Math.min(ds.x, e.clientX - or.left),
      top:    Math.min(ds.y, e.clientY - or.top),
      right:  Math.max(ds.x, e.clientX - or.left),
      bottom: Math.max(ds.y, e.clientY - or.top),
    };

    if (selRect.right - selRect.left < 8 || selRect.bottom - selRect.top < 8) return;

    var container = readingAreaRef && readingAreaRef.current;
    var passages = container ? container.querySelectorAll('[data-passage-id]') : [];
    var overlapping = [];
    for (var i = 0; i < passages.length; i++) {
      var el = passages[i];
      var er = el.getBoundingClientRect();
      var ix = Math.min(selRect.right, er.right - or.left) - Math.max(selRect.left, er.left - or.left);
      var iy = Math.min(selRect.bottom, er.bottom - or.top) - Math.max(selRect.top, er.top - or.top);
      if (ix > 10 && iy > 10) overlapping.push(el);
    }
    if (overlapping.length === 0) return;
    if (overlapping.length > 1) {
      setSnipError('Select just one passage — try a smaller drag');
      setTimeout(function() { setSnipError(null); }, 2500);
      return;
    }
    /* Flash first, then fire onCapture so the flash is visible before overlay unmounts */
    var capturedId   = overlapping[0].getAttribute('data-passage-id');
    var capturedText = overlapping[0].textContent.trim();
    setFlash(true);
    setTimeout(function() {
      setFlash(false);
      onCapture({ passageId: capturedId, passageText: capturedText });
    }, 320);
  }

  if (!active) return null;

  var sel = drawRect ? {
    left:   Math.min(drawRect.start.x, drawRect.current.x),
    top:    Math.min(drawRect.start.y, drawRect.current.y),
    width:  Math.abs(drawRect.current.x - drawRect.start.x),
    height: Math.abs(drawRect.current.y - drawRect.start.y),
  } : null;
  var hasSel = sel && sel.width > 2 && sel.height > 2;

  return (
    <div style={{position:'absolute',inset:0,cursor:'crosshair',zIndex:10,userSelect:'none'}}
      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {!hasSel && <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.45)',pointerEvents:'none'}}/>}
      {hasSel && (
        <>
          <div style={{position:'absolute',left:0,right:0,top:0,height:sel.top,background:'rgba(0,0,0,0.5)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',left:0,right:0,top:sel.top+sel.height,bottom:0,background:'rgba(0,0,0,0.5)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',left:0,width:sel.left,top:sel.top,height:sel.height,background:'rgba(0,0,0,0.5)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',left:sel.left+sel.width,right:0,top:sel.top,height:sel.height,background:'rgba(0,0,0,0.5)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',left:sel.left,top:sel.top,width:sel.width,height:sel.height,border:'2px solid rgba(139,105,20,0.9)',boxShadow:'0 0 14px rgba(139,105,20,0.35)',pointerEvents:'none'}}/>
        </>
      )}
      <div style={{position:'absolute',bottom:14,left:'50%',transform:'translateX(-50%)',background:snipError?'rgba(160,40,40,0.95)':'rgba(10,6,0,0.82)',color:'#F2EDE2',padding:'7px 18px',borderRadius:20,fontSize:13,fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap',pointerEvents:'none',zIndex:11,transition:'background 200ms',fontWeight:500,boxShadow:'0 2px 12px rgba(0,0,0,0.35)'}}>
        {snipError || 'Drag to select a passage — ESC to cancel'}
      </div>
      {flash && <div style={{position:'absolute',inset:0,background:'white',animation:'snipFlash 350ms ease-out forwards',zIndex:30,pointerEvents:'none'}}/>}
    </div>
  );
}

function ReadPanel({onSnip, headerSearchExpanded, setHeaderSearchExpanded, searchInputRef, readSearchQuery, setReadSearchQuery, onBookOpen, onBookClose, shelfOnly=false, sectionCount=1, allMoments=[], dropMoment, onDropMomentHandled, initialOpenBook=null}) {
  const [sel,setSel] = useState(null);
  const [pg,setPg] = useState(0);
  const [showMomentoInput,setShowMomentoInput] = useState(false);
  const [momentoText,setMomentoText] = useState("");
  const [snipDone,setSnipDone] = useState(false);
  const [lastRead,setLastRead] = useState(null);
  const [showLibrary,setShowLibrary] = useState(false);
  const [shelfCols,setShelfCols] = useState(7);
  const [shelfSel,setShelfSel] = useState(null);
  const [shelfOpen,setShelfOpen] = useState(false);
  const [cardBg,setCardBg] = useState('rgba(139,105,20,0.15)');
  const coverSamplerRef = React.useRef(null);
  const searchQuery = readSearchQuery || "";
  const setSearchQuery = setReadSearchQuery || function(){};
  const [snipMode,setSnipMode] = useState(false);
  const [selectedText,setSelectedText] = useState(null);
  const [discoverOpen,setDiscoverOpen] = useState(false);
  const [recentShelf,setRecentShelf] = useState(()=>{
    try{
      var s=localStorage.getItem('momento_recentShelf');
      if(!s) return [];
      return JSON.parse(s).filter(function(b){ return b.gutId; });
    }catch(e){ return []; }
  });
  const [loadingBook,setLoadingBook] = useState(false);
  const [loadingMsgIdx,setLoadingMsgIdx] = useState(0);
  const [loadingIsShelf,setLoadingIsShelf] = useState(false);
  const [loadError,setLoadError] = useState(null);
  const LOADING_MSGS = ["give us a moment, your book will be here soon","heading to the store room","looking at the classics section","climbing the ladder..","found it! ah classic book","bringing it to you..."];
  const SHELF_LOADING_MSGS = ["welcome back...","finding your page...","picking up where you left off...","settling in...","all good, making sure your capture tools are good.."];
  useEffect(function(){
    if(!loadingBook){ setLoadingMsgIdx(0); return; }
    setLoadingMsgIdx(0);
    var msgs = loadingIsShelf ? SHELF_LOADING_MSGS : LOADING_MSGS;
    var idx = 0;
    var t = setInterval(function(){
      idx++;
      if(idx >= msgs.length - 1){ setLoadingMsgIdx(msgs.length - 1); clearInterval(t); return; }
      setLoadingMsgIdx(idx);
    }, 1700);
    return function(){ clearInterval(t); };
  },[loadingBook, loadingIsShelf]);
  const [openGutBook,setOpenGutBook] = useState(null);
  const [gutSearchAll,setGutSearchAll] = useState([]);
  const [gutSearchFetching,setGutSearchFetching] = useState(false);
  const [lastOpenedGutMeta,setLastOpenedGutMeta] = useState(null);
  const [cacheVersion,setCacheVersion] = useState(0);
  const [shelfAdded,setShelfAdded] = useState(false);
  const [hoveredShelfId,setHoveredShelfId] = useState(null);
  const uploadRef = useRef(null);
  const [lastCapturedSel,setLastCapturedSel] = useState(()=>{
    const saved = localStorage.getItem('momento_lastCapturedShelfId');
    return saved !== null ? parseInt(saved,10) : LAST_READ_SHELF_ID;
  });
  const [lastCapturedGutBook,setLastCapturedGutBook] = useState(()=>{
    try{ var s=localStorage.getItem('momento_lastCapturedGut'); return s?JSON.parse(s):null; }catch(e){ return null; }
  });
  const [lastCapturedType,setLastCapturedType] = useState(()=>{
    return localStorage.getItem('momento_lastCapturedType')||'shelf';
  });
  const guideBookGutId = React.useMemo(()=>{
    try{ return localStorage.getItem('momento_guide_book')||null; }catch(e){ return null; }
  },[]);


  const [selRects, setSelRects] = useState(null);
  const [selText, setSelText] = useState('');
  const [selComment, setSelComment] = useState('');
  const [shortInterpToast, setShortInterpToast] = useState(false);
  const [highlightMode, setHighlightMode] = useState('passage'); // 'passage' | 'line'
  const selPanelRef = useRef(null);
  const shelfRef = useRef(null);
  const textContainerRef = useRef(null);
  const scrollToRestoreRef = useRef(0);  // scrollTop to restore after book renders
  const readingGutIdRef = useRef(null);  // gutId of currently open book (for scroll saving)
  const pendingPassageRef = useRef(null); // passage text to scroll to after drop-to-read
  const pendingScrollRef = useRef(null);  // {pg, scrollTop} to restore on drop-to-read
  const didRestoreRef = useRef(false);
  const dropScrollRef = useRef(null); // {pg} set by drop, applied after book renders

  // Restore open book when panel remounts (e.g. switching between multi/single mode)
  useEffect(function() {
    if (didRestoreRef.current || !initialOpenBook) return;
    didRestoreRef.current = true;
    var gutId = initialOpenBook.gutId;
    if (!gutId) return;
    var fixedBook = typeof FIXED_SHELF !== 'undefined'
      ? FIXED_SHELF.find(function(b) { return b.gutId === gutId; })
      : null;
    var shelfBook = fixedBook || (typeof FIXED_SHELF !== 'undefined' ? null : null);
    // Also check non-fixed shelf books via EPUB_CACHE
    var cached = EPUB_CACHE && EPUB_CACHE[gutId];
    if (!cached || cached === 'loading' || cached === 'error') return;
    var bookMeta = fixedBook || {gutId: gutId, title: initialOpenBook.title, author: initialOpenBook.author};
    setTimeout(function() { handleGutBookSelect(bookMeta, true); }, 0);
  }, []);

  // book / page – defined early so all hooks can reference them
  const book = openGutBook || (sel!==null ? BOOKS[sel] : null);
  const page = book ? book.pages[pg] : null;

  useEffect(()=>{
    const el = shelfRef.current;
    if(!el) return;
    const update = (w)=>setShelfCols(sectionCount===4?2:sectionCount===3?4:(w<320?5:w<480?7:w<640?8:9));
    update(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([e])=>update(e.contentRect.width));
    ro.observe(el); return ()=>ro.disconnect();
  });

  // Reset scroll to top whenever the page or book changes
  useEffect(()=>{
    if(textContainerRef.current) textContainerRef.current.scrollTop = 0;
  },[sel, openGutBook]);

  // Selection-based highlight → dashed rect + input
  useEffect(function(){
    if(!openGutBook){ setSelRects(null); setSelText(''); return; }

    function clearSel(){ setSelRects(null); setSelText(''); setSelComment(''); }
    function onKeyDown(e){ if(e.key==='Escape'){ clearSel(); window.getSelection().removeAllRanges(); } }

    if(highlightMode === 'passage'){
      /* ── Passage mode: click any paragraph → whole paragraph highlighted ── */
      function onPassageClick(e){
        var panel = selPanelRef.current;
        if(panel && panel.contains(e.target)) return;
        var container = textContainerRef.current;
        if(!container || !container.contains(e.target)){ clearSel(); return; }
        var el = e.target;
        while(el && el !== container){
          var tag = el.tagName && el.tagName.toLowerCase();
          if(tag==='p'||tag==='h1'||tag==='h2'||tag==='h3'||tag==='blockquote') break;
          el = el.parentElement;
        }
        if(!el || el===container){ clearSel(); return; }
        var r = el.getBoundingClientRect();
        if(r.height < 5) return;
        setSelRects([{left:r.left, top:r.top, width:r.width, height:r.height}]);
        setSelText(el.textContent.trim());
        setSelComment('');
      }
      document.addEventListener('click', onPassageClick);
      document.addEventListener('keydown', onKeyDown);
      return function(){
        document.removeEventListener('click', onPassageClick);
        document.removeEventListener('keydown', onKeyDown);
        clearSel();
      };
    }

    /* ── Line mode: drag to select any range ── */
    var mouseIsDown = false;
    function captureSelection(){
      var sel = window.getSelection();
      if(!sel || sel.rangeCount===0 || sel.isCollapsed){ return; }
      var range = sel.getRangeAt(0);
      var container = textContainerRef.current;
      if(!container || !container.contains(range.commonAncestorContainer)){ return; }
      var rawRects = range.getClientRects();
      var rects = [];
      for(var i=0; i<rawRects.length; i++){
        if(rawRects[i].width >= 2) rects.push({left:rawRects[i].left, top:rawRects[i].top, width:rawRects[i].width, height:rawRects[i].height});
      }
      if(!rects.length) return;
      setSelRects(rects);
      setSelText(sel.toString().trim());
      setSelComment('');
    }
    function onSelChange(){ if(mouseIsDown) return; captureSelection(); }
    function onMouseDown(e){
      var panel = selPanelRef.current;
      var container = textContainerRef.current;
      if(panel && panel.contains(e.target)) return;
      if(container && container.contains(e.target)){
        mouseIsDown = true;
        clearSel();
        return;
      }
      clearSel();
    }
    function onMouseUp(){
      if(!mouseIsDown) return;
      mouseIsDown = false;
      setTimeout(captureSelection, 10);
    }
    document.addEventListener('selectionchange', onSelChange);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('keydown', onKeyDown);
    return function(){
      document.removeEventListener('selectionchange', onSelChange);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('keydown', onKeyDown);
      clearSel();
    };
  },[openGutBook, highlightMode]);

  /* Restore saved scroll position after a book renders.
     Uses direct scrollTop (not scrollIntoView) to target the right container reliably.
     Runs after the scrollTop=0 reset (same dependency, defined later = runs after). */
  useEffect(function(){
    if(!openGutBook) return;
    var saved = scrollToRestoreRef.current;
    if(!saved || saved <= 0) return; // skip if 0 — drop-to-read uses dropScrollRef instead
    /* Two attempts: 200ms (most cases) and 600ms (slow parse / large EPUB) */
    var t1 = setTimeout(function(){
      if(textContainerRef.current) textContainerRef.current.scrollTop = saved;
    }, 200);
    var t2 = setTimeout(function(){
      if(textContainerRef.current) textContainerRef.current.scrollTop = saved;
      scrollToRestoreRef.current = 0;
    }, 600);
    return function(){ clearTimeout(t1); clearTimeout(t2); };
  }, [openGutBook]);

  /* Scroll to passage text after drop — searches for the exact paragraph first, falls back to section */
  useEffect(function(){
    if(!openGutBook || !dropScrollRef.current) return;
    var info = dropScrollRef.current;
    dropScrollRef.current = null;
    function applyScroll(){
      var container = textContainerRef.current;
      if(!container) return;
      // Try to find the exact paragraph containing the passage text
      if(info.passage){
        var needle = info.passage.trim().substring(0, 120);
        var paras = container.querySelectorAll('p');
        for(var i = 0; i < paras.length; i++){
          if(paras[i].textContent.includes(needle)){
            container.scrollTop = paras[i].offsetTop - 80;
            return;
          }
        }
      }
      // Fallback: scroll to the section by pg index
      var section = container.querySelector('#read-section-' + info.pg);
      if(section){
        container.scrollTop = section.offsetTop + (info.extra || 0);
      }
    }
    // Two attempts: book may still be rendering
    applyScroll();
    var t = setTimeout(applyScroll, 400);
    return function(){ clearTimeout(t); };
  }, [openGutBook]);

  /* Drop-to-Read: open book and restore saved pg + scrollTop */
  useEffect(function(){
    if(!dropMoment) return;
    try {
      var fixedBook = typeof FIXED_SHELF!=='undefined' ? FIXED_SHELF.find(function(b){ return b.title===dropMoment.book; }) : null;
      if(!fixedBook) { onDropMomentHandled && onDropMomentHandled(); return; }
      var targetPg = dropMoment.pg || 0;
      pendingScrollRef.current = {pg: targetPg, scrollTop: dropMoment.scrollTop || 0};
      dropScrollRef.current = {pg: targetPg, extra: sectionCount > 1 ? 110 : 0, passage: dropMoment.passage || null};
      pendingPassageRef.current = dropMoment.passage || null;
      onDropMomentHandled && onDropMomentHandled();
      setTimeout(function(){ handleGutBookSelect(fixedBook, true); }, 0);
    } catch(e) { pendingScrollRef.current = null; onDropMomentHandled && onDropMomentHandled(); }
  }, [dropMoment]);

  /* Mark captured passage paragraphs with amber left border + scroll to dropped passage */
  useEffect(function(){
    if(!openGutBook || !textContainerRef.current) return;
    var container = textContainerRef.current;
    var bookTitle = openGutBook.title;
    function apply(){
      container.querySelectorAll('[data-moment-marker]').forEach(function(el){
        el.style.borderLeft=''; el.style.paddingLeft=''; el.removeAttribute('data-moment-marker');
      });
      var scrollTarget = null;
      allMoments.forEach(function(m){
        if(m.book!==bookTitle || m.pg==null || !m.passage) return;
        var section=container.querySelector('#read-section-'+m.pg);
        if(!section) return;
        var needle=m.passage.trim().substring(0,200);
        section.querySelectorAll('p').forEach(function(p){
          if(p.textContent.includes(needle)){
            p.style.borderLeft='3px solid var(--amber)';
            p.style.paddingLeft='8px';
            p.setAttribute('data-moment-marker','1');
          }
        });
      });
      // If this open was triggered by a drop, scroll to the exact dropped passage
      var dropPassage = pendingPassageRef.current;
      if(dropPassage){
        pendingPassageRef.current = null;
        var needle2 = dropPassage.trim().substring(0, 120);
        var paras = container.querySelectorAll('p');
        for(var i = 0; i < paras.length; i++){
          if(paras[i].textContent.includes(needle2)){
            scrollTarget = paras[i];
            break;
          }
        }
        if(scrollTarget){
          container.scrollTop = scrollTarget.offsetTop - 80;
        }
      }
    }
    var t = setTimeout(apply, 300);
    return function(){ clearTimeout(t); };
  }, [openGutBook, allMoments]);

  /* Track scroll position and save to localStorage + DB */
  useEffect(function(){
    if(!openGutBook) return;
    var container = textContainerRef.current;
    if(!container) return;
    var timer = null;
    var dbTimer = null;
    function onScroll(){
      if(timer) clearTimeout(timer);
      if(dbTimer) clearTimeout(dbTimer);
      timer = setTimeout(function(){
        var st = container.scrollTop;
        /* Update pg for Contents active indicator */
        var sections = container.querySelectorAll('[id^="read-section-"]');
        var currentPg = 0;
        for(var i = 0; i < sections.length; i++){
          if(sections[i].offsetTop <= st + 80) currentPg = i;
          else break;
        }
        setPg(currentPg);
        var gid = readingGutIdRef.current;
        if(gid){
          try{ localStorage.setItem('momento_scrollTop_' + gid, st); }catch(e){}
          try{ localStorage.setItem('momento_pg_' + gid, currentPg); }catch(e){}
          // Write-through to DB after 5s idle (so other devices can restore position)
          dbTimer = setTimeout(function(){
            var update = {}; update[gid] = { scroll_top: st, pg: currentPg };
            apiPatch("/users/me/preferences", { reading_state_update: update }).catch(function(){});
          }, 5000);
        }
      }, 250);
    }
    container.addEventListener('scroll', onScroll, { passive: true });
    return function(){
      container.removeEventListener('scroll', onScroll);
      if(timer) clearTimeout(timer);
      if(dbTimer) clearTimeout(dbTimer);
    };
  }, [openGutBook]);

  // Pre-fetch all 5 Gutenberg books in background on mount
  useEffect(()=>{
    prefetchShelf();
    // Poll cache to trigger re-render when books finish loading
    var interval = setInterval(function(){
      var allDone = FIXED_SHELF.filter(function(b){return b.gutId;}).every(function(b){
        return EPUB_CACHE[b.gutId] && EPUB_CACHE[b.gutId] !== 'loading';
      });
      setCacheVersion(function(v){return v+1;});
      if(allDone) clearInterval(interval);
    }, 1500);
    return function(){ clearInterval(interval); };
  },[]);

  // On mount: if localStorage has no shelf, load from DB (new device fallback)
  useEffect(function(){
    try{
      var s = localStorage.getItem('momento_recentShelf');
      if(!s || JSON.parse(s).length === 0){
        apiGet("/users/me/shelf").then(function(books){
          if(books && books.length > 0){
            var mapped = books.map(function(b){ return { gutId: b.gut_id, title: b.title, author: b.author||'', cover: b.cover_url||'' }; });
            setRecentShelf(mapped);
          }
        }).catch(function(){});
      }
    }catch(e){}
  }, []);

  // Persist recentShelf to localStorage
  useEffect(()=>{
    try{ localStorage.setItem('momento_recentShelf', JSON.stringify(recentShelf)); }catch(e){}
  },[recentShelf]);


  // Search local catalog — instant, no network
  useEffect(()=>{
    if(searchQuery.length<2){ setGutSearchAll([]); return; }
    var q=searchQuery.toLowerCase();
    var catalog=typeof GUTENBERG_CATALOG!=='undefined'?GUTENBERG_CATALOG:[];
    var results=catalog.filter(function(b){
      return b.title.toLowerCase().includes(q)||b.author.toLowerCase().includes(q);
    }).slice(0,8);
    setGutSearchAll(results);
  },[searchQuery]);

  const handleBookSelect = (idx)=>{
    setSel(idx); setPg(0); setSelectedText(null); setSearchQuery("");
    setSnipMode(false);
    setLastRead({sel:idx,pg:0});
    // Notify parent that a book is now open
    if(onBookOpen && BOOKS[idx]) {
      onBookOpen({idx, title: BOOKS[idx].title, author: BOOKS[idx].author});
    }
  };

  const handleSaveMomento = ()=>{
    if(!selectedText) return;
    onSnip({passage:selectedText,book:book.title,chapter:page.chapter,interpretation:momentoText||null,pg:pg,scrollTop:textContainerRef.current?textContainerRef.current.scrollTop:0});
    setSelectedText(null); setShowMomentoInput(false); setMomentoText("");
    setLastRead({sel,pg});
    if(openGutBook){
      var _gid=openGutBook.id?(openGutBook.id+'').replace('gut_',''):null;
      /* Store only small fields — no cover (base64 too large, causes localStorage failures) */
      var _gutCap={title:openGutBook.title,author:openGutBook.author,passage:selectedText,gutId:_gid};
      setLastCapturedGutBook(_gutCap); try{localStorage.setItem('momento_lastCapturedGut',JSON.stringify(_gutCap));}catch(e){}
      setLastCapturedType('gut'); try{localStorage.setItem('momento_lastCapturedType','gut');}catch(e){}
      if(_gid) apiPatch("/users/me/preferences",{last_hero_gut_id:_gid, last_captured_type:'gut'}).catch(function(){});
    } else {
      const _capturedId = shelfSel ?? SHELF_BOOKS.find(b=>b.booksIdx===sel)?.id ?? 0; localStorage.setItem('momento_lastCapturedShelfId',_capturedId); setLastCapturedSel(_capturedId);
      setLastCapturedType('shelf'); try{localStorage.setItem('momento_lastCapturedType','shelf');}catch(e){}
      apiPatch("/users/me/preferences",{last_captured_type:'shelf', last_captured_shelf_id:String(_capturedId)}).catch(function(){});
    }
    setSnipDone(true); setTimeout(()=>setSnipDone(false),1500);
  };
  const handleSaveMoment = ()=>{
    if(!selectedText) return;
    onSnip({passage:selectedText,book:book.title,chapter:page.chapter,interpretation:null,pg:pg,scrollTop:textContainerRef.current?textContainerRef.current.scrollTop:0});
    setSelectedText(null); setShowMomentoInput(false); setMomentoText("");
    setLastRead({sel,pg});
    if(openGutBook){
      var _gid2=openGutBook.id?(openGutBook.id+'').replace('gut_',''):null;
      var _gutCap2={title:openGutBook.title,author:openGutBook.author,passage:selectedText,gutId:_gid2};
      setLastCapturedGutBook(_gutCap2); try{localStorage.setItem('momento_lastCapturedGut',JSON.stringify(_gutCap2));}catch(e){}
      setLastCapturedType('gut'); try{localStorage.setItem('momento_lastCapturedType','gut');}catch(e){}
      if(_gid2) apiPatch("/users/me/preferences",{last_hero_gut_id:_gid2, last_captured_type:'gut'}).catch(function(){});
    } else {
      const _capturedId = shelfSel ?? SHELF_BOOKS.find(b=>b.booksIdx===sel)?.id ?? 0; localStorage.setItem('momento_lastCapturedShelfId',_capturedId); setLastCapturedSel(_capturedId);
      setLastCapturedType('shelf'); try{localStorage.setItem('momento_lastCapturedType','shelf');}catch(e){}
      apiPatch("/users/me/preferences",{last_captured_type:'shelf', last_captured_shelf_id:String(_capturedId)}).catch(function(){});
    }
    setSnipDone(true); setTimeout(()=>setSnipDone(false),1500);
  };

  function handleSelSave(){
    if(!selText || !book) return;
    var chap = page ? page.chapter : (book.pages[0] ? book.pages[0].chapter : '');
    var wc = selComment.trim() === '' ? 0 : selComment.trim().split(/\s+/).filter(Boolean).length;
    onSnip({passage:selText, book:book.title, chapter:chap, interpretation:selComment||null, pg:pg, scrollTop:textContainerRef.current?textContainerRef.current.scrollTop:0});
    if(openGutBook){
      var gid = openGutBook.id?(openGutBook.id+'').replace('gut_',''):null;
      var cap = {title:openGutBook.title, author:openGutBook.author, passage:selText, gutId:gid};
      setLastCapturedGutBook(cap); try{localStorage.setItem('momento_lastCapturedGut',JSON.stringify(cap));}catch(e2){}
      setLastCapturedType('gut'); try{localStorage.setItem('momento_lastCapturedType','gut');}catch(e2){}
      if(gid) apiPatch("/users/me/preferences",{last_hero_gut_id:gid, last_captured_type:'gut'}).catch(function(){});
    } else {
      var capturedId2 = shelfSel != null ? shelfSel : (SHELF_BOOKS.find(function(b){return b.booksIdx===sel;})||{}).id||0;
      try{localStorage.setItem('momento_lastCapturedShelfId',capturedId2);}catch(e2){} setLastCapturedSel(capturedId2);
      setLastCapturedType('shelf'); try{localStorage.setItem('momento_lastCapturedType','shelf');}catch(e2){}
      apiPatch("/users/me/preferences",{last_captured_type:'shelf', last_captured_shelf_id:String(capturedId2)}).catch(function(){});
    }
    if(wc > 0 && wc < 10 && allMoments.length > 0) { setShortInterpToast(true); setTimeout(function(){setShortInterpToast(false);},5000); }
    setSnipDone(true); setTimeout(function(){setSnipDone(false);},1500);
    window.getSelection().removeAllRanges();
    setSelRects(null); setSelText(''); setSelComment('');
  }

  const openMomentoBook = (momentoBook, gutMeta)=>{
    var gid = gutMeta && gutMeta.gutId;
    var savedScrollTop = 0;
    var savedPg = 0;
    if(gid) {
      try { savedScrollTop = parseInt(localStorage.getItem('momento_scrollTop_' + gid)) || 0; } catch(e) {}
      try { savedPg = parseInt(localStorage.getItem('momento_pg_' + gid)) || 0; } catch(e) {}
    }
    readingGutIdRef.current = gid || null;
    if(pendingScrollRef.current !== null){
      savedPg = pendingScrollRef.current.pg || 0;
      savedScrollTop = pendingScrollRef.current.scrollTop || 0;
      pendingScrollRef.current = null;
    }
    scrollToRestoreRef.current = savedScrollTop;
    setOpenGutBook(Object.assign({}, momentoBook));
    setLastOpenedGutMeta(gutMeta);
    setSel(null); setPg(savedPg); setSearchQuery("");
    setSelectedText(null); setSnipMode(false);
    setSelRects(null); setSelText(''); setSelComment('');
    if(headerSearchExpanded) setHeaderSearchExpanded(false);
    if(onBookOpen) onBookOpen({title:momentoBook.title,author:momentoBook.author,gutId:gutMeta&&gutMeta.gutId||null});
  };

  const handleGutBookSelect = (gutBook, fromShelf)=>{
    if(gutBook.uploadOnly){
      if(uploadRef.current){ uploadRef.current._pendingBook = gutBook; uploadRef.current.click(); }
      return;
    }
    const cached = gutBook.gutId ? EPUB_CACHE[gutBook.gutId] : null;
    if(cached && cached !== 'loading' && cached !== 'error'){
      if(gutBook.gutId) cached.id = 'gut_' + gutBook.gutId;
      openMomentoBook(cached, gutBook); return;
    }
    setLoadingIsShelf(!!fromShelf); setLoadingBook(true); setLoadError(null);
    loadGutenbergBook(gutBook).then(function(momentoBook){
      if(gutBook.gutId) momentoBook.id = 'gut_' + gutBook.gutId;
      if(gutBook.gutId) EPUB_CACHE[gutBook.gutId] = momentoBook;
      openMomentoBook(momentoBook, gutBook);
      setLoadingBook(false);
    }).catch(function(){
      setLoadError("Could not load book. Check your connection and try again.");
      setLoadingBook(false);
    });
  };

  const handleFileUpload = (e)=>{
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    const pendingBook = uploadRef.current._pendingBook || {title:file.name.replace(/\.epub$/i,''),author:''};
    e.target.value = '';
    setLoadingBook(true); setLoadError(null);
    loadEpubFromFile(file).then(function(momentoBook){
      openMomentoBook(momentoBook, pendingBook);
      setLoadingBook(false);
    }).catch(function(){
      setLoadError("Could not read EPUB file.");
      setLoadingBook(false);
    });
  };

  const handleRemoveFromShelf = (gutId, e)=>{
    e.stopPropagation();
    setRecentShelf(function(prev){ return prev.filter(function(b){ return b.gutId!==gutId; }); });
    try{ localStorage.removeItem('momento_book_'+gutId); }catch(e2){}
    try{ localStorage.removeItem('momento_cover_'+gutId); }catch(e2){}
    if(EPUB_CACHE[gutId]) delete EPUB_CACHE[gutId];
    setHoveredShelfId(null);
    // Sync removal to DB
    apiDelete("/users/me/shelf/" + gutId).catch(function(){});
  };

  function cacheCoverLocally(gutId, coverUrl) {
    if(!gutId || !coverUrl) return;
    try{ if(localStorage.getItem('momento_cover_'+gutId)) return; }catch(e){ return; }
    /* Store URL immediately so hero can show it right away */
    try{ localStorage.setItem('momento_cover_'+gutId, coverUrl); }catch(e){ return; }
    /* Upgrade to base64 async (better offline support) — skip if already data URI */
    if(coverUrl.startsWith('data:')) return;
    fetch(coverUrl).then(function(res){ return res.blob(); }).then(function(blob){
      var reader = new FileReader();
      reader.onloadend = function(){
        try{ localStorage.setItem('momento_cover_'+gutId, reader.result); }catch(e){}
      };
      reader.readAsDataURL(blob);
    }).catch(function(){});
  }

  function getBookCover(book) {
    if(!book) return null;
    var gid = book.gutId;
    if(gid) {
      /* BOOK_COVERS first — bundled at build time, always correct */
      try{ if(typeof BOOK_COVERS!=='undefined' && BOOK_COVERS[gid]) return BOOK_COVERS[gid]; }catch(e){}
      /* localStorage — user-added books cached on + Shelf */
      try{ var _lc=localStorage.getItem('momento_cover_'+gid); if(_lc) return _lc; }catch(e){}
    }
    return book.cover || null;
  }

  const handleSearchBookOpen = (book)=>{
    setSearchQuery('');
    setGutSearchAll([]);
    if(!book.gutId){
      setLoadError('This book is not available on Project Gutenberg.');
      return;
    }
    handleGutBookSelect(book);
  };

  const openSnipTool  = ()=>{ setSnipMode(true);  setSelectedText(null); };
  const closeSnipTool = ()=>{ setSnipMode(false); setSelectedText(null); };

  // Shelf data — hero only uses gut captures; SHELF_BOOKS kept for legacy click-through only
  const lastShelfBook=SHELF_BOOKS.find(b=>b.id===LAST_READ_SHELF_ID);
  const lastCapturedShelfBook = SHELF_BOOKS.find(b=>b.id===lastCapturedSel) || lastShelfBook;
  /* Hero: real gut capture first; then guide book; then Frankenstein (FIXED_SHELF[0]) */
  var _defaultGutId = guideBookGutId || (FIXED_SHELF[0] && FIXED_SHELF[0].gutId);
  var _defaultFixed = FIXED_SHELF.find(function(b){ return b.gutId===_defaultGutId; }) || FIXED_SHELF[0];
  var _defaultHeroBook = _defaultFixed ? {title:_defaultFixed.title, author:_defaultFixed.author, gutId:_defaultFixed.gutId, passage:null} : null;
  const heroBook = lastCapturedGutBook || _defaultHeroBook;
  const heroIsDefault = !lastCapturedGutBook;
  /* Resolve cover from BOOK_COVERS / localStorage / FIXED_SHELF at render time.
     Falls back to title match so cached books with old gutIds still show covers. */
  function resolveHeroCover() {
    if(!heroBook || !heroBook.gutId) return null;
    var gid = heroBook.gutId;
    try{ if(typeof BOOK_COVERS!=='undefined' && BOOK_COVERS[gid]) return BOOK_COVERS[gid]; }catch(e){}
    try{ var lc=localStorage.getItem('momento_cover_'+gid); if(lc) return lc; }catch(e){}
    var fx=FIXED_SHELF.find(function(b){ return b.gutId===gid; });
    if(fx) return fx.cover;
    /* gutId may be stale (e.g. edition changed) — try matching by title */
    var fxByTitle=FIXED_SHELF.find(function(b){ return b.title===heroBook.title; });
    if(fxByTitle){
      try{ if(typeof BOOK_COVERS!=='undefined' && BOOK_COVERS[fxByTitle.gutId]) return BOOK_COVERS[fxByTitle.gutId]; }catch(e){}
      return fxByTitle.cover;
    }
    /* Same-session fallback: cover URL from when the book was opened */
    if(lastOpenedGutMeta && lastOpenedGutMeta.gutId===gid && lastOpenedGutMeta.cover) return lastOpenedGutMeta.cover;
    return null;
  }
  var heroBookCover = resolveHeroCover();
  const _heroBookTitle = heroBook ? heroBook.title : null;
  const _heroCount = allMoments.filter(m=>m.book===_heroBookTitle).length || heroBook?.moments || 0;
  const _heroCountFmt = _heroCount>=1000?(_heroCount/1000).toFixed(1)+"k":_heroCount;

  useEffect(()=>{
    if(sectionCount===4) setShelfCols(2);
    else if(sectionCount===3) setShelfCols(3);
  },[sectionCount]);

  React.useEffect(()=>{
    if(!heroBookCover) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = ()=>{
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 50; canvas.height = 75;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 50, 75);
        const data = ctx.getImageData(0,0,50,75).data;
        let r=0,g=0,b=0,count=0;
        for(let i=0;i<data.length;i+=4){r+=data[i];g+=data[i+1];b+=data[i+2];count++;}
        r=Math.round(r/count); g=Math.round(g/count); b=Math.round(b/count);
        setCardBg(`linear-gradient(90deg,rgba(${r},${g},${b},0.75) 0%,rgba(${r},${g},${b},1) 100%)`);
      } catch(e){ setCardBg('linear-gradient(90deg,rgba(82,42,48,0.75) 0%,rgba(82,42,48,1) 100%)'); }
    };
    img.onerror = ()=>{ setCardBg('linear-gradient(90deg,rgba(82,42,48,0.75) 0%,rgba(82,42,48,1) 100%)'); };
    img.src = heroBookCover;
  },[heroBookCover]);
  // Shelf: only locally available books
  const localRecentShelf=recentShelf.filter(function(b){ return !!b.gutId; });
  const visibleFixed=FIXED_SHELF.filter(function(b){ return !localRecentShelf.some(function(r){ return r.gutId===b.gutId; }); });
  const userAddedShelf=localRecentShelf.filter(function(b){ return !FIXED_SHELF.some(function(f){ return f.gutId===b.gutId; }); });
  const shelfList=[...localRecentShelf,...visibleFixed];
  const padded=[...shelfList];
  while(padded.length%shelfCols!==0) padded.push(null);
  const shelfRows=[];
  for(let i=0;i<padded.length;i+=shelfCols) shelfRows.push(padded.slice(i,i+shelfCols));
  const searchResults=searchQuery.length>1 ? gutSearchAll : [];


  /* ── Shelf landing ── */
  if(sel===null && !openGutBook) return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:"var(--bg)",position:"relative"}}>
      {/* Hidden file input for upload-only books */}
      <input ref={uploadRef} type="file" accept=".epub" style={{display:"none"}} onChange={handleFileUpload}/>

      {/* Loading overlay */}
      {loadingBook&&(
        <div style={{position:"absolute",inset:0,zIndex:200,background:"rgba(28,18,8,0.72)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
          <img src="./just logo.png" alt="" style={{width:48,height:48,objectFit:"contain",animation:"spin 6.8s steps(4) infinite"}}/>
          <span className="font-serif" style={{fontSize:18,fontStyle:"italic",color:"rgba(245,230,205,0.85)"}}>{(loadingIsShelf?SHELF_LOADING_MSGS:LOADING_MSGS)[loadingMsgIdx]}</span>
        </div>
      )}
      {loadError&&!loadingBook&&(
        <div style={{position:"absolute",top:56,left:"50%",transform:"translateX(-50%)",zIndex:200,background:"#5C1A1A",color:"#FFD0D0",padding:"8px 18px",borderRadius:20,fontSize:11,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>
          {loadError}
        </div>
      )}

      {/* Search results dropdown – Gutenberg books */}
      {searchQuery.length>1&&searchResults.length>0&&(
        <div style={{position:"absolute",top:48,left:"calc(50% - 315px)",width:280,background:"var(--bg)",border:"1px solid rgba(139,105,20,0.14)",borderRadius:10,boxShadow:"0 4px 18px rgba(0,0,0,0.18)",overflow:"hidden",zIndex:100}}>
          {searchResults.map(b=>(
            <button key={b.gutId} onClick={()=>handleSearchBookOpen(b)}
              style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",border:"none",borderBottom:"1px solid rgba(139,105,20,0.07)",background:"transparent",cursor:"pointer",textAlign:"left",width:"100%"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(139,105,20,0.06)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              {b.cover&&<img src={b.cover} style={{width:28,height:40,objectFit:"cover",borderRadius:2,flexShrink:0}}/>}
              <div style={{minWidth:0}}>
                <span className="font-serif" style={{display:"block",fontSize:12,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.title}</span>
                <span className="font-sans" style={{display:"block",fontSize:10,fontWeight:500,color:"var(--text2)",marginTop:1}}>{b.author}</span>
              </div>
            </button>
          ))}
        </div>
      )}



      {sectionCount!==4 && (
        <div style={{position:"absolute",inset:0,zIndex:0,overflow:"hidden",pointerEvents:"none",userSelect:"none",background:"linear-gradient(90deg,#1C1208,#C8BAA0)"}}>
          <div style={{height:360,display:"flex",alignItems:"center",justifyContent:"flex-end"}}>
            <p style={{fontFamily:"'Lora',serif",fontSize:20,fontStyle:"italic",lineHeight:1.8,color:"rgba(20,10,2,0.38)",margin:0,padding:"0 24px",textAlign:"right"}}>
              {(function(){
              var p = heroBook?.passage || "";
              if(p) return p;
              /* No capture yet (skip) — pull first passage from PREBUNDLED_BOOKS */
              try{
                var gid = heroBook && heroBook.gutId;
                var pb = gid && typeof PREBUNDLED_BOOKS!=='undefined' && PREBUNDLED_BOOKS[gid];
                if(pb && pb.pages && pb.pages.length){
                  var t = pb.pages[0].text || "";
                  var paras = t.split(/\n\n+/).map(function(s){return s.trim();}).filter(function(s){return s.length>80;});
                  if(paras.length) return paras[0];
                }
              }catch(e){}
              return "";
            })()}
            </p>
          </div>
        </div>
      )}

      {sectionCount!==4 && (
        <div style={{flexShrink:0,position:"relative",zIndex:2}}>
          {heroBook && (
            <div onClick={()=>{
              if(heroBook){
                var _allShelf=[...FIXED_SHELF,...localRecentShelf];
                var _hShelfBook=_allShelf.find(function(b){return b.gutId===heroBook.gutId;})
                  || _allShelf.find(function(b){return b.title===heroBook.title;});
                if(_hShelfBook) handleGutBookSelect(_hShelfBook, true);
              }
            }}
              style={{borderRadius:0,overflow:"hidden",position:"relative",
                background:"transparent",cursor:"pointer",
                display:"flex",alignItems:"stretch",height:360}}>
              <div style={{position:"relative",zIndex:4,width:"100%",display:"flex",flexDirection:"row",alignItems:"center",padding:"16px 28px 16px 28px",gap:20}}>
                {heroBookCover && (
                  <img src={heroBookCover} style={{width:170,height:245,objectFit:"cover",objectPosition:"center top",borderRadius:"2px 4px 4px 2px",boxShadow:"0 0 0 1px rgba(196,160,85,0.15), 8px 8px 32px rgba(0,0,0,0.7), 0 0 60px rgba(0,0,0,0.4)",flexShrink:0,display:"block"}}/>
                )}
                <div style={{display:"flex",flexDirection:"column",gap:0,flex:1,minWidth:0}}>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(220,185,120,1)",marginBottom:8,textShadow:"0 1px 6px rgba(0,0,0,0.9),0 0 12px rgba(0,0,0,0.7)"}}>{heroBook.author}</span>
                  <span style={{fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:700,fontStyle:"italic",color:"#FFFFFF",lineHeight:1.15,marginBottom:16,textShadow:"0 2px 8px rgba(0,0,0,0.95),0 1px 3px rgba(0,0,0,0.9)"}}>{heroBook.title}</span>
                  {!heroIsDefault && (
                    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:22}}>
                      <div style={{display:"flex",flexDirection:"column",gap:1}}>
                        <div style={{display:"flex",alignItems:"baseline",gap:2}}>
                          <span style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,fontStyle:"italic",color:"rgba(220,178,90,1)",textShadow:"0 1px 6px rgba(0,0,0,0.95)"}}>{_heroCountFmt}</span>
                          <span style={{fontFamily:"'Playfair Display',serif",fontSize:11,fontStyle:"italic",color:"rgba(220,178,90,0.9)",textShadow:"0 1px 4px rgba(0,0,0,0.9)"}}>moments</span>
                        </div>
                        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,fontWeight:700,letterSpacing:"0.1em",color:"rgba(245,230,205,0.9)",textTransform:"uppercase",textShadow:"0 1px 4px rgba(0,0,0,0.95)"}}>by you</span>
                      </div>
                      <div style={{width:1,height:24,background:"rgba(196,160,85,0.25)"}}/>
                      <div style={{display:"flex",flexDirection:"column",gap:1}}>
                        <div style={{display:"flex",alignItems:"baseline",gap:2}}>
                          <span style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,fontStyle:"italic",color:"rgba(245,230,205,1)",textShadow:"0 1px 6px rgba(0,0,0,0.95)"}}>{_heroCountFmt}</span>
                          <span style={{fontFamily:"'Playfair Display',serif",fontSize:11,fontStyle:"italic",color:"rgba(245,230,205,0.9)",textShadow:"0 1px 4px rgba(0,0,0,0.9)"}}>moments</span>
                        </div>
                        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,fontWeight:700,letterSpacing:"0.1em",color:"rgba(245,230,205,0.9)",textTransform:"uppercase",textShadow:"0 1px 4px rgba(0,0,0,0.95)"}}>all readers</span>
                      </div>
                    </div>
                  )}
                  <button className="font-serif"
                    style={{alignSelf:"flex-start",padding:"9px 20px",borderRadius:20,border:"1px solid rgba(220,178,90,0.9)",background:"rgba(220,178,90,0.28)",fontSize:13,fontStyle:"italic",fontWeight:600,color:"rgba(245,230,205,1)",cursor:"pointer",letterSpacing:"0.01em",textShadow:"0 1px 4px rgba(0,0,0,0.7)"}}>
                    {heroIsDefault ? (guideBookGutId ? 'Continue Capturing Moments →' : 'Start Capturing Moments →') : 'Continue Capturing Moments →'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* â"€â"€ Bottom: Full-width Shelf with Discover toggle â"€â"€ */}
      <div style={{flex:1,minHeight:0,background:"transparent",display:"flex",flexDirection:"column",padding:sectionCount===4?"56px 20px 20px":"16px 20px 20px",overflow:"hidden",position:"relative",zIndex:2}}>
        <div className="bookcase" style={{flex:1,minHeight:0,borderRadius:10,overflow:"hidden",boxShadow:"0 2px 16px rgba(28,16,4,0.1)",display:"flex",flexDirection:"column"}}>

          {/* Label row â€" inside the shelf, on shelf background */}
          <div className="shelf-header" style={{flexShrink:0,display:"flex",alignItems:"center",gap:7,padding:"10px 14px 8px"}}>
            {/* Shelf icon */}
            {!discoverOpen && sectionCount!==4 && (
              <svg width="15" height="13" viewBox="0 0 18 14" fill="none">
                <rect x="0.5" y="1" width="17" height="9" rx="1" stroke="rgba(139,105,20,0.75)" strokeWidth="1.2" fill="none"/>
                <line x1="4" y1="1" x2="4" y2="10" stroke="rgba(139,105,20,0.5)" strokeWidth="1"/>
                <line x1="8.5" y1="1" x2="8.5" y2="10" stroke="rgba(139,105,20,0.5)" strokeWidth="1"/>
                <line x1="13" y1="1" x2="13" y2="10" stroke="rgba(139,105,20,0.5)" strokeWidth="1"/>
                <line x1="0" y1="11.5" x2="18" y2="11.5" stroke="rgba(139,105,20,0.75)" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            )}
            {/* Discover icon */}
            {discoverOpen && (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="rgba(139,105,20,0.75)" strokeWidth="1.2"/>
                <circle cx="8" cy="8" r="1.1" fill="rgba(139,105,20,0.75)"/>
                <path d="M8 3.5 L9.1 7.4 L8 8 L6.9 7.4 Z" fill="rgba(139,105,20,0.8)"/>
                <path d="M8 12.5 L9.1 8.6 L8 8 L6.9 8.6 Z" fill="rgba(139,105,20,0.45)"/>
              </svg>
            )}
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              {discoverOpen ? (
                <span className="font-serif" style={{fontSize:14,fontStyle:"italic",fontWeight:600,color:"var(--text)",letterSpacing:"0.01em",lineHeight:1}}>Discover</span>
              ) : sectionCount===4 ? (
                <button onClick={()=>lastShelfBook&&handleBookSelect(lastShelfBook.booksIdx)}
                  style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",padding:0}}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="var(--text2)" strokeWidth="1.2"/>
                    <path d="M6.5 5.5L11 8L6.5 10.5V5.5Z" fill="var(--amber)"/>
                  </svg>
                  <span className="font-serif" style={{fontSize:12,fontStyle:"italic",fontWeight:600,color:"var(--amber)",lineHeight:1}}>continue</span>
                </button>
              ) : (
                <span className="font-serif" style={{fontSize:14,fontStyle:"italic",fontWeight:600,color:"var(--text)",letterSpacing:"0.01em",lineHeight:1}}><span>Your <strong>Shelf</strong></span></span>
              )}
            </div>

            {/* Spacer */}
            <div style={{flex:1}}/>

            {/* Shelf / Discover toggle pill */}
            <div style={{display:"flex",alignItems:"center",background:"var(--amber2)",borderRadius:20,padding:3,gap:2,border:"1px solid var(--border)"}}>
              <button onClick={()=>setDiscoverOpen(false)} className="font-sans"
                style={{padding:"5px 16px",borderRadius:16,border:"none",fontSize:11,fontWeight:700,letterSpacing:"0.04em",cursor:"pointer",transition:"background 200ms, color 200ms, box-shadow 200ms",
                  background:!discoverOpen?"var(--amber)":"transparent",
                  color:!discoverOpen?"var(--bg)":"var(--text2)",
                  boxShadow:!discoverOpen?"0 1px 6px rgba(139,105,20,0.35)":"none"}}>
                Shelf
              </button>
              <button onClick={()=>setDiscoverOpen(true)} className="font-sans"
                style={{padding:"5px 16px",borderRadius:16,border:"none",fontSize:11,fontWeight:700,letterSpacing:"0.04em",cursor:"pointer",transition:"background 200ms, color 200ms, box-shadow 200ms",
                  background:discoverOpen?"var(--amber)":"transparent",
                  color:discoverOpen?"var(--bg)":"var(--text2)",
                  boxShadow:discoverOpen?"0 1px 6px rgba(139,105,20,0.35)":"none"}}>
                Discover
              </button>
            </div>
          </div>

          {/* â"€â"€ Bookcase scroll area â"€â"€ */}
          {!discoverOpen && (
            <>
              <div onWheel={e=>e.stopPropagation()} className={`shelf-scroll${sectionCount===4?" scroll-dim":""}`} style={{flex:1,minHeight:0,overflowY:"scroll",overflowX:"hidden",scrollbarWidth:"auto",scrollbarColor:sectionCount===4?"rgba(139,105,20,0.04) transparent":"rgba(139,105,20,0.55) rgba(139,105,20,0.1)"}}>
                {shelfRows.map((row,ri)=>(
                  <div key={ri} className="shelf-section">
                    <div className="row-grid" style={{gridTemplateColumns:`repeat(${shelfCols},1fr)`}}>
                      {row.map((b,ci)=>{
                        if(!b) return <div key={`empty-${ci}`} className="shelf-cell"><div className="shelf-cell-inner"/><div className="shelf-floor"/></div>;
                        const isRecent=localRecentShelf.some(r=>r.gutId===b.gutId);
                        const isFixed=FIXED_SHELF.some(f=>f.gutId===b.gutId);
                        const isSel=openGutBook?.title===b.title;
                        const momentCount=allMoments.filter(m=>m.book===b.title).length;
                        const cacheState=b.gutId?EPUB_CACHE[b.gutId]:null;
                        const isReady=cacheState&&cacheState!=='loading'&&cacheState!=='error';
                        const isFetching=cacheState==='loading';
                        return (
                          <div key={b.gutId||b.title} className={`shelf-cell${isRecent?" shelf-hot":""}${isSel?" shelf-sel":""}`}
                            onClick={()=>handleGutBookSelect(b, true)}
                            onMouseEnter={()=>setHoveredShelfId(b.gutId||b.title)}
                            onMouseLeave={()=>setHoveredShelfId(null)}>
                            <div className="shelf-cell-inner" style={{overflow:"visible"}}>
                              <div className="shelf-book">
                                {getBookCover(b)
                                  ? <img src={getBookCover(b)} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"1px 2px 2px 1px"}} onError={e=>{e.target.style.display='none';}}/>
                                  : <div style={{width:"100%",height:"100%",background:"#3A2010"}}/>
                                }
                                {/* Book title hover overlay */}
                                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 6px",background:"rgba(10,6,2,0.55)",opacity:hoveredShelfId===(b.gutId||b.title)?1:0,transition:"opacity 180ms ease",pointerEvents:"none",zIndex:5,borderRadius:"1px 2px 2px 1px"}}>
                                  <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontStyle:"italic",fontWeight:600,color:"rgba(235,210,155,0.95)",textAlign:"center",lineHeight:1.3,wordBreak:"break-word",textShadow:"0 1px 6px rgba(0,0,0,0.95)"}}>{b.title}</span>
                                </div>
                                {/* Loading spinner overlay */}
                                {isFetching&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.38)"}}>
                                  <div style={{width:16,height:16,border:"2px solid rgba(220,185,120,0.3)",borderTop:"2px solid rgba(220,185,120,0.9)",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                                </div>}
                                {/* Upload icon for copy-protected books */}
                                {b.uploadOnly&&<div style={{position:"absolute",bottom:4,right:4,background:"rgba(0,0,0,0.6)",borderRadius:4,padding:"2px 4px"}}>
                                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:7,color:"rgba(220,185,120,0.9)",letterSpacing:"0.04em"}}>Upload</span>
                                </div>}
                                <div className="shelf-badge">
                                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:700,color:"rgba(220,185,120,1)",lineHeight:1,display:"flex",alignItems:"center",gap:4}}>{momentCount>=1000?(momentCount/1000).toFixed(1)+"k":momentCount}<svg width="15" height="19" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg"><path d="M4 2 H26 V28 Q23 30 20 27 Q17 24 14 27 Q11 30 8 27 Q5 24 4 28 Z" fill="none" stroke="rgba(220,185,120,1)" strokeWidth="2.5" opacity="0.55"/><line x1="8" y1="10" x2="22" y2="10" stroke="rgba(220,185,120,1)" strokeWidth="2" opacity="0.35"/><line x1="8" y1="15" x2="22" y2="15" stroke="rgba(220,185,120,1)" strokeWidth="2" opacity="0.35"/><line x1="8" y1="20" x2="16" y2="20" stroke="rgba(220,185,120,1)" strokeWidth="2" opacity="0.35"/></svg></span>
                                </div>
                              </div>
                              {/* Exclusive pill — outside shelf-book so tooltip isn't clipped by overflow:hidden */}
                              {isFixed&&<div style={{position:"absolute",top:10,right:10,zIndex:6}}
                                onMouseEnter={function(e){var t=e.currentTarget.querySelector('.exc-tip');if(t)t.style.display='block';}}
                                onMouseLeave={function(e){var t=e.currentTarget.querySelector('.exc-tip');if(t)t.style.display='none';}}>
                                <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",background:"rgba(20,14,4,0.62)",borderRadius:20,padding:"2px 6px",backdropFilter:"blur(4px)"}}>
                                  <span style={{fontFamily:"'Playfair Display',serif",fontSize:9,fontStyle:"italic",color:"rgba(220,185,120,0.85)",letterSpacing:"0.04em"}}>E</span>
                                </div>
                                <div className="exc-tip" style={{display:"none",position:"absolute",top:"calc(100% + 6px)",right:0,whiteSpace:"nowrap",background:"linear-gradient(135deg,rgba(28,18,6,0.97),rgba(42,28,10,0.97))",color:"rgba(235,205,140,0.95)",fontSize:10.5,fontFamily:"'Playfair Display',serif",fontStyle:"italic",letterSpacing:"0.03em",padding:"7px 12px",borderRadius:10,border:"1px solid rgba(180,140,60,0.25)",boxShadow:"0 4px 18px rgba(0,0,0,0.45)",pointerEvents:"none",zIndex:300}}>Exclusive book ready for you to read</div>
                              </div>}
                            </div>
                            <div className="shelf-floor"/>
                          </div>
                        );
                      })}
                    </div>
                    {ri<shelfRows.length-1&&<><div className="shelf-plank"/><div className="shelf-plank-shadow"/></>}
                  </div>
                ))}
              </div>
              {/* â"€â"€ Shelf footer â"€â"€ */}
              <div style={{flexShrink:0,padding:"7px 14px",borderTop:"1px solid rgba(139,105,20,0.1)",display:"flex",justifyContent:"center",background:"var(--bg)"}}>
                <span className="font-sans" style={{fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(139,105,20,0.6)",fontWeight:600}}>{shelfList.filter(Boolean).length} books</span>
              </div>
            </>
          )}

        {/* â"€â"€ Discover panel (toggled) â"€â"€ */}
        {discoverOpen && (
          <div style={{flex:1,minHeight:0,overflow:"hidden",background:"var(--bg)"}}>
            <div className="discover-expand" style={{height:"100%",overflowY:"auto",overflowX:"hidden",scrollbarWidth:"thin",scrollbarColor:"rgba(139,105,20,0.45) rgba(139,105,20,0.1)"}}>

              {/* â"€â"€ Moments of the week â€" editorial divider â"€â"€ */}
              <div style={{padding:"14px 16px 10px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1,height:"1px",background:"rgba(139,105,20,0.2)"}}/>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontStyle:"italic",fontWeight:400,color:"var(--amber)",whiteSpace:"nowrap",letterSpacing:"0.02em"}}>
                  <strong style={{fontWeight:700,fontSize:16,color:"var(--text)"}}>Moments</strong> of the week
                </span>
                <div style={{flex:1,height:"1px",background:"rgba(139,105,20,0.2)"}}/>
              </div>

              {/* Moments of the week â€" horizontal scroll */}
              <div style={{paddingBottom:14}}>
                <div className="discover-scroll" style={{display:"flex",gap:10,overflowX:"scroll",padding:"4px 14px 8px",scrollbarWidth:"thin",scrollbarColor:"rgba(139,105,20,0.45) rgba(139,105,20,0.1)",WebkitOverflowScrolling:"touch"}}>
                  {MOST_FELT_PASSAGES.map((p,i)=>{
                    return (
                      <div key={i} onClick={()=>handleBookSelect(p.bookIdx)}
                        style={{flexShrink:0,width:"72%",borderRadius:8,padding:"13px 13px 11px",background:"var(--card)",border:"1px solid var(--border)",cursor:"pointer",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
                        <div style={{borderLeft:"2px solid var(--amber)",paddingLeft:9,marginBottom:12}}>
                          <p style={{fontFamily:"'Lora',serif",fontSize:12,lineHeight:1.75,fontStyle:"italic",color:"var(--text)",margin:0,display:"-webkit-box",WebkitLineClamp:4,WebkitBoxOrient:"vertical",overflow:"hidden"}}>"{p.passage}"</p>
                        </div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <span style={{fontFamily:"'Playfair Display',serif",fontSize:11,fontStyle:"italic",fontWeight:600,color:"var(--amber)",lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"60%"}}>{p.book}</span>
                          <div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0}}>
                            <span style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,fontStyle:"italic",color:"var(--amber)"}}>{p.felt>=1000?(p.felt/1000).toFixed(1)+"k":p.felt}</span>
                            <svg width="11" height="14" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg" style={{marginTop:5}}><path d="M4 2 H26 V28 Q23 30 20 27 Q17 24 14 27 Q11 30 8 27 Q5 24 4 28 Z" fill="none" stroke="var(--amber)" strokeWidth="2.5" opacity="0.7"/><line x1="8" y1="10" x2="22" y2="10" stroke="var(--amber)" strokeWidth="2" opacity="0.45"/><line x1="8" y1="15" x2="22" y2="15" stroke="var(--amber)" strokeWidth="2" opacity="0.45"/><line x1="8" y1="20" x2="16" y2="20" stroke="var(--amber)" strokeWidth="2" opacity="0.45"/></svg>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* â"€â"€ Books of the week â€" editorial divider â"€â"€ */}
              <div style={{padding:"6px 16px 10px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1,height:"1px",background:"rgba(139,105,20,0.2)"}}/>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontStyle:"italic",fontWeight:400,color:"var(--amber)",whiteSpace:"nowrap",letterSpacing:"0.02em"}}>
                  <strong style={{fontWeight:700,fontSize:16,color:"var(--text)"}}>Books</strong> of the week
                </span>
                <div style={{flex:1,height:"1px",background:"rgba(139,105,20,0.2)"}}/>
              </div>

              {/* Books of the week â€" 2-col grid or horizontal scroll */}
              <div style={shelfOnly?{display:"flex",gap:8,overflowX:"auto",padding:"0 10px 16px",scrollbarWidth:"thin",scrollbarColor:"rgba(139,105,20,0.45) rgba(139,105,20,0.1)",WebkitOverflowScrolling:"touch"}:{padding:"0 10px 20px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                {SHELF_BOOKS.slice(0,6).map((b,i)=>{
                  const svgFallback = makeShelfCoverSVG(b);
                  return (
                    <div key={b.id} onClick={()=>handleBookSelect(b.booksIdx)}
                      style={shelfOnly?{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer",padding:"6px 8px",borderRadius:6,transition:"background 150ms",background:"transparent"}:{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"8px 10px",borderRadius:6,transition:"background 150ms",background:"transparent"}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(139,105,20,0.07)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <div style={shelfOnly?{width:46,height:66,borderRadius:"1px 2px 2px 1px",overflow:"hidden",boxShadow:"3px 3px 10px rgba(0,0,0,0.28)",flexShrink:0}:{width:38,height:55,borderRadius:"1px 2px 2px 1px",overflow:"hidden",boxShadow:"3px 3px 10px rgba(0,0,0,0.28)",flexShrink:0}}>
                        <ShelfCoverImage book={b} svgFallback={svgFallback}/>
                      </div>
                      {shelfOnly?(
                        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                          <p style={{fontFamily:"'Playfair Display',serif",fontSize:9,fontStyle:"italic",fontWeight:600,color:"var(--text)",margin:0,lineHeight:1.3,textAlign:"center",maxWidth:60,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.title}</p>
                          <div style={{display:"flex",alignItems:"center",gap:2}}>
                            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,fontWeight:700,color:"var(--amber)"}}>{(()=>{const c=allMoments.filter(m=>m.book===BOOKS[b.booksIdx]?.title).length||b.moments;return c>=1000?(c/1000).toFixed(1)+"k":c;})()}</span>
                            <svg width="8" height="10" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg"><path d="M4 2 H26 V28 Q23 30 20 27 Q17 24 14 27 Q11 30 8 27 Q5 24 4 28 Z" fill="none" stroke="var(--amber)" strokeWidth="2.5" opacity="0.7"/><line x1="8" y1="10" x2="22" y2="10" stroke="var(--amber)" strokeWidth="2" opacity="0.45"/><line x1="8" y1="15" x2="22" y2="15" stroke="var(--amber)" strokeWidth="2" opacity="0.45"/><line x1="8" y1="20" x2="16" y2="20" stroke="var(--amber)" strokeWidth="2" opacity="0.45"/></svg>
                          </div>
                        </div>
                      ):(
                        <div style={{minWidth:0}}>
                          <p style={{fontFamily:"'Playfair Display',serif",fontSize:12,fontStyle:"italic",fontWeight:600,color:"var(--text)",margin:"0 0 2px",lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.title}</p>
                          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:500,color:"var(--amber)",margin:"0 0 4px",lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.author}</p>
                          <div style={{display:"flex",alignItems:"center",gap:3}}>
                            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:700,color:"var(--amber)"}}>{(()=>{const c=allMoments.filter(m=>m.book===BOOKS[b.booksIdx]?.title).length||b.moments;return c>=1000?(c/1000).toFixed(1)+"k":c;})()}</span>
                            <svg width="10" height="12" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg"><path d="M4 2 H26 V28 Q23 30 20 27 Q17 24 14 27 Q11 30 8 27 Q5 24 4 28 Z" fill="none" stroke="var(--amber)" strokeWidth="2.5" opacity="0.7"/><line x1="8" y1="10" x2="22" y2="10" stroke="var(--amber)" strokeWidth="2" opacity="0.45"/><line x1="8" y1="15" x2="22" y2="15" stroke="var(--amber)" strokeWidth="2" opacity="0.45"/><line x1="8" y1="20" x2="16" y2="20" stroke="var(--amber)" strokeWidth="2" opacity="0.45"/></svg>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}

        </div>{/* end unified bookcase container */}

      </div>
    </div>
  );

  /* ── Reading view ── */
  var bookGutId = openGutBook ? openGutBook.id.replace('gut_','') : null;
  var isFixedShelf = openGutBook && FIXED_SHELF.some(function(b){return b.gutId===bookGutId;});
  var isRecentShelf = openGutBook && userAddedShelf.some(function(b){return b.gutId===bookGutId;});
  var shelfFull = userAddedShelf.length >= 2;

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",position:"relative",paddingTop:48,boxSizing:"border-box"}}>

      {/* Top bar */}
      <div style={{flexShrink:0,display:"flex",alignItems:"center",gap:8,padding:"8px 16px",borderBottom:"1px solid var(--border2)",background:"var(--bg)"}}>
        <button onClick={()=>{setSel(null);setOpenGutBook(null);setSelRects(null);setSelText('');setSelComment('');if(onBookClose)onBookClose();}} className="font-sans"
          style={{padding:"5px 12px",borderRadius:20,border:"1px solid rgba(139,105,20,0.2)",background:"transparent",fontSize:12,fontWeight:600,color:"var(--amber)",cursor:"pointer",flexShrink:0}}>
          ← Back
        </button>
        <span className="font-serif" style={{flex:1,fontSize:15,fontStyle:"italic",fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"center",fontWeight:500}}>
          {snipMode?"Drag to snip a passage":book.title}
        </span>
        {!snipMode&&openGutBook&&(
          isFixedShelf ? (
            <span className="font-serif" style={{fontSize:12,fontStyle:"italic",color:"rgba(139,105,20,0.5)",flexShrink:0}}>Exclusive</span>
          ) : isRecentShelf ? (
            <button onClick={()=>{
              if(bookGutId) handleRemoveFromShelf(bookGutId, {stopPropagation:function(){}});
              setOpenGutBook(null); setSel(null); if(onBookClose) onBookClose();
            }} className="font-sans"
              style={{padding:"5px 12px",borderRadius:20,border:"1px solid rgba(139,105,20,0.2)",background:"transparent",fontSize:12,fontWeight:600,color:"var(--amber)",cursor:"pointer",flexShrink:0}}>
              − Shelf
            </button>
          ) : shelfFull ? (
            <div className="shelf-limit-wrap" style={{position:"relative",flexShrink:0}}>
              <button disabled className="font-sans"
                style={{padding:"5px 12px",borderRadius:20,border:"1px solid rgba(139,105,20,0.1)",background:"transparent",fontSize:12,fontWeight:600,color:"rgba(139,105,20,0.3)",cursor:"not-allowed",flexShrink:0}}>
                + Shelf
              </button>
              <div className="shelf-limit-tip">shelf limit reached, but more space is on the way!</div>
            </div>
          ) : (
            <button onClick={()=>{
              if(lastOpenedGutMeta && openGutBook){
                try{ localStorage.setItem('momento_book_'+lastOpenedGutMeta.gutId, JSON.stringify(openGutBook)); }catch(e){}
                if(lastOpenedGutMeta.gutId) EPUB_CACHE[lastOpenedGutMeta.gutId] = openGutBook;
                cacheCoverLocally(lastOpenedGutMeta.gutId, lastOpenedGutMeta.cover);
                setRecentShelf(function(prev){ return prev.find(function(b){return b.gutId===lastOpenedGutMeta.gutId;})?prev:[lastOpenedGutMeta,...prev]; });
                // Sync addition to DB
                apiPost("/users/me/shelf", { gut_id: lastOpenedGutMeta.gutId, title: lastOpenedGutMeta.title, author: lastOpenedGutMeta.author||'', cover_url: lastOpenedGutMeta.cover||'' }).catch(function(){});
                setShelfAdded(true); setTimeout(function(){setShelfAdded(false);},1500);
              }
            }} className="font-sans"
              style={{padding:"5px 12px",borderRadius:20,border:"1px solid rgba(139,105,20,0.2)",background:shelfAdded?"rgba(139,105,20,0.12)":"transparent",fontSize:12,fontWeight:600,color:"var(--amber)",cursor:"pointer",flexShrink:0,transition:"background 0.15s"}}>
              {shelfAdded ? '✓ Added' : '+ Shelf'}
            </button>
          )
        )}
        {!snipMode&&<button onClick={()=>setShowLibrary(l=>!l)} className="font-sans"
          style={{padding:"5px 14px",borderRadius:20,border:`1px solid ${showLibrary?"#8B6914":"rgba(139,105,20,0.2)"}`,background:showLibrary?"rgba(139,105,20,0.08)":"transparent",fontSize:12,fontWeight:600,color:"var(--amber)",cursor:"pointer",flexShrink:0}}>
          Contents
        </button>}
        {snipDone&&<span className="font-sans" style={{fontSize:10,color:"var(--amber)",background:"rgba(139,105,20,0.1)",padding:"3px 10px",borderRadius:20,flexShrink:0}}>✓ Snipped</span>}
      </div>

      {/* Contents / Shelf dropdown */}
      {showLibrary&&!snipMode&&(
        <div style={{flexShrink:0,borderBottom:"1px solid var(--border2)",maxHeight:220,overflowY:"auto",background:"rgba(139,105,20,0.02)"}}>
          {book.pages.map(function(p,i){
            var isActive = i===pg;
            return (
              <button key={i} onClick={()=>{setShowLibrary(false);setPg(i);setTimeout(function(){var el=document.getElementById('read-section-'+i);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});},60);}}
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"7px 16px",border:"none",borderBottom:"1px solid rgba(139,105,20,0.06)",background:isActive?"rgba(139,105,20,0.08)":"transparent",cursor:"pointer",textAlign:"left",boxSizing:"border-box"}}
                onMouseEnter={e=>{if(!isActive)e.currentTarget.style.background="rgba(139,105,20,0.04)";}}
                onMouseLeave={e=>{if(!isActive)e.currentTarget.style.background="transparent";}}>
                <span className="font-sans" style={{fontSize:12,color:isActive?"var(--amber)":"var(--text)",fontWeight:isActive?600:400}}>{p.chapter}</span>
                <span className="font-sans" style={{fontSize:10,color:"rgba(139,105,20,0.4)",flexShrink:0,marginLeft:8}}>{i+1}/{book.pages.length}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Text container + Snip overlay wrapper */}
      <div style={{flex:1,minHeight:0,position:"relative",overflow:"hidden"}}>

        {/* Highlight mode toggle — bottom left */}
        <div style={{position:"absolute",bottom:16,left:16,zIndex:20,display:"flex",gap:4}}>
          {[
            { mode:'passage', title:'Passage mode - click anywhere in a passage to capture it',
              icon: <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
                <line x1="0" y1="1.5" x2="15" y2="1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="0" y1="5.5" x2="15" y2="5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="0" y1="9.5" x2="11" y2="9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            },
            { mode:'line', title:'Line mode - highlight lines or words to capture them',
              icon: <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
                <line x1="2" y1="5.5" x2="13" y2="5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="2" y1="5.5" x2="6" y2="5.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.5"/>
              </svg>
            },
          ].map(function(opt){
            var active = highlightMode === opt.mode;
            return (
              <button key={opt.mode} title={opt.title}
                onClick={function(){ setHighlightMode(opt.mode); setSelRects(null); setSelText(''); setSelComment(''); }}
                style={{display:"flex",alignItems:"center",justifyContent:"center",width:30,height:30,borderRadius:8,border:"1px solid var(--border)",background:active?"var(--amber2)":"var(--card)",color:active?"var(--amber)":"var(--text2)",cursor:"pointer",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",transition:"background 0.15s,color 0.15s"}}>
                {opt.icon}
              </button>
            );
          })}
        </div>

        <div ref={textContainerRef} className="panel-scroll reading-scroll"
          style={{position:"absolute",inset:0,overflowY:"auto",padding:"0 0 80px",userSelect:"text"}} data-no-cube-drag="1">
          <div style={{margin:"0 10%"}}>
            {book.pages.map(function(pgItem, pgIdx) {
              if (pgItem.html) {
                /* EPUB HTML — render as-is with Gutenberg CSS */
                return (
                  <div key={pgIdx} id={"read-section-"+pgIdx} style={{position:"relative"}}>
                    <div className="epub-body" dangerouslySetInnerHTML={{__html: pgItem.html}}/>
                  </div>
                );
              }
              /* Fallback: plain text (pre-bundled or text-parsed books) */
              var prevChapter = pgIdx > 0 ? book.pages[pgIdx-1].chapter : null;
              var showHeading = pgIdx === 0 || pgItem.chapter !== prevChapter;
              var paras = (pgItem.text||"").split("\n\n");
              return (
                <div key={pgIdx} id={"read-section-"+pgIdx} style={{marginTop:pgIdx===0?"0":"4em", position:"relative"}}>
                  {showHeading && (
                    <h2 style={{textAlign:"center",fontFamily:"Georgia,'Times New Roman',serif",fontSize:"150%",fontWeight:"normal",fontStyle:"normal",lineHeight:1.5,marginTop:pgIdx===0?"1em":"0",marginBottom:"1em",color:"var(--text)"}}>
                      {pgItem.chapter}
                    </h2>
                  )}
                  {paras.map(function(para, pi) {
                    var firstAfterHeading = showHeading && pi === 0;
                    return (
                      <p key={pi}
                        data-passage-id={book.id+"_p"+pgIdx+"_i"+pi}
                        style={{fontFamily:"Georgia,'Times New Roman',serif",fontSize:17,lineHeight:1.7,marginTop:"0.25em",marginBottom:"0.25em",textIndent:firstAfterHeading?"0":"1em",color:"var(--text)",textAlign:"justify"}}>
                        {para}
                      </p>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        {(function(){
          if(!selRects || !selRects.length) return null;
          var bBottom = selRects.reduce(function(m,r){return Math.max(m,r.top+r.height);},0);
          var isDark = !!document.querySelector('.dark');
          /* Portal renders outside any CSS transform ancestor so position:fixed works correctly.
             Wrap in .dark class so CSS variables resolve correctly in dark mode. */
          return ReactDOM.createPortal(
            <div className={isDark?"dark":""}>
              <svg style={{position:'fixed',inset:0,width:'100vw',height:'100vh',zIndex:1200,pointerEvents:'none',overflow:'visible'}}>
                <defs>
                  <mask id="sel-spotlight-mask">
                    <rect width="100%" height="100%" fill="white"/>
                    {selRects.map(function(r,i){
                      return <rect key={i} x={r.left} y={r.top} width={r.width} height={r.height} fill="black"/>;
                    })}
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.88)" mask="url(#sel-spotlight-mask)"/>
              </svg>
              {selRects.map(function(r,i){
                return <div key={i} style={{position:'fixed',left:r.left,top:r.top,width:r.width,height:r.height,border:'1.5px dashed rgba(139,105,20,0.85)',boxSizing:'border-box',zIndex:1201,pointerEvents:'none'}}/>;
              })}
              <div ref={selPanelRef} style={{position:'fixed',left:16,right:16,top:Math.min(bBottom+12, window.innerHeight-160),zIndex:1202,borderRadius:3,border:'1px solid var(--border)',background:'var(--card)',boxShadow:'0 4px 24px rgba(0,0,0,0.28)',overflow:'hidden'}}>
                <div style={{padding:'10px 14px 10px 26px',position:'relative'}}>
                  <div style={{position:'absolute',left:16,top:0,bottom:0,width:3,background:'var(--amber)',borderRadius:1}}/>
                  <textarea
                    autoFocus
                    value={selComment}
                    onChange={function(e){setSelComment(e.target.value);}}
                    placeholder="what do you think and feel about this?"
                    style={{width:'100%',border:'none',outline:'none',resize:'none',background:'transparent',fontSize:14,lineHeight:1.55,color:'var(--text)',fontFamily:"'Kalam',cursive",minHeight:52,boxSizing:'border-box',display:'block'}}
                  />
                  {(function(){
                    var wc = selComment.trim()==='' ? 0 : selComment.trim().split(/\s+/).filter(Boolean).length;
                    return selComment.trim().length > 0 && wc < 10 ? (
                      <p className="font-sans" style={{fontSize:11,color:'rgba(139,105,20,0.65)',fontStyle:'italic',margin:'2px 0 4px',letterSpacing:'0.01em'}}>
                        a little more letters might find you a close reader
                      </p>
                    ) : null;
                  })()}
                  <div style={{display:'flex',justifyContent:'flex-end',marginTop:4}}>
                    <button onClick={handleSelSave} className="font-sans"
                      style={{padding:'5px 16px',borderRadius:20,border:'none',background:'var(--amber)',fontSize:11,fontWeight:600,color:'var(--bg)',cursor:'pointer',letterSpacing:'0.04em'}}>
                      save moment{selComment.length>0?'o':''}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          );
        })()}
        {ReactDOM.createPortal(
          <div style={{
            position:'fixed', bottom:28, left:'50%',
            transform:'translateX(-50%) translateY('+(shortInterpToast?'0px':'20px')+')',
            opacity: shortInterpToast ? 1 : 0,
            pointerEvents: shortInterpToast ? 'auto' : 'none',
            transition:'opacity 360ms ease, transform 360ms ease',
            zIndex:9999,
            background:'linear-gradient(135deg, #1C1209 0%, #2C1A08 100%)',
            border:'1px solid rgba(196,160,85,0.35)',
            borderRadius:16, padding:'12px 20px',
            boxShadow:'0 8px 32px rgba(0,0,0,0.32)',
            maxWidth:'min(420px, calc(100vw - 48px))', textAlign:'center',
          }}>
            <p className="font-sans" style={{margin:0,fontSize:13,lineHeight:1.55,color:'rgba(248,242,228,0.92)'}}>
              momento won't be used for finding close reader due to length
            </p>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
