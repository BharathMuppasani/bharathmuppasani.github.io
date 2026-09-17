/* ===== tiny helpers ===== */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const el = (t,c,h)=>{const n=document.createElement(t); if(c)n.className=c; if(h!=null)n.innerHTML=h; return n;};
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const byId = id => ALL().find(p=>p.id===id);

/* ===== persistence ===== */
const KEY='hetrobots.library.v2';
let STORE = (()=>{ try{return JSON.parse(localStorage.getItem(KEY))||{notes:{},added:[]};}
                   catch(e){return {notes:{},added:[]};} })();
STORE.notes = STORE.notes||{}; STORE.added = STORE.added||[];
const save = ()=>{ try{localStorage.setItem(KEY,JSON.stringify(STORE));}catch(e){} };
/* working set = built-in papers + whatever you have added in this browser */
const ALL = ()=>[...PAPERS, ...STORE.added];
const note = id => STORE.notes[id]||'';

/* ===== theme ===== */
(function(){
  const saved=localStorage.getItem('hetrobots.theme');
  const t = saved || (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  document.documentElement.setAttribute('data-theme',t);
})();
function toggleTheme(){
  const n = document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',n);
  localStorage.setItem('hetrobots.theme',n);
  $('#themeBtn').textContent = n==='dark'?'☀ Light':'☾ Dark';
}

/* ===== tabs ===== */
function showTab(name,push=true){
  $$('nav.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===name));
  $$('.view').forEach(v=>v.classList.toggle('on',v.id==='v-'+name));
  if(push) history.replaceState(null,'','#'+name);
  window.scrollTo({top:0,behavior:'instant'});
}

/* ===== overview: heterogeneity -> application -> learning method ===== */
function chipFor(p){ return `<a class="pchip" href="#papers" data-goto="${p.id}" title="${esc(p.title)}">
  <b>${p.id}</b> ${esc((p.cite||p.authors||'').split(',')[0])} ${p.year}</a>`; }

function renderOverview(){
  const all=ALL();
  const het=all.filter(p=>p.het==='yes'), homo=all.filter(p=>p.het==='no'), unk=all.filter(p=>p.het==='unclear');

  /* 1. the split */
  $('#splitcards').innerHTML = [['yes',het],['no',homo],['unclear',unk]].map(([k,list])=>{
    const m=HET[k];
    return `<div class="card splitcard" style="border-left:4px solid ${m.color};margin:0">
      <div class="n" style="color:${m.color}">${list.length}</div>
      <div class="l">${m.label}</div>
      <div class="chiprow">${list.map(chipFor).join('')}</div></div>`;
  }).join('');

  /* 2. kinds of heterogeneity */
  $('#kindcards').innerHTML = ['physical','capability','role'].map(k=>{
    const list=het.filter(p=>p.hetKind===k), m=HETKIND[k];
    return `<div class="card" style="margin:0">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
        <h3 style="margin:0">${m.label}</h3><span class="small muted">${list.length}</span></div>
      <p class="small muted" style="margin:8px 0 10px">${m.blurb}</p>
      <div class="chiprow">${list.map(chipFor).join('')}</div></div>`;
  }).join('');

  /* 3. applications, heterogeneous papers only */
  const appOrder=Object.keys(APPS).filter(k=>het.some(p=>p.appKey===k))
    .sort((a,b)=>het.filter(p=>p.appKey===b).length-het.filter(p=>p.appKey===a).length);
  $('#appcards').innerHTML = appOrder.map(k=>{
    const list=het.filter(p=>p.appKey===k), m=APPS[k];
    const meths=[...new Set(list.map(p=>p.methodKey))];
    return `<div class="card appcard" style="margin:0;border-top:3px solid ${m.color}">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
        <h3 style="margin:0">${m.label}</h3><span class="bigcount" style="color:${m.color}">${list.length}</span></div>
      <p class="small muted" style="margin:7px 0 10px">${m.blurb}</p>
      <div class="chiprow">${list.map(chipFor).join('')}</div>
      <div class="small muted" style="margin-top:10px;padding-top:9px;border-top:1px dashed var(--border)">
        <b>Methods used here:</b> ${meths.map(x=>METHODS[x].short||METHODS[x].label).join(' · ')}</div>
    </div>`;
  }).join('');

  /* 4. learning methods, heterogeneous papers only */
  const mOrder=Object.keys(METHODS).filter(k=>het.some(p=>p.methodKey===k))
    .sort((a,b)=>het.filter(p=>p.methodKey===b).length-het.filter(p=>p.methodKey===a).length);
  $('#methodcards').innerHTML = mOrder.map(k=>{
    const list=het.filter(p=>p.methodKey===k), m=METHODS[k];
    return `<div class="card" style="margin:0;border-left:4px solid ${m.color}">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
        <h3 style="margin:0;font-size:14.5px">${m.label}</h3><span class="bigcount" style="color:${m.color}">${list.length}</span></div>
      <p class="small muted" style="margin:7px 0 10px">${m.blurb}</p>
      <div class="chiprow">${list.map(chipFor).join('')}</div></div>`;
  }).join('');

  /* 5. application x method cross-tab */
  const rows=appOrder, cols=mOrder;
  let h=`<table class="cross"><thead><tr><th style="min-width:210px">Application ╲ Method</th>${
    cols.map(c=>`<th class="ctr vert" title="${esc(METHODS[c].label)}"><span>${esc(METHODS[c].short||METHODS[c].label)}</span></th>`).join('')
  }<th class="ctr">Σ</th></tr></thead><tbody>`;
  rows.forEach(r=>{
    h+=`<tr><td><b>${APPS[r].label}</b></td>`;
    cols.forEach(c=>{
      const list=het.filter(p=>p.appKey===r&&p.methodKey===c);
      h+=`<td class="ctr">${list.length?`<span class="cell" title="${list.map(p=>p.id+' '+p.title).join(' | ')}">${list.map(p=>p.id).join('<br>')}</span>`:'<span class="dot">·</span>'}</td>`;
    });
    h+=`<td class="ctr"><b>${het.filter(p=>p.appKey===r).length}</b></td></tr>`;
  });
  h+=`<tr class="totals"><td><b>Σ</b></td>${cols.map(c=>`<td class="ctr"><b>${het.filter(p=>p.methodKey===c).length}</b></td>`).join('')}<td class="ctr"><b>${het.length}</b></td></tr>`;
  $('#crosstab').innerHTML=h+'</tbody></table>';

  /* 6. headline numbers */
  const learned=het.filter(p=>p.methodKey!=='none'&&p.methodKey!=='perception'&&p.methodKey!=='llm');
  const hw=het.filter(p=>/^Yes/.test(p.hardware));
  $('#obsnums').innerHTML=[
    [het.length+'/'+all.length,'papers use heterogeneous robots'],
    [learned.length,'of those learn something end-to-end'],
    [het.filter(p=>p.methodKey==='none').length,'use no learning at all'],
    [hw.length,'were run on real hardware'],
    [het.filter(p=>p.appKey==='alloc').length,'never leave abstract task instances'],
    [het.filter(p=>/gazebo/i.test(p.simulator)).length,'use Gazebo']
  ].map(([n,l])=>`<div class="stat"><div class="n">${n}</div><div class="l">${l}</div></div>`).join('');
}

/* ===== papers ===== */
let FILTER={q:'',tier:'',thread:'',flag:''};
function paperCard(p){
  const t=THREADS[p.thread];
  const node=el('article','paper'+(p.relevance===5?' lead':''));
  node.id='p-'+p.id;
  node.innerHTML=`
    <div class="phead">
      <span class="pid">${p.id}</span>
      <div class="pmain">
        <div class="ptitle">${esc(p.title)}</div>
        <div class="pmeta">${esc(p.authors)} · <b>${p.year}</b> · ${esc(p.venue)}</div>
        <div class="ptags">
          <span class="pill thread" style="background:${t.color}">${t.label}</span>
          <span class="pill tier-${p.tier}">Tier ${p.tier}</span>
          ${p.badge?`<span class="pill badge">${esc(p.badge)}</span>`:''}
          ${/^Yes/.test(p.rl)?'<span class="pill tier-B">RL</span>':''}
          ${/^Yes/.test(p.hardware)?'<span class="pill tier-B">Hardware</span>':''}
          ${/gazebo/i.test(p.simulator)?'<span class="pill badge">Gazebo</span>':''}
          ${(p.figures||[]).length?`<span class="pill tier-B">${p.figures.length} figure${p.figures.length>1?'s':''}</span>`:''}
        </div>
      </div>
      <span class="chev">▶</span>
    </div>
    <div class="pbody">
      <p style="margin:16px 0 0">${p.summary}</p>
      <dl class="kv">
        <dt>What is learned</dt><dd>${p.learned}</dd>
        <dt>What is supplied</dt><dd>${p.supplied||'—'}</dd>
        <dt>Platforms</dt><dd>${esc(p.platforms)}</dd>
        <dt>Simulator</dt><dd>${esc(p.simulator)}</dd>
        <dt>Real hardware</dt><dd>${esc(p.hardware)}</dd>
      </dl>
      ${p.optionTable?`<div class="tblwrap" style="margin:14px 0"><table><thead><tr>
        <th>Component</th><th>Meaning</th><th>For your system (illustrative)</th></tr></thead><tbody>
        ${p.optionTable.map(r=>`<tr><td><code>${r[0]}</code></td><td>${r[1]}</td><td class="muted">${r[2]}</td></tr>`).join('')}
        </tbody></table></div>`:''}
      ${p.useFor?`<div class="note"><b>Use it for.</b> ${p.useFor}</div>`:''}
      ${(p.why&&p.why!=='—')?`<div class="note"><b>Why it matters here.</b> ${p.why}</div>`:''}
      ${(p.caveats&&p.caveats.length)?`<div class="note warn"><b>Caveats.</b><ul>${p.caveats.map(c=>`<li>${c}</li>`).join('')}</ul></div>`:''}
      ${p.reading?`<p class="small muted"><b>Reading tip.</b> ${p.reading}</p>`:''}
      <p class="small" style="margin-top:14px">
        <a href="${p.url}" target="_blank" rel="noopener">Paper page ↗</a>${
          (window.LOCAL_PDFS!==false && p.pdf)?` · <a href="../papers/${p.pdf}" target="_blank">Local PDF</a>`:''}
        ${p.code?` · <a href="${p.code}" target="_blank" rel="noopener">Code ↗</a>`:''}
      </p>
      ${(p.figures||[]).map(f=>`
        <figure class="fig">
          <img src="figures/${f.src}" alt="${esc(f.label)}" loading="lazy">
          <figcaption>
            <div class="figlabel">${esc(f.label)}</div>
            <div class="figcap">“${esc(f.caption)}”</div>
            <div class="figread"><b>How to read it.</b> ${f.explain}</div>
          </figcaption>
        </figure>`).join('')}
    </div>`;
  node.querySelector('.phead').addEventListener('click',()=>node.classList.toggle('open'));
  return node;
}
function renderPapers(){
  const q=FILTER.q.toLowerCase();
  const list=ALL().filter(p=>{
    if(FILTER.tier && p.tier!==FILTER.tier) return false;
    if(FILTER.thread && p.thread!==FILTER.thread) return false;
    if(FILTER.flag==='rl' && !/^Yes/.test(p.rl)) return false;
    if(FILTER.flag==='hw' && !/^Yes/.test(p.hardware)) return false;
    if(FILTER.flag==='gz' && !/gazebo/i.test(p.simulator)) return false;
    if(FILTER.flag==='fig' && !(p.figures||[]).length) return false;
    if(FILTER.flag==='code' && !p.code) return false;
    if(!q) return true;
    return [p.id,p.title,p.authors,p.venue,p.summary,p.why,p.platforms,p.learned,p.simulator]
      .join(' ').toLowerCase().includes(q);
  }).sort((a,b)=>a.order-b.order);

  const wrap=$('#paperlist'); wrap.innerHTML='';
  if(!list.length){ wrap.innerHTML='<p class="muted">No papers match those filters.</p>'; }
  let cur=null;
  list.forEach(p=>{
    if(p.tier!==cur){ cur=p.tier;
      wrap.appendChild(el('div','sec-title',
        cur==='A' ? 'Tier A — core papers, discussed in the source research session'
      : cur==='B' ? 'Tier B — adjacent work surfaced by the same search'
                  : 'Added by you'));
    }
    wrap.appendChild(paperCard(p));
  });
  $('#pcount').textContent=`${list.length} of ${ALL().length} papers`;
}
function initFilters(){
  $('#q').addEventListener('input',e=>{FILTER.q=e.target.value;renderPapers();});
  const mk=(sel,key,opts)=>{
    const box=$(sel);
    box.innerHTML=opts.map(([v,l])=>`<button class="chip${v===''?' on':''}" data-v="${v}">${l}</button>`).join('');
    box.addEventListener('click',e=>{
      const b=e.target.closest('.chip'); if(!b)return;
      $$('.chip',box).forEach(c=>c.classList.remove('on')); b.classList.add('on');
      FILTER[key]=b.dataset.v; renderPapers();
    });
  };
  mk('#f-tier','tier',[['','All'],['A','Tier A'],['B','Tier B']]);
  mk('#f-thread','thread',[['','All threads'],...Object.entries(THREADS).map(([k,t])=>[k,t.label])]);
  mk('#f-flag','flag',[['','Everything'],['rl','Uses RL'],['hw','Real hardware'],['gz','Gazebo'],['fig','Has figures'],['code','Code available']]);
}

/* ===== gap analysis ===== */
function renderGaps(){
  const ids=ALL().filter(p=>p.tier==='A').sort((a,b)=>a.id.localeCompare(b.id)).map(p=>p.id);
  let h=`<table><thead><tr><th style="min-width:270px">Capability</th>
    ${ids.map(i=>`<th class="ctr" title="${esc(byId(i).title)}">${i}</th>`).join('')}
    <th class="ctr">Papers</th></tr></thead><tbody>`;
  GAPS.caps.forEach(c=>{
    const n=c.by.length;
    h+=`<tr class="${n<=1?'thin':''}"><td>${c.name}</td>${
      ids.map(i=>`<td class="ctr"><span class="mark${c.by.includes(i)?'':' no'}">${c.by.includes(i)?'✓':'·'}</span></td>`).join('')
    }<td class="ctr"><b>${n}</b></td></tr>`;
  });
  $('#gaptable').innerHTML=h+'</tbody></table>';
  $('#established').innerHTML=GAPS.established.map(s=>`<li>${s}</li>`).join('');
  $('#opening').innerHTML=GAPS.opening.map(s=>`<li>${s}</li>`).join('');
  $('#gapcaveat').innerHTML=GAPS.caveat;
}

/* ===== library — reference table for writing the paper ===== */
let LIBQ='', LIBTHREAD='';
function libRows(){
  const q=LIBQ.toLowerCase();
  return ALL().filter(p=>{
    if(LIBTHREAD && p.thread!==LIBTHREAD) return false;
    if(!q) return true;
    return [p.id,p.title,p.authors,p.venue,p.cite,p.gist,p.useFor,p.learned,p.platforms,note(p.id)]
      .join(' ').toLowerCase().includes(q);
  }).sort((a,b)=>(a.thread===b.thread)? a.id.localeCompare(b.id)
                 : Object.keys(THREADS).indexOf(a.thread)-Object.keys(THREADS).indexOf(b.thread));
}
function renderLibrary(){
  const rows=libRows();
  let h=`<table><thead><tr>
    <th style="width:14%;min-width:110px">Cite as</th>
    <th style="width:22%;min-width:190px">Paper</th>
    <th style="width:24%;min-width:220px">Gist</th>
    <th style="width:24%;min-width:220px">Use it for</th>
    <th style="width:14%;min-width:150px">Your note</th>
    <th style="width:8%;min-width:74px"></th></tr></thead><tbody>`;
  let cur=null;
  rows.forEach(p=>{
    const t=THREADS[p.thread]||{label:p.thread,color:'#64748b'};
    if(p.thread!==cur){ cur=p.thread;
      h+=`<tr class="grouprow"><td colspan="6">
        <span class="pill thread" style="background:${t.color}">${t.label}</span></td></tr>`; }
    h+=`<tr data-id="${p.id}">
      <td><code>${p.id}</code><div class="small muted" style="margin-top:3px">${esc(p.cite||'')}</div>
          ${p.bibkey?`<div class="small"><button class="linkbtn" data-copy="${esc(p.bibkey)}">${esc(p.bibkey)}</button></div>`:''}
          ${p.userAdded?'<div class="small" style="margin-top:3px"><span class="pill warnp">added</span></div>':''}</td>
      <td><b>${esc(p.title)}</b><div class="small muted">${esc(p.authors)} · ${p.year} · ${esc(p.venue)}</div></td>
      <td>${esc(p.gist||p.summary||'')}</td>
      <td class="usefor">${p.useFor||''}</td>
      <td><textarea class="notes" rows="1" placeholder="note for the write-up…">${esc(note(p.id))}</textarea></td>
      <td class="small">
        ${(window.LOCAL_PDFS!==false && p.pdf)?`<a href="../papers/${p.pdf}" target="_blank">PDF</a><br>`:''}
        ${p.url?`<a href="${p.url}" target="_blank" rel="noopener">Source</a><br>`:''}
        <a href="#papers" data-goto="${p.id}">Full entry</a>
        ${p.userAdded?`<br><button class="linkbtn danger" data-del="${p.id}">delete</button>`:''}
      </td></tr>`;
  });
  $('#librarytable').innerHTML = rows.length? h+'</tbody></table>'
    : '<p class="muted" style="padding:16px">Nothing matches.</p>';
  $('#libcount').textContent = `${rows.length} of ${ALL().length} entries`;

  $$('#librarytable tr[data-id]').forEach(tr=>{
    const id=tr.dataset.id, ta=tr.querySelector('.notes');
    ta.style.height='auto'; ta.style.height=Math.min(ta.scrollHeight,150)+'px';
    ta.addEventListener('input',e=>{
      STORE.notes[id]=e.target.value; save();
      e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,150)+'px';
    });
  });
  $$('#librarytable [data-copy]').forEach(b=>b.addEventListener('click',()=>{
    navigator.clipboard?.writeText(b.dataset.copy);
    const o=b.textContent; b.textContent='copied'; setTimeout(()=>b.textContent=o,900);
  }));
  $$('#librarytable [data-del]').forEach(b=>b.addEventListener('click',()=>{
    if(!confirm('Remove this entry you added?')) return;
    STORE.added=STORE.added.filter(p=>p.id!==b.dataset.del); save(); renderLibrary(); renderPapers(); renderOverview();
  }));
}
function addPaper(e){
  e.preventDefault();
  const f=id=>$('#na-'+id).value.trim();
  const title=f('title'); if(!title){ $('#na-title').focus(); return; }
  let id=f('id');
  if(!id){ let n=1; while(ALL().some(p=>p.id==='C'+String(n).padStart(2,'0'))) n++; id='C'+String(n).padStart(2,'0'); }
  if(ALL().some(p=>p.id===id)){ alert('That ID already exists.'); return; }
  STORE.added.push({
    id, tier:'C', userAdded:true, thread:$('#na-thread').value, relevance:3,
    title, authors:f('authors'), year:parseInt(f('year'))||new Date().getFullYear(),
    venue:f('venue'), cite:f('cite'), bibkey:f('bibkey'),
    gist:f('gist'), useFor:esc(f('usefor')), summary:f('gist'),
    learned:esc(f('learned'))||'—', supplied:'—',
    platforms:f('platforms')||'—', simulator:f('simulator')||'—',
    hardware:f('hardware')||'—', rl:$('#na-rl').value,
    url:f('url'), pdf:f('pdf'), code:f('code'), badge:'', caveats:[], reading:'', figures:[],
    why:'', order:900
  });
  save(); $('#addform').reset(); $('#addwrap').open=false;
  renderLibrary(); renderPapers(); renderOverview();
}
function exportJSON(){
  dl(new Blob([JSON.stringify(STORE.added,null,2)],{type:'application/json'}),'het-robots-added-papers.json');
}
function exportBib(){
  const txt=libRows().map(p=>{
    const key=p.bibkey||(p.id.toLowerCase()+p.year);
    return '@misc{'+key+',\n  title  = {'+p.title+'},\n  author = {'+p.authors+'},\n  year   = {'+p.year+
           '},\n  note   = {'+p.venue+'},\n  url    = {'+(p.url||'')+'}\n}';
  }).join('\n\n');
  dl(new Blob([txt],{type:'text/plain'}),'het-robots.bib');
}
function exportCSV(){
  const head=['ID','Tier','Cite as','BibKey','Title','Authors','Year','Venue','Thread',
    'Gist','Use it for','What is learned','Platforms','Simulator','Real hardware','Uses RL','Your note','URL','PDF'];
  const q=v=>'"'+String(v==null?'':v).replace(/<[^>]+>/g,'').replace(/"/g,'""')+'"';
  const lines=[head.map(q).join(',')];
  libRows().forEach(p=>lines.push([p.id,p.tier,p.cite,p.bibkey,p.title,p.authors,p.year,p.venue,
    (THREADS[p.thread]||{}).label,p.gist,p.useFor,p.learned,p.platforms,p.simulator,p.hardware,p.rl,
    note(p.id),p.url,p.pdf?'papers/'+p.pdf:''].map(q).join(',')));
  dl(new Blob(['﻿'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}),'het-robots-library.csv');
}
function dl(blob,name){ const a=el('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); URL.revokeObjectURL(a.href); }

/* ===== problem tab ===== */
function renderProblem(){
  const P=PROBLEM;
  $('#pq').innerHTML=P.question;
  $('#probRobots').innerHTML=P.robots.map(r=>
    `<div class="card" style="margin:0"><h3>${esc(r.name)}</h3><p class="small muted" style="margin:0">${r.role}</p></div>`).join('');
  $('#probConstraints').innerHTML=P.constraints.map(s=>`<li>${s}</li>`).join('');
  $('#probDecisions').innerHTML=P.decisions.map(d=>
    `<dt>${esc(d.q)}</dt><dd>${d.d}</dd>`).join('');
  $('#designRule').innerHTML=P.designRule;
  $('#probObs').innerHTML=P.observation.map(s=>`<li>${s}</li>`).join('');
  $('#probForm').innerHTML=P.formulation.map(s=>`<li>${s}</li>`).join('');
  $('#probTargets').innerHTML=P.targets.map(t=>
    `<tr><td><b>${esc(t.t)}</b></td><td>${t.w}</td><td>${t.why}</td></tr>`).join('');
  $('#probReward').innerHTML=P.reward;
  $('#probStages').innerHTML=P.stages.map(s=>`<li>${s}</li>`).join('');
  $('#probBaselines').innerHTML=P.baselines.map(s=>`<li>${esc(s)}</li>`).join('');
  $('#probMetrics').innerHTML=P.metrics.map(s=>`<li>${esc(s)}</li>`).join('');
  $('#probFirst').innerHTML=P.firstResult;
  $('#hardware').innerHTML=HARDWARE.map(([l,u])=>
    `<li><a href="${u}" target="_blank" rel="noopener">${esc(l)}</a></li>`).join('');
}

/* ===== boot ===== */
document.addEventListener('DOMContentLoaded',()=>{
  $('#metaNote').innerHTML=META.note;
  $('#metaSource').textContent=META.source;
  $('#metaDate').textContent=META.compiled;
  renderOverview(); initFilters(); renderPapers(); renderGaps(); renderLibrary(); renderProblem();

  $$('nav.tabs button').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
  $('#themeBtn').addEventListener('click',toggleTheme);
  $('#themeBtn').textContent=document.documentElement.getAttribute('data-theme')==='dark'?'☀ Light':'☾ Dark';
  $('#csvBtn').addEventListener('click',exportCSV);
  $('#bibBtn').addEventListener('click',exportBib);
  $('#jsonBtn').addEventListener('click',exportJSON);
  $('#addform').addEventListener('submit',addPaper);
  $('#libq').addEventListener('input',e=>{LIBQ=e.target.value;renderLibrary();});
  $('#libthread').innerHTML='<option value="">All threads</option>'+
    Object.entries(THREADS).map(([k,t])=>`<option value="${k}">${t.label}</option>`).join('');
  $('#libthread').addEventListener('change',e=>{LIBTHREAD=e.target.value;renderLibrary();});
  $('#na-thread').innerHTML=Object.entries(THREADS).map(([k,t])=>`<option value="${k}">${t.label}</option>`).join('');
  $('#expandAll').addEventListener('click',()=>{
    const any=$$('#paperlist .paper').some(p=>!p.classList.contains('open'));
    $$('#paperlist .paper').forEach(p=>p.classList.toggle('open',any));
  });

  /* lightbox */
  const lb=$('#lb');
  document.addEventListener('click',e=>{
    const img=e.target.closest('figure.fig img');
    if(img){ $('#lbimg').src=img.src; lb.classList.add('on'); return; }
    const tab=e.target.closest('[data-goto-tab]');
    if(tab){ e.preventDefault(); showTab(tab.dataset.gotoTab); return; }
    const goto=e.target.closest('[data-goto]');
    if(goto){ e.preventDefault(); showTab('papers');
      const card=$('#p-'+goto.dataset.goto);
      if(card){ card.classList.add('open'); card.scrollIntoView({block:'center'}); } }
  });
  lb.addEventListener('click',()=>lb.classList.remove('on'));
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') lb.classList.remove('on'); });

  const h=(location.hash||'#overview').slice(1);
  showTab($(`nav.tabs button[data-tab="${h}"]`)?h:'overview',false);
});
