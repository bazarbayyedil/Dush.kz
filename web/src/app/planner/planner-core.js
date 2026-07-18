

export function mountPlanner(root, ALTS){
  const $ = (id) => root.querySelector("#"+id);
  const WALL=100, SNAP=170, GRID=50, CLEAR=650, DOOR_W=800;
  const LABEL={bath:'Ванна',shower:'Душ',vanity:'Тумба',wc:'Унитаз',mirror:'Зеркало',
             sink:'Раковина',tall:'Пенал',bidet:'Биде'};
  const FILL={bath:'ceramic',shower:'glass',vanity:'wood',wc:'ceramic',mirror:'mirror',
            sink:'ceramic',tall:'wood',bidet:'ceramic'};
  const STYLE={
    ceramic:{f:'var(--ceramic)',s:'var(--ink)'},
    glass:{f:'none',s:'var(--accent)',d:'6 3'},
    wood:{f:'var(--accent-soft)',s:'var(--ink)'},
    mirror:{f:'var(--ink-soft)',s:'var(--ink-soft)'}
  };
  const DEFAULT_IDX={bath:10,shower:12,vanity:16,wc:12,mirror:8,sink:12,tall:8,bidet:6};
  const FIXED=[{n:'Смеситель для раковины ESKO Colombo',b:'ESKO',p:39440,need:'vanity'},
             {n:'Гигиенический душ Lemark LM8127C',b:'LE MARK',p:31200,need:'bidet'},
               {n:'Излив для ванны GROHE',b:'Grohe',p:47800,need:'bath'},
               {n:'Душевая система Lemark Linara LM 0460 C',b:'LE MARK',p:103906,need:'shower'}];

  const SHAPES={
    rect:  [[0,0],[3600,0],[3600,2800],[0,2800]],
    l:     [[0,0],[3600,0],[3600,1600],[2100,1600],[2100,3000],[0,3000]],
    niche: [[0,0],[3600,0],[3600,2800],[900,2800],[900,2200],[0,2200]]
  };

  const svg=$("plan"), notesEl=$("notes");
  const itemsEl=$("items"), totalEl=$("total");
  const altsEl=$("alts");
  const selPanel=$("selPanel"), selTitle=$("selTitle");

  let poly=SHAPES.rect.map(p=>({x:p[0],y:p[1]}));
  let items=[], sel=null, view=null, uid=1;
  let door={seg:0,t:0.6};

  // ---------- геометрия ----------
  const bbox=()=>{const xs=poly.map(p=>p.x),ys=poly.map(p=>p.y);
    return {x0:Math.min(...xs),y0:Math.min(...ys),x1:Math.max(...xs),y1:Math.max(...ys)};};
  function area(){ let a=0; for(let i=0;i<poly.length;i++){const j=(i+1)%poly.length;
    a+=poly[i].x*poly[j].y-poly[j].x*poly[i].y;} return Math.abs(a)/2; }
  function inPoly(x,y){ let c=false;
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const a=poly[i],b=poly[j];
      if((a.y>y)!==(b.y>y) && x < (b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x) c=!c; }
    return c; }
  const seg=(p,q,r,s)=>{ // пересечение отрезков
    const d=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
    const d1=d(r,s,p),d2=d(r,s,q),d3=d(p,q,r),d4=d(p,q,s);
    return ((d1>0&&d2<0)||(d1<0&&d2>0))&&((d3>0&&d4<0)||(d3<0&&d4>0)); };
  function rectInside(r){
    const eps=1;
    const cs=[[r.x+eps,r.y+eps],[r.x+r.w-eps,r.y+eps],[r.x+r.w-eps,r.y+r.h-eps],[r.x+eps,r.y+r.h-eps]];
    if(!cs.every(c=>inPoly(c[0],c[1]))) return false;
    const edges=[[cs[0],cs[1]],[cs[1],cs[2]],[cs[2],cs[3]],[cs[3],cs[0]]];
    for(let i=0;i<poly.length;i++){
      const a=poly[i],b=poly[(i+1)%poly.length];
      for(const [u,v] of edges) if(seg({x:u[0],y:u[1]},{x:v[0],y:v[1]},a,b)) return false;
    }
    return true;
  }
  const rectOf=it=>({x:it.x,y:it.y,w:it.rot?it.prod.W:it.prod.L,h:it.rot?it.prod.L:it.prod.W});
  const hit=(a,b)=>a.x<b.x+b.w-1&&b.x<a.x+a.w-1&&a.y<b.y+b.h-1&&b.y<a.y+a.h-1;

  function problems(){
    const m=new Map();
    items.forEach(it=>{
      const r=rectOf(it), bad=[];
      if(!rectInside(r)) bad.push('не помещается в стены');
      items.forEach(o=>{ if(o!==it && o.key!=='mirror' && it.key!=='mirror' && hit(r,rectOf(o)))
        bad.push('пересекается с «'+LABEL[o.key]+'»'); });
      const d=doorRect();
      if(d && it.key!=='mirror' && hit(r,d)) bad.push('перекрывает дверь');
      if(bad.length) m.set(it.id,bad);
    });
    return m;
  }

  // ---------- дверь ----------
  function segInfo(i){
    const a=poly[i], b=poly[(i+1)%poly.length];
    const len=Math.hypot(b.x-a.x,b.y-a.y);
    return {a,b,len,ux:(b.x-a.x)/len,uy:(b.y-a.y)/len};
  }
  function doorPos(){
    const s=segInfo(door.seg);
    const w=Math.min(DOOR_W,s.len);
    const start=Math.max(0,Math.min(s.len-w,door.t*s.len-w/2));
    return {s,w,x1:s.a.x+s.ux*start, y1:s.a.y+s.uy*start,
            x2:s.a.x+s.ux*(start+w), y2:s.a.y+s.uy*(start+w)};
  }
  function doorRect(){ // зона открывания внутрь
    const d=doorPos(), inx=-d.s.uy, iny=d.s.ux; // нормаль
    const cx=(d.x1+d.x2)/2+inx*1, cy=(d.y1+d.y2)/2+iny*1;
    const sign=inPoly(cx+inx*50,cy+iny*50)?1:-1;
    const nx=inx*sign, ny=iny*sign;
    const xs=[d.x1,d.x2,d.x1+nx*d.w,d.x2+nx*d.w], ys=[d.y1,d.y2,d.y1+ny*d.w,d.y2+ny*d.w];
    return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
  }

  // ---------- добавление ----------
  function freeSpot(prod){
    const bb=bbox();
    const free=r=>rectInside(r)&&!items.some(o=>o.key!=='mirror'&&hit(r,rectOf(o)))
      &&!hit(r,doorRect()||{x:0,y:0,w:0,h:0});
    // Сначала пробуем прижать к стенам — так расставляют в жизни, и проходы
    // остаются посередине. Сплошной перебор только если у стен места нет.
    const tries=[];
    for(let i=0;i<poly.length;i++){
      const a=poly[i], b=poly[(i+1)%poly.length];
      const len=Math.hypot(b.x-a.x,b.y-a.y); if(len<200) continue;
      const ux=(b.x-a.x)/len, uy=(b.y-a.y)/len;
      const nx=-uy, ny=ux;
      const inward=inPoly((a.x+b.x)/2+nx*60,(a.y+b.y)/2+ny*60)?1:-1;
      for(let t=0;t<=len;t+=100){
        const px=a.x+ux*t, py=a.y+uy*t;
        for(const [w,h] of [[prod.L,prod.W],[prod.W,prod.L]]){
          const cx=px+nx*inward*h/2, cy=py+ny*inward*h/2;
          tries.push({x:Math.round((cx-w/2)/50)*50, y:Math.round((cy-h/2)/50)*50, w, h,
                      rot:w===prod.W?1:0});
        }
      }
    }
    for(const t of tries) if(free({x:t.x,y:t.y,w:t.w,h:t.h})) return {x:t.x,y:t.y,rot:t.rot};
    for(let y=bb.y0;y<=bb.y1-prod.W;y+=100)
      for(let x=bb.x0;x<=bb.x1-prod.L;x+=100){
        const r={x,y,w:prod.L,h:prod.W};
        if(free(r)) return {x,y,rot:0};
      }
    return {x:bb.x0,y:bb.y0,rot:0};
  }
  function add(key){
    const prod=ALTS[key][DEFAULT_IDX[key]];
    const spot=freeSpot(prod);
    const it={id:uid++,key,prod,x:spot.x,y:spot.y,rot:spot.rot||0};
    items.push(it); sel=it.id; render();
  }

  // ---------- отрисовка ----------
  function render(){
    const bb=bbox(), W=bb.x1-bb.x0, H=bb.y1-bb.y0;
    const PAD=90, VW=1000, VH=700;
    const s=Math.min((VW-PAD*2)/(W+WALL*2),(VH-PAD*2)/(H+WALL*2));
    const ox=(VW-(W+WALL*2)*s)/2+WALL*s-bb.x0*s, oy=(VH-(H+WALL*2)*s)/2+WALL*s-bb.y0*s;
    view={s,ox,oy};
    const X=v=>ox+v*s, Y=v=>oy+v*s, S=v=>v*s;
    const bad=problems();
    const P=[];

    P.push(`<defs>
      <pattern id="hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="7" stroke="var(--line-strong)" stroke-width="1.1"/></pattern>
      <pattern id="grid" width="${S(100)}" height="${S(100)}" patternUnits="userSpaceOnUse">
        <path d="M ${S(100)} 0 L 0 0 0 ${S(100)}" fill="none" stroke="var(--line)" stroke-width=".6"/></pattern>
      <marker id="ar" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto">
        <path d="M0,0 L8,3 L0,6" fill="none" stroke="var(--line-strong)" stroke-width="1.1"/></marker>
      <marker id="arS" markerWidth="9" markerHeight="9" refX="1" refY="3" orient="auto">
        <path d="M8,0 L0,3 L8,6" fill="none" stroke="var(--line-strong)" stroke-width="1.1"/></marker>
      <clipPath id="room"><path d="${path()}"/></clipPath>
    </defs>`);
    function path(){ return poly.map((p,i)=>`${i?'L':'M'} ${X(p.x)} ${Y(p.y)}`).join(' ')+' Z'; }

    P.push(`<path d="${path()}" fill="none" stroke="url(#hatch)" stroke-width="${S(WALL)*2}"/>`);
    P.push(`<path d="${path()}" fill="none" stroke="var(--ink)" stroke-width="${S(WALL)*2}" stroke-opacity=".13"/>`);
    P.push(`<path d="${path()}" fill="var(--card)" stroke="var(--ink)" stroke-width="1.3"/>`);
    P.push(`<rect x="0" y="0" width="1000" height="700" fill="url(#grid)" clip-path="url(#room)"/>`);

    // дверь
    const d=doorPos();
    P.push(`<line x1="${X(d.x1)}" y1="${Y(d.y1)}" x2="${X(d.x2)}" y2="${Y(d.y2)}" stroke="var(--card)" stroke-width="${S(WALL)*2}"/>`);
    const dr=doorRect();
    P.push(`<rect x="${X(dr.x)}" y="${Y(dr.y)}" width="${S(dr.w)}" height="${S(dr.h)}" fill="var(--accent)" fill-opacity=".05" stroke="var(--line-strong)" stroke-width="1" stroke-dasharray="4 4"/>`);
    P.push(`<line class="door" x1="${X(d.x1)}" y1="${Y(d.y1)}" x2="${X(d.x2)}" y2="${Y(d.y2)}" stroke="var(--accent)" stroke-width="5" stroke-linecap="round"/>`);
    P.push(`<line class="door" x1="${X(d.x1)}" y1="${Y(d.y1)}" x2="${X(d.x2)}" y2="${Y(d.y2)}" stroke="transparent" stroke-width="22"/>`);

    // предметы
    items.forEach(it=>{
      const r=rectOf(it), isBad=bad.has(it.id), isSel=sel===it.id, st=STYLE[FILL[it.key]];
      if(it.key==='bath'&&!isBad&&S(r.w)>60&&S(r.h)>40)
        P.push(`<rect x="${X(r.x+60)}" y="${Y(r.y+60)}" width="${S(r.w-120)}" height="${S(r.h-120)}" rx="${S(80)}" fill="none" stroke="var(--line-strong)" stroke-width="1"/>`);
      P.push(`<rect class="fixture" data-id="${it.id}" x="${X(r.x)}" y="${Y(r.y)}" width="${S(r.w)}" height="${S(r.h)}"
        fill="${isBad?'var(--warn-soft)':st.f}" stroke="${isBad?'var(--warn)':(isSel?'var(--accent)':st.s)}"
        stroke-width="${isSel||isBad?2.4:1.6}" ${st.d&&!isBad?`stroke-dasharray="${st.d}"`:''}/>`);
      if(S(r.w)>54&&S(r.h)>22){
        const c=isBad?'var(--warn)':'var(--ink)';
        P.push(`<text x="${X(r.x+r.w/2)}" y="${Y(r.y+r.h/2)-3}" text-anchor="middle" font-size="12" font-weight="500" fill="${c}" pointer-events="none">${LABEL[it.key]}</text>`);
        P.push(`<text x="${X(r.x+r.w/2)}" y="${Y(r.y+r.h/2)+12}" text-anchor="middle" font-size="10.5" fill="${isBad?'var(--warn)':'var(--ink-soft)'}" pointer-events="none" font-family="ui-monospace,Menlo,monospace">${r.w}×${r.h}</text>`);
      }
    });

    // размеры сторон
    poly.forEach((p,i)=>{
      const q=poly[(i+1)%poly.length];
      const len=Math.round(Math.hypot(q.x-p.x,q.y-p.y));
      if(len<400) return;
      const mx=X((p.x+q.x)/2), my=Y((p.y+q.y)/2);
      const nx=-(q.y-p.y)/len, ny=(q.x-p.x)/len;
      const inside=inPoly((p.x+q.x)/2+nx*80,(p.y+q.y)/2+ny*80);
      const off=inside?-30:30;
      P.push(`<rect x="${mx+nx*off-24}" y="${my+ny*off-8}" width="48" height="16" rx="2" fill="var(--card)" stroke="var(--line)" stroke-width=".7"/>`);
      P.push(`<text x="${mx+nx*off}" y="${my+ny*off+4}" text-anchor="middle" font-size="11" fill="var(--ink-soft)" font-family="ui-monospace,Menlo,monospace">${len}</text>`);
    });

    // ручки углов
    poly.forEach((p,i)=>{
      P.push(`<circle class="vh" data-i="${i}" cx="${X(p.x)}" cy="${Y(p.y)}" r="7" fill="var(--card)" stroke="var(--accent)" stroke-width="2"/>`);
    });

    svg.innerHTML=P.join('');

    // заметки
    const notes=[];
    if(!items.length) notes.push(['ok','Комната пустая. Добавьте, что нужно — по одному.']);
    else if(!bad.size) notes.push(['ok','Всё встаёт: пересечений нет, дверь открывается.']);
    bad.forEach((list,id)=>{ const it=items.find(x=>x.id===id);
      notes.push(['warn',`«${LABEL[it.key]}» — ${list[0]}.`]); });
    const has=k=>items.some(i=>i.key===k);
    if(has('bath')&&has('shower')&&!bad.size) notes.push(['ok','Ванна и душ поместились вместе.']);
    notesEl.innerHTML=notes.map(([k,t])=>`<div class="note ${k}"><span class="dot"></span><span>${t}</span></div>`).join('');

    renderItems(bad); renderSel();
    if(typeof syncInputs==='function'){ syncInputs(); syncBudget(); }
  }

  function fmt(n){return n.toLocaleString('ru-RU').replace(/ /g,' ');}

  function renderItems(bad){
    if(!items.length){ itemsEl.innerHTML='<tr><td colspan="2" class="empty">Пока ничего не добавлено</td></tr>';
      totalEl.textContent='0 ₸'; return; }
    const rows=items.map(it=>{
      const st=STYLE[FILL[it.key]], isBad=bad.has(it.id);
      return `<tr class="pickable ${sel===it.id?'sel':''}" data-id="${it.id}">
        <td><span class="swatch" style="background:${isBad?'var(--warn-soft)':(st.f==='none'?'transparent':st.f)}"></span>
          <span style="font-weight:500">${it.prod.n}</span><br>
          <span class="item-meta mono" style="padding-left:16px">${it.prod.L}×${it.prod.W} мм · ${it.prod.b}${it.rot?' · повёрнут':''}</span></td>
        <td class="num mono">${fmt(it.prod.p)} ₸</td></tr>`;
    });
    const extra=FIXED.filter(f=>items.some(i=>i.key===f.need)).map(f=>
      `<tr><td><span class="swatch" style="background:transparent;border-color:var(--line)"></span>
        <span style="font-weight:500">${f.n}</span><br><span class="item-meta mono" style="padding-left:16px">${f.b}</span></td>
        <td class="num mono">${fmt(f.p)} ₸</td></tr>`);
    itemsEl.innerHTML=rows.concat(extra).join('');
    itemsEl.querySelectorAll('tr.pickable').forEach(tr=>tr.addEventListener('click',()=>{
      sel=(sel===+tr.dataset.id?null:+tr.dataset.id); render(); }));
    const total=items.reduce((s,i)=>s+i.prod.p,0)
      + FIXED.filter(f=>items.some(i=>i.key===f.need)).reduce((s,f)=>s+f.p,0);
    totalEl.textContent=fmt(total)+' ₸';
  }

  function fitCheck(it,prod,broken){
    const r={x:it.x,y:it.y,w:it.rot?prod.W:prod.L,h:it.rot?prod.L:prod.W};
    if(!rectInside(r)) return 'no';
    const clash=items.some(o=>o!==it&&o.key!=='mirror'&&it.key!=='mirror'&&!broken.has(o.id)&&hit(r,rectOf(o)));
    return clash?'room':'here';
  }

  function renderSel(){
    const it=items.find(x=>x.id===sel);
    if(!it){ selPanel.hidden=true; return; }
    selPanel.hidden=false;
    selTitle.textContent=LABEL[it.key]+' · замена';
    const pool=ALTS[it.key]||[], broken=problems(), rank={here:0,room:1,no:2};
    const rows=pool.map(p=>({p,fit:fitCheck(it,p,broken),cur:p.s===it.prod.s}))
      .sort((a,b)=>(rank[a.fit]-rank[b.fit])||(a.p.p-b.p.p));
    const nH=rows.filter(r=>r.fit==='here').length, nR=rows.filter(r=>r.fit==='room').length;
    const head=nH?`Встают сюда: ${nH}`+(nR?` · ещё ${nR}, если подвинуть соседние`:'')
      :(nR?`Сюда не встаёт ничего. ${nR} подойдут, если подвинуть соседние.`
          :'Ни один вариант не помещается — попробуйте повернуть или сдвинуть.');
    altsEl.innerHTML=`<div class="empty" style="border-bottom:1px solid var(--line)">${head}</div>`+
      rows.map(({p,fit,cur})=>{
        const dd=p.p-it.prod.p;
        const t=cur?'текущий':(dd===0?'—':(dd>0?'+':'−')+fmt(Math.abs(dd))+' ₸');
        const tag=fit==='here'?'':(fit==='room'?' · нужно подвинуть соседние':' · не влезает');
        return `<button class="alt ${cur?'current':''}" ${fit==='no'?'disabled':''} data-slug="${p.s}">
          <span class="an">${p.n}</span><span class="ap mono">${fmt(p.p)} ₸</span>
          <span class="am mono">${p.L}×${p.W} мм · ${p.b}${tag}</span>
          <span class="ad mono ${cur?'':(dd>0?'up':(dd<0?'down':''))}">${t}</span></button>`;
      }).join('');
    altsEl.querySelectorAll('.alt:not([disabled])').forEach(b=>b.addEventListener('click',()=>{
      it.prod=pool.find(x=>x.s===b.dataset.slug); render(); }));
  }

  // ---------- взаимодействие ----------
  const toMM=e=>{const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;
    const u=pt.matrixTransform(svg.getScreenCTM().inverse());
    return {x:(u.x-view.ox)/view.s,y:(u.y-view.oy)/view.s};};
  const snapG=v=>Math.round(v/GRID)*GRID;
  let drag=null;

  svg.addEventListener('pointerdown',e=>{
    const vh=e.target.closest('.vh');
    if(vh){ drag={type:'vertex',i:+vh.dataset.i}; svg.setPointerCapture(e.pointerId); return; }
    const dr=e.target.closest('.door');
    if(dr){ drag={type:'door'}; svg.setPointerCapture(e.pointerId); return; }
    const fx=e.target.closest('.fixture');
    if(fx){ const it=items.find(x=>x.id===+fx.dataset.id); const m=toMM(e);
      sel=it.id; drag={type:'item',it,dx:m.x-it.x,dy:m.y-it.y}; svg.setPointerCapture(e.pointerId); render(); return; }
    sel=null; render();
  });

  svg.addEventListener('pointermove',e=>{
    if(!drag) return;
    const m=toMM(e);
    if(drag.type==='vertex'){
      const i=drag.i, p=poly[i], prev=poly[(i-1+poly.length)%poly.length], next=poly[(i+1)%poly.length];
      const nx=snapG(m.x), ny=snapG(m.y);
      if(Math.abs(prev.x-p.x)<1) prev.x=nx; else if(Math.abs(prev.y-p.y)<1) prev.y=ny;
      if(Math.abs(next.x-p.x)<1) next.x=nx; else if(Math.abs(next.y-p.y)<1) next.y=ny;
      p.x=nx; p.y=ny; render(); return;
    }
    if(drag.type==='door'){
      let best=null;
      poly.forEach((p,i)=>{
        const q=poly[(i+1)%poly.length], len=Math.hypot(q.x-p.x,q.y-p.y);
        if(len<DOOR_W*0.6) return;
        const t=Math.max(0,Math.min(1,((m.x-p.x)*(q.x-p.x)+(m.y-p.y)*(q.y-p.y))/(len*len)));
        const px=p.x+(q.x-p.x)*t, py=p.y+(q.y-p.y)*t, d=Math.hypot(m.x-px,m.y-py);
        if(!best||d<best.d) best={d,i,t};
      });
      if(best){ door.seg=best.i; door.t=best.t; render(); }
      return;
    }
    const r=rectOf(drag.it), bb=bbox();
    let x=snapG(m.x-drag.dx), y=snapG(m.y-drag.dy);
    if(x-bb.x0<SNAP) x=bb.x0; if(bb.x1-(x+r.w)<SNAP) x=bb.x1-r.w;
    if(y-bb.y0<SNAP) y=bb.y0; if(bb.y1-(y+r.h)<SNAP) y=bb.y1-r.h;
    drag.it.x=x; drag.it.y=y; render();
  });
  const stop=()=>{ if(drag){drag=null; render();} };
  svg.addEventListener('pointerup',stop); svg.addEventListener('pointercancel',stop);

  root.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>add(b.dataset.add)));
  root.querySelectorAll('[data-shape]').forEach(b=>b.addEventListener('click',()=>{
    poly=SHAPES[b.dataset.shape].map(p=>({x:p[0],y:p[1]}));
    door={seg:0,t:0.6};
    items.forEach(it=>{const sp=freeSpot(it.prod); it.x=sp.x; it.y=sp.y; it.rot=sp.rot||0;});
    root.querySelectorAll('[data-shape]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    render();
  }));
  $("rot").addEventListener('click',()=>{
    const it=items.find(x=>x.id===sel); if(!it) return; it.rot=it.rot?0:1; render(); });
  $("del").addEventListener('click',()=>{
    items=items.filter(x=>x.id!==sel); sel=null; render(); });

  root.addEventListener('keydown',e=>{
    if(e.key==='Escape'){sel=null;render();return;}
    if(e.key==='r'||e.key==='R'||e.key==='к'||e.key==='К'){
      const it=items.find(x=>x.id===sel); if(it){it.rot=it.rot?0:1;render();} return; }
    if(!sel||!e.key.startsWith('Arrow')) return;
    e.preventDefault();
    const it=items.find(x=>x.id===sel), st=e.shiftKey?100:GRID;
    if(e.key==='ArrowLeft')it.x-=st; if(e.key==='ArrowRight')it.x+=st;
    if(e.key==='ArrowUp')it.y-=st; if(e.key==='ArrowDown')it.y+=st;
    render();
  });


  // ---------- ввод размеров ----------
  const rwEl=$("rw"), rhEl=$("rh"), rmEl=$("rm");
  let syncing=false;
  function syncInputs(){
    syncing=true;
    const bb=bbox();
    rwEl.value=Math.round(bb.x1-bb.x0);
    rhEl.value=Math.round(bb.y1-bb.y0);
    rmEl.value=(area()/1e6).toFixed(2);
    syncing=false;
  }
  function scalePoly(kx,ky){
    const bb=bbox();
    poly.forEach(p=>{ p.x=Math.round((bb.x0+(p.x-bb.x0)*kx)/10)*10;
                      p.y=Math.round((bb.y0+(p.y-bb.y0)*ky)/10)*10; });
    items.forEach(it=>{const sp=freeSpot(it.prod); it.x=sp.x; it.y=sp.y; it.rot=sp.rot||0;});
  }
  function onSize(){
    if(syncing) return;
    const bb=bbox(), W=bb.x1-bb.x0, H=bb.y1-bb.y0;
    const nw=Math.max(1200,Math.min(8000,+rwEl.value||W));
    const nh=Math.max(1200,Math.min(8000,+rhEl.value||H));
    scalePoly(nw/W, nh/H); render();
  }
  function onArea(){
    if(syncing) return;
    const want=Math.max(2,Math.min(40,+rmEl.value||0))*1e6;
    const k=Math.sqrt(want/area());
    if(isFinite(k)&&k>0) { scalePoly(k,k); render(); }
  }
  rwEl.addEventListener('change',onSize); rhEl.addEventListener('change',onSize);
  rmEl.addEventListener('change',onArea);

  // ---------- бюджет ----------
  const bs=$("bslider"), bval=$("bval");
  const bmin=$("bmin"), bmax=$("bmax"), bnote=$("bnote");

  function optionsFor(it){
    // варианты, которые помещаются на текущее место (или хотя бы в комнату)
    const broken=problems();
    return (ALTS[it.key]||[]).map(p=>({p,fit:fitCheck(it,p,broken)}))
      .filter(o=>o.fit!=='no').map(o=>o.p).sort((a,b)=>a.p-b.p);
  }
  function bounds(){
    if(!items.length) return null;
    let lo=0,hi=0;
    for(const it of items){
      const o=optionsFor(it);
      if(!o.length) return null;
      lo+=o[0].p; hi+=o[o.length-1].p;
    }
    const acc=k=>FIXED.filter(f=>items.some(i=>i.key===f.need)).reduce((s,f)=>s+f.p,0);
    return {lo:lo+acc(), hi:hi+acc()};
  }
  function budgetValue(){
    const b=bounds(); if(!b) return null;
    return Math.round((b.lo+(b.hi-b.lo)*(+bs.value/100))/1000)*1000;
  }
  function syncBudget(){
    const b=bounds();
    if(!b){ bmin.textContent=bmax.textContent=''; bval.textContent='—';
      bnote.className='bnote'; bnote.textContent='Добавьте предметы — покажу, во что уложитесь.'; return; }
    bmin.textContent=fmt(b.lo)+' ₸'; bmax.textContent=fmt(b.hi)+' ₸';
    const v=budgetValue(); bval.textContent=fmt(v)+' ₸';
    const cur=items.reduce((s,i)=>s+i.prod.p,0)
      + FIXED.filter(f=>items.some(i=>i.key===f.need)).reduce((s,f)=>s+f.p,0);
    if(cur>v){ bnote.className='bnote over'; bnote.textContent=`Собрано на ${fmt(cur)} ₸ — на ${fmt(cur-v)} ₸ дороже бюджета. Нажмите «Подобрать».`; }
    else { bnote.className='bnote ok'; bnote.textContent=`Собрано на ${fmt(cur)} ₸ — остаётся ${fmt(v-cur)} ₸.`; }
  }
  function fitBudget(){
    const b=bounds(); if(!b) return;
    const budget=budgetValue();
    const acc=FIXED.filter(f=>items.some(i=>i.key===f.need)).reduce((s,f)=>s+f.p,0);
    const opts=new Map(items.map(it=>[it.id,optionsFor(it)]));
    // старт с самого дешёвого, дальше жадно поднимаем то, что даёт лучший шаг
    items.forEach(it=>{ it.prod=opts.get(it.id)[0]; });
    let total=items.reduce((s,i)=>s+i.prod.p,0)+acc;
    if(total>budget){
      bnote.className='bnote over';
      bnote.textContent=`Дешевле ${fmt(total)} ₸ этот набор не собрать. Уберите предмет или увеличьте бюджет.`;
      render(); return;
    }
    let moved=true;
    while(moved){
      moved=false; let best=null;
      for(const it of items){
        const o=opts.get(it.id), i=o.findIndex(p=>p.s===it.prod.s);
        if(i<0||i+1>=o.length) continue;
        const step=o[i+1].p-it.prod.p;
        if(total+step<=budget && (!best||step>best.step)) best={it,next:o[i+1],step};
      }
      if(best){ best.it.prod=best.next; total+=best.step; moved=true; }
    }
    render();
  }
  bs.addEventListener('input',syncBudget);
  $("fitBudget").addEventListener('click',fitBudget);

  root.querySelector('[data-shape="rect"]').setAttribute('aria-pressed','true');
  ['wc','vanity'].forEach(add);
  sel=null; render();
  return () => {};
}
