(() => {
  'use strict';
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const PN = 1.01325, T = 293.15, TN = 273.15;
  // Normalized ideal-gas nozzle curve. Capacities are illustrative, not valve Cg/Cv.
  function nozzle(pu, pd, ratedGauge) {
    if(pu <= pd || pu <= 0) return 0;
    const up=pu+PN, down=pd+PN, gamma=1.3;
    const critical=Math.pow(2/(gamma+1),gamma/(gamma-1));
    const r=clamp(down/up,0,1);
    const f=x=>Math.sqrt(Math.max(0,Math.pow(x,2/gamma)-Math.pow(x,(gamma+1)/gamma)));
    return up/(ratedGauge+PN)*(r<=critical?1:f(r)/f(critical));
  }
  function branch(k) {
    return {key:k, enabled:k==='A', spActive:1.5, spMonitor:1.8, spHi:2.8, spLo:0.7,
      lowEnabled:false, activeFault:'normal', monitorFault:'normal', ssvFault:'normal', qcap:k==='B'?200:1500, designFlow:k==='B'?200:1500, failActive:k==='B'?'closed':'open', failMonitor:k==='B'?null:'closed', reliefFault:'normal', reliefConnected:k!=='B', relief:{ratedFlow:k==='B'?20:150,ratedPressure:3.08,opening:0,q:0,qmax:0},
      a:0.2, m:1, ia:0.2, im:1, latched:false, lowArmed:false, armTime:0, tripTime:0, q:0, prior:''};
  }
  class Model {
    constructor(scenario='normal') { this.reset(scenario); }
    reset(scenario='normal') {
      this.cfg={pin:25,demand:500,spRelief:2.2,reliefFault:'normal',volume:15};
      this.branches={A:branch('A'), B:branch('B'), C:branch('C')};
      this.qev={active:false,acted:false,sp:1.9};
      this.t=0; this.p=scenario==='startup'?0:1.5; this.r=0; this.qin=0; this.qd=0; this.qr=0;
      this.history=[]; this.events=[]; this.previousRelief=false; this.scenario=scenario;
      const a=this.branches.A;
      if(['active','double','relief','unsafe'].includes(scenario)) a.activeFault='open';
      if(['double','relief','unsafe'].includes(scenario)) a.monitorFault='open';
      
      if(scenario==='unsafe') {a.ssvFault='open'; this.cfg.reliefFault='closed';}
      if(scenario==='closed') a.monitorFault='closed';
      if(scenario==='startup') {a.enabled=false; this.branches.B.enabled=true;}
      this.log('Inicio del escenario'); this.integrate(0); this.sample();
    }
    log(message) {this.events.push({t:this.t,p:this.p,message}); if(this.events.length>100)this.events.shift();}
    // Manual 956-IOM-001 §4.1/4.2: complete diaphragm rupture or unavailable pilot supply.
    // Mechanical jams remain separate. No unsupported failure philosophy assigned to 631.
    effectiveFault(b,device) {
      const fault=b[device+'Fault'];
      if(['pilot-loss','pilot-rupture','main-rupture'].includes(fault)) {
        if(device==='ssv'||b.key==='B'&&fault!=='pilot-loss')throw new Error('Falla no documentada para este equipo');
        return device==='active'?b.failActive:b.failMonitor;
      }
      if(fault==='normal' && device!=='ssv' && b.key!=='B' && this.cfg.pin<=0)
        return device==='active'?b.failActive:b.failMonitor;
      return fault;
    }
    control(b, field, integral, fault, sp, dt) {
      if(fault==='open') {b[field]=1; return;}
      if(fault==='closed') {b[field]=0; return;}
      const error=sp-this.p, kp=3.0, ki=1.4;
      const raw=b[integral]+kp*error;
      if((raw<1 || error<0) && (raw>0 || error>0)) b[integral]=clamp(b[integral]+ki*error*dt,0,1);
      const target=clamp(b[integral]+kp*error,0,1);
      b[field]+= (target-b[field])*Math.min(1,dt/0.18);
    }
    canRearm(k) {
      const b=this.branches[k];
      return b.latched && b.ssvFault==='normal' && this.p < b.spHi-0.1 && (!b.lowEnabled || this.p>b.spLo+0.1);
    }
    rearm(k) {
      if(!this.canRearm(k))return false;
      const b=this.branches[k]; b.latched=false; b.tripTime=0; b.lowArmed=false; b.armTime=0;
      this.log(`SSV ${k}: rearme manual del modelo`); return true;
    }
    status(b) {
      if(!b.enabled)return 'Aislada';
      if(b.ssvFault==='closed')return 'SSV forzada cerrada';
      if(b.latched && b.ssvFault==='open')return 'Disparo SSV sin cierre';
      if(b.latched)return 'SSV enclavada';
      if(this.effectiveFault(b,'active')==='closed' || (b.key!=='B' && this.effectiveFault(b,'monitor')==='closed'))return 'Sin paso por avería';
      if(this.effectiveFault(b,'active')==='open' && (b.key==='B' || this.effectiveFault(b,'monitor')==='open'))return 'Sin regulación';
      if(b.key!=='B' && b.m<0.985 && b.q>1)return 'Monitor regula';
      if(this.effectiveFault(b,'active')==='open')return 'Activo abierto';
      return b.key==='B'?'Regulador de arranque':'Activo regula';
    }
    integrate(dt) {
      this.t+=dt; this.qin=0;
      const qevDemand=this.branches.A.enabled&&this.p>=this.qev.sp;
      if(qevDemand&&!this.qev.active){this.qev.acted=true;this.log('QEV R1: descarga cámara del monitor; no rearma SSV');}
      this.qev.active=qevDemand;
      if(qevDemand)this.branches.A.monitorHold=false;
      for(const b of Object.values(this.branches)) {
        if(b.enabled) {
          if(b.lowEnabled && !b.lowArmed) {
            b.armTime=this.p>b.spLo+0.1?b.armTime+dt:0;
            if(b.armTime>=1) {b.lowArmed=true; this.log(`SSV ${b.key}: protección por mínima armada`);}
          }
          const reason=this.p>=b.spHi?'máxima':b.lowEnabled&&b.lowArmed&&this.p<=b.spLo?'mínima':'';
          b.tripTime=reason?b.tripTime+dt:0;
          if(!b.latched && b.tripTime>=0.15) {
            b.latched=true; this.log(`SSV ${b.key}: disparo por ${reason}${b.ssvFault==='open'?' · NO CIERRA':''}`);
          }
        }
        const shut=b.ssvFault==='closed' || (b.latched && b.ssvFault!=='open');
        if(b.enabled && !shut) {
          this.control(b,'a','ia',this.effectiveFault(b,'active'),b.spActive,dt);
          if(b.key!=='B'&&!b.monitorHold) this.control(b,'m','im',this.effectiveFault(b,'monitor'),b.spMonitor,dt);
          else if(b.key==='B'||b.monitorHold)b.m=1;
        }
        const opening=b.key==='B'?b.a:(b.a*b.m>0?Math.SQRT2*b.a*b.m/Math.sqrt(b.a*b.a+b.m*b.m):0);
        b.q=b.enabled&&!shut?b.qcap*opening*Math.min(1,nozzle(this.cfg.pin,this.p,25)):0;
        this.qin+=b.q;
        const state=this.status(b);
        if(state!==b.prior) {if(b.prior)this.log(`Rama ${b.key}: ${state.toLowerCase()}`); b.prior=state;}
      }
      const cfg=this.cfg;
      this.qr=0;this.r=0;this.reliefAvailable=0;
      for(const b of Object.values(this.branches)) {
        const r=b.relief,fault=cfg.reliefFault!=='normal'?cfg.reliefFault:b.reliefFault;
        const target=!b.reliefConnected?0:fault==='open'?1:fault==='closed'?0:clamp((this.p-cfg.spRelief)/Math.max(.01,cfg.spRelief*.10),0,1);
        r.opening+=(target-r.opening)*Math.min(1,dt/.25);
        if(!b.reliefConnected||fault==='closed')r.opening=0;
        // Fixed effective orifice, calibrated to drawing reference at 2.8 barg +10%.
        // Changing setpoint never changes the orifice. Capacity depends on absolute pressure.
        r.qmax=b.reliefConnected?r.ratedFlow*nozzle(this.p,0,r.ratedPressure):0;
        r.q=r.opening*r.qmax;
        this.qr+=r.q;this.r=Math.max(this.r,r.opening);
        if(fault!=='closed')this.reliefAvailable+=r.qmax;
      }
      this.qd=cfg.demand*clamp(this.p/0.3,0,1);
      this.balance=this.qin-this.qd-this.qr;
      this.p=Math.max(0,this.p+(this.qin-this.qd-this.qr)*PN*T/TN/(cfg.volume*3600)*dt);
      const reliefOn=this.r>0.025 && this.qr>1;
      if(reliefOn!==this.previousRelief) {this.log(reliefOn?'Alivio de línea: descarga':'Alivio de línea: descarga cesa'); this.previousRelief=reliefOn;}
    }
    advance(seconds) {
      const n=Math.ceil(seconds/0.02), dt=seconds/n;
      for(let i=0;i<n;i++) {this.integrate(dt); if(Math.floor((this.t-dt)*5)!==Math.floor(this.t*5))this.sample();}
      this.sample();
    }
    sample() {
      const sample={t:this.t,p:this.p};
      if(this.history.length && Math.abs(this.history[this.history.length-1].t-this.t)<1e-7)this.history[this.history.length-1]=sample;
      else this.history.push(sample);
      while(this.history.length>3000)this.history.shift();
    }
  }
  globalThis.ERP25Dynamics={Model,nozzle,clamp};
})();
