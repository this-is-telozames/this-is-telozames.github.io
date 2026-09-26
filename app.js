'use strict';
(() => {
 const D=window.TELO_DATA;if(!D)return;
 const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const label=s=>s.charAt(0).toLocaleUpperCase('ru')+s.slice(1);
 const quoted=s=>{const text=String(s).trim();const period=text.endsWith('.');return '«'+esc((period?text.slice(0,-1):text).replace(/«/g,'„').replace(/»/g,'“'))+'»'+(period?'.':'');};
 const url=s=>String(s).split('/').map(encodeURIComponent).join('/');
 const starMarkup='<img class="brand-emblem" src="brand-symbol.svg" alt="">';
 // Touch scrolling must not leave a focus frame around entire carousels.
 const root=document.documentElement;
 document.addEventListener('keydown',e=>{if(['Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))root.classList.add('keyboard-navigation');},true);
 const touchFocus=()=>root.classList.remove('keyboard-navigation');
 document.addEventListener('pointerdown',touchFocus,true);
 document.addEventListener('touchstart',touchFocus,{capture:true,passive:true});
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const archive=new Map(D.archive.map(a=>[a.id,a]));
 const viewer=$('#viewer'),body=$('#viewer-body');let previousFocus=null;
 const intro=$('#letter-intro'),postcard=$('#postcard');
 // Direct chapter links stay usable. Reloading the main address begins with the letter.
 if(!location.hash){
  intro.hidden=false;postcard.hidden=true;
  $('#open-letter').onclick=()=>{
   if(intro.classList.contains('opening'))return;
   intro.classList.add('opening');$('#open-letter').setAttribute('aria-disabled','true');
   setTimeout(()=>{intro.hidden=true;postcard.hidden=false;window.scrollTo(0,0);const h=$('#hero-title');h.tabIndex=-1;h.focus({preventScroll:true});},reduced.matches?0:1050);
  };
 }
 function openNote(q,title){
  if(!q)return;
  previousFocus=document.activeElement;pauseAll();viewer.classList.remove('viewer-circle');body.replaceChildren();$('#viewer-title').textContent=title||('Из записки'+(q.author?' · '+q.author:''));$('#viewer-error').textContent='';
  const note=document.createElement('div');note.className='note-text';note.textContent=q.text||q.excerpt;body.append(note);viewer.showModal();document.body.style.overflow='hidden';
 }
 const pauseAll=()=>$$('video').forEach(v=>{v.pause();if(v.hasAttribute('data-preview')&&v.hasAttribute('src')){v.removeAttribute('src');v.load();}});
 function open(item,title,type){
  previousFocus=document.activeElement;pauseAll();body.replaceChildren();$('#viewer-title').textContent=title;$('#viewer-error').textContent='';
  const isCircle=item.type==='video_circle';viewer.classList.toggle('viewer-circle',isCircle);
  const isVideo=type==='video'||item.type==='video'||isCircle;
  const node=document.createElement(isVideo?'video':'img');
  node.src=url(isVideo?(item.web_source||item.source):item.source);if(!isVideo)node.alt=title;
  if(isVideo){node.controls=!isCircle;node.playsInline=true;node.preload='metadata';if(item.poster)node.poster=url(item.face_poster||item.poster);node.addEventListener('waiting',()=>{$('#viewer-error').textContent='Видео загружается…';});node.addEventListener('playing',()=>{$('#viewer-error').textContent='';});}
  node.addEventListener('error',()=>{$('#viewer-error').textContent='Не получилось открыть файл в браузере. ';const a=document.createElement('a');a.href=url(item.source);a.textContent=isVideo?'Открыть видео отдельно':'Открыть фото отдельно';a.target='_blank';a.rel='noopener';$('#viewer-error').append(a);});
  if(isCircle){
   const stage=document.createElement('div');stage.className='circle-stage';stage.append(node);body.append(stage);
   const controls=document.createElement('div');controls.className='circle-controls';
   controls.innerHTML='<div class="circle-timeline"><input type="range" min="0" max="1" step="0.1" value="0" aria-label="Перемотка поздравления"><span class="circle-time" aria-live="off">0:00 / 0:00</span></div><div class="circle-actions"><button class="circle-toggle" aria-label="Пауза">Ⅱ</button><span>Голос для тебя</span><button class="circle-sound" aria-label="Выключить звук" aria-pressed="true">Выключить звук</button></div>';
   body.append(controls);
   const toggle=controls.querySelector('.circle-toggle'),sound=controls.querySelector('.circle-sound'),seek=controls.querySelector('input'),time=controls.querySelector('.circle-time');
   const clock=n=>duration(Number.isFinite(n)?n:0);
   function update(){const length=Number.isFinite(node.duration)?node.duration:0;seek.max=String(length||1);seek.value=String(node.currentTime);seek.setAttribute('aria-valuetext',clock(node.currentTime)+' из '+clock(length));time.textContent=clock(node.currentTime)+' / '+clock(length);toggle.textContent=node.paused?'▶':'Ⅱ';toggle.setAttribute('aria-label',node.paused?'Продолжить поздравление':'Пауза');}
   ['timeupdate','durationchange','play','pause','ended'].forEach(event=>node.addEventListener(event,update));
   toggle.onclick=()=>{if(node.paused)node.play().catch(()=>{$('#viewer-error').textContent='Не удалось начать воспроизведение. Попробуй ещё раз.';});else node.pause();};
   sound.onclick=()=>{node.muted=!node.muted;sound.textContent=node.muted?'Включить звук':'Выключить звук';sound.setAttribute('aria-label',node.muted?'Включить звук':'Выключить звук');sound.setAttribute('aria-pressed',String(!node.muted));};
   seek.oninput=()=>{node.currentTime=Number(seek.value);update();};update();
  }else body.append(node);
  viewer.showModal();document.body.style.overflow='hidden';
  if(isVideo)node.play().catch(()=>{$('#viewer-error').textContent='Нажми ▶ на видео, чтобы начать.';});
 }
 function close(){viewer.close();}
 viewer.addEventListener('close',()=>{body.querySelectorAll('video').forEach(v=>{v.pause();v.removeAttribute('src');v.load();});body.replaceChildren();document.body.style.overflow='';previousFocus?.focus();});
 $('#close-viewer').addEventListener('click',close);
 viewer.addEventListener('click',e=>{if(e.target===viewer){const r=viewer.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseAll();});
 document.addEventListener('play',e=>{if(e.target.tagName==='VIDEO'&&!e.target.muted)$$('video').filter(v=>v!==e.target).forEach(v=>v.pause());},true);
 const share=$('#share');if(/^https?:$/.test(location.protocol)&&!['localhost','127.0.0.1'].includes(location.hostname)){share.hidden=false;share.onclick=async()=>{try{if(navigator.share)await navigator.share({title:document.title,text:'this-is-telozames',url:location.href.split('#')[0]});else{await navigator.clipboard.writeText(location.href.split('#')[0]);$('#share-status').textContent='Ссылка скопирована';}}catch(e){if(e.name!=='AbortError')$('#share-status').textContent='Можно скопировать ссылку из адресной строки.';}};}
 const first=D.content.sections[0], early=first.media||[];
 const portrait=D.content.portrait;
 if(portrait){
  $('#hero-media').innerHTML=`<span class="motion-trace trace-one" aria-hidden="true"></span><span class="motion-trace trace-two" aria-hidden="true"></span><img class="hero-photo portrait-photo" src="${url(portrait.poster)}" alt="Настя" width="620" height="775" fetchpriority="high">`;
  $('.handwritten').innerHTML='Узнаёшь себя?';
 }else{
  $('#hero-media').innerHTML=`<div class="movement-object" aria-hidden="true"><div class="orbit o1"></div><div class="orbit o2"></div><div class="orbit o3"></div><span class="movement-star">${starMarkup}</span></div>`;
 }
 function memoryCards(target,items,options={}){
  const container=$(target);if(!container)return;
  container.innerHTML=items.map((a,i)=>`<figure class="memory-card ${options.featureFirst&&i===0?'memory-feature':''}"><button class="media-button" data-memory-index="${i}" aria-label="${a.type==='video'?'Смотреть видео':'Открыть фото'}: ${esc(a.caption||options.title||'Воспоминание')}"><img src="${url(a.poster)}" alt="${esc(a.caption||options.title||'Воспоминание')}" loading="lazy">${a.type==='video'?`<span class="memory-play">▶ <span>${duration(a.duration)}</span></span>`:'<span class="memory-zoom" aria-hidden="true">↗</span>'}</button>${options.captions===false?'':`<figcaption>${esc(a.caption||options.title||'Воспоминание')}</figcaption>`}</figure>`).join('');
  container.querySelectorAll('[data-memory-index]').forEach(b=>{const a=items[Number(b.dataset.memoryIndex)];b.onclick=()=>open(a,a.caption||options.title||'Воспоминание');});
 }
 if(early.length){$('#early-memories').hidden=false;memoryCards('#early-clips',early.map((a,i)=>({...a,caption:['Просто включить музыку','Двигаться по-своему','Поймать настроение','Попробовать ещё'][i]||'Ещё одно движение'})));}
 const dances=D.content.dance||[];
 if(dances.length){$('#dance-memory').hidden=false;memoryCards('#dance-clips',dances,{captions:false,title:'Танец Насти'});}
 const collection=name=>D.archive.filter(a=>a.visible&&a.collection===name);
 memoryCards('#after-clips',collection('after'));
 const albums=D.content.memory_albums||[];
 $('#memory-albums').innerHTML=albums.map(a=>`<section class="memory-album" aria-labelledby="album-title-${esc(a.id)}"><div class="album-heading"><h3 id="album-title-${esc(a.id)}">${esc(a.title)}</h3><div class="film-arrows"><button data-album-prev="${esc(a.id)}" aria-label="${esc(a.title)}: предыдущие кадры">←</button><button data-album-next="${esc(a.id)}" aria-label="${esc(a.title)}: следующие кадры">→</button></div></div><div id="album-${esc(a.id)}" class="album-strip" tabindex="0" role="region" aria-label="${esc(a.title)}. Листай вбок"></div></section>`).join('');
 albums.forEach(a=>{
  const items=collection(a.id).sort((x,y)=>(x.album_order??99)-(y.album_order??99));
  memoryCards('#album-'+a.id,items,{captions:false,title:a.title});
  const strip=$('#album-'+a.id),prev=$(`[data-album-prev="${a.id}"]`),next=$(`[data-album-next="${a.id}"]`);
  [...strip.children].forEach((card,i)=>card.style.setProperty('--frame-ratio',String(Math.max(.65,Math.min(1.8,(items[i].width||1)/(items[i].height||1))))));
  const update=()=>{prev.disabled=strip.scrollLeft<2;next.disabled=strip.scrollLeft+strip.clientWidth>=strip.scrollWidth-3;};
  const move=direction=>strip.scrollBy({left:direction*Math.min(620,strip.clientWidth*.85),behavior:reduced.matches?'instant':'smooth'});
  prev.onclick=()=>move(-1);next.onclick=()=>move(1);strip.addEventListener('scroll',update,{passive:true});new ResizeObserver(update).observe(strip);update();
 });
 function duration(n){return `${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;}
 $('#circles').innerHTML=D.people.map((p,i)=>`<article class="person"><button class="circle" data-person="${esc(p.id)}" aria-label="Слушать: ${esc(p.name)}${p.part?', часть '+p.part:''}"><img src="${url(p.face_poster||p.poster)}" alt="${esc(p.name)}" loading="lazy" width="240" height="240"><video muted loop playsinline preload="none" data-preview="${i}" tabindex="-1" aria-hidden="true"></video><span class="circle-play" aria-hidden="true">▶</span></button><span class="person-name">${esc(p.name)}</span><span class="person-meta">${p.part?'Часть '+p.part+' · ':''}${duration(p.duration)}</span></article>`).join('');
 const previews=$$('[data-preview]'),visiblePreviews=new Set();
 let desiredPreviews=new Set();
 function syncPreviews(){
  const limit=matchMedia('(max-width: 600px)').matches?2:3;
  const eligible=!reduced.matches&&!navigator.connection?.saveData&&!['slow-2g','2g'].includes(navigator.connection?.effectiveType)&&!viewer.open&&!document.hidden;
  const selected=eligible?previews.filter(v=>visiblePreviews.has(v)).slice(0,limit):[];
  desiredPreviews=new Set(selected);
  previews.filter(v=>!selected.includes(v)).forEach(v=>{v.pause();v.classList.remove('is-playing');if(v.hasAttribute('src')){v.removeAttribute('src');v.load();}});
  selected.forEach(async v=>{
   if(!v.paused)return;
   const p=D.people[Number(v.dataset.preview)];
   if(!p.preview_source)return;
   if(!v.getAttribute('src'))v.src=url(p.preview_source);
   v.muted=true;v.playsInline=true;
   try{await v.play();if(!desiredPreviews.has(v)||viewer.open||document.hidden||reduced.matches){v.pause();return;}if(!v.paused)v.classList.add('is-playing');}catch{v.classList.remove('is-playing');}
  });
 }
 const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)visiblePreviews.add(e.target);else visiblePreviews.delete(e.target);});syncPreviews();},{threshold:.65});
 previews.forEach(v=>{observer.observe(v);v.addEventListener('pause',()=>v.classList.remove('is-playing'));});
 $$('[data-person]').forEach(b=>{const p=D.people.find(p=>p.id===b.dataset.person);b.onclick=()=>open(p,p.name+(p.part?' · часть '+p.part:''));});
 reduced.addEventListener('change',syncPreviews);
 document.addEventListener('visibilitychange',syncPreviews);
 viewer.addEventListener('close',syncPreviews);
 window.addEventListener('resize',syncPreviews);
 $('#final-faces').innerHTML=D.people.map(p=>`<button class="final-face" data-final-person="${esc(p.id)}" aria-label="Слушать: ${esc(p.name)}"><img src="${url(p.face_poster||p.poster)}" alt="${esc(p.name)}" loading="lazy" width="180" height="180"></button>`).join('');
 $$('[data-final-person]').forEach(b=>{const p=D.people.find(p=>p.id===b.dataset.finalPerson);b.onclick=()=>open(p,p.name);});
 let selectedTheme='Все',expanded=false;
 const topics=['Все',...D.content.sections.find(s=>s.id==='permissions').themes];
 const order=D.content.quote_order||[];
 const quotes=D.quotes.filter(q=>q.section!=='inside').sort((a,b)=>(order.includes(a.id)?order.indexOf(a.id):99)-(order.includes(b.id)?order.indexOf(b.id):99));
 function renderQuotes(){
  const filtered=quotes.filter(q=>selectedTheme==='Все'||q.themes.includes(selectedTheme));const shown=expanded?filtered:filtered.slice(0,6);
  $('#quotes').innerHTML=shown.map(q=>`<article class="quote-card"><span class="quote-theme">${esc(q.themes[0])}</span><blockquote>${quoted(q.excerpt)}</blockquote><p class="quote-by">${esc(q.author||'Из нашего чата')}</p></article>`).join('');
  $('#more-quotes').hidden=filtered.length<=6;$('#more-quotes').innerHTML=expanded?'Свернуть ↑':'Ещё слова ↓';
  $$('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===selectedTheme)));
 }
 $('#quote-filters').innerHTML=topics.map(t=>`<button data-theme="${esc(t)}" aria-pressed="${t==='Все'}">${esc(label(t))}</button>`).join('');
 $$('[data-theme]').forEach(b=>b.onclick=()=>{selectedTheme=b.dataset.theme;expanded=false;renderQuotes();});
 $('#more-quotes').onclick=()=>{expanded=!expanded;renderQuotes();};renderQuotes();
 document.addEventListener('click',e=>{const b=e.target.closest('[data-quote]');if(!b)return;const q=D.quotes.find(q=>q.id===b.dataset.quote);if(q)openNote(q);});
 let catIndex=0;const cats=['archive-055','archive-059','archive-061','archive-019','archive-057'].map(id=>archive.get(id)).filter(Boolean);
 function renderCat(){const cat=cats[catIndex];if(!cat)return;$('#cat').innerHTML=`<img src="${url(cat.poster)}" alt="${esc(cat.caption)}" loading="lazy">`;$('#cat-count').textContent=`${catIndex+1} / ${cats.length}`;}
 function nextCat(){catIndex=(catIndex+1)%cats.length;renderCat();}
 $('#cat').onclick=nextCat;$('#next-cat').onclick=nextCat;renderCat();
 $('#cat-video').onclick=()=>open(archive.get('archive-015'),'Тот самый кот на АЗС');
 const service=archive.get('archive-051');$('#self-service').innerHTML=`<img loading="lazy" src="${url(service.poster)}" alt="Извините, у нас самообслуживание"><span>«Извините,<br>у нас самообслуживание»</span>`;$('#self-service').onclick=()=>open(service,'Читать грубым голосом');
 const aerobics=archive.get('archive-053');$('#aerobics').innerHTML=`<img loading="lazy" src="${url(aerobics.poster)}" alt="Аэробика на Алтае: ноги выше головы"><span>Мама называла это<br>аэробикой.</span>`;$('#aerobics').onclick=()=>open(aerobics,'«Аэробика на Алтае» · Юля Муха');
 const movie=archive.get('archive-073');$('#movie').innerHTML=`<img loading="lazy" src="${url(movie.poster)}" alt="Видео перед Телозамесом в Петербурге"><span class="movie-play">▶</span>`;$('#movie').onclick=()=>open(movie,'«Когда-нибудь я сниму фильм о своей жизни»');
 const filmOrder=['archive-049','archive-003','archive-085','archive-029','archive-075','archive-009','archive-037','archive-077','archive-047','archive-001'];
 const films=D.archive.filter(a=>a.visible&&(!a.collection||a.collection==='film')).sort((a,b)=>(filmOrder.includes(a.id)?filmOrder.indexOf(a.id):99)-(filmOrder.includes(b.id)?filmOrder.indexOf(b.id):99));
 function renderFilm(){
  const list=films;
  $('#film').innerHTML=list.length?list.map((a,i)=>`<figure class="film-card"><button class="media-button" data-media="${a.id}" aria-label="${a.type==='video'?'Смотреть видео':'Открыть фото'}: ${esc(a.caption)}"><img src="${url(a.poster)}" alt="${esc(a.caption)}" loading="lazy">${a.type==='video'?'<span class="film-play">▶ '+duration(a.duration)+'</span>':''}</button></figure>`).join(''):'<p class="film-empty">Здесь появятся наши воспоминания.</p>';
  $('#film').scrollLeft=0;$$('[data-media]').forEach(b=>b.onclick=()=>{const a=archive.get(b.dataset.media);open(a,a.caption);});
  updateArrows();
 }
 function updateArrows(){const f=$('#film');$('#film-prev').disabled=f.scrollLeft<2;$('#film-next').disabled=f.scrollLeft+f.clientWidth>=f.scrollWidth-3;}
 $('#film-prev').onclick=()=>$('#film').scrollBy({left:-Math.min(600,$('#film').clientWidth*.85),behavior:reduced.matches?'instant':'smooth'});
 $('#film-next').onclick=()=>$('#film').scrollBy({left:Math.min(600,$('#film').clientWidth*.85),behavior:reduced.matches?'instant':'smooth'});
 $('#film').addEventListener('scroll',updateArrows,{passive:true});window.addEventListener('resize',updateArrows);renderFilm();
 new ResizeObserver(updateArrows).observe($('#film'));
})();
