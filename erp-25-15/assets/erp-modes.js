(() => {
  const faultNames={normal:'Normal',open:'Trabado abierto',closed:'Trabado cerrado', 'pilot-loss':'Sin alimentación al piloto', 'pilot-rupture':'Rotura completa de diafragma del piloto', 'main-rupture':'Rotura completa de diafragma principal'};
  const presets=[{"id": "normal", "name": "01 · Operación mediante rama 1", "group": "Operación", "key": "A"}, {"id": "branch2", "name": "02 · Operación mediante rama 2", "group": "Operación", "key": "C"}, {"id": "startup", "name": "03 · Operación mediante arranque", "group": "Operación", "key": "B"}, {"id": "monitor", "name": "04 · Falla activo R1 · FO", "group": "Rama 1", "key": "A"}, {"id": "monitor-fc-A", "name": "05 · Falla monitor R1 · FC", "group": "Rama 1", "key": "A"}, {"id": "qev-recover", "name": "06 · Bloqueo R1 no cierra · QEV recupera monitor", "group": "Rama 1", "key": "A"}, {"id": "qev-no-recover", "name": "07 · Falla conjunta activo + monitor + bloqueo R1 · alivio", "group": "Rama 1", "key": "A"}, {"id": "active-C", "name": "08 · Falla activo R2 · FO", "group": "Rama 2", "key": "C"}, {"id": "monitor-C", "name": "09 · Falla monitor R2 · FC", "group": "Rama 2", "key": "C"}, {"id": "relief-C", "name": "10 · Falla conjunta activo + monitor + bloqueo R2 · alivio", "group": "Rama 2", "key": "C"}, {"id": "startup-fc", "name": "11 · Falla pilotaje de arranque · FC", "group": "Arranque", "key": "B"}, {"id": "startup-relief", "name": "12 · Arranque no regula y bloqueo no cierra · alivio", "group": "Arranque", "key": "B"}, {"id": "rupture", "name": "13 · Rotura de red · alto consumo", "group": "Red", "key": "A"}, {"id": "zero-demand", "name": "14 · Consumo nulo de salida", "group": "Red", "key": "A"}];
  class Trainer {
    constructor(){this.settings={a1:1.5,a2:1.3,m1:1.7,m2:1.5,r:2.8,s1:2.1,s2:2.5,sb:2.1,ab:1.5,d:500};this.revision=0;this.select('normal');}
    settingsToModel(){const m=this.model,s=this.settings;m.cfg.demand=s.d;m.cfg.spRelief=s.r;m.qev.sp=s.m1+.2;m.branches.A.spActive=s.a1;m.branches.C.spActive=s.a2;m.branches.B.spActive=s.ab;for(const b of Object.values(m.branches)){b.spMonitor=b.key==='C'?s.m2:s.m1;b.spHi=s[b.key==='A'?'s1':b.key==='C'?'s2':'sb'];}}
    select(mode){
      const preset=presets.find(x=>x.id===mode)||presets[0];mode=preset.id;
      const startupBackup=['startup','startup-fc','startup-relief'].includes(mode);
      if(this.startupBackupSettings){Object.assign(this.settings,this.startupBackupSettings);this.startupBackupSettings=null;}
      if(startupBackup){this.startupBackupSettings={a1:this.settings.a1,a2:this.settings.a2};this.settings.a1=1.4;this.settings.a2=1.3;}
      const startupMode=preset.key==='B';
      if(startupMode){if(!this.startupProfile)this.mainDemand=this.settings.d;this.settings.d=100;this.settings.ab=1.5;}
      else this.settings.d=500;
      this.startupProfile=startupMode;this.mode=mode;this.revision++;this.name=preset.name;
      this.model=new ERP25Dynamics.Model();this.settingsToModel();const m=this.model;
      this.valves={A:{in:1,out:1},C:{in:1,out:1},B:{in:0,out:0}};
      const only=startupBackup?null:preset.key==='B'?'B':preset.key==='C'?'C':mode.startsWith('qev-')?'A':null;
      if(only)for(const k of ['A','C','B'])this.valves[k]={in:k===only?1:0,out:k===only?1:0};
      if(startupBackup)this.valves.B={in:1,out:1};
      this.sync();m.p=m.branches[preset.key].spActive;
      for(const b of Object.values(m.branches)){const ratio=Math.min(1,m.cfg.demand/b.qcap);b.a=b.key===preset.key?(b.key==='B'?ratio:ratio/Math.sqrt(2-ratio*ratio)):0;b.ia=b.a;b.m=1;b.im=1;}
      m.integrate(0);m.t=0;m.events=[];m.history=[];m.sample();this.steps=[];this.applied=new Set();this.manualFault='none';
      const initial=startupBackup?'Arranque regula a1,50bar; R1 disponible a1,40bar y R2 a1,30bar. Aislamientos y bloqueos abiertos; transferencia por caída de presión.':only?`${only==='B'?'Arranque':only==='C'?'R2':'R1'} en servicio; otras ramas aisladas.`:'R1 regula; R2 disponible como reserva a menor consigna; arranque aislado.';
      this.steps=[{at:0,text:initial+` Consigna ${m.p.toFixed(1)} bar; demanda ${m.cfg.demand} m³/h.`}];
      const event=(act,text)=>this.steps.push({at:4,act,text});
      if(mode==='monitor'||mode==='active-C')event(()=>m.branches[preset.key].activeFault='pilot-loss','Falla alimentación del piloto del activo FO: abre. El monitor sano toma la regulación a su consigna.');
      if(mode==='monitor-fc-A'||mode==='monitor-C')event(()=>m.branches[preset.key].monitorFault='pilot-loss',preset.key==='A'?'Monitor FC pierde pilotaje y cierra. R1 deja de aportar; R2 abre al caer la presión.':'Monitor FC de R2 pierde pilotaje y cierra. R1 está aislada: cae la presión por falta de aporte; no se abren válvulas manuales automáticamente.');
      if(mode==='qev-recover')event(()=>{const b=m.branches.A;b.activeFault='pilot-loss';b.ssvFault='open';b.monitorHold=true;},'Activo FO falla abierto y el bloqueo está averiado sin cierre. Se añade evacuación lenta de cámara del monitor: el QEV descarga la cámara y permite recuperar la regulación.');
      if(mode==='qev-no-recover')event(()=>{const b=m.branches.A;b.activeFault='pilot-loss';b.ssvFault='open';b.monitorFault='open';},'Activo FO falla abierto, monitor trabado abierto y bloqueo sin cierre. El QEV actúa, pero no libera un atasco mecánico; la presión sube hasta abrir el alivio R1.');
      if(mode==='relief-C')event(()=>{const b=m.branches.C;b.activeFault='pilot-loss';b.monitorFault='open';b.ssvFault='open';},'Activo FO abierto, monitor trabado abierto y bloqueo sin cierre. R2 no tiene QEV: al subir la presión actúa su alivio.');
      if(mode==='startup-fc')event(()=>m.branches.B.activeFault='pilot-loss','El TA631 pierde presión de pilotaje y cierra (FC). Al caer la presión, R1 toma el aporte a1,40bar; R2 queda disponible a1,30bar.');
      if(mode==='startup-relief')event(()=>{m.branches.B.activeFault='open';m.branches.B.ssvFault='open';},'Atasco mecánico abierto del631, distinto de su falla de pilotaje FC, y bloqueo sin cierre. La presión aumenta y abre el alivio de arranque.');
      if(mode==='rupture')event(()=>{m.cfg.demand=4000;this.settings.d=4000;},'Rotura representada como demanda elevada de4000 m³/h: aumenta el aporte, R2 entra al caer la presión y la capacidad total resulta insuficiente.');
      if(mode==='zero-demand')event(()=>{m.cfg.demand=0;this.settings.d=0;},'Cesa el consumo: el regulador cierra. La red permanece presurizada aunque ya no circule gas.');
      this.message='';this.applySteps();m.integrate(0);
    }
    sync(){for(const [k,v] of Object.entries(this.valves)){const b=this.model.branches[k];b.enabled=v.in>0.98&&v.out>0.98;b.reliefConnected=v.out>.98;}}
    applySteps(){this.steps.forEach((step,i)=>{if(this.model.t>=step.at&&!this.applied.has(i)){this.applied.add(i);if(step.act)step.act();this.message=step.text;this.model.log(step.text);this.sync();}});}
    advance(seconds){const n=Math.ceil(seconds/.04);for(let i=0;i<n;i++){this.applySteps();this.sync();this.model.advance(seconds/n);}this.applySteps();}
    fault(k,device,value){if(!['normal','open','closed'].includes(value)&&(device==='ssv'||k==='B'&&value!=='pilot-loss'))return false;this.model.branches[k][device+'Fault']=value;this.model.log(`${k} · ${device}: ${faultNames[value]}`);this.model.integrate(0);}
    setFault(value){const b=this.model.branches.A;for(const d of ['active','monitor','ssv'])b[d+'Fault']='normal';if(value!=='none'){const [d,v]=value.split('-');this.fault('A',d,v);}this.manualFault=value;}
    state(k){const b=this.model.branches[k],v=this.valves[k];return {inlet:v.in,outlet:v.out,ssv:b.ssvFault==='closed'||b.latched&&b.ssvFault!=='open'?0:1,monitor:k==='B'?null:this.model.effectiveFault(b,'monitor')==='open'?1:this.model.effectiveFault(b,'monitor')==='closed'?0:b.m,active:this.model.effectiveFault(b,'active')==='open'?1:this.model.effectiveFault(b,'active')==='closed'?0:b.a,q:b.q,latched:b.latched};}
    // Topological visual domains. Each closed obturator separates upstream and downstream.
    // Intermediate/trapped pressures are educational estimates, not a second flow solver.
    domains(k,old=[]){
      const st=this.state(k),b=this.model.branches[k],p=this.model.p,pin=this.model.cfg.pin,L=ERP25Layout.branches[k];
      const devices=[{id:'in-'+k,x:L.inlet,open:st.inlet},{id:'ssv-'+k,x:L.ssv,open:st.ssv}];
      if(k!=='B')devices.push({id:'monitor-'+k,x:L.monitor,open:st.monitor});devices.push({id:'active-'+k,x:L.active,open:st.active},{id:'out-'+k,x:L.outlet,open:st.outlet});
      const cuts=devices.filter(d=>d.open<=.000001),edges=[-5,...cuts.map(d=>d.x),5],fixed=[-5,...devices.map(d=>d.x),5];
      return fixed.slice(1).map((end,index)=>{const start=fixed[index],mid=(start+end)/2,component=edges.findIndex((edge,i)=>i<edges.length-1&&mid>edge&&mid<edges[i+1]);
        let pressure,source;
        const connectedBoth=edges.length===2;
        if(connectedBoth){source='paso';if(mid<L.monitor||k==='B'&&mid<L.active)pressure=pin;else if(mid<L.active){const ra=1/Math.max(.000001,st.active*st.active),rm=1/Math.max(.000001,st.monitor*st.monitor);pressure=pin-(pin-p)*rm/(ra+rm);}else pressure=p;}
        else if(component===0){source='entrada';pressure=mid>L.active&&b.activeFault==='normal'?Math.min(pin,b.spActive):pin;}
        else if(component===edges.length-2){pressure=p;source='salida';}
        else{const prior=old.find(d=>mid>=d.start&&mid<=d.end);pressure=prior?prior.pressure:0;source='atrapado';}
        return {start,end,pressure,source,flow:Math.max(0,st.q),stop:cuts.find(d=>Math.abs(d.x-end)<.0001)?.id||null};
      });
    }
  }
  globalThis.ERP25Trainer={Trainer,presets,faultNames};
})();
