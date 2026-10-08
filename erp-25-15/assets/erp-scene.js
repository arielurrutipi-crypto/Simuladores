(() => {
  const V=(x,y,z)=>new THREE.Vector3(x,y,z),Y=ERP25Layout.y;
  class Plant {
    constructor(palette){
      this.palette=palette;this.scene=new THREE.Scene();this.parts={};this.items=[];this.labels=[];this.gas=[];this.shells=[];this.bodyShells=[];this.shutters={};this.windows={};this.travel={};this.tubings=[];this.domainMemory={};this.lastRevision=-1;this.xrayOn=true;this.ventClouds=[];
      const white=new THREE.Color(1,1,1);this.scene.add(new THREE.HemisphereLight(white,0x53606d,.78));const key=new THREE.DirectionalLight(white,.95);key.position.set(-3,8,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-9,right:9,top:7,bottom:-7,near:.5,far:24});key.shadow.bias=-.00035;key.shadow.normalBias=.025;key.shadow.radius=2;this.scene.add(key);
      const fill=new THREE.DirectionalLight(0xdce8f2,.25);fill.position.set(5,4,-5);this.scene.add(fill);
      const standard=(color,metalness=.15,roughness=.42)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
      this.mat={pipe:standard(palette.pipe,.08,.48),metal:standard(palette.metal,.38,.38),tube:standard(palette.tubing||palette.structure,.35,.4),filter:standard(palette.filter,.06,.5),dark:standard(palette.structure,.15,.5),skid:standard(palette.skid,.06,.62),gas:new THREE.MeshBasicMaterial({color:palette.gas}),high:new THREE.MeshBasicMaterial({color:palette.high}),open:new THREE.MeshBasicMaterial({color:palette.open}),closed:new THREE.MeshBasicMaterial({color:palette.closed}),highlight:new THREE.MeshBasicMaterial({color:palette.highlight})};
      this.floor=this.mesh(new THREE.BoxGeometry(13.5,.08,7.5),standard(palette.floor,0,1),V(0,-.10,0));
      for(const z of [-3.05,3.20])this.mesh(new THREE.BoxGeometry(10.7,.12,.10),this.mat.skid,V(0,.06,z));
      for(const x of [-4.7,-2,.7,3.45,4.8])this.mesh(new THREE.BoxGeometry(.10,.12,6.3),this.mat.skid,V(x,.06,0));
      this.pipe(V(-6.7,Y,0),V(-5,Y,0),.10);this.pipe(V(-5,Y,-2.8),V(-5,Y,3.1),.10);
      this.pipe(V(5,Y,-2.8),V(5,Y,3.1),.1303);this.pipe(V(5,Y,0),V(6.6,Y,0),.1303);
      for(const x of [-5,5])for(const z of [ERP25Layout.branches.A.z,0,ERP25Layout.branches.C.z])this.ring(V(x,Y,z),x<0?.105:.135,.010,this.mat.pipe,'z');
      this.flange(V(-6.35,Y,0),.18);this.flange(V(6.35,Y,0),.30);
      for(const k of ['A','B','C'])this.branch(k);
      this.gasPath([V(-6.7,Y,0),V(-5,Y,0)],'in',.040);this.gasPath([V(5,Y,0),V(6.6,Y,0)],'out',.062);
      this.transmitter(-5,.48,'PIT 3001');this.transmitter(5,1.05,'PIT 3002');
      this.collectorGauge(-5,-1.05,'PI-entrada');this.collectorGauge(5,1.52,'PI-salida');
      this.odorizer();

      const qL=ERP25Layout.branches.A,qz=qL.z+qL.side*.70,qx=qL.monitorBody;
      this.item('qev-A','A','QEV TA981 · descarga rápida del monitor R1',V(qx,Y+.85,qz),g=>{this.mesh(new THREE.BoxGeometry(.14,.19,.14),this.mat.metal,V(0,0,0),g);this.pipe(V(0,.095,0),V(0,.26,0),.047,this.mat.metal,false,g);this.connector(V(.10,-.05,0),'x',g);this.pipe(V(-.10,-.04,0),V(-.23,-.04,0),.024,this.mat.tube,false,g);},'QEV en R1 según relevamiento de campo aportado en bugs.docx; difiere de la asignación del plano. Descarga la cámara de motorización del monitor para acelerar su actuación (IOM Rev.3 p.17). Geometría/puertos esquemáticos; dinámica de cámara aún no calculada. Actuación funcional por umbral; no es una PSV del caudal principal.');
      this.parts['qev-A'].group.traverse(o=>{if(o.isMesh&&o.material)o.material=o.material.clone();});
      this.route('qev-chamber-A','A','Cámara del monitor → QEV R1',[V(qx,Y+.40,qL.z+qL.side*.28),V(qx+.25,Y+.40,qz),V(qx+.25,Y+.80,qz),V(qx+.10,Y+.80,qz)],'Vinculación funcional cámara-QEV según IOM Rev.3 p.17; trazado y puertos físicos por verificar para el piloto instalado.');
      for(const k of ['A','C']){this.parts['active-'+k].name='TA956 DFO · piloto TA984 FO · '+(k==='A'?'R1':'R2');this.parts['monitor-'+k].name='TA956 FC+SSV · piloto TA981FC · '+(k==='A'?'R1 + QEV TA981':'R2');this.parts['ssv-'+k].name='TA956 SSV · CX640 · '+(k==='A'?'R1':'R2');}
      this.parts['active-B'].name='Tormene 631-3016 · arranque';this.parts['ssv-B'].name='TA956 SSV · CX640 · arranque';
      this.labels.push({id:'in',text:'Entrada',point:V(-6.1,Y+.75,0),priority:3},{id:'out',text:'Salida',point:V(6.1,Y+.75,0),priority:3});
      this.selection=new THREE.BoxHelper(undefined,palette.highlight);this.selection.visible=false;this.scene.add(this.selection);
      this.endpointMarks=[];for(let i=0;i<2;i++){const m=this.mesh(new THREE.SphereGeometry(.052,18,12),this.mat.highlight,V(0,0,0));m.visible=false;m.renderOrder=25;m.material.depthTest=false;this.endpointMarks.push(m);}
    }
    mesh(geo,mat,pos,parent=this.scene){const m=new THREE.Mesh(geo,mat);m.position.copy(pos);m.receiveShadow=true;m.castShadow=geo.type==='BoxGeometry'&&Math.min(geo.parameters.width,geo.parameters.height,geo.parameters.depth)>.065;parent.add(m);return m;}
    pipe(a,b,r=.10,mat=this.mat.pipe,shell=true,parent=this.scene){const d=b.clone().sub(a);if(d.length()<.0001)return null;const m=this.mesh(new THREE.CylinderGeometry(r,r,d.length(),32),shell?mat.clone():mat,a.clone().add(b).multiplyScalar(.5),parent);m.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());if(shell)this.shells.push(m);return m;}
    ring(pos,r,t,mat,axis='x',parent=this.scene){const m=this.mesh(new THREE.TorusGeometry(r,t,8,32),mat,pos,parent);if(axis==='x')m.rotation.y=Math.PI/2;if(axis==='y')m.rotation.x=Math.PI/2;return m;}
    flange(pos,r=.18,parent=this.scene){
      this.pipe(pos.clone().add(V(-.028,0,0)),pos.clone().add(V(.028,0,0)),r,this.mat.pipe,false,parent);this.ring(pos,r*.93,.013,this.mat.metal,'x',parent);
      for(let i=0;i<8;i++){const a=i*Math.PI/4,p=pos.clone().add(V(0,Math.cos(a)*r*.78,Math.sin(a)*r*.78));const m=this.mesh(new THREE.CylinderGeometry(.022,.022,.09,6),this.mat.metal,p,parent);m.rotation.z=Math.PI/2;}
    }
    item(id,k,name,pos,build,description=''){const g=new THREE.Group();g.position.copy(pos);this.scene.add(g);build(g);g.userData={id,key:k,name};g.traverse(o=>{if(o.isMesh){o.userData={...o.userData,id,key:k,name};this.items.push(o);}});this.parts[id]={group:g,key:k,name,description};return g;}
    body(mesh){mesh.material=mesh.material.clone();mesh.castShadow=true;mesh.receiveShadow=true;this.bodyShells.push(mesh);return mesh;}
    connector(pos,axis='y',parent=this.scene,r=.028){const m=this.mesh(new THREE.CylinderGeometry(r,r,.065,6),this.mat.metal,pos,parent);if(axis==='x')m.rotation.z=Math.PI/2;if(axis==='z')m.rotation.x=Math.PI/2;this.ring(pos,r*.72,.007,this.mat.tube,axis,parent);return m;}
    tube(points,r=.012,parent=this.scene,mat=this.mat.tube){
      const path=new THREE.CurvePath();let previous=points[0];
      for(let i=1;i<points.length-1;i++){const a=points[i-1],b=points[i],c=points[i+1],round=Math.min(.065,b.distanceTo(a)*.24,b.distanceTo(c)*.24),pre=b.clone().add(a.clone().sub(b).normalize().multiplyScalar(round)),post=b.clone().add(c.clone().sub(b).normalize().multiplyScalar(round));if(previous.distanceTo(pre)>.0001)path.add(new THREE.LineCurve3(previous,pre));path.add(new THREE.QuadraticBezierCurve3(pre,b,post));previous=post;}
      if(previous.distanceTo(points.at(-1))>.0001)path.add(new THREE.LineCurve3(previous,points.at(-1)));
      const mesh=this.mesh(new THREE.TubeGeometry(path,Math.max(12,points.length*9),r,8,false),mat,V(0,0,0),parent);return mesh;
    }
    route(id,k,name,points,description){
      const group=this.item(id,k,name,V(0,0,0),g=>{this.tube(points,.014,g);this.connector(points[0],'z',g);this.connector(points.at(-1),'z',g);},description);
      const record={id,key:k,group,start:points[0].clone(),end:points.at(-1).clone(),description};this.tubings.push(record);this.parts[id].route=record;return record;
    }
    support(x,z,r){this.pipe(V(x,.18,z),V(x,Y-r-.08,z),.04,this.mat.skid,false);this.mesh(new THREE.BoxGeometry(.33,.07,.32),this.mat.skid,V(x,Y-r-.06,z));this.mesh(new THREE.BoxGeometry(.30,.045,.27),this.mat.metal,V(x,.14,z));for(const side of [-1,1])this.pipe(V(x,Y-r-.05,z+side*(r+.03)),V(x,Y+r*.5,z+side*(r+.03)),.011,this.mat.metal,false);}
    manual(k,x,z,side,r){
      const id=side+'-'+k;const g=this.item(id,k,side==='in'?'Válvula manual de entrada':'Válvula manual de salida',V(x,Y,z),g=>{
        this.body(this.turned([[r*.60,-.20],[r*.64,-.15],[r*.90,-.10],[r,-.04],[r,.04],[r*.90,.10],[r*.64,.15],[r*.60,.20]],this.mat.pipe,V(0,0,0),g,'x'));
        for(const xx of [-.105,.105])this.ring(V(xx,0,0),r*.89,.006,this.mat.dark,'x',g);
        this.mesh(new THREE.CylinderGeometry(r*.40,r*.40,.09,24),this.mat.pipe,V(0,r*.8,0),g);
        this.connector(V(0,r+.055,0),'y',g,.044);
        this.plaque(V(0,r*.35,r*.98),r*.65,r*.27,g);
        for(const zt of [-1,1])for(const yy of [-1,1])this.bolt(V(.13,yy*r*.66,zt*r*.66),g,.018,'x');
        this.pipe(V(0,r*.4,0),V(0,r+.16,0),.026,this.mat.metal,false,g);
        const lever=new THREE.Group();lever.position.set(0,r+.16,0);g.add(lever);this.mesh(new THREE.BoxGeometry(.45,.018,.050),this.mat.metal,V(.16,0,0),lever);this.bolt(V(0,.015,0),lever,.022);this.mesh(new THREE.BoxGeometry(.05,.07,.085),this.mat.metal,V(-.055,-.01,0),lever);const grip=this.mesh(new THREE.BoxGeometry(.15,.045,.08),this.mat.open,V(.32,0,0),lever);this.parts[id+'-lever']={group:lever,angle:0,grip};
      },'Palanca paralela a la cañería: abierta. Perpendicular: cerrada. Posición visible sin cartel sobre el equipo.');
      this.flange(V(x-.24,Y,z),r*1.25);this.flange(V(x+.24,Y,z),r*1.25);this.internalValve(id,V(x,Y,z),r*.62,true);this.statusWindow(id,V(x,Y,z),r*.84,r+.012);
    }
    internalValve(id,pos,r,ball=false){const g=new THREE.Group();g.position.copy(pos);this.scene.add(g);this.ring(V(0,0,0),r,.012,this.mat.metal,'x',g);const plug=this.mesh(new THREE.CylinderGeometry(r*.95,r*.95,.026,32),this.mat.closed,V(0,0,0),g);plug.rotation.z=Math.PI/2;const stem=this.pipe(V(0,0,0),V(0,.28,0),.012,this.mat.metal,false,g);this.shutters[id]={group:g,plug,stem,r,ball};}
    statusWindow(id,pos,r=.125,offset=.28){
      const windows=[];for(const side of [-1,1]){const g=new THREE.Group();g.position.copy(pos).add(V(0,0,side*offset));if(side<0)g.rotation.y=Math.PI;this.scene.add(g);
        const back=this.mesh(new THREE.CircleGeometry(r,32),this.mat.dark,V(0,0,0),g);back.material.side=THREE.DoubleSide;
        const rim=this.mesh(new THREE.RingGeometry(r*.80,r,32),this.mat.open,V(0,0,.008),g);rim.material.side=THREE.DoubleSide;
        const aperture=this.mesh(new THREE.CircleGeometry(r*.77,32),this.mat.open,V(0,0,.012),g);
        const hole=this.mesh(new THREE.CircleGeometry(r*.69,32),this.mat.dark,V(0,0,.016),g);
        const bars=[];for(const a of [-Math.PI/4,Math.PI/4]){const b=this.mesh(new THREE.BoxGeometry(r*1.25,r*.16,.012),this.mat.closed,V(0,0,.025),g);b.rotation.z=a;bars.push(b);}
        windows.push({group:g,rim,aperture,hole,bars});
      }this.windows[id]=windows;
    }
    filter(k,x,z){
      const small=k==='B',r=small?.19:.24;
      this.item('filter-'+k,k,small?'Filtro FM2 · #40':'Filtro FM3 · #65',V(x,Y,z),g=>{
        this.body(this.turned([[0,-.55],[.06,-.53],[r*.55,-.46],[r*.88,-.34],[r,-.18],[r,.73],[r*1.20,.75],[r*1.20,.80]],this.mat.filter,V(0,0,0),g));
        for(const xx of [-1,1])this.body(this.turned([[.10,0],[.12,.09],[.14,.15]],this.mat.filter,V(xx*.23,0,0),g,'x'));
        this.ring(V(0,.805,0),r*1.22,.004,this.mat.dark,'y',g);
        this.plaque(V(0,.13,r+.004),.17,.11,g);
        for(const yy of [-.23,.36])this.ring(V(0,yy,0),r,.004,this.mat.filter,'y',g);
        this.body(this.turned([[0,.88],[r*.90,.88],[r*1.24,.87],[r*1.24,.815]],this.mat.filter,V(0,0,0),g));for(let i=0;i<8;i++){const a=i*Math.PI/4;this.bolt(V(Math.sin(a)*r,.885,Math.cos(a)*r),g,.023);}
        this.tube([V(-.10,.88,0),V(-.10,1.04,0),V(.10,1.04,0),V(.10,.88,0)],.018,g,this.mat.filter);this.pipe(V(0,-.54,0),V(0,-.81,0),.027,this.mat.metal,false,g);this.connector(V(0,-.71,0),'y',g);for(const yy of [-.69,-.88]){this.mesh(new THREE.CylinderGeometry(.049,.049,.09,16),this.mat.pipe,V(0,yy,0),g);this.connector(V(.045,yy,0),'x',g,.023);this.mesh(new THREE.BoxGeometry(.15,.018,.030),this.mat.gas,V(.10,yy,0),g);}this.pipe(V(0,-.78,0),V(0,-1.0,0),.025,this.mat.metal,false,g);
        this.mesh(new THREE.CylinderGeometry(r*.6,r*.6,.60,18,1,true),new THREE.MeshStandardMaterial({color:this.palette.metal,wireframe:true}),V(0,.07,0),g);
        const side=ERP25Layout.branches[k].side,mz=side*(r+.12);
        this.mesh(new THREE.BoxGeometry(.25,.20,.09),this.mat.metal,V(0,.05,mz),g);
        for(const sign of [-1,1]){this.connector(V(sign*.17,.08,mz),'x',g,.029);this.pipe(V(sign*.14,.08,mz),V(sign*.24,.08,mz),.014,this.mat.metal,false,g);this.pipe(V(sign*.24,-.01,mz),V(sign*.24,.17,mz),.012,this.mat.metal,false,g);}
        this.connector(V(0,-.025,mz+side*.08),'z',g,.029);this.pipe(V(-.055,-.09,mz+side*.12),V(.055,.04,mz+side*.12),.012,this.mat.metal,false,g);
        this.plaque(V(0,.08,mz+side*.049),.17,.06,g);
      },'Forma revisada con IMG_3002 y foto de detalle del manifold: cuello alto, doble tapa, asa y drenaje. Bloque de instrumentación representado exteriormente; conexionado de señales según plano, no según el montaje incompleto de las fotos.');
      this.flange(V(x-.38,Y,z),small?.16:.19);this.flange(V(x+.38,Y,z),small?.16:.19);
    }
    gaugeFace(g,pos,r){
      const face=this.mesh(new THREE.CylinderGeometry(r,r,.045,32),this.mat.filter,pos,g);face.rotation.x=Math.PI/2;this.ring(pos.clone().add(V(0,0,.028)),r,.012,this.mat.metal,'z',g);
      for(let i=0;i<11;i++){const a=Math.PI*1.25-i*Math.PI*1.5/10,m=this.mesh(new THREE.BoxGeometry(.006,.022,.006),this.mat.dark,pos.clone().add(V(Math.cos(a)*r*.78,Math.sin(a)*r*.78,.03)),g);m.rotation.z=a-Math.PI/2;}
      const needle=new THREE.Group();needle.position.copy(pos).add(V(0,0,.038));g.add(needle);this.pipe(V(0,0,0),V(r*.65,0,0),.006,this.mat.dark,false,needle);return needle;
    }
    instrumentGauge(id,k,x,z,rpipe=.188,range=5){
      this.item(id,k,range===60?'Manómetro alta · #36 + bloqueo/purga #39':'Manómetro regulado · #37 + bloqueo/purga #39',V(x,Y,z),g=>{
        this.connector(V(0,rpipe,0),'y',g,.036);this.pipe(V(0,rpipe,0),V(0,rpipe+.27,0),.022,this.mat.metal,false,g);this.mesh(new THREE.BoxGeometry(.09,.095,.08),this.mat.metal,V(0,rpipe+.12,0),g);this.pipe(V(0,rpipe+.13,0),V(.12,rpipe+.13,0),.012,this.mat.metal,false,g);this.mesh(new THREE.BoxGeometry(.025,.11,.025),this.mat.dark,V(.12,rpipe+.13,0),g);this.connector(V(0,rpipe+.12,.07),'z',g,.018);
        const needle=this.gaugeFace(g,V(0,rpipe+.40,0),.13);this.parts[id+'-needle']={group:needle,range,key:k,x};
      },'Toma superior sobre cañería, media cupla #30 y válvula integral de bloqueo y purga #39. Posición longitudinal tomada de la vista lateral del plano.');
    }
    regulator(k,x,z,monitor){
      const id=(monitor?'monitor':'active')+'-'+k,small=k==='B',side=ERP25Layout.branches[k].side;
      this.item(id,k,monitor?'TA956 FC · monitor · #'+(k==='A'?'13':'12'):small?'Tormene 631-3016 · arranque':'TA956 DFO · activo · #11',V(x,Y,z),g=>{
        if(small){
          // IMG_3004 and overall views: axial diaphragm housing, cylindrical bonnet and separate pilot.
          this.body(this.turned([[0,-.27],[.085,-.27],[.11,-.22],[.15,-.15],[.15,-.03],[.11,.07]],this.mat.pipe,V(-.10,0,0),g,'x'));
          for(const xx of [-.07,.01,.11])this.body(this.turned([[0,-.018],[.235,-.018],[.235,.018],[0,.018]],this.mat.pipe,V(xx,0,0),g,'x'));
          this.body(this.turned([[.17,-.07],[.17,.11]],this.mat.dark,V(0,0,0),g,'x'));
          for(let i=0;i<8;i++){const a=i*Math.PI/4;this.pipe(V(-.09,.205*Math.cos(a),.205*Math.sin(a)),V(.145,.205*Math.cos(a),.205*Math.sin(a)),.011,this.mat.metal,false,g);this.bolt(V(.14,.205*Math.cos(a),.205*Math.sin(a)),g,.018,'x');}
          this.body(this.turned([[.16,0],[.155,.06],[.135,.11],[.13,.34],[.11,.38],[.035,.40]],this.mat.pipe,V(.12,0,0),g,'x'));
          this.plaque(V(.33,.03,.135),.18,.085,g);
          this.pipe(V(.52,0,0),V(.59,0,0),.035,this.mat.pipe,false,g);
          const pilot=new THREE.Group();pilot.position.set(.60,-.04,side*.15);g.add(pilot);
          this.body(this.turned([[.04,-.12],[.07,-.1],[.1,-.02],[.115,.05],[.115,.08],[.075,.10],[.06,.18],[.026,.22]],this.mat.pipe,V(0,0,0),pilot));
          for(let i=0;i<6;i++){let a=i*Math.PI/3;this.bolt(V(.094*Math.sin(a),.09,.094*Math.cos(a)),pilot,.012);}
          this.connector(V(0,.24,0),'y',pilot,.029);
          // Auxiliary canister silhouette only. Process sensing routes remain plan-based.
          this.pipe(V(.35,-.06,-side*.27),V(.35,-.06,-side*.48),.080,this.mat.metal,false,g);
          this.ring(V(.35,-.06,-side*.48),.075,.005,this.mat.metal,'z',g);
        }else{
          const profile=monitor?[[0,-.33],[.13,-.33],[.19,-.28],[.205,-.20],[.205,.12],[.24,.20],[.265,.26],[.29,.28]]:[[0,-.24],[.12,-.24],[.20,-.19],[.24,-.10],[.25,.04],[.29,.14],[.315,.20]];
          this.body(this.turned(profile,this.mat.pipe,V(0,0,0),g));
          const r=monitor?.29:.315,h=monitor?.28:.20;
          this.body(this.turned([[r,h],[r,h+.065],[r*.95,h+.08],[r*.76,h+.105],[r*.3,h+.112],[0,h+.112]],this.mat.pipe,V(0,0,0),g));
          this.ring(V(0,h+.012,0),r,.004,this.mat.dark,'y',g);
          for(let i=0;i<8;i++){const a=i*Math.PI/4;this.bolt(V(Math.sin(a)*r*.8,h+.09,Math.cos(a)*r*.8),g,.023);}
          for(const xx of [-r*.62,r*.62]){this.connector(V(xx,h+.125,0),'y',g,.024);this.ring(V(xx,h+.18,0),.042,.013,this.mat.metal,'z',g);}
          this.plaque(V(.075,h+.115,.07),.10,.047,g,'y');
          this.connector(V(0,h+.14,0),'y',g,.037);
          const cover=new THREE.MeshStandardMaterial({color:this.palette.filter,transparent:true,opacity:.24,roughness:.15});this.mesh(new THREE.CylinderGeometry(.035,.035,.20,24),cover,V(0,.52,0),g);
          const rod=this.pipe(V(0,.46,0),V(0,.61,0),.012,this.mat.metal,false,g);this.travel[id]=rod;
          this.pipe(V(-.22,h+.18,-side*.08),V(.22,h+.18,-side*.08),.012,this.mat.metal,false,g);
          for(const xx of [-.22,.22])this.mesh(new THREE.SphereGeometry(.027,16,12),this.mat.dark,V(xx,h+.18,-side*.08),g);
        }
        this.body(this.pipe(V(-.28,0,0),V(.28,0,0),.10,this.mat.pipe,false,g));
      },'Envolvente reconstruida por proporciones de las fotos: cuerpo, junta de tapa, bulonería, cáncamos, soporte y pilotaje. No es un CAD dimensional del fabricante; los puertos no visibles siguen pendientes.');
      this.flange(V(x-.31,Y,z),.18);this.flange(V(x+.31,Y,z),.18);
      this.internalValve(id,V(monitor?ERP25Layout.branches[k].monitor:x,Y,z),.090);this.statusWindow(id,V(x,Y+.16,z),.13,.325);this.connector(V(x+.08,Y+.30,z+side*.26),'z');if(monitor)this.connector(V(x,Y+.40,z+side*.28),'z');
      if(!small){this.pilot(k,x,z,monitor);if(monitor)this.ssv(k,ERP25Layout.branches[k].ssv,z,true);}
    }
    pilot(k,x,z,monitor){const side=ERP25Layout.branches[k].side,id=(monitor?'pilot-monitor-':'pilot-active-')+k,pz=z+side*.43;
      this.item(id,k,monitor?'Piloto FC y filtro auxiliar F254':'Piloto DFO y filtro auxiliar F254',V(x+.05,Y+.47,pz),g=>{
        this.mesh(new THREE.BoxGeometry(.25,.17,.16),this.mat.metal,V(0,0,0),g);
        this.mesh(new THREE.BoxGeometry(.11,.17,.19),this.mat.metal,V(-.15,0,0),g);
        this.pipe(V(-.15,0,side*.09),V(-.15,0,side*.118),.061,this.mat.metal,false,g);
        this.ring(V(-.15,0,side*.123),.061,.006,this.mat.filter,'z',g);
        for(const xx of [-.20,-.10])for(const yy of [-.055,.055])this.bolt(V(xx,yy,side*.10),g,.009,'z');
        this.connector(V(-.15,.11,0),'y',g,.058);
        this.turned([[.018,-.43],[.027,-.41],[.040,-.37],[.048,-.18],[.058,-.12]],this.mat.metal,V(-.15,0,0),g);
        this.connector(V(-.15,-.44,0),'y',g,.022);
        this.plaque(V(0,0,side*.085),.12,.07,g);
        this.mesh(new THREE.BoxGeometry(.06,.15,.015),this.mat.dark,V(.18,.0,0),g);
        this.pipe(V(-.12,.13,0),V(.13,.13,0),.010,this.mat.metal,false,g);
        this.mesh(new THREE.SphereGeometry(.024,16,12),this.mat.dark,V(.13,.13,0),g);
        const fx=.24;this.turned([[0,-.61],[.028,-.61],[.055,-.585],[.065,-.55],[.065,.08],[.074,.09],[.074,.13],[.060,.14],[0,.14]],this.mat.metal,V(fx,0,0),g);
        for(const yy of [-.56,-.31,.07])this.ring(V(fx,yy,0),.066,.004,this.mat.metal,'y',g);
        for(const zt of [-1,1]){this.connector(V(fx,.065,zt*.093),'z',g);this.tube([V(fx,.065,zt*.12),V(fx,-.1,zt*.12),V(fx-.075,-.1,zt*.12)],.010,g);}
        const strap=this.mesh(new THREE.BoxGeometry(.055,.36,.018),this.mat.dark,V(fx-.10,.17,-side*.02),g);strap.rotation.z=-.60;for(const yy of [.15,.20])this.bolt(V(fx,yy,.02),g,.009,'z');this.connector(V(fx,.13,0),'y',g);this.connector(V(-.15,0,0),'x',g);this.connector(V(.03,0,side*.12),'z',g);this.connector(V(0,0,-side*.11),'z',g);this.mesh(new THREE.CylinderGeometry(.061,.061,.06,24),this.mat.filter,V(fx,-.02,0),g);
      },'Conjunto de pilotaje representado con filtro F254 según lista de materiales y fotos. Modelo y numeración exacta del piloto pendientes de placa legible.');
      this.route('supply-'+(monitor?'monitor-':'active-')+k,k,'Alimentación de piloto desde cuerpo',[V(x-.22,Y+.03,z+side*.09),V(x-.22,Y+.31,pz),V(x+.29,Y+.31,pz),V(x+.29,Y+.60,pz)],'Alimentación local de alta/intermedia hacia filtro auxiliar. Esquema funcional Tormene; recorrido corto orientativo.');
      this.route('motor-'+(monitor?'monitor-':'active-')+k,k,'Motorización piloto → cámara',[V(x+.05,Y+.47,pz-side*.10),V(x+.05,Y+.54,z+side*.30),V(x+.08,Y+.30,z+side*.26)],'Línea de motorización local; no es una toma de presión de proceso. Función del catálogo Tormene, geometría del conjunto interpretativa.');
    }
    ssv(k,x,z,integrated){const id='ssv-'+k,side=ERP25Layout.branches[k].side;
      this.item(id,k,integrated?'Bloqueo SSV integrado · '+(k==='A'?'#13':'#12'):'TA956 SSV640 · arranque · #9',V(x,Y,z),g=>{
        if(!integrated){this.body(this.mesh(new THREE.SphereGeometry(.20,28,18),this.mat.pipe,V(0,0,0),g));this.mesh(new THREE.CylinderGeometry(.22,.22,.06,24),this.mat.pipe,V(0,.19,0),g);}
        this.pipe(V(0,-.10,side*.14),V(0,-.10,side*.34),.13,this.mat.dark,false,g);
        this.pipe(V(0,-.10,side*.33),V(0,-.10,side*.40),.16,this.mat.metal,false,g);
        this.ring(V(0,-.10,side*.405),.148,.009,this.mat.metal,'z',g);
        this.mesh(new THREE.BoxGeometry(.29,.13,.20),this.mat.dark,V(.12,-.07,side*.38),g);
        this.plaque(V(.12,.001,side*.38),.22,.11,g,'y');
        for(let i=0;i<6;i++){const a=i*Math.PI/3;this.bolt(V(.14*Math.cos(a),-.10+.14*Math.sin(a),side*.41),g,.012,'z');}
        this.connector(V(.03,-.22,side*.43),'z',g,.035);this.connector(V(.07,-.02,side*.44),'y',g);
      },'Bloqueo con toma de señal de salida independiente. La ventana con cruz identifica cierre; el aro con paso central identifica apertura.');
      this.internalValve(id,V(x,Y,z),.09);this.statusWindow(id,V(x,Y-.13,z),.105,.235);if(!integrated){this.flange(V(x-.25,Y,z),.15);this.flange(V(x+.25,Y,z),.15);}
    }
    downstream(k){const L=ERP25Layout.branches[k],z=L.z,side=L.side;
      if(k!=='B'){
        const x=L.manifold,bottom=Y+.1014;this.item('manifold-'+k,k,'Toma multipuerto · la instalación #46',V(x,bottom,z),g=>{this.connector(V(0,0,0),'y',g,.04);this.pipe(V(0,0,0),V(0,.12,0),.03,this.mat.metal,false,g);this.mesh(new THREE.CylinderGeometry(.065,.065,.34,6),this.mat.metal,V(0,.27,0),g);for(const h of [.15,.27,.39])for(const s of [-1,1])this.connector(V(0,h,s*.078),'z',g,.026);this.connector(V(0,.46,0),'y',g,.045);},'Toma superior #30 + multipuerto #46 del plano. Sin válvula de aislamiento en su conexión al proceso. Puertos por función según IOM Tormene p.29; numeración exacta del montaje no confirmada.');
        this.item('return-tap-'+k,k,'Toma independiente de retorno · #29',V(L.returnTap,Y+.1014,z),g=>{this.connector(V(0,0,0),'y',g,.036);this.pipe(V(0,0,0),V(0,.11,0),.019,this.mat.tube,false,g);this.connector(V(0,.13,0),'z',g);},'Segunda toma superior visible en planta y conexionado. Se representa el retorno del pilotaje DFO a presión controlada; el puerto del piloto requiere confirmación.');
        const end={active:V(L.active+.08,Y+.47,z+side*.55),monitor:V(L.monitorBody+.08,Y+.47,z+side*.55),chamber:V(L.monitorBody,Y+.40,z+side*.28),ssv:V(L.ssv+.07,Y-.02,z+side*.44),return:V(L.active-.10,Y+.47,z+side*.43)};
        const defs=[['signal-active','Señal de presión → piloto DFO',end.active,.15,.42],['signal-monitor','Señal de presión → piloto FC',end.monitor,.27,.56],['signal-chamber','Presión controlada → cámara FC',end.chamber,.39,.70],['signal-ssv','Señal de presión → bloqueo SSV',end.ssv,.15,.84]];
        defs.forEach(([id,name,target,h,rail],i)=>{const start=V(x,bottom+h,z+side*.10),outer=z+side*rail,level=bottom+h;this.route(id+'-'+k,k,name,[start,V(x-.09,level,outer),V(target.x-.12,level+.16,outer),V(target.x-.12,target.y,outer),target],`Origen: multipuerto #46 sobre el tramo regulado, aguas arriba de la válvula de salida. Destino funcional: ${name.split('→')[1].trim()}. Ubicación del plano; asignación funcional del manual. Puerto físico exacto a confirmar.`);});
        this.route('return-active-'+k,k,'Retorno de pilotaje DFO → salida',[end.return,V(end.return.x,Y+.36,z+side*1.00),V(L.returnTap,Y+.28,z+side*1.00),V(L.returnTap,Y+.28,z)],'Retorno separado de la señal de sensado. Llega a la toma #29 de la cañería regulada. Disposición interpretada del conexionado del plano y principio DFO del manual.');
      } else {
        for(const [id,x,name] of [['signal-tap-B',L.signalTap,'Toma de control del regulador de arranque'],['ssv-tap-B',L.ssvTap,'Toma de señal del bloqueo de arranque']])this.item(id,k,name,V(x,Y+.07,z),g=>{this.connector(V(0,0,0),'y',g,.035);this.pipe(V(0,0,0),V(0,.18,0),.022,this.mat.tube,false,g);this.connector(V(0,.18,0),'z',g,.03);},'Conexión independiente sobre el tramo de salida regulada. Ubicación y puerto físico propuestos para el modelo; requieren validación del conexionado de la instalación.');
        this.route('signal-active-B',k,'Señal de salida → regulador de arranque',[V(L.signalTap,Y+.25,z),V(L.signalTap,Y+.25,z+.55),V(L.active+.60,Y+.25,z+.55),V(L.active+.60,Y+.20,z+.15)],'Toma exclusiva de presión regulada hacia el conjunto de control del arranque. Separada del bloqueo y del alivio. Puerto de destino esquemático, pendiente de confirmar con la documentación del TA631-6 instalado.');
        this.route('signal-ssv-B',k,'Señal de salida → SSV de arranque',[V(L.ssvTap,Y+.25,z),V(L.ssvTap,Y+.25,z+.80),V(L.ssv,Y+.25,z+.80),V(L.ssv+.07,Y-.02,z+.44)],'Toma exclusiva del bloqueo de arranque, separada de la señal del regulador y de la conexión del alivio. Ubicación esquemática pendiente de validación.');
      }
      this.instrumentGauge('gauge-'+k,k,L.gauge,z,k==='B'?.07:.1014,5);
      this.item('purge-'+k,k,'Purga de tramo regulado',V(L.purge,Y,z),g=>{const r=k==='B'?.07:.1014;this.connector(V(0,r,0),'y',g,.035);this.pipe(V(0,r,0),V(0,r+.40,0),.026,this.mat.metal,false,g);this.mesh(new THREE.SphereGeometry(.065,18,12),this.mat.metal,V(0,r+.22,0),g);this.mesh(new THREE.BoxGeometry(.13,.025,.033),this.mat.dark,V(.06,r+.28,0),g);},'Purga independiente sobre cañería regulada, antes del manómetro y del alivio en las ramas laterales.');
      this.item('relief-'+k,k,'Alivio Satesa · plano #34/#35',V(L.relief,Y,z),g=>{const r=k==='B'?.07:.1014;this.connector(V(0,r,0),'y',g,.04);this.pipe(V(0,r,0),V(0,r+.25,0),.03,this.mat.metal,true,g);this.mesh(new THREE.CylinderGeometry(.075,.075,.22,24),this.mat.metal,V(0,r+.36,0),g);this.pipe(V(0,r+.47,0),V(0,2.20,0),.035,this.mat.metal,true,g);this.ring(V(0,r+.27,0),.085,.011,this.mat.dark,'y',g);},'Alivio de proceso del plano; distinto de un QEV del pilotaje. Descarga individual: referencia 150 m³/h en cada lateral y 20 m³/h en arranque; capacidad variable con presión.');
      this.gasPath([V(L.relief,Y,z),V(L.relief,Y+2.20,z)],'vent-'+k,.021);
      this.ventCloud(k,V(L.relief,Y+2.20,z));
    }
    branch(k){
      const L=ERP25Layout.branches[k],z=L.z,small=k==='B',r=small?.066:.10;
      this.pipe(V(-5,Y,z),V(L.filter+.39,Y,z),r);const reduced=small?.033:.066;if(small){this.pipe(V(L.filter+.65,Y,z),V(L.ssv-.25,Y,z),reduced);this.pipe(V(L.ssv+.25,Y,z),V(L.active-.28,Y,z),reduced);}else{this.pipe(V(L.filter+.65,Y,z),V(L.monitorBody-.28,Y,z),reduced);this.pipe(V(L.monitorBody+.28,Y,z),V(L.active-.28,Y,z),reduced);}const taper=this.mesh(new THREE.CylinderGeometry(reduced,r,.26,28),this.mat.pipe.clone(),V(L.filter+.52,Y,z));taper.rotation.z=-Math.PI/2;this.shells.push(taper);this.pipe(V(L.active+.85,Y,z),V(5,Y,z),small?.066:.1014);if(small){const step=this.mesh(new THREE.CylinderGeometry(.066,.033,.54,28),this.mat.pipe.clone(),V(L.active+.58,Y,z));step.rotation.z=-Math.PI/2;this.shells.push(step);}
      if(!small){const m=this.mesh(new THREE.CylinderGeometry(.1014,.066,.50,32),this.mat.pipe.clone(),V(L.active+.60,Y,z));m.rotation.z=-Math.PI/2;this.shells.push(m);}
      this.manual(k,L.inlet,z,'in',small?.13:.17);this.filter(k,L.filter,z);
      if(small)this.ssv(k,L.ssv,z,false);else{this.regulator(k,L.monitorBody,z,true);this.instrumentGauge('pi-in-'+k,k,L.piIn,z,.10,60);this.instrumentGauge('pi-mid-'+k,k,L.piMid,z,.066,60);}
      this.regulator(k,L.active,z,false);this.manual(k,L.outlet,z,'out',small?.13:.26);this.downstream(k);
      for(const x of [-4.8,.8,3.4,4.9])this.support(x,z,x<.7?r:small?.066:.1014);
      this.labels.push({id:'branch-'+k,text:k==='A'?'Rama 1 · principal':k==='C'?'Rama 2 · reserva':'Rama de arranque',point:V(-3.4,Y+1.30,z),priority:2});
      const edges=[-5,L.inlet,L.ssv,...(small?[]:[L.monitor]),L.active,L.outlet,5];
      for(let i=1;i<edges.length;i++){this.gasPath([V(edges[i-1]+.045,Y,z),V(edges[i]-.045,Y,z)],'tube-'+k+'-'+i,small?.025:edges[i-1]>=L.active?.055:.034);Object.assign(this.gas.at(-1),{branch:k,mid:(edges[i]+edges[i-1])/2});}
      for(const [side,x] of [['entry',-5],['exit',5]])if(z!==0){this.gasPath(side==='entry'?[V(x,Y,0),V(x,Y,z)]:[V(x,Y,z),V(x,Y,0)],side+'-'+k,x<0?.034:.055);this.gas.at(-1).branch=k;}
    }
    transmitter(x,z,name){this.item(name,null,name+' · manifold de 2 vías',V(x,Y,z),g=>{const r=x<0?.10:.188;this.connector(V(0,r,0),'y',g,.04);this.pipe(V(0,r,0),V(0,r+.23,0),.025,this.mat.metal,false,g);this.mesh(new THREE.BoxGeometry(.13,.11,.10),this.mat.metal,V(0,r+.27,0),g);for(const s of [-1,1])this.mesh(new THREE.BoxGeometry(.025,.12,.025),this.mat.dark,V(s*.11,r+.27,0),g);this.turned([[.03,-.10],[.05,-.07],[.07,-.03],[.085,0],[.085,.13],[.065,.16]],this.mat.metal,V(0,r+.43,0),g);
        this.pipe(V(0,r+.49,-.07),V(0,r+.49,.085),.071,this.mat.dark,false,g);this.ring(V(0,r+.49,.089),.071,.009,this.mat.metal,'z',g);this.connector(V(.09,r+.48,0),'x',g,.032);},'Toma superior del colector y manifold de dos vías según plano. PIT 3001 entrada y PIT 3002 salida.');}
    collectorGauge(x,z,name){this.item(name,null,name+' · colector',V(x,Y,z),g=>{const r=x<0?.10:.188;this.connector(V(0,r,0),'y',g,.03);this.pipe(V(0,r,0),V(0,r+.28,0),.022,this.mat.metal,false,g);this.gaugeFace(g,V(0,r+.40,0),.13);},'Instrumento de colector representado en la planta; posición relativa tomada del plano.');}
    odorizer(){this.item('odorizer',null,'Odorizador · dos conexiones',V(5.35,1.05,-3.05),g=>{const m=this.mesh(new THREE.CylinderGeometry(.26,.26,1.10,32),this.mat.filter,V(0,0,0),g);m.rotation.z=Math.PI/2;for(const x of [-.55,.55])this.mesh(new THREE.SphereGeometry(.26,24,16),this.mat.filter,V(x,0,0),g);for(const x of [-.35,.35])this.pipe(V(x,-.15,0),V(x,-.90,0),.04,this.mat.skid,false,g);},'Geometría simplificada del odorizador. No se calcula dosificación.');for(const x of [5.15,5.50])this.tube([V(x,1.28,-3.05),V(x,2.25,-3.05),V(5,2.25,-3.05),V(5,Y,-2.55)],.022);}
    turned(profile,mat,pos,parent=this.scene,axis='y'){
      const m=this.mesh(new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),48),mat,pos,parent);if(axis==='x')m.rotation.z=-Math.PI/2;if(axis==='z')m.rotation.x=Math.PI/2;return m;
    }
    bolt(pos,parent=this.scene,size=.018,axis='y'){
      const g=new THREE.Group();g.position.copy(pos);parent.add(g);if(axis==='x')g.rotation.z=Math.PI/2;if(axis==='z')g.rotation.x=Math.PI/2;
      this.mesh(new THREE.CylinderGeometry(size*.57,size*.57,size*3.5,12),this.mat.metal,V(0,0,0),g);
      this.mesh(new THREE.CylinderGeometry(size*1.2,size*1.2,size*.25,12),this.mat.metal,V(0,-size*.25,0),g);
      this.mesh(new THREE.CylinderGeometry(size,size,size,6),this.mat.metal,V(0,size*.4,0),g);
      this.mesh(new THREE.CylinderGeometry(size*.62,size*.62,size*.12,8),this.mat.dark,V(0,size*1.15,0),g);
    }
    plaque(pos,w,h,parent,axis='z'){
      const g=new THREE.Group();g.position.copy(pos);parent.add(g);if(axis==='y')g.rotation.x=-Math.PI/2;
      this.mesh(new THREE.BoxGeometry(w,h,.004),this.mat.metal,V(0,0,0),g);
      for(const y of [-h*.28,0,h*.28])this.mesh(new THREE.BoxGeometry(w*.65,.002,.003),this.mat.dark,V(0,y,.004),g);
      for(const x of [-1,1])for(const y of [-1,1])this.mesh(new THREE.SphereGeometry(.004,8,6),this.mat.dark,V(x*w*.42,y*h*.38,.004),g);
    }
    flange(pos,r=.18,parent=this.scene){
      for(const side of [-1,1]){
        this.pipe(pos.clone().add(V(side*.012,0,0)),pos.clone().add(V(side*.053,0,0)),r,this.mat.pipe,false,parent);
        this.turned([[r*.52,-.032],[r*.55,-.018],[r*.76,.007],[r*.9,.013]],this.mat.pipe,pos.clone().add(V(side*.07,0,0)),parent,'x');
      }
      this.ring(pos,r*.96,.006,this.mat.dark,'x',parent);
      for(let i=0;i<8;i++){const a=(i+.5)*Math.PI/4,p=pos.clone().add(V(0,Math.cos(a)*r*.79,Math.sin(a)*r*.79));this.bolt(p.clone().add(V(.055,0,0)),parent,.017,'x');this.bolt(p.clone().add(V(-.055,0,0)),parent,.017,'x');}
    }
    gaugeFace(g,pos,r){
      this.pipe(pos.clone().add(V(0,0,-.035)),pos.clone().add(V(0,0,.015)),r*1.04,this.mat.metal,false,g);
      const face=this.mesh(new THREE.CircleGeometry(r*.91,48),this.mat.filter,pos.clone().add(V(0,0,.028)),g);
      this.ring(pos.clone().add(V(0,0,.034)),r*.98,.010,this.mat.metal,'z',g);
      for(let i=0;i<=40;i++){const a=Math.PI*1.25-i*Math.PI*1.5/40,major=i%4===0,len=major?.023:.010;
        const m=this.mesh(new THREE.BoxGeometry(.003,len,.002),this.mat.dark,pos.clone().add(V(Math.cos(a)*r*.79,Math.sin(a)*r*.79,.030)),g);m.rotation.z=a-Math.PI/2;}
      const needle=new THREE.Group();needle.position.copy(pos).add(V(0,0,.036));g.add(needle);
      this.pipe(V(-r*.16,0,0),V(r*.69,0,0),.003,this.mat.dark,false,needle);
      this.mesh(new THREE.SphereGeometry(.010,12,8),this.mat.dark,V(0,0,.002),needle);
      this.mesh(new THREE.BoxGeometry(r*.62,.008,.003),this.mat.dark,pos.clone().add(V(0,-r*.34,.031)),g);
      return needle;
    }
    gasPath(points,key,r){
      const path=new THREE.CurvePath();for(let i=1;i<points.length;i++)if(points[i].distanceTo(points[i-1])>.001)path.add(new THREE.LineCurve3(points[i-1],points[i]));
      const core=this.mesh(new THREE.TubeGeometry(path,Math.max(1,Math.ceil(path.getLength()*4)),r,10,false),this.mat.gas.clone(),V(0,0,0));core.material.transparent=true;core.material.opacity=.50;core.material.depthWrite=false;core.renderOrder=8;
      const count=Math.max(1,Math.ceil(path.getLength()/.52)),particles=[];
      // Option A: larger, darker arrows; the gas band and pipe materials are unchanged.
      const arrowRadius=Math.min(.044,r*1.10),arrowHalfLength=Math.min(.105,path.getLength()*.40);
      const profile=[new THREE.Vector2(0,-arrowHalfLength),new THREE.Vector2(arrowRadius*.36,-arrowHalfLength),new THREE.Vector2(arrowRadius*.36,arrowHalfLength*.12),new THREE.Vector2(arrowRadius,arrowHalfLength*.12),new THREE.Vector2(0,arrowHalfLength)];
      const geo=new THREE.LatheGeometry(profile,12);
      for(let i=0;i<count;i++){const m=this.mesh(geo,this.mat.gas.clone(),V(0,0,0));m.material.transparent=true;m.material.depthWrite=false;m.material.toneMapped=false;m.renderOrder=10;m.userData.gasArrow=true;m.visible=false;particles.push(m);}
      this.gas.push({key,path,particles,core,phase:0,r,arrowHalfLength});
    }
    ventCloud(key,origin){
      const group=new THREE.Group(),puffs=[];group.position.copy(origin);group.visible=false;this.scene.add(group);
      const geometry=new THREE.SphereGeometry(1,14,10);
      for(let i=0;i<4;i++){const puff=new THREE.Group(),layers=[];group.add(puff);
        for(const size of [1,1.23,1.45]){const material=new THREE.MeshBasicMaterial({color:new THREE.Color('#8096a3').convertSRGBToLinear(),transparent:true,opacity:0,depthWrite:false,toneMapped:false});const mesh=new THREE.Mesh(geometry,material);mesh.scale.setScalar(size);mesh.userData.ventCloud=true;puff.add(mesh);layers.push(mesh);}
        puffs.push({group:puff,layers});
      }
      this.ventClouds.push({key,group,puffs,phase:0});
    }
    xray(on){this.xrayOn=on;for(const mesh of this.shells){mesh.material.transparent=on;mesh.material.opacity=on?.56:1;mesh.material.depthWrite=!on;}for(const g of this.gas){g.core.material.depthTest=true;for(const a of g.particles)a.material.depthTest=true;}}
    cutaway(on){this.cutawayOn=on;for(const mesh of this.bodyShells){mesh.material.transparent=false;mesh.material.opacity=1;mesh.material.depthWrite=true;mesh.updateWorldMatrix(true,false);const center=mesh.getWorldPosition(new THREE.Vector3());mesh.material.clippingPlanes=on?[new THREE.Plane(new THREE.Vector3(0,0,-1),center.z)]:[];mesh.material.side=on?THREE.DoubleSide:THREE.FrontSide;mesh.material.needsUpdate=true;}for(const o of Object.values(this.shutters))o.group.visible=on;}
    signals(on){for(const t of this.tubings)t.group.visible=on;}
    select(id){this.selected=id;const part=this.parts[id];this.selection.visible=!!part&&!part.route;if(part){this.selection.setFromObject(part.group);for(let i=0;i<2;i++){this.endpointMarks[i].visible=!!part.route;if(part.route)this.endpointMarks[i].position.copy(i?part.route.end:part.route.start);}}for(const route of this.tubings)route.group.traverse(o=>{if(o.isMesh&&o.geometry.type==='TubeGeometry'){o.material=route.id===id?this.mat.highlight:this.mat.tube;}});}
    update(trainer,dt,motion){
      const m=trainer.model;if(this.lastRevision!==trainer.revision){this.domainMemory={};this.lastRevision=trainer.revision;}
      for(const k of ['A','B','C']){
        const L=ERP25Layout.branches[k],st=trainer.state(k);this.domainMemory[k]=trainer.domains(k,this.domainMemory[k]);
        for(const side of ['in','out']){const lever=this.parts[side+'-'+k+'-lever'],v=side==='in'?st.inlet:st.outlet;lever.angle+=((1-v)*Math.PI/2-lever.angle)*Math.min(1,dt*8);lever.group.rotation.y=lever.angle;lever.grip.material=v?this.mat.open:this.mat.closed;}
        for(const [id,opening] of [['in-'+k,st.inlet],['out-'+k,st.outlet],['ssv-'+k,st.ssv],['monitor-'+k,st.monitor],['active-'+k,st.active]]){
          const val=Math.max(0,opening||0),shutter=this.shutters[id];if(shutter){shutter.plug.position.y=val*shutter.r*2.3;shutter.stem.position.y=shutter.plug.position.y;shutter.plug.material=val<.000001?this.mat.closed:this.mat.metal;}
          const unknown=(id.startsWith('monitor-')||id.startsWith('active-'))&&(!m.branches[k].enabled||!st.ssv);
          if(shutter)shutter.group.visible=this.cutawayOn&&!unknown;
          if(this.travel[id]){this.travel[id].visible=!unknown;this.travel[id].position.y=.535+val*.12;}
          for(const w of this.windows[id]||[]){const open=val>.000001;w.rim.material=unknown?this.mat.metal:open?this.mat.open:this.mat.closed;w.aperture.material=open?this.mat.open:this.mat.dark;w.hole.visible=open&&!unknown;w.hole.scale.setScalar(Math.sqrt(val));for(const b of w.bars)b.visible=!open&&!unknown;}
        }
        for(const id of ['gauge-'+k,'pi-in-'+k,'pi-mid-'+k]){const needle=this.parts[id+'-needle'];if(!needle)continue;const p=this.domainMemory[k].find(d=>needle.x>d.start&&needle.x<d.end)?.pressure||0;needle.group.rotation.z=Math.PI*1.25-Math.min(1,Math.max(0,(p/.980665)/needle.range))*Math.PI*1.5;}
      }
      
      for(const set of this.gas){let q=0,p=0,source='';if(set.key==='in'){q=m.qin;p=m.cfg.pin;}else if(set.key==='out'){q=m.qd;p=m.p;}else if(set.key.startsWith('vent-')){q=m.branches[set.key.slice(5)].relief.q;p=q>1e-6?m.p:0;}else if(set.key.startsWith('entry-')){q=m.branches[set.branch].q;p=m.cfg.pin;}else if(set.key.startsWith('exit-')){q=m.branches[set.branch].q;p=m.p;}else{const d=this.domainMemory[set.branch].find(d=>set.mid>d.start&&set.mid<d.end);if(d){q=d.flow;p=d.pressure;source=d.source;}}
        const isVent=set.key.startsWith('vent-'),intensity=isVent?Math.min(1,q/Math.max(1,m.branches[set.key.slice(5)].relief.qmax)):1;
        set.flow=q;set.pressure=p;set.source=source;const moving=q>(isVent?1e-6:1),high=p>Math.max(3,trainer.settings.a1*2),color=high?this.mat.high.color:this.mat.gas.color;set.core.visible=isVent?moving:p>.03;set.core.material.color.copy(color);set.core.material.opacity=isVent?.18+.32*intensity:moving?.50:.12;
        if(motion&&moving)set.phase=(set.phase+dt*(.22+.10*Math.sqrt(Math.min(q,3000)/500))/Math.max(.15,set.path.getLength()))%1;
        set.particles.forEach((mesh,i)=>{mesh.visible=moving&&(isVent||p>.03);mesh.material.opacity=isVent?.45+.55*intensity:1;mesh.material.color.set(high?'#974609':'#0b4f7b').convertSRGBToLinear();const u=(set.phase+(i+.5)/set.particles.length)%1;const safe=Math.min(.49,(set.arrowHalfLength+.006)/Math.max(.016,set.path.getLength())),v=safe+(1-2*safe)*u;mesh.position.copy(set.path.getPoint(v));mesh.quaternion.setFromUnitVectors(V(0,1,0),set.path.getTangent(v).normalize());});
      }
      for(const cloud of this.ventClouds){const relief=m.branches[cloud.key].relief,q=relief.q;cloud.group.visible=q>1e-6;if(!cloud.group.visible){cloud.phase=0;continue;}
        const strength=.35+.65*Math.sqrt(Math.min(1,q/Math.max(1,relief.qmax)));if(motion)cloud.phase=(cloud.phase+dt*.24)%1;
        cloud.puffs.forEach((puff,i)=>{const u=(cloud.phase+i/cloud.puffs.length)%1,r=.065+.13*u+.035*strength,fade=Math.sin(Math.PI*u);
          puff.group.position.set(.045*Math.sin(i*2.4+u*3)*u,.07+.55*u,.035*Math.cos(i*1.7+u*2)*u);puff.group.scale.set(r*1.45,r*.80,r*1.15);
          puff.layers.forEach((mesh,j)=>{mesh.material.opacity=fade*strength*[.18,.065,.028][j];});
        });
      }
      if(this.parts['qev-A'])this.parts['qev-A'].group.traverse(o=>{if(o.isMesh&&o.material&&o.material.emissive){o.material.emissive.setHex(m.qev.active?0x884400:0x000000);}});
      this.labels.find(l=>l.id==='in').text=`Entrada ${m.cfg.pin.toFixed(1)} bar(g)`;this.labels.find(l=>l.id==='out').text=`Salida ${m.p.toFixed(2)} bar(g)`;
    }
  }
  globalThis.ERP25Scene={Plant};
})();
