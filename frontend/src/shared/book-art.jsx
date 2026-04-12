/* â”€â”€ COVER SVG GENERATOR â”€â”€ */
function makeShelfCoverSVG(b) {
  const W=100, H=152, cx=W/2;
  function wrap(t, max) {
    const ws=t.split(' '); const ls=[]; let c='';
    ws.forEach(w=>{ if((c+' '+w).trim().length>max&&c){ls.push(c);c=w;}else c=(c+' '+w).trim(); });
    if(c) ls.push(c); return ls;
  }
  function decoSVG(type, fg) {
    const cx2=W/2, cy=H/2, op=0.28;
    if(type==='axe')   return `<rect x="${cx2-3}" y="${cy-28}" width="6" height="50" rx="2.5" fill="${fg}" opacity="${op}"/><path d="M${cx2-3},${cy-20} Q${cx2-22},${cy-8} ${cx2-18},${cy+8} Q${cx2-3},${cy-2} ${cx2-3},${cy-20}Z" fill="${fg}" opacity="${op}"/>`;
    if(type==='cross') return `<rect x="${cx2-3}" y="${cy-30}" width="6" height="60" rx="1.5" fill="${fg}" opacity="${op}"/><rect x="${cx2-20}" y="${cy-13}" width="40" height="6" rx="1.5" fill="${fg}" opacity="${op}"/>`;
    if(type==='bird')  return `<path d="M${cx2-24},${cy-8} Q${cx2-9},${cy-28} ${cx2},${cy-14} Q${cx2+9},${cy-28} ${cx2+24},${cy-8}" fill="none" stroke="${fg}" stroke-width="2" opacity="${op}" stroke-linecap="round"/>`;
    if(type==='storm') return `<path d="M${cx2-12},${cy-28} L${cx2+8},${cy-4} L${cx2-4},${cy-4} L${cx2+16},${cy+22}" fill="none" stroke="${fg}" stroke-width="3.5" opacity="${op}" stroke-linecap="round" stroke-linejoin="round"/>`;
    if(type==='flower')return `${[0,72,144,216,288].map(a=>`<ellipse cx="${cx2+Math.cos(a*Math.PI/180)*13}" cy="${cy-8+Math.sin(a*Math.PI/180)*13}" rx="9" ry="5.5" fill="${fg}" opacity="${op}" transform="rotate(${a} ${cx2+Math.cos(a*Math.PI/180)*13} ${cy-8+Math.sin(a*Math.PI/180)*13})"/>`).join('')}<circle cx="${cx2}" cy="${cy-8}" r="6" fill="${fg}" opacity="${op}"/>`;
    return '';
  }
  let body = '';
  if(b.style==='typo'){
    const l=wrap(b.title,10), th=l.length*17, sy=H/2-th/2+16;
    body=`<rect x="14" y="${sy-18}" width="${W-28}" height="1.5" fill="${b.fg}" opacity="0.45"/>${l.map((t,i)=>`<text x="${cx}" y="${sy+i*17}" text-anchor="middle" font-family="Georgia,serif" font-size="14" font-weight="700" fill="${b.fg}" opacity="0.92">${t}</text>`).join('')}<rect x="14" y="${sy+th+2}" width="${W-28}" height="1.5" fill="${b.fg}" opacity="0.45"/><text x="${cx}" y="${H-14}" text-anchor="middle" font-family="Georgia,serif" font-size="6.5" fill="${b.fg}" opacity="0.55" letter-spacing="2.5">${b.author.toUpperCase()}</text>`;
  } else if(b.style==='bold'){
    const l=wrap(b.title,6), fs=l.length<=2?24:18, th=l.length*(fs+5), sy=H/2-th/2+fs;
    body=`<rect x="0" y="0" width="7" height="${H}" fill="${b.fg}" opacity="0.2"/>${l.map((t,i)=>`<text x="${cx}" y="${sy+i*(fs+5)}" text-anchor="middle" font-family="Georgia,serif" font-size="${fs}" font-weight="700" fill="rgba(255,255,255,0.95)">${t}</text>`).join('')}<text x="${cx}" y="${H-13}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="6.5" fill="${b.fg}" opacity="0.5" letter-spacing="1.8">${b.author.split(' ').pop().toUpperCase()}</text>`;
  } else if(b.style==='init'){
    const l=wrap(b.title,11);
    body=`<text x="${cx}" y="${H*0.68}" text-anchor="middle" font-family="Georgia,serif" font-size="96" font-weight="700" fill="${b.fg}" opacity="0.13">${b.title[0]}</text><rect x="14" y="${H-54}" width="${W-28}" height="1" fill="${b.fg}" opacity="0.3"/>${l.map((t,i)=>`<text x="${cx}" y="${H-40+(i*13)}" text-anchor="middle" font-family="Georgia,serif" font-size="10" font-weight="700" fill="rgba(255,255,255,0.93)">${t}</text>`).join('')}<text x="${cx}" y="${H-12}" text-anchor="middle" font-family="Georgia,serif" font-size="6.5" fill="${b.fg}" opacity="0.6">${b.author.split(' ').pop()}</text>`;
  } else if(b.style==='stripe'){
    const n=6, sh=H/n;
    body=`${Array.from({length:n},(_,i)=>`<rect x="0" y="${i*sh}" width="${W}" height="${sh}" fill="${i%2===0?b.bg:b.sp}"/>`).join('')}<rect x="0" y="0" width="${W}" height="${H}" fill="rgba(0,0,0,0.28)"/>${wrap(b.title,8).map((t,i,a)=>`<text x="${cx}" y="${H/2-(a.length-1)*8+i*16}" text-anchor="middle" font-family="Georgia,serif" font-size="13" font-weight="700" fill="rgba(255,255,255,0.95)">${t}</text>`).join('')}<text x="${cx}" y="${H-13}" text-anchor="middle" font-family="Georgia,serif" font-size="6.5" fill="${b.fg}" opacity="0.7">${b.author.split(' ').pop()}</text>`;
  } else if(b.style==='mini'){
    const l=wrap(b.title,13);
    body=`<rect x="${cx-20}" y="${H/2-22}" width="40" height="1" fill="${b.fg}" opacity="0.35"/>${l.map((t,i)=>`<text x="${cx}" y="${H/2+(i*13)}" text-anchor="middle" font-family="Georgia,serif" font-size="10" font-weight="400" font-style="italic" fill="${b.fg}" opacity="0.82">${t}</text>`).join('')}<rect x="${cx-20}" y="${H/2+(l.length*13)+4}" width="40" height="1" fill="${b.fg}" opacity="0.35"/><text x="${cx}" y="${H-14}" text-anchor="middle" font-family="Georgia,serif" font-size="6.5" fill="${b.fg}" opacity="0.45">${b.author.split(' ').pop()}</text>`;
  } else if(b.style==='illus'){
    const l=wrap(b.title,11), ty=H-36-(l.length-1)*13;
    body=`${decoSVG(b.deco,b.fg)}${l.map((t,i)=>`<text x="${cx}" y="${ty+i*13}" text-anchor="middle" font-family="Georgia,serif" font-size="10" font-weight="700" fill="rgba(255,255,255,0.93)">${t}</text>`).join('')}<text x="${cx}" y="${H-15}" text-anchor="middle" font-family="Georgia,serif" font-size="6.5" fill="${b.fg}" opacity="0.65">${b.author.split(' ').pop()}</text>`;
  }
  return `<svg width="100%" height="100%" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="scbg${b.id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${b.sp}"/><stop offset="8%" stop-color="${b.bg}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#scbg${b.id})"/>${body}</svg>`;
}

/* â”€â”€ SHELF COVER IMAGE â€” real cover with SVG fallback â”€â”€ */
function ShelfCoverImage({book, svgFallback}) {
  const [failed, setFailed] = useState(false);
  if(failed) return <div style={{width:"100%",height:"100%"}} dangerouslySetInnerHTML={{__html:svgFallback}}/>;
  return (
    <img
      src={book.cover}
      alt={book.title}
      onError={()=>setFailed(true)}
      style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",display:"block",borderRadius:"2px 3px 0 0"}}
    />
  );
}

/* â”€â”€ BOOK COVER MOSAIC â€” tiny tile used in profile drawer header â”€â”€ */
function BookCoverMosaic({book}) {
  const [failed, setFailed] = useState(false);
  if(failed || !book.cover) {
    return <div style={{width:"100%",height:"100%",overflow:"hidden"}} dangerouslySetInnerHTML={{__html:makeShelfCoverSVG(book)}}/>;
  }
  return (
    <img
      src={book.cover}
      alt={book.title}
      onError={()=>setFailed(true)}
      style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",display:"block"}}
    />
  );
}
