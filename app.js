/* Static browser UI. All training data stays on the device unless explicitly shared. */
(() => {
  'use strict';
  const P = window.Planner, STORAGE = 'magnus-training-planner:v1', MAX_FILE = 2500000, MAX_LINK = 8000;
  const $ = id => document.getElementById(id);
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let state = P.empty(), savedState, shared = false, editedId = null, dragId = null, toastTimer, storageBlocked = false;
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const fmt = (s, opt) => P.date(s).toLocaleDateString('en-GB', {timeZone:'UTC', ...opt});
  const shortDate = s => fmt(s, {day:'numeric',month:'short'});
  const range = s => `${shortDate(s)} – ${fmt(P.add(s,6),{day:'numeric',month:'long',year:'numeric'})}`;
  const current = () => P.getWeek(state, state.selected);
  function toast(message) { $('toast').textContent=message; $('toast').hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>{$('toast').hidden=true;},4500); }
  function warn(message) { $('storage-warning').textContent=message; $('storage-warning').hidden=false; }
  function persist() {
    if(shared) { $('save-status').textContent='Shared draft · send or save to keep'; return; }
    if(storageBlocked) { $('save-status').textContent='Not saved · export a backup'; return; }
    try { localStorage.setItem(STORAGE, JSON.stringify(state)); $('save-status').textContent='Saved on this device'; }
    catch(e) { $('save-status').textContent='Not saved · export a backup'; warn('Browser storage is unavailable or full. Changes remain in this tab only. Export a JSON backup before closing.'); }
  }
  function setWeek(w) { w.customized=true; state.weeks[state.selected]=w; persist(); render(); }
  function confirmChange(message, label='Confirm') {
    $('confirm-message').textContent=message; $('confirm-yes').textContent=label;
    const dialog=$('confirm-dialog'); dialog.showModal();
    return new Promise(resolve=>{
      let done=false;
      const finish=v=>{if(done)return;done=true;dialog.close();$('confirm-no').onclick=null;$('confirm-yes').onclick=null;dialog.removeEventListener('cancel',cancel);resolve(v);};
      const cancel=e=>{e.preventDefault();finish(false);};
      $('confirm-no').onclick=()=>finish(false);$('confirm-yes').onclick=()=>finish(true);dialog.addEventListener('cancel',cancel);
    });
  }
  function go(s) { if(!P.inRange(s))return;state.selected=s;persist();render(); }
  function render() {
    const s=state.selected,w=current(),iso=P.isoWeek(s);
    $('week-title').textContent=`Week ${iso.week}`;
    $('week-range').textContent=range(s);
    $('week-badge').textContent=w.customized?'Customized week':'Default week';
    $('week-badge').className='badge'+(w.customized?' custom':'');
    $('previous').disabled=s===P.FIRST;$('next').disabled=s===P.LAST;
    $('copy-previous').disabled=s===P.FIRST;$('copy-next').disabled=s===P.LAST;
    $('date-picker').value=s;$('week-picker').value=s;
    $('shared-banner').hidden=!shared;
    const sum=P.summary(w);
    $('summary').innerHTML=[['Running',Number(sum.run.toFixed(1)),'km'],['Cycling',P.duration(sum.bike),''],['Upper body',sum.upper,'sessions'],['Full body',sum.full,'sessions'],['Total sessions',sum.sessions,''],['Training time',P.duration(sum.total),'']].map(([name,v,unit])=>`<div class="stat"><span class="stat-label">${name}</span><span class="stat-value">${v}<span class="stat-unit">${unit}</span></span></div>`).join('');
    $('calendar').innerHTML=P.DAYS.map((name,day)=>{
      const d=P.add(s,day), workouts=w.workouts.filter(x=>x.day===day).sort((a,b)=>a.time.localeCompare(b.time)||a.name.localeCompare(b.name));
      const fixed=P.commitments(d).map(c=>({time:c.start,html:`<div class="fixed-block"><span>${c.start}–${c.end} · FIXED</span><strong>${c.name}</strong><span class="fixed-detail">${c.details}</span></div>`}));
      const cards=workouts.map(x=>({time:x.time,html:`<article class="workout ${x.type.toLowerCase()}" data-id="${escape(x.id)}"><button class="drag-handle" draggable="true" aria-label="Move ${escape(x.name)}; drag to a day or click to edit" data-id="${escape(x.id)}">⠿</button><button class="workout-button" data-edit="${escape(x.id)}" aria-label="Edit ${escape(x.name)}"><span class="card-top"><span class="card-type">${x.type}${x.intensity==='Threshold'?' · KEY':''}</span><span>${x.time}</span></span><h4>${escape(x.name)}</h4><span class="card-metrics">${P.duration(x.duration)}${x.distance!==null?' · '+x.distance+' km':''}</span><span class="intensity">${escape(x.intensity)}${x.type==='Gym'&&x.focus?' · '+escape(x.focus):''}</span>${x.comments?'<span class="comment-indicator">↳ Coach comment</span>':''}${P.overlaps(s,x,w.workouts)?'<span class="conflict">◷ Schedule overlap</span>':''}<span class="print-details">${escape(x.details)}${x.comments?'<strong>Coach</strong>'+escape(x.comments):''}</span></button></article>`}));
      const items=[...fixed,...cards].sort((a,b)=>a.time.localeCompare(b.time)).map(x=>x.html).join('');
      return `<section class="day ${day>4?'weekend ':''}${d===today()?'today':''}" data-day="${day}" aria-label="${name} ${shortDate(d)}"><div class="day-heading"><h3>${name.slice(0,3)}</h3><span>${shortDate(d)}</span></div><div class="day-items">${items}${workouts.length?'':`<div class="rest"><strong>${s===P.FIRST&&day<2?'Rest & recover':'No training planned'}</strong>${s===P.FIRST&&day<2?'Space to recover from the marathon.':'Room to breathe.'}</div>`}</div><button class="add-workout" data-add="${day}" aria-label="Add workout on ${name}">+ Add workout</button></section>`;
    }).join('');
    if(document.activeElement!==$('coach-note'))$('coach-note').value=w.note;
    let printNote=$('print-note');if(!printNote){printNote=document.createElement('p');printNote.id='print-note';printNote.className='print-note';$('coach-note').after(printNote);}printNote.textContent=w.note;
  }
  function openEditor(id=null,day=0) {
    const form=$('workout-form');form.reset();editedId=id;$('editor-error').textContent='';
    $('workout-day').innerHTML=P.DAYS.map((d,i)=>`<option value="${i}">${d} · ${shortDate(P.add(state.selected,i))}</option>`).join('');
    const x=id?current().workouts.find(x=>x.id===id):{day,type:'Run',name:'',time:'09:00',duration:45,distance:null,intensity:'Easy/Z2',focus:'',details:'',comments:''};
    if(!x)return;
    for(const [k,v] of Object.entries(x))if(form.elements.namedItem(k))form.elements.namedItem(k).value=v===null?'':v;
    $('editor-title').textContent=id?'Edit workout':'Add workout';$('delete-workout').hidden=!id;updateFocus();$('editor').showModal();
  }
  function updateFocus() { $('focus-label').hidden=$('workout-type').value!=='Gym'; }
  $('workout-type').addEventListener('change',()=>{updateFocus();$('workout-intensity').value=$('workout-type').value==='Gym'?'Strength':'Easy/Z2';});
  $('workout-form').addEventListener('submit',e=>{
    e.preventDefault();const f=new FormData(e.currentTarget);
    const x={id:editedId||'w-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10),day:Number(f.get('day')),type:f.get('type'),name:f.get('name').trim(),time:f.get('time'),duration:Number(f.get('duration')),distance:f.get('distance')===''?null:Number(f.get('distance')),intensity:f.get('intensity'),focus:f.get('type')==='Gym'?f.get('focus'):'',details:f.get('details'),comments:f.get('comments')};
    try{P.validateWorkout(x);}catch(err){$('editor-error').textContent=err.message;return;}
    const w=current(),index=w.workouts.findIndex(y=>y.id===editedId);
    if(index<0&&w.workouts.length>=100){$('editor-error').textContent='Maximum 100 workouts per week.';return;}
    if(index<0)w.workouts.push(x);else w.workouts[index]=x;
    setWeek(w);$('editor').close();toast('Workout saved');
  });
  $('delete-workout').addEventListener('click',async()=>{if(await confirmChange('Delete this workout from this week?','Delete workout')){const w=current();w.workouts=w.workouts.filter(x=>x.id!==editedId);setWeek(w);$('editor').close();toast('Workout deleted');}});
  $('calendar').addEventListener('click',e=>{const b=e.target.closest('[data-add],[data-edit],.drag-handle');if(!b)return;if(b.hasAttribute('data-add'))openEditor(null,Number(b.dataset.add));else openEditor(b.dataset.edit||b.dataset.id);});
  $('calendar').addEventListener('dragstart',e=>{const handle=e.target.closest('.drag-handle');if(!handle){e.preventDefault();return;}dragId=handle.dataset.id;e.dataTransfer.setData('text/plain',dragId);e.dataTransfer.effectAllowed='move';const card=handle.closest('.workout');e.dataTransfer.setDragImage(card,20,20);card.classList.add('dragging');});
  $('calendar').addEventListener('dragover',e=>{if(!dragId)return;const d=e.target.closest('.day');if(d){e.preventDefault();e.dataTransfer.dropEffect='move';document.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'));d.classList.add('drag-over');}});
  $('calendar').addEventListener('dragleave',e=>{const d=e.target.closest('.day');if(d&&!d.contains(e.relatedTarget))d.classList.remove('drag-over');});
  $('calendar').addEventListener('drop',e=>{e.preventDefault();const d=e.target.closest('.day');if(d&&dragId){const w=current(),x=w.workouts.find(x=>x.id===dragId);if(x){x.day=Number(d.dataset.day);setWeek(w);toast('Workout moved · start time kept');}}dragId=null;});
  $('calendar').addEventListener('dragend',()=>{dragId=null;document.querySelectorAll('.drag-over,.dragging').forEach(x=>x.classList.remove('drag-over','dragging'));});
  $('coach-note').addEventListener('input',()=>{const w=current();w.note=$('coach-note').value;w.customized=true;state.weeks[state.selected]=w;persist();$('week-badge').textContent='Customized week';$('week-badge').className='badge custom';$('print-note').textContent=w.note;});
  $('previous').onclick=()=>go(P.add(state.selected,-7));$('next').onclick=()=>go(P.add(state.selected,7));
  $('current').onclick=()=>{const t=P.monday(today());go(t<P.FIRST?P.FIRST:t>P.LAST?P.LAST:t);if(t<P.FIRST||t>P.LAST)toast('Today is outside this plan. Showing the nearest week.');};
  $('date-picker').onchange=e=>{if(P.validDate(e.target.value)){const s=P.monday(e.target.value);if(P.inRange(s))go(s);else{toast('Choose a date within the planner range.');e.target.value=state.selected;}}};
  $('week-picker').onchange=e=>go(e.target.value);
  $('manage-open').onclick=()=>$('manage-dialog').showModal();$('share-open').onclick=()=>{$('share-message').textContent='';$('link-fallback').hidden=true;$('share-dialog').showModal();};$('help').onclick=()=>$('help-dialog').showModal();
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
  $('copy-previous').onclick=async()=>{if(state.selected===P.FIRST)return;if(await confirmChange('Replace this week’s workouts and coach note with the previous week’s current plan?','Copy previous week')){P.copyWeek(state,P.add(state.selected,-7),state.selected);persist();render();$('manage-dialog').close();toast('Previous week copied');}};
  $('copy-next').onclick=async()=>{const to=P.add(state.selected,7);if(!P.inRange(to))return;if(state.weeks[to]&&!(await confirmChange('The next week already has saved data. Replace its workouts and coach note?','Replace next week')))return;P.copyWeek(state,state.selected,to);persist();$('manage-dialog').close();toast('Copied to week '+P.isoWeek(to).week+' · '+shortDate(to));};
  $('reset-week').onclick=async()=>{if(await confirmChange('Restore this week’s original workouts and coach note? Other weeks will stay as they are.','Reset week')){state.weeks[state.selected]=P.defaultWeek(state.selected);persist();render();$('manage-dialog').close();toast('Week reset');}};
  $('clear-week').onclick=async()=>{if(await confirmChange('Remove all workouts from this week? Your coach note and fixed commitments will remain.','Clear workouts')){const w=current();w.workouts=[];setWeek(w);$('manage-dialog').close();toast('Workouts cleared');}};
  $('print').onclick=()=>window.print();
  function download(content,name,type) {const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
  $('export').onclick=()=>{download(JSON.stringify(state,null,2),'magnus-training-plan-'+today()+'.json','application/json');$('share-message').textContent='Plan exported. Keep this file as a backup or send it to your coach.';};
  $('import').onclick=()=>$('import-file').click();
  $('import-file').onchange=async e=>{
    const file=e.target.files[0];if(!file)return;
    try{if(file.size>MAX_FILE)throw Error('File is too large (maximum 2.5 MB).');const incoming=P.validateState(JSON.parse(await file.text()));const keys=Object.keys(incoming.weeks),overlap=keys.filter(k=>state.weeks[k]);
      if(!keys.length){$('share-message').textContent='This file contains only the unchanged default plan. No saved weeks to import.';return;}
      if(await confirmChange(`Import ${keys.length} saved week(s)? ${overlap.length} existing saved week(s) will be replaced. All other weeks remain. Export first if you need a backup.`,'Import weeks')){Object.assign(state.weeks,incoming.weeks);state.selected=incoming.selected;persist();render();$('share-dialog').close();toast('Plan imported');}
    }catch(err){$('share-message').textContent='Import failed: '+err.message;}finally{e.target.value='';}
  };
  async function encode(data) {
    let bytes=new TextEncoder().encode(JSON.stringify(data)),prefix='j';
    if(typeof CompressionStream!=='undefined'){bytes=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());prefix='g';}
    let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
    return prefix+btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  async function decode(token) {
    if(!/^[gj][A-Za-z0-9_-]+$/.test(token)||token.length>MAX_LINK)throw Error('Invalid or oversized shared link.');
    const bin=atob(token.slice(1).replace(/-/g,'+').replace(/_/g,'/')),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));
    let stream=new Blob([bytes]).stream();
    if(token[0]==='g'){if(typeof DecompressionStream==='undefined')throw Error('Use a current browser or ask for a JSON export.');stream=stream.pipeThrough(new DecompressionStream('gzip'));}
    const reader=stream.getReader();let count=0,chunks=[];
    while(true){const {done,value}=await reader.read();if(done)break;count+=value.length;if(count>MAX_FILE){await reader.cancel();throw Error('Shared plan exceeds the size limit.');}chunks.push(value);}
    const text=await new Blob(chunks).text();return P.validateState(JSON.parse(text));
  }
  async function share(full) {
    try{
      const data=full?P.clone(state):P.empty(state.selected);if(!full)data.weeks[state.selected]=current();
      const base=location.protocol==='file:'?'https://MagnusSkotteQuant.github.io/magnus-training-planner/':location.href.split('#')[0].split('?')[0];
      const url=base+'#plan='+await encode(data);
      if(url.length>MAX_LINK){$('share-message').textContent='This plan is too large for a reliable link. Use Export plan JSON instead.';return;}
      $('link-text').value=url;$('link-fallback').hidden=false;
      let copied=false;try{await navigator.clipboard.writeText(url);copied=true;}catch(e){$('link-text').focus();$('link-text').select();}
      $('share-message').textContent=(copied?'Link copied. ':'Select and copy the link below. ')+(location.protocol==='file:'?'This link will work once you publish the site on GitHub Pages.':'This is a snapshot; future edits need a new link.');
    }catch(err){$('share-message').textContent='Could not create link: '+err.message;}
  }
  $('share-week').onclick=()=>share(false);$('share-full').onclick=()=>share(true);
  $('save-shared').onclick=async()=>{
    const keys=Object.keys(state.weeks);
    if(await confirmChange(`Save ${keys.length} shared week(s) on this device? Local versions of these weeks will be replaced. Other local weeks will remain.`,'Save shared weeks')){
      const merged=P.clone(savedState);Object.assign(merged.weeks,state.weeks);merged.selected=state.selected;state=merged;shared=false;persist();clearHash();render();toast('Shared weeks saved');
    }
  };
  function clearHash(){try{history.replaceState(null,'',location.pathname+location.search);}catch(e){/* file:// history support varies */}}
  $('leave-shared').onclick=async()=>{if(await confirmChange('Return to your local plan? Unsaved shared edits will be discarded.','Return to my plan')){state=P.clone(savedState);shared=false;clearHash();render();persist();}};
  async function readShared() {
    if(!location.hash.startsWith('#plan='))return;
    try{const incoming=await decode(location.hash.slice(6));if(!shared)savedState=P.clone(state);state=incoming;shared=true;render();persist();}
    catch(err){toast('Shared link could not be opened');warn('Shared link could not be opened: '+err.message+' Your saved plan has not changed.');}
  }
  window.addEventListener('hashchange',readShared);
  window.addEventListener('storage',e=>{if(e.key===STORAGE&&!shared){warn('The plan changed in another tab. Refresh before editing here to use those changes.');storageBlocked=true;}});
  $('week-picker').innerHTML=P.weeks().map(s=>`<option value="${s}">${P.isoWeek(s).year} · W${P.isoWeek(s).week} · ${shortDate(s)}</option>`).join('');
  $('workout-intensity').innerHTML=P.INTENSITIES.map(v=>`<option>${v}</option>`).join('');
  $('workout-focus').innerHTML=P.FOCUSES.map(v=>`<option value="${v}">${v||'—'}</option>`).join('');
  try{const raw=localStorage.getItem(STORAGE);if(raw)state=P.validateState(JSON.parse(raw));}
  catch(e){storageBlocked=true;warn('Saved data could not be read. It has been left untouched. You can still plan in this tab and export JSON. Use a different browser profile or restore your backup after checking the original data.');}
  savedState=P.clone(state);render();persist();readShared();
})();
