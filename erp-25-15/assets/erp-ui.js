(() => {
  const root=document.getElementById('erp25-3d'),f=name=>root.querySelector(`[data-f="${name}"]`),a=name=>root.querySelector(`[data-a="${name}"]`);
  if(typeof THREE==='undefined'){f('error').hidden=false;f('error').textContent='No se pudo cargar el motor 3D. Abrí el archivo descargable, que incluye el motor.';return;}
  const css=getComputedStyle(root),colorCanvas=document.createElement('canvas');colorCanvas.width=1;colorCanvas.height=1;
  const colorContext=colorCanvas.getContext('2d');
  const col=name=>{const raw=css.getPropertyValue(name).trim()||getComputedStyle(root).color;const probe=document.createElement('span');probe.style.color=raw;root.appendChild(probe);const result=getComputedStyle(probe).color;probe.remove();colorContext.clearRect(0,0,1,1);colorContext.fillStyle=result;colorContext.fillRect(0,0,1,1);const rgb=colorContext.getImageData(0,0,1,1).data;return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;};
  const palette={background:'#101d2b',floor:'#aab5bf',pipe:'#dcae14',metal:'#8999a7',filter:'#c2cbd1',skid:'#24543d',structure:'#536475',gas:'#2b779f',open:col('--green'),closed:col('--destructive'),highlight:col('--purple'),high:'#a86a1b',tubing:'#8e9fab',trapped:col('--orange')};
  const trainer=new ERP25Trainer.Trainer(),plant=new ERP25Scene.Plant(palette);
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas:f('canvas'),antialias:true,alpha:true});}
  catch(e){
    try{renderer=new ERP25Software.SoftwareRenderer(f('canvas'));}
    catch(err){f('error').hidden=false;f('error').textContent='El navegador no pudo iniciar la vista 3D.';return;}
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputEncoding=THREE.sRGBEncoding;renderer.localClippingEnabled=true;if(renderer.shadowMap){renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;}renderer.setClearColor(palette.background,0);
  const camera=new THREE.PerspectiveCamera(38,1,.1,100),target=new THREE.Vector3(0,.65,0);
  let orbit={theta:.66,phi:1.08,radius:19.5},lastStamp=0,lastUI=0,running=!matchMedia('(prefers-reduced-motion: reduce)').matches;
  let labelsVisible=true,savedPlaybackSpeed=null;let faultDraft=false;const pointers=new Map();let lastDistance=0,dragged=false,lastNarrative='',selected='monitor-A';
  const fmt=(v,n=2)=>v.toLocaleString('es-AR',{minimumFractionDigits:n,maximumFractionDigits:n});
  function updateCamera(){const radius=orbit.radius*(f('stage').getBoundingClientRect().width<500?1.22:1);camera.position.set(target.x+radius*Math.sin(orbit.phi)*Math.sin(orbit.theta),target.y+radius*Math.cos(orbit.phi),target.z+radius*Math.sin(orbit.phi)*Math.cos(orbit.theta));camera.lookAt(target);camera.updateMatrixWorld();}
  function resize(){const rect=f('stage').getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.fov=rect.width<450?50:38;camera.updateProjectionMatrix();updateCamera();renderLabels();}
  const descriptions={
    'in':'Aislamiento de entrada: palanca paralela al eje de la cañería = abierta; perpendicular = cerrada.',
    'out':'Aislamiento de salida al colector común. En estos modos ambas válvulas manuales se muestran con su estado.',
    'filter':'Filtro principal blanco, tapa bridada, manómetros y drenaje inferior. No confundir con los cilindros pequeños de filtro de piloto.',
    'monitor':'TA956 FC aguas arriba del activo. Contiene la SSV integrada; los pilotos y filtros metálicos están junto al cuerpo.',
    'active':'DFO aguas abajo del monitor en las laterales; regulador 631 en arranque. La tabla muestra su apertura y el corte muestra asiento, obturador y vástago didácticos.',
    'ssv':'Bloqueo SSV: integrado en el monitor de las laterales y cuerpo separado en arranque. Cerrado interrumpe el aporte de la rama.',
    'relief':'Alivio de línea y descarga vertical. Descarga individual según apertura y presión; no se confunde con el QEV del piloto.',
    'gauge':'Manómetro de presión de red. La lectura calculada corresponde al colector común; las presiones intermedias mostradas en el corte son estimaciones.',
    'odorizer':'Tanque horizontal y dos líneas al colector de salida. Dosificación de odorante no calculada.',
    'PIT 3001':'Transmisor de presión de entrada con manifold de referencia.',
    'PIT 3002':'Transmisor de presión de salida con manifold de referencia.'
  };
  const unique=Object.entries(plant.parts).filter(([id,p])=>!id.endsWith('-lever')&&!id.endsWith('-needle')&&!id.startsWith('ssv-indicator-'));
  f('component').innerHTML=unique.map(([id,p])=>`<option value="${id}">${p.key?(p.key==='A'?'R1':p.key==='C'?'R2':'Arranque')+' · ':''}${p.name}</option>`).join('');
  function choose(id){selected=id;if(root.erpCurves&&ERP25Curves.units.some(([unit])=>unit===id))root.erpCurves.select(id);f('component').value=id;plant.select(id);const part=plant.parts[id],kind=id.startsWith('PIT')?id:id.split('-')[0];f('detail').textContent=part.name.replace(/ · (?:plano |la instalación )?#.*$/,'');f('technical-detail').textContent=part.description||descriptions[kind]||'';renderLabels();}
  function project(point){return point.clone().project(camera);}
  const openingText=(k,kind)=>{const st=trainer.state(k);return !trainer.model.branches[k].enabled||!st.ssv?'N/C':fmt(100*st[kind],1)+' %';};
  function renderLabels(){
    const rect=f('stage').getBoundingClientRect(),w=rect.width,h=rect.height;if(!w)return;
    const labels=[
      {id:'total-in',priority:-6,text:'ENT '+fmt(trainer.model.cfg.pin,1)+' bar',point:new THREE.Vector3(-6.3,ERP25Layout.y+.45,0)},
      {id:'total-out',priority:-6,text:'SAL '+fmt(trainer.model.p,2)+' bar · '+fmt(trainer.model.qd,0)+' Nm³/h',point:new THREE.Vector3(6.3,ERP25Layout.y+.45,0)}];
    const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;');
    f('branch-readings').innerHTML=['A','C','B'].map(k=>{const st=trainer.state(k),name=k==='A'?'R1 · principal':k==='C'?'R2 · reserva':'AR · arranque';return `<div class="erp-reading"><strong>${name}</strong><span><b>${fmt(trainer.model.p)}</b> bar(g) · <b>${fmt(st.q,1)}</b> Nm³/h</span><small>${k==='B'?'Estado: '+openingText(k,'active'):'M '+openingText(k,'monitor')+' · A '+openingText(k,'active')}</small></div>`;}).join('');
    const faultText=f('header-readings').dataset.faultText||'Sin fallas activas';
    f('header-readings').innerHTML=`<div><small>ENTRADA TOTAL</small><b>${fmt(trainer.model.cfg.pin)} <small>bar(g)</small></b><span>${fmt(trainer.model.qin,1)} Nm³/h</span></div><div><small>SALIDA A RED</small><b>${fmt(trainer.model.p)} <small>bar(g)</small></b><span>${fmt(trainer.model.qd,1)} Nm³/h</span></div><div><small>ALIVIO</small><b>${fmt(trainer.model.qr,1)} <small>Nm³/h</small></b><span>R1 ${fmt(trainer.model.branches.A.relief.q,0)} · R2 ${fmt(trainer.model.branches.C.relief.q,0)} · AR ${fmt(trainer.model.branches.B.relief.q,0)}</span></div><div class="erp-kpi-state"><small>ESTADO GENERAL</small><b>${f('header-readings').dataset.faults>0?'Atención':'Normal'}</b><span title="${esc(faultText)}">${esc(faultText)}</span></div>`;
    for(const k of ['A','C','B']){const L=ERP25Layout.branches[k],st=trainer.state(k),name=k==='A'?'R1':k==='C'?'R2':'AR';
      labels.push({id:'opening-'+k,priority:-4,text:k==='B'?'AR · '+openingText(k,'active'):name+' · M '+openingText(k,'monitor')+' · A '+openingText(k,'active'),point:new THREE.Vector3(k==='B'?L.active:(L.monitor+L.active)/2,ERP25Layout.y+1,L.z)});
    }
    for(const k of ['A','C','B']){const L=ERP25Layout.branches[k];for(const kind of k==='B'?['active']:['monitor','active'])labels.push({id:'failmode-'+kind+'-'+k,priority:-3,text:kind==='active'&&k!=='B'?'FO':'FC',point:new THREE.Vector3(L[kind],ERP25Layout.y-.45,L.z)});}
    if(trainer.model.qev.active||trainer.model.qev.acted)labels.push({id:'qev-state',priority:-5,text:trainer.model.qev.active?'QEV · descarga cámara':'QEV · actuó',point:new THREE.Vector3(ERP25Layout.branches.A.monitor,ERP25Layout.y+1.65,ERP25Layout.branches.A.z)});
    if(!labelsVisible){f('labels').innerHTML='';return;}
    const placed=[],out=[];
    labels.sort((x,y)=>x.priority-y.priority);
    for(const label of labels){const p=project(label.point);if(p.z>1||p.z< -1)continue;const px=(p.x+1)*w/2,py=(-p.y+1)*h/2;
      if(px< -30||px>w+30||py< -30||py>h+30)continue;
      const tw=Math.min(w-16,label.text.length*6.6+8),x=Math.max(8+tw/2,Math.min(w-8-tw/2,px));let y=Math.max(20,Math.min(h-12,py));
      let fits=false;for(const dy of [0,-24,24,-48,48,-72,72,-96,96,-120,120]){const yy=Math.max(20,Math.min(h-12,y+dy));const box={x:x-tw/2,y:yy-13,w:tw,h:17};if(!placed.some(b=>box.x<b.x+b.w+4&&box.x+box.w+4>b.x&&box.y<b.y+b.h+4&&box.y+box.h+4>b.y)){y=yy;placed.push(box);fits=true;break;}}
      if(!fits)continue;
      if(label.id?.startsWith('opening-')||Math.abs(y-py)>12||Math.abs(x-px)>15)out.push(`<path d="M ${px.toFixed(1)} ${py.toFixed(1)} L ${x.toFixed(1)} ${(y-7).toFixed(1)}" fill="none" stroke="var(--border)"/>`);
      if(label.id?.startsWith('opening-')||label.id?.startsWith('total-'))out.push(`<rect x="${(x-tw/2-4).toFixed(1)}" y="${(y-15).toFixed(1)}" width="${(tw+8).toFixed(1)}" height="20" rx="8" fill="#142a3e" stroke="var(--border)"/>`);
      out.push(`<text ${label.id?.startsWith('failmode-')?'data-failmode="'+label.id+'" style="font-size:10px;font-weight:600"':''} x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle">${label.text.replaceAll('&','&amp;').replaceAll('<','&lt;')}</text>`);
    }
    f('labels').setAttribute('viewBox',`0 0 ${w} ${h}`);f('labels').innerHTML=out.join('');
  }
  a('equipment-summary').addEventListener('click',()=>{f('workspace').dataset.expanded='false';a('expand').textContent='Ampliar paneles';a('expand').setAttribute('aria-pressed','false');f('equipment-summary').open=true;f('equipment-summary').scrollIntoView({behavior:'smooth',block:'start'});});
  function narrative(){const m=trainer.model;
    if(trainer.mode==='startup-relief'&&m.branches.B.activeFault!=='normal'){
      const reserve=['A','C'].map(k=>{const b=m.branches[k],name=k==='A'?'R1':'R2';return name+' ('+fmt(b.spActive)+' bar): '+(b.latched?'bloqueo enclavado por alta presión':b.q>1?'aportando '+fmt(b.q,0)+' m³/h':'sin aporte; presión superior a su consigna');}).join('. ');
      return trainer.message+' '+reserve+'. '+(m.qr>1?'Venteo total '+fmt(m.qr,0)+' m³/h; '+(m.balance>1?'ingreso superior a consumo + venteo: sube la presión.':'balance de gas aproximándose al equilibrio.'):'Alivios aún sin descarga significativa.');
    }
    if(trainer.startupBackupSettings){if(m.branches.C.q>1)return 'R2 está aportando al caer la presión a su consigna de reserva. La transferencia surge de la regulación; las válvulas manuales no cambiaron.';if(m.branches.A.q>1)return 'R1 tomó el aporte a '+fmt(m.branches.A.spActive)+' bar por caída de presión. '+(m.branches.B.q>1?'Arranque continúa aportando hasta su capacidad.':'Arranque sin aporte.');return 'Arranque en servicio a '+fmt(m.branches.B.spActive)+' bar. R1 y R2 disponibles a '+fmt(m.branches.A.spActive)+' y '+fmt(m.branches.C.spActive)+' bar; aislamientos y bloqueos abiertos.';}
    if(trainer.mode==='qev-recover'&&m.qev.acted&&Math.abs(m.p-m.branches.A.spMonitor)<.03)return 'El QEV descargó la cámara y el monitor recuperó la regulación. Activo averiado abierto; bloqueo sigue averiado. El alivio no necesita abrir.';
    if(trainer.mode==='qev-no-recover'&&m.qr>1)return 'El QEV actúa, pero el monitor está trabado abierto. El bloqueo no cierra y el alivio R1 descarga; si no alcanza, la presión sigue aumentando.';
    if(m.qr>1)return trainer.message+' Venteo '+fmt(m.qr,0)+' m³/h; '+(m.balance>1?'ingreso superior a consumo + venteo: sube la presión.':'balance de gas aproximándose al equilibrio.');
    if(trainer.mode==='monitor-fc-A'&&m.branches.C.q>m.cfg.demand*.9)return 'Monitor R1 cerrado por falla FC. R2 tomó el aporte a su consigna de reserva.';
    return trainer.message;
  }
  function updateUI(){const m=trainer.model;for(const input of settingInputs)if(input.dataset.sp==='d'&&document.activeElement!==input&&f('settings-result').textContent!=='Hay consignas editadas sin aplicar.')input.value=String(trainer.settings.d);a('scenario').disabled=f('scenario').value==='custom';
    const names={A:'R1',C:'R2',B:'Arranque'},faults=[];
    for(const [k,b] of Object.entries(m.branches)){for(const d of k==='B'?['active','ssv']:['active','monitor','ssv'])if(b[d+'Fault']!=='normal')faults.push(names[k]+' '+({active:'activo',monitor:'monitor',ssv:'bloqueo'}[d])+': '+ERP25Trainer.faultNames[b[d+'Fault']]);if(b.reliefFault!=='normal')faults.push(names[k]+' alivio: '+ERP25Trainer.faultNames[b.reliefFault]);if(b.latched)faults.push(names[k]+': disparo enclavado');if(b.qcap!==b.designFlow)faults.push(names[k]+': capacidad reducida a '+fmt(b.qcap,0));}
    if(m.cfg.reliefFault!=='normal')faults.push('Alivio: '+ERP25Trainer.faultNames[m.cfg.reliefFault]);
    f('header-readings').dataset.faults=String(faults.length);f('header-readings').dataset.faultText=faults.length?faults.join(' · '):'Sin fallas activas';
    const pending=trainer.steps.filter((s,i)=>s.act&&!trainer.applied.has(i));
    const currentName=trainer.mode==='custom'?'Combinación manual':trainer.name;const pendingSelection=f('scenario').value&&f('scenario').value!==trainer.mode;f('scene-scenario-status').textContent=(running?'En curso: ':'Pausado: ')+currentName+(pendingSelection?' · Selección pendiente: pulsá Iniciar.':'');f('scene-scenario-status').setAttribute('title',f('scene-scenario-status').textContent);
    f('active-config').textContent=(running?'● En curso':'Ⅱ Pausado')+' · Entrada '+fmt(m.cfg.pin,1)+' bar · Demanda '+fmt(m.cfg.demand,0)+' Nm³/h · '+(faults.length?faults.length+' fallas / restricciones':'Sin fallas activas')+' · t '+fmt(m.t,1)+' s'+(pendingSelection?' · Selección pendiente: Iniciar':'');f('active-config').title=currentName+(faults.length?' · '+faults.join(' · '):'')+(pending.length?' · Cambio a t='+pending[0].at+' s':'');
f('pressure').textContent=`Salida ${fmt(m.p)} bar(g)`;f('flow').textContent=`Aporte ${fmt(m.qin,0)} · red ${fmt(m.qd,0)} · alivio ${fmt(m.qr,0)} Nm³/h`;f('time').textContent=`t ${fmt(m.t,1)} s`;
    if(plant.parts[selected]?.key){const k=plant.parts[selected].key,st=trainer.state(k),kind=selected.split('-')[0];let stateText='';if(kind==='active')stateText=`Apertura ${openingText(k,'active')}`;if(kind==='monitor')stateText=`Apertura ${openingText(k,'monitor')}`;if(kind==='relief'){const r=trainer.model.branches[k].relief;stateText=`${fmt(r.opening*100,0)} % · ${fmt(r.q,1)} m³/h · capacidad a esta presión ${fmt(r.qmax,1)} m³/h`;}if(kind==='ssv')stateText=st.ssv?'ABIERTA':'CERRADA';if(kind==='in'||kind==='out')stateText=(kind==='in'?st.inlet:st.outlet)?'ABIERTA':'CERRADA';const domains=plant.domainMemory[k]||[],cut=domains.find(d=>d.stop===selected);f('detail').textContent=plant.parts[selected].name+' · '+stateText+(cut?' · Gas llega hasta este obturador, '+fmt(cut.pressure)+' bar(g) estimados.':'');f('technical-detail').textContent=kind==='qev'?'QEV: '+(m.qev.active?'descargando cámara':m.qev.acted?'actuó; ahora cerrado':'en espera')+'. Umbral didáctico '+fmt(m.qev.sp)+' bar; no rearma el bloqueo.':plant.parts[selected].description||descriptions[kind]||'';}
    const text=narrative();if(text!==lastNarrative){lastNarrative=text;f('narrative').textContent=text;}
    f('states').innerHTML=['A','C','B'].map(k=>{const st=trainer.state(k);return `<tr><td>${k==='A'?'Rama 1':k==='C'?'Rama 2':'Arranque'}</td><td>${st.inlet?'Abierta':'Cerrada'} / ${st.outlet?'Abierta':'Cerrada'}</td><td>${st.ssv?'Abierta':'Cerrada'}${st.latched?' · enclavada':''}</td><td>${k==='B'?'—':openingText(k,'monitor')} / ${openingText(k,'active')}</td><td class="text-end tabular-nums">${fmt(st.q,0)} Nm³/h</td></tr>`;}).join('');
    if(root.erpCurves)root.erpCurves.draw();a('play').textContent=running?'Pausar':'Continuar';renderLabels();
  }
  const groups=[...new Set(ERP25Trainer.presets.map(p=>p.group))];
  f('scenario').innerHTML=groups.map(g=>`<optgroup label="${g}">${ERP25Trainer.presets.filter(p=>p.group===g).map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</optgroup>`).join('');
  function startMode(mode){if(['rupture','zero-demand'].includes(mode)){if(savedPlaybackSpeed===null)savedPlaybackSpeed=f('speed').value;f('speed').value='0.5';}else if(savedPlaybackSpeed!==null){f('speed').value=savedPlaybackSpeed;savedPlaybackSpeed=null;}faultDraft=false;trainer.select(mode);for(const input of settingInputs)input.value=String(trainer.settings[input.dataset.sp]);f('settings-result').textContent=trainer.startupBackupSettings?'Sólo en este escenario: arranque1,50 · R1 1,40 · R2 1,30bar. Al salir se restauran los ajustes de R1/R2.':trainer.startupProfile?'Perfil arranque: consigna1,5bar y demanda100m³/h.':'';f('scenario').value=mode;running=true;lastNarrative='';const preset=ERP25Trainer.presets.find(p=>p.id===mode),device=mode.startsWith('qev-')?'qev':['monitor-fc-A','monitor-C'].includes(mode)?'monitor':['relief-C','startup-relief'].includes(mode)?'ssv':'active',key=preset?.key||((mode==='startup'||mode==='startup-fill')?'B':'A');choose(device+'-'+key);if(root.erpCurves)root.erpCurves.select(mode==='transfer'?'active-C':mode==='monitor'?'monitor-A':'active-'+key);plant.update(trainer,1,false);updateUI();}
  f('scenario').value=trainer.mode;
  f('scenario').addEventListener('change',()=>updateUI());
  a('scenario').addEventListener('click',()=>startMode(f('scenario').value));
  a('focus').addEventListener('click',()=>{const g=plant.parts[selected].group;plant.scene.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(g);target.copy(box.getCenter(new THREE.Vector3()));orbit.radius=Math.max(3.2,box.getSize(new THREE.Vector3()).length()*2.2);updateCamera();renderLabels();});
  a('overall').addEventListener('click',()=>{target.set(0,.65,0);orbit={theta:.66,phi:1.08,radius:19.5};updateCamera();renderLabels();});
  const windows=()=>{for(const list of Object.values(plant.windows))for(const w of list)w.group.visible=f('windows').checked;};f('windows').addEventListener('change',windows);windows();
  f('signals').addEventListener('change',()=>plant.signals(f('signals').checked));
  a('connections').addEventListener('click',()=>{const k=plant.parts[selected]?.key||'A',L=ERP25Layout.branches[k];target.set(.2,2.0,L.z);orbit={theta:.20,phi:.58,radius:9};f('signals').checked=true;plant.signals(true);choose(k==='B'?'signal-ssv-B':'manifold-'+k);updateCamera();renderLabels();});
  f('cutaway').addEventListener('change',()=>plant.cutaway(f('cutaway').checked));
  a('play').addEventListener('click',()=>{running=!running;lastStamp=0;updateUI();});
  a('step').addEventListener('click',()=>{running=false;trainer.advance(5);plant.update(trainer,1,false);updateUI();renderer.render(plant.scene,camera);});
  f('xray').addEventListener('change',()=>plant.xray(f('xray').checked));f('component').addEventListener('change',()=>choose(f('component').value));

  a('labels-toggle').addEventListener('click',()=>{labelsVisible=!labelsVisible;a('labels-toggle').setAttribute('aria-pressed',String(labelsVisible));renderLabels();});
  a('fit').addEventListener('click',()=>a('overall').click());
  for(const [key,value] of [['top','top'],['side','front']])a(key).addEventListener('click',()=>{f('camera').value=value;f('camera').dispatchEvent(new Event('change'));});
  const settingInputs=[...root.querySelectorAll('[data-sp]')];
  settingInputs.forEach(input=>input.addEventListener('input',()=>{f('settings-result').textContent='Hay consignas editadas sin aplicar.';}));
  a('settings-apply').addEventListener('click',()=>{
    const next={};for(const input of settingInputs){const value=Number(input.value);if(input.value===''||!Number.isFinite(value)||value<Number(input.min)||value>Number(input.max)){f('settings-result').textContent='Revisá '+input.dataset.sp+': valor fuera del rango indicado. No se aplicó ningún cambio.';return;}next[input.dataset.sp]=value;}
    const warnings=[];if(next.d>200&&trainer.model.branches.B.enabled&&!trainer.model.branches.A.enabled&&!trainer.model.branches.C.enabled)warnings.push('La rama de arranque aporta como máximo 200 m³/h en este modelo.');if(next.a2>=next.a1)warnings.push('R2 no queda como reserva por menor consigna; puede compartir o tomar el aporte.');if(next.m1<=next.a1||next.m2<=next.a2)warnings.push('El monitor puede regular antes que el activo.');if(next.r<=Math.max(next.m1,next.m2))warnings.push('El alivio puede descargar antes de que estabilice el monitor.');
    Object.assign(trainer.settings,next);trainer.settingsToModel();trainer.revision++;f('settings-result').textContent='Consignas aplicadas. '+warnings.join(' ');updateUI();
  });
  f('camera').addEventListener('change',()=>{target.set(0,.65,0);const value=f('camera').value;orbit=value==='front'?{theta:0,phi:1.30,radius:20}:value==='top'?{theta:0,phi:.02,radius:21}:{theta:.66,phi:1.08,radius:19.5};updateCamera();renderLabels();});
  a('zoom-in').addEventListener('click',()=>{orbit.radius=Math.max(3,orbit.radius*.8);updateCamera();renderLabels();});
  a('zoom-out').addEventListener('click',()=>{orbit.radius=Math.min(35,orbit.radius*1.25);updateCamera();renderLabels();});
  f('panel-width').addEventListener('input',()=>{f('workspace').style.setProperty('--scene-share',f('panel-width').value+'%');});
  a('expand').addEventListener('click',()=>{const expanded=f('workspace').dataset.expanded!=='true';f('workspace').dataset.expanded=String(expanded);a('expand').textContent=expanded?'Restaurar paneles':'Ampliar paneles';a('expand').setAttribute('aria-pressed',String(expanded));resize();});
  function pan(dx,dy){const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1);target.addScaledVector(right,-dx*orbit.radius*.0015).addScaledVector(up,dy*orbit.radius*.0015);}
  const canvas=f('canvas');
  canvas.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);dragged=false;lastDistance=0;});
  canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const previous=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const dx=e.clientX-previous.x,dy=e.clientY-previous.y;if(Math.abs(dx)+Math.abs(dy)>2)dragged=true;
    if(pointers.size===2){const [p1,p2]=[...pointers.values()],distance=Math.hypot(p1.x-p2.x,p1.y-p2.y);if(lastDistance)orbit.radius=Math.max(3,Math.min(35,orbit.radius*lastDistance/distance));lastDistance=distance;}
    else if(e.shiftKey){pan(dx,dy);}else{orbit.theta-=dx*.008;orbit.phi=Math.max(.10,Math.min(1.50,orbit.phi+dy*.007));}
    updateCamera();renderLabels();
  });
  canvas.addEventListener('pointerup',e=>{pointers.delete(e.pointerId);if(!dragged){const rect=canvas.getBoundingClientRect(),pointer=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(plant.items,false)[0];if(hit)choose(hit.object.userData.id);}lastDistance=0;});
  canvas.addEventListener('pointercancel',e=>pointers.delete(e.pointerId));canvas.addEventListener('wheel',e=>{e.preventDefault();orbit.radius=Math.max(3,Math.min(35,orbit.radius*(1+Math.sign(e.deltaY)*.07)));updateCamera();renderLabels();},{passive:false});
  new ResizeObserver(resize).observe(f('stage'));plant.xray(true);plant.cutaway(f('cutaway').checked);resize();choose(selected);plant.update(trainer,1,false);updateUI();
  let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(stamp){const dt=lastStamp?Math.min((stamp-lastStamp)/1000,.25):0;lastStamp=stamp;if(running&&dt)trainer.advance(dt*Number(f('speed').value));plant.update(trainer,dt,running&&!reduced);renderer.render(plant.scene,camera);if(stamp-lastUI>250){updateUI();lastUI=stamp;}requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
  // Read-only inspection hook for validating model/scene correspondence.
  root.erpDebug={trainer,plant,camera,renderer,select:choose};
})();
