(() => {
  const root=document.getElementById('erp25-3d'),f=n=>root.querySelector(`[data-f="${n}"]`),debug=root.erpDebug,trainer=debug.trainer,C=ERP25Curves;
  C.attach(trainer);
  f('curve-unit').innerHTML=C.units.map(([id,label])=>`<option value="${id}">${label}</option>`).join('');f('curve-unit').value='active-A';
  const fmt=(n,d=2)=>Number(n).toLocaleString('es-AR',{maximumFractionDigits:d});
  const text=(x,y,s,anchor='middle',extra='')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" ${extra}>${s}</text>`;
  const hiddenSeries=new Set();
  function plot(node,series,xlabel,ylabel,limits,xlimits){
    const w=Math.max(280,node.getBoundingClientRect().width||320),h=Math.max(150,node.getBoundingClientRect().height||190),L=62,R=16,T=30,B=38;
    const points=series.flatMap(s=>s.points).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
    if(!points.length){node.innerHTML='Sin apertura calculada en este intervalo';return;}
    const ex=d3.extent(points,p=>p.x),ey=d3.extent(points,p=>p.y),dx=Math.max(ex[1]-ex[0],1,Math.abs(ex[0])*.001),dy=Math.max(ey[1]-ey[0],.1,Math.abs(ey[0])*.001);
    const xs=d3.scaleLinear().domain(xlimits||[Math.max(0,ex[0]-.04*dx),ex[1]+.04*dx]).range([L+5,w-R-5]);
    const ys=d3.scaleLinear().domain(limits||[Math.max(0,ey[0]-.12*dy),Math.max(.1,ey[1]+.12*dy)]).nice(4).range([h-B-5,T+5]);
    let out=`<title>${ylabel} según ${xlabel}</title><rect data-chart-frame="" x="${L}" y="${T}" width="${w-L-R}" height="${h-T-B}" fill="none" stroke="var(--border)"/>`;
    for(const tick of xs.ticks(w<450?3:5))out+=text(xs(tick),h-B+21,fmt(tick,1));
    for(const tick of ys.ticks(4))out+=`<path d="M${L},${ys(tick)}H${w-R}" stroke="var(--border)"/>`+text(L-9,ys(tick)+4,fmt(tick,2),'end');
    out+=text(L,T-12,ylabel,'start','class="axis-title" data-axis="y"')+text((L+w-R)/2,h-6,xlabel,'middle','class="axis-title" data-axis="x"');
    series.forEach((s,i)=>{const color=s.stroke||`var(--viz-series-${s.color||i+1})`,line=d3.line().defined(p=>Number.isFinite(p.y)).x(p=>xs(p.x)).y(p=>ys(p.y));out+=`<path d="${s.pointsOnly?'':line(s.points)||''}" fill="none" stroke="${color}" stroke-width="2" ${s.dash?'stroke-dasharray="6 4"':''}/>`;const marks=s.markAll?s.points:s.points.slice(-1);for(const p of marks){if(!Number.isFinite(p.y))continue;out+=`<circle cx="${xs(p.x)}" cy="${ys(p.y)}" r="3.5" fill="${color}"/>`;}});
    node.innerHTML=`<svg class="erp-curve" viewBox="0 0 ${w} ${h}" role="img" aria-label="${ylabel} según ${xlabel}">${out}</svg>`;
  }
  function draw(){
    const id=f('curve-unit').value||'active-A',[device,k]=id.split('-'),now=C.snapshot(trainer).units[id],history=trainer.curveHistory.map(r=>({t:r.t,...r.units[id]}));
    if(!history.length||history[history.length-1].t<trainer.model.t)history.push({t:trainer.model.t,...now});
    const snap=C.snapshot(trainer),records=trainer.curveHistory.slice();if(!records.length||records.at(-1).t<trainer.model.t)records.push(snap);
    const defs=[['active-A','R1 activo','#39aaff',false],['monitor-A','R1 monitor','#ffae4b',true],['active-C','R2 activo','#38d59a',false],['monitor-C','R2 monitor','#b48aff',true],['active-B','Arranque','#f46abb',false]];
    const flows=[['active-A','R1','#39aaff',false],['active-C','R2','#38d59a',false],['active-B','Arranque','#f46abb',false],['total','Total','#d6e4f0',true]];
    const flowAt=(r,id)=>id==='total'?['A','C','B'].reduce((sum,key)=>sum+r.units['active-'+key].q,0):r.units[id].q;
    const legend=(items,type)=>items.map(([id,name,color,dash])=>{const val=type==='q'?fmt(flowAt(snap,id),1)+' Nm³/h':snap.units[id].opening===null?'N/C':fmt(snap.units[id].opening,1)+' %',key=type+':'+id;return `<button type="button" class="erp-series-key" data-series="${key}" aria-pressed="${!hiddenSeries.has(key)}" style="opacity:${hiddenSeries.has(key)?.4:1}"><span style="color:${color}">${dash?'┄':'━'}</span> ${name} <b>${val}</b></button>`;}).join('');
    f('curve-values').textContent=`Salida ERP ${fmt(snap.units['active-A'].p)} bar(g) · aporte total ${fmt(flowAt(snap,'total'),1)} Nm³/h`;
    const control=['A','C'].filter(key=>{const b=trainer.model.branches[key],st=trainer.state(key);return b.enabled&&st.ssv&&st.q>.01&&trainer.model.effectiveFault(b,'active')==='open'&&st.monitor<.999;});
    f('curve-status').textContent=control.length?control.map(key=>(key==='A'?'R1':'R2')+': activo abierto por falla; monitor modulando.').join(' '):'';
    f('curve-legend').textContent='Presión regulada a la salida de la ERP';
    f('flow-legend').innerHTML=legend(flows,'q');f('opening-legend').innerHTML=legend(defs,'a');
    plot(f('curve-time'),[{points:records.map(r=>({x:r.t,y:r.units['active-A'].p})),stroke:'#39aaff'}],'Tiempo simulado (s)','Presión de salida ERP (bar g)');
    const qs=flows.filter(([id])=>!hiddenSeries.has('q:'+id)).map(([id,name,stroke,dash])=>({points:records.map(r=>({x:r.t,y:flowAt(r,id)})),stroke,dash}));
    if(qs.length)plot(f('curve-flow'),qs,'Tiempo simulado (s)','Caudal por rama y total (Nm³/h)');else f('curve-flow').innerHTML='Elegí una serie en la leyenda.';
    const aps=defs.filter(([id])=>!hiddenSeries.has('a:'+id)).map(([id,name,stroke,dash])=>({points:records.map(r=>({x:r.t,y:r.units[id].opening})),stroke,dash}));
    if(aps.length)plot(f('curve-opening'),aps,'Tiempo simulado (s)','Apertura de reguladores (%)',[0,100]);else f('curve-opening').innerHTML='Elegí un regulador en la leyenda.';
    plot(f('curve-pq'),[{points:records.map(r=>({x:flowAt(r,'total'),y:r.units['active-A'].p})),stroke:'#39aaff'}], 'Aporte total (Nm³/h)','Presión salida ERP (bar g)');

  }
  for(const name of ['flow-legend','opening-legend'])f(name).addEventListener('click',e=>{const button=e.target.closest('[data-series]');if(!button)return;const key=button.dataset.series;hiddenSeries.has(key)?hiddenSeries.delete(key):hiddenSeries.add(key);draw();});
  f('curve-unit').addEventListener('change',()=>{debug.select(f('curve-unit').value);draw();});
  let last=-1,revision=-1,lastStamp=0;function frame(stamp){if(stamp-lastStamp>=250){draw();lastStamp=stamp;last=trainer.model.t;revision=trainer.revision;}requestAnimationFrame(frame);}
  new ResizeObserver(draw).observe(f('curve-time'));draw();requestAnimationFrame(frame);
  root.erpCurves={draw,capacity:C.capacity,select(id){if(C.units.some(([unit])=>unit===id)){f('curve-unit').value=id;draw();}}};
})();
