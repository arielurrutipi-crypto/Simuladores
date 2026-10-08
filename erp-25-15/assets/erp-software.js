(() => {
  // Canvas projection of the same 3D meshes, for hosts without WebGL.
  class SoftwareRenderer {
    constructor(canvas){this.domElement=canvas;this.ctx=canvas.getContext('2d');this.ratio=1;this.width=1;this.height=1;this.last=0;this.compatible=true;this.meshCache=new WeakMap();this.faces=[];if(!this.ctx)throw new Error('Canvas no disponible');}
    setPixelRatio(r){this.ratio=Math.min(r,1.5);}
    setSize(w,h){this.width=w;this.height=h;this.domElement.width=Math.round(w*this.ratio);this.domElement.height=Math.round(h*this.ratio);}
    setClearColor(){}
    render(scene,camera,force=false){
      const now=Date.now();if(!force&&now-this.last<100)return;this.last=now;
      scene.updateMatrixWorld(true);camera.updateMatrixWorld();
      const projection=new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),faces=this.faces;faces.length=0;
      const light=new THREE.Vector3(.3,.8,.5).normalize();
      scene.traverse(mesh=>{
        if(!mesh.isMesh||!mesh.visible)return;let parent=mesh.parent;while(parent){if(!parent.visible)return;parent=parent.parent;}
        const geometry=mesh.geometry,attr=geometry.attributes.position;if(!attr)return;
        const mvp=new THREE.Matrix4().multiplyMatrices(projection,mesh.matrixWorld),normalMatrix=new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
        let cached=this.meshCache.get(mesh);if(!cached||cached.geometry!==geometry){cached={geometry,vertices:[],faces:[],colors:[],colorKey:''};this.meshCache.set(mesh,cached);}
        const vertices=cached.vertices,e=mvp.elements;
        for(let i=0;i<attr.count;i++){const x=attr.getX(i),y=attr.getY(i),z=attr.getZ(i),w=e[3]*x+e[7]*y+e[11]*z+e[15],v=vertices[i]||(vertices[i]={});v.x=((e[0]*x+e[4]*y+e[8]*z+e[12])/w+1)*this.width/2;v.y=(1-(e[1]*x+e[5]*y+e[9]*z+e[13])/w)*this.height/2;v.z=(e[2]*x+e[6]*y+e[10]*z+e[14])/w;v.w=w;}
        const index=geometry.index,triangles=index?index.count:attr.count;
        const material=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
        const raw=material.color||new THREE.Color(1,1,1),colorKey=raw.getHexString()+(material.isMeshBasicMaterial?'':mesh.matrixWorld.elements.slice(0,12).join(','));if(colorKey!==cached.colorKey){cached.colors=[];cached.colorKey=colorKey;}
        for(let i=0;i<triangles;i+=3){const ia=index?index.getX(i):i,ib=index?index.getX(i+1):i+1,ic=index?index.getX(i+2):i+2,a=vertices[ia],b=vertices[ib],c=vertices[ic];
          if(a.w<=0||b.w<=0||c.w<=0)continue;
          if(material.clippingPlanes?.length){const center=new THREE.Vector3().fromBufferAttribute(attr,ia).add(new THREE.Vector3().fromBufferAttribute(attr,ib)).add(new THREE.Vector3().fromBufferAttribute(attr,ic)).multiplyScalar(1/3).applyMatrix4(mesh.matrixWorld);if(material.clippingPlanes.some(p=>p.distanceToPoint(center)<0))continue;}
          if(material.side!==THREE.DoubleSide&&(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)>=0)continue;
          if(Math.max(a.x,b.x,c.x)<0||Math.min(a.x,b.x,c.x)>this.width||Math.max(a.y,b.y,c.y)<0||Math.min(a.y,b.y,c.y)>this.height)continue;
          let color=cached.colors[i];if(!color){
            const v1=new THREE.Vector3().fromBufferAttribute(attr,ia),v2=new THREE.Vector3().fromBufferAttribute(attr,ib),v3=new THREE.Vector3().fromBufferAttribute(attr,ic),normal=(geometry.attributes.normal?new THREE.Vector3().fromBufferAttribute(geometry.attributes.normal,ia).add(new THREE.Vector3().fromBufferAttribute(geometry.attributes.normal,ib)).add(new THREE.Vector3().fromBufferAttribute(geometry.attributes.normal,ic)).normalize():v2.sub(v1).cross(v3.sub(v1)).normalize()).applyMatrix3(normalMatrix).normalize(),luminance=material.isMeshBasicMaterial?1:.34+.66*Math.max(0,normal.dot(light)),tint=raw.clone().multiplyScalar(luminance);
            color=cached.colors[i]=`rgb(${Math.round(tint.r*255)},${Math.round(tint.g*255)},${Math.round(tint.b*255)})`;
          }
          const face=cached.faces[i]||(cached.faces[i]={a,b,c});face.z=(a.z+b.z+c.z)/3;face.layer=material.depthTest===false?mesh.renderOrder:0;face.color=color;face.opacity=material.transparent?material.opacity:1;faces.push(face);
        }
      });
      faces.sort((a,b)=>a.layer-b.layer||b.z-a.z);const ctx=this.ctx;ctx.setTransform(this.ratio,0,0,this.ratio,0,0);ctx.clearRect(0,0,this.width,this.height);
      for(const face of faces){ctx.globalAlpha=face.opacity;ctx.fillStyle=face.color;ctx.beginPath();ctx.moveTo(face.a.x,face.a.y);ctx.lineTo(face.b.x,face.b.y);ctx.lineTo(face.c.x,face.c.y);ctx.closePath();ctx.fill();if(face.opacity===1&&ctx.stroke){ctx.strokeStyle=face.color;ctx.lineWidth=.35;ctx.stroke();}}
      ctx.globalAlpha=1;

    }
  }
  globalThis.ERP25Software={SoftwareRenderer};
})();
