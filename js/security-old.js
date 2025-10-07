// Sistema de Protección y Seguridad Inteligente
(function() {
    'use strict';
    
    // Detectar automáticamente el entorno
    const isProduction = !window.location.href.includes('localhost') && 
                        !window.location.href.includes('127.0.0.1') &&
                        !window.location.href.includes('file://') &&
                        !window.location.href.includes('192.168.') &&
                        !window.location.href.includes('10.0.') &&
                        !window.location.href.includes('.local');
    
    console.log(`🛡️ Protecciones de seguridad: ${isProduction ? 'ACTIVADAS (Producción)' : 'REDUCIDAS (Desarrollo)'}`);
    
    // Solo activar protecciones en producción
    if (!isProduction) {
        console.log('%c🔧 Modo Desarrollo Detectado', 'color: orange; font-size: 14px; font-weight: bold;');
        console.log('%c- DevTools permitido', 'color: orange;');
        console.log('%c- Inspección habilitada', 'color: orange;');
        console.log('%c- Debugging activado', 'color: orange;');
        return; // Salir sin aplicar protecciones
    }
    
    console.log('%c🔒 Modo Producción Detectado', 'color: green; font-size: 14px; font-weight: bold;');
    console.log('%c- Protecciones completas activas', 'color: green;');
    
    // Protecciones solo en producción
    const g=function(){
        const h=["sk-","api","key","open","ai"];
        let i=h.join("");
        return i;
    };

    const j=function(k){
        let l="";
        for(let m=0;m<k.length;m++){
            l+=String.fromCharCode(k.charCodeAt(m)^42);
        }
        return btoa(l);
    };

    const n=function(o){
        try{
            let p=atob(o);
            let q="";
            for(let r=0;r<p.length;r++){
q+=String.fromCharCode(p.charCodeAt(r)^42);
}
return q;
}catch(s){
return null;
}
};

const t={
u:function(v){
if(!v||v.length<20)return false;
const w=g();
return v.startsWith(w.substring(0,3));
},
x:function(y){
const z=Date.now().toString();
const aa=Math.random().toString(36);
return j(y+"|"+z+"|"+aa);
},
bb:function(cc){
const dd=n(cc);
if(!dd)return null;
const ee=dd.split("|");
return ee.length>=1?ee[0]:null;
},
ff:function(){
return localStorage.getItem("_cfg")||null;
},
gg:function(hh){
localStorage.setItem("_cfg",this.x(hh));
},
ii:function(){
localStorage.removeItem("_cfg");
}
};

const jj=function(){
setInterval(function(){
if(typeof console!=='undefined'){
const kk=['log','warn','error','debug','trace','table','group','groupEnd'];
kk.forEach(ll=>{
console[ll]=function(){};
});
}
},100);
};

const mm=function(){
// Solo aplicar protecciones estrictas en producción
const isProduction = !window.location.href.includes('localhost') && 
                    !window.location.href.includes('127.0.0.1') &&
                    !window.location.href.includes('file://');

if(isProduction) {
document.addEventListener('keydown',function(nn){
if(nn.ctrlKey&&nn.shiftKey&&nn.keyCode===73){
nn.preventDefault();
return false;
}
if(nn.ctrlKey&&nn.shiftKey&&nn.keyCode===67){
nn.preventDefault();
return false;
}
if(nn.keyCode===123){
nn.preventDefault();
return false;
}
});

document.addEventListener('contextmenu',function(oo){
oo.preventDefault();
return false;
});
}
};

const pp=function(){
const qq=window.outerHeight-window.innerHeight;
const rr=window.outerWidth-window.innerWidth;
if(qq>200||rr>200){
document.body.innerHTML="<div style='display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial;color:#333;'><h2>Acceso no autorizado detectado</h2></div>";
}
};

const ss=function(){
let tt=false;
setInterval(function(){
if(window.console&&window.console.log){
if(!tt){
console.log("%cDetención de debugging","color:red;font-size:30px;");
tt=true;
}
}
},1000);
};

const uu=function(){
if(window.DevTools&&window.DevTools.open){
window.location.reload();
}
};

const vv=function(){
if(typeof window.orientation!=='undefined'){
window.addEventListener('orientationchange',function(){
setTimeout(pp,500);
});
}
window.addEventListener('resize',pp);
};

const ww=function(){
const xx=['firebug','chrome','devtools'];
xx.forEach(yy=>{
if(window[yy]){
document.body.innerHTML="<div style='text-align:center;padding:50px;font-family:Arial;'>Herramientas de desarrollo detectadas</div>";
}
});
};

// Protección contra debugging (menos agresiva para testing)
(function(){
let zz=0;
const aaa=function(){
zz++;
if(zz>3){  // Aumentar tolerancia para testing
// Solo mostrar advertencia en lugar de bloquear completamente
console.warn('Debugging detectado');
}
};
try{
Object.defineProperty(window,'console',{get:aaa,set:aaa});
}catch(e){
// Ignorar errores de redefinición
}
})();

// Anti-tampering
Object.freeze=function(){return arguments[0];};
Object.seal=function(){return arguments[0];};

// Inicialización de protecciones
document.addEventListener('DOMContentLoaded',function(){
jj();
mm();
ss();
uu();
vv();
ww();
setInterval(pp,2000);
});

window._sec={
isValid:t.u,
encrypt:t.x,
decrypt:t.bb,
getKey:t.ff,
setKey:t.gg,
clearKey:t.ii,
checkEnv:function(){
const bbb=['file://'];  // Solo bloquea file://, permite localhost para testing
const ccc=window.location.href;
return !bbb.some(ddd=>ccc.includes(ddd));
}
};

// Protección adicional contra manipulación
if(window._sec){
    Object.defineProperty(window,'_sec',{
        writable:false,
        configurable:false
    });

})(); // Fin de protecciones de producción