'use strict';
/* ============================================================
   THE MUSTER POINTZ — FASE 9: ROSTER LENGKAP
   ------------------------------------------------------------
Riwayat: F5 = Elite/Boss/eskalasi · F6 = crafting & penyembuhan
(§20.2 penuh, special slots, armor §6.5, Storage Box, Lantern,
kompor) · F6.5 = defeat penalty, ghost placement, wipe progress ·
F7 = tim & revive (chars[], Bambang, Deploy Menu §23.2, Down &
Revive §4.4 + RECOVERING, transfer, auto-save) · F8 = unlock &
rescue (Rehan + Memet, toko Respect §7 + layar unlock §17,
Random Event §16 + QTE + jebakan pintu, rescue = langsung deploy).
F9 (ini):

1. F9a — Roster 13 lengkap §21: 6 Rare + 3 SR — data CHARS,
   model bespoke per hero (aturan tetap: rambut 6-bidang
   menonjol, kacamata builder tunggal mkGlasses ring/box,
   verifikasi part di frame POSE AKHIR, anchor tak digeser utk
   pose), senjata unik (M249/pump/MGL/MP5/Mini-14/M4/Benelli/
   AWP/Dragunov), stance 2 tangan, suara gun+reload per
   karakter + fallback synth, bahu lengan sejajar
2. F9b — Engine senjata §6.4: pierce + hit-set (zombie tak
   kena 2× peluru sama), kipas multi-target, multi-proyektil
   ATK/N §6.4.2 (Vikry 5/25° · Lele 8/35°), explosive impact
   AoE (Erry — reload 17.5s base = 15s efektif), on-hit status
   (SLOW 50/35/80% · STUN Lele 3s · BURN 20/35% + atribusi src),
   burst generalisasi, hook _reloadMul, sfxOnce Sobel +
   fail-safe sfxStop mid-burst
3. F9b.5 — Squad Chat: bubble ALERT/NOTICE rata kiri, max 3,
   reporter acak (selected termasuk), 3 varian kalimat/event,
   edge-trigger sekarat <15HP, alert.mp3/notice.mp3
4. F9c — 9 skill §21.2: Brrrt (kipas 60° 15 pierce, mag freeze,
   reload berikut +50%) · I am the storm (ricochet 100/75/70/
   65% + STUN 2s) · Eat this! (5 ledakan kipas 45°, blast.mp3)
   · Not on my watch! (zona heal) · Free Meals (mode lempar
   ghost biru/merah, zona tray) · Pyromaniac (molotov, zona api
   FRIENDLY-FIRE sadar) · Gorilla Mode (konsumsi 50% HP → +4
   stat penuh, reload +70%) · Quick-scope (STUN on-hit cd per
   target) · HAHAHAHA! (mode lock-target, sticky 250%/200%) —
   semua mode lempar: window 5 dtk + lockdown + auto-throw ke
   target paling bahaya
5. F9d — Pasif + akses resmi: build/craft per panelChar (jebakan
   Reza, barikade Vikry, cooking Alvi, aid Ariz, armor Sobel),
   cover Vikry, mag-200 Sobel, lastShot Raptor, bigHitHeal Lele,
   dotHeal Reza, elite2x Erry, fastRevive Ariz 2s, bombEnergy
   Hafid, buffBoost Alvi
6. Batch QA FIX 8–29: muzzle per karakter, layar unlock selalu
   rebuild, XP/EN float di penerima, lock-on engage range+LOS,
   tangan crawler, pistol Bambang (grip bawah), jalur dual +
   makeBullet, deploy 2 kolom + header/footer fixed + tombol
   kanan-bawah + label PASSIVE, badge ammo, eskalasi elite/3
   malam & boss/5, Night 1 = 90 zombie, drop rebalance, footer
   kartu tunggal, blast.mp3
=========================================================== */

// ================= 1. BOOT GUARD & PELAPOR ERROR =================
if(typeof THREE==='undefined'){
 reportErr('Three.js gagal dimuat dari CDN. Cek koneksi internet lalu refresh. '
  +'Jika dibuka di preview sandbox: unduh 3 file ke satu folder dan buka '
  +'index.html langsung di Chrome/Firefox/Edge.');
 throw new Error('THREE undefined');
}
// F12.1: ERROR OVERLAY diperluas — tampilkan message + lokasi (file:line:col) +
// stack trace scrollable + tombol COPY/DISMISS. Fallback execCommand utk file://.
// Signature opsional: reportErr(msg, src, line, col, stack, force).
// - Runtime error: muncul SEKALI (_errShown), stack tersedia (same-origin).
// - Cross-origin script: stack=null, hanya "Script error." — overlay tampil
//   hint "(stack tidak tersedia — cross-origin)".
// - force=true (dipakai boot guard kalau perlu): tampil meski _errShown true.
let _errShown=false;
function reportErr(m,src,line,col,stack,force){
 try{console.error('[MPZ ERROR]',m,src?src+':'+line+':'+col:'',stack||'');}catch(_){}
 if(_errShown&&!force)return;
 _errShown=true;
 const old=document.getElementById('errOverlay');
 if(old)old.remove();
 const d=document.createElement('div');
 d.id='errOverlay';
 d.style.cssText='position:fixed;top:44px;left:50%;transform:translateX(-50%);'
  +'z-index:999;background:#1a0e0c;border:1px solid #c0453a;color:#ffb0a0;'
  +'font:12px/1.5 monospace;max-width:92vw;min-width:360px;'
  +'box-shadow:0 8px 32px rgba(0,0,0,.85),0 0 0 1px rgba(192,69,58,.3);'
  +'padding:0;display:flex;flex-direction:column;pointer-events:auto';
 // ---- header ----
 const hdr=document.createElement('div');
 hdr.style.cssText='display:flex;justify-content:space-between;align-items:center;'
  +'padding:8px 14px;border-bottom:1px solid #3b1a16;background:#2b120e';
 const title=document.createElement('span');
 title.style.cssText='font:bold 13px monospace;color:#e07a70;letter-spacing:.08em';
 title.textContent='⚠ SCRIPT ERROR';
 hdr.appendChild(title);
 const btnWrap=document.createElement('div');
 const mkBtn=(txt,onClick,primary)=>{
  const b=document.createElement('button');
  b.textContent=txt;
  b.style.cssText='font:10px monospace;padding:3px 10px;cursor:pointer;'
   +(primary?'background:#241412;border:1px solid #7a3a34;color:#ffb0a0'
            :'background:none;border:1px solid #7a3a34;color:#e07a70')
   +';margin-left:6px';
  b.onclick=onClick;
  return b;
 };
 const copy=mkBtn('COPY',()=>{},true);
 const dismiss=mkBtn('DISMISS',()=>d.remove(),false);
 btnWrap.appendChild(copy);btnWrap.appendChild(dismiss);
 hdr.appendChild(btnWrap);
 d.appendChild(hdr);
 // ---- body ----
 const body=document.createElement('div');
 body.style.cssText='padding:10px 14px;max-height:60vh;overflow-y:auto';
 const msgEl=document.createElement('div');
 msgEl.style.cssText='color:#ffb0a0;font:13px monospace;word-break:break-word;margin-bottom:6px';
 msgEl.textContent=String(m||'Unknown error');
 body.appendChild(msgEl);
 if(src){
  const loc=document.createElement('div');
  loc.style.cssText='color:#8f8264;font:11px monospace;margin-bottom:8px';
  loc.textContent='at '+src+(line?':'+line:'')+(col?':'+col:'');
  body.appendChild(loc);
 }
 if(stack){
  const pre=document.createElement('pre');
  pre.style.cssText='color:#cfc4a6;font:11px monospace;background:#0e0707;'
   +'border:1px solid #3b1a16;padding:8px 10px;margin:0;'
   +'white-space:pre-wrap;word-break:break-word;max-height:32vh;overflow-y:auto';
  pre.textContent=String(stack);
  body.appendChild(pre);
 }else if(!src){
  const hint=document.createElement('div');
  hint.style.cssText='color:#8f8264;font:10px monospace;font-style:italic';
  hint.textContent='(stack tidak tersedia — script cross-origin atau error non-runtime)';
  body.appendChild(hint);
 }
 d.appendChild(body);
 // ---- footer ----
 const foot=document.createElement('div');
 foot.style.cssText='padding:6px 14px;border-top:1px solid #3b1a16;'
  +'color:#8f8264;font:10px monospace;background:#120807';
 foot.textContent='Klik COPY untuk salin · lalu tempel ke chat';
 d.appendChild(foot);
 // ---- COPY handler (navigator.clipboard + fallback execCommand) ----
 copy.onclick=()=>{
  const txt='['+new Date().toISOString()+']\n'
   +'MESSAGE: '+String(m||'')+'\n'
   +(src?'LOCATION: '+src+(line?':'+line:'')+(col?':'+col:'')+'\n':'')
   +(stack?'STACK:\n'+stack:'');
  const done=ok=>{
   copy.textContent=ok?'COPIED ✓':'COPY FAILED';
   copy.style.borderColor=ok?'#4a6a2c':'#7a3a34';
   copy.style.color=ok?'#9ad970':'#ffb0a0';
   setTimeout(()=>{
    copy.textContent='COPY';
    copy.style.borderColor='#7a3a34';
    copy.style.color='#ffb0a0';
   },1600);
  };
  const fallback=()=>{
   try{
    const ta=document.createElement('textarea');
    ta.value=txt;ta.style.cssText='position:fixed;top:-9999px;left:-9999px';
    document.body.appendChild(ta);ta.select();
    const ok=document.execCommand('copy');
    ta.remove();done(ok);
   }catch(e){done(false);}
  };
  if(navigator.clipboard&&navigator.clipboard.writeText){
   navigator.clipboard.writeText(txt).then(()=>done(true)).catch(fallback);
  }else fallback();
 };
 document.body.appendChild(d);
}
// F12.1: window.onerror pass semua argumen (msg, src, line, col, err).
// err.stack tersedia utk error same-origin. Return false = jangan suppress
// default browser logging (DevTools tetap catat).
window.onerror=(m,src,line,col,err)=>{
 const stack=(err&&err.stack)?err.stack:null;
 reportErr(String(m),src||null,line||null,col||null,stack,false);
 return false;
};

// ================= 2. HELPER =================
const $   = id => document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp =(a,b,t)=>a+(b-a)*t;
const rnd  =(a,b)=>a+Math.random()*(b-a);
const ri   =(a,b)=>Math.floor(rnd(a,b+1));
const pick =a=>a[Math.random()*a.length|0];
const fmt  =t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0')};
const clockFmt=t=>{t|=0;return String(t/3600|0).padStart(2,'0')+':'
 +String((t/60|0)%60).padStart(2,'0')+':'+String(t%60).padStart(2,'0')};
const fmtNum=n=>Math.round(n||0).toLocaleString('en-US'); // F10.3: pemisah ribuan
const setTxt=(id,v)=>{const e=$(id);if(e)e.textContent=v};
const setW  =(id,v)=>{const e=$(id);if(e)e.style.width=v};
const showEl=(id,show)=>{const e=$(id);if(e)e.style.display=show?'flex':'none'};

// ================= 3. JARING PENGAMAN DOM + CSS =================
function ensure(id,css,html){
 let e=$(id);if(e)return e;
 e=document.createElement('div');e.id=id;
 if(css)e.style.cssText=css;
 if(html)e.innerHTML=html;
 document.body.appendChild(e);return e;
}
ensure('game','position:fixed;inset:0;z-index:0');
ensure('overheads','position:fixed;inset:0;pointer-events:none;z-index:8;overflow:hidden');
ensure('floaters','position:fixed;inset:0;pointer-events:none;z-index:9;overflow:hidden');
// P-N2b: posisi kanan-atas — inline style hrs disinkronkan dgn style.css agar
// konsisten (kalau #toasts belum ada di index.html, ensure bikin dgn posisi ini).
ensure('toasts','position:fixed;top:84px;right:14px;'
 +'display:flex;flex-direction:column;align-items:flex-end;gap:4px;pointer-events:none;z-index:27');
// Notification-fix: #toasts ada di dalam #hud pada index.html → stacking context
// terkunci di z-index:10, tak bisa menang atas squad-cards (z:10, DOM lebih akhir)
// atau panels (z:25). Pindahkan ke body supaya z-index-nya benar-benar berlaku.
{const t=document.getElementById('toasts');if(t&&t.parentElement&&t.parentElement.id==='hud')document.body.appendChild(t);}
ensure('banner','position:fixed;top:30%;left:0;right:0;text-align:center;'
 +'pointer-events:none;z-index:11;opacity:0;transition:opacity .5s',
 '<div class="b2"></div><div class="b1"></div><div class="stripe"></div>');
// F10.3-fix: tombol RETRY dihapus — statistik overlay (#sessionStats) sekarang
// adalah satu-satunya tempat restart setelah sesi berakhir (GDD §23.11).
// Defeat overlay murni splash transisi, auto-transisi ke stats setelah 2.5s.
ensure('defeat','position:fixed;inset:0;z-index:30;display:none;flex-direction:column;'
 +'align-items:center;justify-content:center;background:rgba(5,4,3,.72);pointer-events:none',
 '<h1 style="font-family:Staatliches,sans-serif;font-size:64px;color:#c0453a;'
 +'text-shadow:0 3px 0 #000">EVERYONE IS INFECTED</h1>'
 +'<p id="defStats" style="color:#cfc4a6;font-family:monospace;font-size:13px;'
 +'line-height:2;text-align:center"></p>');
ensure('pause','position:fixed;inset:0;z-index:29;display:none;flex-direction:column;'
 +'align-items:center;justify-content:center;background:rgba(5,4,3,.5);pointer-events:none',
 '<h1 style="font-family:Staatliches,sans-serif;font-size:64px;color:#d9a13b">PAUSED</h1>');
// F10.3-fix: Skip Prep disamakan dgn End the Night (compact, top:130 sesuai
// style.css P-N2b). Inline top dikosongkan — biarkan style.css yang atur posisi.
ensure('skipBtn','position:fixed;right:14px;z-index:12;background:#241c10;'
 +'border:1px solid #7a6a2c;color:#d9c26a;padding:5px 12px;font:12px Staatliches,sans-serif;'
 +'letter-spacing:.06em;cursor:pointer;pointer-events:auto;display:none');
ensure('invPanel','position:fixed;inset:0;display:none;align-items:center;justify-content:center;'
 +'background:rgba(5,4,3,.6);z-index:25;pointer-events:auto',
 '<div class="f3p"><div class="f3h"><h2>INVENTORY — DIAZ</h2>'
 +'<button class="f3x" id="invX">×</button></div>'
 +'<div id="specSlots"></div>'
 +'<div id="invGrid"></div>'
 +'<div id="invTools"></div>'
 +'<div class="f3f" id="invFoot">Stack max 50 · material untuk Building (B)</div></div>');
ensure('buildPanel','position:fixed;inset:0;display:none;align-items:center;justify-content:center;'
 +'background:rgba(5,4,3,.6);z-index:25;pointer-events:auto',
 '<div class="f3p"><div class="f3h"><h2>BUILDING — DIAZ</h2>'
 +'<button class="f3x" id="buildX">×</button></div>'
 +'<div id="buildRows"></div>'
 +'<div class="f3f">Walk to within 1 block of the build spot · Repair: klik kanan barikade rusak</div></div>');
ensure('craftPanel','position:fixed;inset:0;display:none;align-items:center;justify-content:center;'
 +'background:rgba(5,4,3,.6);z-index:25;pointer-events:auto',
 '<div class="f3p"><div class="f3h"><h2>CRAFTING — DIAZ</h2>'
 +'<button class="f3x" id="craftX">×</button></div>'
 +'<div id="craftRows"></div>'
 +'<div class="f3f">Material dari drop zombie · H: pakai heal · G: pakai buff</div></div>');
ensure('storePanel','position:fixed;inset:0;display:none;align-items:center;justify-content:center;'
 +'background:rgba(5,4,3,.6);z-index:25;pointer-events:auto',
 '<div class="f3p"><div class="f3h"><h2>STORAGE BOX</h2>'
 +'<button class="f3x" id="storeX">×</button></div>'
 +'<div id="storeBody"></div>'
 +'<div class="f3f">Klik item untuk transfer · kapasitas 20 slot</div></div>');
// skill timer ring — lingkaran biru muda di atas segitiga seleksi
ensure('skillRing','position:fixed;z-index:12;pointer-events:none;width:26px;height:26px;'
 +'display:none;transform:translate(-50%,-50%)',
 '<div id="srRing" style="width:100%;height:100%;border-radius:50%;'
 +'-webkit-mask:radial-gradient(circle,transparent 8px,black 9px);'
 +'mask:radial-gradient(circle,transparent 8px,black 9px)"></div>');
(function(){
 const s=document.createElement('style');
 s.textContent=
 '.f3p{background:#14110d;border:1px solid #3b3122;box-shadow:0 10px 40px #000;'
 +'min-width:340px;max-width:560px;max-height:84vh;overflow-y:auto}'
 +'.f3h{display:flex;justify-content:space-between;align-items:center;padding:8px 14px;'
 +'border-bottom:1px solid #262017;background:#171310;position:sticky;top:0}'
 +'.f3h h2{font:20px Staatliches,sans-serif;color:#d9a13b;letter-spacing:.05em}'
 +'.f3x{background:none;border:1px solid #3b3122;color:#8f8264;width:26px;height:26px;'
 +'cursor:pointer;font:14px monospace}'
 +'.f3x:hover{border-color:#c0453a;color:#c0453a}'
 +'.f3f{padding:0 14px 10px;font:10px monospace;color:#5c5340;line-height:1.5}'
 +'#invGrid{display:grid;grid-template-columns:repeat(4,56px);gap:5px;padding:12px 14px}'
 +'.islot{width:56px;height:76px;background:#0e0c09;border:1px solid #262017;position:relative;cursor:pointer}'
 +'.islot .ic{position:absolute;top:6px;left:50%;transform:translateX(-50%);'
 +'width:32px;height:32px;border:1px solid #000}'
 +'.islot .icimg{position:absolute;top:6px;left:50%;transform:translateX(-50%);'
 +'width:32px;height:32px;image-rendering:pixelated}'
 +'.islot .nm{position:absolute;top:42px;left:2px;right:2px;font:8px monospace;'
 +'color:#8f8264;text-align:center;line-height:1.1;overflow:hidden}'
 +'.islot .qty{position:absolute;bottom:2px;left:0;right:0;font:10px monospace;'
 +'color:#e7dcc3;text-align:center}'
 +'.islot.selR{border-color:#c0453a;background:#1c0f0c}'
 +'.islot.selA{border-color:#d9a13b;background:#1c1409}'
 +'#invTools{display:flex;gap:14px;padding:6px 14px 2px}'
 +'#invPanel .f3p{width:360px}'
 +'.tool{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:64px}'
 +'.icobtn{width:40px;height:40px;background:#171310;border:1px solid #3b3122;'
 +'cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center}'
 +'.icobtn img{width:24px;height:24px;image-rendering:pixelated;display:block}'
 +'.icobtn.red{border-color:#7a3a34}'
 +'.icobtn:hover{border-color:#d9a13b}'
 +'.icobtn.onR{border-color:#c0453a;background:#241412}'
 +'.icobtn.onA{border-color:#d9a13b;background:#241c10}'
 +'.cbtn{width:100%;background:#171310;border:1px solid #3b3122;color:#cfc4a6;'
 +'font:10px monospace;padding:3px 4px;cursor:pointer;letter-spacing:.05em}'
 +'.cbtn:hover{border-color:#d9a13b;color:#d9a13b}'
 +'.cbtn.red{border-color:#7a3a34;color:#e07a70}'
 +'.cbtn.red:hover{border-color:#c0453a;color:#ff9088}'
 +'.cbtn[disabled]{opacity:.35;cursor:default}'
 +'.islot{user-select:none;touch-action:none}'
 +'.islot.dragSrc{opacity:.35}'
 +'.icobtn.dropOn{border-color:#d9a13b;background:#241c10;box-shadow:0 0 10px rgba(217,161,59,.75)}'
 +'#dragGhost{position:fixed;z-index:60;pointer-events:none;display:none;'
 +'background:rgba(20,17,13,.95);border:1px solid #d9a13b;padding:4px 8px;'
 +'font:10px monospace;color:#e7dcc3;align-items:center;gap:6px;box-shadow:0 4px 12px #000}'
 +'#dragGhost .ic{width:14px;height:14px;border:1px solid #000;flex-shrink:0}'
 +'.brow{display:flex;align-items:center;gap:10px;border:1px solid #262017;'
 +'background:#171310;padding:7px 10px;margin:6px 14px}'
 +'.brow .ic{width:32px;height:32px;border:1px solid #000;flex-shrink:0}'
 +'.brow .icimg{width:32px;height:32px;flex-shrink:0;image-rendering:pixelated}'
 +'.brow .inf{flex:1}.brow .nm{font:15px Staatliches,sans-serif;color:#e7dcc3}'
 +'.brow .ds{font:10px monospace;color:#8f8264;line-height:1.4}'
 +'.brow .mats{font:10px monospace;margin-top:2px}'
 +'.brow .mats b{font-weight:normal}.brow .mats b.ok{color:#7fa35b}'
 +'.brow .mats b.no{color:#c0453a}'
 +'.brow.lock{opacity:.45}'
 +'.bbtn{background:#241c10;border:1px solid #7a6a2c;color:#d9c26a;padding:4px 10px;'
 +'font:13px Staatliches,sans-serif;cursor:pointer;letter-spacing:.05em}'
 +'.bbtn:hover{border-color:#d9a13b;color:#d9a13b}'
 +'.bbtn[disabled]{opacity:.4;cursor:default}'
 +'.brow .lk{font:10px monospace;color:#c0453a;letter-spacing:.05em;text-align:right}'
 +'#craftPanel .f3p{width:400px}'
 +'.cath{font:11px Staatliches,sans-serif;color:#d9a13b;letter-spacing:.12em;'
 +'margin:10px 14px 2px;border-bottom:1px solid #262017;padding-bottom:2px}'
 +'#specSlots{display:flex;gap:8px;padding:10px 14px 0;align-items:stretch}'
 +'.sslot{width:64px;min-height:78px;background:#0e0c09;border:1px dashed #3b3122;cursor:pointer;position:relative}'
 +'.sslot:hover{border-color:#d9a13b}'
 +'.sslot .sic{position:absolute;top:8px;left:50%;transform:translateX(-50%);width:32px;height:32px;border:1px solid #000}'
 +'.sslot .sicimg{position:absolute;top:8px;left:50%;transform:translateX(-50%);width:32px;height:32px;image-rendering:pixelated}'
 +'.sslot .snm{position:absolute;top:44px;left:2px;right:2px;font:8px monospace;color:#d9a13b;text-align:center;line-height:1.15;overflow:hidden}'
 +'.sslot .sqty{position:absolute;bottom:3px;left:0;right:0;font:10px monospace;color:#e7dcc3;text-align:center}'
 +'.sslot .sdur{position:absolute;bottom:14px;left:8px;right:8px;height:4px;background:#262017}'
 +'.sslot .sdur i{display:block;height:100%;background:#5a8fd0}'
 +'.sslot .sempty{position:absolute;inset:0;display:grid;place-items:center;font:9px monospace;color:#5c5340;text-align:center;letter-spacing:.05em;line-height:1.4}'
 +'.autorow{display:flex;flex-direction:column;justify-content:center;gap:5px;margin-left:auto}'
 +'.abtn{background:#171310;border:1px solid #3b3122;color:#8f8264;font:9px monospace;padding:5px 8px;cursor:pointer;letter-spacing:.05em;white-space:nowrap}'
 +'.abtn:hover{border-color:#d9a13b;color:#d9a13b}'
 +'.abtn.on{border-color:#7fa35b;color:#7fa35b}'
 +'.sslot.dropOn{border-color:#7fa35b;background:#141a0d}'
 +'.sslot.dropBad{border-color:#c0453a;background:#1c0f0c}'
 +'#storePanel .f3p{width:360px}'
 +'#stGrid,#stInv{display:grid;grid-template-columns:repeat(4,56px);gap:5px;padding:8px 14px 4px}'
 +'.resIt{display:flex;align-items:center;gap:4px;font:11px monospace;color:#cfc4a6;'
 +'background:rgba(14,11,9,.75);border:1px solid #262017;padding:3px 7px;cursor:default}'
 +'.resIt .ic{width:16px;height:16px;border:1px solid #000;flex-shrink:0}'
 +'.icimg{image-rendering:pixelated;display:block}'
 +'#dragGhost .icimg{width:16px;height:16px;flex-shrink:0}'
 +':root{--line:#3b3122;--red:#c0453a;--amber:#d9a13b;--paper:#e7dcc3;--dim:#8f8264}'
 +'.squad-cards{position:fixed;left:12px;bottom:12px;display:flex;gap:12px;align-items:flex-end;z-index:10}'
 +'.character-card{display:flex;width:114px;background:#14110d;border:1px solid var(--line);'
 +'border-radius:3px;cursor:pointer;overflow:hidden;pointer-events:auto;'
 +'transition:width .22s cubic-bezier(.16,1,.3,1),border-color .2s,box-shadow .2s}'
 +'.character-card.selected{width:350px;border-color:#d9a13b88;box-shadow:0 0 16px #d9a13b26}'
 +'.portrait-box{min-width:112px;height:174px;position:relative;'
 +'background:radial-gradient(ellipse at 50% 30%,#5a4430aa,#0e0c09d9);'
 +'border-right:1px solid var(--line);overflow:hidden}'
 +'.portrait-box img:not(.skillIcon){position:absolute;left:-14px;top:0;width:140px;height:170px;image-rendering:pixelated}' // F10.2.2b FIX: exclude skillIcon
 +'.level-badge{position:absolute;left:12px;top:12px;border:1px solid #7a6a2c;background:#241c10;'
 +'border-radius:50%;width:26px;height:26px;font:14px Staatliches,sans-serif;color:#d9c26a;'
 +'display:grid;place-items:center;z-index:2}'
 +'.portrait-name{position:absolute;left:12px;top:44px;font:17px Staatliches,sans-serif;'
 +'letter-spacing:.1em;color:var(--paper);z-index:2;text-shadow:0 2px 4px #000}'
 +'.down-mark{display:none;position:absolute;inset:0;color:var(--red);'
 +'font:56px Staatliches,sans-serif;place-items:center;z-index:3;animation:pulse 1s infinite}'
 +'.character-card.down{filter:brightness(.65);border-color:var(--red)!important}'
 +'.character-card.down .down-mark{display:grid}'
 +'.character-card.critical{border-color:var(--amber);animation:critical 1s infinite}'
 +'.character-detail{padding:10px 12px;min-width:212px}'
 +'.character-title{margin-bottom:4px}'
 +'.character-title strong{font:19px Staatliches,sans-serif;letter-spacing:.1em;color:var(--paper)}'
 +'.character-title div>span{display:block;font:12px monospace;color:var(--dim)}'
 +'.st-list{display:none;flex-direction:column;align-items:flex-end;gap:1px;margin:0 0 3px}'
 +'.st-list span{font:bold 12px monospace;color:var(--red);text-shadow:0 1px 0 #000}'
 +'.bar-label{display:flex;justify-content:space-between;font:12px monospace;color:var(--dim);margin-top:4px}'
 +'.bar-label b{color:#cfc4a6;font-weight:normal}'
 +'.meter{height:9px;background:#0e0c09;border:1px solid #262017;margin:1px 0 2px}'
 +'.meter i{display:block;height:100%;width:100%;transition:width .15s}'
 +'.meter.hp i{background:#4fae4f}'
 +'.meter.energy i{background:#e6c34a}'
 +'.meter.xp i{background:#5a8fd0}'
 +'.card-foot{font:12px monospace;margin-top:8px}' // FIX(27): satu span — flex/space-between tak perlu
 +'#buff-diaz{color:var(--amber)}'
 +'@keyframes pulse{50%{opacity:.25}}'
 +'@keyframes critical{50%{border-color:#d9a13b22}}'
 +'.float.gainItem{color:#d9c26a;font-size:12px}'
 +'.float.skill{color:#d9a13b;font-size:15px}'
 +'.float.reload{color:#e6c34a;font-size:14px}'
 +'.bar.rp{background:transparent;border:none;margin-top:2px;padding:0}'
 +'.bar.rp i{display:none}'
 +'.bar.rp span{position:static;font-size:12px}'
 +'.blinkfast{animation:blinkFast .25s infinite}'
 +'@keyframes blinkFast{50%{opacity:.15}}'
 // F6.5: keyframes ikon progres — dipakai .cprLbl (ring per konstruksi)
 +'@keyframes progSpin{to{transform:rotate(360deg)}}'
 +'@keyframes progBlink{0%{opacity:1}50%{opacity:0}100%{opacity:1}}'
 // F6.5(3a): wipe progress kiri→kanan di kotak item crafting
 +'.brow{position:relative}'
 +'.cwipe{position:absolute;left:0;top:0;bottom:0;width:0;pointer-events:none;'
 +'background:rgba(217,161,59,.30)}'
 // F10.10.2: badge ★ Sobel-crafted armor — pojok kiri-atas slot
 +'.islot.sobel::before,.sslot.sobel::before{content:"★";position:absolute;'
 +'top:2px;left:3px;color:#d9a13b;font-size:11px;text-shadow:0 1px 2px #000;'
 +'z-index:2;pointer-events:none}'
 // F7(2): kartu RECOVERING §23.9 — gelap + teks + flicker putih lembut
 +'.character-card{position:relative}'
 +'.character-card.recovering{filter:brightness(.45);pointer-events:none}'
 +'.character-card.recovering::after{content:"RECOVERING";position:absolute;'
 +'inset:0;display:grid;place-items:center;font:15px Staatliches,sans-serif;'
 +'color:#fff;letter-spacing:.12em;z-index:5;'
 +'text-shadow:0 0 8px #fff,0 2px 2px #000;animation:recovFlick 1.8s infinite}'
 +'@keyframes recovFlick{50%{opacity:.4}}'
 // F7(3b): ikon ring progres per konstruksi (paralel)
 +'.cprLbl img{width:18px;height:18px;image-rendering:pixelated;display:block}'
 +'.cprLbl.spin img{animation:progSpin .5s linear infinite}'
 +'.cprLbl.blink img{animation:progBlink .5s steps(1,end) infinite}'
 // F7b(2): tanda revive — "+" merah bold, pulse 2 dtk (1 dtk fade in / 1 dtk fade out)
 +'.rvh{display:none;font:700 22px "Doppio One",sans-serif;color:#c0453a;'
 +'text-shadow:0 1px 2px #000;animation:rvPulse 2s linear infinite}'
 +'@keyframes rvPulse{0%{opacity:0}50%{opacity:1}100%{opacity:0}}'
 // F7c: DEPLOY MENU §23.2/§23.3 + info bar §23.6
 +'.squad-cards{bottom:28px}' // geser naik — beri ruang info bar
 +'#squadInfo{position:fixed;left:12px;bottom:9px;z-index:10;display:flex;gap:12px;'
 +'font:11px "Doppio One",sans-serif;color:#cfc4a6;text-shadow:0 1px 2px #000;'
 +'pointer-events:none}'
 +'#squadInfo b{color:#d9a13b;font-weight:400}'
 +'#squadInfo .dep b{color:#7fb3e8}'
 +'.character-card.resv{filter:brightness(.5)}'
 +'.depInfo{display:flex;gap:14px;align-items:center;padding:8px 14px;'
 +'border-bottom:1px solid #262017;font:11px monospace;color:#8f8264}'
 +'.depInfo b{color:#d9a13b;font-weight:400}'
 +'.depInfo .okn{color:#7fa35b}'
 +'.depInfo .non{color:#c0453a}'
 +'#deployPanel .f3p{width:620px;display:flex;flex-direction:column;overflow:hidden}' // FIX(21f): header & footer TETAP — hanya daftar yang scroll
 +'#deployBody{overflow-y:auto;min-height:0}'
 // FIX(21f): kartu deploy 2-kolom ringkas — bar stat DIHAPUS (tak konsisten utk stat >100)
 +'.dgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px 12px}'
 // FIX(21h): kartu = KOLOM (foto | info) · info = kolom flex · footer menempel
 // KANAN-BAWAH mutlak — tak terdorong panjang teks skill/pasif
 +'.dcard2{display:flex;gap:8px;border:1px solid #262017;background:#171310;padding:6px}'
 +'.dcard2.resv{opacity:.65}'
 +'.dcard2.rec{opacity:.5}'
 +'.dcard2 .dport{width:60px;flex-shrink:0;position:relative}'
 +'.dcard2 .dport img:not(.skillIcon){width:60px;height:73px;image-rendering:pixelated;display:block;'
 +'border:1px solid #262017}' // F10.2.2b FIX: exclude skillIcon
 +'.dcard2 .dinf2{flex:1;min-width:0;display:flex;flex-direction:column}'
 +'.dnm2{font:15px Staatliches,sans-serif;color:#e7dcc3;letter-spacing:.06em}'
 +'.dnm2 span{font:9px monospace;color:#d9a13b;margin-left:5px}'
 +'.dwea2{font:9px monospace;color:#7fb3e8;margin:2px 0}'
 +'.dst2{font:9px monospace;color:#cfc4a6;margin:2px 0}'
 +'.dsk2,.dps2{font:9px monospace;color:#8f8264;line-height:1.35;margin:1px 0 0}'
 +'.dsk2 b,.dps2 b{color:#d9a13b;font-weight:400}'
 +'.dps2 .pl{color:#d9a13b;font-weight:700;letter-spacing:.05em}' // FIX(21i): label PASSIVE kuning — pemisah visual dari SKILL
 +'.dfoot2{display:flex;align-items:center;gap:8px;margin-top:auto;padding-top:6px}' // FIX(21h): dorong ke dasar kartu
 +'.dfoot2 .rc{font:10px monospace;color:#d9a13b}'
 +'.dfoot2 .dc{font:10px monospace;color:#7fb3e8}'
 +'.dfoot2 .dbtn{margin-left:auto;font:11px Staatliches,sans-serif;padding:3px 10px}'
 +'.dcol{width:130px;flex-shrink:0;display:flex;flex-direction:column;gap:8px;'
 +'align-items:stretch;justify-content:center}'
 +'.dcost{display:flex;flex-direction:column;gap:2px;font:10px monospace}'
 +'.dcost .rc{color:#d9a13b}'
 +'.dcost .dc{color:#7fb3e8}'
 +'.dbtn{background:#241c10;border:1px solid #7a6a2c;color:#d9c26a;padding:6px 10px;'
 +'font:14px Staatliches,sans-serif;cursor:pointer;letter-spacing:.05em}'
 +'.dbtn.red{border-color:#7a3a34;color:#e07a70}'
 +'.dbtn[disabled]{opacity:.4;cursor:default}'
  // F7d: panel sharing — grid 12 slot (pola stInv)
 +'.shGrid{display:grid;grid-template-columns:repeat(4,56px);gap:5px;padding:8px 14px 4px}'
  // F8a(2): kartu terkunci + padlock §23.2 + layar unlock §17
 +'.dport{position:relative}'
 // FIX(43): potret terkunci = silhouette putih-abu bersih · kartu lebih gelap
 +'.dcard2.lock .dport img:not(.skillIcon){filter:grayscale(1) brightness(1.35) contrast(.85);opacity:.85}' // F10.2.2b FIX: skillIcon tetap berwarna
 +'.dcard2.lock{background:#0d0b09;border-color:#1e1a12}'
 +'.dcard2.lock .dnm2 span{opacity:.7}'
 +'.dcard2.lock .dsk2, .dcard2.lock .dps2, .dcard2.lock .dst2, .dcard2.lock .dwea2{opacity:.55}'
 +'.plkWrap{position:absolute;inset:0;display:grid;place-items:center;z-index:2}'
 +'.plk{position:relative;width:20px;height:15px;filter:drop-shadow(0 2px 2px #000)}'
 +'.plk::before{content:"";position:absolute;left:4px;top:-9px;width:12px;height:12px;'
 +'border:3px solid #8f8264;border-bottom:none;border-radius:8px 8px 0 0}'
 +'.plk::after{content:"";position:absolute;left:0;top:2px;width:20px;height:13px;'
 +'background:#8f8264;border-radius:2px}'
 +'.unlockCard{animation:unlockIn .5s cubic-bezier(.16,1,.3,1)}'
 +'@keyframes unlockIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}'
 // F8b: overlay QTE §16.1 + label HELP! §16
 +'.qteCard{background:#14110d;border:1px solid #7a6a2c;box-shadow:0 10px 40px #000;'
 +'padding:22px 34px;text-align:center;min-width:340px}'
 +'.qteCard h2{font:24px Staatliches,sans-serif;color:#d9a13b;letter-spacing:.12em}'
 +'.qteRow{display:flex;gap:10px;justify-content:center;margin:16px 0 10px}'
 +'.qa{width:52px;height:52px;display:grid;place-items:center;font:28px monospace;'
 +'color:#5c5340;background:#0e0c09;border:1px solid #262017}'
 +'.qa.cur{color:#ffd24a;border-color:#d9a13b;background:#241c10;'
 +'box-shadow:0 0 12px rgba(217,161,59,.55);animation:qtePulse .5s infinite}'
 +'.qa.done{color:#7fa35b;border-color:#4a6a2c}'
 +'@keyframes qtePulse{50%{box-shadow:0 0 3px rgba(217,161,59,.15)}}'
 +'.qteTimer{height:10px;background:#0e0c09;border:1px solid #262017;margin:4px 0}'
 +'.qteTimer i{display:block;height:100%;width:100%;background:#d9a13b}'
 +'.qteMeta{display:flex;justify-content:space-between;font:11px monospace;color:#8f8264}'
 +'.qteHint{font:10px monospace;color:#5c5340;margin-top:10px}'
 +'#helpLbl{animation:helpBlink .8s infinite}'
 +'@keyframes helpBlink{50%{opacity:.25}}'
 // FIX(5): over-cap deploy §16.3 — indikator merah berkedip
 +'#squadInfo .dep b.overCap{color:#c0453a;animation:pulse 1s infinite}'
 +'.depInfo span.non b{color:#c0453a;animation:pulse 1s infinite}'
  // FIX(21g): badge ammo kartu squad — kanan-atas potret, sebelah level
 +'.ammo-badge{position:absolute;top:12px;right:8px;z-index:2;'
 +'font:10px "Doppio One",sans-serif;color:#e7dcc3;background:rgba(14,11,9,.85);'
 +'border:1px solid #3b3122;padding:0 4px;text-shadow:0 1px 0 #000}'
 // F9b.5: SQUAD CHAT — bubble laporan karakter, rata kiri, stack max 3
 +'#squadChat{position:fixed;left:12px;bottom:230px;z-index:27;pointer-events:none;' // notification-fix: naik dari 12 → 27 (atas panels 25/26)
 +'display:flex;flex-direction:column;justify-content:flex-end;gap:6px;'
 +'height:190px;overflow:visible}' // kolom tumbuh ke ATAS — bottom fixed aman di atas kartu
 +'.chatB{max-width:280px;background:rgba(14,11,9,.92);border:1px solid #3b3122;'
 +'border-left:3px solid #8f8264;padding:5px 10px 6px;position:relative;'
 +'transform:translateX(-16px);opacity:0;transition:transform .25s,opacity .25s}'
 +'.chatB.show{transform:translateX(0);opacity:1}'
 +'.chatB .ch{font:10px "Doppio One",sans-serif;letter-spacing:.08em;color:#8f8264}'
 +'.chatB .ch b{font-weight:400}'
 +'.chatB .msg{font:11px monospace;color:#cfc4a6;margin-top:2px;line-height:1.35}'
 +'.chatB.alert{border-left-color:#c0453a}'
 +'.chatB.alert .ch b{color:#e07a70}'
 +'.chatB.notice{border-left-color:#7fa35b}'
 +'.chatB.notice .ch b{color:#9ad970}'
 +'.chatB::after{content:"";position:absolute;left:-3px;bottom:-7px;' // tail bubble
 +'width:10px;height:10px;background:rgba(14,11,9,.92);border-left:1px solid #3b3122;'
 +'border-bottom:1px solid #3b3122;transform:rotate(45deg)}'
 +'.chatB.fade{opacity:0;transform:translateX(-8px);transition:opacity .4s,transform .4s}'
 // ===== F10.1: CHARACTER PANEL (K/J/L) =====
 +'.charTabs{display:flex;padding:0 14px;border-bottom:1px solid #262017;background:#14110d}'
 +'.charTab{background:none;border:none;border-bottom:2px solid transparent;color:#5c5340;'
 +'font:11px Staatliches,sans-serif;letter-spacing:.1em;padding:8px 14px;cursor:pointer}'
 +'.charTab:hover{color:#8f8264}'
 +'.charTab.on{color:#d9a13b;border-bottom-color:#d9a13b}'
 +'.charTab.lock{opacity:.35;cursor:default}'
 +'.charBody{padding:12px 16px;min-height:260px}'
 +'.spHead{display:flex;justify-content:space-between;align-items:baseline;'
 +'padding:0 0 10px;border-bottom:1px solid #262017;margin-bottom:12px;'
 +'font:10px monospace;color:#8f8264;letter-spacing:.1em}'
 +'.spHead b{color:#d9a13b;font:22px Staatliches,sans-serif;letter-spacing:.05em;margin-left:6px}'
 +'.spHead .avail b{color:#e6c34a}'
 +'.statRow{display:flex;align-items:center;gap:10px;padding:7px 0}'
 +'.statName{width:46px;font:13px Staatliches,sans-serif;color:#e7dcc3;letter-spacing:.1em}'
 +'.statBar{flex:1;height:8px;background:#0e0c09;border:1px solid #262017;position:relative}'
 +'.statBar i{display:block;height:100%;background:#d9a13b;transition:width .18s}'
 +'.statBar.max i{background:#7fa35b}'
 +'.statVal{min-width:96px;text-align:right;font:11px monospace;color:#cfc4a6}'
 +'.statVal .alloc{color:#d9a13b;margin-left:4px}'
 +'.statVal .alloc.max{color:#7fa35b}'
 +'.statBtn{width:26px;height:26px;background:#241c10;border:1px solid #7a6a2c;color:#d9c26a;'
 +'font:15px monospace;cursor:pointer;line-height:1;padding:0}'
 +'.statBtn:hover:not([disabled]){border-color:#d9a13b;color:#d9a13b}'
 +'.statBtn[disabled]{opacity:.28;cursor:default}'
 +'.charPlaceholder{padding:40px 20px;text-align:center;font:11px monospace;color:#5c5340;line-height:2}'
 +'.charPlaceholder h3{font:22px Staatliches,sans-serif;color:#d9a13b;letter-spacing:.15em;margin:0 0 10px}'
 // ===== F10.2.2: UPGRADE TREE UI =====
 +'.treeWrap{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:4px 0}'
 +'.treeCol{display:flex;flex-direction:column;gap:5px}'
 +'.treeColHdr{font:11px Staatliches,sans-serif;letter-spacing:.12em;text-align:center;'
 +'padding:4px 2px;border-bottom:2px solid #262017;margin-bottom:3px}'
 +'.tnode{background:#0e0c09;border:1px solid #262017;padding:6px 5px;position:relative;'
 +'cursor:default;transition:border-color .15s,background .15s,box-shadow .15s;'
 +'text-align:center;min-height:58px;display:flex;flex-direction:column;justify-content:center;gap:2px}'
 +'.tnode .tnTier{font:8px monospace;color:#5c5340;letter-spacing:.1em}'
 +'.tnode .tnName{font:10px Staatliches,sans-serif;color:#8f8264;letter-spacing:.04em;line-height:1.15}'
 +'.tnode .tnCost{font:9px monospace;color:#8f8264;margin-top:2px}'
 +'.tnode.unlocked{border-color:#4a6a2c;background:#0d1209}'
 +'.tnode.unlocked .tnName{color:#9ad970}'
 +'.tnode.unlocked .tnCost{color:#7fa35b}'
 +'.tnode.unlocked::before{content:"✓";position:absolute;top:3px;right:5px;color:#7fa35b;font:11px monospace}'
 +'.tnode.next{cursor:pointer;border-color:#7a6a2c;background:#1a1409;animation:treeNextPulse 1.6s infinite}'
 +'.tnode.next:hover{border-color:#d9a13b;background:#241c10;animation:none;'
 +'box-shadow:0 0 12px rgba(217,161,59,.45)}'
 +'.tnode.next .tnName{color:#d9a13b}'
 +'.tnode.next .tnCost{color:#d9a13b}'
 +'.tnode.next.noAfford{border-color:#7a3a34;background:#1c0f0c;animation:none}'
 +'.tnode.next.noAfford .tnName,.tnode.next.noAfford .tnCost{color:#e07a70}'
 +'.tnode.locked{opacity:.30}'
 +'@keyframes treeNextPulse{50%{border-color:#d9a13b}}'
 // ===== F10.2.2b: SKILL ICON + HOVER TOOLTIP =====
 +'.skillIcon{position:absolute;width:24px;height:24px;image-rendering:pixelated;'
 +'cursor:help;z-index:3;pointer-events:auto;transition:transform .12s;'
 +'filter:drop-shadow(1px 0 0 #d9a13b) drop-shadow(-1px 0 0 #d9a13b)'
 +' drop-shadow(0 1px 0 #d9a13b) drop-shadow(0 -1px 0 #d9a13b)}'
 +'.skillIcon:hover{transform:scale(1.18)}'
 +'.portrait-box .skillIcon{right:8px;bottom:8px}'
 +'.dcard2 .dport .skillIcon{width:20px;height:20px;right:3px;bottom:3px}'
 +'.skillIcon.hdr{position:static;width:22px;height:22px;margin:0}'
 // F10.2.2c: fill durasi skill — overlay putih transparan di atas ikon skill
 // squad card. scaleY dari bottom → saat durasi menurun, area putih "turun"
 // dari atas (menghilang dari atas, sisa di bawah). z-index:4 → di atas ikon
 // (icon z-index:3). pointer-events:none → hover ikon di bawah tetap kena.
 +'.skillFill{position:absolute;right:8px;bottom:8px;width:24px;height:24px;'
 +'background:rgba(255,255,255,.55);pointer-events:none;z-index:4;'
 +'transform-origin:bottom;transform:scaleY(0);display:none;'
 +'image-rendering:pixelated;border-radius:2px}'
 +'.skillFill.on{display:block}'
 +'#unlockPortrait{position:relative;margin:14px auto;width:112px;height:136px;'
 +'border:1px solid #3b3122;overflow:hidden;'
 +'background:radial-gradient(ellipse at 50% 30%,#5a4430aa,#0e0c09d9)}'
 +'#unlockPortrait .skillIcon{right:6px;bottom:6px}'
 +'#skillTip{position:fixed;z-index:70;display:none;pointer-events:none;'
 +'max-width:320px;background:rgba(14,11,9,.98);border:1px solid #d9a13b;'
 +'padding:9px 11px;font:11px monospace;color:#cfc4a6;line-height:1.45;'
 +'box-shadow:0 8px 22px #000,0 0 12px rgba(217,161,59,.15)}'
 +'#skillTip.show{display:block}'
 +'#skillTip h4{margin:0 0 4px;font:15px Staatliches,sans-serif;color:#d9a13b;'
 +'letter-spacing:.1em}'
 +'#skillTip .sdesc{color:#e7dcc3;margin-bottom:6px}'
 +'#skillTip .psep{border-top:1px solid #3b3122;margin:6px 0 5px}'
 +'#skillTip h5{margin:0 0 3px;font:12px Staatliches,sans-serif;color:#7fb3e8;'
 +'letter-spacing:.08em}'
 +'#skillTip .pdesc{color:#cfc4a6}'
 // ===== F10.2-UI: GLOBAL UPSCALE (font & panel ~1.25-1.3×) =====
 // Squad card (bawah-kiri) TIDAK diubah. Semua panel/menu/dialog/dialog konfirmasi besar.
 // Pakai !important untuk override inline style (mis. .f3p width:520px pada #charPanel).
 +'.f3p{min-width:440px;max-width:760px}'
 +'.f3h{padding:10px 18px}'
 +'.f3h h2{font:26px Staatliches,sans-serif}'
 +'.f3x{width:32px;height:32px;font:16px monospace}'
 +'.f3f{padding:0 18px 12px;font:12px monospace}'
 +'#invPanel .f3p{width:460px}'
 +'#deployPanel .f3p{width:840px}'
 +'#craftPanel .f3p{width:520px}'
 +'#storePanel .f3p{width:460px}'
 +'#charPanel .f3p{width:720px !important}'
 +'#sharePanel .f3p{width:540px !important}'
 +'#unlockPanel .f3p{width:520px !important}'
 +'#treeConfirm .f3p{width:520px !important}'
 +'#restartConfirm .f3p{width:520px !important}'
 +'#contPanel .f3p{width:460px !important}'
 // Inventory + special slots
 +'#invGrid{grid-template-columns:repeat(4,68px);gap:6px;padding:14px 18px}'
 +'.islot{width:68px;height:92px}'
 +'.islot .ic,.islot .icimg{width:40px;height:40px;top:8px}'
 +'.islot .nm{font:10px monospace;top:52px;left:3px;right:3px}'
 +'.islot .qty{font:12px monospace;bottom:4px}'
 +'#specSlots{padding:12px 18px 0;gap:10px}'
 +'.sslot{width:78px;min-height:96px}'
 +'.sslot .sic,.sslot .sicimg{width:40px;height:40px;top:10px}'
 +'.sslot .snm{font:10px monospace;top:56px}'
 +'.sslot .sqty{font:12px monospace}'
 +'.abtn{padding:7px 10px;font:11px monospace}'
 +'.cbtn{padding:5px 6px;font:12px monospace}'
 // Build/Craft rows
 +'.brow{padding:10px 14px;margin:8px 18px;gap:14px}'
 +'.brow .ic,.brow .icimg{width:40px;height:40px}'
 +'.brow .nm{font:18px Staatliches,sans-serif}'
 +'.brow .ds,.brow .mats,.brow .lk{font:12px monospace}'
 +'.brow .mats{margin-top:4px}'
 +'.bbtn{padding:6px 16px;font:16px Staatliches,sans-serif}'
 +'.cath{font:14px Staatliches,sans-serif;margin:12px 18px 4px;padding-bottom:4px}'
 // Deploy menu cards
 +'.dgrid{gap:10px;padding:12px 16px}'
 +'.dcard2{padding:8px;gap:10px}'
 +'.dcard2 .dport{width:76px}'
 +'.dcard2 .dport img:not(.skillIcon){width:76px;height:92px}'
 +'.dcard2 .dport .skillIcon{width:26px;height:26px;right:4px;bottom:4px}'
 +'.dnm2{font:18px Staatliches,sans-serif}'
 +'.dnm2 span{font:11px monospace}'
 +'.dwea2,.dst2{font:11px monospace;margin:3px 0}'
 +'.dsk2,.dps2{font:11px monospace;line-height:1.45}'
 +'.dfoot2{gap:10px;padding-top:8px}'
 +'.dfoot2 .rc,.dfoot2 .dc{font:12px monospace}'
 +'.dfoot2 .dbtn{font:13px Staatliches,sans-serif;padding:5px 12px}'
 +'.dbtn{padding:8px 14px;font:16px Staatliches,sans-serif}'
 +'.depInfo{padding:12px 18px;font:13px monospace;gap:20px}'
 // Toasts
 +'.toast{padding:8px 18px;font-size:14px;max-width:640px}'
 // Character panel
 +'.charTabs{padding:0 18px}'
 +'.charTab{font:13px Staatliches,sans-serif;padding:10px 18px}'
 +'.charBody{padding:16px 20px;min-height:320px}'
 +'.charPlaceholder{font:13px monospace;padding:48px 24px}'
 +'.charPlaceholder h3{font:28px Staatliches,sans-serif}'
 +'.spHead{font:12px monospace;padding:0 0 12px;margin-bottom:16px}'
 +'.spHead b{font:28px Staatliches,sans-serif}'
 +'.statRow{padding:10px 0;gap:12px}'
 +'.statName{font:16px Staatliches,sans-serif;width:56px}'
 +'.statBar{height:10px}'
 +'.statVal{font:14px monospace;min-width:120px}'
 +'.statVal .alloc{font-size:13px}'
 +'.statBtn{width:34px;height:34px;font:18px monospace}'
 // F10.3-fix: unlock screen stat rows — sebelumnya .dst/.dbar tanpa CSS sama sekali
 // → span/dbar/b render sebagai block dan bertumpuk vertikal (teks "berantakan").
 // Layout: flex row [label 56px] [bar flex] [value 60px right-aligned].
 +'.dst{display:flex;align-items:center;gap:10px;margin:6px 0}'
 +'.dst span{width:56px;font:14px Staatliches,sans-serif;color:#8f8264;letter-spacing:.08em}'
 +'.dbar{flex:1;height:10px;background:#0e0c09;border:1px solid #262017}'
 +'.dbar i{display:block;height:100%;background:#d9a13b}'
 +'.dst b{width:60px;text-align:right;font:14px monospace;color:#e7dcc3;font-weight:bold}'
 // Upgrade tree — dengan deskripsi inline
 // F10.2-UI.2: grid 2D — header di row 1, tier 1-4 di row 2-5. Semua node
 // sebaris otomatis punya tinggi yang sama (grid align). Kolom align sempurna.
 +'.treeWrap{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}'
 +'.treeColHdr{font:14px Staatliches,sans-serif;padding:6px 4px;margin-bottom:5px}'
 +'.tnode{padding:9px 8px;gap:2px;min-height:auto}'
 +'.tnode .tnTier{font:10px monospace}'
 +'.tnode .tnName{font:13px Staatliches,sans-serif;line-height:1.2}'
 +'.tnode .tnDesc{font:10px monospace;color:#8f8264;line-height:1.35;margin-top:4px;padding:0 2px;font-weight:400}'
 +'.tnode .tnCost{font:11px monospace;margin-top:5px}'
 +'.tnode.unlocked .tnDesc{color:#7fa35b}'
 +'.tnode.next .tnDesc{color:#b8944e}'
 +'.tnode.next.noAfford .tnDesc{color:#a06a64}'
 // Unlock screen
 +'#unlockPortrait{width:140px;height:170px}'
 +'#unlockPortrait img:not(.skillIcon){width:140px !important;height:170px !important}'
 +'#unlockPortrait .skillIcon{width:28px;height:28px;right:8px;bottom:8px}'
 // Skill icon di header stats panel
 +'.skillIcon.hdr{width:28px;height:28px}'
 // ===== F10.3: SESSION STATS (§23.10) =====
 +'#sessionStats{position:fixed;inset:0;z-index:34;display:none;'
 +'align-items:center;justify-content:center;background:rgba(5,4,3,.85);pointer-events:auto}'
 +'.sessionCard{width:760px;max-width:92vw;max-height:90vh;overflow-y:auto;'
 +'background:#14110d;border:1px solid #7a6a2c;box-shadow:0 12px 48px #000;padding:24px 30px}'
 +'.stTitle{font:34px Staatliches,sans-serif;color:#d9a13b;letter-spacing:.14em;'
 +'text-align:center;text-shadow:0 2px 0 #000}'
 +'.stSub{font:12px monospace;color:#8f8264;letter-spacing:.15em;text-align:center;margin-top:6px}'
 +'.stDivider{height:2px;margin:18px 0;background:repeating-linear-gradient(45deg,'
 +'#7a6a2c 0 8px,#14100c 8px 16px)}'
 +'.stGrid{display:grid;grid-template-columns:1fr 1fr;gap:0 32px}'
 +'.stRow{display:flex;justify-content:space-between;align-items:baseline;'
 +'padding:7px 0;border-bottom:1px solid #262017}'
 +'.stRow .lbl{font:12px monospace;color:#8f8264;letter-spacing:.04em}'
 +'.stRow .val{font:14px monospace;color:#e7dcc3;font-weight:bold}'
 +'.stRow.hi .val{color:#d9a13b}'
 +'.mvpRow{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px}'
 +'.mvpCard{padding:14px 10px;border:1px solid #7a6a2c;background:#1a1409;text-align:center}'
 +'.mvpTag{font:10px monospace;color:#d9a13b;letter-spacing:.12em}'
 +'.mvpName{font:22px Staatliches,sans-serif;color:#e7dcc3;letter-spacing:.08em;margin:6px 0 4px}'
 +'.mvpVal{font:13px monospace;color:#7fa35b;font-weight:bold}'
 +'.mvpEmpty{font:12px monospace;color:#5c5340;padding:20px 0}'
 +'.stBtnRow{display:flex;justify-content:center;gap:14px;margin-top:24px;flex-wrap:wrap}'
 // F12.7: tombol BACK TO MAIN MENU — merah, pola sama dengan Try Again
 +'#btnBackToMenu{min-width:260px;padding:12px 24px;font:20px Staatliches,sans-serif;'
 +'background:#2a1414;border:1px solid #7a3a34;color:#e07a70;cursor:pointer;letter-spacing:.1em}'
 +'#btnBackToMenu:hover{border-color:#c0453a;color:#ff9088}'
 +'#btnTryAgain{min-width:260px;padding:12px 24px;font:20px Staatliches,sans-serif;'
 +'background:#241c10;border:1px solid #7a6a2c;color:#d9c26a;cursor:pointer;letter-spacing:.1em}'
 +'#btnTryAgain:hover{border-color:#d9a13b;color:#d9a13b}'
 // End the Night button — kanan-atas, di bawah skipBtn
 +'#endNightBtn{position:fixed;top:176px;right:14px;z-index:12;'
 +'background:#2a1414;border:1px solid #7a3a34;color:#e07a70;'
 +'padding:5px 12px;font:12px Staatliches,sans-serif;letter-spacing:.06em;'
 +'cursor:pointer;pointer-events:auto;display:none}'
 +'#endNightBtn:hover{border-color:#c0453a;color:#ff9088;background:#361818}'
 // F12.2: OPTIONS audio slider rows
 +'.optRow{display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid #262017}'
 +'.optRow:last-child{border-bottom:none}'
 +'.optRow label{width:56px;font:15px Staatliches,sans-serif;color:#d9a13b;letter-spacing:.14em}'
 +'.optRow input[type=range]{flex:1;accent-color:#d9a13b;height:6px;cursor:pointer}'
 +'.optRow .val{width:56px;text-align:right;font:13px monospace;color:#e7dcc3}'
 // F12.4: MAIN MENU overlay (§23.1) — tombol bottom-left, gradient vignette
 // F12.8b: LAYER STACK (semua child #menuOverlay, urut dari belakang):
 //   #menuBg        z:0  — foto Ken Burns (scale 100↔110%)
 //   #menuVignette  z:1  — gradient gelap kiri (readability tombol)
 //   #menuFlicker   z:1  — overlay kedip
 //   #menuSmoke     z:1  — puff asap dari area mobil
 //   .menuTitle/.menuSub/.menuBtns  z:2  — konten (dipromosikan ke layer atas
 //     supaya tidak tertutup foto: static content default paint di bawah
 //     positioned element; .menuZ sudah lolos karena transform bikin stacking
 //     context — sisanya naikkan manual via z-index)
 //   .menuFoot      z:2
 +'#menuOverlay{position:fixed;inset:0;z-index:40;display:none;flex-direction:column;'
 +'justify-content:flex-end;padding:40px 48px;pointer-events:none;overflow:hidden}'
 +'#menuBg{position:absolute;inset:0;z-index:0;'
 +'background:url(\'mainmenu.jpg\') center/cover no-repeat;'
 +'animation:menuKenBurns 18s ease-in-out infinite;'
 +'transform-origin:50% 50%;will-change:transform}'
 +'#menuVignette{position:absolute;inset:0;z-index:1;pointer-events:none;'
 +'background:linear-gradient(to right,rgba(0,0,0,.72) 0%,rgba(0,0,0,.30) 45%,transparent 75%)}'
 +'@keyframes menuKenBurns{'
 +'0%{transform:scale(1)}'
 +'50%{transform:scale(1.10)}'
 +'100%{transform:scale(1)}}'
 // F12.4e: flicker overlay — hitam transparan, animate opacity berdenyut
 // sporadis. Terpisah dari menuOverlay supaya tombol & title tidak ikut bergetar.
 +'#menuFlicker{position:absolute;inset:0;z-index:1;pointer-events:none;'
 +'animation:menuFlicker 6.5s infinite}'
 +'@keyframes menuFlicker{'
 +'0%,100%{background:transparent}'
 +'14%{background:rgba(0,0,0,.08)}15%{background:transparent}'
 +'42%{background:rgba(0,0,0,.05)}43%{background:transparent}'
 +'71%{background:rgba(0,0,0,.10)}72%{background:transparent}'
 +'88%{background:rgba(0,0,0,.06)}89%{background:transparent}}'
 // F12.4e: smoke — 6 puff radial gradient naik dari area mobil (kanan-bawah
 // foto). Masing-masing punya delay & durasi beda → stacking organic.
 +'#menuSmoke{position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden}'
 +'#menuSmoke span{position:absolute;border-radius:50%;'
 +'background:radial-gradient(ellipse at center,'
 +'rgba(220,220,220,.22) 0%,rgba(180,180,180,.08) 45%,transparent 75%);'
 +'filter:blur(28px);opacity:0;animation:smokeRise linear infinite}'
 +'#menuSmoke span:nth-child(1){width:180px;height:130px;left:66%;bottom:18%;animation-duration:11s;animation-delay:0s}'
 +'#menuSmoke span:nth-child(2){width:240px;height:170px;left:70%;bottom:14%;animation-duration:14s;animation-delay:2s}'
 +'#menuSmoke span:nth-child(3){width:200px;height:150px;left:74%;bottom:20%;animation-duration:13s;animation-delay:4.5s}'
 +'#menuSmoke span:nth-child(4){width:160px;height:120px;left:62%;bottom:22%;animation-duration:12s;animation-delay:1.5s}'
 +'#menuSmoke span:nth-child(5){width:220px;height:160px;left:78%;bottom:16%;animation-duration:15s;animation-delay:3.5s}'
 +'#menuSmoke span:nth-child(6){width:190px;height:140px;left:69%;bottom:12%;animation-duration:13.5s;animation-delay:6s}'
 +'@keyframes smokeRise{'
 +'0%{transform:translate(0,0) scale(.85);opacity:0}'
 +'15%{opacity:.55}70%{opacity:.35}'
 +'100%{transform:translate(-30px,-320px) scale(1.6);opacity:0}}'
 // F12.4e: title putih, Z merah rotate 25° clockwise + size +4
 +'.menuTitle{position:relative;z-index:2;font:72px Staatliches,sans-serif;color:#ffffff;letter-spacing:.14em;'
 +'text-shadow:0 3px 0 #000,0 0 24px rgba(255,255,255,.25);margin-bottom:6px;pointer-events:none}'
 +'.menuZ{color:#c02a1a;display:inline-block;transform:rotate(25deg);font-size:76px;'
 +'margin-left:4px;vertical-align:-4px;'
 +'text-shadow:0 3px 0 #000,0 0 20px rgba(192,42,26,.6)}'
 +'.menuSub{position:relative;z-index:2;font:13px monospace;color:#8f8264;letter-spacing:.42em;margin-bottom:38px}'
 +'.menuBtns{position:relative;z-index:2;display:flex;flex-direction:column;gap:10px;align-items:flex-start;pointer-events:auto}'
 +'.menuBtn{min-width:260px;text-align:left;padding:14px 22px;'
 +'font:20px Staatliches,sans-serif;letter-spacing:.16em;'
 +'background:rgba(20,17,13,.85);border:1px solid #3b3122;color:#e7dcc3;'
 +'cursor:pointer;transition:all .15s}'
 +'.menuBtn:hover{border-color:#d9a13b;color:#d9a13b;background:rgba(36,28,16,.95);'
 +'transform:translateX(6px)}'
 +'.menuBtn.primary{color:#d9a13b;border-color:#7a6a2c}'
 +'.menuBtn.primary:hover{background:#241c10;border-color:#d9a13b;color:#f0c868}'
 // F12.7: tombol menu disabled — abu-abu gelap, tidak reaktif hover
 +'.menuBtn[disabled]{opacity:.32;cursor:not-allowed;color:#5c5340;'
 +'border-color:#2a2418;background:rgba(14,11,9,.6)}'
 +'.menuBtn[disabled]:hover{transform:none;border-color:#2a2418;color:#5c5340;'
 +'background:rgba(14,11,9,.6)}'
 +'.menuFoot{position:absolute;bottom:18px;right:24px;z-index:2;font:10px monospace;color:#5c5340}'
 // ===== F12.11: JOMBIPEDIA (in-game bestiary + roster reference) =====
 // Overlay transparan di atas canvas 3D yang di-render saat S.state==='jombipedia'.
 // Semua child pakai pointer-events:auto agar klik berfungsi.
 // F12.11-DEBUG: background diubah jadi MERAH SOLID + border kuning tebal
 // sementara, untuk memastikan panel benar-benar terbuka. Revert nanti setelah
 // BATCH 2/3 selesai dan panel punya konten visual.
 // F12.11-B2: panel + semua anak punya pointer-events:auto — jamin klik di
 // tab & roster item selalu sampai ke handler, apapun inline-style yang
 // dipasang ensure() saat membuat panel.
 +'#jombPanel{position:fixed;inset:0;z-index:43;display:none;pointer-events:auto;'
 +'background:transparent}'
 +'#jombPanel *{pointer-events:auto}' // tab & roster & tombol — semua klikable
 +'#jombHeader{position:absolute;top:20px;left:26px;z-index:5;pointer-events:none}'
 +'#jombHeader h1{font:32px Staatliches,sans-serif;color:#d9a13b;letter-spacing:.12em;'
 +'text-shadow:0 2px 10px #000}'
 +'#jombHeader p{font:11px monospace;color:#8f8264;margin-top:2px;letter-spacing:.2em}'
 +'#jombTabs{position:absolute;top:22px;left:50%;transform:translateX(-50%);z-index:5;'
 +'display:flex;gap:6px;background:rgba(14,11,9,.94);border:1px solid #3b3122;padding:4px;'
 +'pointer-events:auto}' // F12.11b: tab inherit pointer-events:none dari #jombPanel → cursor:pointer tapi klik tak sampai. Eksplisit auto.
 +'.jombTab{background:none;border:none;color:#8f8264;font:14px Staatliches,sans-serif;'
 +'letter-spacing:.14em;padding:7px 22px;cursor:pointer;transition:all .15s}'
 +'.jombTab:hover{color:#cfc4a6}'
 +'.jombTab.on{color:#d9a13b;background:rgba(36,28,16,.95);box-shadow:inset 0 -2px 0 #d9a13b}'
 +'#jombRoster{position:absolute;top:96px;left:26px;z-index:5;pointer-events:auto;'
 +'display:flex;flex-direction:column;gap:5px;max-height:calc(100vh - 200px);'
 +'overflow-y:auto;padding-right:8px;min-width:220px}'
 +'.jombItem{background:rgba(20,17,13,.92);border:1px solid #3b3122;color:#cfc4a6;'
 +'font:15px Staatliches,sans-serif;letter-spacing:.06em;padding:8px 14px;cursor:pointer;'
 +'display:flex;justify-content:space-between;align-items:center;gap:14px;transition:all .15s}'
 +'.jombItem:hover{border-color:#d9a13b;color:#fff;background:#241c10}'
 +'.jombItem.on{border-color:#d9a13b;background:#352814;color:#ffd24a;'
 +'box-shadow:0 0 12px rgba(217,161,59,.3)}'
 +'.jombItem .sub{font:10px monospace;color:#8f8264}'
 +'.jombItem.on .sub{color:#d9a13b}'
 +'.jombItem.boss{border-left:3px solid #ff5030}'
 +'.jombItem.elite{border-left:3px solid #e6c34a}'
 +'#jombInfo{position:absolute;top:24px;right:26px;width:360px;z-index:5;pointer-events:auto;'
 +'background:rgba(20,17,13,.95);border:1px solid #3b3122;padding:18px 20px;'
 +'box-shadow:0 12px 32px #000;max-height:calc(100vh - 160px);overflow-y:auto}'
 +'#jombInfo .head{display:flex;justify-content:space-between;align-items:flex-start;'
 +'margin-bottom:8px;padding-bottom:10px;border-bottom:1px solid #262017}'
 +'#jombInfo h2{font:26px Staatliches,sans-serif;color:#e7dcc3;letter-spacing:.08em}'
 +'#jombInfo .sub{font:11px monospace;color:#d9a13b;display:block;margin-top:2px;letter-spacing:.14em}'
 +'.jombStat{display:flex;justify-content:space-between;font:11px monospace;color:#8f8264;'
 +'margin-bottom:5px;padding:3px 0;border-bottom:1px dashed #1e1a12}'
 +'.jombStat b{color:#cfc4a6;font-weight:400}'
 +'.jombStat b.warn{color:#e07a70}'
 +'.jombStat b.good{color:#9ad970}'
 +'.jombBlock{margin-top:14px;padding-top:12px;border-top:1px solid #262017;'
 +'font:11px monospace;color:#9a8f7c;line-height:1.55}'
 +'.jombBlock .title{font:14px Staatliches,sans-serif;color:#d9a13b;letter-spacing:.12em;'
 +'margin-bottom:5px;display:block}'
 +'.jombSkill{padding:8px 10px;margin:6px 0;background:rgba(14,11,9,.6);'
 +'border-left:2px solid #d9a13b;font:10.5px monospace;color:#cfc4a6;line-height:1.5}'
 +'.jombSkill b{color:#ffd24a;display:block;font:13px Staatliches,sans-serif;'
 +'letter-spacing:.08em;margin-bottom:3px}'
 +'.jombSkill.passive{border-left-color:#7fb3e8}'
 +'.jombSkill.passive b{color:#7fb3e8}'
 +'#jombToolbar{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);z-index:5;'
 +'pointer-events:auto;display:flex;gap:8px;background:rgba(20,17,13,.94);'
 +'border:1px solid #3b3122;padding:8px 14px;box-shadow:0 8px 24px #000}'
 +'.jombBtn{background:#171310;border:1px solid #3b3122;color:#cfc4a6;'
 +'font:13px Staatliches,sans-serif;letter-spacing:.05em;padding:7px 14px;'
 +'cursor:pointer;transition:all .15s}'
 +'.jombBtn:hover{border-color:#d9a13b;color:#d9a13b}'
 +'.jombBtn.on{border-color:#7fa35b;color:#7fa35b;background:#141a0d}'
 +'#jombClose{background:none;border:1px solid #7a3a34;color:#e07a70;width:30px;height:30px;'
 +'font:15px monospace;cursor:pointer;transition:all .15s;flex-shrink:0;margin-left:12px}'
 +'#jombClose:hover{border-color:#c0453a;color:#ff9088}'
 +'#jombHint{position:absolute;bottom:24px;right:26px;z-index:5;pointer-events:none;'
 +'font:10px monospace;color:#5c5340;text-align:right;line-height:1.6}'
 +'#jombLoading{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);'
 +'z-index:4;font:14px Staatliches,sans-serif;color:#8f8264;letter-spacing:.2em}'
 // F12.4: KEYBINDINGS panel rows
 +'.kbRow{display:flex;justify-content:space-between;font:13px monospace;'
 +'padding:7px 0;border-bottom:1px solid #262017}'
 +'.kbRow b{color:#d9a13b;font-family:Staatliches,sans-serif;letter-spacing:.1em;font-size:15px;font-weight:400}'
 +'.kbRow span{color:#cfc4a6}';
 document.head.appendChild(s);
})();

// ================= 4. KONFIG & DATA GDD =================
const CFG={gridW:40,gridH:32,
 bloom:{strength:.9,radius:.5,threshold:.55},
 camView:15,camOffset:new THREE.Vector3(22,28,22),panSpeed:14,
 waveTime:120,pauseTime:30,prepTime:300,
 // F12.13 (Opsi A): Night 1 lebih padat, growth lebih cepat, plateau di N12+.
 baseZombies:110,zombieGrowth:12,maxAlive:80,zombieCapN:12,
 wallHP:500,
 bulletSpeed:15};

// ---- F7: KONFIG KARAKTER (§21.1) — kedua starter ----
const CHARS={
 diaz:{n:'DIAZ',hp:100,atk:52,def:17,agi:45,spd:45,deploy:10, // F10.5-C: ATK 48→52 · F10.13h: AGI 30→45
  weapon:{name:'PISTOL',bullets:1,interval:1.0,reload:3.0,mag:9,range:5},
  passive:'killstack',skill:'ADRENALINE',
  skd:'SPD+50% · AGI+50% · ATK+30% for 25s',
  psd:'+10 ATK per kill (7s · +2s per kill · max 10 · 10s cooldown)'},
 bambang:{n:'BAMBANG',hp:100,atk:30,def:36,agi:42,spd:60,deploy:10, // F10.5-C: ATK 28→30 · F10.13h: AGI 25→42
  weapon:{name:'DUAL PISTOL',bullets:2,interval:1.0,reload:5.0,mag:18,range:5},
  passive:'marked',skill:'MOTIVATED',
  skd:'6 rapid shots · first hit ATK+20%, +10% per hit (max +70% · 10s)',
  psd:'Attacks MARK enemies: +50% damage from ALL sources (5s · resets on hit)'},
 rehan:{n:'REHAN',hp:100,atk:58,def:20,agi:40,spd:25,deploy:10,respect:20,rarity:'Common', // F10.5-C: ATK 42→58 · F10.13h: AGI 28→40
  weapon:{name:'HEAVY PISTOL',bullets:1,interval:1.0,reload:3.0,mag:7,range:6}, // P8: +2 blok (was 4)
  passive:'chain',skill:'JUST LIKE BACK HOME..',
  skd:'True Damage 115% ATK · skill kill refills Energy to 100 (chain ×4 · 12s window)',
  psd:'+15% Energy gain from every kill'},
 memet:{n:'MEMET',hp:100,atk:20,def:25,agi:32,spd:70,deploy:15,respect:20,rarity:'Common', // F10.5-C.2: ATK 25→20 · F10.13h: AGI 25→32
  weapon:{name:'MINI-SMG',bullets:4,interval:1.0,reload:5.0,mag:32,range:4},
  passive:'marked5',skill:'MAN OF MEDAN',
  skd:'DEF+200% SPD+150% · no healing · HP floor 1 · locked in place (25s)',
  psd:'Attacks MARK enemies: +20% damage (max 5 enemies, stacks with Bambang)'},
 // ===== F9a: 6 RARE (§21.2) — field type/fan/proj/slow/stun/burn/aoe dibaca engine F9b =====
 sobel:{n:'SOBEL',hp:100,atk:15,def:30,agi:25,spd:100,deploy:20,respect:35,rarity:'Rare',
  weapon:{name:'MACHINE GUN',bullets:10,interval:2.0,reload:15.0,mag:100,range:6,
   type:'std',fan:45,sfxOnce:true}, // F9c: sfxOnce — 1 file berisi 10 tembakan, play di peluru #1
  passive:'mag200',skill:'BRRRT, BRTT..',
  skd:'60° fan · 15 PIERCING bullets per volley · no ammo used (20s) · next reload +50%',
  psd:'Crafts PROTECTION armor · every 5th reload = 200-round magazine'},
 vikry:{n:'VIKRY',hp:100,atk:125,def:35,agi:30,spd:24,deploy:20,respect:35,rarity:'Rare',
  weapon:{name:'PUMP SHOTGUN',bullets:1,interval:2.5,reload:8.0,mag:8,range:4,
   type:'pierce',proj:5,fan:25,slow:.5,slowT:3},
  passive:'cover',skill:'I AM THE STORM',
  skd:'Ricochet ×3: 100/75/70/65% ATK · STUN 2s all hits · self ATK+20% SPD+30% (15s)',
  psd:'Builds special BARRICADES · within 1 blk of his own Sandbag/Constr/Concrete: ATK+50% DEF+100%'},
 erry:{n:'ERRY',hp:100,atk:225,def:22,agi:25,spd:17,deploy:20,respect:35,rarity:'Rare', // FIX(40): AGI 10→25 — 1.0s/blok (was 2.5s, terlalu lumpah)
  weapon:{name:'GRENADE LAUNCHER',bullets:1,interval:10.0,reload:17.5,mag:5,range:5, // FIX: was 25 — effective 15.0s (keputusan F9b)
   type:'boom',aoeP:.3,aoeR:5},
  passive:'elite2x',skill:'EAT THIS!',
  skd:'5 explosive bullets, 45° fan · each 50% ATK AoE, 3-block radius',
  psd:'ATK ×2 vs ELITE & BOSS zombies (no stack)'},
 ariz:{n:'ARIZ',hp:100,atk:20,def:42,agi:55,spd:63,deploy:20,respect:35,rarity:'Rare', // F10.5-C: ATK 25→20
  weapon:{name:'SMG',bullets:4,interval:1.0,reload:5.0,mag:40,range:6},
  passive:'fastRevive',skill:'NOT ON MY WATCH!',
  skd:'Healing zone, 3-block radius: HP+20/s to all allies incl. self (15s)',
  psd:'Crafts FIRST AID · revives downed allies in 2s'},
 alvi:{n:'ALVI',hp:100,atk:72,def:30,agi:67,spd:45,deploy:20,respect:35,rarity:'Rare', // F10.5-C: ATK 78→67→72
  weapon:{name:'SEMI-AUTO RIFLE',bullets:2,interval:2.0,reload:6.0,mag:20,range:7,
   type:'pierce',slow:.35,slowT:3},
  passive:'buffBoost',skill:'FREE MEALS',
  skd:'Meal tray throw (≤3 blk): 4-block zone — ATK+40% DEF+25% AGI+30% SPD+35% (35s)',
  psd:'Crafts COOKING · buff item effects on himself +25%'},
 reza:{n:'REZA',hp:100,atk:25,def:10,agi:70,spd:55,deploy:20,respect:35,rarity:'Rare', // F10.5-C: ATK 28→25
  weapon:{name:'ASSAULT RIFLE',bullets:6,interval:1.0,reload:5.0,mag:30,range:6,
   type:'fire',burnP:.2,burnT:4},
  passive:'dotHeal',skill:'PYROMANIAC',
  skd:'Molotov throw (≤5 blk): target + 2-block radius on fire — BURNING 50% ATK/s (5s)',
  psd:'Builds TRAPS · heals 1 HP per BURNING tick from his attacks'},
 // ===== F9a-2: 3 SUPER RARE (§21.2) — field type/proj/fan/slow/stun/burn dibaca engine F9b =====
 lele:{n:'LELE',hp:100,atk:168,def:62,agi:25,spd:25,deploy:30,respect:50,rarity:'Super Rare', // FIX(40): AGI 15→25 — 1.0s/blok (was 1.67s) · F12.12: DEF 105→62 — boss/elite kasih damage nyata (was 1-5 HP)
  weapon:{name:'SEMI-AUTO SHOTGUN',bullets:1,interval:2.0,reload:8.0,mag:8,range:6,
   type:'pierce',proj:8,fan:35,stun:3},
  passive:'bigHitHeal',skill:'GORILLA MODE',
  skd:'Consume 50% HP → +ATK/DEF/AGI/SPD equal to HP consumed (D25) · fan 45° · STUN 5s · no reload (15s) · next reload +70%',
  psd:'Regenerates 3 HP per single hit dealing 300+ damage'},
 raptor:{n:'RAPTOR',hp:100,atk:197,def:37,agi:46,spd:19,deploy:30,respect:50,rarity:'Super Rare',
  weapon:{name:'BOLT-ACTION SNIPER',bullets:1,interval:6.0,reload:10.0,mag:10,range:10,
   type:'pierce',slow:.8,slowT:5},
  passive:'lastShot',skill:'QUICK-SCOPE',
  skd:'ATK+100% SPD+100% · interval & reload −50% · AGI−50% · range −20% · STUN 3s on hit / target · 3s cd (15s)',
  psd:'Last-bullet kill → next magazine ATK+30% (no stack)'},
 hafid:{n:'HAFID',hp:100,atk:190,def:50,agi:25,spd:34,deploy:30,respect:50,rarity:'Super Rare', // F12.12: DEF 66→50 — bukan tanker, tapi tetap #2 (di atas Ariz 42)
  weapon:{name:'MARKSMAN RIFLE',bullets:1,interval:4.0,reload:8.0,mag:10,range:8,
   type:'fire',burnP:.35,burnT:5},
  passive:'bombEnergy',skill:'HAHAHAHA!',
  skd:'Sticky Bomb: sticks 5s → 250% ATK to target + 200% ATK AoE 3-block radius (D27 — butuh target)',
  psd:'Skill kill → +25 Energy (stacks ×2)'}};
const ALL_IDS=['diaz','bambang','rehan','memet','sobel','vikry','erry','ariz','alvi','reza',
 'lele','raptor','hafid']; // F9a-2: +3 SR — ROSTER LENGKAP 13 (§21)
const fireInterval=ch=>{ // F9c: override interval skill (Brrrt .6s · Quick-scope −50%)
 let iv=CHARS[ch.id].weapon.interval;
 if(ch._brrrt&&S.now<ch._brrrt)iv=.6;
 else if(ch._qs&&S.now<ch._qs)iv*=.5;
 return iv/(1+ch.es.spd/100);
};

// ===== F10.2: UPGRADE TREE — 4 jalur × 4 tier (§10.1, harga turun sesuai keputusan user) =====
// Harga default GDD: 15/30/50/75 → diturunkan ke 10/20/35/50 (total 115/jalur · 460/karakter).
// Progress per karakter disimpan di ch.tree = {rec,off,def,pas}, nilai 0-4 (tier tertinggi unlocked).
// Efek tree di-apply di effStats (F10.2.3) + hook lain (reload/mag/revive/heal/status di F10.2.4-5).
const TREE={
 rec:{n:'RECOVERY',col:'#7fa35b',nodes:[
  {c:10,l:'Second Wind',   d:'-1s revive time when YOU are down.'},
  {c:20,l:'Field Dressing',d:'+10% healing item effect on you.'},
  {c:35,l:'Helping Hand',  d:'-2s revive time when reviving OTHERS.'},
  {c:50,l:'Vampiric',      d:'+1 HP per bullet that hits an enemy.'}]},
 off:{n:'OFFENSIVE',col:'#e6c34a',nodes:[
  {c:10,l:'Sharpened',     d:'ATK +25.'},
  {c:20,l:'Quick Hands',   d:'Reload time -10%.'},
  {c:35,l:'Extended Mag',  d:'+2 magazine capacity.'},
  {c:50,l:'Pack Tactics',  d:'ATK +10/15/20/25% per nearby ally within 1 block (max 4).'}]},
 def:{n:'DEFENSIVE',col:'#7fb3e8',nodes:[
  {c:10,l:'Toughened',     d:'DEF +25.'},
  {c:20,l:'Cover Drill',   d:'DEF +50% while behind cover.'},
  {c:35,l:'Last Stand',    d:'DEF +60% while HP is below 30.'},
  {c:50,l:'Iron Will',     d:'Status effect duration -25%.'}]},
 pas:{n:'PASSIVE',col:'#c07ae8',nodes:[
  {c:10,l:'Fleet Footed',  d:'AGI +10.'},
  {c:20,l:'Well Fed',      d:'+10% buff item effect on you.'},
  {c:35,l:'Fast Learner',  d:'+20% XP gain.'},
  {c:50,l:'Efficient',     d:'Deploy cost -25%.'}]}};
const TREE_KEYS=['rec','off','def','pas']; // urutan tampil di panel

// ===== F10.4: JOURNAL — 33 misi (12 Easy · 12 Moderate · 9 Hard) =====
// Setiap misi goal-based: baca counter dari ch.jc[key], complete saat >= goal.
// Night-end missions (surviveClean · hp80End · noStatusEnd · flawlessEnd · teamEnd ·
// noBuffEnd) di-set di nightEnd() sebelum reset.
const JOURNAL_MISSIONS={
 easy:[
  {id:'e_zom15',  n:'Zombie Slayer I',  d:'Defeat 15 normal zombies.',        goal:15,  xp:250, key:'zNorm'},
  {id:'e_dmg1k',  n:'Damage Dealer I',  d:'Deal 1,000 damage to enemies.',    goal:1000,xp:250, key:'dmg'},
  {id:'e_heal2',  n:'First Aid I',      d:'Use any healing item 2 times.',    goal:2,   xp:250, key:'heals'},
  {id:'e_buff1',  n:'Prepared I',       d:'Use any buff item 1 time.',        goal:1,   xp:250, key:'buffs'},
  {id:'e_surv1',  n:'Survivor I',       d:'Survive a night without going down.',goal:1, xp:250, key:'surviveClean'},
  {id:'e_met15',  n:'Scavenger: Metal', d:'Collect 15 Metal Scrap.',          goal:15,  xp:250, key:'res_metal'},
  {id:'e_clo15',  n:'Scavenger: Cloth', d:'Collect 15 Cloth.',                goal:15,  xp:250, key:'res_cloth'},
  {id:'e_barr2',  n:'Carpenter',        d:'Build or repair a Makeshift Barricade 2x.',goal:2,xp:250,key:'makeshiftCount'},
  {id:'e_craft3', n:'Novice Crafter',   d:'Craft any item 3 times.',          goal:3,   xp:250, key:'crafts'},
  {id:'e_lvl1',   n:'Level Up',         d:'Level up this character once.',    goal:1,   xp:250, key:'levelUps'},
  {id:'e_stove1', n:'Night Snacks',     d:'Use the Stove 1 time.',            goal:1,   xp:250, key:'stove'},
  {id:'e_rld10',  n:'Gunner I',         d:'Reload your weapon 10 times.',     goal:10,  xp:250, key:'reloads'}],
 moderate:[
  {id:'m_zom40',  n:'Zombie Slayer II', d:'Defeat 40 normal zombies.',        goal:40,  xp:500, key:'zNorm'},
  {id:'m_elite1', n:'Elite Hunter I',   d:'Defeat 1 Elite zombie.',           goal:1,   xp:500, key:'zElite'},
  {id:'m_dmg5k',  n:'Damage Dealer II', d:'Deal 5,000 damage.',               goal:5000,xp:500, key:'dmg'},
  {id:'m_skill4', n:'Ability Spammer',  d:'Use your skill 4 times.',          goal:4,   xp:500, key:'skills'},
  {id:'m_rev1',   n:'Lifesaver',        d:'Revive a downed ally 1 time.',     goal:1,   xp:500, key:'revives'},
  {id:'m_hp80',   n:'Healthy Finish',   d:'End a night with your HP ≥ 80%.',  goal:1,   xp:500, key:'hp80End'},
  {id:'m_res50',  n:'Resource Gatherer',d:'Collect 50 resources total.',      goal:50,  xp:500, key:'resTotal'},
  {id:'m_fort5',  n:'Fortifier',        d:'Build 5 barricades or traps.',     goal:5,   xp:500, key:'builds'},
  {id:'m_apoth2', n:'Apothecary',       d:'Craft 2 healing items.',           goal:2,   xp:500, key:'healCrafts'},
  {id:'m_nost',   n:'No Effect',        d:'End a night with no status effects.',goal:1, xp:500, key:'noStatusEnd'},
  {id:'m_buff3',  n:'Prepared II',      d:'Use 3 buff items.',                goal:3,   xp:500, key:'buffs'},
  {id:'m_team2',  n:'Teamwork',         d:'End a night with 2+ characters alive.',goal:1,xp:500,key:'teamEnd'}],
 hard:[
  {id:'h_zom100', n:'Zombie Annihilator',d:'Defeat 100 zombies total.',       goal:100, xp:1250,key:'zTotal'},
  {id:'h_boss1',  n:'Boss Slayer',      d:'Defeat 1 Boss zombie.',            goal:1,   xp:1250,key:'zBoss'},
  {id:'h_elite3', n:'Elite Hunter II',  d:'Defeat 3 Elite zombies.',          goal:3,   xp:1250,key:'zElite'},
  {id:'h_dmg15k', n:'Ultimate Damage',  d:'Deal 15,000 damage.',              goal:15000,xp:1250,key:'dmg'},
  {id:'h_sk10',   n:'Ability Master',   d:'Use your skill 10 times.',         goal:10,  xp:1250,key:'skills'},
  {id:'h_flaw',   n:'Flawless Defense', d:'End a night without any character going down.',goal:1,xp:1250,key:'flawlessEnd'},
  {id:'h_arm1',   n:'Heavy Armored',    d:'Craft Military Armor 1 time.',     goal:1,   xp:1250,key:'militaryCraft'},
  {id:'h_pure',   n:'Pure Skill',       d:'End a night without using any buff item.',goal:1,xp:1250,key:'noBuffEnd'},
  {id:'h_dmg25k', n:'Combat Legend',    d:'Deal 25,000 damage.',              goal:25000,xp:1250,key:'dmg'}]};
function emptyJc(){return{
 zNorm:0,zElite:0,zBoss:0,zTotal:0,dmg:0,
 heals:0,buffs:0,skills:0,revives:0,
 crafts:0,healCrafts:0,militaryCraft:0,
 builds:0,makeshiftCount:0,
 res_metal:0,res_cloth:0,resTotal:0,
 levelUps:0,stove:0,reloads:0,
 wentDown:0,hadStatus:0,
 surviveClean:0,hp80End:0,noStatusEnd:0,flawlessEnd:0,teamEnd:0,noBuffEnd:0};}

// P8: zombie DEF dihapus total — damage ke zombie = PURE ATK (tanpa pengurangan).
// HP/ATK/AGI di-buff sebagai kompensasi (lihat analisis).
const ZTYPES={
 Walker:  {hp:140,atk:55,agi:23,interval:1.5,meleeRange:1,xp:50,energy:5,bld:.2},
 Runner:  {hp:100,atk:62,agi:42,interval:1.0,meleeRange:1,xp:50,energy:5,bld:.15},
 Crawler: {hp:125,atk:58,agi:25,interval:1.8,meleeRange:1,xp:50,energy:5,bld:.15,crawl:true}, // FIX(12e): flag crawl — loop animasi cek z.T.crawl, sebelumnya undefined → crawler selalu pakai pose Walker (armL base=-1.05 → cakar terangkat ke atas). Dengan flag ini, branch crawl aktif (base=0 → cakar horizontal ke depan).
 Biter:   {hp:150,atk:72,agi:20,interval:1.2,meleeRange:1,xp:50,energy:5,bld:.25},
 Shambler:{hp:190,atk:50,agi:20,interval:2.0,meleeRange:1,xp:50,energy:5,bld:.3},
 Screecher:{hp:155,atk:75,agi:28,interval:.8,meleeRange:1,xp:50,energy:5,bld:.12},
 // F12.13: SPITTER — Normal ranged, meludah cairan hijau beracun.
 Spitter:  {hp:130,atk:50,agi:25,interval:1.0,meleeRange:1,xp:50,energy:5,bld:.15,
  spit:true,spitRange:7,spitCd:3.0,spitBurnDps:5,spitBurnT:5},
 // ===== F5: ELITE (§22.2) =====
 Bloater:  {hp:900,atk:69,agi:15,interval:2.0,meleeRange:1,xp:150,energy:20,bld:1.0,elite:true,big:true,hitR:1.1,ovh:2.7,deathBoom:true,occ:{hx:1,hz:1}},
 Creeper:  {hp:700,atk:82,agi:45,interval:1.2,meleeRange:1,xp:150,energy:20,bld:.4,elite:true},
 Sprinter: {hp:650,atk:72,agi:60,interval:.9, meleeRange:1,xp:150,energy:20,bld:.35,elite:true},
 // ===== F5: BOSS (§22.3) =====
 PZero:    {hp:2850,atk:92,agi:20,interval:1.8,meleeRange:3,xp:500,energy:75,bld:.8,boss:true,big:true,hitR:1.4,ovh:4.3,occ:{hx:1.5,hz:1.5}},
 ZAlpha:   {hp:2500,atk:110,agi:35,interval:1.5,meleeRange:2,xp:500,energy:75,bld:.5,boss:true,ovh:2.6,hitR:.75}, // F12.13: hitbox R .4→.75 — match shoulder 1.58
};
// F3.1: palet kulit tematik per jenis + field `hair` (warna rambut kusut).
// Tema: Walker coklat-kering (baru jadi), Runner pucat-hijau (fresh), Biter
// merah-kusam (berlumur), Shambler hijau-lumut (busuk basah), Screecher
// kuning-tulang (skeletal), Bloater hijau-tox, Creeper abu-coklat (bayangan),
// Sprinter kelabu-tajam, ZAlpha merah-tanah (leader), PZero campuran.
const ZVIS={
 Walker:  {skin:0x8a7050,cloth:0x2a2620,w:1,   th:.5, tilt:.32,hs:.24,hair:0x2a1a10},
 Runner:  {skin:0x8a9578,cloth:0x33302a,w:.8,  th:.55,tilt:.55,hs:.2, hair:0x3a2a1a},
 Crawler: {skin:0x6a6858,cloth:0x2a2822,w:1.05,th:.28,tilt:0,  hs:.22,crawl:true,hair:0x2a1f18},
 Biter:   {skin:0x8a5048,cloth:0x2a2020,w:1.2, th:.5, tilt:.22,hs:.3, jaw:true,hair:0x1a1010},
 Shambler:{skin:0x5a6a45,cloth:0x2a2a20,w:1.55,th:.6, tilt:.08,hs:.28,hair:0x4a4538},
 Screecher:{skin:0xb8ac88,cloth:0x3a3628,w:.72,th:.6, tilt:.48,hs:.22,hair:0x6a6558},
 Spitter:  {skin:0x8ab07a,cloth:0x3a4a2a,w:.95,th:.55,tilt:.30,hs:.24,hair:0x1a3020}, // F12.13: hijau pucet + rambut gelap panjang
 Bloater:  {skin:0x6a8a4a,cloth:0x3a3a28,w:2.2,th:1.05,tilt:.05,hs:.42,scale:1.5,belly:true,hair:0x3a3020},
 Creeper:  {skin:0x6a6055,cloth:0x2a2822,w:.85,th:.5,tilt:.75,hs:.24,armL:1.6,hair:0x2a221a},
 Sprinter: {skin:0x9aa08a,cloth:0x303028,w:.72,th:.6,tilt:.35,hs:.2,legL:1.35,hair:0x3a3028},
 PZero:    {skin:0x7a6a5a,cloth:0x4a3a30,w:2.6,th:1.2,tilt:.1,hs:.5,scale:2.2,mass:true},
 ZAlpha:   {skin:0x8a5a48,cloth:0x332420,w:1.6,th:.95,tilt:.15,hs:.34,scale:1.45,muscle:true,hair:0x2a1a10},
};
const WAVE_NAMES=['SUNSET','MIDNIGHT','FOG BEFORE DAWN','FIRST LIGHT'];
// P8: label display utk zombie — boss pakai nama LENGKAP (overhead, lock toast).
// Elite/normal tidak ada di map → fallback ke typeName apa adanya (sudah pas).
const ZTYPE_LABEL={PZero:'PATIENT ZERO',ZAlpha:'ZOMBIE ALPHA'};
// F10.2.2b FIX: ICON_DIR dideklarasikan DI SINI (bukan di bawah setelah PREBARR)
// — IIFE SKILL_ICONS mengeksekusi `ICON_DIR+file` saat parse; deklarasi yang
// muncul setelahnya membuat TDZ error (ReferenceError) yang membekukan game.
const ICON_DIR='assets/';
// F10.2.2b: nama display pasif per karakter (internal id → judul rapi)
const PASSIVE_NAMES={
 killstack:'Killstack',marked:'Marked',chain:'Chain',marked5:'Marked V',
 mag200:'Extended Mag',cover:'Cover',elite2x:'Elite Slayer',
 fastRevive:'Fast Revive',buffBoost:'Buff Boost',dotHeal:'Pyro Regen',
 bigHitHeal:'Big Hit Heal',lastShot:'Last Shot',bombEnergy:'Bomb Energy'};
// F10.2.2b: ikon skill 64×64 di assets/skill_${id}.png — hover → tooltip
const SKILL_ICONS={};
(function(){
 for(const id of ALL_IDS){
  const file='skill_'+id+'.png';
  const rec={img:new Image(),ok:false};
  rec.img.onload=()=>{rec.ok=true;};
  rec.img.onerror=()=>{rec.ok=false;};
  rec.img.src=ICON_DIR+file;
  SKILL_ICONS[id]=rec;
 }
})();
// Helper HTML — selalu render <img>; onerror sembunyikan agar tidak ada broken icon
function skillIconHtml(id,extraCls){
 return '<img class="skillIcon'+(extraCls?' '+extraCls:'')+'" data-skill="'+id+'"'
  +' src="'+ICON_DIR+'skill_'+id+'.png" alt=""'
  +' onerror="this.style.display=\'none\'">';
}

const ITEMS={
 // ---- resources (drop zombie) ----
 cloth:{n:'Cloth',stack:50,c:'#b8a98c',ic:'ic_cloth.png'},
 metal:{n:'Metal Scrap',stack:50,c:'#9aa0a8',ic:'ic_metal.png'},
 herbs:{n:'Wild Herbs',stack:50,c:'#6f9b5a',ic:'ic_herbs.png'},
 stone:{n:'Stone',stack:50,c:'#8a8378',ic:'ic_stone.png'},
 wood:{n:'Wood',stack:50,c:'#8a6a42',ic:'ic_wood.png'},
 food:{n:'Food Packs',stack:50,c:'#c2a558',ic:'ic_food.png'},
 // ---- crafted: BASIC (Diaz) ----
 lantern:{n:'Lantern',stack:5,c:'#d9a13b',ic:'ic_lantern.png',type:'block',
  d:'Placeable — lights 5 blocks.'},
 stercloth:{n:'Sterilized Cloth',stack:30,c:'#e8e0d0',ic:'ic_stercloth.png',type:'heal',
  d:'Heals 15% HP · cd 5s'},
 storagebox:{n:'Storage Box',stack:5,c:'#8a6a42',ic:'ic_box.png',type:'block',
  d:'Placeable — stores 20 items.'},
 // ---- COOKING (Alvi — F9) ----
 sardines:{n:'Sardines',stack:20,c:'#c8b090',ic:'ic_sardines.png',type:'buff',
  d:'ATK+3 DEF+2 · 60s'},
 noodles:{n:'Instant Noodles',stack:20,c:'#d8c090',ic:'ic_noodles.png',type:'buff',
  d:'ATK+5 DEF+2 AGI+2 · 60s'},
 oatmeal:{n:'Oatmeals',stack:20,c:'#d8d0b0',ic:'ic_oatmeal.png',type:'buff',
  d:'ATK+2 DEF+7 SPD+5 · 80s'},
 chicken:{n:'Roasted Chicken',stack:20,c:'#c89050',ic:'ic_chicken.png',type:'buff',
  d:'ATK+8 DEF+4 AGI+3 SPD+3 · 100s'},
 steak:{n:'Beef Steak',stack:20,c:'#a86040',ic:'ic_steak.png',type:'buff',
  d:'ATK+12 DEF+6 AGI+5 SPD+5 +25% XP · 180s · clears status'},
 // ---- FIRST AID (Ariz — F9) ----
 medherbs:{n:'Medical Herbs',stack:30,c:'#8ab070',ic:'ic_medherbs.png',type:'heal',
  d:'Heals 20% + 5 HP over 5s · cd 10s'},
 bandage:{n:'Bandage',stack:30,c:'#e0d8c8',ic:'ic_bandage.png',type:'heal',
  d:'Heals 50% · cd 15s · clears status'},
 medkit:{n:'Medical Kit',stack:30,c:'#d05050',ic:'ic_medkit.png',type:'heal',
  d:'Heals 100% · cd 25s · clears status'},
 spray:{n:'First Aid Spray',stack:30,c:'#60a0b0',ic:'ic_spray.png',type:'heal',
  d:'AoE heal 2 blk (incl. self): 10% + 10 HP/4s · cd 15s'}, // FIX(46) P5
 holywater:{n:'Holy Water',stack:30,c:'#c0d0ff',ic:'ic_holywater.png',type:'heal',
  d:'AoE heal 4 blk (incl. self): 50% + 10 HP/5s · cd 60s'}, // FIX(46) P5
 // ---- ARMOR (Sobel — F9) ----
 denim:{n:'Denim Armor',stack:1,c:'#6070a0',ic:'ic_denim.png',type:'armor',
  d:'DEF+10 · Durability 250'},
 leather:{n:'Leather Armor',stack:1,c:'#8a6030',ic:'ic_leather.png',type:'armor',
  d:'DEF+20 · Durability 800'},
 military:{n:'Military Armor',stack:1,c:'#4a5a40',ic:'ic_military.png',type:'armor',
  d:'DEF+40 · Durability 1500'}};
const DROPS=[ // FIX(21e): cloth ×0.75 · metal & wood ×1.25
 {id:'cloth',n:[.60,1,5],e:[.45,3,8],b:[.375,7,15]},
 {id:'metal',n:[.375,1,4],e:[.625,2,6],b:[.625,5,15]},
 {id:'herbs',n:[.20,1,3],e:[.30,2,5],b:[.50,5,8]},
 {id:'stone',n:[.40,1,4],e:[.50,2,6],b:[.75,5,10]},
 {id:'wood',n:[.5625,1,4],e:[.75,2,6],b:[1.0,5,10]},
 {id:'food',n:[.15,1,3],e:[.25,2,5],b:[.40,4,8]}];
const BUILDS={
 makeshift:{n:'Makeshift Barricade',access:'all',spot:'entry',
  mats:{wood:15,metal:15},t:3,hp:200,c:'#8a6a42',ic:'ic_makeshift.png', // P10: 15W+15M · HP 200
  d:'200 HP. Blocks zombies at doors & windows.'},
 reinforced:{n:'Reinforced Barricade',access:'vikry',spot:'entry',
  mats:{stone:30,wood:30,metal:35},t:5,hp:500,c:'#7a7a72',ic:'ic_reinforced.png', // P10: HP 500
  d:'500 HP. Blocks zombies at doors & windows.'},
 sandbag:{n:'Sandbag',access:'vikry',spot:'floor',mats:{cloth:20},t:3,hp:120,c:'#9a8a60',ic:'ic_sandbag.png',d:'120 HP floor barrier.'}, // P10: HP 120
 constr:{n:'Construction Barrier',access:'vikry',spot:'floor',mats:{wood:12,metal:16},t:5,hp:100,c:'#c08a2c',ic:'ic_constr.png',d:'100 HP floor barrier.'}, // P10: 12W+16M · HP 100
 concrete:{n:'Concrete Barrier',access:'vikry',spot:'floor',mats:{stone:40},t:7,hp:200,c:'#8a8780',ic:'ic_concrete.png',d:'200 HP floor barrier.'}, // P10: HP 200
 barbed:{n:'Barbed Wire',access:'reza',spot:'floor',mats:{metal:20},t:1,hp:50,c:'#9a9488',ic:'ic_barbed.png',d:'SLOW 50% + 5 HP/s · 50 HP (wears per zombie passing).'}, // FIX(41)
 bear:{n:'Bear Trap',access:'reza',spot:'floor',mats:{metal:40},t:2,c:'#7a7468',ic:'ic_bear.png',d:'STUN 10s. Consumed on catch.'},
 claymore:{n:'Claymore',access:'reza',spot:'floor',mats:{metal:50},t:1,c:'#5a5a52',ic:'ic_claymore.png',d:'AoE: -100 HP in 2-block radius.'},
 incend:{n:'Incendiary Mines',access:'reza',spot:'floor',mats:{metal:65},t:3,c:'#a05438',ic:'ic_incend.png',d:'-50 HP + BURNING in 3-block radius.'},
 oil:{n:'Oil Bucket',access:'reza',spot:'floor',mats:{metal:20},t:2,c:'#4a4238',ic:'ic_oil.png',d:'SLOW 80% on pass. Fades 5s after use.'}, // FIX(41)
 spikes:{n:'Metal Spikes',access:'reza',spot:'floor',mats:{metal:45},t:1,hp:50,c:'#8a8478',ic:'ic_spikes.png',d:'SLOW 60% + 10 HP/s · 50 HP (wears per zombie passing).'}}; // FIX(41)
// F10.7: jendela dapur barat (9,11) — pre-barr Makeshift by default.
const PREBARR=['19,24','20,24','20,7','30,18','9,11'];
// F10.2.2b FIX: const ICON_DIR dipindah ke atas (sebelum PASSIVE_NAMES) agar
// SKILL_ICONS IIFE tidak kena TDZ. Jangan deklarasikan ulang di sini.
const ICONS={};
(function(){
 const files=new Set();
 for(const k in ITEMS)if(ITEMS[k].ic)files.add(ITEMS[k].ic);
 for(const k in BUILDS)if(BUILDS[k].ic)files.add(BUILDS[k].ic);
 files.add('crafting_progress.png');
 files.add('repair.build_progress.png');
 for(const f of files){
  const rec={img:new Image(),ok:false};
  rec.img.onload=()=>{rec.ok=true;};
  rec.img.onerror=()=>{rec.ok=false;};
  rec.img.src=ICON_DIR+f;
  ICONS[f]=rec;
 }
})();
function icHtml(file,color){ // PNG ok → img; kalau tidak → kotak warna
 const r=file&&ICONS[file];
 if(r&&r.ok)return '<img class="icimg" src="'+ICON_DIR+file+'" alt="">';
 return '<div class="ic" style="background:'+color+'"></div>';
}
// ---- F6: CRAFTING (§12 / §20.2) ----
// ---- F6: CRAFTING (§12 / §20.2) ----
const CRAFTS={
 stercloth:{cat:'basic',mats:{cloth:5},t:3},
 lantern:{cat:'basic',mats:{cloth:2,metal:6},t:3,place:true},
 storagebox:{cat:'basic',mats:{wood:10,metal:8},t:5,place:true},
 sardines:{cat:'cook',mats:{food:5},t:6},
 noodles:{cat:'cook',mats:{food:8},t:10},
 oatmeal:{cat:'cook',mats:{food:10},t:8},
 chicken:{cat:'cook',mats:{food:15},t:15},
 steak:{cat:'cook',mats:{food:20},t:20},
 medherbs:{cat:'aid',mats:{herbs:5},t:3},
 bandage:{cat:'aid',mats:{herbs:5,cloth:5},t:7},
 medkit:{cat:'aid',mats:{herbs:10,cloth:10},t:12},
 spray:{cat:'aid',mats:{herbs:20},t:5},
 holywater:{cat:'aid',mats:{herbs:70,metal:30},t:20},
 denim:{cat:'protect',mats:{cloth:30},t:10},
 leather:{cat:'protect',mats:{cloth:50},t:15},
 military:{cat:'protect',mats:{cloth:80,metal:20,stone:10},t:25}};
const HEALS={
 stercloth:{pct:.15,cd:5},
 medherbs:{pct:.2,regen:1,regenT:5,cd:10},
 bandage:{pct:.5,cd:15,clear:true},
 medkit:{pct:1,cd:25,clear:true},
 spray:{pct:.1,regen:2.5,regenT:4,cd:15,aoeR:2},      // FIX(46) P5: GDD §20.2 — AoE 2 blok
 holywater:{pct:.5,regen:2,regenT:5,cd:60,aoeR:4}};   // FIX(46) P5: GDD §20.2 — AoE 4 blok
const FOOD_BUFFS={
 sardines:{dur:60,atkF:3,defF:2},
 noodles:{dur:60,atkF:5,defF:2,agiF:2},
 oatmeal:{dur:80,atkF:2,defF:7,spdF:5},
 chicken:{dur:100,atkF:8,defF:4,agiF:3,spdF:3},
 steak:{dur:180,atkF:12,defF:6,agiF:5,spdF:5,xpP:.25,clear:true}};
const ARMORS={
 denim:{def:10,dur:250},
 leather:{def:20,dur:800},
 military:{def:40,dur:1500}};
const WALL_REPAIR={mats:{wood:15,stone:20},t:8}; // keputusan Q3 — TETAP
const LIGHTING={
prep:{bg:0x7f96aa,amb:0xf0e4cc,ambI:.52,dir:0xffe6bd,dirI:.42,fog:0x8ba0b0,fogN:44,fogF:110,candle:.25},
 w1:{bg:0x241822,amb:0x6a4a3c,ambI:.6,dir:0xff9a58,dirI:.5,fog:0x2a1c24,fogN:30,fogF:78,candle:1},
 w2:{bg:0x04060c,amb:0x1c2636,ambI:.5,dir:0x8aa0c8,dirI:.4,fog:0x04060c,fogN:26,fogF:70,candle:2},
 w3:{bg:0x2c343a,amb:0x525e66,ambI:.62,dir:0xaebcc4,dirI:.34,fog:0x39444a,fogN:22,fogF:62,candle:.95,fogPatch:true},
 w4:{bg:0x32261a,amb:0x7a5638,ambI:.7,dir:0xffc070,dirI:.62,fog:0x40301f,fogN:34,fogF:85,candle:.7},
};

// ================= 5. PETA =================
const MAP=[
"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
"FFFFF.............................FFFFFF",
"FFF................................FFFFF",
"FFF.................................FFFF",
"FF..................................FFFF",
"FF.......XXXXwXXX.......XXXwXXX.......FF",
"FF.......Xnnk_nnXXwXdXwXXD____X.......FF",
"FF.......Xu_____#s______#n____w.......FF",
"FF.......Xn_n___#s______#__cc_X.......FF",
"FF.......Xe_n___#s______#__tt_X.......FF",
"FF.......w______o_______o__tt_X.......FF",
"FF.......X______#______e#__cc_X.......FF",
"FF.......w______#_______#_____w.......FF",
"FF.......X_ctc__#D______#__e__X.......FF",
"FF.......X#########ooo########X.......FF",
"FF.......XeBBn_D#e______#aa___X.......FF",
"FF.......X_bb___#__sss__#_____X.......FF",
"FF.......w______#_CCCC__#_____w.......FF",
"FF.......X______o_CCCC__o_____X.......FF",
"FF.......X______#f______#_____X.......FF",
"FF.......X##d#__#D______#_____X.......FF", // F10.10.1: wall utara bathroom + pintu (12,21)
"FF.......XuT_#__#_______#_____X.......FF", // F10.10.1: sink(10) toilet(11) interior(12-14) wall(15-16)
"FF.......XW__#n_#_______#_____X.......FF", // F10.10.1: shower(10) interior(11-14) wall(15-16)
"FF.......XXXXXXwXXXddXXXXdXgggX.......FF",
"FF.................pp.................FF",
"FF.................pp.................FF",
"FFF................pp................FFF",
"FFFF...............pp...............FFFF",
"FFFFFF.............pp.............FFFFFF",
"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"];
const GRID=MAP.map(r=>r.split(''));
// F12.5a: boot sanity check — warning kalau MAP tidak konsisten 40×32.
// Tidak block gameplay, hanya console.warn supaya edit map di masa depan
// langsung kelihatan kalau ada row yang salah panjang.
(function(){
 const bad=MAP.map((r,i)=>({i,len:r.length})).filter(x=>x.len!==CFG.gridW);
 if(MAP.length!==CFG.gridH)
  console.warn('[MAP] '+MAP.length+' rows — expected '+CFG.gridH);
 if(bad.length)
  console.warn('[MAP] row length mismatch (expected '+CFG.gridW+'):',
   bad.map(x=>'row '+x.i+'='+x.len).join(', '));
})();
const inBounds=(x,y)=>x>=0&&y>=0&&x<CFG.gridW&&y<CFG.gridH;
const cellAt =(x,y)=>inBounds(x,y)?GRID[y][x]:'F';
const FURN='BbDkntcsfaTuTW'; // F10.11: hapus S (stair tidak ada lagi)
const passChar=(x,y)=>{const c=cellAt(x,y);
 if(c==='_'||c==='C'||c==='o'||c==='e'||c==='p'||c==='W')return true; // F12.5b: +C (spawn marker)
 if((c==='d'||c==='w')&&!barricades.has(x+','+y))return true;
 return false};
const passZomb=(x,y)=>{const c=cellAt(x,y);
 return c==='.'||c==='_'||c==='C'||c==='o'||c==='e'||c==='d'||c==='w'||c==='p'||c==='W'}; // F12.5b: +C
// F5 Q2(a): zombie besar mengabaikan pintu/jendela/barikade — selalu
// menembus tembok (X/#). Barikade di sel mana pun = blok jalur mereka.
const passBig=(x,y)=>{const c=cellAt(x,y);
 if(c==='d'||c==='w')return false;
 if(!(c==='.'||c==='_'||c==='C'||c==='o'||c==='e'||c==='X'||c==='#'||c==='p'||c==='W'))return false; // F12.5b: +C
 return !barricades.has(x+','+y);};
const blocksBul=(x,y)=>{const c=cellAt(x,y);
 return c==='X'||c==='#'||c==='F'||c==='D'||c==='f'||c==='g'};
const wallEW=(x,y)=>{
 const W=v=>v==='X'||v==='#'||v==='w'||v==='d'||v==='g';
 return W(cellAt(x-1,y))&&W(cellAt(x+1,y));
};
function stairHeight(x,y){ // F10.11: single-floor only — selalu 0. Disimpan
 return 0;
}
// F10.13i: top permukaan lantai per sel. Indoor tile & path beige = .08
// (box .98×.08×.98, center di .04). Outdoor plain '.' / forest 'F' = 0
// (hanya ground plane, tanpa tile). Dipakai untuk mengangkat posisi kaki
// karakter & zombie agar napak di permukaan, tidak tenggelam .08.
function floorHeight(x,z){
 const c=cellAt(x,z);
 if(c==='_'||c==='C'||c==='o'||c==='e'||c==='d'||c==='w'||c==='p'||FURN.includes(c))return .08; // F12.5b: +C
 return 0;
}
const SPAWN=[];
for(let y=0;y<CFG.gridH;y++)for(let x=0;x<CFG.gridW;x++){
 if(GRID[y][x]!=='F')continue;
 if([[1,0],[-1,0],[0,1],[0,-1]].some(d=>cellAt(x+d[0],y+d[1])==='.'))SPAWN.push([x,y]);
}
const LIVING={x:20.5,z:19.5};
const FIREPIT={x:17.5,z:20.5};
// F12.5: HOME POSITIONS — karakter berdiri rapi di depan perapian (17,20).
// Baris belakang (z=19, 7 slot): x=17.5..23.5 — tepat utara perapian.
// Baris depan (z=20, 6 slot): x=18.5..23.5 — sebaris perapian, di sisi timur.
// Di-assign urut sesuai ALL_IDS (diaz=slot0, bambang=slot1, dst).
// Semua cell ini `_` (floor) di MAP — tidak nabrak wall/furniture.
// F12.5b: HOMES dipindah ke C-block (8 sel di depan sofa, row 18-19 cols 18-21)
// + 5 overflow di row 20 (timur perapian), total 13 = roster lengkap.
// 8 C-block = primary spot sesuai design user; 5 overflow untuk karakter ke-9..13
// supaya tiap char punya home unik (13 total = tidak ada tabrakan).
const HOMES=[
 // 8 primary — C-block (depan sofa)
 {x:18.5,z:18.5},{x:19.5,z:18.5},{x:20.5,z:18.5},{x:21.5,z:18.5},
 {x:18.5,z:19.5},{x:19.5,z:19.5},{x:20.5,z:19.5},{x:21.5,z:19.5},
 // 5 overflow — row 20 (timur perapian)
 {x:18.5,z:20.5},{x:19.5,z:20.5},{x:20.5,z:20.5},{x:21.5,z:20.5},{x:22.5,z:20.5}];
const homeFor=id=>{
 const h=HOMES[Math.max(0,ALL_IDS.indexOf(id))]||HOMES[0];
 return {x:h.x,z:h.z}; // salinan — jangan bagikan referensi HOMES
};

// ================= 6. THREE.JS =================
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 $('game').appendChild(renderer.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x241822);
scene.fog=new THREE.Fog(0x2a1c24,30,78);

let aspect=innerWidth/innerHeight;
const camera=new THREE.OrthographicCamera(
 -CFG.camView*aspect,CFG.camView*aspect,CFG.camView,-CFG.camView,.1,200);
const camT=new THREE.Vector3(20,0,16);
function syncCamera(){
 camera.position.copy(camT).add(CFG.camOffset);
 camera.lookAt(camT);
}
syncCamera();

const amb=new THREE.AmbientLight(0x6a4a3c,.6);scene.add(amb);
const moon=new THREE.DirectionalLight(0xff9a58,.5);
moon.position.set(8,36,2);moon.castShadow=true;
moon.shadow.mapSize.set(2048,2048);
Object.assign(moon.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:2,far:100});
moon.target.position.set(20,0,16);
scene.add(moon,moon.target);
// F10.13d: radius 9→3.5, intensity .9→.5 — cahaya personal tipis mengikuti
// char terpilih saja, tidak lagi membanjiri ruangan. (Yang menerangi ruangan
// selama ini = PointLight ini, bukan cone selector — cone MeshBasic tidak
// bisa emit light.)
const lantern=new THREE.PointLight(0xffc07a,0,3.5,2);
scene.add(lantern);
// F10.13e: dashed aqua ring bawah kaki char terpilih — indikator seleksi
// tanpa emit light (MeshBasic). 20 dash kotak disusun lingkaran R=.55,
// diputar kontinu pada sumbu Y. Y nanti di-set .095 di loop (di atas top
// lantai .08 supaya tidak tenggelam). Aqua 0x40e0d0 → bloom tipis.
const selRing=new THREE.Group();
{
 const rm=new THREE.MeshBasicMaterial({color:0x40e0d0});
 const rg=new THREE.BoxGeometry(.075,.015,.03);
 const N=12,R=.55;
 for(let i=0;i<N;i++){
  const a=i/N*Math.PI*2;
  const m=new THREE.Mesh(rg,rm);
  m.position.set(Math.cos(a)*R,0,Math.sin(a)*R);
  m.rotation.y=-a-Math.PI/2; // dash menyusun tangensial lingkaran
  selRing.add(m);
 }
}
selRing.visible=false;
scene.add(selRing);
const muzzleLight=new THREE.PointLight(0xffc890,0,7,2);scene.add(muzzleLight);
const fireLight=new THREE.PointLight(0xff8a40,0,7,2);
fireLight.position.set(FIREPIT.x+.3,.88,FIREPIT.z);scene.add(fireLight);
const candleLights=[];

let composer=null;
try{
 composer=new THREE.EffectComposer(renderer);
 composer.addPass(new THREE.RenderPass(scene,camera));
 composer.addPass(new THREE.UnrealBloomPass(
  new THREE.Vector2(innerWidth,innerHeight),
  CFG.bloom.strength,CFG.bloom.radius,CFG.bloom.threshold));
}catch(e){
 composer=null;
 reportErr('Bloom tidak aktif (script postprocessing gagal dimuat) — lanjut tanpa bloom.');
}
addEventListener('resize',()=>{
 aspect=innerWidth/innerHeight;
 camera.left=-CFG.camView*aspect;camera.right=CFG.camView*aspect;
 camera.updateProjectionMatrix();
 if(typeof jombCam!=='undefined'&&jombCam){jombCam.aspect=aspect;jombCam.updateProjectionMatrix();} // F12.11-B2
 renderer.setSize(innerWidth,innerHeight);
 if(composer)composer.setSize(innerWidth,innerHeight);
});
// ================= 6b. AUDIO ENGINE (F5, prosedural §23.8) =================
// Semua suara disintesis (oscillator + noise) — tanpa file aset, jalan di file://
// 3 bus: sfx/ui/bgm → nanti map ke 3 slider OPTIONS §23.1 (F12).
// File custom nanti: AUD.custom[name]=AudioBuffer → SFX otomatis pakai file.
const AUD={ctx:null,master:null,sfx:null,ui:null,bgm:null,
 noiseBuf:null,muted:false,bgmOn:false,last:{},custom:null,
 vol:{sfx:.8,bgm:.4,ui:.5}}; // F12.2: user-adjustable bus volumes (0..1)
// F12.2: load saved audio prefs — dijalankan sebelum initAudio agar bus pakai
// nilai benar sejak awal. Save key: mpz_options_v1.
try{
 const _raw=localStorage.getItem('mpz_options_v1');
 if(_raw){
  const _o=JSON.parse(_raw);
  if(_o&&typeof _o==='object'){
   if(typeof _o.sfx==='number')AUD.vol.sfx=clamp(_o.sfx,0,1);
   if(typeof _o.bgm==='number')AUD.vol.bgm=clamp(_o.bgm,0,1);
   if(typeof _o.ui==='number')AUD.vol.ui=clamp(_o.ui,0,1);
  }
 }
}catch(e){}
function initAudio(){
 if(AUD.ctx)return;
 const AC=window.AudioContext||window.webkitAudioContext;
 if(!AC)return;
 try{
  AUD.ctx=new AC();
  AUD.master=AUD.ctx.createGain();AUD.master.connect(AUD.ctx.destination);
  AUD.sfx=AUD.ctx.createGain();AUD.sfx.gain.value=AUD.vol.sfx;AUD.sfx.connect(AUD.master); // F12.2
  AUD.ui=AUD.ctx.createGain();AUD.ui.gain.value=AUD.vol.ui;AUD.ui.connect(AUD.master);   // F12.2
  AUD.bgm=AUD.ctx.createGain();AUD.bgm.gain.value=AUD.vol.bgm;AUD.bgm.connect(AUD.master); // F12.2 (bus; BGM aktual via el.volume)
  const len=AUD.ctx.sampleRate|0;
  AUD.noiseBuf=AUD.ctx.createBuffer(1,len,AUD.ctx.sampleRate);
  const d=AUD.noiseBuf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
 }catch(e){AUD.ctx=null;}
}
function resumeAudio(){
 if(!AUD.ctx)initAudio();
 if(AUD.ctx&&AUD.ctx.state==='suspended')AUD.ctx.resume();
 if(AUD.ctx&&!AUD.bgmOn)startBGM();
 loadCustomSFX();
 // F6: sting Night-1 yang terlewat — mainkan kalau banner masih tampil
 if(AUD.ctx&&S.stingPending){
  S.stingPending=false;
  if(night.phase==='intro')SFX('nightBegin');
 }
}
addEventListener('pointerdown',resumeAudio);
addEventListener('keydown',resumeAudio);
function toggleMute(){
 if(!AUD.ctx)initAudio();
 AUD.muted=!AUD.muted;
 if(AUD.master)AUD.master.gain.value=AUD.muted?0:1;
 for(const k in bgmTracks)bgmTracks[k].muted=AUD.muted;
 for(const k in sfxCustom){
  sfxCustom[k].el.muted=AUD.muted;
  if(sfxCustom[k].els)for(const e of sfxCustom[k].els)e.muted=AUD.muted; // F8a(3c)
 }
 toast(AUD.muted?'AUDIO MUTED':'AUDIO ON');
}
// ---- synth dasar ----
function _tone(f,dur,type,vol,bus,slide,dl){
 const t=AUD.ctx.currentTime+(dl||0),o=AUD.ctx.createOscillator(),g=AUD.ctx.createGain();
 o.type=type;o.frequency.setValueAtTime(f,t);
 if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),t+dur);
 g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 o.connect(g);g.connect(bus||AUD.sfx);o.start(t);o.stop(t+dur+.05);
}
function _noise(dur,vol,bus,fType,f0,f1,dl){
 const t=AUD.ctx.currentTime+(dl||0),s=AUD.ctx.createBufferSource();
 s.buffer=AUD.noiseBuf;s.loop=true;let n=s;
 if(f0){
  const f=AUD.ctx.createBiquadFilter();f.type=fType||'lowpass';
  f.frequency.setValueAtTime(f0,t);
  if(f1)f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  n.connect(f);n=f;
 }
 const g=AUD.ctx.createGain();
 g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 n.connect(g);g.connect(bus||AUD.sfx);s.start(t);s.stop(t+dur+.05);
}
function playCustom(name){ // F8a(3c): pool multi-instans — sound tidak saling menimpa
 const rec=AUD.custom&&AUD.custom[name];
 if(!rec)return;
 const vol=(SFX_VOL[name]!==undefined)?SFX_VOL[name]:.9;
 const pv=SFX_PITCH[name]||0;
 const pr=pv?1+rnd(-pv,pv):1;
 if(rec.buf&&AUD.ctx){ // jalur buffer (http)
  const s=AUD.ctx.createBufferSource();
  s.buffer=rec.buf;s.playbackRate.value=pr;
  const g=AUD.ctx.createGain();g.gain.value=vol;
  s.connect(g);g.connect(AUD.sfx);
  s.start();
 }else if(rec.el&&rec.el.ok){ // jalur element (file://) — POOL anti-timpa
  if(!rec.els)rec.els=[rec.el]; // fallback jika array belum ada
  let el=null;
  for(const e of rec.els)
   if(e.ok&&(e.ended||e.paused||e.currentTime===0)){el=e;break;}
  if(!el){
   if(rec.els.length<8){
    el=newAudio(SFX_FILES[name]); // elemen ekstra → instance sendiri
    el.preload='auto';el.volume=vol;
    el.addEventListener('canplaythrough',()=>{el.ok=true;});
    el.addEventListener('error',()=>{el.ok=false;});
    rec.els.push(el);
   }else{
    try{rec.el.currentTime=0;}catch(e){}
    el=rec.el;
   }
  }
  el.playbackRate=pr;el.volume=vol;
  el.play().catch(()=>{});
 }
}
// F9c: stop suara file yang sedang bermain (fail-safe burst terpotong).
// Berlaku utk suara single-instance (machinegun). Pool multi-instans diabaikan.
function sfxStop(name){
 const rec=AUD.custom&&AUD.custom[name];
 if(rec&&rec.els){
  for(const e of rec.els){try{e.pause();}catch(err){}}
  return;
 }
 if(rec&&rec.el){try{rec.el.pause();}catch(err){}}
}
function sfxHasCustom(name){
 const rec=AUD.custom&&AUD.custom[name];
 return!!(rec&&(rec.buf||(rec.el&&rec.el.ok)));
}
// F5b: audio dipindah ke folder terpisah — cascade: '../audio/' → 'audio/'
const AUD_DIRS=['audio/']; // F8: audio selalu di folder game — cascade parent dihapus
function newAudio(file){ // elemen audio + cascade folder otomatis
 const el=new Audio(AUD_DIRS[0]+file);
 let di=0;
 el.addEventListener('error',()=>{ // gagal? coba folder berikutnya
  di++;
  if(di<AUD_DIRS.length)el.src=AUD_DIRS[di]+file;
 });
 return el;
}
const SFX_FILES={shot:'pistol.mp3',reload:'reload.mp3',
 dualpistol:'dualpistol.mp3',heavypistol:'heavypistol.mp3',minismg:'minismg.mp3', // F8a(3c)
 reload_bambang:'reload_bambang.mp3',reload_rehan:'reload_rehan.mp3', // F8a(3c)
 reload_memet:'reload_memet.mp3',
 stepL:'step_l.mp3',stepR:'step_r.mp3',
 makeshift:'makeshift.mp3',reinforced:'reinforced.mp3',
 invOpen:'inv_open.mp3',invClose:'inv_close.mp3',
 built:'build.repair_finished.mp3',
 buildOpen:'build.craft_open.MP3',buildClose:'build.craft_close.MP3',
 nightBegin:'night_new.mp3',
 craftArmor:'craft_armor.mp3',craftHeal:'craft_heal.mp3',
 craft_stercloth:'craft_stercloth.mp3',craft_sardines:'craft_sardines.mp3',
 craft_noodles:'craft_noodles.mp3',craft_oatmeal:'craft_oatmeal.mp3',
 craft_chicken:'craft_chicken.mp3',craft_steak:'craft_steak.mp3',
 craft_medherbs:'craft_medherbs.mp3',craft_medkit:'craft_medkit.mp3',
 craft_spray:'craft_spray.mp3',craft_holywater:'craft_holywater.mp3',
 craft_denim:'craft_denim.mp3',craft_leather:'craft_leather.mp3',
 craft_military:'craft_military.mp3',craft_bandage:'craft_bandage.mp3',
 buildLantern:'build_lantern.mp3',buildBox:'build_box.mp3',
  boxOpen:'box_open.mp3',boxClose:'box_close.mp3',
 makeshiftDestroyed:'makeshift_destroyed.mp3',
 reinforcedDestroyed:'reinforced_destroyed.mp3',
 wallDestroyed:'wall_destroyed.mp3',
 hitBarricade:'hit_barricade.mp3',
 rescue:'rescue_appear.mp3',qteOk:'qte_correct.mp3',qteBad:'qte_wrong.mp3', // F8b §16 + FIX(7)
 charUnlock:'char_unlock.mp3',qteFail:'qte_fail.mp3',trap:'trap_reveal.mp3',
 machinegun:'machinegun.mp3',shotgun:'shotgun.mp3',grenadelauncher:'grenadelauncher.mp3', // F9a
 smg:'smg.mp3',semirifle:'semirifle.mp3',assaultrifle:'assaultrifle.mp3',
 reload_sobel:'reload_sobel.mp3',reload_vikry:'reload_vikry.mp3',
 reload_erry:'reload_erry.mp3',reload_ariz:'reload_ariz.mp3',
 reload_alvi:'reload_alvi.mp3',reload_reza:'reload_reza.mp3',
 semishotgun:'semishotgun.mp3',sniper:'sniper.mp3',marksman:'marksman.mp3', // F9a-2
 reload_lele:'reload_lele.mp3',reload_raptor:'reload_raptor.mp3',
 reload_hafid:'reload_hafid.mp3',
 alert:'alert.mp3',notice:'notice.mp3',
 blast:'blast.mp3',sticky:'sticky_tick.mp3', // F9c: ledakan Erry + timer sticky Hafid
 // F12.3: sound khusus elite/boss — fallback synth tetap ada kalau file belum ada
 alpha_roar:'alpha_roar.mp3',bloater_die:'bloater_die.mp3',
 bloater_gas:'bloater_gas.mp3',
 // F12.3: 3 varian zHit — dipilih acak via SFX_VARIANTS. Key 'zHit' tidak
 // punya entry di sini (biar sfxHasCustom('zHit')=false → fallback synth
 // tetap tersedia kalau ketiga varian hilang).
 zhit_1:'zhit_1.mp3',zhit_2:'zhit_2.mp3',zhit_3:'zhit_3.mp3',
 // F12.3b: batch-2 file audio baru (zombie/damage/skill/explosion/UI).
 // Semua case-sensitive lowercase di code; file user uppercase .MP3 tetap
 // ditemukan di Windows file://. Fallback synth tetap jalan kalau file hilang.
 zdie:'zdie.mp3',
 outbreak_cry:'outbreak_cry.mp3', // PZ skill 1 — pengganti SFX('roar') khusus
 skill:'skill.mp3',
 heal:'heal.mp3',eat:'eat.mp3',
 levelUp:'level_up.mp3',
 pickup:'pickup.mp3',
 trapSnap:'trap_snap.mp3',
 breach:'breach.mp3',collapse:'collapse.mp3',
 boom:'boom.mp3',incend:'incend.mp3',
 slam:'slam.mp3',swipe:'swipe.mp3',
 roar:'roar.mp3',rabid:'rabid.mp3',
 // F12.3c: 3 zombie skill sound terakhir (frenzy Sprinter, slash Sprinter
 // Rabid hit, pounce Creeper) — batch-2 sisa.
 frenzy:'frenzy.mp3',slash:'slash.mp3',pounce:'pounce.mp3',
 // F12.3d: sting transisi fase (Wave mulai / Elite spawn / Boss spawn).
 // Key camelCase mengikuti SFX('waveStart'/'bossSpawn'/'eliteSpawn').
 waveStart:'wave_start.mp3',bossSpawn:'boss_spawn.mp3',eliteSpawn:'elite_spawn.mp3',
 // F12.4: karakter kena hit — key 'charHurt' (was 'diazHurt', legacy F1 Diaz-only
 // sejak sebelum F7 multi-char). File tetap hit.mp3.
 charHurt:'hit.mp3',
 // F12.13: Spitter spit — pakai file gas.mp3 (fallback synth sudah ada di switch)
 gas:'gas.mp3'};
const SFX_VOL={shot:.9,reload:.9,stepL:.3,stepR:.3,
 makeshift:.8,reinforced:.85,invOpen:.55,invClose:.5,
 built:.85,buildOpen:.55,buildClose:.5,nightBegin:.8,
 craftArmor:.8,craftHeal:.7,
 craft_stercloth:.8,craft_sardines:.8,craft_noodles:.8,craft_oatmeal:.8,
 craft_chicken:.8,craft_steak:.8,craft_medherbs:.8,craft_medkit:.8,
 craft_spray:.8,craft_holywater:.8,craft_denim:.8,craft_leather:.8,
 craft_military:.8,craft_bandage:.8,buildLantern:.8,buildBox:.8,boxOpen:.6,boxClose:.6,
 makeshiftDestroyed:.85,reinforcedDestroyed:.85,wallDestroyed:.85,
 hitBarricade:.75,
 dualpistol:.9,heavypistol:.95,minismg:.8, // F8a(3c)
 reload_bambang:.9,reload_rehan:.9,reload_memet:.9,
 rescue:.8,qteOk:.5,qteBad:.6,charUnlock:.9,qteFail:.8,trap:.85, // F8b + FIX(6)
 machinegun:.9,shotgun:.95,grenadelauncher:.9,smg:.8,semirifle:.85,assaultrifle:.8, // F9a
 reload_sobel:.9,reload_vikry:.9,reload_erry:.9,reload_ariz:.9,reload_alvi:.9,reload_reza:.9,
 semishotgun:.95,sniper:.95,marksman:.85, // F9a-2
 reload_lele:.9,reload_raptor:.9,reload_hafid:.9,
 alert:.8,notice:.5,
 blast:.9,sticky:.4, // F9c
 alpha_roar:.9,bloater_die:.9,bloater_gas:.85, // F12.3
 zhit_1:.8,zhit_2:.8,zhit_3:.8, // F12.3: 3 varian zHit
 // F12.3b: volume untuk batch-2 file baru
 zdie:.9,
 outbreak_cry:.9,
 skill:.75,
 heal:.65,eat:.7,
 levelUp:.9,
 pickup:.6,
 trapSnap:.85,
 breach:.85,collapse:.85,
 boom:.9,incend:.9,
 slam:.95,swipe:.85,
 roar:.9,rabid:.8,
 // F12.3c: volume 3 zombie skill sound
 frenzy:.85,slash:.8,pounce:.85,
 // F12.3d: sting fase — boss paling dramatis (.95), wave start mid (.85),
 // elite spawn mid (.85)
 waveStart:.85,bossSpawn:.95,eliteSpawn:.85,
 // F12.4: hit feedback karakter — .85 cukup tegas tanpa mendominasi
 charHurt:.85,
 gas:.75}; // F12.13
const SFX_PITCH={stepL:.09,stepR:.09};
const GUN_SFX={bambang:'dualpistol',rehan:'heavypistol',memet:'minismg', // F8a(3c)
 sobel:'machinegun',vikry:'shotgun',erry:'grenadelauncher', // F9a
 ariz:'smg',alvi:'semirifle',reza:'assaultrifle',
 lele:'semishotgun',raptor:'sniper',hafid:'marksman'}; // F9a-2
const RELOAD_SFX={bambang:'reload_bambang',rehan:'reload_rehan',memet:'reload_memet',
 sobel:'reload_sobel',vikry:'reload_vikry',erry:'reload_erry', // F9a
 ariz:'reload_ariz',alvi:'reload_alvi',reza:'reload_reza',
 lele:'reload_lele',raptor:'reload_raptor',hafid:'reload_hafid'}; // F9a-2
const sfxCustom={};
for(const k in SFX_FILES){
 const el=newAudio(SFX_FILES[k]);
 el.preload='auto';el.volume=.8;el.ok=false;
 el.addEventListener('canplaythrough',()=>{el.ok=true;});
 el.addEventListener('error',()=>{el.ok=false;});
 sfxCustom[k]={el,buf:null};
}
AUD.custom=sfxCustom;
let sfxFilesLoaded=false;
function loadCustomSFX(){ // fetch+decode sekali (jalur http) — cascade folder juga
 if(sfxFilesLoaded||!AUD.ctx)return;
 sfxFilesLoaded=true;
 for(const k in SFX_FILES){
  const rec=sfxCustom[k];
  let i=0;
  const tryNext=()=>{
   if(i>=AUD_DIRS.length)return; // semua folder gagal → jalur element
   fetch(AUD_DIRS[i++]+SFX_FILES[k])
    .then(r=>{if(!r.ok)throw 0;return r.arrayBuffer();})
    .then(ab=>AUD.ctx.decodeAudioData(ab))
    .then(buf=>{rec.buf=buf;})
    .catch(tryNext);
  };
  tryNext();
 }
}
// F12.4: +charHurt .08 — cegah pileup saat beberapa zombie memukul bersamaan
// (atau Bloater boom kena 3 char sekaligus). 12.5 suara/detik masih sangat
// responsif, tapi tidak "crackle".
const SFX_THROTTLE={zHit:.07,hitBarricade:.15,thud:.15,pickup:.06,slash:.09,tick:.12,zone:.25,charHurt:.08};
// F12.3: variasi sound. SFX(base) → pilih acak dari varian yang punya file custom.
// Kalau tidak ada varian custom, fallback ke synth case(base). Throttle tetap
// dihitung pada base name (bukan varian) supaya laju maksimum konsisten.
const SFX_VARIANTS={zHit:['zhit_1','zhit_2','zhit_3']};
function SFX(name){
 if(!AUD.ctx||AUD.muted)return;
 // F12.3: throttle DIPINDAH ke paling atas. Sebelumnya throttle di bawah
 // sfxHasCustom → suara dengan file custom (mis. hitBarricade) tidak pernah
 // kena throttle. Sekarang konsisten untuk semua sound.
 const th=SFX_THROTTLE[name];
 if(th){const n=performance.now();
  if(AUD.last[name]&&n-AUD.last[name]<th*1000)return;AUD.last[name]=n;}
 // F12.3: dispatch varian — kalau ada minimal 1 file custom, pilih acak & rekursi.
 if(SFX_VARIANTS[name]){
  const avail=SFX_VARIANTS[name].filter(k=>sfxHasCustom(k));
  if(avail.length){SFX(pick(avail));return;}
 }
 if(sfxHasCustom(name)){playCustom(name);return;}
 switch(name){
  // ==== TEMPUR ====
  case 'shot':case 'dualpistol':case 'heavypistol':case 'minismg': // F8a(3c)
   _noise(.1,.5,null,'lowpass',2800,250);_tone(150,.09,'square',.22);break;
  case 'reload':_noise(.04,.3,null,'highpass',2200);_noise(.05,.35,null,'highpass',1600,null,.28);_tone(900,.03,'square',.1,null,null,.28);break;
  case 'zHit':_tone(220,.06,'triangle',.3,null,120);_noise(.05,.18,null,'bandpass',900);break;
  case 'zDie':_tone(160,.4,'sawtooth',.25,null,60);_noise(.25,.15,null,'lowpass',700,150);break;
  case 'charHurt':_tone(110,.18,'square',.3,null,70);_noise(.12,.2,null,'lowpass',500);break; // F12.4: rename dari diazHurt
  // ==== JEBAKAN & STRUKTUR ====
  case 'trapSnap':_tone(1400,.05,'square',.3,null,600);_noise(.06,.4,null,'highpass',3000);_tone(300,.15,'square',.25,null,150,.05);break;
  case 'boom':_noise(.6,.7,null,'lowpass',900,80);_tone(90,.5,'sine',.6,null,35);break;
  case 'incend':_noise(.5,.5,null,'bandpass',1200,300);_tone(70,.4,'sine',.4,null,30);break;
  case 'zone':_noise(.12,.2,null,'bandpass',2500,900);break;
  case 'hitBarricade':case 'thud': // fallback sama — beda sumber suara
   _tone(90,.12,'sine',.45,null,50);_noise(.08,.25,null,'lowpass',400);break;
  case 'breach':_noise(.8,.8,null,'lowpass',1200,60);_tone(55,.7,'sine',.7,null,28);break;
  case 'collapse':_noise(.4,.6,null,'lowpass',1500,200);_tone(120,.3,'square',.3,null,60);break;
  case 'built': // fanfare selesai
   _tone(700,.06,'square',.2);_tone(1000,.08,'square',.2,null,null,.12);_tone(1300,.1,'triangle',.25,null,null,.24);break;
  case 'makeshift': // fallback kerja: ketukan kayu
   _noise(.06,.3,null,'lowpass',900,300);_tone(210,.05,'square',.25);_tone(170,.06,'square',.18,null,null,.1);break;
  case 'reinforced': // fallback kerja: ketukan berat
   _noise(.09,.35,null,'lowpass',500,150);_tone(120,.08,'square',.3,null,80);break;
  // ==== SKILL ====
  case 'skill':_tone(300,.3,'sawtooth',.25,null,900);break;
  case 'gas':_noise(.8,.35,null,'bandpass',600,1400);break;
  case 'pounce':_noise(.25,.3,null,'bandpass',500,2200);_tone(200,.2,'triangle',.2,null,500);break;
  case 'frenzy':_tone(300,.25,'sawtooth',.3,null,150);_noise(.2,.25,null,'bandpass',1400);break;
  case 'rabid':_tone(500,.1,'sawtooth',.3,null,200);break;
  case 'slash':_noise(.09,.4,null,'highpass',3500,1500);break;
  case 'outbreak':_tone(70,.8,'sawtooth',.4,null,45);_noise(.7,.3,null,'lowpass',300,100);break;
  case 'swipe':_noise(.3,.45,null,'bandpass',900,2500);break;
  case 'roar':_tone(160,.9,'sawtooth',.5,null,55);_tone(163,.9,'sawtooth',.4,null,58);_noise(.8,.4,null,'lowpass',900,150);break;
  case 'slam':_tone(60,.5,'sine',.7,null,30);_noise(.45,.6,null,'lowpass',700,90);break;
  // F12.3: fallback synth utk 3 sound elite/boss baru (kalau file mp3 belum ada).
  // Konten = copy dari case 'roar'/'gas'/'boom' asli agar transisi mulus saat
  // file ditambahkan (sound karakter konsisten).
  case 'alpha_roar':_tone(160,.9,'sawtooth',.5,null,55);_tone(163,.9,'sawtooth',.4,null,58);_noise(.8,.4,null,'lowpass',900,150);break;
  case 'bloater_gas':_noise(.8,.35,null,'bandpass',600,1400);break;
  case 'bloater_die':_noise(.6,.7,null,'lowpass',900,80);_tone(90,.5,'sine',.6,null,35);_noise(.8,.35,null,'bandpass',600,1400);break;
  // ==== STATUS ====
  case 'stun':_tone(1200,.08,'sine',.3);_tone(900,.1,'sine',.3,null,null,.09);break;
  case 'slow':_tone(600,.15,'triangle',.25,null,380);break;
  case 'burn':_noise(.3,.25,null,'bandpass',2000,700);break;
  case 'mark':_tone(1500,.07,'sine',.2);break;
  // ==== FASE ====
  case 'nightBegin':_tone(87,.9,'sawtooth',.35,null,82);_tone(131,.9,'sawtooth',.25,null,80);_noise(.8,.15,null,'lowpass',300);break;
  case 'waveStart':_tone(220,.25,'square',.25);_tone(330,.3,'square',.2,null,null,.15);break;
  case 'nightPass':_tone(392,.25,'triangle',.3);_tone(494,.25,'triangle',.3,null,null,.18);_tone(587,.5,'triangle',.35,null,null,.36);break;
  case 'prepStart':_tone(523,.3,'sine',.25);_tone(659,.45,'sine',.2,null,null,.2);break;
  case 'bossSpawn':_tone(120,.9,'sawtooth',.5,null,60);_tone(55,1.1,'sine',.6,null,40);_noise(.9,.35,null,'lowpass',700,120);break;
  case 'eliteSpawn':_tone(200,.5,'sawtooth',.35,null,120);_noise(.4,.2,null,'lowpass',800,200);break;
  case 'defeat':_tone(300,.6,'sawtooth',.35,null,150);_tone(150,.9,'sawtooth',.3,null,70,.3);break;
  // ==== UI ====
  case 'pickup':_tone(880,.06,'square',.18);_tone(1320,.08,'square',.15,null,null,.07);break;
  case 'levelUp':_tone(523,.1,'triangle',.3);_tone(659,.1,'triangle',.3,null,null,.1);_tone(784,.1,'triangle',.3,null,null,.2);_tone(1047,.25,'triangle',.35,null,null,.3);break;
  case 'tick':_tone(1000,.03,'square',.1,AUD.ui);break;
  case 'click':_tone(600,.05,'square',.2,AUD.ui);break;
  case 'heal':_tone(600,.15,'sine',.3,null,900);_tone(900,.2,'sine',.25,null,1200,.12);break;
  case 'craftArmor':
   _tone(160,.14,'square',.4);_tone(320,.1,'square',.3,null,160,.12);
   _tone(480,.18,'triangle',.32,null,640,.22);break;
  case 'craftHeal':
   _tone(520,.1,'sine',.3);_tone(660,.1,'sine',.28,null,null,.1);
   _tone(880,.2,'sine',.3,null,1040,.2);break;
  case 'boxOpen':_noise(.12,.3,null,'lowpass',900,300);_tone(320,.06,'square',.2);break;
  case 'boxClose':_tone(140,.08,'square',.3,null,80);_noise(.06,.25,null,'lowpass',500,150);break;
  case 'buildLantern':_tone(500,.06,'square',.25);_tone(800,.08,'triangle',.3,null,null,.1);break;
  case 'buildBox':_tone(120,.1,'square',.35,null,60);_noise(.08,.3,null,'lowpass',400,100);break;
  case 'makeshiftDestroyed':
   _noise(.4,.6,null,'lowpass',1200,150);_tone(100,.25,'square',.3,null,50);break;
  case 'reinforcedDestroyed':
   _noise(.5,.7,null,'lowpass',900,80);_tone(80,.35,'sine',.5,null,35);break;
  case 'wallDestroyed':
   _noise(.8,.8,null,'lowpass',1200,60);_tone(55,.7,'sine',.7,null,28);break;
  case 'eat':_noise(.2,.3,null,'lowpass',1200,400);_tone(240,.08,'square',.2,null,180);break;
  case 'invOpen':_tone(520,.06,'square',.15,AUD.ui);_tone(780,.07,'square',.12,AUD.ui,null,.07);break;
  case 'invClose':_tone(680,.06,'square',.12,AUD.ui);_tone(450,.09,'square',.12,AUD.ui,null,.08);break;
  case 'buildOpen':_tone(400,.06,'square',.15,AUD.ui);_tone(600,.08,'square',.12,AUD.ui,null,.07);break;
  case 'buildClose':_tone(560,.06,'square',.12,AUD.ui);_tone(370,.09,'square',.12,AUD.ui,null,.08);break;
  case 'stepL':case 'stepR': // fallback: langkah pelan
   _noise(.07,.12,null,'lowpass',600,200);_tone(95,.05,'sine',.1,null,60);break;
  // ==== F8b: RESCUE & QTE (§16) ====
  case 'rescue':_tone(880,.12,'square',.3);_tone(660,.1,'square',.25,null,null,.14);
   _tone(880,.18,'square',.3,null,null,.3);break; // panggilan 3 nada "HELP!"
  case 'qteOk':_tone(1046,.05,'square',.25,AUD.ui);break;
  case 'qteBad':_tone(180,.18,'sawtooth',.35,null,90);break;
  case 'charUnlock': // FIX(6) fallback fanfare — file utk produksi
   _tone(392,.14,'triangle',.3);_tone(494,.14,'triangle',.3,null,null,.12);
   _tone(587,.16,'triangle',.32,null,null,.26);_tone(784,.34,'triangle',.34,null,null,.42);
   _tone(988,.5,'sine',.3,null,null,.42);break;
  case 'qteFail':_tone(300,.5,'sawtooth',.35,null,90);_tone(150,.7,'sawtooth',.3,null,60,.25);break;
  case 'trap':_tone(70,.8,'sawtooth',.5,null,45);_noise(.7,.4,null,'lowpass',800,120);break;
  // ==== F9a: SENJATA 6 RARE ====
  case 'machinegun':_noise(.35,.5,null,'lowpass',2200,350);_tone(130,.3,'square',.3,null,70);break;
  case 'shotgun':_noise(.22,.6,null,'lowpass',1500,180);_tone(110,.18,'sine',.5,null,45);break;
  case 'grenadelauncher':_tone(150,.14,'sine',.5,null,55);_noise(.1,.3,null,'lowpass',600,150);break;
  case 'smg':_noise(.1,.5,null,'lowpass',2600,250);_tone(160,.09,'square',.22);break;
  case 'semirifle':_noise(.12,.55,null,'bandpass',1800,600);_tone(220,.1,'square',.3,null,90);break;
  case 'assaultrifle':_noise(.18,.5,null,'lowpass',2400,300);_tone(170,.12,'square',.25,null,120);break;
  case 'reload_sobel':case 'reload_vikry':case 'reload_erry':case 'reload_ariz':
  case 'reload_alvi':case 'reload_reza': // fallback = pola reload generik
  case 'reload_lele':case 'reload_raptor':case 'reload_hafid': // F9a-2
   _noise(.04,.3,null,'highpass',2200);_noise(.05,.35,null,'highpass',1600,null,.28);
   _tone(900,.03,'square',.1,null,null,.28);break;
  // ==== F9a-2: SENJATA 3 SUPER RARE ====
  case 'semishotgun':_noise(.24,.6,null,'lowpass',1600,150);_tone(120,.2,'sine',.5,null,40);break;
  case 'sniper':_noise(.3,.55,null,'highpass',1800,300);_tone(240,.25,'sine',.45,null,50);break; // crack tajam
  case 'marksman':_noise(.16,.5,null,'bandpass',1600,500);_tone(190,.12,'square',.28,null,80);break;
  case 'alert': // FIX(29): fallback — dua nada turun tajam
   _tone(700,.09,'square',.3,null,520);_tone(520,.14,'square',.3,null,380,.1);break;
  case 'notice': // FIX(29): fallback — dua tik lembut naik
   _tone(620,.06,'sine',.22);_tone(830,.08,'sine',.2,null,null,.07);break;
  case 'blast':_noise(.5,.65,null,'lowpass',1000,90);_tone(85,.45,'sine',.55,null,32);break; // F9c
  case 'sticky':_tone(980,.04,'square',.14);break; // F9c: tick timer bomb
 }
}
// ---- BGM: PER-WAVE PLAYLIST (final) ----
// Track per fase, semuanya OPSIONAL — file hilang = fase diam.
// bgm.mp3 = fallback: mengisi fase yang track-nya tidak ada.
// Intro & dawn tanpa musik — stingers nightBegin/nightPass ambil alih.
// Element-only: streaming (hemat RAM), jalan di file:// & http.
const BGM_FILES={w1:'bgm_w1.mp3',w2:'bgm_w2.mp3',w3:'bgm_w3.mp3',w4:'bgm_w4.mp3',
 pause:'bgm_pause.mp3',prep:'bgm_prep.mp3',defeat:'defeat.mp3',single:'bgm.mp3',
 menu:'main_menu.mp3'}; // F12.4e: BGM main menu
const bgmTracks={};
for(const k in BGM_FILES){
 const el=newAudio(BGM_FILES[k]);
 el.loop=true;el.volume=0;el.preload='auto';el.ok=false;
 el.addEventListener('canplaythrough',()=>{el.ok=true;});
 el.addEventListener('error',()=>{el.ok=false;});
 bgmTracks[k]=el;
}
let bgmCur=null,bgmCurKey=null;
function bgmAvail(k){const el=bgmTracks[k];return!!(el&&(el.ok||el.readyState>=2));}
function bgmFade(el,to,dur,done){
 if(el._iv)clearInterval(el._iv);
 const from=el.volume,steps=Math.max(1,Math.round(dur/.05));
 let i=0;
 el._iv=setInterval(()=>{
  i++;el.volume=clamp(from+(to-from)*i/steps,0,1);
  if(i>=steps){clearInterval(el._iv);el._iv=null;if(done)done();}
 },50);
}
function bgmResolve(){ // track untuk fase sekarang (null = diam)
 // F12.4e: state MENU → main_menu.mp3 (fallback single kalau tidak ada)
 if(S.state==='menu')return bgmAvail('menu')?'menu':(bgmAvail('single')?'single':null);
 const ph=night.phase;
 // F12.8e: deploy (15 dtk pilih squad sebelum Night 1) = SUNYI total.
 // Sebelumnya pakai bgm_prep → inkonsisten dgn RESTART (yang lewat
 // bgmRestart → silent). bgm_prep kini hanya untuk phase 'prep' (5 menit
 // antar-night). Menu BGM hanya state==='menu'.
 if(ph==='deploy')return null;
 if(ph==='intro'||ph==='dawn')return null;
 const key=ph==='wave'?('w'+(night.wave+1)):ph;
 if(bgmAvail(key))return key;
 return bgmAvail('single')?'single':null;
}
function bgmSwitch(key){ // ganti track: fade out lama → fade in baru
 // F12.4f: debug log — bantu diagnosa "BGM tidak play" (file hilang / policy).
 if(key&&key!==bgmCurKey){
  const el=bgmTracks[key];
  console.log('[BGM] switch→'+key, el?('readyState='+el.readyState+' ok='+el.ok):'(no track)');
 }
 if(key===bgmCurKey)return;
 const old=bgmCur;
 if(old)bgmFade(old,0,.35,()=>old.pause());
 bgmCurKey=key;
 const el=key?bgmTracks[key]:null;
 if(!el){bgmCur=null;return;}
 bgmCur=el;
 try{el.currentTime=0;}catch(e){}
 el.play().then(()=>bgmFade(el,AUD.vol.bgm,.5))
  .catch(err=>{console.warn('[BGM] play rejected:',err);
   bgmCur=null;bgmCurKey=null;});
}
function bgmSync(){ // hook fase: resolve track sesuai fase malam
 if(!AUD.bgmOn)return;
 bgmSwitch(bgmResolve());
}
function bgmDefeat(){ // track kematian — fallback hening kalau file tak ada
 if(!AUD.bgmOn)return;
 if(bgmAvail('defeat'))bgmSwitch('defeat');
 else bgmPause(true);
}
function bgmRestart(){ // malam baru: musik berhenti, sting ambil alih
 if(!AUD.bgmOn)return;
 if(bgmCur){const el=bgmCur;bgmFade(el,0,.4,()=>el.pause());}
 bgmCur=null;bgmCurKey=null;
}
function bgmPause(p){ // ESC/defeat: pause-resume posisi persis
 if(!AUD.bgmOn||!bgmCur)return;
 if(p)bgmCur.pause();
 else bgmCur.play().catch(()=>{});
}
function startBGM(){
 if(!AUD.ctx||AUD.bgmOn)return;
 AUD.bgmOn=true;
 bgmSync(); // mulai dari fase yang sedang berjalan
}
// F12.2: terapkan AUD.vol ke bus/gain aktif. Dipanggil slider handler.
// BGM pakai HTMLAudioElement (el.volume) bukan AUD.bgm bus — hentikan fade
// yang sedang berjalan agar nilai baru tidak "dilawan" interpolasi lama.
function applyAudioVol(){
 if(AUD.sfx)AUD.sfx.gain.value=AUD.vol.sfx;
 if(AUD.ui)AUD.ui.gain.value=AUD.vol.ui;
 if(bgmCur){
  if(bgmCur._iv){clearInterval(bgmCur._iv);bgmCur._iv=null;}
  bgmCur.volume=AUD.vol.bgm;
 }
}
function saveAudioPrefs(){
 try{localStorage.setItem('mpz_options_v1',JSON.stringify(AUD.vol));}catch(e){}
}
// ================= 7. MEMBANGUN DUNIA (blocky) =================
const wallMat=new THREE.MeshPhongMaterial({color:0x4a3827,shininess:0,specular:0x000000});
const inWallMat=new THREE.MeshPhongMaterial({color:0x6e6250,shininess:0,specular:0x000000});
const woodMats=[0x5a4430,0x54402c,0x4e3a28].map(c=>new THREE.MeshLambertMaterial({color:c}));
const concMats=[0x484744,0x42413e].map(c=>new THREE.MeshLambertMaterial({color:c}));
const greyMat=new THREE.MeshLambertMaterial({color:0x4a4741});
const whiteMat=new THREE.MeshLambertMaterial({color:0xd8d4cc});
const panelMat=new THREE.MeshLambertMaterial({color:0xb8b4ae});
const trunkMat=new THREE.MeshLambertMaterial({color:0x33261a});
const leafMat =new THREE.MeshLambertMaterial({color:0x1e3020});
let fireMesh=null;
const wallMeshes=new Map(); // F5: registrasi mesh tembok utk sistem jebol
(function buildWorld(){
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(96,96),
  new THREE.MeshLambertMaterial({color:0x232d1a}));
 ground.rotation.x=-Math.PI/2;ground.position.set(20,0,16);
 ground.receiveShadow=true;scene.add(ground);
 {
  const pts=[];
  for(let x=0;x<=CFG.gridW;x++)pts.push(x,0,0,x,0,CFG.gridH);
  for(let z=0;z<=CFG.gridH;z++)pts.push(0,0,z,CFG.gridW,0,z);
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
  scene.add(new THREE.LineSegments(g,
   new THREE.LineBasicMaterial({color:0x22301c,transparent:true,opacity:.35})));
 }
 const box=(w,h,d,mat,x,y,z,shadow)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);
  if(shadow!==false){m.castShadow=true;m.receiveShadow=true;}
  return m;
 };
 const isWallC=v=>v==='X'||v==='#';
 const furnRot=(c,x,y)=>{
  if(c==='c'){
   if(cellAt(x+1,y)==='t')return Math.PI/2;
   if(cellAt(x-1,y)==='t')return -Math.PI/2;
   if(cellAt(x,y-1)==='t')return Math.PI;
   return 0;
  }
  if(c==='D'){
   if(isWallC(cellAt(x+1,y)))return -Math.PI/2;
   if(isWallC(cellAt(x-1,y)))return Math.PI/2;
   if(isWallC(cellAt(x,y+1)))return Math.PI;
   return 0;
  }
  // F10.7: dapur tembok barat — `u` (10,8) & `n` (10,9) menghadap TIMUR (π/2).
  // (10,7) adalah ujung kiri baris nnk_nn → tetap 0 (selatan).
  // Konvensi: 0 = selatan (+Z), π/2 = timur (+X).
  if((c==='n'||c==='u')&&x===10&&y>=8&&y<=9)return Math.PI/2;
  // F10.7b: nightstand ruang makan (25,8) — tembok barat (#) → menghadap timur.
  if(c==='n'&&x===25&&y===8)return Math.PI/2;
  // F10.10.1b: nightstand corridor (14,23) — selatan wall (14,24)=X, drawer
  // default (south) akan clip ke wall. Rotate π/2 (east) → drawer ke (15,23)=_
  if(c==='n'&&x===14&&y===23)return Math.PI/2;
  // F10.10.1c: nightstand (12,9) — selatan = (12,10)=n → drawer clip. Rotate
  // π/2 (east) → drawer ke (13,9)=_ (corridor free).
  if(c==='n'&&x===12&&y===9)return Math.PI/2;
  // F10.11b: sofa lounge vertikal (17,8-10) — menghadap TIMUR (π/2). Backrest
  // jadi di barat (menempel wall # col 16), seat menghadap koridor tengah.
  if(c==='s'&&x===17&&y>=8&&y<=10)return Math.PI/2;
  return 0;
 };
 for(let y=0;y<CFG.gridH;y++)for(let x=0;x<CFG.gridW;x++){
  const c=GRID[y][x],wx=x+.5,wz=y+.5;
  if(c==='_'||c==='C'||c==='o'||c==='e'||c==='d'||c==='w'||FURN.includes(c)){ // F12.5b: +C — render tile sama seperti _
   const mat=(x>=25&&x<=29&&y>=16&&y<=23)
    ?concMats[(x*5+y*7)%2]:woodMats[(x*7+y*3)%3];
   scene.add(box(.98,.08,.98,mat,wx,.04,wz,false));
  }
  // F10.8: path beige — plane tipis di atas ground plane. Variasi per-cell
  // ±5% color biar tidak flat (organic). Y=.05 biar di atas ground (0.04).
  if(c==='p'){
   // F10.8b: warna dirt — coklat medium, distinct dari wall (0x4a3827) &
   // lantai kayu (0x5a4430). Tidak terlalu terang agar menyatu dengan ground
   // gelap (0x232d1a) tapi tetap jelas sebagai "jalan".
   const pathMat=new THREE.MeshLambertMaterial({color:0x6a5a3a});
   scene.add(box(.98,.06,.98,pathMat,wx,.05,wz,false));
  }
  if(c==='X'){
   const m=box(1,2,1,wallMat,wx,1,wz);scene.add(m);wallMeshes.set(x+','+y,m);
  }else if(c==='#'){
   const m=box(1,2,1,inWallMat,wx,1,wz);scene.add(m);wallMeshes.set(x+','+y,m);
  }else if(c==='w'){
   const g=new THREE.Group();
   g.add(box(.24,2,.3,greyMat,-.38,1,0));
   g.add(box(.24,2,.3,greyMat,.38,1,0));
   g.add(box(.52,.35,.3,greyMat,0,1.825,0));
   g.add(box(.52,.3,.34,greyMat,0,.15,.02));
   if(!wallEW(x,y))g.rotation.y=Math.PI/2;
   g.position.set(wx,0,wz);scene.add(g);
  }else if(c==='d'){
   const g=new THREE.Group();
   g.add(box(.24,2,.3,wallMat,-.38,1,0));
   g.add(box(.24,2,.3,wallMat,.38,1,0));
   g.add(box(.52,.35,.3,wallMat,0,1.825,0));
   if(!wallEW(x,y))g.rotation.y=Math.PI/2;
   g.position.set(wx,0,wz);scene.add(g);
  }else if(c==='g'){
   const g=new THREE.Group();
   g.add(box(1,2,.3,whiteMat,0,1,0));
   g.add(box(1,.08,.34,panelMat,0,.5,0));
   g.add(box(1,.08,.34,panelMat,0,1.05,0));
   g.add(box(1,.08,.34,panelMat,0,1.6,0));
   if(!wallEW(x,y))g.rotation.y=Math.PI/2;
   g.position.set(wx,0,wz);scene.add(g);
  }else if(c==='F'&&((x*13+y*7)%5<3)){
   const t=new THREE.Group();
   t.add(box(.22,.9,.22,trunkMat,0,.45,0),
         box(1.05,.75,1.05,leafMat,0,1.3,0),
         box(.62,.5,.62,leafMat,0,1.9,0));
   t.position.set(wx+rnd(-.15,.15),0,wz+rnd(-.15,.15));
   t.scale.setScalar(rnd(.85,1.25));scene.add(t);
  }else if(FURN.includes(c)){
   const fg=new THREE.Group();
   if(c==='B'||c==='b'){
    fg.add(box(.98,.32,.98,new THREE.MeshLambertMaterial({color:0x9a8a70}),0,.2,0));
    if(c==='B'){
     fg.add(box(.42,.12,.5,new THREE.MeshLambertMaterial({color:0x8a3a30}),0,.42,-.2));
     fg.add(box(.98,.55,.14,woodMats[0],0,.5,-.42));
    }
   }else if(c==='D'){
    fg.add(box(.9,1.3,.6,woodMats[0],0,.65,0));      // body desk
    fg.add(box(.78,.05,.62,woodMats[2],0,1.325,0));  // top accent
    // F10.7b: 2 drawer + handle di +Z → "depan" D = +Z (selatan default).
    // Existing rule rotate π/2 (tembok west) → depan mengarah timur sesuai permintaan.
    {const dmat=woodMats[1],hmat=new THREE.MeshLambertMaterial({color:0x2a2a2a});
     fg.add(box(.70,.28,.02,dmat,0,.95,.305));  // drawer atas
     fg.add(box(.70,.28,.02,dmat,0,.55,.305));  // drawer bawah
     fg.add(box(.10,.03,.03,hmat,0,.95,.33));   // handle atas
     fg.add(box(.10,.03,.03,hmat,0,.55,.33));}  // handle bawah
    // F10.10.4: 2 buku (merah + hijau tumpuk) + 1 kertas di atas desk.
    // Top accent di y 1.325 (top at 1.35). Buku mulai dari y 1.385.
    {const bRed=new THREE.MeshLambertMaterial({color:0x8a2a20});
     const bGrn=new THREE.MeshLambertMaterial({color:0x2a4a2a});
     const papr=new THREE.MeshLambertMaterial({color:0xf0e8d0});
     fg.add(box(.32,.06,.22,bRed,-.20,1.39,.06));   // buku merah
     fg.add(box(.28,.05,.20,bGrn,-.17,1.445,.04));  // buku hijau di atas
     fg.add(box(.16,.008,.20,papr,.24,1.355,-.04)); // kertas
    }
   }else if(c==='k'){
    fg.add(box(.95,.7,.95,new THREE.MeshLambertMaterial({color:0x3a3a3e}),0,.35,0));
    fg.add(box(.9,.06,.9,new THREE.MeshLambertMaterial({color:0x232326}),0,.73,0));
   }else if(c==='n'){
    fg.add(box(.98,.7,.98,woodMats[1],0,.35,0));
   }else if(c==='t'){
    fg.add(box(.98,.1,.98,woodMats[0],0,.6,0));
    fg.add(box(.7,.5,.7,woodMats[2],0,.3,0));
    // F10.10.4: plate + gelas — hanya di table yang (x+y)%2===0, biar sebar merata
    // di cluster 2×2 (dining room punya 4 table cell). Table top di y .65,
    // plate di .68, gelas di .77.
    if((x+y)%2===0){
     const pMat=new THREE.MeshLambertMaterial({color:0xe8e4d8});
     const gMat=new THREE.MeshLambertMaterial({color:0xa0c0d0});
     const p=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.03,8),pMat);
     p.position.set(rnd(-.22,.22),.68,rnd(-.22,.22));fg.add(p);
     const g=new THREE.Mesh(new THREE.CylinderGeometry(.042,.042,.14,6),gMat);
     g.position.set(rnd(-.30,.30),.77,rnd(-.30,.30));fg.add(g);
    }
   }else if(c==='c'){
    fg.add(box(.5,.1,.5,woodMats[1],0,.38,0));
    fg.add(box(.5,.35,.08,woodMats[1],0,.6,-.21));
   }else if(c==='s'){
    const sMat=new THREE.MeshLambertMaterial({color:0x7a4a3a});
    const sDark=new THREE.MeshLambertMaterial({color:0x6a3c30});
    fg.add(box(.98,.35,.98,sMat,0,.22,0));      // seat
    fg.add(box(.98,.36,.18,sDark,0,.58,-.4));   // backrest (lokal -Z, menghadap +Z)
    // F10.11b: sofa rotated (17,8-10) → armrest cek tetangga VERTIKAL (world -Z/+Z).
    // Sofa default → armrest cek tetangga HORIZONTAL (world -X/+X). Posisi box
    // armrest tetap di lokal (-.41/+.41, .44, 0) — rotasi fg yang mengubah world.
    const rotSofa=(x===17&&y>=8&&y<=10);
    const cL=rotSofa?cellAt(x,y+1):cellAt(x-1,y); // armrest lokal -X → world +Z (rotated) atau -X (default)
    const cR=rotSofa?cellAt(x,y-1):cellAt(x+1,y); // armrest lokal +X → world -Z (rotated) atau +X (default)
    if(cL!=='s')fg.add(box(.16,.32,.92,sDark,-.41,.44,0));
    if(cR!=='s')fg.add(box(.16,.32,.92,sDark,.41,.44,0));
   }else if(c==='f'){
    const stone=new THREE.MeshLambertMaterial({color:0x8a8478});
    const stoneD=new THREE.MeshLambertMaterial({color:0x6e6a62});
    const soot=new THREE.MeshLambertMaterial({color:0x201d19});
    fg.add(box(.84,1.9,.24,stone,0,.95,-.38));
    fg.add(box(.84,1.9,.24,stone,0,.95,.38));
    fg.add(box(.84,.5,.96,stone,0,1.65,0));
    fg.add(box(.96,.12,1.04,stoneD,0,1.93,0));
    fg.add(box(.2,1.4,.48,soot,-.31,.7,0));
    fg.add(box(.84,.07,.48,stoneD,0,.035,0));
    fg.add(box(.44,.13,.13,woodMats[1],.02,.14,-.1));
    fg.add(box(.44,.13,.13,woodMats[2],.02,.14,.09));
    const logC=box(.4,.12,.12,woodMats[0],.04,.27,0);logC.rotation.y=.18;fg.add(logC);
    fireMesh=new THREE.Group();
    fireMesh.add(box(.3,.42,.22,new THREE.MeshBasicMaterial({color:0xff8a30}),.2,.52,0,false),
                 box(.16,.26,.13,new THREE.MeshBasicMaterial({color:0xffd070}),.24,.7,.02,false),
                 box(.11,.13,.09,new THREE.MeshBasicMaterial({color:0xfff0b0}),.16,.32,-.02,false));
    fireMesh.position.set(FIREPIT.x,.08,FIREPIT.z);
    fireMesh.visible=false;scene.add(fireMesh);
   }else if(c==='a'){
    fg.add(box(.98,.08,.98,whiteMat,0,.78,0));
    fg.add(box(.9,.05,.8,panelMat,0,.35,0));
    const lx=(cellAt(x-1,y)==='a')?.32:-.32;
    fg.add(box(.12,.74,.12,panelMat,lx,.37,-.32));
    fg.add(box(.12,.74,.12,panelMat,lx,.37,.32));
   }else if(c==='u'){
    fg.add(box(.95,.4,.95,new THREE.MeshLambertMaterial({color:0xb0b0a8}),0,.2,0));
    fg.add(box(.72,.1,.72,new THREE.MeshLambertMaterial({color:0x8898a0}),0,.4,0));
    // F10.7: faucet di −Z (belakang) → "depan" sink = +Z (selatan default).
    // Setelah rot π/2 (barat dapur), faucet menghadap barat-tembok, bowl ke timur.
    {const fmat=new THREE.MeshLambertMaterial({color:0x9a9a94});
     fg.add(box(.06,.20,.06,fmat,0,.51,-.36)); // post belakang
     fg.add(box(.06,.04,.24,fmat,0,.61,-.26)); // spout horizontal ke depan
     fg.add(box(.08,.06,.08,fmat,0,.58,-.16));} // tip di atas bowl
   }else if(c==='T'){
    // F10.10.1: toilet — tank belakang (−Z) + bowl depan (+Z) + flush handle.
    // Default rot 0 = menghadap SELATAN. Toilet (11,22) → tank menempel wall
    // utara (11,21)=# saat rot 0. World y origin fg=.08, toilet bottom = .08.
    const ceram=new THREE.MeshLambertMaterial({color:0xf0f0e8});
    fg.add(box(.32,.42,.22,ceram,0,.21,-.28));   // tank belakang
    fg.add(box(.30,.32,.34,ceram,0,.16,.04));    // bowl
    fg.add(box(.34,.04,.38,ceram,0,.34,.04));    // seat
    fg.add(box(.10,.05,.08,ceram,0,.44,-.15));   // flush handle di atas tank
   }else if(c==='W'){
    // F10.10.1: shower tile — tile tipis DI ATAS floor plane (floor top=.08 world,
    // tile top ≈ .10 world). Drain + pipa vertikal menempel wall barat (kolom 9=X),
    // shower head menyembur dari atas. W walkable di passChar/passZomb/passBig.
    const tile=new THREE.MeshLambertMaterial({color:0xa8b8b8});
    const dark=new THREE.MeshLambertMaterial({color:0x3a3a3a});
    const silver=new THREE.MeshLambertMaterial({color:0x9a9a94});
    fg.add(box(.92,.03,.92,tile,0,.015,0));       // tile base (top world .095)
    fg.add(box(.10,.02,.10,dark,0,.04,0));        // drain di tengah
    fg.add(box(.05,1.15,.05,silver,-.40,.575,-.40)); // pipa vertikal sudut barat-laut
    fg.add(box(.22,.05,.22,silver,-.40,1.15,-.35)); // shower head menyembur
   }
   fg.rotation.y=furnRot(c,x,y);
   fg.position.set(wx,.08,wz);
   scene.add(fg);
  }else if(c==='e'){
   const dd=[[0,-1],[0,1],[-1,0],[1,0]].find(v=>isWallC(cellAt(x+v[0],y+v[1])));
   if(dd){
    const cg=new THREE.Group();
    cg.add(box(.14,.04,.14,new THREE.MeshLambertMaterial({color:0x8a6a42}),0,0,0,false));
    cg.add(box(.06,.3,.06,new THREE.MeshLambertMaterial({color:0xd8c9a0}),0,.17,0,false));
    const fl=new THREE.Mesh(new THREE.BoxGeometry(.08,.1,.08),
     new THREE.MeshBasicMaterial({color:0xffd070}));
    fl.position.y=.37;cg.add(fl);
    cg.position.set(wx+dd[0]*.42,1.0,wz+dd[1]*.42);
    const ang=35*Math.PI/180;
    if(dd[1]!==0)cg.rotation.x=dd[1]<0?ang:-ang;
    else cg.rotation.z=dd[0]<0?-ang:ang;
    scene.add(cg);
    const L2=new THREE.PointLight(0xffb454,.7,8,2);
    L2.position.set(wx+dd[0]*.15,1.25,wz+dd[1]*.15);
    L2.userData.base=.7;scene.add(L2);candleLights.push(L2);
   }
  }
 }
})();

// ========== 7b. F10.10.5: ENVIRONMENTAL DECORATION (poster + koran) ==========
(function decoWorld(){
 // Poster texture via canvas — 4 varian: muster (signpost Z), missing (orang
 // hilang), warning (jangan keluar malam), sign (shelter zone). Pudar + noise
 // supaya terkesan usang.
 const makePosterTex=(kind)=>{
  const cv=document.createElement('canvas');cv.width=128;cv.height=96;
  const c=cv.getContext('2d');
  c.fillStyle='#c8b890';c.fillRect(0,0,128,96);            // dasar kertas
  for(let i=0;i<50;i++){                                    // noise pudar
   c.fillStyle='rgba(40,30,15,'+(rnd(.04,.22)).toFixed(2)+')';
   c.fillRect(rnd(0,128),rnd(0,96),rnd(2,12),rnd(2,10));
  }
  c.textAlign='center';
  if(kind==='muster'){
   c.fillStyle='#8a2a20';c.font='bold 20px monospace';
   c.fillText('MUSTER',64,32);
   c.font='bold 16px monospace';
   c.fillText('POINT',64,52);
   c.font='bold 40px monospace';c.fillText('Z',64,88);
  }else if(kind==='missing'){
   c.fillStyle='#2a1f18';c.font='bold 13px monospace';
   c.fillText('MISSING',64,18);
   c.fillStyle='#5a5a50';c.fillRect(44,26,40,44);
   c.fillStyle='#3a3a30';c.fillRect(48,30,32,36);
   c.fillStyle='#2a1f18';c.font='10px monospace';
   c.fillText('REHAN',64,82);
  }else if(kind==='warning'){
   c.fillStyle='#c0453a';c.font='bold 16px monospace';
   c.fillText('DO NOT',64,26);
   c.fillText('LEAVE AT',64,46);
   c.fillText('NIGHT',64,66);
   c.font='9px monospace';
   c.fillText('- SURVIVORS',64,86);
  }else{
   c.fillStyle='#3a2a18';c.font='bold 15px monospace';
   c.fillText('SHELTER',64,32);
   c.fillText('ZONE',64,52);
  }
  const t=new THREE.CanvasTexture(cv);
  t.magFilter=THREE.NearestFilter;
  return t;
 };
 // Poster: tempel di wall (# atau X). side = arah normal poster (menghadap).
 const POSTER_GEO=new THREE.PlaneGeometry(.8,.6);
 const POSTERS=[
  {x:18,y:15,side:'N',k:'muster'},   // wall utara living · terlihat dari ruang selatan
  {x:22,y:15,side:'N',k:'warning'},  // wall utara corridor · terlihat dari ruang selatan
  {x:16,y:9, side:'E',k:'missing'},  // wall dalam · terlihat dari koridor timur
  {x:17,y:24,side:'S',k:'sign'}      // wall belakang · terlihat dari dalam mansion
 ];
 for(const p of POSTERS){
  // F10.10.5b: Lambert — poster responsif terhadap cahaya ruangan, tidak self-glow
  const mat=new THREE.MeshLambertMaterial({map:makePosterTex(p.k),transparent:true,side:THREE.DoubleSide});
  const m=new THREE.Mesh(POSTER_GEO,mat);
  const y=1.55;
  if(p.side==='N'){m.position.set(p.x+.5,y,p.y+1.01);m.rotation.y=0;}
  else if(p.side==='S'){m.position.set(p.x+.5,y,p.y-.01);m.rotation.y=Math.PI;}
  else if(p.side==='E'){m.position.set(p.x+1.01,y,p.y+.5);m.rotation.y=Math.PI/2;}
  else{m.position.set(p.x-.01,y,p.y+.5);m.rotation.y=-Math.PI/2;}
  scene.add(m);
 }
 // Koran berserakan di lantai (plane tipis, wrapper group untuk yaw random).
 // F10.10.5b: Lambert — koran gelap di area tanpa cahaya, terang di dekat lilin
 const paperMat=new THREE.MeshLambertMaterial({color:0xd0c8b0,transparent:true,opacity:.85,side:THREE.DoubleSide});
 const paperGeo=new THREE.PlaneGeometry(.5,.35);
 const PAPERS=[{x:14,y:16},{x:21,y:19},{x:27,y:22},{x:15,y:11},{x:12,y:13}];
 for(const p of PAPERS){
  const wrap=new THREE.Group();
  wrap.rotation.y=rnd(0,Math.PI*2);
  const m=new THREE.Mesh(paperGeo,paperMat);
  m.rotation.x=-Math.PI/2;
  wrap.add(m);
  wrap.position.set(p.x+.5,.09,p.y+.5);
  scene.add(wrap);
 }
})();

// ================= 8. PABRIK MODEL =================
function makeDiazMesh(){
 const g=new THREE.Group();
 const rig=new THREE.Group(); // poros tubuh — disiapkan utk F7 (pose revive/rebah)
 g.add(rig);
 // Palet GDD §21.1 (dari model referensi)
 const matSkin =new THREE.MeshLambertMaterial({color:0xca9b75});
 const matShirt=new THREE.MeshLambertMaterial({color:0xe9e9d8});
 const matPants=new THREE.MeshLambertMaterial({color:0x3c6185});
 const matHair =new THREE.MeshLambertMaterial({color:0x222222});
 const matBoot =new THREE.MeshLambertMaterial({color:0x322c24});
 const matBtn  =new THREE.MeshLambertMaterial({color:0xffffff});
 const matGunA =new THREE.MeshLambertMaterial({color:0x3e463e});
 const matGunB =new THREE.MeshLambertMaterial({color:0x242a25});
 const matEye  =new THREE.MeshLambertMaterial({color:0x14100c});
 const box=(w,h,d,mat,x,y,z,parent)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);
  m.castShadow=true;m.receiveShadow=true;
  (parent||rig).add(m);
  return m;
 };
 // 1. Torso + kancing kemeja polo
 box(.40,.43,.23,matShirt,0,.69,0);
 box(.06,.19,.02,matBtn,0,.81,.125);
 // 2. Leher & kepala
 box(.14,.09,.09,matSkin,0,.93,0);
 box(.24,.27,.24,matSkin,0,1.11,0);
// 3. Rambut tebal: atas + depan + samping + belakang
box(.27,.09,.27,matHair,0,1.235,0);         // atas — FIX(15): z ±.135, semua bidang menonjol .015
box(.27,.06,.05,matHair,0,1.21,.115);       // depan (poni)
box(.06,.16,.24,matHair,-.12,1.16,-.01);    // samping kiri
box(.06,.16,.24,matHair,.12,1.16,-.01);     // samping kanan
box(.26,.15,.065,matHair,0,1.15,-.125);     // belakang (tetap)
 box(.045,.045,.02,matEye,-.055,1.14,.125);
 box(.045,.045,.02,matEye,.055,1.14,.125);
 // 4. Kaki: pivot pinggul (y .49) — celana jeans + sepatu boots, kaki pas y=0
 const legL=new THREE.Group(),legR=new THREE.Group();
 legL.position.set(-.12,.49,0);legR.position.set(.12,.49,0);
 rig.add(legL,legR);
 box(.146,.41,.17,matPants,0,-.206,0,legL);
 box(.155,.10,.24,matBoot,0,-.44,.04,legL);
 box(.146,.41,.17,matPants,0,-.206,0,legR);
 box(.155,.10,.24,matBoot,0,-.44,.04,legR);
 // 5. Lengan KIRI: menggantung dari bahu — berayun saat jalan
 const offArmG=new THREE.Group();
 offArmG.position.set(.25,.83,0);
 rig.add(offArmG);
 box(.13,.16,.155,matShirt,0,-.077,0,offArmG); // lengan pendek
 box(.11,.23,.12,matSkin,0,-.25,0,offArmG);    // kulit lengan
 // 6. Lengan KANAN = gun arm (combat stance, laras +z)
 const gunArm=new THREE.Group();
 gunArm.position.set(-.25,.82,0); // FIX(24a): sejajar bahu kiri (was .07)
 rig.add(gunArm);
 box(.13,.155,.16,matShirt,0,0,.08,gunArm);    // lengan pendek maju
 box(.11,.12,.22,matSkin,0,-.01,.24,gunArm);   // kulit lengan maju
 box(.09,.12,.24,matGunA,0,.02,.40,gunArm);    // laras
 box(.07,.12,.08,matGunB,0,-.07,.31,gunArm);   // gagang
 const tip=new THREE.Object3D();tip.position.set(0,.02,.52);
 gunArm.add(tip);
 gunArm.rotation.x=Math.PI/2; // F7(1.5): lahir dalam pose idle — senjata turun
 // 7. Segitiga seleksi + hitBox (tambahanmu — dipertahankan)
 const selArrow=new THREE.Mesh(
  new THREE.ConeGeometry(.09,.18,4),
  new THREE.MeshBasicMaterial({color:0xffffff}));
 selArrow.rotation.x=Math.PI;
 selArrow.position.y=1.5;
 g.add(selArrow);
 const hitBox=new THREE.Mesh(
  new THREE.BoxGeometry(0.9,1.8,0.9),
  new THREE.MeshBasicMaterial({visible:false}));
 hitBox.position.y=.9;
 g.add(hitBox);
 g.userData={legL,legR,gunArm,offArm:offArmG,tip,selArrow,rig,
  flashT:0,flashMats:[matShirt,matSkin],
  aim:{parts:[gunArm],down:Math.PI/2,up:0},   // F7(1.5): pose idle/combat
  death:{gun:[1.45,.99,0],off:[0,0,.12],lift:.025}}; // F7(2.5c): lift per model
 return g;
}
// ---- F7: BAMBANG — kaus oblong krem, celana training abu-abu, DUAL PISTOL ----
// Adaptasi model referensi pemain: classic script (bukan ES module),
// MeshLambert (gaya game ini + flash emissive), fit scale .85 + offset
// -.132 (landmark sejajar Diaz: torso .68, kepala 1.10, pinggul .49,
// tinggi total 1.28, kaki nol di tanah), laras pistol forward +z
// (kode asli mengarah ke bawah), + mata & kontrak rig game ini.
function makeBambangMesh(){
 const g=new THREE.Group();
 const fit=new THREE.Group();       // offset TIDAK di rig — resetGame me-reset
 fit.scale.setScalar(.85);          // rig.position ke 0, offset harus selamat
 fit.position.y=-.132;              // kaki tepat di tanah (asli melayang .155)
 g.add(fit);
 const rig=new THREE.Group();fit.add(rig);
 // Palet (GDD §21.1 — dari referensi)
 const matSkin =new THREE.MeshLambertMaterial({color:0xc2946c});
 const matShirt=new THREE.MeshLambertMaterial({color:0xece4cf});
 const matCollar=new THREE.MeshLambertMaterial({color:0xd9cfb6});
 const matPants=new THREE.MeshLambertMaterial({color:0x565c68});
 const matStripe=new THREE.MeshLambertMaterial({color:0xe0e5eb});
 const matHair =new THREE.MeshLambertMaterial({color:0x342921});
 const matShoeT=new THREE.MeshLambertMaterial({color:0x2e3338});
 const matShoeS=new THREE.MeshLambertMaterial({color:0xffffff});
 const matGunA =new THREE.MeshLambertMaterial({color:0x3e463e});
 const matGunB =new THREE.MeshLambertMaterial({color:0x242a25});
 const matEye  =new THREE.MeshLambertMaterial({color:0x14100c});
 const box=(w,h,d,mat,x,y,z,parent)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;
  (parent||rig).add(m);return m;
 };
 // 1. Torso & kaus oblong + kerah bundar
 box(.46,.50,.27,matShirt,0,.96,0);
 box(.24,.06,.20,matCollar,0,1.22,0);
 // 2. Leher & kepala + mata (adaptasi — konsisten Diaz)
 box(.16,.10,.10,matSkin,0,1.24,0);
 box(.28,.31,.28,matSkin,0,1.45,0);
 box(.045,.045,.02,matEye,-.055,1.47,.147);
 box(.045,.045,.02,matEye,.055,1.47,.147);
 // 3. Rambut ikal: atas + poni depan + belakang
 box(.31,.12,.30,matHair,0,1.60,0);
 box(.29,.08,.06,matHair,0,1.54,.13);
 box(.31,.19,.08,matHair,0,1.48,-.135);
 // 4. Kaki: celana training + strip putih + sneakers sol putih
 const legL=new THREE.Group(),legR=new THREE.Group();
 legL.position.set(-.14,.73,0);legR.position.set(.14,.73,0);
 rig.add(legL,legR);
 for(const[leg,sx]of[[legL,-.085],[legR,.085]]){
  box(.17,.48,.20,matPants,0,-.24,0,leg);
  box(.02,.48,.12,matStripe,sx,-.24,0,leg);   // strip samping khas training
  box(.18,.11,.28,matShoeT,0,-.50,.045,leg);
  box(.19,.03,.29,matShoeS,0,-.56,.045,leg);  // sol putih
 }
 // 5. Lengan tergantung + DUAL PISTOL — laras SEJAJAR sumbu lengan (−y):
 // idle = pistol mengarah BAWAH · lengan diangkat (rot −90°) = mengarah DEPAN
 const mkArm=side=>{
  const arm=new THREE.Group();
  arm.position.set(.30*side,1.13,0);
  rig.add(arm);
  box(.15,.19,.18,matShirt,0,-.09,0,arm);   // lengan kaus pendek
  box(.13,.27,.14,matSkin,0,-.29,0,arm);    // kulit lengan
  const gun=new THREE.Group();
  gun.position.set(0,-.40,.06);             // z maju — pistol DI DEPAN lengan
  arm.add(gun);
  // FIX(21a): verifikasi di frame AIM (arm rot −90° → +z lokal = DUNIA ATAS):
  // slide/laras z+ (ATAS) · grip z− (BAWAH, di tangan) — anatomis. 19a terbalik.
  box(.085,.15,.10,matGunA,0,-.13,.04,gun); // slide — DI ATAS
  box(.055,.24,.08,matGunA,0,-.30,.04,gun); // laras — sejajar slide
  box(.065,.04,.085,matGunB,0,-.42,.04,gun);// muzzle
  box(.08,.15,.09,matGunB,0,0,-.04,gun);    // GRIP — di tangan, DI BAWAH slide
  box(.05,.02,.07,matGunB,0,-.085,0,gun);   // trigger guard — jembatan grip↔slide
  const tip=new THREE.Object3D();tip.position.set(0,-.44,.04);gun.add(tip);
  return{arm,tip};
 };
 const L=mkArm(-1),R=mkArm(1);
 // 6. Segitiga seleksi + hitBox — di LUAR fit (ukuran asli, tak ter-scale)
 const selArrow=new THREE.Mesh(new THREE.ConeGeometry(.09,.18,4),
  new THREE.MeshBasicMaterial({color:0xffffff}));
 selArrow.rotation.x=Math.PI;selArrow.position.y=1.5;g.add(selArrow);
 const hitBox=new THREE.Mesh(new THREE.BoxGeometry(.9,1.8,.9),
  new THREE.MeshBasicMaterial({visible:false}));
 hitBox.position.y=.9;g.add(hitBox);
 g.userData={legL,legR,gunArm:R.arm,offArm:L.arm,tipL:L.tip,tipR:R.tip,
  tip:R.tip,selArrow,rig,fit,flashT:0,flashMats:[matShirt,matSkin],
  aim:{parts:[L.arm,R.arm],down:0,up:-Math.PI/2},  // F7(1.5)
  death:{gun:[0,0,-.35],off:[0,0,.12],lift:.155}}; // F7(2.5c): lift mengompensasi offset
                                                   // fit (−.132) saat tubuh roboh
 return g;
}
// ---- F8a: REHAN — hoodie beige, jeans biru gelap, KACAMATA, rambut KERITING ----
// Satu tangan kanan (rig Diaz) · Heavy Pistol (lebih besar dari Pistol Diaz)
// Kontrak: aim parts [gunArm], death pose Diaz, lift .025
function makeRehanMesh(){
 const g=new THREE.Group();
 const rig=new THREE.Group();g.add(rig);
 const matSkin =new THREE.MeshLambertMaterial({color:0xa87440}); // D6: skin tone
 const matHood =new THREE.MeshLambertMaterial({color:0xd6c6a0}); // hoodie beige
 const matJeans=new THREE.MeshLambertMaterial({color:0x2a3550}); // jeans gelap
 const matHair =new THREE.MeshLambertMaterial({color:0x181210}); // keriting gelap
 const matBoot =new THREE.MeshLambertMaterial({color:0x322c24});
 const matFrame=new THREE.MeshLambertMaterial({color:0x1a1a1a}); // kacamata
 const matGunA =new THREE.MeshLambertMaterial({color:0x343c34}); // heavy pistol
 const matGunB =new THREE.MeshLambertMaterial({color:0x242a25});
 const matEye  =new THREE.MeshLambertMaterial({color:0x14100c});
 const box=(w,h,d,mat,x,y,z,parent)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;
  (parent||rig).add(m);return m;
 };
 // 1. Torso hoodie + hood belakang + kantong depan + tali
 box(.42,.45,.24,matHood,0,.70,0);
 box(.30,.13,.11,matHood,0,.94,-.16);        // hood terlipat di belakang leher
 box(.20,.11,.03,matHood,0,.56,.125);        // kantong kanguru
 box(.025,.14,.02,matHood,-.05,.79,.125);    // tali hoodie kiri
 box(.025,.14,.02,matHood,.05,.79,.125);     // tali hoodie kanan
 // 2. Leher & kepala
 box(.14,.09,.09,matSkin,0,.94,0);
 box(.24,.27,.24,matSkin,0,1.12,0);
 box(.026,.026,.02,matEye,-.055,1.14,.125);
 box(.026,.026,.02,matEye,.055,1.14,.125);
 // 3. KACAMATA §D6 — FIX(16): pakai builder bersama mkNerdGlasses (7×7 kotak tebal)
 const LENS=[[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]];
 const CW=.021,CH=.016;
 const mkLens=cx=>{
  for(let r=0;r<5;r++)for(let c=0;c<5;c++){
   if(!LENS[r][c])continue;
   box(CW,CH,.02,matFrame,            // FIX(16): sel PENUH — nyambung solid (celah −.004 = void terlihat pecah)
    cx+(c-2)*CW,1+(2-r)*CH,.135);    // FIX(16b2): y disesuaikan ke baseline MKNERD (1.0, bukan 1.15)
  }
 };
 mkGlasses(rig,matFrame,1.15,.135,false); // FIX(17): RING — sama dgn Vikry/Reza, solid
 // 4. Rambut KRIBO TEBEL — topi dasar tebal + 10 simpul acak + puff samping
 box(.28,.13,.27,matHair,0,1.28,-.01);        // topi dasar — TEBAL
 box(.09,.09,.09,matHair,-.09,1.34,-.07);     // simpulan kribo (posisi acak)
 box(.10,.08,.09,matHair,.03,1.36,-.05);
 box(.08,.10,.08,matHair,.10,1.33,.02);
 box(.09,.08,.10,matHair,-.02,1.37,.05);
 box(.08,.08,.08,matHair,-.11,1.31,.06);
 box(.07,.09,.08,matHair,.07,1.35,.09);
 box(.08,.07,.08,matHair,-.06,1.34,.11);
 box(.07,.07,.08,matHair,.12,1.29,-.10);
 box(.08,.07,.08,matHair,-.12,1.29,-.09);
 box(.06,.07,.07,matHair,0,1.39,0);           // puncak
 box(.28,.20,.08,matHair,0,1.22,-.15);        // belakang tebal
 // 5. Kaki pivot pinggul — jeans gelap + boots
 const legL=new THREE.Group(),legR=new THREE.Group();
 legL.position.set(-.12,.49,0);legR.position.set(.12,.49,0);
 rig.add(legL,legR);
 box(.146,.41,.17,matJeans,0,-.206,0,legL);
 box(.155,.10,.24,matBoot,0,-.44,.04,legL);
 box(.146,.41,.17,matJeans,0,-.206,0,legR);
 box(.155,.10,.24,matBoot,0,-.44,.04,legR);
 // 6. Lengan KIRI menggantung (offArm)
 const offArmG=new THREE.Group();
 offArmG.position.set(.25,.83,0);
 rig.add(offArmG);
 box(.14,.17,.16,matHood,0,-.08,0,offArmG);
 box(.11,.23,.12,matSkin,0,-.26,0,offArmG);
 // 7. Lengan KANAN = gun arm (Diaz-style, laras +z) + HEAVY PISTOL
 const gunArm=new THREE.Group();
 gunArm.position.set(-.25,.82,0); // FIX(24a): sejajar bahu kiri
 rig.add(gunArm);
 box(.14,.17,.16,matHood,0,0,.08,gunArm);
 box(.11,.12,.22,matSkin,0,-.01,.24,gunArm);
 box(.11,.16,.30,matGunA,0,.03,.42,gunArm);   // slide tebal
 box(.10,.11,.09,matGunB,0,.00,.54,gunArm);   // bobot moncong
 box(.08,.15,.10,matGunB,0,-.09,.32,gunArm);  // gagang panjang
 const tip=new THREE.Object3D();tip.position.set(0,.03,.60);
 gunArm.add(tip);
 gunArm.rotation.x=Math.PI/2; // lahir pose idle
 // 8. Segitiga seleksi + hitBox
 const selArrow=new THREE.Mesh(new THREE.ConeGeometry(.09,.18,4),
  new THREE.MeshBasicMaterial({color:0xffffff}));
 selArrow.rotation.x=Math.PI;selArrow.position.y=1.5;g.add(selArrow);
 const hitBox=new THREE.Mesh(new THREE.BoxGeometry(.9,1.8,.9),
  new THREE.MeshBasicMaterial({visible:false}));
 hitBox.position.y=.9;g.add(hitBox);
 g.userData={legL,legR,gunArm,offArm:offArmG,tip,selArrow,rig,
  flashT:0,flashMats:[matHood,matSkin],
  aim:{parts:[gunArm],down:Math.PI/2,up:0},
  death:{gun:[1.45,.99,0],off:[0,0,.12],lift:.025}};
 return g;
}
// ---- F8a: MEMET — kaos kuning, celana PENDEK abu-abu, rambut tebal BELAH TENGAH ----
// Satu tangan kanan (rig Diaz) · Mini-SMG low-poly ala MAC-10
function makeMemetMesh(){
 const g=new THREE.Group();
 const rig=new THREE.Group();g.add(rig);
 const matSkin =new THREE.MeshLambertMaterial({color:0xca9b75}); // sama dgn Diaz
 const matShirt=new THREE.MeshLambertMaterial({color:0xd8c030}); // kuning
 const matShort=new THREE.MeshLambertMaterial({color:0x8a8d92}); // pendek abu-abu
 const matHair =new THREE.MeshLambertMaterial({color:0x222222});
 const matShoe =new THREE.MeshLambertMaterial({color:0x2e3338});
 const matGunA =new THREE.MeshLambertMaterial({color:0x3e463e});
 const matGunB =new THREE.MeshLambertMaterial({color:0x242a25});
 const matEye  =new THREE.MeshLambertMaterial({color:0x14100c});
 const box=(w,h,d,mat,x,y,z,parent)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;
  (parent||rig).add(m);return m;
 };
 // 1. Torso kaos kuning
 box(.40,.43,.23,matShirt,0,.69,0);
 // 2. Leher & kepala
 box(.14,.09,.09,matSkin,0,.93,0);
 box(.24,.27,.24,matSkin,0,1.11,0);
 box(.045,.045,.02,matEye,-.055,1.14,.125);
 box(.045,.045,.02,matEye,.055,1.14,.125);
 // 3. Rambut TEBAL belah tengah — gaya Bambang: SEMUA box menjulur
 // melewati permukaan kepala (margin ~.01) → kulit tak bisa bocor
 box(.12,.12,.27,matHair,-.07,1.24,-.01);    // belahan kiri — bungkus kepala
 box(.12,.12,.27,matHair,.07,1.24,-.01);     // belahan kanan (celah tengah = belahan)
 box(.10,.06,.06,matHair,-.06,1.20,.115);    // poni kiri — sampai z .145
 box(.10,.06,.06,matHair,.06,1.20,.115);     // poni kanan
 box(.07,.17,.27,matHair,-.125,1.15,-.01);   // FIX(18): top 1.235 — tak lagi segaris kepala-top (1.245), tetap overlap topi
 box(.07,.17,.27,matHair,.125,1.15,-.01);    // FIX(18)
 box(.27,.18,.07,matHair,0,1.20,-.125);      // belakang
 // 4. Kaki: celana PENDEK + BETIS KULIT + sepatu (celana di atas lutut)
 const legL=new THREE.Group(),legR=new THREE.Group();
 legL.position.set(-.12,.49,0);legR.position.set(.12,.49,0);
 rig.add(legL,legR);
 for(const leg of[legL,legR]){
  box(.146,.20,.17,matShort,0,-.10,0,leg);   // pendek — sampar atas lutut
  box(.13,.19,.15,matSkin,0,-.295,0,leg);    // betis kulit terlihat
  box(.15,.10,.22,matShoe,0,-.44,.03,leg);
 }
 // 5. Lengan KIRI menggantung
 const offArmG=new THREE.Group();
 offArmG.position.set(.25,.83,0);
 rig.add(offArmG);
 box(.13,.16,.155,matShirt,0,-.077,0,offArmG);
 box(.11,.23,.12,matSkin,0,-.25,0,offArmG);
 // 6. Lengan KANAN = gun arm + MINI-SMG (MAC-10 low-poly)
 const gunArm=new THREE.Group();
 gunArm.position.set(-.25,.82,0); // FIX(24a): sejajar bahu kiri
 rig.add(gunArm);
 box(.13,.155,.16,matShirt,0,0,.08,gunArm);
 box(.11,.12,.22,matSkin,0,-.01,.24,gunArm);
 box(.09,.13,.28,matGunA,0,.02,.38,gunArm);  // receiver kotak
 box(.05,.05,.10,matGunA,0,.03,.55,gunArm);  // laras pendek
 box(.06,.16,.07,matGunB,0,-.09,.32,gunArm); // magasin vertikal
 box(.06,.10,.08,matGunB,0,-.06,.22,gunArm); // gagang
 box(.03,.03,.04,matGunA,.055,.05,.40,gunArm);// tuas cocking
 const tip=new THREE.Object3D();tip.position.set(0,.03,.60);
 gunArm.add(tip);
 gunArm.rotation.x=Math.PI/2; // lahir pose idle
 // 7. Segitiga seleksi + hitBox
 const selArrow=new THREE.Mesh(new THREE.ConeGeometry(.09,.18,4),
  new THREE.MeshBasicMaterial({color:0xffffff}));
 selArrow.rotation.x=Math.PI;selArrow.position.y=1.5;g.add(selArrow);
 const hitBox=new THREE.Mesh(new THREE.BoxGeometry(.9,1.8,.9),
  new THREE.MeshBasicMaterial({visible:false}));
 hitBox.position.y=.9;g.add(hitBox);
 g.userData={legL,legR,gunArm,offArm:offArmG,tip,selArrow,rig,
  flashT:0,flashMats:[matShirt,matSkin],
  aim:{parts:[gunArm],down:Math.PI/2,up:0},
  death:{gun:[1.45,.99,0],off:[0,0,.12],lift:.025}};
 return g;
}
// ---- F9a: SOBEL — jaket denim, kemeja putih, celana PENDEK jeans gelap ----
// Keriting ala Rehan (skin Diaz) · MACHINE GUN low-poly
function makeSobelMesh(){
 const g=new THREE.Group();
 const rig=new THREE.Group();g.add(rig);
 const matSkin  =new THREE.MeshLambertMaterial({color:0xca9b75}); // skin Diaz
 const matJacket=new THREE.MeshLambertMaterial({color:0x46536e}); // jaket denim
 const matShirt =new THREE.MeshLambertMaterial({color:0xe9e9d8}); // kemeja putih
 const matShort =new THREE.MeshLambertMaterial({color:0x2a3550}); // pendek jeans gelap
 const matHair  =new THREE.MeshLambertMaterial({color:0x181210}); // keriting — sama Rehan
 const matBoot  =new THREE.MeshLambertMaterial({color:0x322c24});
 const matGunA  =new THREE.MeshLambertMaterial({color:0x3e463e});
 const matGunB  =new THREE.MeshLambertMaterial({color:0x242a25});
 const matEye   =new THREE.MeshLambertMaterial({color:0x14100c});
 const box=(w,h,d,mat,x,y,z,parent)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;
  (parent||rig).add(m);return m;
 };
 box(.42,.45,.24,matJacket,0,.70,0);             // torso jaket terbuka
 box(.14,.40,.02,matShirt,0,.70,.125);           // kemeja di celah tengah
 box(.14,.09,.09,matSkin,0,.94,0);
 box(.24,.27,.24,matSkin,0,1.12,0);
 box(.045,.045,.02,matEye,-.055,1.14,.125);
 box(.045,.045,.02,matEye,.055,1.14,.125);
 box(.28,.13,.27,matHair,0,1.28,-.01);           // topi dasar kribo
 box(.09,.09,.09,matHair,-.09,1.34,-.07);        // simpulan kribo
 box(.10,.08,.09,matHair,.03,1.36,-.05);
 box(.08,.10,.08,matHair,.10,1.33,.02);
 box(.09,.08,.10,matHair,-.02,1.37,.05);
 box(.08,.08,.08,matHair,-.11,1.31,.06);
 box(.07,.09,.08,matHair,.07,1.35,.09);
 box(.08,.07,.08,matHair,-.06,1.34,.11);
 box(.06,.07,.07,matHair,0,1.39,0);
 box(.28,.20,.08,matHair,0,1.22,-.15);           // belakang tebal
 const legL=new THREE.Group(),legR=new THREE.Group();
 legL.position.set(-.12,.49,0);legR.position.set(.12,.49,0);rig.add(legL,legR);
 for(const leg of[legL,legR]){
  box(.146,.20,.17,matShort,0,-.10,0,leg);       // pendek di atas lutut
  box(.13,.19,.15,matSkin,0,-.295,0,leg);        // betis kulit
  box(.155,.10,.24,matBoot,0,-.44,.04,leg);
 }
 const offArmG=new THREE.Group();offArmG.position.set(.25,.83,0);rig.add(offArmG); // FIX(22a): bahu pulih — menembus torso (was .19,.83,.03). Jangkauan aim lewat pose, bukan bahu
 box(.14,.17,.16,matJacket,0,-.08,0,offArmG);
 box(.11,.23,.12,matSkin,0,-.26,0,offArmG);
 const gunArm=new THREE.Group();gunArm.position.set(-.25,.82,0);rig.add(gunArm); // FIX(24a): sejajar bahu kiri
 box(.13,.155,.16,matJacket,0,0,.08,gunArm);
 box(.11,.12,.22,matSkin,0,-.01,.24,gunArm);
 box(.08,.09,.12,matGunA,0,0,.16,gunArm);        // popor rangka
 box(.05,.09,.07,matGunB,0,-.06,.25,gunArm);     // grip
 box(.11,.15,.44,matGunA,0,.02,.42,gunArm);      // receiver panjang (z .20–.64)
 box(.04,.05,.18,matGunB,0,.12,.42,gunArm);      // carry handle di atas receiver
 box(.10,.04,.10,matGunB,0,-.05,.42,gunArm);     // rel feed — sambungan mag ke receiver
 box(.09,.14,.13,matGunB,0,-.13,.42,gunArm);     // MAGAZINE BOX-FED — nengah receiver
 box(.05,.07,.05,matGunB,0,.07,.67,gunArm);      // gas block + front sight
 box(.045,.045,.30,matGunA,0,.05,.80,gunArm);    // LARAS PANJANG (z .65–.95)
 box(.055,.055,.05,matGunB,0,.05,.95,gunArm);    // muzzle brake
 const bpL=box(.025,.13,.025,matGunB,-.05,-.06,.66,gunArm);bpL.rotation.z=.45;  // bipod kiri (lipat)
 const bpR=box(.025,.13,.025,matGunB,.05,-.06,.66,gunArm);bpR.rotation.z=-.45; // bipod kanan
 const tip=new THREE.Object3D();tip.position.set(0,.05,.98);gunArm.add(tip);
 gunArm.rotation.x=Math.PI/2;
 const selArrow=new THREE.Mesh(new THREE.ConeGeometry(.09,.18,4),
  new THREE.MeshBasicMaterial({color:0xffffff}));
 selArrow.rotation.x=Math.PI;selArrow.position.y=1.5;g.add(selArrow);
 const hitBox=new THREE.Mesh(new THREE.BoxGeometry(.9,1.8,.9),
  new THREE.MeshBasicMaterial({visible:false}));
 hitBox.position.y=.9;g.add(hitBox);
 g.userData={legL,legR,gunArm,offArm:offArmG,aimSupport:offArmG,tip,selArrow,rig,
  flashT:0,flashMats:[matJacket,matSkin],
  aim:{parts:[gunArm],down:Math.PI/2,up:0}, // FIX(20b): idle kini via mount diagonal — π/2 pulih
  death:{gun:[1.45,.99,0],off:[0,0,.12],lift:.025}};
 return g;
}
// ---- F9a: VIKRY — trench coat PUTIH, kemeja & celana HITAM, KACAMATA ala Rehan ----
// Rambut TEBAL ala Bambang, hitam tak pekat · skin Diaz · PUMP SHOTGUN
function makeVikryMesh(){
 const g=new THREE.Group();
 const rig=new THREE.Group();g.add(rig);
 const matSkin =new THREE.MeshLambertMaterial({color:0xca9b75}); // skin Diaz
 const matCoat =new THREE.MeshLambertMaterial({color:0xd8d4cc}); // trench putih
 const matShirt=new THREE.MeshLambertMaterial({color:0x1c1c20}); // kemeja hitam
 const matPants=new THREE.MeshLambertMaterial({color:0x222226}); // celana hitam
 const matHair =new THREE.MeshLambertMaterial({color:0x2b2723}); // hitam, tak pekat
 const matFrame=new THREE.MeshLambertMaterial({color:0x1a1a1a});
 const matBoot =new THREE.MeshLambertMaterial({color:0x1a1a1c});
 const matGunA =new THREE.MeshLambertMaterial({color:0x4a4a44}); // baja
 const matGunB =new THREE.MeshLambertMaterial({color:0x6a4a2c}); // kayu
 const matEye  =new THREE.MeshLambertMaterial({color:0x14100c});
 const box=(w,h,d,mat,x,y,z,parent)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;
  (parent||rig).add(m);return m;
 };
 box(.42,.45,.24,matCoat,0,.70,0);               // coat terbuka
 box(.14,.42,.02,matShirt,0,.70,.125);           // kemeja hitam di depan
 box(.44,.20,.22,matCoat,0,.42,0);               // rok trench sampai paha
 box(.18,.05,.02,matShirt,0,.94,.115);           // kerah hitam
 box(.14,.09,.09,matSkin,0,.94,0);
 box(.24,.27,.24,matSkin,0,1.12,0);
 box(.045,.045,.02,matEye,-.055,1.14,.125);
 box(.045,.045,.02,matEye,.055,1.14,.125);
 mkGlasses(rig,matFrame,1.15,.135,false); // FIX(17): ring — solid (gap −.004/−.003 dihapus)
 box(.28,.13,.28,matHair,0,1.30,-.01);           // topi TEBAL — julur .01–.02 semua sisi
 box(.28,.07,.06,matHair,0,1.235,.125);          // poni — menonjol .035 dari muka
 box(.28,.19,.08,matHair,0,1.165,-.13);         // belakang tebal
 box(.07,.17,.26,matHair,-.125,1.155,-.01);      // FIX(18): top 1.24 — tak lagi segaris kepala-top (1.245), overlap topi tetap
 box(.07,.17,.26,matHair,.125,1.155,-.01);       // FIX(18)
 const legL=new THREE.Group(),legR=new THREE.Group();
 legL.position.set(-.12,.49,0);legR.position.set(.12,.49,0);rig.add(legL,legR);
 for(const leg of[legL,legR]){
  box(.146,.41,.17,matPants,0,-.206,0,leg);
  box(.155,.10,.24,matBoot,0,-.44,.04,leg);
 }
  const offArmG=new THREE.Group();offArmG.position.set(.25,.83,0);rig.add(offArmG); // FIX(22a): bahu pulih — menembus torso (was .19,.83,.03). Jangkauan aim lewat pose, bukan bahu
 box(.14,.17,.16,matCoat,0,-.08,0,offArmG);
 box(.11,.23,.12,matSkin,0,-.26,0,offArmG);
 const gunArm=new THREE.Group();gunArm.position.set(-.25,.82,0);rig.add(gunArm); // FIX(24a): sejajar bahu kiri
 box(.13,.155,.16,matCoat,0,0,.08,gunArm);
 box(.11,.12,.22,matSkin,0,-.01,.24,gunArm);
 box(.07,.10,.16,matGunB,0,0,.17,gunArm);        // popor kayu
 box(.05,.09,.06,matGunB,0,-.05,.24,gunArm);     // grip
 box(.09,.12,.24,matGunA,0,.02,.34,gunArm);      // receiver
 box(.055,.055,.34,matGunA,0,.08,.52,gunArm);    // LARAS PANJANG (z .35–.69)
 box(.045,.045,.30,matGunA,0,.015,.50,gunArm);   // tabung amunisi bawah laras
 box(.08,.07,.12,matGunB,0,-.02,.44,gunArm);     // pump kayu di tabung
 box(.075,.075,.09,matGunA,0,.08,.675,gunArm);   // CHOKE — membesar sebelum muzzle
 const tip=new THREE.Object3D();tip.position.set(0,.08,.74);gunArm.add(tip);
 gunArm.rotation.x=Math.PI/2;
 const selArrow=new THREE.Mesh(new THREE.ConeGeometry(.09,.18,4),
  new THREE.MeshBasicMaterial({color:0xffffff}));
 selArrow.rotation.x=Math.PI;selArrow.position.y=1.5;g.add(selArrow);
 const hitBox=new THREE.Mesh(new THREE.BoxGeometry(.9,1.8,.9),
  new THREE.MeshBasicMaterial({visible:false}));
 hitBox.position.y=.9;g.add(hitBox);
 g.userData={legL,legR,gunArm,offArm:offArmG,aimSupport:offArmG,tip,selArrow,rig,
  flashT:0,flashMats:[matCoat,matSkin],
  aim:{parts:[gunArm],down:Math.PI/2,up:0},
  death:{gun:[1.45,.99,0],off:[0,0,.12],lift:.025}};
 return g;
}
// ---- F9a: ERRY — kemeja putih, jeans navy, rambut TIPIS BELAH KANAN ----
// skin Diaz · GRENADE LAUNCHER low-poly (tabung tebal)
function makeErryMesh(){
 const g=new THREE.Group();
 const rig=new THREE.Group();g.add(rig);
 const matSkin=new THREE.MeshLambertMaterial({color:0xca9b75}); // skin Diaz
 const matShirt=new THREE.MeshLambertMaterial({color:0x2e4a32}); // FIX(24b): hijau Ariz (was putih)
 const matJeans=new THREE.MeshLambertMaterial({color:0x26304a}); // navy
 const matHair=new THREE.MeshLambertMaterial({color:0x241d16});  // tipis gelap
 const matBoot=new THREE.MeshLambertMaterial({color:0x322c24});
 const matGunA=new THREE.MeshLambertMaterial({color:0x3a4038});
 const matGunB=new THREE.MeshLambertMaterial({color:0x242a25});
 const matEye=new THREE.MeshLambertMaterial({color:0x14100c});
 const box=(w,h,d,mat,x,y,z,parent)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;
  (parent||rig).add(m);return m;
 };
 box(.40,.43,.23,matShirt,0,.69,0);
 box(.14,.09,.09,matSkin,0,.93,0);
 box(.24,.27,.24,matSkin,0,1.11,0);
 box(.045,.045,.02,matEye,-.055,1.14,.125);
 box(.045,.045,.02,matEye,.055,1.14,.125);
 box(.26,.07,.28,matHair,0,1.245,0);          // FIX(15): z ±.14 — muka depan tak segaris dgn kepala
 box(.05,.11,.24,matHair,-.12,1.165,-.01);       // samping — naik sampai 1.22 (overlap topi)
 box(.05,.11,.24,matHair,.12,1.165,-.01);
 box(.26,.12,.07,matHair,0,1.16,-.125);         // belakang
 box(.15,.05,.06,matHair,-.055,1.215,.115);      // poni kiri (lebar)
 box(.08,.05,.06,matHair,.095,1.215,.115);       // poni kanan (sempit — belahan kanan)
 const legL=new THREE.Group(),legR=new THREE.Group();
 legL.position.set(-.12,.49,0);legR.position.set(.12,.49,0);rig.add(legL,legR);
 for(const leg of[legL,legR]){
  box(.146,.41,.17,matJeans,0,-.206,0,leg);
  box(.155,.10,.24,matBoot,0,-.44,.04,leg);
 }
  const offArmG=new THREE.Group();offArmG.position.set(.25,.83,0);rig.add(offArmG); // FIX(22a): bahu pulih — menembus torso (was .19,.83,.03). Jangkauan aim lewat pose, bukan bahu
 box(.13,.16,.155,matShirt,0,-.077,0,offArmG);
 box(.11,.23,.12,matSkin,0,-.25,0,offArmG);
 const gunArm=new THREE.Group();gunArm.position.set(-.25,.82,0);rig.add(gunArm); // FIX(24a): sejajar bahu kiri
 box(.13,.155,.16,matShirt,0,0,.08,gunArm);
 box(.11,.12,.22,matSkin,0,-.01,.24,gunArm);
 box(.08,.12,.12,matGunB,0,-.01,.10,gunArm);     // popor
 box(.06,.11,.07,matGunB,0,-.10,.22,gunArm);     // grip
 box(.09,.11,.14,matGunB,0,.02,.20,gunArm);      // frame belakang drum
 const drum=new THREE.Mesh(                      // DRUM REVOLVER BESAR (heksagon 6 ruang)
  new THREE.CylinderGeometry(.11,.11,.24,6),matGunA);
 drum.rotation.x=Math.PI/2;drum.position.set(0,.03,.36);
 drum.castShadow=true;gunArm.add(drum);
 box(.10,.10,.16,matGunA,0,.03,.54,gunArm);      // LARAS PENDEK di depan drum
 box(.115,.115,.045,matGunB,0,.03,.63,gunArm);   // ring moncong
 const tip=new THREE.Object3D();tip.position.set(0,.03,.66);gunArm.add(tip);
 gunArm.rotation.x=Math.PI/2;
 const selArrow=new THREE.Mesh(new THREE.ConeGeometry(.09,.18,4),
  new THREE.MeshBasicMaterial({color:0xffffff}));
 selArrow.rotation.x=Math.PI;selArrow.position.y=1.5;g.add(selArrow);
 const hitBox=new THREE.Mesh(new THREE.BoxGeometry(.9,1.8,.9),
  new THREE.MeshBasicMaterial({visible:false}));
 hitBox.position.y=.9;g.add(hitBox);
 g.userData={legL,legR,gunArm,offArm:offArmG,aimSupport:offArmG,tip,selArrow,rig,
  flashT:0,flashMats:[matShirt,matSkin],
  aim:{parts:[gunArm],down:Math.PI/2,up:0},
  death:{gun:[1.45,.99,0],off:[0,0,.12],lift:.025}};
 return g;
}
// ---- F9a: ARIZ — jaket hijau gelap, jeans biru gelap, KERITING KECIL ----
// skin Diaz · SMG karabin kompak
function makeArizMesh(){
 const g=new THREE.Group();
 const rig=new THREE.Group();g.add(rig);
 const matSkin=new THREE.MeshLambertMaterial({color:0xca9b75}); // skin Diaz
 const matJacket=new THREE.MeshLambertMaterial({color:0x6a2432}); // FIX(24b): burgundy (was hijau)
 const matJeans=new THREE.MeshLambertMaterial({color:0x2a3550});
 const matHair=new THREE.MeshLambertMaterial({color:0x181210});
 const matBoot=new THREE.MeshLambertMaterial({color:0x322c24});
 const matGunA=new THREE.MeshLambertMaterial({color:0x3e463e});
 const matGunB=new THREE.MeshLambertMaterial({color:0x242a25});
 const matEye=new THREE.MeshLambertMaterial({color:0x14100c});
 const box=(w,h,d,mat,x,y,z,parent)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;
  (parent||rig).add(m);return m;
 };
 box(.42,.45,.24,matJacket,0,.70,0);
 box(.14,.09,.09,matSkin,0,.94,0);
 box(.24,.27,.24,matSkin,0,1.12,0);
 box(.045,.045,.02,matEye,-.055,1.14,.125);
 box(.045,.045,.02,matEye,.055,1.14,.125);
 box(.26,.10,.27,matHair,0,1.27,0);           // FIX(15): z ±.135 — muka depan MENONJOL (was .115, tercekung → pita kulit)
 box(.07,.07,.07,matHair,-.08,1.32,-.06);        // simpul KECIL (kribo mini)
 box(.08,.06,.07,matHair,.02,1.33,-.03);
 box(.07,.06,.07,matHair,.09,1.31,.01);
 box(.06,.07,.06,matHair,-.04,1.34,.04);
 box(.07,.06,.07,matHair,-.10,1.29,.05);
 box(.06,.06,.06,matHair,.05,1.32,.08);
 box(.26,.16,.07,matHair,0,1.20,-.12);
 const legL=new THREE.Group(),legR=new THREE.Group();
 legL.position.set(-.12,.49,0);legR.position.set(.12,.49,0);rig.add(legL,legR);
 for(const leg of[legL,legR]){
  box(.146,.41,.17,matJeans,0,-.206,0,leg);
  box(.155,.10,.24,matBoot,0,-.44,.04,leg);
 }
 const offArmG=new THREE.Group();offArmG.position.set(.25,.83,0);rig.add(offArmG); // FIX(22a): bahu pulih — menembus torso (was .19,.83,.03). Jangkauan aim lewat pose, bukan bahu
 box(.14,.17,.16,matJacket,0,-.08,0,offArmG);
 box(.11,.23,.12,matSkin,0,-.26,0,offArmG);
 const gunArm=new THREE.Group();gunArm.position.set(-.25,.82,0);rig.add(gunArm); // FIX(24a): sejajar bahu kiri
 box(.13,.155,.16,matJacket,0,0,.08,gunArm);
 box(.11,.12,.22,matSkin,0,-.01,.24,gunArm);
 box(.045,.06,.12,matGunB,0,.02,.20,gunArm);     // popor ramping
 box(.05,.09,.07,matGunB,0,-.06,.27,gunArm);     // grip
 box(.08,.11,.26,matGunA,0,.02,.38,gunArm);      // receiver ramping
 box(.032,.032,.24,matGunA,0,.09,.40,gunArm);    // tabung cocking MP5 di atas
 box(.065,.08,.16,matGunB,0,.01,.50,gunArm);     // handguard (lebih kecil dr receiver)
 box(.035,.035,.09,matGunA,0,.03,.62,gunArm);    // LARAS PENDEK keluar handguard
 box(.02,.055,.02,matGunB,0,.075,.58,gunArm);    // front sight post
 const m1=box(.05,.10,.06,matGunB,0,-.08,.42,gunArm);m1.rotation.x=-.12; // magasin MP5
 const m2=box(.05,.08,.05,matGunB,0,-.15,.385,gunArm);m2.rotation.x=-.38; // segmen lengkung bawah
 const tip=new THREE.Object3D();tip.position.set(0,.03,.67);gunArm.add(tip);
 gunArm.rotation.x=Math.PI/2;
 const selArrow=new THREE.Mesh(new THREE.ConeGeometry(.09,.18,4),
  new THREE.MeshBasicMaterial({color:0xffffff}));
 selArrow.rotation.x=Math.PI;selArrow.position.y=1.5;g.add(selArrow);
 const hitBox=new THREE.Mesh(new THREE.BoxGeometry(.9,1.8,.9),
  new THREE.MeshBasicMaterial({visible:false}));
 hitBox.position.y=.9;g.add(hitBox);
 g.userData={legL,legR,gunArm,offArm:offArmG,aimSupport:offArmG,tip,selArrow,rig,
  flashT:0,flashMats:[matJacket,matSkin],
  aim:{parts:[gunArm],down:Math.PI/2,up:0},
  death:{gun:[1.45,.99,0],off:[0,0,.12],lift:.025}};
 return g;
}
// ---- FIX(17): KACAMATA — builder tunggal, grid 5×5, sel PENUH (no gap = solid) ----
// Dua gaya (perbedaan hanya 4 sudut):
//  ring (REHAN/VIKRY/REZA): XOOOX/OXXXO/OXXXO/OXXXO/XOOOX — sudut kosong
//  box  (ALVI/LELE):        OOOOO/OXXXO/OXXXO/OXXXO/OOOOO — sudut terisi, border 1 sel
// (X=kosong · O=isi → di grid bawah 1=isi)
const GL_RING=[[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]];
const GL_BOX =[[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1]];
function mkGlasses(rig,matFrame,y,z,square){
 const rows=square?GL_BOX:GL_RING;
 const CW=.021,CH=.016,cx=.06;
 for(let s=-1;s<=1;s+=2){
  for(let r=0;r<5;r++)for(let c=0;c<5;c++){
   if(!rows[r][c])continue;
   const m=new THREE.Mesh(new THREE.BoxGeometry(CW,CH,.02),matFrame); // FIX(16): sel PENUH — bersentuhan rapat
   m.position.set(s*cx+(c-2)*CW,y+(2-r)*CH,z);
   rig.add(m);
  }
  const t=new THREE.Mesh(new THREE.BoxGeometry(.03,.012,.24),matFrame);
  t.position.set(s*.115,y,.005); // FIX(18): menempel pelipis — strip .12–.13 TERLIHAT (was terkubur dalam kepala), menyapu dari lensa ke belakang kepala
  rig.add(t);
 }
 const br=new THREE.Mesh(new THREE.BoxGeometry(.025,.02,.024),matFrame);
 br.position.set(0,y,z);rig.add(br); // bridge — menyambung tepi dalam kedua lensa
}
// ---- F9a: ALVI — kemeja putih, VEST beige, celana coklat, KACAMATA KOTAK ----
// Rambut TEBAL gaya Bambang (poni penuh, hitam tak pekat) · skin Rehan · SEMI-AUTO RIFLE
function makeAlviMesh(){
 const g=new THREE.Group();
 const rig=new THREE.Group();g.add(rig);
 const matSkin=new THREE.MeshLambertMaterial({color:0xa87440}); // skin Rehan
 const matShirt=new THREE.MeshLambertMaterial({color:0xe9e9d8});
 const matVest =new THREE.MeshLambertMaterial({color:0xc8b48c}); // vest beige
 const matPants=new THREE.MeshLambertMaterial({color:0x6a4c30}); // coklat
 const matHair =new THREE.MeshLambertMaterial({color:0x2b2723}); // FIX(14): hitam tak pekat — sama Vikry
 const matFrame=new THREE.MeshLambertMaterial({color:0x141414}); // frame TEBAL
 const matBoot =new THREE.MeshLambertMaterial({color:0x4a3a28});
 const matGunA=new THREE.MeshLambertMaterial({color:0x3e463e});
 const matGunB=new THREE.MeshLambertMaterial({color:0x6a4a2c}); // kayu
 const matEye  =new THREE.MeshLambertMaterial({color:0x14100c});
 const box=(w,h,d,mat,x,y,z,parent)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;
  (parent||rig).add(m);return m;
 };
 box(.40,.43,.23,matShirt,0,.69,0);              // kemeja putih
 box(.17,.30,.02,matVest,-.115,.72,.125);        // vest — panel depan kiri
 box(.17,.30,.02,matVest,.115,.72,.125);         // panel depan kanan
 box(.40,.30,.02,matVest,0,.72,-.125);           // punggung vest
 box(.14,.09,.09,matSkin,0,.93,0);
 box(.24,.27,.24,matSkin,0,1.11,0);
 box(.026,.026,.02,matEye,-.055,1.14,.125);
 box(.026,.026,.02,matEye,.055,1.14,.125);
 mkGlasses(rig,matFrame,1.14,.135,true); // FIX(17): BOX — sudut terisi, border 1 sel (lebih tipis)
 box(.26,.07,.28,matHair,0,1.245,0);          // FIX(17f): topi TIPIS — gaya Erry
 box(.05,.11,.24,matHair,-.12,1.165,-.01);       // samping tipis ala Erry
 box(.05,.11,.24,matHair,.12,1.165,-.01);
 box(.26,.12,.07,matHair,0,1.16,-.125);         // belakang ala Erry
 box(.15,.05,.06,matHair,.095,1.22,.115);       // poni KANAN saja — kiri DIHAPUS, y 1.22 (clearance kacamata)
 const legL=new THREE.Group(),legR=new THREE.Group();
 legL.position.set(-.12,.49,0);legR.position.set(.12,.49,0);rig.add(legL,legR);
 for(const leg of[legL,legR]){
  box(.146,.41,.17,matPants,0,-.206,0,leg);
  box(.155,.10,.24,matBoot,0,-.44,.04,leg);
 }
  const offArmG=new THREE.Group();offArmG.position.set(.25,.83,0);rig.add(offArmG); // FIX(22a): bahu pulih — menembus torso (was .19,.83,.03). Jangkauan aim lewat pose, bukan bahu
 box(.13,.16,.155,matShirt,0,-.077,0,offArmG);
 box(.11,.23,.12,matSkin,0,-.25,0,offArmG);
 const gunArm=new THREE.Group();gunArm.position.set(-.25,.82,0);rig.add(gunArm); // FIX(24a): sejajar bahu kiri
 box(.13,.155,.16,matShirt,0,0,.08,gunArm);
 box(.11,.12,.22,matSkin,0,-.01,.24,gunArm);
 box(.075,.11,.18,matGunB,0,-.01,.16,gunArm);    // popor kayu (belakang stock Mini-14)
 box(.05,.09,.07,matGunB,0,-.05,.24,gunArm);     // grip kayu
 box(.08,.10,.20,matGunA,0,.03,.32,gunArm);      // receiver baja
 box(.07,.075,.24,matGunB,0,-.01,.53,gunArm);    // FOREND KAYU — lanjutan stock ke depan
 box(.045,.045,.34,matGunA,0,.05,.60,gunArm);    // LARAS ramping PANJANG (z .43–.77)
 box(.015,.045,.015,matGunB,0,.09,.75,gunArm);   // front sight blade (khas Mini-14)
 box(.055,.12,.08,matGunB,0,-.10,.36,gunArm);    // MAGAZINE KOTAK bawah receiver
 const tip=new THREE.Object3D();tip.position.set(0,.05,.79);gunArm.add(tip);
 gunArm.rotation.x=Math.PI/2;
 const selArrow=new THREE.Mesh(new THREE.ConeGeometry(.09,.18,4),
  new THREE.MeshBasicMaterial({color:0xffffff}));
 selArrow.rotation.x=Math.PI;selArrow.position.y=1.5;g.add(selArrow);
 const hitBox=new THREE.Mesh(new THREE.BoxGeometry(.9,1.8,.9),
  new THREE.MeshBasicMaterial({visible:false}));
 hitBox.position.y=.9;g.add(hitBox);
 g.userData={legL,legR,gunArm,offArm:offArmG,aimSupport:offArmG,tip,selArrow,rig,
  flashT:0,flashMats:[matVest,matSkin],
  aim:{parts:[gunArm],down:Math.PI/2,up:0},
  death:{gun:[1.45,.99,0],off:[0,0,.12],lift:.025}};
 return g;
}
// ---- F9a: REZA — hoodie PUTIH, celana hitam, rambut TIPIS, kacamata tipis ----
// skin Diaz · ASSAULT RIFLE (magasin melengkung)
function makeRezaMesh(){
 const g=new THREE.Group();
 const rig=new THREE.Group();g.add(rig);
 const matSkin =new THREE.MeshLambertMaterial({color:0xca9b75}); // skin Diaz
 const matHood =new THREE.MeshLambertMaterial({color:0xe8e8e0}); // hoodie putih
 const matPants=new THREE.MeshLambertMaterial({color:0x222228}); // hitam
 const matHair =new THREE.MeshLambertMaterial({color:0x201a14}); // tipis
 const matFrame=new THREE.MeshLambertMaterial({color:0x1a1a1a});
 const matShoe =new THREE.MeshLambertMaterial({color:0x2e3338});
 const matGunA =new THREE.MeshLambertMaterial({color:0x3e463e});
 const matGunB =new THREE.MeshLambertMaterial({color:0x242a25});
 const matEye  =new THREE.MeshLambertMaterial({color:0x14100c});
 const box=(w,h,d,mat,x,y,z,parent)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;
  (parent||rig).add(m);return m;
 };
 box(.42,.45,.24,matHood,0,.70,0);               // torso hoodie (pola Rehan, putih)
 box(.30,.13,.11,matHood,0,.94,-.16);            // hood terlipat belakang
 box(.20,.11,.03,matHood,0,.56,.125);            // kantong kanguru
 box(.025,.14,.02,matHood,-.05,.79,.125);        // tali kiri
 box(.025,.14,.02,matHood,.05,.79,.125);         // tali kanan
 box(.14,.09,.09,matSkin,0,.94,0);
 box(.24,.27,.24,matSkin,0,1.12,0);
 box(.026,.026,.02,matEye,-.055,1.14,.125);
 box(.026,.026,.02,matEye,.055,1.14,.125);
 mkGlasses(rig,matFrame,1.15,.135,false); // FIX(17): ring — solid
 box(.26,.07,.28,matHair,0,1.25,0);           // FIX(15): z ±.14 — muka depan tak segaris dgn kepala
 box(.05,.11,.24,matHair,-.12,1.165,-.01);       // samping — naik sampai 1.22 (overlap topi)
 box(.05,.11,.24,matHair,.12,1.165,-.01);
 box(.26,.12,.07,matHair,0,1.16,-.125);         // belakang
 box(.25,.05,.06,matHair,0,1.215,.115);          // poni penuh (tanpa belahan)
 const legL=new THREE.Group(),legR=new THREE.Group();
 legL.position.set(-.12,.49,0);legR.position.set(.12,.49,0);rig.add(legL,legR);
 for(const leg of[legL,legR]){
  box(.146,.41,.17,matPants,0,-.206,0,leg);
  box(.155,.10,.24,matShoe,0,-.44,.04,leg);
 }
  const offArmG=new THREE.Group();offArmG.position.set(.25,.83,0);rig.add(offArmG); // FIX(22a): bahu pulih — menembus torso (was .19,.83,.03). Jangkauan aim lewat pose, bukan bahu
 box(.14,.17,.16,matHood,0,-.08,0,offArmG);
 box(.11,.23,.12,matSkin,0,-.26,0,offArmG);
 const gunArm=new THREE.Group();gunArm.position.set(-.25,.82,0);rig.add(gunArm); // FIX(24a): sejajar bahu kiri
 box(.13,.155,.16,matHood,0,0,.08,gunArm);
 box(.11,.12,.22,matSkin,0,-.01,.24,gunArm);
 box(.04,.04,.15,matGunA,0,.02,.175,gunArm);     // BUFFER TUBE (khas M4)
 box(.065,.10,.09,matGunB,0,0,.10,gunArm);       // sliding stock + butt pad
 box(.05,.10,.07,matGunB,0,-.06,.26,gunArm);     // grip
 box(.09,.12,.24,matGunA,0,.02,.34,gunArm);      // receiver
 box(.03,.035,.20,matGunA,0,.105,.36,gunArm);    // rail atas (flat-top M4)
 box(.075,.085,.20,matGunB,0,.03,.52,gunArm);    // handguard
 box(.088,.098,.035,matGunA,0,.03,.47,gunArm);   // ring handguard 1 (ril kulit M4)
 box(.088,.098,.035,matGunA,0,.03,.58,gunArm);   // ring handguard 2
 box(.035,.08,.04,matGunB,0,.075,.635,gunArm);   // front sight block M4
 box(.04,.04,.12,matGunA,0,.04,.70,gunArm);      // laras
 box(.05,.05,.045,matGunB,0,.04,.77,gunArm);     // flash hider
 const mg=box(.055,.17,.075,matGunB,0,-.11,.40,gunArm);mg.rotation.x=-.15; // magasin agak panjang + lengkung
 const tip=new THREE.Object3D();tip.position.set(0,.04,.80);gunArm.add(tip);
 gunArm.rotation.x=Math.PI/2;
 const selArrow=new THREE.Mesh(new THREE.ConeGeometry(.09,.18,4),
  new THREE.MeshBasicMaterial({color:0xffffff}));
 selArrow.rotation.x=Math.PI;selArrow.position.y=1.5;g.add(selArrow);
 const hitBox=new THREE.Mesh(new THREE.BoxGeometry(.9,1.8,.9),
  new THREE.MeshBasicMaterial({visible:false}));
 hitBox.position.y=.9;g.add(hitBox);
 g.userData={legL,legR,gunArm,offArm:offArmG,aimSupport:offArmG,tip,selArrow,rig,
  flashT:0,flashMats:[matHood,matSkin],
  aim:{parts:[gunArm],down:Math.PI/2,up:0},
  death:{gun:[1.45,.99,0],off:[0,0,.12],lift:.025}};
 return g;
}
// ---- F9a-2: LELE — kaos TANPA LENGAN putih, celana PENDEK jeans biru, KALUNG RANTAI ----
// Rambut TEBAL belah tengah (> Memet) · skin Rehan · KACAMATA KOTAK (spesifikasi: seperti Alvi)
// SEMI-AUTO SHOTGUN ala Benelli M4 — TANPA choke, pistol grip + stock, handguard bervent
function makeLeleMesh(){
 const g=new THREE.Group();
 const rig=new THREE.Group();g.add(rig);
 const matSkin =new THREE.MeshLambertMaterial({color:0xa87440}); // skin Rehan
 const matShirt=new THREE.MeshLambertMaterial({color:0xecece4}); // putih
 const matShort=new THREE.MeshLambertMaterial({color:0x3c5a8c}); // jeans biru
 const matHair =new THREE.MeshLambertMaterial({color:0x1a1512}); // hitam tebal
 const matChain=new THREE.MeshLambertMaterial({color:0x9aa0a8}); // rantai metal
 const matFrame=new THREE.MeshLambertMaterial({color:0x141414});
 const matShoe =new THREE.MeshLambertMaterial({color:0x2e3338});
 const matGunA =new THREE.MeshLambertMaterial({color:0x3a4038});
 const matGunB =new THREE.MeshLambertMaterial({color:0x242a25});
 const matEye  =new THREE.MeshLambertMaterial({color:0x14100c});
 const box=(w,h,d,mat,x,y,z,parent)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;
  (parent||rig).add(m);return m;
 };
 // 1. Torso kaos tanpa lengan + bahu kulit terlihat
 box(.42,.45,.24,matShirt,0,.70,0);
 box(.17,.10,.26,matSkin,-.14,.885,0);            // bahu kulit kiri
 box(.17,.10,.26,matSkin,.14,.885,0);             // bahu kulit kanan
 // 2. KALUNG RANTAI — 7 mata V-shape di dada
 {const pts=[[-.10,.875],[.10,.875],[-.075,.845],[.075,.845],[-.04,.822],[.04,.822],[0,.812]];
  for(const[px,py]of pts)box(.035,.035,.035,matChain,px,py,.135);}
 // 3. Leher & kepala
 box(.14,.09,.09,matSkin,0,.94,0);
 box(.24,.27,.24,matSkin,0,1.12,0);
 box(.026,.026,.02,matEye,-.055,1.14,.125);
 box(.026,.026,.02,matEye,.055,1.14,.125);
 mkGlasses(rig,matFrame,1.14,.135,true); // F9a-2: BOX — sama Alvi (spesifikasi)
 // 4. Rambut TEBAL belah tengah (curtain mid-part) — LEBIH TEBAL dari Memet, aturan 6-bidang
 box(.13,.16,.29,matHair,-.07,1.26,0);   // belahan kiri — tebal & tinggi
 box(.13,.16,.29,matHair,.07,1.26,0);    // belahan kanan (celah tengah = belahan)
 box(.08,.19,.29,matHair,-.12,1.17,0);   // samping tebal — rapat
 box(.08,.19,.29,matHair,.12,1.17,0);
 box(.29,.20,.09,matHair,0,1.19,-.135);  // belakang tebal
 // 5. Kaki: celana pendek jeans + betis kulit
 const legL=new THREE.Group(),legR=new THREE.Group();
 legL.position.set(-.12,.49,0);legR.position.set(.12,.49,0);rig.add(legL,legR);
 for(const leg of[legL,legR]){
  box(.146,.22,.17,matShort,0,-.11,0,leg);
  box(.13,.17,.15,matSkin,0,-.28,0,leg);
  box(.15,.10,.22,matShoe,0,-.44,.03,leg);
 }
 // 6. Lengan KIRI menggantung — KULIT (kaos tanpa lengan)
  const offArmG=new THREE.Group();offArmG.position.set(.25,.83,0);rig.add(offArmG); // FIX(22a): bahu pulih — menembus torso (was .19,.83,.03). Jangkauan aim lewat pose, bukan bahu
 box(.115,.17,.125,matSkin,0,-.08,0,offArmG);
 box(.10,.23,.11,matSkin,0,-.26,0,offArmG);
 // 7. Lengan KANAN = gun arm + BENELLI M4 (tanpa choke — spesifikasi)
 const gunArm=new THREE.Group();gunArm.position.set(-.25,.82,0);rig.add(gunArm); // FIX(24a): sejajar bahu kiri
 box(.115,.155,.16,matSkin,0,0,.08,gunArm);
 box(.10,.12,.22,matSkin,0,-.01,.24,gunArm);
 box(.06,.10,.08,matGunB,0,-.06,.22,gunArm);     // pistol grip (khas M4)
 box(.055,.085,.16,matGunB,0,.03,.14,gunArm);    // stock pendek + buttpad
 box(.09,.12,.24,matGunA,0,.03,.38,gunArm);      // receiver
 box(.015,.03,.03,matGunB,.05,.07,.34,gunArm);   // tombol eject kanan
 box(.075,.085,.22,matGunB,0,.02,.56,gunArm);    // handguard Benelli
 box(.078,.09,.02,matGunA,0,.02,.48,gunArm);     // ring vent handguard 1
 box(.078,.09,.02,matGunA,0,.02,.62,gunArm);     // ring vent handguard 2
 box(.04,.04,.24,matGunA,0,-.005,.62,gunArm);    // tabung amunisi bawah laras
 box(.045,.045,.20,matGunA,0,.05,.70,gunArm);    // laras — MUZZLE BERSIH (tanpa choke)
 box(.045,.06,.02,matGunA,0,.09,.50,gunArm);     // front sight atas
 const tip=new THREE.Object3D();tip.position.set(0,.05,.78);gunArm.add(tip);
 gunArm.rotation.x=Math.PI/2;
 const selArrow=new THREE.Mesh(new THREE.ConeGeometry(.09,.18,4),
  new THREE.MeshBasicMaterial({color:0xffffff}));
 selArrow.rotation.x=Math.PI;selArrow.position.y=1.5;g.add(selArrow);
 const hitBox=new THREE.Mesh(new THREE.BoxGeometry(.9,1.8,.9),
  new THREE.MeshBasicMaterial({visible:false}));
 hitBox.position.y=.9;g.add(hitBox);
 g.userData={legL,legR,gunArm,offArm:offArmG,aimSupport:offArmG,tip,selArrow,rig,
  flashT:0,flashMats:[matShirt,matSkin],
  aim:{parts:[gunArm],down:Math.PI/2,up:0},
  death:{gun:[1.45,.99,0],off:[0,0,.12],lift:.025}};
 return g;
}
// ---- F9a-2: RAPTOR — jaket hitam, jeans beige, rambut TIPIS · skin Rehan ----
// BOLT-ACTION SNIPER ala AWP — laras panjang + scope BESAR (bell lensa, jarak jauh) + bolt handle
function makeRaptorMesh(){
 const g=new THREE.Group();
 const rig=new THREE.Group();g.add(rig);
 const matSkin =new THREE.MeshLambertMaterial({color:0xa87440}); // skin Rehan
 const matJacket=new THREE.MeshLambertMaterial({color:0x1c1c20}); // hitam
 const matJeans=new THREE.MeshLambertMaterial({color:0xb8a880}); // beige
 const matHair =new THREE.MeshLambertMaterial({color:0x201a14}); // tipis
 const matBoot =new THREE.MeshLambertMaterial({color:0x1a1a1c});
 const matGunA =new THREE.MeshLambertMaterial({color:0x3a4436}); // hijau gelap khas AWP
 const matGunB =new THREE.MeshLambertMaterial({color:0x242a25});
 const matEye  =new THREE.MeshLambertMaterial({color:0x14100c});
 const box=(w,h,d,mat,x,y,z,parent)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;
  (parent||rig).add(m);return m;
 };
 // 1. Torso jaket
 box(.42,.45,.24,matJacket,0,.70,0);
 // 2. Leher & kepala
 box(.14,.09,.09,matSkin,0,.94,0);
 box(.24,.27,.24,matSkin,0,1.12,0);
 box(.045,.045,.02,matEye,-.055,1.14,.125);
 box(.045,.045,.02,matEye,.055,1.14,.125);
 // 3. Rambut TIPIS (pola Reza — aturan 6-bidang)
 box(.26,.07,.28,matHair,0,1.25,0);
 box(.05,.11,.24,matHair,-.12,1.165,-.01);
 box(.05,.11,.24,matHair,.12,1.165,-.01);
 box(.26,.12,.07,matHair,0,1.16,-.125);
 box(.25,.05,.06,matHair,0,1.215,.115);          // poni penuh
 // 4. Kaki jeans beige
 const legL=new THREE.Group(),legR=new THREE.Group();
 legL.position.set(-.12,.49,0);legR.position.set(.12,.49,0);rig.add(legL,legR);
 for(const leg of[legL,legR]){
  box(.146,.41,.17,matJeans,0,-.206,0,leg);
  box(.155,.10,.24,matBoot,0,-.44,.04,leg);
 }
 // 5. Lengan KIRI
 const offArmG=new THREE.Group();offArmG.position.set(.25,.83,0);rig.add(offArmG); // FIX(22a): bahu pulih — menembus torso (was .19,.83,.03). Jangkauan aim lewat pose, bukan bahu
 box(.14,.17,.16,matJacket,0,-.08,0,offArmG);
 box(.11,.23,.12,matSkin,0,-.26,0,offArmG);
 // 6. Lengan KANAN = gun arm + AWP
 const gunArm=new THREE.Group();gunArm.position.set(-.25,.82,0);rig.add(gunArm); // FIX(24a): sejajar bahu kiri
 box(.13,.155,.16,matJacket,0,0,.08,gunArm);
 box(.11,.12,.22,matSkin,0,-.01,.24,gunArm);
 box(.05,.09,.07,matGunB,0,-.06,.22,gunArm);     // grip
 box(.06,.10,.18,matGunA,0,.02,.12,gunArm);       // popor
 box(.05,.05,.03,matGunB,0,.09,.05,gunArm);      // cheek riser
 box(.075,.10,.22,matGunA,0,.03,.32,gunArm);     // receiver/action
 box(.02,.02,.09,matGunB,.05,.02,.30,gunArm);    // BOLT HANDLE kanan (khas bolt-action)
 box(.02,.05,.05,matGunB,0,.10,.26,gunArm);      // mount scope depan
 box(.02,.05,.05,matGunB,0,.10,.38,gunArm);      // mount scope belakang
 box(.045,.045,.22,matGunB,0,.155,.32,gunArm);  // tabung scope
 box(.065,.065,.05,matGunA,0,.155,.44,gunArm);   // BELL LENSA depan — besar (jarak jauh)
 box(.05,.05,.04,matGunB,0,.155,.20,gunArm);     // eyepiece
 box(.035,.035,.26,matGunA,0,.03,.56,gunArm);    // LARAS panjang ramping
 box(.05,.05,.06,matGunB,0,.03,.72,gunArm);      // muzzle brake
 const tip=new THREE.Object3D();tip.position.set(0,.03,.77);gunArm.add(tip);
 gunArm.rotation.x=Math.PI/2;
 const selArrow=new THREE.Mesh(new THREE.ConeGeometry(.09,.18,4),
  new THREE.MeshBasicMaterial({color:0xffffff}));
 selArrow.rotation.x=Math.PI;selArrow.position.y=1.5;g.add(selArrow);
 const hitBox=new THREE.Mesh(new THREE.BoxGeometry(.9,1.8,.9),
  new THREE.MeshBasicMaterial({visible:false}));
 hitBox.position.y=.9;g.add(hitBox);
 g.userData={legL,legR,gunArm,offArm:offArmG,aimSupport:offArmG,tip,selArrow,rig,
  flashT:0,flashMats:[matJacket,matSkin],
  aim:{parts:[gunArm],down:Math.PI/2,up:0},
  death:{gun:[1.45,.99,0],off:[0,0,.12],lift:.025}};
 return g;
}
// ---- F9a-2: HAFID — hoodie biru gelap, kemeja coklat, jeans hitam, TOPI BIRU ----
// skin Diaz-lebih-cerah · kacamata ring · MARKSMAN ala Dragunov — stok rangka kayu,
// scope MENENGAH, flash hider PANJANG
function makeHafidMesh(){
 const g=new THREE.Group();
 const rig=new THREE.Group();g.add(rig);
 const matSkin =new THREE.MeshLambertMaterial({color:0xd6ac84}); // skin Diaz lebih cerah
 const matHood =new THREE.MeshLambertMaterial({color:0x2a3a5c}); // hoodie biru gelap
 const matPants=new THREE.MeshLambertMaterial({color:0x222228}); // hitam
 const matHair =new THREE.MeshLambertMaterial({color:0x201a14}); // tipis
 const matCap  =new THREE.MeshLambertMaterial({color:0x3a5a8c}); // topi biru
 const matFrame=new THREE.MeshLambertMaterial({color:0x1a1a1a});
 const matShoe =new THREE.MeshLambertMaterial({color:0x2e3338});
 const matGunA =new THREE.MeshLambertMaterial({color:0x3e463e}); // baja
 const matGunB =new THREE.MeshLambertMaterial({color:0x6a4a2c}); // kayu (khas SVD)
 const matEye  =new THREE.MeshLambertMaterial({color:0x14100c});
 const box=(w,h,d,mat,x,y,z,parent)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;
  (parent||rig).add(m);return m;
 };
 // 1. Torso hoodie (pola Rehan) — F12.13-fix: kemeja coklat di dada dihapus
 box(.42,.45,.24,matHood,0,.70,0);
 box(.30,.13,.11,matHood,0,.94,-.16);             // hood terlipat belakang
 box(.20,.11,.03,matHood,0,.56,.125);             // kantong kanguru
 box(.025,.14,.02,matHood,-.05,.79,.125);         // tali kiri
 box(.025,.14,.02,matHood,.05,.79,.125);          // tali kanan
 // 2. Leher & kepala
 box(.14,.09,.09,matSkin,0,.94,0);
 box(.24,.27,.24,matSkin,0,1.12,0);
 box(.026,.026,.02,matEye,-.055,1.14,.125);
 box(.026,.026,.02,matEye,.055,1.14,.125);
 mkGlasses(rig,matFrame,1.14,.135,false); // ring
 // 3. Rambut tipis + TOPI BIRU di atasnya
 box(.26,.06,.28,matHair,0,1.24,0);
 box(.05,.10,.24,matHair,-.12,1.17,-.01);
 box(.05,.10,.24,matHair,.12,1.17,-.01);
 box(.26,.11,.07,matHair,0,1.16,-.125);
 box(.28,.08,.28,matCap,0,1.30,0);               // crown topi — aturan 6-bidang ✓
 box(.20,.025,.12,matCap,0,1.275,.20);            // brim depan
 // 4. Kaki jeans hitam
 const legL=new THREE.Group(),legR=new THREE.Group();
 legL.position.set(-.12,.49,0);legR.position.set(.12,.49,0);rig.add(legL,legR);
 for(const leg of[legL,legR]){
  box(.146,.41,.17,matPants,0,-.206,0,leg);
  box(.155,.10,.24,matShoe,0,-.44,.04,leg);
 }
 // 5. Lengan KIRI
  const offArmG=new THREE.Group();offArmG.position.set(.25,.83,0);rig.add(offArmG); // FIX(22a): bahu pulih — menembus torso (was .19,.83,.03). Jangkauan aim lewat pose, bukan bahu
 box(.14,.17,.16,matHood,0,-.08,0,offArmG);
 box(.11,.23,.12,matSkin,0,-.26,0,offArmG);
 // 6. Lengan KANAN = gun arm + DRAGUNOV
 const gunArm=new THREE.Group();gunArm.position.set(-.25,.82,0);rig.add(gunArm); // FIX(24a): sejajar bahu kiri
 box(.13,.155,.16,matHood,0,0,.08,gunArm);
 box(.11,.12,.22,matSkin,0,-.01,.24,gunArm);
 // FIX(25): SVD dibangun ulang KETIGA kalinya — dgn AUDIT KOORDINAT:
 // garis laras y .03 konstan · buttpad TINGGI (SVD) nempel rangka · rangka NAMPAK
 // sebagai kerangka (bukan baris kotak melayang) · grip DI TANGAN (kulit z −.10–.12)
 box(.05,.24,.07,matGunB,0,.05,-.01,gunArm);     // buttpad tinggi SVD (y −.07–.17) — BELAKANG bahu
 box(.016,.016,.24,matGunB,0,.10,.14,gunArm);    // rangka ATAS (z .02–.26) — menyatu buttpad→receiver
 box(.016,.016,.24,matGunB,0,-.02,.14,gunArm);   // rangka BAWAH — paralel, celah = look kerangka SVD
 box(.016,.10,.016,matGunB,0,.04,.14,gunArm);    // penyangga tengah — menghubungkan atas-bawah
 box(.05,.09,.06,matGunB,0,-.07,.08,gunArm);     // grip — DI TANGAN (kulit z −.10–.12) ✓
 box(.075,.10,.16,matGunA,0,.03,.30,gunArm);     // receiver (z .22–.38) — nempel ujung rangka
 box(.02,.02,.08,matGunB,.05,.02,.26,gunArm);     // bolt handle kanan
 box(.02,.05,.04,matGunB,0,.10,.28,gunArm);      // mount scope belakang
 box(.02,.05,.04,matGunB,0,.10,.36,gunArm);      // mount scope depan
 box(.04,.04,.14,matGunA,0,.145,.32,gunArm);     // scope menengah — DI ATAS receiver (bukan gap)
 box(.05,.05,.03,matGunB,0,.145,.41,gunArm);     // eyepiece
 box(.06,.09,.16,matGunB,0,.02,.48,gunArm);      // handguard kayu (z .40–.56) — nempel receiver
 box(.035,.035,.10,matGunA,0,.03,.62,gunArm);    // laras (z .57–.67) — keluar handguard
 box(.045,.045,.11,matGunA,0,.03,.72,gunArm);    // FLASH HIDER PANJANG SVD (z .665–.775)
 const tip=new THREE.Object3D();tip.position.set(0,.03,.78);gunArm.add(tip);
 gunArm.rotation.x=Math.PI/2;
 const selArrow=new THREE.Mesh(new THREE.ConeGeometry(.09,.18,4),
  new THREE.MeshBasicMaterial({color:0xffffff}));
 selArrow.rotation.x=Math.PI;selArrow.position.y=1.5;g.add(selArrow);
 const hitBox=new THREE.Mesh(new THREE.BoxGeometry(.9,1.8,.9),
  new THREE.MeshBasicMaterial({visible:false}));
 hitBox.position.y=.9;g.add(hitBox);
 g.userData={legL,legR,gunArm,offArm:offArmG,aimSupport:offArmG,tip,selArrow,rig,
  flashT:0,flashMats:[matHood,matSkin],
  aim:{parts:[gunArm],down:Math.PI/2,up:0},
  death:{gun:[1.45,.99,0],off:[0,0,.12],lift:.025}};
 return g;
}
const HERO_MESH={diaz:makeDiazMesh,bambang:makeBambangMesh, // F8a: pabrik per hero
 rehan:makeRehanMesh,memet:makeMemetMesh,
 sobel:makeSobelMesh,vikry:makeVikryMesh,erry:makeErryMesh, // F9a: +6 Rare
 ariz:makeArizMesh,alvi:makeAlviMesh,reza:makeRezaMesh,
 lele:makeLeleMesh,raptor:makeRaptorMesh,hafid:makeHafidMesh}; // F9a-2: +3 SR
function makeZombieMesh(type){
 const v=ZVIS[type],g=new THREE.Group();
 const skin=new THREE.MeshLambertMaterial({color:v.skin});
 const cloth=new THREE.MeshLambertMaterial({color:v.cloth});
 const eyeMat=new THREE.MeshBasicMaterial({color:0xffa060});
 if(v.crawl){
  // F5: badan kurus, tanpa kaki — panjang = torso Walker (0.5)
  const inner=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(.3,.16,.5),cloth);
  body.position.set(0,-.04,-.16);body.castShadow=true;
  const head=new THREE.Mesh(new THREE.BoxGeometry(v.hs,v.hs,v.hs),skin);
  head.position.set(0,.04,.165);head.castShadow=true;
  // F5b: cakar berpivot di BAHU (depan badan) — mengais dari bahu
  const aGeo=new THREE.BoxGeometry(.07,.07,.42);
  const aL=new THREE.Group(),aR=new THREE.Group();
  aL.position.set(-.13,-.05,-.05);aR.position.set(.13,-.05,-.05);
  const amL=new THREE.Mesh(aGeo,skin);amL.position.z=.21;amL.castShadow=true;aL.add(amL);
  const amR=new THREE.Mesh(aGeo,skin);amR.position.z=.21;amR.castShadow=true;aR.add(amR);
  aL.rotation.x=aR.rotation.x=0; // FIX(12e): nilai awal netral — rotasi aktual diatur tiap frame oleh loop (base=0 utk crawler). Cek z.T.crawl di loop sekarang valid berkat flag di ZTYPES.
  const eGeo=new THREE.BoxGeometry(.05,.04,.03);
  const e1=new THREE.Mesh(eGeo,eyeMat),e2=new THREE.Mesh(eGeo,eyeMat);
  e1.position.set(-.05,.06,.28);e2.position.set(.05,.06,.28);
  inner.add(body,head,aL,aR,e1,e2);
  inner.position.set(0,.15,.16);
  g.add(inner);
  g.userData={armL:aL,armR:aR,flashT:0,flashMats:[skin,cloth],pivot:inner};
  return g;
 }
 // F12.11-rework: Patient Zero — gumpalan daging kacau dengan banyak kepala,
 // tangan, kaki, dan potongan random tercampur. Chaotic blob, bukan humanoid.
 if(v.mass){
  const bootM=new THREE.MeshLambertMaterial({color:0x2a221c});
  const bloodM=new THREE.MeshLambertMaterial({color:0x8a1a14});
  const gashM=new THREE.MeshLambertMaterial({color:0x6a1010});
  // --- core mass: 4 boxes fused uneven ---
  const c1=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.3,1.4),cloth);
  c1.position.set(0,1.05,0);c1.castShadow=true;g.add(c1);
  const c2=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.1,1.5),skin);
  c2.position.set(.45,.95,.35);c2.castShadow=true;g.add(c2);
  const c3=new THREE.Mesh(new THREE.BoxGeometry(1.3,1.2,1.1),cloth);
  c3.position.set(-.55,1.15,-.35);c3.castShadow=true;g.add(c3);
  const c4=new THREE.Mesh(new THREE.BoxGeometry(.8,.9,.8),skin);
  c4.position.set(.1,1.65,-.15);c4.rotation.z=.3;c4.castShadow=true;g.add(c4);
  // --- 7 heads at chaotic angles ---
  const heads=[
   {x:-.5,y:1.95,z:.45,s:.48,ry:0,   rz:.10,eyes:true},
   {x:.45,y:1.90,z:-.15,s:.44,ry:.5, rz:-.15,eyes:true},
   {x:.05,y:2.10,z:.55,s:.40,ry:-.4, rz:.20},
   {x:-.25,y:1.80,z:-.65,s:.46,ry:1.1,rz:.15,eyes:true},
   {x:.65,y:1.75,z:.45,s:.38,ry:-.6, rz:.25},
   {x:-.70,y:1.70,z:-.15,s:.36,ry:2.4,rz:-.20},
   {x:.20,y:2.05,z:-.55,s:.34,ry:3.0,rz:.30},
  ];
  heads.forEach((p,i)=>{
   const h=new THREE.Mesh(new THREE.BoxGeometry(p.s,p.s*.85,p.s),skin);
   h.position.set(p.x,p.y,p.z);
   h.rotation.y=p.ry||0;
   h.rotation.z=p.rz||0;
   h.castShadow=true; g.add(h);
   // jaw detail (small box below, offset front)
   const jaw=new THREE.Mesh(new THREE.BoxGeometry(p.s*.75,p.s*.2,p.s*.7),skin);
   jaw.position.set(p.x,p.y-p.s*.38,p.z+p.s*.15);
   jaw.rotation.y=p.ry||0;
   g.add(jaw);
   if(p.eyes){
    const eg=new THREE.BoxGeometry(.055,.045,.03);
    const e1=new THREE.Mesh(eg,eyeMat),e2=new THREE.Mesh(eg,eyeMat);
    // offset perpendicular to yaw for correct facing
    const ox=Math.cos(p.ry||0)*.09, oz=-Math.sin(p.ry||0)*.09;
    e1.position.set(p.x-ox,p.y+.02,p.z+p.s/2+.02);
    e2.position.set(p.x+ox,p.y+.02,p.z+p.s/2+.02);
    g.add(e1,e2);
    // mouth gash
    const gh=new THREE.Mesh(new THREE.BoxGeometry(p.s*.5,.06,.02),gashM);
    gh.position.set(p.x,p.y-p.s*.15,p.z+p.s/2+.02);
    gh.rotation.y=p.ry||0;
    g.add(gh);
   }
  });
  // --- 9 arms flailing (skin/cloth mixed) ---
  const arms=[
   {x:-1.0,y:1.35,z:.35, rx:-.9,rz:.55, len:.75, cloth:false},
   {x:1.0,y:1.45,z:-.25,rx:-1.1,rz:-.55,len:.70, cloth:true},
   {x:-.80,y:.70,z:.55,rx:1.4,rz:.30, len:.65, cloth:false},
   {x:.85,y:.65,z:.60, rx:1.5,rz:-.25,len:.70, cloth:false},
   {x:-.55,y:1.75,z:-.80,rx:-1.3,rz:.20,len:.60, cloth:true},
   {x:.65,y:1.70,z:.75, rx:-.8,rz:-.60,len:.65, cloth:false},
   {x:-.95,y:1.05,z:-.45,rx:.50,rz:.75, len:.60, cloth:true},
   {x:.95,y:1.05,z:.45, rx:.40,rz:-.75,len:.60, cloth:false},
   {x:0,  y:1.90,z:.90, rx:-.5,rz:0,   len:.55, cloth:false},
  ];
  arms.forEach(p=>{
   const arm=new THREE.Group();
   arm.position.set(p.x,p.y,p.z);
   arm.rotation.x=p.rx; arm.rotation.z=p.rz;
   const up=new THREE.Mesh(new THREE.BoxGeometry(.22,p.len,.22),
    p.cloth?cloth:skin);
   up.position.y=p.len*.5; up.castShadow=true; arm.add(up);
   const fo=new THREE.Mesh(new THREE.BoxGeometry(.20,p.len*.9,.20),skin);
   fo.position.y=p.len*1.40; fo.castShadow=true; arm.add(fo);
   const hd=new THREE.Mesh(new THREE.BoxGeometry(.22,.14,.24),skin);
   hd.position.y=p.len*1.95; hd.castShadow=true; arm.add(hd);
   g.add(arm);
  });
  // --- 4 legs sticking out sides & bottom ---
  const legs=[
   {x:-.45,y:.55,z:.30, rx:.20,rz:.10,len:.75},
   {x:.50, y:.45,z:-.20,rx:-.15,rz:-.15,len:.70},
   {x:.15, y:.35,z:.65, rx:.60,rz:0,   len:.65},
   {x:-.55,y:.60,z:-.45,rx:-.50,rz:.30,len:.55},
  ];
  legs.forEach(p=>{
   const lg=new THREE.Mesh(new THREE.BoxGeometry(.26,p.len,.28),cloth);
   lg.position.set(p.x,p.y,p.z);
   lg.rotation.x=p.rx; lg.rotation.z=p.rz;
   lg.castShadow=true; g.add(lg);
   const bt=new THREE.Mesh(new THREE.BoxGeometry(.28,.14,.34),bootM);
   bt.position.set(p.x,p.y-p.len*.5-.04,p.z+.06);
   bt.castShadow=true; g.add(bt);
  });
  // --- 10 random chunk boxes embedded ---
  for(let i=0;i<10;i++){
   const s=rnd(.18,.32);
   const m=new THREE.Mesh(new THREE.BoxGeometry(s,s,s),i%2?skin:cloth);
   m.position.set(rnd(-1.0,1.0),rnd(.55,1.85),rnd(-.85,.85));
   m.rotation.set(rnd(-.5,.5),rnd(0,6.28),rnd(-.5,.5));
   m.castShadow=true; g.add(m);
  }
  // --- blood splatters ---
  for(let i=0;i<4;i++){
   const b=new THREE.Mesh(new THREE.BoxGeometry(rnd(.15,.3),rnd(.08,.14),.02),bloodM);
   b.position.set(rnd(-.8,.8),rnd(.8,1.7),rnd(-.7,.7));
   g.add(b);
  }
  g.userData={flashT:0,flashMats:[skin,cloth,bootM]};
  return g;
 }
  // F12.11-rework: Zombie Alpha — heroic-proportioned muscular zombie.
 // Bare torso (skin), dirty pants, ~2× taller than characters, broad shoulders.
 // Tidak pakai v.scale — model dibangun pada ukuran final.
 if(type === 'ZAlpha'){
  // F12.11-rework-fix: pale gray skin + glowing red eyes — shadow outer
  // `skin`/`eyeMat` (block-scoped override) supaya hanya ZAlpha yang berubah,
  // tanpa mengganggu zombie lain.
  // F12.11-fix2: samain skin Creeper (0x6a6055) tapi ~20% lebih gelap → 0x554d44
  const skin=new THREE.MeshLambertMaterial({color:0x554d44});
  const eyeMat=new THREE.MeshBasicMaterial({color:0xff1818}); // glowing red
  const bootM=new THREE.MeshLambertMaterial({color:0x2a221c});
  const pantM=new THREE.MeshLambertMaterial({color:0x3a2e24}); // dirty brown
  const dirtM=new THREE.MeshLambertMaterial({color:0x1e1812});
  const scarM=new THREE.MeshLambertMaterial({color:0x6a3020});
  const bloodM=new THREE.MeshLambertMaterial({color:0x8a1a14});
  // --- legs (dirty pants) ---
  const mkLeg=side=>{
   const leg=new THREE.Group();
   leg.position.set(.20*side,.88,0);
   g.add(leg);
   const th=new THREE.Mesh(new THREE.BoxGeometry(.28,.42,.28),pantM);
   th.position.y=-.21; th.castShadow=true; leg.add(th);
   const sh=new THREE.Mesh(new THREE.BoxGeometry(.26,.38,.26),pantM);
   sh.position.y=-.61; sh.castShadow=true; leg.add(sh);
   // tear on thigh — skin visible
   const tear=new THREE.Mesh(new THREE.BoxGeometry(.18,.14,.02),skin);
   tear.position.set(.02,-.30,.15); leg.add(tear);
   const dirt=new THREE.Mesh(new THREE.BoxGeometry(.16,.10,.02),dirtM);
   dirt.position.set(-.04,-.55,.14); leg.add(dirt);
   const bt=new THREE.Mesh(new THREE.BoxGeometry(.28,.12,.34),bootM);
   bt.position.set(0,-.86,.04); bt.castShadow=true; leg.add(bt);
   return leg;
  };
  const legL = mkLeg(-1);
  const legR = mkLeg(1);
  // --- abs (bare torso) + 6-pack ---
  const abs=new THREE.Mesh(new THREE.BoxGeometry(.60,.42,.38),skin);
  abs.position.set(0,1.10,0); abs.castShadow=true; g.add(abs);
  for(let r=0;r<3;r++)for(let c=0;c<2;c++){
   const a=new THREE.Mesh(new THREE.BoxGeometry(.20,.12,.03),skin);
   a.position.set(c?.16:-.16, 1.22-r*.14, .20);
   g.add(a);
  }
  // --- chest (broad) + pecs ---
  const chest=new THREE.Mesh(new THREE.BoxGeometry(.74,.56,.42),skin);
  chest.position.set(0,1.55,0); chest.castShadow=true; g.add(chest);
  const pecL=new THREE.Mesh(new THREE.BoxGeometry(.30,.18,.05),skin);
  pecL.position.set(-.18,1.52,.22); g.add(pecL);
  const pecR=new THREE.Mesh(new THREE.BoxGeometry(.30,.18,.05),skin);
  pecR.position.set(.18,1.52,.22); g.add(pecR);
  // --- bulky deltoids ---
  const shL=new THREE.Mesh(new THREE.BoxGeometry(.26,.32,.38),skin);
  shL.position.set(-.46,1.60,0); shL.castShadow=true; g.add(shL);
  const shR=new THREE.Mesh(new THREE.BoxGeometry(.26,.32,.38),skin);
  shR.position.set(.46,1.60,0); shR.castShadow=true; g.add(shR);
  // --- neck + head + jaw + eyes + hair ---
  const neck=new THREE.Mesh(new THREE.BoxGeometry(.24,.14,.24),skin);
  neck.position.set(0,1.92,0); neck.castShadow=true; g.add(neck);
  const skull=new THREE.Mesh(new THREE.BoxGeometry(.40,.42,.40),skin);
  skull.position.set(0,2.14,0); skull.castShadow=true; g.add(skull);
  const jaw=new THREE.Mesh(new THREE.BoxGeometry(.34,.10,.36),skin);
  jaw.position.set(0,1.94,.03); jaw.castShadow=true; g.add(jaw);
  const eg=new THREE.BoxGeometry(.085,.065,.035); // F12.11-fix: lebih besar → glow bloom lebih terasa
  const e1=new THREE.Mesh(eg,eyeMat), e2=new THREE.Mesh(eg,eyeMat);
  e1.position.set(-.10,2.18,.21); e2.position.set(.10,2.18,.21);
  g.add(e1,e2);
  const hairM=new THREE.MeshLambertMaterial({color:v.hair||0x2a1a10});
  const hTop=new THREE.Mesh(new THREE.BoxGeometry(.42,.10,.42),hairM);
  hTop.position.set(0,2.40,0); g.add(hTop);
  const hFront=new THREE.Mesh(new THREE.BoxGeometry(.40,.08,.05),hairM);
  hFront.position.set(0,2.36,.19); g.add(hFront);
  const hBack=new THREE.Mesh(new THREE.BoxGeometry(.38,.14,.06),hairM);
  hBack.position.set(0,2.32,-.18); g.add(hBack);
  // --- arms (thick, muscular) ---
  const mkArm=side=>{
   const arm=new THREE.Group();
   arm.position.set(.46*side,1.58,0);
   g.add(arm);
   const bi=new THREE.Mesh(new THREE.BoxGeometry(.24,.40,.26),skin);
   bi.position.y=-.20; bi.castShadow=true; arm.add(bi);
   const tri=new THREE.Mesh(new THREE.BoxGeometry(.22,.16,.20),skin);
   tri.position.set(0,-.14,-.06); arm.add(tri);
   const fo=new THREE.Mesh(new THREE.BoxGeometry(.22,.34,.24),skin);
   fo.position.y=-.55; fo.castShadow=true; arm.add(fo);
   const hd=new THREE.Mesh(new THREE.BoxGeometry(.24,.16,.26),skin);
   hd.position.y=-.79; hd.castShadow=true; arm.add(hd);
   // F12.11-fix6: rotation.z tanda dibalik (+.10*side) supaya lengan bagian
   // bawah menjauh dari body — pose "gagah" splay. Loop animasi gameplay
   // tetap override rotation.x, tapi tidak menyentuh rotation.z, jadi pose
   // splay ini juga terlihat in-game.
   arm.rotation.z=.10*side;
   return arm;
  };
  const armL = mkArm(-1);
  const armR = mkArm(1);
  // --- battle scars & blood ---
  const sc1=new THREE.Mesh(new THREE.BoxGeometry(.36,.05,.02),scarM);
  sc1.position.set(-.10,1.58,.22); sc1.rotation.z=.5; g.add(sc1);
  const sc2=new THREE.Mesh(new THREE.BoxGeometry(.30,.04,.02),scarM);
  sc2.position.set(.12,1.10,.21); sc2.rotation.z=-.3; g.add(sc2);
  const bl1=new THREE.Mesh(new THREE.BoxGeometry(.22,.10,.02),bloodM);
  bl1.position.set(.46,1.56,.18); g.add(bl1);
  const bl2=new THREE.Mesh(new THREE.BoxGeometry(.18,.07,.02),bloodM);
  bl2.position.set(-.46,1.42,.16); g.add(bl2);
  const pd1=new THREE.Mesh(new THREE.BoxGeometry(.20,.10,.02),dirtM);
  pd1.position.set(-.18,-.10,.16); g.add(pd1);
  // F12.11-fix3: legL/legR/armL/armR di userData supaya loop animasi walk
  // (`zu.legL` / `zu.armL` guard) mengenali model ini dan mengayunkan kaki
  // + tangan seperti zombie lain. Tanpa ini, ZAlpha bergerak tapi kaku.
  g.userData={legL,legR,armL,armR,flashT:0,flashMats:[skin,pantM,bootM]};
  return g;
 }
  // F12.11-rework: Bloater — super overweight. Bukan kotak raksasa, tapi
 // 5 tumpukan box bertingkat yang bentuk bell-curve (perut buncit max di tengah).
 if(type === 'Bloater'){
  const bootM=new THREE.MeshLambertMaterial({color:0x2a221c});
  const rotM=new THREE.MeshLambertMaterial({color:0x3a4a2a});   // dark rot patches
  const gashM=new THREE.MeshLambertMaterial({color:0x6a1010});  // blood gash
  const toxM=new THREE.MeshBasicMaterial({color:0x6a9a48});     // toxic drip (self-lit)
  const hairM=new THREE.MeshLambertMaterial({color:v.hair||0x3a3020});

  // --- legs (stubby & thick) ---
  const mkLeg=side=>{
   const leg=new THREE.Group();
   leg.position.set(.28*side,.44,0);
   g.add(leg);
   const th=new THREE.Mesh(new THREE.BoxGeometry(.34,.34,.36),cloth);
   th.position.y=-.17; th.castShadow=true; leg.add(th);
   const bt=new THREE.Mesh(new THREE.BoxGeometry(.36,.10,.42),bootM);
   bt.position.set(0,-.39,.04); bt.castShadow=true; leg.add(bt);
   return leg;
  };
  const legL=mkLeg(-1), legR=mkLeg(1);

  // --- torso: 5 tiers (silhouette bell-curve, bukan kotak) ---
  const hips =new THREE.Mesh(new THREE.BoxGeometry(1.10,.34,.85),cloth);
  hips.position.set(0,.58,0); hips.castShadow=true; g.add(hips);
  const bellyL=new THREE.Mesh(new THREE.BoxGeometry(1.36,.34,1.04),skin);
  bellyL.position.set(0,.90,.06); bellyL.castShadow=true; g.add(bellyL);
  const bellyU=new THREE.Mesh(new THREE.BoxGeometry(1.44,.32,1.10),skin);
  bellyU.position.set(0,1.22,.08); bellyU.castShadow=true; g.add(bellyU);
  const chest=new THREE.Mesh(new THREE.BoxGeometry(1.22,.26,.90),skin);
  chest.position.set(0,1.50,.02); chest.castShadow=true; g.add(chest);
  const shoulder=new THREE.Mesh(new THREE.BoxGeometry(1.58,.24,.78),skin);
  shoulder.position.set(0,1.74,0); shoulder.castShadow=true; g.add(shoulder);

  // --- moobs (saggy chest) — 2 small boxes di depan chest ---
  const moobL=new THREE.Mesh(new THREE.BoxGeometry(.44,.20,.10),skin);
  moobL.position.set(-.28,1.42,.48); g.add(moobL);
  const moobR=new THREE.Mesh(new THREE.BoxGeometry(.44,.20,.10),skin);
  moobR.position.set(.28,1.42,.48); g.add(moobR);

  // --- stretch marks (belly bloat lines) ---
  for(let i=0;i<3;i++){
   const line=new THREE.Mesh(new THREE.BoxGeometry(1.24,.02,.02),rotM);
   line.position.set(0,.86+i*.16,.58); g.add(line);
  }

  // --- neck (short, thick) ---
  const neck=new THREE.Mesh(new THREE.BoxGeometry(.34,.10,.34),skin);
  neck.position.set(0,1.90,0); neck.castShadow=true; g.add(neck);

  // --- head + double chin + jaw ---
  const skull=new THREE.Mesh(new THREE.BoxGeometry(.54,.42,.54),skin);
  skull.position.set(0,2.16,0); skull.castShadow=true; g.add(skull);
  const jaw=new THREE.Mesh(new THREE.BoxGeometry(.46,.10,.48),skin);
  jaw.position.set(0,1.98,.02); jaw.castShadow=true; g.add(jaw);
  const chin1=new THREE.Mesh(new THREE.BoxGeometry(.48,.10,.30),skin);
  chin1.position.set(0,1.98,.16); g.add(chin1);   // dagu bawah 1
  const chin2=new THREE.Mesh(new THREE.BoxGeometry(.38,.08,.24),skin);
  chin2.position.set(0,1.90,.18); g.add(chin2);   // dagu bawah 2 (double chin)

  // --- eyes ---
  const eg=new THREE.BoxGeometry(.06,.05,.03);
  const e1=new THREE.Mesh(eg,eyeMat), e2=new THREE.Mesh(eg,eyeMat);
  e1.position.set(-.14,2.20,.28); e2.position.set(.14,2.20,.28);
  g.add(e1,e2);
  // mouth gash
  const mh=new THREE.Mesh(new THREE.BoxGeometry(.30,.06,.02),gashM);
  mh.position.set(0,2.02,.28); g.add(mh);

  // --- hair (kucar-kacir) ---
  const hTop=new THREE.Mesh(new THREE.BoxGeometry(.56,.10,.56),hairM);
  hTop.position.set(0,2.42,0); g.add(hTop);
  const hBack=new THREE.Mesh(new THREE.BoxGeometry(.50,.18,.08),hairM);
  hBack.position.set(0,2.32,-.32); g.add(hBack);
  const hSideL=new THREE.Mesh(new THREE.BoxGeometry(.08,.14,.50),hairM);
  hSideL.position.set(-.30,2.30,-.02); g.add(hSideL);
  const hSideR=new THREE.Mesh(new THREE.BoxGeometry(.08,.14,.50),hairM);
  hSideR.position.set(.30,2.30,-.02); g.add(hSideR);

  // --- arms (thick, meaty — 4-segment: bicep/elbow/forearm/hand) ---
  const mkArm=side=>{
   const arm=new THREE.Group();
   // F12.11-fix4: pivot digeser keluar (.62→.82) supaya bicep tidak
   // tenggelam di dalam belly. Y dinaikkan 1.66→1.72 supaya pivot sejajar
   // dengan shoulder line (1.74).
   arm.position.set(.82*side,1.72,0);
   g.add(arm);
   // Deltoid: box kecil yang menjorok ke dalam (menuju body) supaya
   // sambungan shoulder → bicep tidak ada gap.
   const del=new THREE.Mesh(new THREE.BoxGeometry(.22,.26,.32),skin);
   del.position.set(-.06*side,0,0); del.castShadow=true; arm.add(del);
   const bi=new THREE.Mesh(new THREE.BoxGeometry(.32,.36,.32),skin);
   bi.position.y=-.18; bi.castShadow=true; arm.add(bi);
   const el=new THREE.Mesh(new THREE.BoxGeometry(.28,.16,.28),skin);
   el.position.y=-.44; el.castShadow=true; arm.add(el);
   const fo=new THREE.Mesh(new THREE.BoxGeometry(.30,.30,.30),skin);
   fo.position.y=-.67; fo.castShadow=true; arm.add(fo);
   const hd=new THREE.Mesh(new THREE.BoxGeometry(.32,.18,.34),skin);
   hd.position.y=-.91; hd.castShadow=true; arm.add(hd);
   // F12.11-fix4: rotation.z +.10*side (was -.10*side) supaya arm bagian
   // bawah bergerak MENJAUHI body, bukan masuk ke dalam.
   arm.rotation.z=.10*side;
   return arm;
  };
  const armL=mkArm(-1), armR=mkArm(1);

  // --- toxic drips (self-lit small boxes di permukaan perut) ---
  for(let i=0;i<4;i++){
   const s=rnd(.06,.10);
   const drip=new THREE.Mesh(new THREE.BoxGeometry(s,rnd(.14,.24),s),toxM);
   drip.position.set(rnd(-.55,.55),rnd(.82,1.20),.60);
   g.add(drip);
  }
  // --- blood / rot patches ---
  for(let i=0;i<5;i++){
   const w=rnd(.10,.20), h=rnd(.06,.12);
   const patch=new THREE.Mesh(new THREE.BoxGeometry(w,h,.02),i%2?rotM:gashM);
   patch.position.set(rnd(-.55,.55),rnd(.86,1.56),.46+i*.02);
   g.add(patch);
  }

  g.userData={legL,legR,armL,armR,flashT:0,flashMats:[skin,cloth,bootM]};
  return g;
 }
  // F12.11-rework: Sprinter — kurus tinggi, lengan & kaki sangat panjang
 // (gaunt runner). Total tinggi ~1.7 unit — di antara zombie normal (1.28)
 // dan Bloater/ZAlpha (2.5). Torso tipis, kepala kecil, postur condong ke depan.
 if(type === 'Sprinter'){
  const bootM=new THREE.MeshLambertMaterial({color:0x2a221c});
  const hairM=new THREE.MeshLambertMaterial({color:v.hair||0x3a3028});
  const bloodM=new THREE.MeshLambertMaterial({color:0x8a1a14});

  // --- legs: panjang & tipis, pivot tinggi (hip di .85) ---
  const mkLeg=side=>{
   const leg=new THREE.Group();
   leg.position.set(.10*side,.85,0);
   g.add(leg);
   const th=new THREE.Mesh(new THREE.BoxGeometry(.13,.34,.15),cloth);
   th.position.y=-.17; th.castShadow=true; leg.add(th);
   const kn=new THREE.Mesh(new THREE.BoxGeometry(.11,.08,.13),skin);
   kn.position.y=-.40; kn.castShadow=true; leg.add(kn);
   const sh=new THREE.Mesh(new THREE.BoxGeometry(.10,.38,.12),skin);
   sh.position.y=-.63; sh.castShadow=true; leg.add(sh);
   const bt=new THREE.Mesh(new THREE.BoxGeometry(.13,.08,.20),bootM);
   bt.position.set(0,-.86,.04); bt.castShadow=true; leg.add(bt);
   return leg;
  };
  const legL=mkLeg(-1), legR=mkLeg(1);

  // --- torso: tipis & sempit, ada forward tilt (hunched runner) ---
  const belly=new THREE.Mesh(new THREE.BoxGeometry(.30,.24,.20),cloth);
  belly.position.set(0,.92,0); belly.rotation.x=.30;
  belly.castShadow=true; g.add(belly);
  const chest=new THREE.Mesh(new THREE.BoxGeometry(.34,.32,.22),cloth);
  chest.position.set(0,1.16,.02); chest.rotation.x=.30;
  chest.castShadow=true; g.add(chest);
  // rusuk (skin visible) — 3 garis horizontal
  for(let i=0;i<3;i++){
   const r=new THREE.Mesh(new THREE.BoxGeometry(.22,.02,.02),skin);
   r.position.set(0,.98+i*.10,.14); g.add(r);
  }
  // shoulder caps
  const shL=new THREE.Mesh(new THREE.BoxGeometry(.16,.14,.20),cloth);
  shL.position.set(-.20,1.30,.04); shL.castShadow=true; g.add(shL);
  const shR=new THREE.Mesh(new THREE.BoxGeometry(.16,.14,.20),cloth);
  shR.position.set(.20,1.30,.04); shR.castShadow=true; g.add(shR);

  // --- leher panjang + kepala kecil ---
  const neck=new THREE.Mesh(new THREE.BoxGeometry(.10,.16,.10),skin);
  neck.position.set(0,1.42,.08); neck.castShadow=true; g.add(neck);
  const skull=new THREE.Mesh(new THREE.BoxGeometry(.20,.24,.20),skin);
  skull.position.set(0,1.60,.10); skull.castShadow=true; g.add(skull);
  const jaw=new THREE.Mesh(new THREE.BoxGeometry(.17,.06,.18),skin);
  jaw.position.set(0,1.50,.11); jaw.castShadow=true; g.add(jaw);
  const eg=new THREE.BoxGeometry(.045,.035,.03);
  const e1=new THREE.Mesh(eg,eyeMat),e2=new THREE.Mesh(eg,eyeMat);
  e1.position.set(-.05,1.62,.205); e2.position.set(.05,1.62,.205);
  g.add(e1,e2);
  // darah dari mulut
  const bl=new THREE.Mesh(new THREE.BoxGeometry(.06,.08,.02),bloodM);
  bl.position.set(0,1.48,.205); g.add(bl);
  // rambut kusut
  const hTop=new THREE.Mesh(new THREE.BoxGeometry(.22,.08,.22),hairM);
  hTop.position.set(0,1.76,.10); hTop.castShadow=true; g.add(hTop);
  const hBack=new THREE.Mesh(new THREE.BoxGeometry(.20,.14,.05),hairM);
  hBack.position.set(0,1.68,.00); g.add(hBack);

  // --- arms: panjang & tipis, 4 segmen, pivot tinggi ---
  const mkArm=side=>{
   const arm=new THREE.Group();
   arm.position.set(.24*side,1.28,.02);
   g.add(arm);
   const bi=new THREE.Mesh(new THREE.BoxGeometry(.13,.36,.15),cloth);
   bi.position.y=-.18; bi.castShadow=true; arm.add(bi);
   const el=new THREE.Mesh(new THREE.BoxGeometry(.11,.08,.13),skin);
   el.position.y=-.40; el.castShadow=true; arm.add(el);
   const fo=new THREE.Mesh(new THREE.BoxGeometry(.10,.34,.12),skin);
   fo.position.y=-.61; fo.castShadow=true; arm.add(fo);
   // cakar panjang — 3 kuku tipis
   const hd=new THREE.Mesh(new THREE.BoxGeometry(.11,.10,.13),skin);
   hd.position.y=-.83; hd.castShadow=true; arm.add(hd);
   for(let i=-1;i<=1;i++){
    const cl=new THREE.Mesh(new THREE.BoxGeometry(.02,.10,.02),skin);
    cl.position.set(i*.035,-.92,.02); arm.add(cl);
   }
   // F12.11-fix5: pose default (Jombipedia) — tangan menjulur ke depan
   // ala zombie "reaching". Loop animasi gameplay tetap meng-override
   // (base -1.05) tiap frame, jadi tidak ada regresi.
   arm.rotation.z=-.06*side;
   arm.rotation.x=-1.15;
   return arm;
  };
  const armL=mkArm(-1), armR=mkArm(1);

  g.userData={legL,legR,armL,armR,flashT:0,flashMats:[skin,cloth,bootM]};
  return g;
 }
  // F12.11-rework: Creeper — beastlike quadruped. Berjalan dengan 2 tangan +
 // 2 kaki (knuckle-walker, gaya gorilla). Torso condong ke depan .55 rad,
 // kedua lengan panjang menyentuh tanah, kaki menekuk pendek. Lebih tinggi
 // dari zombie normal (~1.6 unit) tapi lebih pendek dari Sprinter (1.75)
 // dan lebih tebal/berisi.
 if(type === 'Creeper'){
  const bootM=new THREE.MeshLambertMaterial({color:0x2a221c});
  const hairM=new THREE.MeshLambertMaterial({color:v.hair||0x2a221a});
  const clawM=new THREE.MeshLambertMaterial({color:0x3a2a1a});
  const bloodM=new THREE.MeshLambertMaterial({color:0x8a1a14});
  const scarM=new THREE.MeshLambertMaterial({color:0x6a3020});

  // ---- LEGS: pendek menekuk, pivot hip .65 ----
  const mkLeg=side=>{
   const leg=new THREE.Group();
   leg.position.set(.16*side,.65,0);
   g.add(leg);
   const th=new THREE.Mesh(new THREE.BoxGeometry(.18,.28,.20),cloth);
   th.position.y=-.14; th.castShadow=true; leg.add(th);
   const kn=new THREE.Mesh(new THREE.BoxGeometry(.16,.10,.16),skin);
   kn.position.y=-.32; kn.castShadow=true; leg.add(kn);
   const sh=new THREE.Mesh(new THREE.BoxGeometry(.15,.22,.17),skin);
   sh.position.y=-.46; sh.castShadow=true; leg.add(sh);
   const bt=new THREE.Mesh(new THREE.BoxGeometry(.18,.09,.24),bootM);
   bt.position.set(0,-.61,.04); bt.castShadow=true; leg.add(bt);
   return leg;
  };
  const legL=mkLeg(-1), legR=mkLeg(1);

  // ---- TORSO: bungkus group dengan rotation.x .55 (lean forward) ----
  const torso=new THREE.Group();
  torso.position.set(0,.70,.05);
  torso.rotation.x=.55;
  g.add(torso);

  const hips=new THREE.Mesh(new THREE.BoxGeometry(.42,.24,.30),cloth);
  hips.position.set(0,.05,0); hips.castShadow=true; torso.add(hips);
  const belly=new THREE.Mesh(new THREE.BoxGeometry(.46,.30,.32),skin);
  belly.position.set(0,.30,0); belly.castShadow=true; torso.add(belly);
  const chest=new THREE.Mesh(new THREE.BoxGeometry(.54,.34,.34),skin);
  chest.position.set(0,.60,.02); chest.castShadow=true; torso.add(chest);
  const shL=new THREE.Mesh(new THREE.BoxGeometry(.16,.20,.30),skin);
  shL.position.set(-.31,.78,0); shL.castShadow=true; torso.add(shL);
  const shR=new THREE.Mesh(new THREE.BoxGeometry(.16,.20,.30),skin);
  shR.position.set(.31,.78,0); shR.castShadow=true; torso.add(shR);
  // spine ridge (3 bumps tulang punggung)
  for(let i=0;i<3;i++){
   const rg=new THREE.Mesh(new THREE.BoxGeometry(.10,.08,.10),skin);
   rg.position.set(0,.72-i*.20,-.16); torso.add(rg);
  }

  // ---- NECK + HEAD: agak rendah & maju (animal-like) ----
  const neck=new THREE.Mesh(new THREE.BoxGeometry(.18,.14,.22),skin);
  neck.position.set(0,.92,.30); neck.castShadow=true; torso.add(neck);
  const skull=new THREE.Mesh(new THREE.BoxGeometry(.30,.28,.30),skin);
  skull.position.set(0,1.02,.46); skull.castShadow=true; torso.add(skull);
  const jaw=new THREE.Mesh(new THREE.BoxGeometry(.28,.10,.26),skin);
  jaw.position.set(0,.88,.48); jaw.castShadow=true; torso.add(jaw);
  const jawExt=new THREE.Mesh(new THREE.BoxGeometry(.24,.08,.14),skin);
  jawExt.position.set(0,.86,.60); torso.add(jawExt);
  const eg=new THREE.BoxGeometry(.055,.045,.03);
  const e1=new THREE.Mesh(eg,eyeMat),e2=new THREE.Mesh(eg,eyeMat);
  e1.position.set(-.09,1.04,.62); e2.position.set(.09,1.04,.62);
  torso.add(e1,e2);
  const bl=new THREE.Mesh(new THREE.BoxGeometry(.12,.06,.02),bloodM);
  bl.position.set(0,.84,.62); torso.add(bl);
  // rambut kucar-kacir ala mane
  const hTop=new THREE.Mesh(new THREE.BoxGeometry(.32,.10,.32),hairM);
  hTop.position.set(0,1.19,.46); hTop.castShadow=true; torso.add(hTop);
  const hBack=new THREE.Mesh(new THREE.BoxGeometry(.28,.16,.06),hairM);
  hBack.position.set(0,1.10,.32); torso.add(hBack);
  const hFront=new THREE.Mesh(new THREE.BoxGeometry(.30,.06,.05),hairM);
  hFront.position.set(0,1.15,.60); torso.add(hFront);

  // ---- ARMS: panjang hampir menyentuh tanah. arm.rotation.x = -.55
  //      (counter torso lean) → lengan vertikal di dunia.
  const mkArm=side=>{
   const arm=new THREE.Group();
   arm.position.set(.32*side,.78,.02);
   torso.add(arm);
   const del=new THREE.Mesh(new THREE.BoxGeometry(.20,.20,.22),skin);
   del.position.set(.02*side,0,0); del.castShadow=true; arm.add(del);
   const bi=new THREE.Mesh(new THREE.BoxGeometry(.18,.50,.20),skin);
   bi.position.y=-.29; bi.castShadow=true; arm.add(bi);
   const el=new THREE.Mesh(new THREE.BoxGeometry(.15,.12,.17),skin);
   el.position.y=-.60; el.castShadow=true; arm.add(el);
   const fo=new THREE.Mesh(new THREE.BoxGeometry(.15,.52,.16),skin);
   fo.position.y=-.92; fo.castShadow=true; arm.add(fo);
   const hd=new THREE.Mesh(new THREE.BoxGeometry(.16,.14,.18),skin);
   hd.position.set(0,-1.24,.04); hd.castShadow=true; arm.add(hd);
   // 3 kuku panjang menyapu depan (nyentuh tanah)
   for(let i=-1;i<=1;i++){
    const cl=new THREE.Mesh(new THREE.BoxGeometry(.03,.08,.16),clawM);
    cl.position.set(i*.048,-1.36,.10); arm.add(cl);
   }
   arm.rotation.x=-.55;
   arm.rotation.z=.10*side;
   return arm;
  };
  const armL=mkArm(-1), armR=mkArm(1);

  // blood patches (menggantikan ZDetail Creeper yang di-skip karena early return)
  for(let i=0;i<3;i++){
   const w=rnd(.06,.12);
   const patch=new THREE.Mesh(new THREE.BoxGeometry(w,w*.6,.02),
    i%2?bloodM:scarM);
   patch.position.set(rnd(-.3,.3),rnd(.15,.55),.17);
   torso.add(patch);
  }

  g.userData={legL,legR,armL,armR,flashT:0,flashMats:[skin,cloth,bootM]};
  return g;
 }
  // F12.13: SPITTER — model semi-bespoke. Basis Walker-style (torso, kaki,
 // lengan 2-segmen) tapi: hijau pucet (skin), rambut panjang turun ke bahu,
 // mulut & mata hijau terang self-lit, drip tox di dada.
 if(type === 'Spitter'){
  const bootM=new THREE.MeshLambertMaterial({color:0x2a221c});
  const hairM=new THREE.MeshLambertMaterial({color:v.hair||0x1a3020});
  const mouthM=new THREE.MeshBasicMaterial({color:0x40e040}); // self-lit
  const eyeM=new THREE.MeshBasicMaterial({color:0x40ff40});   // self-lit

  // torso (Walker-style, tilt .30 hunched)
  const torso=new THREE.Mesh(new THREE.BoxGeometry(.42,.50,.28),cloth);
  torso.position.set(0,.62,0); torso.rotation.x=.30; torso.castShadow=true; g.add(torso);
  // rusuk tipis (skin visible via tear)
  const tear=new THREE.Mesh(new THREE.BoxGeometry(.14,.10,.02),skin);
  tear.position.set(.06,.55,.145); g.add(tear);

  // legs — 3-segment Walker-style
  const mkLeg=side=>{
   const leg=new THREE.Group();
   leg.position.set(-.10*side,.42,0);
   g.add(leg);
   const th=new THREE.Mesh(new THREE.BoxGeometry(.14,.20,.15),cloth);
   th.position.y=-.10; th.castShadow=true; leg.add(th);
   const sh=new THREE.Mesh(new THREE.BoxGeometry(.12,.14,.13),skin);
   sh.position.y=-.27; sh.castShadow=true; leg.add(sh);
   const bt=new THREE.Mesh(new THREE.BoxGeometry(.13,.06,.20),bootM);
   bt.position.set(0,-.37,.03); bt.castShadow=true; leg.add(bt);
   return leg;
  };
  const legL=mkLeg(-1), legR=mkLeg(1);

  // arms 2-segment, Walker pose
  const armL=new THREE.Group(), armR=new THREE.Group();
  armL.position.set(-.25,.83,.02); armR.position.set(.25,.83,.02);
  armL.rotation.x=armR.rotation.x=-1.05;
  g.add(armL,armR);
  for(const arm of [armL,armR]){
   const up=new THREE.Mesh(new THREE.BoxGeometry(.13,.24,.13),cloth);
   up.position.y=-.12; up.castShadow=true; arm.add(up);
   const fo=new THREE.Mesh(new THREE.BoxGeometry(.11,.22,.11),skin);
   fo.position.y=-.34; fo.castShadow=true; arm.add(fo);
  }

  // neck + head + jaw
  const neck=new THREE.Mesh(new THREE.BoxGeometry(.12,.08,.12),skin);
  neck.position.set(0,.90,.14); neck.castShadow=true; g.add(neck);
  const skull=new THREE.Mesh(new THREE.BoxGeometry(.24,.22,.24),skin);
  skull.position.set(0,1.00,.17); skull.castShadow=true; g.add(skull);
  const jaw=new THREE.Mesh(new THREE.BoxGeometry(.20,.08,.20),skin);
  jaw.position.set(0,.86,.19); jaw.castShadow=true; g.add(jaw);

  // mulut hijau terang (open, self-lit)
  const mouth=new THREE.Mesh(new THREE.BoxGeometry(.14,.06,.03),mouthM);
  mouth.position.set(0,.88,.30); g.add(mouth);
  // mata hijau terang
  const eg=new THREE.BoxGeometry(.055,.045,.03);
  const e1=new THREE.Mesh(eg,eyeM), e2=new THREE.Mesh(eg,eyeM);
  e1.position.set(-.07,1.02,.295); e2.position.set(.07,1.02,.295);
  g.add(e1,e2);

  // rambut panjang — topi tipis + poni + side panjang turun ke bahu + back panjang
  const hTop=new THREE.Mesh(new THREE.BoxGeometry(.27,.08,.27),hairM);
  hTop.position.set(0,1.13,.17); hTop.castShadow=true; g.add(hTop);
  const hFront=new THREE.Mesh(new THREE.BoxGeometry(.26,.06,.05),hairM);
  hFront.position.set(0,1.09,.295); g.add(hFront);
  // F12.13-fix: geser keluar dari skull (x ±.13→±.145) + sedikit lebih tipis
  // (depth .24→.22) supaya tidak clipping ke pipi/dahi skull (skull x ±.12,
  // hair lama overlap -.02 di masing-masing sisi).
  const hSideL=new THREE.Mesh(new THREE.BoxGeometry(.055,.32,.22),hairM);
  hSideL.position.set(-.148,.99,.17); g.add(hSideL);
  const hSideR=new THREE.Mesh(new THREE.BoxGeometry(.055,.32,.22),hairM);
  hSideR.position.set(.148,.99,.17); g.add(hSideR);
  const hBack=new THREE.Mesh(new THREE.BoxGeometry(.26,.38,.07),hairM);  // back panjang ke bahu
  hBack.position.set(0,.96,.03); g.add(hBack);

  // toxic drips di dada (self-lit)
  for(let i=0;i<3;i++){
   const drip=new THREE.Mesh(new THREE.BoxGeometry(.04,.10,.02),mouthM);
   drip.position.set(rnd(-.15,.15),rnd(.60,.72),.145);
   g.add(drip);
  }

  g.userData={legL,legR,armL,armR,flashT:0,flashMats:[skin,cloth,bootM]};
  return g;
 }
 // ---- F5b-rework (F1.1): material tambahan — sepatu gelap untuk boot zombie ----
 const bootMat=new THREE.MeshLambertMaterial({color:0x2a221c});
 // ---- F1.2: kaki 3-segmen ala karakter — thigh (celana) + shin (kulit/celana
 // robek) + boot. Pivot pinggul tetap .4*legM; total tinggi tetap .4*legM supaya
 // animasi walk loop tetap konsisten (legL.rotation.x = ±sw).
 const legM=v.legL||1;
 // F3.5: kaki diperlebar .11→.14 (mirip karakter .146, sedikit lebih kurus).
 // Thigh/shin/boot proporsional otomatis karena semua pakai lw sebagai basis.
 const lw=.14*Math.max(.8,v.w*.8);
 const legL=new THREE.Group(),legR=new THREE.Group();
 legL.position.set(-.09*v.w,.4*legM,0);legR.position.set(.09*v.w,.4*legM,0);
 const thighGeo=new THREE.BoxGeometry(lw,.20*legM,.14);
 const shinGeo =new THREE.BoxGeometry(lw*.88,.14*legM,.12);
 const bootGeo =new THREE.BoxGeometry(lw*.92,.06*legM,.18);
 for(const leg of[legL,legR]){
  const thigh=new THREE.Mesh(thighGeo,cloth);thigh.position.y=-.10*legM;thigh.castShadow=true;leg.add(thigh);
  const shin =new THREE.Mesh(shinGeo,skin);  shin.position.y =-.27*legM;shin.castShadow=true;leg.add(shin);
  const boot =new THREE.Mesh(bootGeo,bootMat);boot.position.set(0,-.37*legM,.03);boot.castShadow=true;leg.add(boot);
 }
 // F3.4-rev: torso .34→.42 (silhouette bahu lebih kuat) · depth .26→.28.
 // Shoulder pad DIHAPUS — sebelumnya menjorok keluar tepi torso & nembus
 // top edge → jadi "bonggol" yang align dengan bahu lengan. Torso .42 sudah
 // cukup memberi kesan bahu berisi.
 const torso=new THREE.Mesh(new THREE.BoxGeometry(.42*v.w,v.th,.28*v.w),cloth);
 torso.position.set(0,.62,0);torso.rotation.x=v.tilt;torso.castShadow=true;
 // F1.3: lengan 2-segmen — upper (cloth, kaus/lengan baju) + fore (skin, daging
 // terbuka). Pivot bahu tetap sama; ujung lengan tetap di -aL (kontrak loop).
 // F3.3: lengan diperlebar .09→.13 (mirip karakter .13) · muscle (ZAlpha) .15→.17.
 const aW=v.muscle?.17:.13,aL=.44*(v.armL||1);
 const upperGeo=new THREE.BoxGeometry(aW,aL*.55,aW);
 const foreGeo =new THREE.BoxGeometry(aW*.82,aL*.48,aW*.82);
 const shY=.62+v.th*.5-.02; // pivot bahu: tepi atas torso
 const armL=new THREE.Group(),armR=new THREE.Group();
 armL.position.set(-.17*v.w,shY,.12);armR.position.set(.17*v.w,shY,.12);
 for(const arm of[armL,armR]){
  const upper=new THREE.Mesh(upperGeo,cloth);upper.position.y=-aL*.275;upper.castShadow=true;arm.add(upper);
  const fore =new THREE.Mesh(foreGeo,skin);  fore.position.y =-.76*aL;   fore.castShadow=true;arm.add(fore);
 }
 armL.rotation.x=armR.rotation.x=-1.05-v.tilt*.3;
 // F1.4: leher + kepala 2-box (skull+jaw). Leher selalu di bawah skull untuk
 // menjembatani gap ke torso (silhouette humanoid). Skull center tetap di y=.92
 // (sama dgn head lama) supaya offset overhead / lock-on tetap akurat.
 const neck=new THREE.Mesh(new THREE.BoxGeometry(v.hs*.5,.08,v.hs*.5),skin);
 neck.position.set(0,.92+v.tilt*.15-v.hs*.45,.11+v.tilt*.27);neck.castShadow=true;
 const skull=new THREE.Mesh(new THREE.BoxGeometry(v.hs,v.hs*.82,v.hs),skin);
 skull.position.set(0,.92+v.tilt*.15,.12+v.tilt*.3);skull.castShadow=true;
 const jawBox=new THREE.Mesh(new THREE.BoxGeometry(v.hs*.85,v.hs*.22,v.hs*.72),skin);
 jawBox.position.set(0,.92+v.tilt*.15-v.hs*.42,.13+v.tilt*.3);jawBox.castShadow=true;
 const eGeo=new THREE.BoxGeometry(.05,.05,.03);
 const e1=new THREE.Mesh(eGeo,eyeMat),e2=new THREE.Mesh(eGeo,eyeMat);
 e1.position.set(-v.hs*.22,skull.position.y+.02,skull.position.z+v.hs/2+.01);
 e2.position.set(v.hs*.22,skull.position.y+.02,skull.position.z+v.hs/2+.01);
 g.add(legL,legR,torso,armL,armR,neck,skull,jawBox,e1,e2);
 // F3.2: rambut zombie kusut — 5 box (top+poni+belakang+2 samping). Silhouette
 // sama semua jenis, hanya warna beda (v.hair). Crawler & PZero skip (v.hair
 // undefined). Skull top di skull.y + .41*v.hs → box top di +.44*v.hs (overlap
 // .05*hs, memenuhi aturan tetap menonjol ≥.01).
 if(v.hair){
  const hairMat=new THREE.MeshLambertMaterial({color:v.hair});
  const hx=skull.position.x,hy=skull.position.y,hz=skull.position.z;
  const top=new THREE.Mesh(new THREE.BoxGeometry(v.hs*1.05,v.hs*.16,v.hs*1.05),hairMat);
  top.position.set(hx,hy+v.hs*.44,hz);top.castShadow=true;g.add(top);
  const front=new THREE.Mesh(new THREE.BoxGeometry(v.hs*1.0,v.hs*.10,v.hs*.06),hairMat);
  front.position.set(hx,hy+v.hs*.32,hz+v.hs*.53);g.add(front);
  const back=new THREE.Mesh(new THREE.BoxGeometry(v.hs*.95,v.hs*.14,v.hs*.06),hairMat);
  back.position.set(hx,hy+v.hs*.24,hz-v.hs*.53);g.add(back);
  const sideGeo=new THREE.BoxGeometry(v.hs*.06,v.hs*.14,v.hs*.9);
  const sideL=new THREE.Mesh(sideGeo,hairMat);
  sideL.position.set(hx-v.hs*.53,hy+v.hs*.22,hz);g.add(sideL);
  const sideR=new THREE.Mesh(sideGeo,hairMat);
  sideR.position.set(hx+v.hs*.53,hy+v.hs*.22,hz);g.add(sideR);
 }
 if(v.jaw){ // Biter: rahang besar tambahan (univ. jawBox tetap muncul, ekstra)
  const jaw=new THREE.Mesh(new THREE.BoxGeometry(v.hs*.9,.08,.1),skin);
  jaw.position.set(0,skull.position.y-v.hs*.3,skull.position.z+v.hs/2+.03);
  g.add(jaw);
 }
 if(v.belly){
  const belly=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.45),cloth);
  belly.position.set(0,.5,.22);g.add(belly);
 }
 // ===== F2: APPEARANCE PER JENIS ZOMBIE =====
 // Detail visual berbeda tiap tipe: darah, sobekan (kulit terlihat), busuk,
 // rusuk, scar. Semua ditambahkan sebagai children `g` sebelum scale — jadi
 // detail ikut ter-scale utk boss (ZAlpha).
 // Posisi: `zw` = permukaan depan torso (≈.13*v.w + .005). Offset X/Y tetap,
 // offset Z memakai zw atau nilai spesifik (belly/punggung).
 (function addZDetail(){
  const bloodDk=new THREE.MeshLambertMaterial({color:0x5a1010}); // darah kering
  const bloodBr=new THREE.MeshLambertMaterial({color:0x8a1a14}); // darah segar
  const scar   =new THREE.MeshLambertMaterial({color:0x6a3020}); // scar/luka lama
  const rot    =new THREE.MeshLambertMaterial({color:0x1a1512}); // daging busuk
  const tox    =new THREE.MeshLambertMaterial({color:0x6a9a48}); // cairan tox (Bloater)
  const zw=.13*v.w+.005;
  const b=(w,h,d,mat,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);g.add(m);};
  switch(type){
   case 'Walker': // klasik — sobekan + darah kering
    b(.14,.08,.01,bloodDk,-.05,.68,zw);
    b(.08,.06,.01,skin,.08,.72,zw);
    b(.03,.03,.01,bloodDk,-.09,.20,.10);
    break;
   case 'Runner': // fresh kill — darah muka + lutut robek
    b(.10,.03,.01,bloodBr,-.05,.90,zw);
    b(.08,.02,.01,bloodDk,.05,.96,zw);
    b(.09,.03,.01,skin,.09,.36,.09);
    break;
   case 'Biter': // rahang berdarah + korban
    b(.14,.10,.01,bloodBr,0,.70,zw);
    b(.05,.10,.01,bloodDk,-.04,.55,zw);
    b(.05,.04,.01,bloodBr,.10,.60,.06);
    break;
   case 'Shambler': // busung — perut terlihat + patch busuk
    b(.12,.10,.01,skin,0,.55,zw);
    b(.16,.03,.01,bloodDk,0,.50,zw);
    b(.04,.05,.01,rot,-.12,.75,zw);
    b(.04,.05,.01,rot,.10,.62,zw);
    break;
   case 'Screecher': // skeletal — rusuk + leher berdarah
    for(let i=0;i<3;i++)b(.028,.12,.01,skin,-.06+i*.06,.72,zw);
    b(.08,.04,.01,bloodDk,0,.88,zw+.005);
    b(.05,.05,.01,rot,.08,.55,zw);
    break;
   case 'Bloater': // belly sudah ada — tambah drip tox + sobekan
    b(.05,.08,.01,tox,-.10,.42,.42);
    b(.04,.06,.01,tox,.12,.38,.42);
    b(.18,.03,.01,skin,0,.68,.22);
    b(.14,.03,.01,bloodDk,0,.30,.22);
    break;
   case 'Creeper': // bungkuk — detail di punggung + cakar
    b(.10,.04,.10,bloodDk,0,.75,-.14);
    b(.06,.03,.06,bloodBr,-.05,.35,.15);
    b(.10,.04,.01,skin,-.09,.62,-.13);
    break;
   case 'Sprinter': // agresif — darah kaki + bahu robek
    b(.08,.10,.01,bloodDk,-.09,.28,.14);
    b(.06,.08,.01,bloodDk,.09,.22,.14);
    b(.10,.03,.01,skin,.15,.74,.06);
    b(.04,.03,.01,bloodBr,-.05,.90,zw);
    break;
   case 'ZAlpha': // BOSS — scar + darah tebal
    b(.26,.04,.01,scar,0,.72,zw);
    b(.06,.16,.01,bloodDk,-.22,.60,.10);
    b(.06,.16,.01,bloodDk,.22,.60,.10);
    b(.16,.05,.01,bloodBr,0,.86,zw);
    b(.08,.05,.01,bloodDk,0,.42,zw);
    break;
  }
 })();
 if(v.scale)g.scale.setScalar(v.scale);
 // F1.5: flashMats tambah bootMat — supaya flash damage juga menerangi sepatu
 g.userData={legL,legR,armL,armR,flashT:0,flashMats:[skin,cloth,bootMat]};
 return g;
}
function makeBarricadeMesh(ew){
 const g=new THREE.Group();
 const woodA=new THREE.MeshLambertMaterial({color:0x8a6a42});
 const woodB=new THREE.MeshLambertMaterial({color:0x6a4c30});
 const woodC=new THREE.MeshLambertMaterial({color:0x54402a});
 const mk=(w,h,d,mat,px,py,pz,ry,rz)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(px,py,pz);if(ry)m.rotation.y=ry;if(rz)m.rotation.z=rz;
  m.castShadow=true;return m;
 };
 g.add(mk(1.12,.16,.09,woodA,0,.3,.08,.05,0));
 g.add(mk(1.12,.16,.09,woodB,0,.55,-.06,-.07,0));
 g.add(mk(1.12,.16,.09,woodA,0,.8,.06,.03,0));
 g.add(mk(1.12,.16,.09,woodB,0,1.02,-.05,-.05,0));
 g.add(mk(1.34,.14,.08,woodC,0,.62,.14,0,.52));
 g.add(mk(1.34,.14,.08,woodC,0,.62,.17,0,-.52));
 const nailG=new THREE.BoxGeometry(.05,.05,.05);
 const nailM=new THREE.MeshLambertMaterial({color:0x2a2a2a});
 [[-.5,.3],[.5,.55],[-.5,.8],[.5,1.02]].forEach(p=>{
  const n=new THREE.Mesh(nailG,nailM);n.position.set(p[0],p[1],.12);g.add(n);
 });
 if(!ew)g.rotation.y=Math.PI/2;
 return g;
}
const tracerPool=[];
{
 const mat=new THREE.MeshBasicMaterial({color:0xffd070});
 const geo=new THREE.BoxGeometry(.05,.05,.5);
 for(let i=0;i<40;i++){
  const m=new THREE.Mesh(geo,mat);m.visible=false;scene.add(m);tracerPool.push(m);
 }
}
const getTracer=()=>tracerPool.find(m=>!m.visible);
// FIX(8): muzzle flash PER KARAKTER — flash global lama melompat antar penembak
// (satu mesh dibagi semua char; burst panjang + tembakan bersamaan = flash tampak
// keluar dari senjata karakter lain). Flash kini menempel di ujung laras tiap hero.
// muzzleT kini hanya mengendalikan intensitas muzzleLight global.
const flashGeo=new THREE.BoxGeometry(.16,.16,.16);
const flashMat=new THREE.MeshBasicMaterial({color:0xffd990});
const _mzV=new THREE.Vector3();
let muzzleT=0; // intensitas lampu — posisi = penembak terakhir
const dotMat=new THREE.MeshBasicMaterial({color:0xffc860});
const dotGeo=new THREE.BoxGeometry(.12,.12,.12);
const pathDots=[];
const stains=[];
function addStain(x,z){
 const m=new THREE.Mesh(new THREE.BoxGeometry(.55,.02,.55),
  new THREE.MeshBasicMaterial({color:0x140a08,transparent:true,opacity:.45}));
 m.position.set(x,.012,z);scene.add(m);stains.push(m);
 if(stains.length>45)scene.remove(stains.shift());
}
const debris=[];
const debrisGeo=new THREE.BoxGeometry(.12,.12,.12);
// P7: cache material per warna — dulu tiap spawnDebris bikin material baru
// (mis. Bloater boom = 12+6+… material per ledakan). Sekarang reuse.
const debrisMats={};
const getDebrisMat=c=>debrisMats[c]||(debrisMats[c]=new THREE.MeshLambertMaterial({color:c}));
function spawnDebris(x,y,z,color,n){
 const mat=getDebrisMat(color);
 for(let i=0;i<n;i++){
  const m=new THREE.Mesh(debrisGeo,mat);
  m.position.set(x+rnd(-.2,.2),y,z+rnd(-.2,.2));scene.add(m);
  debris.push({m,vx:rnd(-2,2),vy:rnd(2,4.5),vz:rnd(-2,2),t:rnd(.5,.9)});
 }
}
function updateDebris(dt){
 for(const d of debris.slice()){
  d.t-=dt;d.vy-=9*dt;
  d.m.position.x+=d.vx*dt;d.m.position.y+=d.vy*dt;d.m.position.z+=d.vz*dt;
  d.m.rotation.x+=dt*6;d.m.rotation.y+=dt*4;
  if(d.t<=0||d.m.position.y<0){scene.remove(d.m);debris.splice(debris.indexOf(d),1);}
 }
}
   // ================= 8b. RAGDOLL DEATH (F5) =================
// Zombie mati → model pecah jadi part asli, jatuh ke tanah (bukan ledakan),
// 2 dtk lalu menghilang (merosot ke tanah di 0,4 dtk terakhir).
const corpseParts=[];
function ragdollDeath(z){
 addStain(z.x,z.z);
 const floorY=stairHeight(Math.floor(z.x),Math.floor(z.z));
 z.mesh.updateMatrixWorld(true);
 const parts=[];
 z.mesh.traverse(o=>{if(o.isMesh)parts.push(o);});
 for(const p of parts){
  scene.attach(p); // lepas dari group → transform world dipertahankan
  if(!p.geometry.boundingBox)p.geometry.computeBoundingBox();
  const bb=p.geometry.boundingBox;
  const restY=Math.max(.03,(bb.max.y-bb.min.y)/2*p.scale.y*.7)+floorY;
  corpseParts.push({m:p,vx:rnd(-.55,.55),vy:rnd(.1,.9),vz:rnd(-.55,.55),
   rvx:rnd(-3.5,3.5),rvz:rnd(-3.5,3.5),t:2,restY});
 }
 if(corpseParts.length>130){const old=corpseParts.shift();scene.remove(old.m);}
}
function updateCorpseParts(dt){
 for(const cp of corpseParts.slice()){
  cp.t-=dt;
  if(cp.m.position.y>cp.restY){ // jatuh + berguling
   cp.vy-=11*dt;
   cp.m.position.x+=cp.vx*dt;
   cp.m.position.y+=cp.vy*dt;
   cp.m.position.z+=cp.vz*dt;
   cp.m.rotation.x+=cp.rvx*dt;
   cp.m.rotation.z+=cp.rvz*dt;
   if(cp.m.position.y<=cp.restY){
    cp.m.position.y=cp.restY;
    cp.vx=cp.vy=cp.vz=cp.rvx=cp.rvz=0;
   }
  }else if(cp.t<.4){ // merosot → "menghilang"
   cp.m.position.y-=dt*.3;
  }
  if(cp.t<=0){scene.remove(cp.m);corpseParts.splice(corpseParts.indexOf(cp),1);}
 }
}
// ================= 9. STATE ENTITAS =================
const S={state:'playing',paused:false,totalKills:0,now:0,time:0,respect:0,
 gItems:[],placement:null,ui:null, zBuff:{until:0,mul:1},invMode:null,invSel:null,itemCd:{},
 stoveUses:0,zKills:{},deployOrder:[],
 rescue:null,qte:null, // F8b: Random Event §16 aktif + sesi QTE berjalan
 owned:{diaz:true,bambang:true}, // F8a: kepemilikan — rehan/memet terkunci
 workbench:null, // F10.10.2: char yang sedang pakai workbench (null = tidak aktif)
 // F10-prep (P2): counter statistik sesi §23.10 — reset di resetGame, disimpan di save
 respectEarned:0,nightsSurvived:0,totalDamage:0,
 killsPerChar:{},dmgPerChar:{},deploysPerChar:{},
 downsCount:0,revivesDone:0,buildsDone:0,repairsDone:0,craftsDone:0,rescuesDone:0,
 healUses:{},buffUses:{},resourcesCollected:{}};
// ---- F7: FABRIK KARAKTER + chars[] (era diaz-hardcoded usai) ----
function makeChar(id,home){
 const C=CHARS[id];
 const ch={id,kind:'char',n:C.n,x:home.x,z:home.z,_home:home,
  hp:C.hp,atk:C.atk,def:C.def,mag:C.weapon.mag,reloadT:0,fireT:0,
  xp:0,lvl:1,sp:0,energy:0,state:'idle',path:[],lock:null,walkPhase:0,
  spAlloc:{hp:0,atk:0,def:0,agi:0,spd:0}, // F10.1: alokasi Skill Point permanen (cap 20/stat)
  tree:{rec:0,off:0,def:0,pas:0}, // F10.2: tier unlocked per jalur (0-4) — permanen
  jc:emptyJc(),                // F10.4: journal counters (reset per night)
  journal:null,                // F10.4: {missions:[{id,prog,done,xp,goal,key,n,d}]} — pick per night
  mesh:null,selected:false,lastHit:-99,st:{},_tk:null,_aimT:-99, // P7: init aim timer (hindari pose freeze 0.6s pada char baru)
  inv:new Array(12).fill(null),buffs:[],skillUntil:0,
  armor:null,regen:null,slots:{rec:null,buff:null},
  autoHeal:false,autoBuff:false,down:false,recovering:false,deployed:true, // F7c
  seat:null, // F10.10.3: duduk/tidur state — {kind,tx,ty,furn} atau null
  _ks:{until:0,stacks:0,cdUntil:0},   // F7(3): pasif Diaz (killstack §21.1)
  _mot:null,_motHitsLeft:0,cycle:null,_burst:null, // F7(3)+F8a(3b)
  es:{atk:C.atk,agi:C.agi,spd:C.spd,def:C.def,xp:1,hpMax:C.hp}};
 ch.mesh=HERO_MESH[id](); // F8a: pabrik model per hero
 ch.mesh.userData.entity={kind:'char',ref:ch};
 // F10.13: selArrow brightness turun dari 0xffffff → 0xc8c8c8 (di ambang bloom
 // threshold 0.55). Visual: glow halus tanpa halo besar — bukan sumber cahaya,
 // hanya indikator seleksi.
 ch.mesh.userData.selArrow.material.color.setHex(0xc8c8c8);
 ch._flashes=[]; // FIX(8): flash pribadi menempel di ujung laras tiap hero
 const mkFlash=tip=>{
  const m=new THREE.Mesh(flashGeo,flashMat);
  m.visible=false;tip.add(m);ch._flashes.push(m);
 };
 const mu=ch.mesh.userData;
 if(mu.tipL&&mu.tipR){mkFlash(mu.tipL);mkFlash(mu.tipR);} // dual pistol (Bambang)
 else if(mu.tip)mkFlash(mu.tip);
 ch._muzT=0;ch._muzDual=false;
 scene.add(ch.mesh);
 return ch;
}
const chars=[makeChar('diaz',homeFor('diaz')),
 makeChar('bambang',homeFor('bambang'))]; // F12.5: home fixed di depan perapian — tiap char dapat slot sendiri
const diaz=chars[0];    // F7 alias migrasi — kode lama jalan utk Diaz
const bambang=chars[1];
let selChar=diaz;       // F7: karakter terseleksi (D2)
diaz.selected=true;
const panelChar=()=>selChar||diaz; // F7(3b): panel/aksi UI milik char terseleksi
const offField=ch=>ch.recovering||!ch.deployed; // F7c: tidak di medan (reserve/recovering)
const zombies=[],bullets=[];
const barricades=new Map();
const fireplace={t:0};
const placed=new Map(),lanterns=new Map(),storageBoxes=new Map(); // F6
function effStats(ch){ // F7(2) + F9d: pasif cover Vikry / elite2x Erry / buffBoost Alvi
 const C=CHARS[ch.id];
 let atk=C.atk,agi=C.agi,spd=C.spd,
  def=C.def+(ch.armor?ch.armor.def:0),xp=1,hpMax=C.hp;
 // F10.1: alokasi SP — HP +5/point (Q1b), stat lain +1/point. Diterapkan SEBELUM buff
 // % supaya alokasi ikut diperbesar oleh buff (konsisten dgn base stat).
 if(ch.spAlloc){
  hpMax+=ch.spAlloc.hp*5;
  atk+=ch.spAlloc.atk;
  def+=ch.spAlloc.def;
  agi+=ch.spAlloc.agi;
  spd+=ch.spAlloc.spd;
 }
 // F10.2.3: tree flat additions + conditional stat multipliers (D3: sebelum buff % ·
 // D4: DEF T2/T3 additive — 1×(1+0.5+0.6) = 2.1× kalau dua-duanya aktif)
 if(ch.tree){
  if(treeHas(ch,'off',1))atk+=25;
  if(treeHas(ch,'def',1))def+=25;
  if(treeHas(ch,'pas',1))agi+=10;
  let defMul=1;
  if(treeHas(ch,'def',2)&&ch._inCover)defMul+=.5;
  if(treeHas(ch,'def',3)&&ch.hp<30)defMul+=.6;
  if(defMul>1)def*=defMul;
  if(treeHas(ch,'off',4)){ // Pack Tactics — progresif 1 ally=10% … 4+=25%
   let n=0;const cx=Math.floor(ch.x),cz=Math.floor(ch.z);
   for(const o of chars){
    if(o===ch||o.down||offField(o))continue;
    if(Math.abs(cx-Math.floor(o.x))<=1&&Math.abs(cz-Math.floor(o.z))<=1)n++;
   }
   if(n>=1)atk*=(1+[0,.10,.15,.20,.25][Math.min(4,n)]);
  }
  if(treeHas(ch,'pas',3))xp+=.2; // Fast Learner — XP+20% (additive dgn buff makanan)
 }
 if(ch._inCover&&ch.id==='vikry'){atk*=1.5;def*=2;} // F9d D46: cover — ATK+50% DEF+100%
 if(ch._ks&&S.now<ch._ks.until)atk+=10*ch._ks.stacks; // F7(3): pasif Diaz §21.1
 for(const b of ch.buffs)if(S.now<b.until){
  atk=atk*(1+(b.atkP||0))+(b.atkF||0);
  agi=agi*(1+(b.agiP||0))+(b.agiF||0);
  spd=spd*(1+(b.spdP||0))+(b.spdF||0);
  def=def*(1+(b.defP||0))+(b.defF||0); // F9c D40: defP (tray +25%)
  xp+=(b.xpP||0);
  hpMax+=(b.hpF||0); // F6: buff max-HP (kompor §19.2)
 }
 if(ch.seat)def=0; // F10.10.3: duduk/tidur = vulnerable
 return{atk,agi,spd,def,xp,hpMax};
}
// ===== F10.2: helper tree =====
function treeTier(ch,path){return (ch.tree&&ch.tree[path])||0}
function treeCanBuy(ch,path){ // tier berikutnya (1-4) atau 0 kalau sudah max
 const t=treeTier(ch,path);
 return t>=4?0:t+1;
}
function treeNextCost(ch,path){
 const t=treeCanBuy(ch,path);
 return t?TREE[path].nodes[t-1].c:0;
}
function treeHas(ch,path,tier){ // true kalau tier sudah unlocked
 return treeTier(ch,path)>=tier;
}
// F10.2.3: effective deploy cost — PAS T4 -25% (Math.round, D2)
function charDeployCost(ch){
 const base=CHARS[ch.id].deploy;
 if(treeHas(ch,'pas',4))return Math.round(base*.75);
 return base;
}
// F10.2.4: effective reload time — OFF T2 −10% (setelah SPD & _reloadMul skill)
function charReloadTime(ch){
 const W=CHARS[ch.id].weapon;
 let t=W.reload/(1+ch.es.spd/100);
 if(ch._reloadMul)t*=ch._reloadMul;
 if(treeHas(ch,'off',2))t*=.9;
 return t;
}
// F10.2.4: effective magazine size — OFF T3 +2; Sobel's tiap reload ke-5 dobel
function charMagMax(ch){
 let m=CHARS[ch.id].weapon.mag;
 if(treeHas(ch,'off',3))m+=2;
 if(ch.id==='sobel'&&ch._relN&&ch._relN%5===0)m*=2;
 return m;
}
// F10.2.5: status duration multiplier — DEF T4 −25% (char-only, zombie & boss skip)
function statusDurMul(ent){
 if(ent&&ent.kind==='char'&&treeHas(ent,'def',4))return.75;
 return 1;
}
// ===== F10.4: JOURNAL HELPERS =====
function pickJournal(){ // 1 Easy + 1 Moderate + 1 Hard random
 return {missions:[
  Object.assign({},pick(JOURNAL_MISSIONS.easy)),
  Object.assign({},pick(JOURNAL_MISSIONS.moderate)),
  Object.assign({},pick(JOURNAL_MISSIONS.hard))
 ]};
}
function resetJournalForNight(){ // dipanggil di startNightIntro — sebelum wave
 for(const ch of chars){
  if(!ch.journal)ch.journal=pickJournal();
  else ch.journal=pickJournal(); // repick tiap night
  ch.jc=emptyJc();
 }
}
function checkJournal(ch){ // dipanggil loop + nightEnd
 if(!ch.journal||!ch.journal.missions)return;
 for(const m of ch.journal.missions){
  if(m.done)continue;
  const prog=ch.jc[m.key]||0;
  if(prog>=m.goal){
   m.done=true;
   gainXP(ch,m.xp);
   toast(ch.n+' — MISSION COMPLETE: '+m.n+' (+'+m.xp+' XP)','good');
   SFX('levelUp');
  }
 }
}
// Beli 1 tier. Pemanggil WAJIB sudah konfirmasi (dialog F10.2.2 — D7).
function treeBuy(ch,path){
 const t=treeCanBuy(ch,path);
 if(!t){toast('Already maxed','bad');return false;}
 const cost=TREE[path].nodes[t-1].c;
 if(S.respect<cost){toast('Not enough Respect — need '+cost,'bad');return false;}
 S.respect-=cost;
 ch.tree[path]=t;
 const before=ch.es;
 ch.es=effStats(ch);
 // kalau efek tier ini menaikkan hpMax (tidak ada saat ini) — clamp HP
 if(ch.es.hpMax>before.hpMax)ch.hp=Math.min(ch.es.hpMax,ch.hp+(ch.es.hpMax-before.hpMax));
 toast(ch.n+': '+TREE[path].n+' T'+t+' — '+TREE[path].nodes[t-1].l,'good');
 SFX('levelUp');
 return true;
}
function applyRegen(ch,rate,dur){ // F7(2): HoT per karakter — terkuat menang
 const r=ch.regen,active=r&&S.now<r.until;
 if(!active||rate>=r.rate)
  ch.regen={rate,until:Math.max(S.now+dur,active?r.until:0)};
 else if(S.now+dur>r.until)r.until=S.now+dur;
}
function clearStatus(ent){ // Bandage/Medkit/Steak: hapus semua status §18
 ent.st={};
 if(ent.flames)ent.flames.visible=false;
}

// ================= 10. A* + LOS =================
function astar(sx,sy,tx,ty,passFn){
 if(sx===tx&&sy===ty)return[];
 const open=[{x:sx,y:sy,g:0,f:Math.abs(tx-sx)+Math.abs(ty-sy),p:null}];
 const seen=new Set([sx+','+sy]),DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
 while(open.length){
  let bi=0;for(let i=1;i<open.length;i++)if(open[i].f<open[bi].f)bi=i;
  const n=open.splice(bi,1)[0];
  if(n.x===tx&&n.y===ty){
   const p=[];let c=n;while(c.p){p.unshift([c.x,c.y]);c=c.p}return p;
  }
  for(const[dx,dy]of DIRS){
   const nx=n.x+dx,ny=n.y+dy,k=nx+','+ny;
   if(seen.has(k)||!passFn(nx,ny))continue;
   seen.add(k);
   open.push({x:nx,y:ny,g:n.g+1,f:n.g+1+Math.abs(tx-nx)+Math.abs(ty-ny),p:n});
  }
 }
 return null;
}
function los(x0,z0,x1,z1){
 const dx=x1-x0,dz=z1-z0,dist=Math.hypot(dx,dz),steps=Math.ceil(dist*4);
 for(let i=1;i<steps;i++){
  const t=i/steps;
  if(blocksBul(Math.floor(x0+dx*t),Math.floor(z0+dz*t)))return false;
 }
 return true;
}

// ================= 11. SISTEM TEMBAK =================
function fire(ch,tgt){ // F9b: engine senjata §6.4 — tipe/fan/proj/on-hit dibaca dari CHARS
 const W=CHARS[ch.id].weapon;
 ch.mag-=W.bullets;
 const cyc={pending:0,hits:new Map(),owner:ch};
 ch.cycle=cyc;
 const u=ch.mesh.userData;
 const dual=W.bullets>=2&&u.tipL&&u.tipR;
 // F9b D35: burst beruntun — Memet 4 · Sobel 10 (ki­pas) · Reza 6 · Ariz 4 · Alvi 2
 const burst=!dual&&W.bullets>1;
 if(burst){
  ch._burst={cyc,left:W.bullets-1,t:.12}; // FIX(30): cyc DISIMPAN — burst tak lagi membaca ch.cycle (bisa tertimpa skill)
  fireBullet(ch,tgt,cyc,0);
  return;
 }
 SFX(GUN_SFX[ch.id]||'shot');
 ch._muzT=.07;
 if(dual){ // FIX(26): jalur DUAL Bambang — hilang saat rewrite F9b
  ch._muzDual=true;
  setTimeout(()=>SFX('dualpistol'),100); // bunyi pistol kedua 0.1 dtk
  const tips=[u.tipL,u.tipR];
  for(let i=0;i<tips.length;i++){
   const b=makeBullet(ch,tgt,cyc,{tip:tips[i]}); // FIX(8): origin per-tip
   bullets.push(b);cyc.pending++;
  }
  return; // muzzleT & posisi lampu sudah diatur makeBullet (per-peluru)
 }
 ch._muzDual=false;
 if(ch.id==='bambang')setTimeout(()=>SFX('dualpistol'),100); // (fallback — tak terpakai utk dual)
 // F9b: senjata satu-peluru multi-proyektil (§6.4.2) — Vikry 5/25° · Lele 8/35°
 const proj=Math.max(1,W.proj||1),fan=(W.fan||0)*Math.PI/180;
 const atkP=W.proj?ch.es.atk/proj:ch.es.atk; // §6.4.2: ATK dibagi jumlah proyektil
 const base=Math.atan2(tgt.x-ch.x,tgt.z-ch.z);
 for(let i=0;i<proj;i++){
  const a=proj>1?base+(i/(proj-1)-.5)*fan:base; // D29/D30: sebaran merata ±fan/2
  fireBullet(ch,tgt,cyc,0,{dx:Math.sin(a),dz:Math.cos(a),atk:atkP});
 }
}
// F9b: SATU pembangkit peluru — dipakai semua jalur (burst, multi-proj, single).
// cyc = akumulasi §6.4.1 (DEF dikurangi sekali per cycle per target).
// opt = {dx,dz,atk} arah/atk khusus (kipas / multi-proyektil); default: aim target.
function fireBullet(ch,tgt,cyc,idx,opt){
 const W=CHARS[ch.id].weapon,u=ch.mesh.userData;
 const o=opt||{};
 u.tip.getWorldPosition(_mzV);
 muzzleLight.position.copy(_mzV);
 muzzleT=.07;ch._muzT=.07;ch._muzDual=false;
 if(!W.sfxOnce||cyc.pending===0)SFX(GUN_SFX[ch.id]||'shot'); // F9c: sfxOnce — bunyi hanya di peluru pertama cycle
 const gorilla=ch._gorilla&&S.now<ch._gorilla; // F9c D42: STUN 5s selama skill
 const qs=ch._qs&&S.now<ch._qs; // F9c D43: STUN on-hit 3s cd/target
 const b={x:_mzV.x,z:_mzV.z,
  dx:o.dx,dz:o.dz,y0:_mzV.y,
  atk:o.atk!==undefined?o.atk:ch.es.atk, // F9b: ATK per-peluru (§6.4.2 utk multi-proj)
  pierce:o.pierce!==undefined?o.pierce:(W.type==='pierce'), // F9c: override opt (Brrrt/Bomb paksa pierce)
  boom:o.boom!==undefined?o.boom:(W.type==='boom'), // D28/D32 + override (Eat this!)
  aoeR:o.aoeR!==undefined?o.aoeR:W.aoeR, // D32 + override
  aoeP:o.aoeP!==undefined?o.aoeP:W.aoeP, // D32 + override (Eat this! .5)
  slow:W.slow,slowT:W.slowT,
  stun:o.stun!==undefined?o.stun:(gorilla?5:W.stun), // F9c: Gorilla override + opt
  burnP:W.burnP,burnT:W.burnT, // D31
  qsStun:qs||null, // F9c D43: flag — STUN di-tangani ifhit (cd per target)
  hitSet:pierce_new(), // D28: korban peluru ini (zombie tak kena 2× peluru sama)
  max:W.range*1.15,trav:0,cyc,owner:ch,
  mot:!!ch._mot,mesh:getTracer()};
 if(!b.dx){ // default: aim ke target
  const dx=tgt.x-ch.x,dz=tgt.z-ch.z,l=Math.hypot(dx,dz)||1;
  b.dx=dx/l;b.dz=dz/l;
 }
 if(b.mesh){b.mesh.visible=true;b.mesh.rotation.y=Math.atan2(b.dx,b.dz);
  b.mesh.position.set(b.x,b.y0,b.z);}
 bullets.push(b);cyc.pending++;
}
// F9c D36: Brrrt volley — 15 peluru pierce kipas 60°, mag TAK berkurang
function brrrtVolley(ch,tgt){
 if(ch._burst)return; // FIX(30): burst lama masih jalan — jangan timpa (fireT menjaga ritme)
 const cyc={pending:0,hits:new Map(),owner:ch};
 ch.cycle=cyc;
 const fan=60*Math.PI/180,base=Math.atan2(tgt.x-ch.x,tgt.z-ch.z);
 for(let i=0;i<15;i++){
  const a=base+((i/14)-.5)*fan;
  fireBullet(ch,tgt,cyc,0,{dx:Math.sin(a),dz:Math.cos(a),atk:ch.es.atk,
   pierce:true,slow:null,stun:null,burnP:null});
 }
}
// FIX(26): peluru dual — dipakai jalur Bambang (origin = tip masing-masing pistol).
function makeBullet(ch,tgt,cyc,opt){
 const W=CHARS[ch.id].weapon;
 const tip=opt.tip||ch.mesh.userData.tip;
 tip.getWorldPosition(_mzV);
 const b={x:_mzV.x,z:_mzV.z,y0:_mzV.y,
  dx:0,dz:0,atk:ch.es.atk,
  pierce:false,boom:false, // dual pistol = std (Bambang tak punya type)
  hitSet:pierce_new(),
  max:W.range*1.15,trav:0,cyc,owner:ch,
  mot:!!ch._mot,mesh:getTracer()};
 const dx=tgt.x-b.x,dz=tgt.z-b.z,l=Math.hypot(dx,dz)||1;
 b.dx=dx/l;b.dz=dz/l;
 if(b.mesh){b.mesh.visible=true;b.mesh.rotation.y=Math.atan2(b.dx,b.dz);
  b.mesh.position.set(b.x,b.y0,b.z);}
 { // FIX(8): flash milik pistol YANG INI — via ch._flashes (index 0=tipL, 1=tipR)
  const tips=[ch.mesh.userData.tipL,ch.mesh.userData.tipR];
  const fi=tips.indexOf(tip);
  if(fi>=0&&ch._flashes&&ch._flashes[fi]){
   ch._flashes[fi].visible=true;ch._flashes[fi].scale.setScalar(rnd(.8,1.2));
  }
  ch._muzT=.07;ch._muzDual=true;
 }
 muzzleLight.position.copy(_mzV);muzzleT=.07;
 return b;
}
function pierce_new(){return new Set()}
function killBullet(b){
 if(b.mesh)b.mesh.visible=false;
 const i=bullets.indexOf(b);if(i>=0)bullets.splice(i,1);
 if(!b.cyc)return; // FIX(30): cycle yatim (tertimpa skill mid-flight) — peluru mati tenang
 b.cyc.pending--;
 if(b.cyc.pending<=0)resolveCycle(b.cyc);
}
// F10.5-B: resolveCycle kini HANYA menangani passive berbasis total-damage-per-cycle.
// Damage sudah di-apply per peluru di ifhit (1 peluru = 1 ATK). Rehan chain kini
// di-hook di ifhit (per-hit). Hanya Lele bigHitHeal yang masih butuh total cycle.
function resolveCycle(cyc){
 if(cyc.owner.id==='lele'){
  for(const[z,atkSum]of cyc.hits){
   if(atkSum>=300){ // F9d: total ≥300 dalam 1 cycle → heal 3
    cyc.owner.hp=Math.min(cyc.owner.es.hpMax,cyc.owner.hp+3);
    floatText(cyc.owner.x,cyc.owner.z,'+3','heal',.3);
   }
  }
 }
 if(cyc.owner.cycle===cyc)cyc.owner.cycle=null;
}
// F8a(3) D4: skill-kill dalam window → Energy 100 lagi (rantai maks 4 tembakan)
function rehanChainKill(ch){
 if(ch.id!=='rehan'||!ch._rehanChain)return;
 if(S.now>ch._rehanChain.until){ch._rehanChain=null;return;}
 if(ch._rehanChain.kills>=3){ // 4 skill shot terpakai — rantai selesai, Energy tetap 0
  ch._rehanChain=null;
  floatText(ch.x,ch.z,'CHAIN ENDED','skill');
  return;
 }
 ch._rehanChain.kills++;
 ch.energy=100;
 floatText(ch.x,ch.z,'RESET! ('+ch._rehanChain.kills+'/3)','skill',1.2);
}
function damageZombie(z,dmg,src){ // F7(3): src = penyerang (atribusi XP/Energy)
 const d=Math.max(1,Math.round(dmg*markMul(z)));
 z.hp-=d;
 if(src){z.dmgB=z.dmgB||{};z.dmgB[src.id]=(z.dmgB[src.id]||0)+d;}
 S.totalDamage+=d; // P2: statistik sesi
 if(src)S.dmgPerChar[src.id]=(S.dmgPerChar[src.id]||0)+d; // P2: MVP Damage Dealer
 if(src&&src.jc)src.jc.dmg+=d; // F10.4: journal dmg counter
 // F10.5-B: throttle float dmgZ per target (~10/detik). Dengan damage per peluru
 // (bukan lagi per cycle), burst 10-15 peluru/detik akan spam float tanpa ini.
 if(!z._fT||S.now-z._fT>.1){z._fT=S.now;floatText(z.x,z.z,'-'+d,'dmgZ');}
 flashUnit(z.mesh,.12);SFX('zHit');
 if(z.hp<=0)killZombie(z);
}
function killZombie(z){
 z.dying=true;z.dyingT=0;z.hp=0;
 removeOverhead(z);
 ragdollDeath(z); // F5: model hancur → part-part jatuh
 S.totalKills++;SFX('zDie');
 S.zKills[z.type]=(S.zKills[z.type]||0)+1; // F7(3c): kill list per jenis
 // F7(3): XP proporsional damage (D4) + Energy dibagi RATA kontributor (§5)
 const ids=Object.keys(z.dmgB||{});
 let list=[];
 if(ids.length){
  list=ids.map(id=>chars.find(c=>c.id===id)).filter(Boolean)
   .sort((a,b)=>z.dmgB[b.id]-z.dmgB[a.id]);
  const total=list.reduce((s,c)=>s+z.dmgB[c.id],0);
  const en=z.T.energy/list.length;
  let given=0;
  for(let i=0;i<list.length;i++){
   const c=list[i];
   let xp;
   if(i===list.length-1)xp=z.T.xp-given;      // sisa pembulatan → damage terbesar
   else{xp=Math.floor(z.T.xp*z.dmgB[c.id]/total);given+=xp;}
   gainXP(c,xp);
   let enTxt='';
   if(S.now>=c.skillUntil){
    const enGain=Math.round(en*(c.id==='rehan'?1.15:1)*10)/10; // F8a(3): pasif Rehan
    c.energy=Math.min(100,c.energy+enGain);
    enTxt=' +'+enGain+'EN';
   }
   floatText(c.x,c.z,'+'+xp+'XP'+enTxt,'gainXp',.05+i*.45); // FIX(10): di atas PENERIMA
  }
  // F7(3): pasif Diaz + F9d lastShot Raptor (kill milik kontributor terbesar)
  const k=list[0];
  S.killsPerChar[k.id]=(S.killsPerChar[k.id]||0)+1; // P2: MVP Zombie Slayer (kontributor damage terbesar)
  if(k.jc){ // F10.4: journal kill counters
   const T2=z.T;
   if(T2.boss)k.jc.zBoss++;
   else if(T2.elite)k.jc.zElite++;
   else k.jc.zNorm++;
   k.jc.zTotal++;
  }
  if(k.id==='raptor'&&k._lastBullet&&k.mag===0){ // F9d: peluru terakhir mag membunuh
   if(!k._lsBonus){k._lsBonus=true; // tak menumpuk — sekali per magazine berikutnya
    k.buffs.push({until:S.now+999,dur:999,n:'LAST SHOT',atkP:.3,lastshot:true});
    toast('RAPTOR: last-bullet kill — next magazine ATK+30%','good');
   }
  }
  if(k.id==='diaz'&&!k.down&&!k.recovering&&S.now>=k._ks.cdUntil){
   if(k._ks.stacks>0&&S.now<k._ks.until){
    if(k._ks.stacks<10){k._ks.stacks++;k._ks.until+=2;}
   }else{k._ks.stacks=1;k._ks.until=S.now+7;}
  }
 } // tanpa kontributor tercatat → tanpa XP/Energy (edge DoT tanpa sumber)
 rollDrops(z,list[0]||null);
 if(z.T.deathBoom)bloaterBoom(z);
}
function gainXP(c,xp){ // F7(3): XP per karakter
 c.xp+=Math.round(xp*c.es.xp);
 while(c.xp>=1000&&c.lvl<100){
  c.xp-=1000;c.lvl++;c.sp++;
  if(c.jc)c.jc.levelUps++; // F10.4
  toast(c.n+' REACHED LEVEL '+c.lvl+' (+1 Skill Point)','good');SFX('levelUp');
  floatText(c.x,c.z,'LEVEL UP','heal');
 }
}
function flashUnit(mesh,dur){
 if(!mesh.userData.flashMats)return; // F5: safety — model tanpa flashMats diabaikan
 mesh.userData.flashT=dur;
 for(const m of mesh.userData.flashMats)m.emissive.setRGB(1,1,1);
}

// ================= 12. AUTO-TARGET =================
function currentTarget(ch){ // F7(1.5) + FIX(11): lock ENGAGE hanya dalam range+LOS;
 // lock TETAP tersimpan → re-engage otomatis saat target balik masuk jangkauan.
 // Di luar range → auto-target mengambil alih (§4.3 — tak menembak di luar range).
 const L=ch.lock;
 if(L&&(!L.hp||L.hp<=0||L.retreat))ch.lock=null; // mati/kabur → lepas permanen
 else if(L){
  if((ch.x-L.x)**2+(ch.z-L.z)**2<=CHARS[ch.id].weapon.range**2
   &&los(ch.x,ch.z,L.x,L.z))return L;
 }
 let best=null,bd=1e18;
 for(const z of zombies){
  if(z.dying||z.retreat)continue;
  const d=(z.x-ch.x)**2+(z.z-ch.z)**2;
  if(d<=CHARS[ch.id].weapon.range**2&&d<bd&&los(ch.x,ch.z,z.x,z.z)){bd=d;best=z;}
 }
 return best;
}
function nearestChar(x,z){ // F7(2): char HIDUP terdekat — Down/Recovering diabaikan (D3)
 let best=null,bd=1e18;
 for(const ch of chars){
  if(ch.down||offField(ch))continue;
  const d=(ch.x-x)**2+(ch.z-z)**2;
  if(d<bd){bd=d;best=ch;}
 }
 return best;
}
// ================= 12b. STATUS ENGINE (GDD §18) =================
// ent.st = {STUNNED:{until}, SLOWED:{until,trap,char,popT},
//           BURNING:{until,dps,acc}, MARKED:{until,mul}}
const STATUS_COL={STUNNED:'#e6c34a',SLOWED:'#7fd4d4',BURNING:'#ff7040',MARKED:'#c07ae8'};
const stPops=[];
function statusPop(ent,label,col){ // §18: pop-up di atas unit, fade 3 dtk
 if(stPops.length>14){const p=stPops.shift();p.el.remove();}
 const el=document.createElement('div');
 el.className='float';el.textContent=label;
 el.style.color=col;el.style.fontSize='13px';
 $('floaters').appendChild(el);
 stPops.push({ent,el,t:3});
}
function updateStPops(dt){
 for(const p of stPops.slice()){
  p.t-=dt;
  if(p.t<=0){p.el.remove();stPops.splice(stPops.indexOf(p),1);continue;}
  const sh=stairHeight(Math.floor(p.ent.x),Math.floor(p.ent.z));
  const[sx,sy]=toScreen(p.ent.x,2.4+sh,p.ent.z);
  p.el.style.left=sx+'px';p.el.style.top=sy+'px';
  p.el.style.opacity=clamp(p.t,0,1);
 }
}
function hasSt(ent,t){const s=ent.st&&ent.st[t];return!!(s&&S.now<=s.until)}
function applyStun(ent,dur){
 dur*=statusDurMul(ent); // F10.2.5: DEF T4 −25% (char-only)
 if(ent.T&&ent.T.boss){ // F5: resist CC — max 1 dtk + 5 dtk imun
  if(ent.ccUntil&&S.now<ent.ccUntil)return;
  dur=Math.min(dur,1);
  ent.ccUntil=S.now+dur+5;
 }
 const s=ent.st,was=hasSt(ent,'STUNNED');
 if(!was||S.now+dur>s.STUNNED.until)s.STUNNED={until:S.now+dur};
 if(!was){statusPop(ent,'STUNNED',STATUS_COL.STUNNED);ent.path=[];SFX('stun');}
}
function applySlow(ent,pct,dur,src){ // src 'trap'|'char' — stack antar kategori (A1)
 dur*=statusDurMul(ent); // F10.2.5: DEF T4 −25% (char-only)
 const s=ent.st;let sl=s.SLOWED;
 const fresh=!sl||S.now>sl.until;
 if(fresh)sl=s.SLOWED={until:0,trap:0,char:0,popT:0};
 sl[src]=Math.max(sl[src]||0,pct);
 sl.until=Math.max(sl.until,S.now+dur);
 if(fresh)SFX('slow');
 if(S.now>=sl.popT){
  statusPop(ent,'SLOWED '+Math.round(slowPct(ent)*100)+'%',STATUS_COL.SLOWED);
  sl.popT=S.now+1.2;
 }
}
function slowPct(ent){
 const sl=ent.st&&ent.st.SLOWED;
 if(!sl||S.now>sl.until)return 0;
 return Math.min(.9,(sl.trap||0)+(sl.char||0)+(sl.zomb||0));
}
function applyBurn(ent,dps,dur,src){ // F7(3): src = penyerang (atribusi DoT)
 dur*=statusDurMul(ent); // F10.2.5: DEF T4 −25% (char-only; zombie skip)
 const s=ent.st,b=s.BURNING,active=b&&S.now<=b.until;
 if(!active||dps>=b.dps){
  s.BURNING={until:Math.max(S.now+dur,active?b.until:0),
   dps:active?Math.max(dps,b.dps):dps,acc:b?b.acc:0,src:src||null};
  if(!active){statusPop(ent,'BURNING',STATUS_COL.BURNING);SFX('burn');}
 }else if(S.now+dur>b.until)b.until=S.now+dur;
}
function applyMark(ent,mul,dur,src){ // F8a(3) D6: multi-sumber — 150%+120% = 270%
 dur*=statusDurMul(ent); // F10.2.5: DEF T4 −25% (char-only)
 const s=ent.st;src=src||'x';
 let m=s.MARKED;
 if(!m||!m.src)m=s.MARKED={src:{}};
 const r=m.src[src],active=r&&S.now<=r.until;
 if(!active){statusPop(ent,'MARKED',STATUS_COL.MARKED);SFX('mark');}
 if(!active||mul>=r.mul)
  m.src[src]={until:Math.max(S.now+dur,active?r.until:0),
   mul:active?Math.max(mul,r.mul):mul};
 else if(S.now+dur>r.until)m.src[src].until=S.now+dur;
 let u=0;
 for(const k in m.src)if(S.now<=m.src[k].until)u=Math.max(u,m.src[k].until);
 m.until=u;
 if(!u)delete s.MARKED;
}
function markMul(ent){ // F8a(3) D6: total = JUMLAH semua sumber aktif
 const m=ent.st&&ent.st.MARKED;
 if(!m||!m.src)return 1;
 let t=0;
 for(const k in m.src)if(S.now<=m.src[k].until)t+=m.src[k].mul;
 return t||1;
}
function ensureFlames(ent){ // visual api (BURNING)
 if(ent.flames)return;
 const g=new THREE.Group();
 const m1=new THREE.Mesh(new THREE.BoxGeometry(.16,.22,.16),
  new THREE.MeshBasicMaterial({color:0xff8a30}));
 const m2=new THREE.Mesh(new THREE.BoxGeometry(.11,.15,.11),
  new THREE.MeshBasicMaterial({color:0xffd070}));
 m1.position.set(.1,.8,.12);m2.position.set(-.09,.6,-.1);
 g.add(m1,m2);g.visible=false;ent.mesh.add(g);ent.flames=g;
}
function tickBurn(ent,dt,isChar){
 const b=ent.st&&ent.st.BURNING;
 if(!b||S.now>b.until){if(ent.flames)ent.flames.visible=false;return;}
 ensureFlames(ent);ent.flames.visible=true;
 ent.flames.scale.setScalar(rnd(.8,1.25));
 b.acc=(b.acc||0)+b.dps*dt;
 if(b.acc>=1){
  const d=Math.floor(b.acc);b.acc-=d;
  if(isChar){
   ent.hp-=d;ent.lastHit=S.now;
   floatText(ent.x,ent.z,'-'+d,'dmgC');
    cancelConstruction(ent);
    if(ent._revive)cancelRevive(ent); // F7b
    charHurtUI(); // F12.4
    if(ent.hp<=0){ent.hp=0;charDown(ent);} // F7(2)
  }else{
   damageZombie(ent,d,b&&b.src); // F7(3): atribusi DoT
   if(b&&b.src&&b.src.id==='reza'){ // F9d: pasif — 1 HP per tick burn dari serangannya
    b.src.hp=Math.min(b.src.es.hpMax,b.src.hp+1);
   }
  }
 }
}
// ================= 12c. FX SYSTEM (F5) =================
const fxList=[],zones=[];
function fxFlash(x,z,color){
 boomLight.color.setHex(color);
 boomLight.position.set(x,1.2,z);boomT=.35;
}
function fxSphere(x,y,z,color,r,dur){ // awan gas/ledakan
 const m=new THREE.Mesh(new THREE.SphereGeometry(r,7,5),
  new THREE.MeshBasicMaterial({color,transparent:true,opacity:.5,depthWrite:false}));
 m.position.set(x,y,z);scene.add(m);
 fxList.push({m,t:0,dur,kind:'grow'});
}
function fxRing(x,z,color,r,dur){ // shockwave datar
 const m=new THREE.Mesh(new THREE.RingGeometry(r*.55,r,24),
  new THREE.MeshBasicMaterial({color,transparent:true,opacity:.65,side:THREE.DoubleSide,depthWrite:false}));
 m.rotation.x=-Math.PI/2;m.position.set(x,.15,z);scene.add(m);
 fxList.push({m,t:0,dur,kind:'ring'});
}
function fxFan(x,z,ang,color,r,dur){ // sapuan 90° (Infectious Swipe)
 const N=8,half=Math.PI/4,verts=[0,0,0],idx=[];
 for(let i=0;i<=N;i++){
  const a=ang-half+(i/N)*half*2;
  verts.push(Math.sin(a)*r,0,Math.cos(a)*r);
 }
 for(let i=1;i<=N;i++)idx.push(0,i+1,i);
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 g.setIndex(idx);
 const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color,transparent:true,
  opacity:.5,side:THREE.DoubleSide,depthWrite:false}));
 m.position.set(x,.18,z);scene.add(m);
 fxList.push({m,t:0,dur,kind:'fan'});
}
function fxSlash(x,z){ // tebasan Rabid Slash
 const m=new THREE.Mesh(new THREE.BoxGeometry(.07,.03,1),
  new THREE.MeshBasicMaterial({color:0xff5040,transparent:true,opacity:.9}));
 m.position.set(x+rnd(-.2,.2),1,z+rnd(-.2,.2));
 m.rotation.y=rnd(0,Math.PI);m.rotation.z=.5;
 scene.add(m);fxList.push({m,t:0,dur:.25,kind:'slash'});
}
function updateFX(dt){
 for(const f of fxList.slice()){
  f.t+=dt;const p=f.t/f.dur;
  if(p>=1){scene.remove(f.m);fxList.splice(fxList.indexOf(f),1);continue;}
  if(f.kind==='slash'){f.m.material.opacity=.9*(1-p);f.m.scale.setScalar(1+p*.5);}
  else if(f.kind==='fan'){f.m.scale.setScalar(lerp(.45,1,p));f.m.material.opacity=.5*(1-p);}
  else if(f.kind==='ring'){f.m.scale.setScalar(lerp(.25,1,p));f.m.material.opacity=.65*(1-p);}
  else{f.m.scale.setScalar(lerp(.35,1.6,p));f.m.material.opacity=.5*(1-p);}
 }
}
function hurtChar(ch,d){ // F7(2): damage flat per karakter (ledakan/slam/pounce)
 ch.hp-=d;ch.lastHit=S.now;
 armorWear(ch,d); // §6.5: skill flat dianggap daya serang
 cancelConstruction(ch);
 if(ch._revive)cancelRevive(ch); // F7b: damage memutus channel
 charHurtUI(); // F12.4: rename dari diazHurtUI
 flashUnit(ch.mesh,.12);SFX('charHurt'); // F12.4: rename dari diazHurt
 if(ch.hp<=0)charDown(ch);
}
function armorWear(ch,atk){ // §6.5: Durability Loss = Total ATK × 0.5 (per char)
 if(!ch.armor)return;
 ch.armor.dur-=atk*.5;
 if(ch.armor.dur<=0){
  toast(ch.n+': '+ITEMS[ch.armor.id].n+' BROKEN','bad');
  ch.armor=null;
  if(S.ui==='inv'&&ch===panelChar())renderInv();
 }
}
function makeZoneMesh(x,z,kind){ // F9c: kubah zona — racun Bloater / heal / buff / api
 const col=kind==='heal'?0x5adf8a:kind==='buff'?0xd9c26a:kind==='burn'?0xff6a30:0x6a9a48;
 const m=new THREE.Mesh(new THREE.SphereGeometry(2.9,10,6),
  new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.15,depthWrite:false}));
 m.position.set(x,.4,z);scene.add(m);return m;
}
function updateZones(dt){
 for(const zn of zones.slice()){
  zn.t-=dt;
  zn.mesh.material.opacity=.15*clamp(zn.t/2,0,1);
  zn.mesh.scale.setScalar(1+Math.sin(S.now*2.2)*.05);
  if(zn.kind==='heal'){ // F9c D39: zona heal Ariz — HP+20/s semua char di dalam
   for(const ch of chars){
    if(ch.down||offField(ch))continue;
    if(Math.hypot(ch.x-zn.x,ch.z-zn.z)<=zn.r)
     ch.hp=Math.min(ch.es.hpMax,ch.hp+20*dt);
   }
  }else if(zn.kind==='buff'){ // F9c D40: zona tray Alvi — buff selama DI DALAM
   for(const ch of chars){
    if(ch.down||offField(ch))continue;
    const inz=Math.hypot(ch.x-zn.x,ch.z-zn.z)<=zn.r;
    const has=ch.buffs.some(b=>b.tray&&S.now<b.until);
    if(inz&&!has)
     ch.buffs.push({until:S.now+.25,dur:0,n:'FREE MEALS',tray:true,
      atkP:.4,defP:.25,agiP:.3,spnP:.35}); // refresh tiap frame saat di dalam
    else if(!inz&&has)ch.buffs=ch.buffs.filter(b=>!b.tray);
   }
  }else if(zn.kind==='burn'){ // F9c D41: zona api Reza — DoT zombie & CHAR (friendly-fire)
   zn.acc=(zn.acc||0)+zn.dps*dt;
   for(const ch of chars){
    if(ch.down||offField(ch))continue;
    if(Math.hypot(ch.x-zn.x,ch.z-zn.z)<=zn.r)applyBurn(ch,zn.dps,.4,zn.owner);
   }
   for(const z of zombies){
    if(z.dying||z.retreat)continue;
    if(Math.hypot(z.x-zn.x,z.z-zn.z)<=zn.r)applyBurn(z,zn.dps,.4,zn.owner);
   }
  }else{ // racun Bloater (default lama)
   for(const ch of chars){
    if(ch.down||offField(ch))continue;
    if(Math.hypot(ch.x-zn.x,ch.z-zn.z)<=3)applySlow(ch,.4,.35,'zomb');
   }
  }
  if(zn.t<=0){
   if(zn.kind==='buff')for(const ch of chars)ch.buffs=ch.buffs.filter(b=>!b.tray); // F9c: bersih saat zona habis
   scene.remove(zn.mesh);zones.splice(zones.indexOf(zn),1);
  }
 }
}
// ================= 13. SISTEM BARIKADE =================
function setupBarricades(){
 for(const k of PREBARR){
  const[x,y]=k.split(',').map(Number);
  if(cellAt(x,y)==='d'||cellAt(x,y)==='w')addBarricade(x,y);
 }
}
function addBarricade(x,y,bid){
 bid=bid||'makeshift';
 const bk={id:bid,n:BUILDS[bid].n,x,y,hp:BUILDS[bid].hp,max:BUILDS[bid].hp,
  tier:'normal',tierName:'BARRICADE',mesh:makeBarricadeMesh(wallEW(x,y))};
 bk.mesh.position.set(x+.5,0,y+.5);
 scene.add(bk.mesh);
 barricades.set(x+','+y,bk);
 return bk;
}
function damageBarricade(bk,z,mul){
 bk.hp-=z.atk*z.T.bld*zAtkMul(z)*(mul||1); // F5: roar buff + frenzy Sprinter
 SFX('hitBarricade')
 if(!overheadMap.has(bk))makeOverhead(bk);
 if(bk.hp<=0)destroyBarricade(bk);
}
function destroyBarricade(bk){
 barricades.delete(bk.x+','+bk.y);
 scene.remove(bk.mesh);removeOverhead(bk);
 spawnDebris(bk.x+.5,.7,bk.y+.5,0x7a5c38,8);
 toast('A BARRICADE HAS COLLAPSED!','bad');
 chatPush('barricade',chatReporter(),chatDir(bk.x,bk.y)); // F9b.5
 if(bk.id==='makeshift')SFX('makeshiftDestroyed');
 else if(bk.id==='reinforced')SFX('reinforcedDestroyed');
 else SFX('collapse');
}

// ============ 13b. EKONOMI: DROP, INVENTORY, BUILDING, REPAIR ============
const gItemGeo=new THREE.BoxGeometry(.16,.16,.16);
const gItemMats={};
for(const k in ITEMS)gItemMats[k]=new THREE.MeshLambertMaterial(
 {color:ITEMS[k].c,emissive:ITEMS[k].c,emissiveIntensity:.3});
// F5: texture PNG di kotak drop (material dipakai bersama — update otomatis)
(function(){
 const tl=new THREE.TextureLoader();
 for(const k in ITEMS){
  const it=ITEMS[k];
  if(!it.ic)continue;
  tl.load(ICON_DIR+it.ic,t=>{
   t.magFilter=THREE.NearestFilter;
   const m=gItemMats[k];
   if(!m)return;
   m.map=t;
   m.color.setHex(0xffffff);
   m.emissive.setHex(0x000000); // map menggantikan glow warna
   m.needsUpdate=true;
  },undefined,()=>{}); // file hilang → tetap kotak warna bercahaya
 }
})();
function rollDrops(z,killer){ // F7(3): killer = kontributor damage terbesar
 const tier=z.T.boss?'b':z.T.elite?'e':'n';
 const got=[];
 for(const dr of DROPS){
  if(got.length>=2)break;
  const r=dr[tier];
  if(r&&r[0]&&Math.random()<r[0])got.push({id:dr.id,q:ri(r[1],r[2])});
 }
 // F4: zombie mati di LUAR mansion → drop auto masuk pembunuh (Diaz)
 // F12.8d: 'p' (path beige outdoor) ikut dihitung outside — sebelumnya item
 // di path nangkring di lantai, tidak auto-collect. Cell outdoor = '.' 'F' 'p'.
 const cell=cellAt(Math.floor(z.x),Math.floor(z.z));
 const outside=cell==='.'||cell==='F'||cell==='p';
 for(const g of got){
  if(outside){
   const left=addItem(g.id,g.q,killer||diaz),gotN=g.q-left;
   if(gotN>0){floatText(z.x,z.z,'+'+gotN+' '+ITEMS[g.id].n,'gainItem');SFX('pickup');
    S.resourcesCollected[g.id]=(S.resourcesCollected[g.id]||0)+gotN; // P2
    if(killer&&killer.jc){ // F10.4
     killer.jc.resTotal+=gotN;
     if(g.id==='metal')killer.jc.res_metal+=gotN;
     if(g.id==='cloth')killer.jc.res_cloth+=gotN;
    }}
   if(left>0)toast('Inventory full — '+left+' '+ITEMS[g.id].n+' was lost outside','bad');
  }else spawnGItem(g.id,g.q,z.x+rnd(-.3,.3),z.z+rnd(-.3,.3));
 }
 if(outside&&S.ui==='inv'&&(killer||diaz)===panelChar())renderInv();
}
function spawnGItem(id,q,x,z,noPick){
 if(S.gItems.length>60)return;
 const m=new THREE.Mesh(gItemGeo,gItemMats[id]);
 m.position.set(x,.12,z);scene.add(m);
 S.gItems.push({id,q,x,z,mesh:m,ph:rnd(0,6),noPick:noPick||0});
}
function addItem(id,q,ch){ // F7(2): inventory per karakter (default: Diaz)
 ch=ch||diaz;
 const mx=ITEMS[id].stack;
 for(const s of ch.inv)if(s&&s.id===id&&s.q<mx){
  const t=Math.min(mx-s.q,q);s.q+=t;q-=t;if(q<=0)return 0;}
 for(let i=0;i<12&&q>0;i++)if(!ch.inv[i]&&i!==dragRes){
  const t=Math.min(mx,q);ch.inv[i]={id,q:t};q-=t;}
 return q;
}
function invCount(id,ch){ch=ch||diaz;let n=0; // F7(3b): per karakter
 for(const s of ch.inv)if(s&&s.id===id)n+=s.q;return n}
function invTake(id,q,ch){ch=ch||diaz; // F7(3b): per karakter
 for(let i=0;i<12&&q>0;i++){const s=ch.inv[i];
  if(s&&s.id===id){const t=Math.min(q,s.q);s.q-=t;q-=t;
   if(s.q<=0)ch.inv[i]=null;}}
}
function canAfford(m,ch){for(const k in m)if(invCount(k,ch)<m[k])return false;return true}
function consumeMats(m,ch){for(const k in m)invTake(k,m[k],ch)}
function repairCost(bid){
 const r={};for(const k in BUILDS[bid].mats)
  r[k]=Math.ceil(BUILDS[bid].mats[k]*.5);
 return r;
}
function matStr(m){
 return Object.entries(m).map(([k,v])=>v+' '+ITEMS[k].n).join(', ');
}
let placeMarks=null;
function clearPlaceMarks(){
 if(placeMarks){scene.remove(placeMarks);placeMarks=null;}
 ghostHide(); // F6.5: ghost ikut hilang saat placement batal/selesai
}
// ---- F6.5(fix 2): GHOST PLACEMENT PREVIEW ----
const buildGhost=new THREE.Group();
const ghostOut=new THREE.Mesh(new THREE.PlaneGeometry(1.02,1.02),
 new THREE.MeshBasicMaterial({color:0x1848a0,transparent:true,opacity:.9,depthWrite:false}));
const ghostFill=new THREE.Mesh(new THREE.PlaneGeometry(.88,.88),
 new THREE.MeshBasicMaterial({color:0x5ab0ff,transparent:true,opacity:.38,depthWrite:false}));
ghostOut.rotation.x=ghostFill.rotation.x=-Math.PI/2;
ghostFill.position.y=.02;
buildGhost.add(ghostOut,ghostFill);
buildGhost.visible=false;scene.add(buildGhost);
let ghostXY=null;
function ghostHide(){buildGhost.visible=false;}
function ghostState(tx,ty){ // F7(3b): validasi dari PEMILIK placement
 const src=S.placement.src,id=S.placement.id,ow=S.placement.owner||diaz;
 const entry=!src&&BUILDS[id]&&BUILDS[id].spot==='entry';
 const c=cellAt(tx,ty),k=tx+','+ty;
 const mats=(BUILDS[id]||CRAFTS[id]).mats;
 if(entry){
  if(!((c==='d'||c==='w')||holes.has(k)))return null;
  if(barricades.has(k)||charOnBlock(tx,ty))return 'bad'; // F8a(3c)
 }else{
  if(c!=='_'&&c!=='o'&&c!=='e'){
   if(FURN.includes(c))return 'bad';                    // terhalang furnitur
   return null;                                          // tembok / luar mansion → hilang
  }
  if(traps.has(k)||placed.has(k)||constrAt(tx,ty))return 'bad'; // F7(3b): konstruksi mana pun
 }
 if(!nearBuild(tx,ty,ow))return 'bad';                  // pemilik terlalu jauh
 if(!canAfford(mats,ow))return 'bad';                   // material pemilik kurang
 return 'ok';
}
function updateBuildGhost(){
 if(!S.placement||S.ui||!ghostXY){ghostHide();return;}
 const p=pickGround({clientX:ghostXY.x,clientY:ghostXY.y});
 if(!p){ghostHide();return;}
 const tx=Math.floor(p.x),ty=Math.floor(p.z);
 if(!inBounds(tx,ty)){ghostHide();return;}
 const st=ghostState(tx,ty);
 if(!st){ghostHide();return;}
 const ok=st==='ok';
 ghostOut.material.color.setHex(ok?0x1848a0:0x6a1410);
 ghostFill.material.color.setHex(ok?0x5ab0ff:0xff5040);
 buildGhost.position.set(tx+.5,.08,ty+.5);
 buildGhost.visible=true;
}
// jarak bangun: Chebyshev ≤ 1 dari karakter PEMILIK aksi (F7(3b))
function nearBuild(tx,ty,ch){
 ch=ch||selChar||diaz;
 const cx=Math.floor(ch.x),cz=Math.floor(ch.z);
 return Math.max(Math.abs(cx-tx),Math.abs(cz-ty))<=1;
}
function tryPlace(tx,ty){
 const ch=S.placement.owner; // F7(3b): pemilik placement
 if(ch.constr){toast(ch.n+' is already constructing','bad');return;}
 const b=BUILDS[S.placement.id];
 const c=cellAt(tx,ty),k=tx+','+ty;
 if(b.spot==='entry'){
 if(!(((c==='d'||c==='w')||holes.has(k))&&!barricades.has(k))){
  toast('Barricades go on OPEN doors / windows / breaches','bad');return;}
 }else{
  if(!validFloorCell(tx,ty)){
   toast('Traps go on free indoor floor blocks','bad');return;}
 }
 if(charOnBlock(tx,ty)){ // F8a(3c)
  toast('A character is standing there — move them first','bad');return;}
 if(!nearBuild(tx,ty,ch)){
  toast('Too far — '+ch.n+' must be within 1 block of the spot','bad');return;}
 if(!canAfford(b.mats,ch)){toast('Not enough materials','bad');return;}
 ch.constr={kind:'build',owner:ch,bid:S.placement.id,x:tx,y:ty,t:0,dur:b.t,cost:b.mats};
 toast('Building '+b.n+'… right-click the cell to cancel');
 S.placement=null;clearPlaceMarks();
}
function showPlaceMarks(){
 clearPlaceMarks();
 placeMarks=new THREE.Group();
 const geo=new THREE.PlaneGeometry(.9,.9);
 const mat=new THREE.MeshBasicMaterial({color:0xd9a13b,
  transparent:true,opacity:.22,side:THREE.DoubleSide});
 const entry=!S.placement.src&&BUILDS[S.placement.id].spot==='entry';
 for(let y=0;y<CFG.gridH;y++)for(let x=0;x<CFG.gridW;x++){
  const c=cellAt(x,y),k=x+','+y;
  const ok=entry
   ?(((c==='d'||c==='w')||holes.has(k))&&!barricades.has(k)&&!constrAt(x,y)&&!charOnBlock(x,y))
   :validFloorCell(x,y); // floor sudah include charOnBlock via validFloorCell
  if(ok){
   const m=new THREE.Mesh(geo,mat);
   m.rotation.x=-Math.PI/2;m.position.set(x+.5,.07,y+.5);
   placeMarks.add(m);
  }
 }
 scene.add(placeMarks);
}
function startRepair(bk){
 const ch=selChar||diaz; // F7(3b): klik kanan = char terseleksi
 if(ch.constr){toast(ch.n+' is already constructing','bad');return;}
 if(!nearBuild(bk.x,bk.y,ch)){
  toast('Too far — walk within 1 block first','bad');return;}
 const cost=repairCost(bk.id);
 if(!canAfford(cost,ch)){toast('Repair needs '+matStr(cost),'bad');return;}
 ch.constr={kind:'repair',owner:ch,bk,x:bk.x,y:bk.y,t:0,dur:BUILDS[bk.id].t,cost};
 toast('Repairing '+bk.n+'…');
}
// ---- F5: suara kerja konstruksi — play SEKALI penuh, bisa stop/pause ----
function constrWorkSnd(co){
 if(co.kind==='build')
  return(co.bid==='makeshift'||co.bid==='reinforced')?co.bid:null;
 if(co.kind==='repair')
  return(co.bk.id==='makeshift'||co.bk.id==='reinforced')?co.bk.id:null;
 if(co.kind==='craft'){
  if(sfxHasCustom('craft_'+co.bid))return 'craft_'+co.bid;
  if(ITEMS[co.bid].type==='armor')return 'craftArmor';
  if(ITEMS[co.bid].type==='heal')return 'craftHeal';
  return null;
 }
 return null;
}
const workSnd={src:null,el:null,name:null,pos:0};
function constrStopWork(co){ // F7(3b): berhenti instan (milik co)
 if(!co||!co._ws)return;
 const ws=co._ws;
 if(ws.src){try{ws.src.stop();}catch(e){}}
 if(ws.el)ws.el.pause();
 co._ws=null;
}
function constrPlayWork(co,name,ofs){ // F7(3b): main dari posisi tertentu
 constrStopWork(co);
 const rec=AUD.custom&&AUD.custom[name];
 if(!rec)return;
 const vol=(SFX_VOL[name]!==undefined)?SFX_VOL[name]:.9;
 const ws={name,pos:0};
 co._ws=ws;
 if(rec.buf&&AUD.ctx){ // jalur buffer (http)
  const s=AUD.ctx.createBufferSource();
  s.buffer=rec.buf;
  const g=AUD.ctx.createGain();g.gain.value=vol;
  s.connect(g);g.connect(AUD.sfx);
  s.start(0,ofs||0);
  ws.src=s;ws.t0=AUD.ctx.currentTime-(ofs||0);
 }else if(rec.el&&rec.el.ok){ // jalur element (file://)
  try{rec.el.currentTime=ofs||0;}catch(e){}
  rec.el.volume=vol;
  rec.el.play().catch(()=>{});
  ws.el=rec.el;
 }
}
function constrPauseWork(p){ // ESC: pause/resume SEMUA konstruksi
 for(const ch of chars){
  const co=ch.constr;if(!co||!co._ws)continue;
  const ws=co._ws;
  if(p){
   if(ws.el)ws.el.pause();
   else if(ws.src){
    ws.pos=AUD.ctx.currentTime-ws.t0;
    try{ws.src.stop();}catch(e){}
    ws.src=null;
   }
  }else{
   if(ws.el)ws.el.play().catch(()=>{});
   else{
    const rec=AUD.custom&&AUD.custom[ws.name];
    if(rec&&rec.buf&&ws.pos<(rec.buf.duration-.05))
     constrPlayWork(co,ws.name,ws.pos);
    else constrStopWork(co);
   }
  }
 }
}
function cancelConstruction(ch){ // F7(3b): batal konstruksi milik ch
 if(!ch||!ch.constr)return;
 constrStopWork(ch.constr);
 ch.constr=null;
 toast('Construction interrupted!','bad');
}
function charHurtUI(){ // F12.4: rename dari diazHurtUI (legacy F1 — fungsi ini
 // generik, menutup menu craft/build saat kena damage untuk karakter mana pun)
 if(S.ui==='craft'||S.ui==='build')closeAllPanels();
}
// F6.5: ikon tengah ring progres (PNG) — pengganti huruf B/C/R
// craft/cplace → crafting_progress.png (spin) · build/repair/wallrepair →
// repair.build_progress.png (kedip) · PNG tak ada → fallback huruf lama
function updateProgIcon(co,lbl){ // F7(3b): per ring (konstruksi paralel)
 if(!lbl)return;
 const craft=co.kind==='craft'||co.kind==='cplace';
 const file=craft?'crafting_progress.png':'repair.build_progress.png';
 const rec=ICONS[file],ok=!!(rec&&rec.ok);
 const sig=(craft?'c':'r')+(ok?1:0);
 if(lbl._sig===sig)return;
 lbl._sig=sig;
 if(ok){
  lbl.innerHTML='<img src="'+ICON_DIR+file+'" alt="">';
  lbl.className='cprLbl '+(craft?'spin':'blink');
 }else{
  lbl.textContent=craft?'C':'R';
  lbl.className='cprLbl';
 }
}
// ---- F7(3b): konstruksi per karakter (D5 paralel) ----
function constrAt(x,y){ // konstruksi siapa pun di sel ini
 for(const ch of chars)if(ch.constr&&ch.constr.x===x&&ch.constr.y===y)return ch.constr;
 return null;
}
const constrRings={};
function constrRing(ch){ // ring progres per konstruksi — dibuat lazy
 let r=constrRings[ch.id];
 if(!r){
  r=document.createElement('div');
  r.style.cssText='position:fixed;z-index:11;pointer-events:none;width:36px;'
   +'height:36px;display:none;transform:translate(-50%,-50%)';
  r.innerHTML='<div class="cprRing" style="width:100%;height:100%;border-radius:50%;'
   +'-webkit-mask:radial-gradient(circle,transparent 11px,black 12px);'
   +'mask:radial-gradient(circle,transparent 11px,black 12px)"></div>'
   +'<div class="cprLbl" style="position:absolute;top:50%;left:50%;'
   +'transform:translate(-50%,-50%);font:9px monospace;color:#d9a13b;'
   +'text-align:center;text-shadow:0 1px 0 #000"></div>';
  document.body.appendChild(r);
  constrRings[ch.id]=r;
 }
 return r;
}
function hideConstrRing(ch){
 const r=constrRings[ch.id];
 if(r)r.style.display='none';
}
function constrStopAll(){for(const ch of chars)constrStopWork(ch.constr);}
function renderInv(){ // F7(3b): inventory karakter terseleksi
 const ch=panelChar();
 const g=$('invGrid');if(!g)return;
 let h='';
 for(let i=0;i<12;i++){
  const s=ch.inv[i];
  const sel=(S.invMode&&s&&S.invSel&&S.invSel.has(i))
   ?(S.invMode==='discard'?' selR':' selA'):'';
  // F10.10.2: badge ★ untuk armor Sobel-crafted
  const sobCls=(s&&s.quality==='sobel')?' sobel':'';
  const tip=s?(ITEMS[s.id].n+' ×'+s.q
   +(s.quality==='sobel'?' · Crafted by SOBEL (+25% dur · +10% DEF)':'')):'Empty';
  // F12.13-perf: inline onclick/oncontextmenu/onpointerdown DIHAPUS dari string.
  // Event di-handle via delegation di #invGrid (lihat boot). data-slot = index.
  h+='<div class="islot'+sel+sobCls+'" data-slot="'+i+'"'
   +' title="'+tip+'">'
   +(s?icHtml(ITEMS[s.id].ic,ITEMS[s.id].c)
   +'<div class="nm">'+ITEMS[s.id].n+'</div>'
   +'<div class="qty">'+s.q+'</div>':'')+'</div>';
 }
 g.innerHTML=h;
 renderSpecSlots();
 renderInvTools();
}
function renderInvTools(){
 const t=$('invTools');if(!t)return;
 const md=S.invMode,n=(md&&S.invSel)?S.invSel.size:0;
 const dis=md==='discard',drp=md==='drop';
 t.innerHTML=
  '<div class="tool">'
  +'<button class="icobtn red'+(dis?' onR':'')+'" id="btnDiscard"'
  +' onclick="invToolAct(\'mode\',\'discard\')"'
  +' title="Discard — klik utk mode batch / DRAG item ke sini = buang langsung">'
  +'<img src="'+ICON_TRASH+'" alt="discard"></button>'
  +(dis?'<button class="cbtn red"'+(n>0?'':' disabled')
   +' onclick="invToolAct(\'go\',\'discard\')">Discard</button>'
   :'<button class="cbtn red" style="visibility:hidden" tabindex="-1">Discard</button>')
  +'</div>'
  +'<div class="tool">'
  +'<button class="icobtn'+(drp?' onA':'')+'" id="btnDrop"'
  +' onclick="invToolAct(\'mode\',\'drop\')"'
  +' title="Drop — klik utk mode batch / DRAG item ke sini = jatuhkan langsung">'
  +'<img src="'+ICON_HAND+'" alt="drop"></button>'
  +(drp?'<button class="cbtn"'+(n>0?'':' disabled')
   +' onclick="invToolAct(\'go\',\'drop\')">Drop</button>'
   :'<button class="cbtn" style="visibility:hidden" tabindex="-1">Drop</button>')
  +'</div>';
 const f=$('invFoot');
 if(f)f.textContent=
  dis?'DISCARD MODE — klik item, lalu Discard'
  :drp?'DROP MODE — klik item, lalu Drop'
  :'Stack max 50 · material untuk Building (B)';
}
// ===== F10.12: AUTO-MERGE STACKS =====
// Dipanggil tiap renderInv / renderStore. Setiap kali stack jadi partial
// (habis pakai, buang sebagian, drop sebagian, transfer-in), dua stack same-id
// yang bisa digabung akan otomatis menyatu. Skip armor (dur/quality beda per
// instance — tidak boleh di-merge). Skip juga saat mode discard/drop aktif,
// karena S.invSel menyimpan index slot — kalau slot bergeser, seleksi rusak.
function mergeStacks(ch){
 if(!ch||!ch.inv)return;
 for(let i=0;i<12;i++){
  const a=ch.inv[i];
  if(!a||a.dur!==undefined)continue;   // skip armor
  const mx=ITEMS[a.id].stack;
  if(a.q>=mx)continue;
  for(let j=i+1;j<12;j++){
   const b=ch.inv[j];
   if(!b||b.id!==a.id||b.dur!==undefined)continue;
   const space=mx-a.q;
   if(space<=0)break;
   const t=Math.min(space,b.q);
   a.q+=t;b.q-=t;
   if(b.q<=0)ch.inv[j]=null;
  }
 }
}
function mergeStacksBox(box){
 if(!box||!box.slots)return;
 for(let i=0;i<20;i++){
  const a=box.slots[i];
  if(!a||a.dur!==undefined)continue;
  const mx=ITEMS[a.id].stack;
  if(a.q>=mx)continue;
  for(let j=i+1;j<20;j++){
   const b=box.slots[j];
   if(!b||b.id!==a.id||b.dur!==undefined)continue;
   const space=mx-a.q;
   if(space<=0)break;
   const t=Math.min(space,b.q);
   a.q+=t;b.q-=t;
   if(b.q<=0)box.slots[j]=null;
  }
 }
}
// ---- F6: SPECIAL SLOTS (§13) — Armor / Recovery / Buff + Auto toggles ----
function renderSpecSlots(){ // F7(3b): per karakter
 const ch=panelChar();
 const el=$('specSlots');if(!el)return;
 const a=ch.armor;
 // F10.10.2: badge ★ di armor slot jika Sobel-crafted
 const aSob=(a&&a.quality==='sobel')?' sobel':'';
 const aTip=a?('Armor Slot — '+ITEMS[a.id].n
  +(a.quality==='sobel'?' · Crafted by SOBEL (+25% dur · +10% DEF)':'')):'Armor Slot — klik utk lepas / DRAG item ke sini';
 let h='<div class="sslot'+aSob+'" data-slot="armor" onclick="slotClick(\'armor\')" title="'+aTip+'">'
  +(a?icHtml(ITEMS[a.id].ic,ITEMS[a.id].c)
   +'<div class="snm">DEF+'+a.def+' '+Math.ceil(a.dur)+'/'+a.max+'</div>'
   +'<div class="sdur"><i style="width:'+clamp(a.dur/a.max*100,0,100)+'%"></i></div>'
   :'<div class="sempty">ARMOR<br>SLOT</div>')
  +'</div>';
 const r=ch.slots.rec;
 h+='<div class="sslot" data-slot="rec" onclick="slotClick(\'rec\')" title="Recovery Slot — H memakai dari sini / DRAG ke sini">'
  +(r?icHtml(ITEMS[r.id].ic,ITEMS[r.id].c)
   +'<div class="snm">'+ITEMS[r.id].n+'</div><div class="sqty">×'+r.q+'</div>'
   :'<div class="sempty">RECOVERY<br>SLOT</div>')
  +'</div>';
 const b=ch.slots.buff;
 h+='<div class="sslot" data-slot="buff" onclick="slotClick(\'buff\')" title="Buff Slot — G memakai dari sini / DRAG ke sini">'
  +(b?icHtml(ITEMS[b.id].ic,ITEMS[b.id].c)
   +'<div class="snm">'+ITEMS[b.id].n+'</div><div class="sqty">×'+b.q+'</div>'
   :'<div class="sempty">BUFF<br>SLOT</div>')
  +'</div>';
 h+='<div class="autorow">'
  +'<button class="abtn'+(ch.autoHeal?' on':'')+'" onclick="autoToggle(\'heal\')">AUTO-HEAL: '+(ch.autoHeal?'ON':'OFF')+'</button>'
  +'<button class="abtn'+(ch.autoBuff?' on':'')+'" onclick="autoToggle(\'buff\')">AUTO-BUFF: '+(ch.autoBuff?'ON':'OFF')+'</button>'
  +'</div>';
 el.innerHTML=h;
}
function autoToggle(k){ // F7(3b)
 const ch=panelChar();
 if(k==='heal')ch.autoHeal=!ch.autoHeal;else ch.autoBuff=!ch.autoBuff;
 SFX('click');renderSpecSlots();
}
function slotClick(key){ // F7(3b): per karakter
 const ch=panelChar();
 if(key==='armor'){
  if(!ch.armor)return;
  let idx=-1;
  for(let i=0;i<12;i++)if(!ch.inv[i]){idx=i;break;}
  if(idx<0){toast('Inventory full','bad');return;}
  ch.inv[idx]={id:ch.armor.id,q:1,dur:ch.armor.dur,max:ch.armor.max,
   quality:ch.armor.quality||null,sdef:ch.armor.def}; // F10.10.2: propagate
  toast(ITEMS[ch.armor.id].n+' unequipped');
  ch.armor=null;
 }else{
  const s=ch.slots[key];
  if(!s)return;
  const left=addItem(s.id,s.q,ch);
  if(left>0){
   ch.slots[key]={id:s.id,q:left};
   toast('Inventory full — '+left+' remain in slot','bad');
  }else{
   ch.slots[key]=null;
   toast(ITEMS[s.id].n+' returned to inventory');
  }
 }
 renderInv();
}
function equipToSlot(i){ // F7(3b): per karakter
 const ch=panelChar();
 const s=ch.inv[i];if(!s)return;
 const t=ITEMS[s.id].type;
 if(t==='armor'){
  const A=ARMORS[s.id],old=ch.armor;
  // F10.10.2: baca sdef (Sobel DEF bonus) & quality dari item
  const sobel=s.quality==='sobel';
  const dur=s.dur!==undefined?s.dur:(sobel?Math.round(A.dur*1.25):A.dur);
  const max=s.max!==undefined?s.max:(sobel?Math.round(A.dur*1.25):A.dur);
  const def=s.sdef!==undefined&&s.sdef!==null?s.sdef:A.def;
  ch.armor={id:s.id,def,dur,max,quality:s.quality||null};
  ch.inv[i]=null;
  if(old)ch.inv[i]={id:old.id,q:1,dur:old.dur,max:old.max,
   quality:old.quality||null,sdef:old.def}; // F10.10.2: propagate quality + sdef saat armor lama kembali
  toast(ITEMS[s.id].n+' equipped — DEF+'+def+(sobel?' ★':''),'good');
 }else if(t==='heal'||t==='buff'){
  const key=t==='heal'?'rec':'buff',cur=ch.slots[key];
  if(cur&&cur.id===s.id){
   const mx=ITEMS[s.id].stack;
   const space=Math.min(mx-cur.q,s.q);
   cur.q+=space;s.q-=space;
   if(s.q>0)ch.inv[i]={id:s.id,q:s.q};
   else ch.inv[i]=null;
   toast(ITEMS[s.id].n+' stacked ×'+cur.q,'good');
  }else{
   ch.slots[key]={id:s.id,q:s.q};
   ch.inv[i]=null;
   if(cur)ch.inv[i]={id:cur.id,q:cur.q};
   toast(ITEMS[s.id].n+' → '+(key==='rec'?'RECOVERY':'BUFF')+' SLOT','good');
  }
 }
 SFX('click');
 renderInv();
}
function invSlotClick(i){
 if(S.invClickSuppress){S.invClickSuppress=false;return;}
 const s=panelChar().inv[i]; // F7(3b)
 if(!s)return;
 if(S.invMode){
  if(S.invSel.has(i))S.invSel.delete(i);else S.invSel.add(i);
  renderInv();return;
 }
 const t=ITEMS[s.id].type;
 if(t==='heal'||t==='buff'||t==='armor')equipToSlot(i);
}
// ---- F6: STORAGE BOX INTERACTION (§20.2 — 20 slot) ----
let curStore=null;
function openStore(box){
 curStore=box;
 renderStore(box);
 $('storePanel').style.display='flex';
 S.ui='store';
 SFX('boxOpen');
}
function renderStore(box){ // F7(3b): transfer dengan karakter terseleksi
 const ch=panelChar();
 const el=$('storeBody');if(!el)return;
 // F10.12: auto-merge storage box + char inv
 mergeStacksBox(box);
 mergeStacks(ch);
 let h='<div class="cath">STORAGE — 20 SLOTS</div><div id="stGrid">';
 for(let i=0;i<20;i++){
  const s=box.slots[i];
  h+='<div class="islot" onclick="stClick('+i+')"'
   +' oncontextmenu="stRC('+i+',event)"'
   +' title="'+(s?ITEMS[s.id].n+' ×'+s.q:'Empty')+'">'
   +(s?icHtml(ITEMS[s.id].ic,ITEMS[s.id].c)
   +'<div class="nm">'+ITEMS[s.id].n+'</div>'
   +'<div class="qty">'+s.q+'</div>':'')+'</div>';
 }
 h+='</div><div class="cath">'+ch.n+' INVENTORY</div><div id="stInv">';
 for(let i=0;i<12;i++){
  const s=ch.inv[i];
  h+='<div class="islot" onclick="stInvClick('+i+')"'
   +' oncontextmenu="stInvRC('+i+',event)"'
   +' title="'+(s?ITEMS[s.id].n+' ×'+s.q:'Empty')+'">'
   +(s?icHtml(ITEMS[s.id].ic,ITEMS[s.id].c)
   +'<div class="nm">'+ITEMS[s.id].n+'</div>'
   +'<div class="qty">'+s.q+'</div>':'')+'</div>';
 }
 h+='</div>';
 el.innerHTML=h;
}
function stClick(i){ // storage → inventory (stacking; armor bawa dur) — F7(3b)
 const ch=panelChar();
 if(!curStore)return;
 const s=curStore.slots[i];if(!s)return;
 if(s.dur!==undefined){
  let idx=-1;
  for(let j=0;j<12;j++)if(!ch.inv[j]){idx=j;break;}
  if(idx<0){toast('Inventory full','bad');return;}
  ch.inv[idx]={id:s.id,q:1,dur:s.dur,max:s.max,quality:s.quality||null,sdef:s.sdef||null};
 }else{
  const left=addItem(s.id,s.q,ch);
  if(left>0){s.q=left;toast('Inventory full','bad');renderStore(curStore);return;}
 }
 curStore.slots[i]=null;
 renderStore(curStore);
}
function stInvClick(i){ // inventory → storage (stacking; armor bawa dur) — F7(3b)
 const ch=panelChar();
 if(!curStore)return;
 const s=ch.inv[i];if(!s)return;
 if(s.dur!==undefined){
  let idx=-1;
  for(let j=0;j<20;j++)if(!curStore.slots[j]){idx=j;break;}
  if(idx<0){toast('Storage full','bad');return;}
  curStore.slots[idx]={id:s.id,q:1,dur:s.dur,max:s.max,quality:s.quality||null,sdef:s.sdef||null};
  ch.inv[i]=null;
 }else{
  const mx=ITEMS[s.id].stack;
  let q=s.q;
  for(const t of curStore.slots){
   if(q<=0)break;
   if(t&&t.id===s.id&&t.q<mx){
    const space=Math.min(mx-t.q,q);t.q+=space;q-=space;}
  }
  if(q>0){
   let idx=-1;
   for(let j=0;j<20;j++)if(!curStore.slots[j]){idx=j;break;}
   if(idx>=0){
    curStore.slots[idx]={id:s.id,q:q};
    ch.inv[i]=null;
   }else{
    if(q<s.q)ch.inv[i]={id:s.id,q:q};
    toast('Storage full','bad');
   }
  }else ch.inv[i]=null;
 }
 renderStore(curStore);
}
{const b=$('storeX');if(b)b.onclick=closeAllPanels;}
function invToolAct(act,m){
 if(act==='mode')toggleInvMode(m);
 else if(m==='discard')doDiscard();
 else if(m==='drop')doDrop();
}
// ---- DRAG & DROP: item → tong / tangan / SPECIAL SLOT (F6) ----
// Item DIANGKAT saat drag mulai — slot asal di-RESERVE agar pickup tak mengisi.
let invDrag=null,dragRes=-1;
function invDragStart(e,i,slotEl){ // F7(3b): drag milik char panel aktif
 const ch=panelChar();
 if(e.button!==0||!ch.inv[i])return;
 invDragAbort();                        // drag menggantung? kembalikan item dulu
 S.invClickSuppress=false;
 invDrag={i,ch,item:null,x0:e.clientX,y0:e.clientY,moved:false,ghost:null,src:slotEl||e.currentTarget}; // F12.13-perf
 window.addEventListener('pointermove',invDragMove);
 window.addEventListener('pointerup',invDragUp);
}
function invDragCleanup(){
 if(!invDrag)return null;
 const d=invDrag;invDrag=null;
 if(d.ghost)d.ghost.style.display='none';
 if(d.src)d.src.classList.remove('dragSrc');
 for(const id of['btnDiscard','btnDrop']){
  const b=$(id);if(b)b.classList.remove('dropOn');
 }
 document.querySelectorAll('.sslot').forEach(el=>el.classList.remove('dropOn','dropBad'));
 window.removeEventListener('pointermove',invDragMove);
 window.removeEventListener('pointerup',invDragUp);
 dragRes=-1;
 return d;
}
function invDragAbort(){ // F7(3b): item balik ke slot asal pemilik drag
 if(invDrag&&invDrag.moved&&invDrag.item){
  const ch=invDrag.ch;
  if(!ch.inv[invDrag.i])ch.inv[invDrag.i]=invDrag.item;
  else{
   const left=addItem(invDrag.item.id,invDrag.item.q,ch);
   if(left>0)spawnGItem(invDrag.item.id,left,ch.x,ch.z,S.now+5);
  }
  renderInv();
 }
 invDragCleanup();
}
function invDragMove(e){
 if(!invDrag)return;
 if(!invDrag.moved){
  if(Math.hypot(e.clientX-invDrag.x0,e.clientY-invDrag.y0)<8)return;
  invDrag.moved=true;
  invDrag.item=invDrag.ch.inv[invDrag.i];  // item diangkat — slot asal kosong
  invDrag.ch.inv[invDrag.i]=null;
  dragRes=invDrag.i;                   // FIX #3: reserve slot asal
  invDrag.ghost=makeDragGhost(invDrag.item);
  invDrag.src.classList.add('dragSrc');
 }
 invDrag.ghost.style.left=(e.clientX+12)+'px';
 invDrag.ghost.style.top=(e.clientY+10)+'px';
 const t=dragTargetAt(e.clientX,e.clientY);
 for(const id of['btnDiscard','btnDrop']){
  const b=$(id);if(b)b.classList.toggle('dropOn',b===t);
 }
 // FIX #3: highlight special slot — hijau = valid, merah = invalid
 const type=invDrag.item?ITEMS[invDrag.item.id].type:null;
 document.querySelectorAll('.sslot').forEach(el=>{
  el.classList.remove('dropOn','dropBad');
  if(el===t){
   const key=el.dataset.slot;
   const ok=type&&((key==='armor'&&type==='armor')
    ||(key==='rec'&&type==='heal')||(key==='buff'&&type==='buff'));
   el.classList.add(ok?'dropOn':'dropBad');
  }
 });
}
function invDragUp(e){
 const d=invDragCleanup();
 if(!d||!d.moved)return;               // bukan drag → biarkan onclick bekerja
 S.invClickSuppress=true;
 setTimeout(()=>{S.invClickSuppress=false;},0);
 if(!d.item)return;
 const ch=d.ch; // F7(3b)
 const t=dragTargetAt(e.clientX,e.clientY);
 if(!t){ // lepas di area kosong → kembali ke slot asal (masih reserved)
  ch.inv[d.i]=d.item;
  renderInv();return;
 }
 if(t.id==='btnDiscard'){
  toast('Discarded '+d.item.q+' '+ITEMS[d.item.id].n,'bad');
  renderInv();return;
 }
 if(t.id==='btnDrop'){
  if(S.gItems.length>=60){
   ch.inv[d.i]=d.item;renderInv();
   toast('Ground full — cannot drop','bad');return;}
  spawnGItem(d.item.id,d.item.q,ch.x+rnd(-.6,.6),ch.z+rnd(-.6,.6),S.now+5);
  toast('Dropped '+d.item.q+' '+ITEMS[d.item.id].n,'good');
  renderInv();return;
 }
 // ---- drop ke SPECIAL SLOT ----
 const key=t.dataset.slot,type=ITEMS[d.item.id].type;
 const ok=(key==='armor'&&type==='armor')
  ||(key==='rec'&&type==='heal')||(key==='buff'&&type==='buff');
 if(!ok){ // item tak cocok → balik ke asal + pesan
  toast('You cannot put that here','bad');
  ch.inv[d.i]=d.item;
  renderInv();return;
 }
 if(key==='armor'){
  const A=ARMORS[d.item.id],old=ch.armor;
  const sobel=d.item.quality==='sobel';
  const dur=d.item.dur!==undefined?d.item.dur:(sobel?Math.round(A.dur*1.25):A.dur);
  const max=d.item.max!==undefined?d.item.max:(sobel?Math.round(A.dur*1.25):A.dur);
  const def=d.item.sdef!==undefined&&d.item.sdef!==null?d.item.sdef:A.def;
  ch.armor={id:d.item.id,def,dur,max,quality:d.item.quality||null};
  if(old)ch.inv[d.i]={id:old.id,q:1,dur:old.dur,max:old.max,
   quality:old.quality||null,sdef:old.def};
  toast(ITEMS[d.item.id].n+' equipped — DEF+'+A.def,'good');
 }else{
  const cur=ch.slots[key];
  if(cur&&cur.id===d.item.id){ // item sama → stack
   const mx=ITEMS[d.item.id].stack;
   const space=Math.min(mx-cur.q,d.item.q);
   cur.q+=space;d.item.q-=space;
   if(d.item.q>0)ch.inv[d.i]=d.item;
   toast(ITEMS[cur.id].n+' stacked ×'+cur.q,'good');
  }else if(cur){ // beda item → swap
   ch.slots[key]={id:d.item.id,q:d.item.q};
   ch.inv[d.i]={id:cur.id,q:cur.q};
   toast(ITEMS[d.item.id].n+' → '+(key==='rec'?'RECOVERY':'BUFF')+' SLOT','good');
  }else{
   ch.slots[key]={id:d.item.id,q:d.item.q};
   toast(ITEMS[d.item.id].n+' → '+(key==='rec'?'RECOVERY':'BUFF')+' SLOT','good');
  }
 }
 renderInv();
}
function dragTargetAt(x,y){
 const el=document.elementFromPoint(x,y);
 if(!el||!el.closest)return null;
 const btn=el.closest('.icobtn');
 if(btn&&(btn.id==='btnDiscard'||btn.id==='btnDrop'))return btn;
 const slot=el.closest('.sslot');      // FIX #3: special slot = target drag
 if(slot)return slot;
 return null;
}
function makeDragGhost(item){
 let g=$('dragGhost');
 if(!g){
  g=document.createElement('div');g.id='dragGhost';
  document.body.appendChild(g);
 }
 g.innerHTML=icHtml(ITEMS[item.id].ic,ITEMS[item.id].c)+'<span></span>';
 g.querySelector('span').textContent=ITEMS[item.id].n+' ×'+item.q;
 g.style.display='flex';
 return g;
}
function invDiscardOne(i){ // F7(3b): per karakter
 const ch=panelChar();
 const s=ch.inv[i];
 if(!s)return;
 ch.inv[i]=null;
 renderInv();
 toast('Discarded '+s.q+' '+ITEMS[s.id].n,'bad');
}
function invDropOne(i){ // F7(3b): per karakter
 const ch=panelChar();
 const s=ch.inv[i];
 if(!s)return;
 if(S.gItems.length>=60){toast('Ground full — cannot drop','bad');return;}
 ch.inv[i]=null;
 spawnGItem(s.id,s.q,ch.x+rnd(-.6,.6),ch.z+rnd(-.6,.6),S.now+5); // grace 5 dtk
 renderInv();
 toast('Dropped '+s.q+' '+ITEMS[s.id].n,'good');
}
function toggleInvMode(m){
 S.invMode=(S.invMode===m)?null:m; // klik ikon lagi = batal
 S.invSel=new Set();
 renderInv();
}
function doDiscard(){ // F7(3b): per karakter
 if(S.invMode!=='discard'||!S.invSel||!S.invSel.size)return;
 const ch=panelChar();
 let n=0;
 for(const i of S.invSel)if(ch.inv[i]){n+=ch.inv[i].q;ch.inv[i]=null;}
 S.invMode=null;S.invSel=null;
 renderInv();
 toast('Discarded '+n+' item(s) — destroyed permanently','bad');
}
function doDrop(){ // F7(3b): per karakter
 if(S.invMode!=='drop'||!S.invSel||!S.invSel.size)return;
 const ch=panelChar();
 let n=0,lost=0;
 for(const i of S.invSel){
  const s=ch.inv[i];
  if(!s)continue;
  if(S.gItems.length>=60){lost+=s.q;continue;}
  spawnGItem(s.id,s.q,ch.x+rnd(-.6,.6),ch.z+rnd(-.6,.6),S.now+5);
  n+=s.q;ch.inv[i]=null;
 }
 S.invMode=null;S.invSel=null;
 renderInv();
 if(lost>0)toast('Ground full — '+lost+' item(s) could not be dropped','bad');
 else toast('Dropped '+n+' item(s) near '+ch.n,'good');
}
function renderBuild(){ // F9d D45: akses = karakter TERSELEKSI (was: all-only)
 const ch=panelChar();
 const rows=$('buildRows');if(!rows)return;
 const NAME={vikry:'VIKRY',reza:'REZA'};
 let h='';
 for(const id in BUILDS){
  const b=BUILDS[id],ok=canAfford(b.mats,ch);
  const locked=b.access!=='all'&&ch.id!==b.access; // F9d: pemilik = terseleksi? terbuka
  const mats=Object.entries(b.mats).map(([k,v])=>
   '<b class="'+(invCount(k,ch)>=v?'ok':'no')+'">'+invCount(k,ch)+'/'+v+' '
   +ITEMS[k].n+'</b>').join(' · ');
  h+='<div class="brow'+(locked?' lock':'')+'">'
  +icHtml(b.ic,b.c)
   +'<div class="inf"><div class="nm">'+b.n+'</div><div class="ds">'+b.d+'</div>'
   +'<div class="mats">'+mats+' · '+b.t+'s'+(b.hp?' · '+b.hp+' HP':'')+'</div></div>'
   +(locked
    ?'<div class="lk">HANYA<br>'+NAME[b.access]+'</div>'
    :'<button class="bbtn" data-bid="'+id+'"'+(ok?'':' disabled')+'>BUILD</button>')
   +'</div>';
 }
 rows.innerHTML=h;
}
function renderCraft(){ // F7(3b) + F10.10.2: workbench mode
 const ch=panelChar();
 const rows=$('craftRows');if(!rows)return;
 const CATS=[['basic','BASIC'],['cook','COOKING — ALVI'],
  ['aid','FIRST AID — ARIZ'],['protect','PROTECTION — SOBEL']];
 const OWNER={cook:'alvi',aid:'ariz',protect:'sobel'};
 const atWb=(S.workbench===ch); // F10.10.2: workbench aktif untuk char ini?
 let h='';
 for(const[cat,label]of CATS){
  // F10.10.2: PROTECT terbuka utk semua char selama di workbench
  const catOpen=cat==='basic'||ch.id===OWNER[cat]||(cat==='protect'&&atWb);
  h+='<div class="cath">'+label+'</div>';
  for(const id in CRAFTS){
   const c=CRAFTS[id];
   if(c.cat!==cat)continue;
   const it=ITEMS[id];
   // F10.10.2: Military armor — Sobel-only, TIDAK terbuka lewat workbench
   const milLock=(id==='military'&&ch.id!=='sobel');
   const locked=!catOpen||milLock;
   const ok=canAfford(c.mats,ch);
   const mats=Object.entries(c.mats).map(([k,v])=>
   '<b class="'+(invCount(k,ch)>=v?'ok':'no')+'">'+invCount(k,ch)+'/'+v+' '
   +ITEMS[k].n+'</b>').join(' · ');
   let lockTxt;
   if(milLock)lockTxt='HANYA<br>SOBEL'; // F10.10.2b: Military permanen Sobel-only
   else if(cat==='protect')lockTxt='SOBEL<br>atau<br>WORKBENCH'; // F10.10.2b: Denim/Leather buka via garage apparatus
   else lockTxt='HANYA<br>'+(cat==='cook'?'ALVI':cat==='aid'?'ARIZ':'SOBEL');
   h+='<div class="brow'+(locked?' lock':'')+'" data-crow="'+id+'" data-owner="'+ch.id+'"><div class="cwipe"></div>'
   +icHtml(it.ic,it.c)
    +'<div class="inf"><div class="nm">'+it.n+'</div><div class="ds">'+(it.d||'')+'</div>'
    +'<div class="mats">'+mats+' · '+c.t+'s</div></div>'
    +(locked?'<div class="lk">'+lockTxt+'</div>'
     :'<button class="bbtn" data-cid="'+id+'"'+(ok?'':' disabled')+'>CRAFT</button>')
    +'</div>';
  }
 }
 rows.innerHTML=h;
 // F10.10.2b: footer hint — arahkan pemain ke workbench kalau mau craft PROTECT
 // tanpa Sobel (Denim/Leather only; Military tetap Sobel).
 const foot=document.querySelector('#craftPanel .f3f');
 if(foot){
  const atWb=(S.workbench===ch);
  foot.textContent=atWb
   ?'WORKBENCH MODE — PROTECTION (Denim/Leather) terbuka utk semua · Military tetap Sobel'
   :'Material dari drop zombie · H: pakai heal · G: pakai buff · PROTECTION via Workbench (garage apparatus)';
 }
}
function updateCraftWipe(co){ // F7(3b): wipe HANYA menempel di menu PEMILIK craft
 const ow=co.owner?co.owner.id:'';
 const row=document.querySelector(
  '#craftRows .brow[data-crow="'+co.bid+'"][data-owner="'+ow+'"]');
 if(!row)return; // row milik pemilik tidak ada di menu ini → diam
 const w=row.querySelector('.cwipe');
 if(w)w.style.width=clamp(co.t/co.dur*100,0,100)+'%';
}
function tryCraftPlace(tx,ty){
 const ch=S.placement.owner; // F7(3b)
 if(ch.constr){toast(ch.n+' is already constructing','bad');return;}
 const c=CRAFTS[S.placement.id];
 if(!validFloorCell(tx,ty)){toast('Place on a free indoor floor block','bad');return;}
 if(charOnBlock(tx,ty)){ // F8a(3c)
  toast('A character is standing there — move them first','bad');return;}
 if(!nearBuild(tx,ty,ch)){toast('Too far — '+ch.n+' must be within 1 block','bad');return;}
 if(!canAfford(c.mats,ch)){toast('Not enough materials','bad');return;}
 ch.constr={kind:'cplace',owner:ch,bid:S.placement.id,x:tx,y:ty,t:0,dur:c.t,cost:c.mats};
 if(S.placement.id==='lantern')SFX('buildLantern');
 else if(S.placement.id==='storagebox')SFX('buildBox');
 toast('Placing '+ITEMS[S.placement.id].n+'… right-click the cell to cancel');
 S.placement=null;clearPlaceMarks();
}
{const r=$('craftRows');if(r)r.addEventListener('click',e=>{
 const btn=e.target.closest('.bbtn');if(!btn)return;
 const id=btn.dataset.cid,c=CRAFTS[id];
 const ch=panelChar(); // F7(3b)
 const OWNC={cook:'alvi',aid:'ariz',protect:'sobel'}; // F9d D45
 if(id==='military'&&ch.id!=='sobel'){ // F10.10.2: guard military (workbench tidak buka ini)
  toast('Military Armor is SOBEL-exclusive','bad');return;}
 // F10.10.2: category guard — allow PROTECT jika di workbench
 const atWb=(S.workbench===ch);
 if((c.cat!=='basic'&&ch.id!==OWNC[c.cat]&&!(c.cat==='protect'&&atWb))||!canAfford(c.mats,ch))return;
 if(ch.constr){toast(ch.n+' is already constructing','bad');return;}
 if(c.place){ // Lantern / Storage Box → placement mode (perlu peta → menu tutup)
  closeAllPanels();
  S.placement={id,src:'craft',owner:ch}; // F7(3b): pemilik terikat
  showPlaceMarks();
  toast('Walk to a free floor spot · click to place · right-click to cancel','good');
 }else{ // consumable — TETAP di menu, wipe progress di kotak item
  S.placement=null;
  ch.constr={kind:'craft',owner:ch,bid:id,x:Math.floor(ch.x),y:Math.floor(ch.z),
   t:0,dur:c.t,cost:c.mats};
  toast('Crafting '+ITEMS[id].n+'…');
 }
});}
{const b=$('craftX');if(b)b.onclick=closeAllPanels;}
function togglePanel(which){
 if(S.ui===which){closeAllPanels();return;}
 closeAllPanels();
 S.ui=which;
 if(which==='inv'){$('invPanel').style.display='flex';renderInv();SFX('invOpen');
  document.querySelector('#invPanel h2').textContent='INVENTORY — '+panelChar().n;} // F7(3b)
 if(which==='build'){$('buildPanel').style.display='flex';renderBuild();SFX('buildOpen');
  document.querySelector('#buildPanel h2').textContent='BUILDING — '+panelChar().n;}
 if(which==='craft'){S.workbench=null; // F10.10.2: mode C-key = craft biasa (bukan workbench)
  $('craftPanel').style.display='flex';renderCraft();SFX('buildOpen');
  document.querySelector('#craftPanel h2').textContent='CRAFTING — '+panelChar().n;}
}
// F10.10.2: workbench = craft panel + flag `S.workbench`. Kategori PROTECT (Denim/
// Leather) terbuka utk semua char selama di workbench. Military tetap Sobel-only.
function openWorkbench(ch){
 closeAllPanels();
 S.workbench=ch;
 S.ui='craft';
 $('craftPanel').style.display='flex';
 renderCraft();
 document.querySelector('#craftPanel h2').textContent='CRAFTING — WORKBENCH · '+ch.n;
 SFX('buildOpen');
}
// ---- F7c: DEPLOY MENU (T) §23.2/§23.3 — view kapan pun, ubah hanya Prep ----
ensure('deployPanel','position:fixed;inset:0;display:none;align-items:center;justify-content:center;'
 +'background:rgba(5,4,3,.6);z-index:25;pointer-events:auto',
 '<div class="f3p"><div class="f3h"><h2>SQUAD DEPLOYMENT</h2>'
 +'<button class="f3x" id="deployX">×</button></div>'
 +'<div id="deployBody"></div>'
 +'<div class="f3f" id="deployFoot"></div></div>');
// ===== F10.1: CHARACTER PANEL — 3 tab (STATS aktif · JOURNAL & UPGRADE placeholder) =====
ensure('charPanel','position:fixed;inset:0;display:none;align-items:center;justify-content:center;'
 +'background:rgba(5,4,3,.6);z-index:26;pointer-events:auto',
 '<div class="f3p" style="width:520px"><div class="f3h"><h2 id="charTitle">CHARACTER</h2>'
 +'<button class="f3x" id="charX">×</button></div>'
 +'<div class="charTabs" id="charTabs">'
 +'<button class="charTab on" data-tab="stats">STATS · K</button>'
 +'<button class="charTab" data-tab="journal">JOURNAL · J</button>'
 +'<button class="charTab" data-tab="upgrade">UPGRADE · L</button>'
 +'</div><div class="charBody" id="charBody"></div>'
 +'<div class="f3f" id="charFoot"></div></div>');
// F10.3: tombol End the Night (prep phase only) + layer Session Stats
// F10.3-fix: End the Night — warna MERAH (aksi destruktif = cAsh out) + ukuran
// compact konsisten dgn Skip Prep. Palette = pola .dbtn.red existing.
ensure('endNightBtn','position:fixed;top:176px;right:14px;z-index:12;'
 +'background:#2a1414;border:1px solid #7a3a34;color:#e07a70;'
 +'padding:5px 12px;font:12px Staatliches,sans-serif;letter-spacing:.06em;'
 +'cursor:pointer;pointer-events:auto;display:none');
$('endNightBtn').textContent='END THE NIGHT';
// ===== F12.11 BATCH 2: JOMBIPEDIA SCENE 3D =====
// Scene terpisah. Render via `renderer` singleton (bukan WebGLRenderer baru) —
// hindari context leak (FIX 44). Di-render dari loop() saat S.state==='jombipedia'.
let jombTab = 'zombies';     // F12.11-B2-FIX: default 'zombies' sesuai tab .on di HTML
const jombScene = new THREE.Scene();
jombScene.background = new THREE.Color(0x0c0f14);
jombScene.fog = new THREE.Fog(0x0c0f14, 8, 22);

const jombCam = new THREE.PerspectiveCamera(40, innerWidth/innerHeight, .1, 100);
jombCam.position.set(0, 1.3, 3.2);
jombCam.lookAt(0, .75, 0);

jombScene.add(new THREE.AmbientLight(0xffeedd, .8));
{const sun = new THREE.DirectionalLight(0xfffaed, 1.3);
 sun.position.set(3,5,4); sun.castShadow = true;
 sun.shadow.mapSize.set(1024,1024); jombScene.add(sun);}
{const fill = new THREE.DirectionalLight(0x7ab0ff, .5);
 fill.position.set(-4,3,-2); jombScene.add(fill);}

const jombPed = new THREE.Group();
{const floor = new THREE.Mesh(
  new THREE.CylinderGeometry(1.2, 1.25, .08, 36),
  new THREE.MeshLambertMaterial({color: 0x221d17}));
 floor.position.y = -.04; floor.receiveShadow = true; jombPed.add(floor);
 const ring = new THREE.Mesh(
  new THREE.RingGeometry(1.18, 1.22, 48),
  new THREE.MeshBasicMaterial({color: 0xd9a13b, side: THREE.DoubleSide,
   transparent: true, opacity: .6}));
 ring.rotation.x = -Math.PI/2; ring.position.y = .005; jombPed.add(ring);}
jombScene.add(jombPed);

let jombModel = null, jombModelId = null;
let jombTurntable = true;
let jombStance = false; // false=idle, true=aiming
// F12.11-B3: state rotasi model — sumber kebenaran (bukan langsung ke .rotation)
// supaya drag & turntable bisa kooperatif tanpa saling menimpa.
let jombRotY = -.32;   // yaw (kiri-kanan)
let jombRotX = 0;      // pitch (atas-bawah) — di-clamp ±.6 rad
let jombDrag = null;   // {x0,y0,rotY0,rotX0} saat dragging; null saat idle

function jombDisposeModel(){
 if(!jombModel) return;
 jombScene.remove(jombModel);
 jombModel.traverse(o=>{
  if(o.geometry) o.geometry.dispose();
  if(o.material){
   if(Array.isArray(o.material)) for(const m of o.material) m.dispose();
   else o.material.dispose();
  }
 });
 jombModel = null; jombModelId = null;
}

function jombLoadModel(id){
 jombDisposeModel();
 jombModelId = id;
 if(jombTab === 'zombies'){
  if(typeof makeZombieMesh !== 'function') return;
  jombModel = makeZombieMesh(id);
 }else{
  if(!HERO_MESH || typeof HERO_MESH[id] !== 'function') return;
  jombModel = HERO_MESH[id]();
  if(jombModel.userData && jombModel.userData.selArrow) jombModel.userData.selArrow.visible = false;
  jombApplyStance();
 }
 if(jombModel){
  jombModel.position.set(0,0,0);
  // F12.11-B3: reset rotasi ke default pose 3/4 saat ganti model
  jombRotY = -.32;
  jombRotX = 0;
  jombModel.rotation.y = jombRotY;
  jombModel.rotation.x = jombRotX;
  jombScene.add(jombModel);

  // F12.11-B3-fix: auto-frame camera berdasar tinggi model.
  // Model tinggi (ZAlpha ~2.5, PZero ~3.3) → camera naik + zoom lebih jauh
  // supaya kepala tidak terpotong. Model pendek → camera default.
  try{
   jombScene.updateMatrixWorld(true);
   const bbox = new THREE.Box3().setFromObject(jombModel);
   const h = Math.max(.8, bbox.max.y - bbox.min.y);
   const cy = (bbox.max.y + bbox.min.y) / 2;
   const frameY = cy + h * 0.05;
   jombCam.userData.centerY  = cy;
   jombCam.userData.frameY   = frameY;
   jombCam.userData.baseZoom = Math.max(3.2, h * 1.55);
   jombCam.position.set(0, frameY, jombCam.userData.baseZoom);
   jombCam.lookAt(0, cy, 0);
  }catch(e){ console.warn('[JOMB] auto-frame failed:', e); }
 }
}

function jombApplyStance(){
 if(!jombModel || jombTab === 'zombies') return;
 if(!jombModel.userData || !jombModel.userData.aim) return;
 const u = jombModel.userData;
 const rot = jombStance ? u.aim.up : u.aim.down;
 for(const p of u.aim.parts) p.rotation.x = rot;
 if(u.aimSupport){
  u.aimSupport.rotation.x = jombStance ? -1.45 : 0;
  u.aimSupport.rotation.z = jombStance ? -.85 : 0;
 }
}

function jombTick(dt){
 // F12.11-B3: turntable auto-rotate HANYA kalau tidak sedang drag.
 // Model di-ASSIGN dari jombRotY / jombRotX (bukan increment) supaya drag
 // tidak "melawan" akumulasi turntable.
 if(jombModel){
  if(jombTurntable && !jombDrag) jombRotY += dt * .75;
  jombModel.rotation.y = jombRotY;
  jombModel.rotation.x = jombRotX;
 }
 renderer.render(jombScene, jombCam);
}
ensure('sessionStats','position:fixed;inset:0;z-index:34;display:none;'
 +'align-items:center;justify-content:center;background:rgba(5,4,3,.85);pointer-events:auto',
 '<div class="sessionCard">'
 +'<div class="stTitle" id="stTitle">EXPEDITION ENDED</div>'
 +'<div class="stSub" id="stSub"></div>'
 +'<div class="stDivider"></div>'
 +'<div class="stGrid" id="stGridBody"></div>'
 +'<div class="mvpRow" id="stMvp"></div>'
 +'<div class="stBtnRow">'
 +'<button id="btnTryAgain">TRY AGAIN — NIGHT 1</button>'
 +'<button id="btnBackToMenu">BACK TO MAIN MENU</button>'
 +'</div>'
 +'</div>');
let charTab='stats'; // F10.1: tab aktif saat panel dibuka
function openCharPanel(tab){
 if(S.ui==='char'&&charTab===tab){closeAllPanels();return;} // toggle
 closeAllPanels();
 S.ui='char';
 charTab=tab||'stats';
 $('charPanel').style.display='flex';
 renderCharPanel();
 SFX('invOpen');
}
function switchCharTab(tab){ // dipanggil tab bar
 charTab=tab;
 renderCharPanel();
 SFX('click');
}
function renderCharPanel(){
 const ch=selChar||diaz;
 if(!ch)return;
 setTxt('charTitle','CHARACTER — '+ch.n);
 // tab bar state
 document.querySelectorAll('.charTab').forEach(t=>{
  t.classList.toggle('on',t.dataset.tab===charTab);
 });
 // body
 if(charTab==='stats')renderCharStats(ch);
 else if(charTab==='journal')renderCharJournal(ch);
 else if(charTab==='upgrade')renderCharUpgrade(ch);
}
// F10.2.2b: tooltip skill+pasif — 1 elemen singleton, posisi mengikuti ikon
function showSkillTip(target,id){
 const C=CHARS[id];if(!C)return;
 // F10.2.2b FIX: JANGAN set inline `display:none` — inline style mengalahkan
 // class `.show{display:block}` di CSS → tooltip tetap tersembunyi. Cukup
 // biarkan CSS `#skillTip{display:none}` (default) + `#skillTip.show{display:block}`.
 const el=ensure('skillTip','position:fixed;z-index:70;');
 el.innerHTML=
  '<h4>'+C.skill+'</h4>'
  +'<div class="sdesc">'+C.skd+'</div>'
  +'<div class="psep"></div>'
  +'<h5>PASSIVE — '+(PASSIVE_NAMES[C.passive]||C.passive.toUpperCase())+'</h5>'
  +'<div class="pdesc">'+C.psd+'</div>';
 el.classList.add('show');
 positionSkillTip(target);
}
function positionSkillTip(target){
 const el=$('skillTip');if(!el)return;
 const r=target.getBoundingClientRect();
 let x=r.left+r.width/2-el.offsetWidth/2;
 let y=r.top-el.offsetHeight-10;
 if(x<8)x=8;
 if(x+el.offsetWidth>innerWidth-8)x=innerWidth-el.offsetWidth-8;
 if(y<8)y=r.bottom+10; // flip ke bawah kalau tidak muat di atas
 el.style.left=x+'px';
 el.style.top=y+'px';
}
function hideSkillTip(){const el=$('skillTip');if(el)el.classList.remove('show');}
document.addEventListener('mouseover',e=>{
 const t=e.target.closest&&e.target.closest('.skillIcon');
 if(!t||!t.dataset.skill)return;
 showSkillTip(t,t.dataset.skill);
});
document.addEventListener('mouseout',e=>{
 const t=e.target.closest&&e.target.closest('.skillIcon');
 if(!t)return;
 hideSkillTip();
});
function renderCharStats(ch){
 const body=$('charBody');if(!body)return;
 const alloc=ch.spAlloc||(ch.spAlloc={hp:0,atk:0,def:0,agi:0,spd:0});
 const C=CHARS[ch.id];
 const rows=[
  {k:'hp', n:'HP',  base:C.hp,  inc:5,  cur:C.hp+alloc.hp*5},
  {k:'atk',n:'ATK', base:C.atk, inc:1,  cur:C.atk+alloc.atk},
  {k:'def',n:'DEF', base:C.def, inc:1,  cur:C.def+alloc.def},
  {k:'agi',n:'AGI', base:C.agi, inc:1,  cur:C.agi+alloc.agi},
  {k:'spd',n:'SPD', base:C.spd, inc:1,  cur:C.spd+alloc.spd}];
 const CAP=20;
 let h='<div class="spHead">'
  +'<div style="display:flex;align-items:center;gap:10px">'
  +skillIconHtml(ch.id,'hdr') // F10.2.2b
  +'<div>LEVEL <b>'+ch.lvl+'</b></div></div>'
  +'<div class="avail">SKILL POINTS <b>'+ch.sp+'</b></div></div>';
 for(const r of rows){
  const a=alloc[r.k];
  const maxed=a>=CAP;
  const canUp=ch.sp>0&&!maxed;
  const pct=Math.round(a/CAP*100);
  h+='<div class="statRow">'
   +'<div class="statName">'+r.n+'</div>'
   +'<div class="statBar'+(maxed?' max':'')+'"><i style="width:'+pct+'%"></i></div>'
   +'<div class="statVal">'+r.cur+'<span class="alloc'+(maxed?' max':'')+'">+'+a+'/'+CAP+'</span></div>'
   +'<button class="statBtn" data-stat="'+r.k+'"'+(canUp?'':' disabled')+'>+</button>'
   +'</div>';
 }
 body.innerHTML=h;
 setTxt('charFoot','1 SP = +'+5+' HP · +1 stat · cap 20/stat · allocation is permanent');
}
function renderCharJournal(ch){ // F10.4: 3 misi aktif — 1 Easy + 1 Moderate + 1 Hard
 const body=$('charBody');if(!body)return;
 if(!ch.journal)ch.journal=pickJournal();
 const TCOL={easy:'#7fa35b',moderate:'#e6c34a',hard:'#c0453a'};
 const TNAME={easy:'EASY',moderate:'MODERATE',hard:'HARD'};
 let h='<div class="spHead"><div>JOURNAL — '+ch.n+'</div>'
  +'<div class="avail">NIGHT <b>'+night.n+'</b></div></div>';
 const order=['easy','moderate','hard'];
 // Match mission → tier via id prefix
 const tierOf=id=>id[0]==='e'?'easy':id[0]==='m'?'moderate':'hard';
 for(const m of ch.journal.missions){
  const tier=tierOf(m.id);
  const prog=Math.min(ch.jc[m.key]||0,m.goal);
  const pct=Math.round(prog/m.goal*100);
  const done=m.done;
  h+='<div style="border:1px solid '+(done?'#4a6a2c':'#262017')+';'
   +'background:'+(done?'#0d1209':'#171310')+';padding:12px 16px;margin:10px 0">'
   +'<div style="display:flex;justify-content:space-between;align-items:baseline">'
   +'<span style="font:10px monospace;color:'+TCOL[tier]+';letter-spacing:.12em">'
   +TNAME[tier]+' · '+m.xp+' XP</span>'
   +(done?'<span style="font:11px monospace;color:#7fa35b">✓ COMPLETE</span>':'')
   +'</div>'
   +'<div style="font:18px Staatliches,sans-serif;color:'+(done?'#9ad970':'#e7dcc3')+';'
   +'letter-spacing:.06em;margin:4px 0 2px">'+m.n+'</div>'
   +'<div style="font:11px monospace;color:#8f8264;line-height:1.5">'+m.d+'</div>'
   +'<div style="height:8px;background:#0e0c09;border:1px solid #262017;margin:8px 0 3px">'
   +'<i style="display:block;height:100%;width:'+pct+'%;'
   +'background:'+(done?'#7fa35b':'#d9a13b')+';transition:width .18s"></i></div>'
   +'<div style="display:flex;justify-content:space-between;font:10px monospace;color:#8f8264">'
   +'<span>'+prog+' / '+m.goal+'</span>'
   +'<span>'+pct+'%</span></div>'
   +'</div>';
 }
 body.innerHTML=h;
 setTxt('charFoot','Missions reset every night — rewards are XP · not tied to Respect');
}
function renderCharUpgrade(ch){ // F10.2.2 + F10.2-UI + F10.2-UI.2: grid 2D
 const body=$('charBody');if(!body)return;
 let h='<div class="spHead"><div>UPGRADE TREE — '+ch.n+'</div>'
  +'<div class="avail">RESPECT <b>'+S.respect+'</b></div></div>';
 h+='<div class="treeWrap">';
 // Row 1 — header tiap path (4 sel)
 for(const path of TREE_KEYS){
  const P=TREE[path];
  h+='<div class="treeColHdr" style="color:'+P.col+';border-bottom-color:'+P.col+'">'
   +P.n+'</div>';
 }
 // Row 2..5 — tier t, tiap tier isi 4 path
 for(let t=1;t<=4;t++){
  for(const path of TREE_KEYS){
   const P=TREE[path],node=P.nodes[t-1],cur=treeTier(ch,path);
   const unlocked=cur>=t;
   const isNext=cur+1===t;
   const canAfford=S.respect>=node.c;
   const cls=unlocked?'unlocked':isNext?(canAfford?'next':'next noAfford'):'locked';
   h+='<div class="tnode '+cls+'" data-tree="'+path+'" data-tier="'+t+'">'
    +'<div class="tnTier">TIER '+t+'</div>'
    +'<div class="tnName">'+node.l+'</div>'
    +'<div class="tnDesc">'+node.d+'</div>'
    +'<div class="tnCost">'+(unlocked?'OWNED':'★ '+node.c)+'</div>'
    +'</div>';
  }
 }
 h+='</div>';
 body.innerHTML=h;
 setTxt('charFoot','Click the highlighted (next) tier to purchase · cost is Respect · permanent');
}
function statAllocUp(stat){
 const ch=selChar||diaz;
 if(!ch)return;
 if(ch.sp<=0){toast('No Skill Points available','bad');return;}
 if(!ch.spAlloc)ch.spAlloc={hp:0,atk:0,def:0,agi:0,spd:0};
 if(ch.spAlloc[stat]>=20){toast('Already at max (20)','bad');return;}
 ch.spAlloc[stat]++;
 ch.sp--;
 if(stat==='hp'){ // HP langsung naik +5 (bukan hanya max)
  const before=ch.es.hpMax;
  ch.es=effStats(ch);
  const gain=ch.es.hpMax-before;
  ch.hp=Math.min(ch.es.hpMax,ch.hp+gain);
  floatText(ch.x,ch.z,'+'+gain+' HP','heal',.3);
 }else{
  ch.es=effStats(ch);
 }
 SFX('levelUp');
 renderCharPanel();
}
// F10.2.2: dialog konfirmasi pembelian tier tree (D7 — permanen, wajib konfirmasi)
function showTreeConfirm(ch,path,tier){
 const P=TREE[path],node=P.nodes[tier-1];
 const cur=treeTier(ch,path);
 if(cur>=tier){toast('Already unlocked','bad');return;}
 if(cur+1!==tier){toast('Unlock previous tiers first','bad');return;}
 if(S.respect<node.c){
  toast('Not enough Respect — need '+node.c,'bad');return;
 }
 const d=ensure('treeConfirm','position:fixed;inset:0;z-index:36;display:none;'
  +'align-items:center;justify-content:center;background:rgba(5,4,3,.78);pointer-events:auto');
 d.innerHTML=
  '<div class="f3p" style="width:380px;text-align:center;padding:22px">'
  +'<h2 style="font:20px Staatliches,sans-serif;color:'+P.col+';letter-spacing:.14em">'
  +P.n+' · TIER '+tier+'</h2>'
  +'<div style="font:24px Staatliches,sans-serif;color:#e7dcc3;letter-spacing:.08em;'
  +'margin:10px 0 8px">'+node.l+'</div>'
  +'<div style="font:11px monospace;color:#cfc4a6;line-height:1.6;margin-bottom:14px;'
  +'padding:0 8px">'+node.d+'</div>'
  +'<div style="font:10px monospace;color:#8f8264;margin-bottom:16px">'
  +'COST <b style="color:#d9a13b;font-size:15px">★ '+node.c+'</b>'
  +' &nbsp;·&nbsp; YOUR RESPECT <b style="color:#7fa35b">'+S.respect+'</b>'
  +' &rarr; <b style="color:#cfc4a6">'+(S.respect-node.c)+'</b>'
  +'</div>'
  +'<div style="display:flex;gap:10px;justify-content:center">'
  +'<button id="treeNo" class="dbtn" style="min-width:120px">CANCEL</button>'
  +'<button id="treeYes" class="dbtn" style="min-width:120px">UNLOCK</button>'
  +'</div>'
  +'<div style="font:9px monospace;color:#5c5340;margin-top:12px">'
  +'Allocation is permanent — no respec.</div>'
  +'</div>';
 d.style.display='flex';
 $('treeNo').onclick=()=>{d.style.display='none';SFX('click');};
 $('treeYes').onclick=()=>{
  d.style.display='none';
  if(treeBuy(ch,path)){renderCharPanel();refreshHud();}
 };
}
// event delegation: tab klik + tombol stat + klik node tree
{ const p=$('charPanel');
 if(p){
  p.addEventListener('click',e=>{
   const tab=e.target.closest('.charTab');
   if(tab&&!tab.classList.contains('lock')){switchCharTab(tab.dataset.tab);return;}
   const btn=e.target.closest('.statBtn');
   if(btn&&!btn.disabled){statAllocUp(btn.dataset.stat);return;}
   const tn=e.target.closest('.tnode');
   if(tn&&tn.classList.contains('next')){
    const ch=selChar||diaz;
    if(ch)showTreeConfirm(ch,tn.dataset.tree,+tn.dataset.tier);
    return;
   }
  });
 }
 const x=$('charX');if(x)x.onclick=closeAllPanels;
}
// FIX(47) P6: §15.1 — cap MAKS 100 (revert dari 80), TAPI ditambah constraint
// kedua: max 5 karakter deployed. Kedua constraint harus lulus bersamaan (AND).
const MAX_DEPLOY_CHARS=5;
function deployCap(){return Math.min(100,20+5*(night.n-1));}
function deployUsed(){let n=0;
 for(const c of chars)if(c.deployed)n+=charDeployCost(c);return n;} // F10.2.3: PAS T4 -25%
function deployCount(){let n=0;
 for(const c of chars)if(c.deployed)n++;return n;}
function overDeploy(){return deployUsed()>deployCap()||deployCount()>MAX_DEPLOY_CHARS;}
function openDeploy(){
 closeAllPanels();
 S.ui='deploy';
 $('deployPanel').style.display='flex';
 renderDeploy();
 SFX('buildOpen');
}
function toggleDeploy(){
 if(S.ui==='deploy'){closeAllPanels();return;}
 openDeploy();
}
function renderDeploy(){ // FIX(21f): 2 kolom · mag + reload efektif · stat polos tanpa bar
 const el=$('deployBody');if(!el)return;
 const canEmpty=(night.phase==='prep'||night.phase==='deploy'); // FIX(38): withdraw hingga 0 saat prep
 const cap=deployCap(),used=deployUsed();
 const canEdit=(night.phase==='prep'||night.phase==='deploy');
 const nDep=chars.filter(c=>c.deployed&&!c.recovering).length;
 const dCnt=deployCount(),overC=used>cap,overN=dCnt>MAX_DEPLOY_CHARS; // FIX(47) P6
 let h='<div class="depInfo"><span>RESPECT <b>'+S.respect+'</b></span>'
  +'<span'+(overC||overN?' class="non"':'')+'>DEPLOY <b>'+dCnt+'/'+MAX_DEPLOY_CHARS
  +' CHAR · '+used+'/'+cap+' COST</b></span>'
  +(overC||overN
   ?'<span class="non">OVER '+(overN&&overC?'CHAR & COST':overN?'CHAR LIMIT':'COST CAP')
    +' — '+(canEdit?'WITHDRAW SOMEONE NOW':'REDUCE DURING PREPARATION PHASE')+'</span>'
   :canEdit?'<span class="okn">CHANGES ALLOWED</span>'
   :'<span class="non">VIEW ONLY — CHANGES DURING PREPARATION PHASE</span>')
  +'</div><div class="dgrid">';
 for(const id of ALL_IDS){
  const C=CHARS[id],rar=RARITY_COL[C.rarity]||'#8f8264';
  const rl=(C.weapon.reload/(1+C.spd/100)).toFixed(1); // FIX(2'): reload efektif SPD dasar
  // F10.2-UI.3: split stats 2 baris — HP/ATK/DEF | AGI/SPD (hindari SPD terpotong)
  const stats='HP '+C.hp+' · ATK '+C.atk+' · DEF '+C.def
   +'<br>AGI '+C.agi+' · SPD '+C.spd;
  if(!S.owned[id]){ // ===== TERKUNCI — TOKO RESPECT =====
   const afford=S.respect>=C.respect;
   h+='<div class="dcard2 lock">'
    +'<div class="dport">'+(PORTRAITS[id]?'<img src="'+PORTRAITS[id]+'" alt="'+C.n+'">':'')
    +'<div class="plkWrap"><div class="plk"></div></div>'
    +skillIconHtml(id) // F10.2.2b: preview skill meski terkunci
    +'</div>'
    +'<div class="dinf2">'
    +'<div class="dnm2">'+C.n+' <span style="color:'+rar+'">'+C.rarity.toUpperCase()+'</span></div>'
    +'<div class="dwea2">'+C.weapon.name+' · MAG '+C.weapon.mag+' · RLD '+rl+'s</div>'
    +'<div class="dst2">'+stats+'</div>'
    +'<div class="dfoot2"><span class="rc">★ '+C.respect+'</span>'
    +'<button class="dbtn" data-un="'+id+'"'
     +((canEdit&&afford)?'':' disabled')+'>UNLOCK</button></div>'
    +'</div></div>';
  }else{ // ===== OWNED =====
   const ch=chars.find(c=>c.id===id);
   h+='<div class="dcard2'+(ch.deployed?'':' resv')+(ch.recovering?' rec':'')+'">'
    +'<div class="dport">'+(PORTRAITS[ch.id]?'<img src="'+PORTRAITS[ch.id]+'" alt="'+ch.n+'">':'')
    +skillIconHtml(ch.id) // F10.2.2b
    +'</div>'
    +'<div class="dinf2">'
    +'<div class="dnm2">'+ch.n+' <span>LV '+ch.lvl+' · '+(C.rarity||'STARTER').toUpperCase()+'</span></div>'
    +'<div class="dwea2">'+C.weapon.name+' · MAG '+charMagMax(ch)+' · RLD '+rl+'s</div>' // F10.2.4: OFF T3-aware
    +'<div class="dst2">'+stats+'</div>'
    +'<div class="dfoot2"><span class="dc">DEP '+charDeployCost(ch)+'</span>' // F10.2.3
    +(ch.recovering?'<button class="dbtn" disabled>RECOVERING</button>'
     :ch.deployed?'<button class="dbtn red" data-dw="'+ch.id+'"'
      +((canEdit&&(nDep>1||canEmpty))?'':' disabled')+'>WITHDRAW</button>'
     :'<button class="dbtn" data-dp="'+ch.id+'"'
      +((canEdit&&dCnt<MAX_DEPLOY_CHARS&&used+charDeployCost(ch)<=cap)?'':' disabled')+'>DEPLOY</button>') // F10.2.3
    +'</div></div></div>';
  }
 }
 h+='</div>';
 el.innerHTML=h;
 const f=$('deployFoot');
 if(f)f.innerHTML=(night.phase==='deploy'
  ?'<button id="deployStart" class="dbtn">START NIGHT NOW</button>'
   +' · night begins automatically when the timer ends'
  :'T: toggle · ESC: close · changes only during Preparation Phase');
 const st=$('deployStart');
 if(st)st.onclick=()=>{closeAllPanels();startNightIntro();};
}
function deployToggle(id){ // deploy/withdraw — hanya Prep / fase deploy awal
 const ch=chars.find(c=>c.id===id);if(!ch)return;
 if(night.phase!=='prep'&&night.phase!=='deploy'){
  toast('Deploy changes only during Preparation Phase','bad');return;}
 if(ch.recovering){toast(ch.n+' is RECOVERING — unavailable','bad');return;}
 const cap=deployCap(),used=deployUsed();
 if(ch.deployed){ // WITHDRAW → reserve — FIX(38): 0 diperbolehkan SELAMA prep/deploy
  const nDep=chars.filter(c=>c.deployed&&!c.recovering).length;
  const canEmpty=(night.phase==='prep'||night.phase==='deploy'); // editor lineup bebas
  if(nDep<=1&&!canEmpty){toast('At least one character must stay deployed','bad');return;}
  if(nDep<=1&&canEmpty&&nDep===1)
   toast('Field is now EMPTY — deploy someone before the night begins','bad'); // peringatan, bukan blokir
  cancelConstruction(ch);
  if(ch._revive)cancelRevive(ch);
  ch._mot=null;
  if(ch.seat){ch.seat=null;standUp(ch);} // F10.10.3-FIX: clear seat state agar tidak stuck "duduk" saat redeploy
  ch.deployed=false;
  ch.mesh.visible=false;
  S.deployOrder=S.deployOrder.filter(id=>id!==ch.id); // F7c(3): keluar dari baris
  if(selChar===ch){
   selChar=chars.find(c=>c.deployed&&!c.recovering&&!c.down)||null;
   for(const c of chars)c.selected=(c===selChar);
  }
  toast(ch.n+' withdrawn to reserve','good');
 }else{ // DEPLOY → muncul di ruang keluarga
  // FIX(47) P6: cek KEDUA constraint (count dulu supaya pesan lebih intuitif)
  if(deployCount()>=MAX_DEPLOY_CHARS){
   toast('Deploy slots full — max '+MAX_DEPLOY_CHARS+' characters in the field','bad');return;}
  if(used+charDeployCost(ch)>cap){ // F10.2.3: PAS T4 -25%
   toast('Deploy cost exceeded — '+used+'/'+cap+' in use','bad');return;}
  ch.deployed=true;
  ch.x=ch._home.x;ch.z=ch._home.z;ch.path=[];ch.lock=null;ch.state='idle';
  ch.mesh.visible=true;
  standUp(ch);
  if(!S.deployOrder.includes(ch.id))S.deployOrder.push(ch.id); // F7c(3): kartu ke posisi akhir
  toast(ch.n+' deployed — cost '+charDeployCost(ch),'good'); // F10.2.3: tampil cost efektif
  chatPush('deployed',ch); // FIX(31)
 }
 SFX('click');
 renderDeploy();
 layoutSquadCards(); // F7c(3): perbarui baris kartu
}
// ---- F8a(2): TOKO RESPECT §7 + LAYAR UNLOCK §17 + KARTU SQUAD DINAMIS ----
const RARITY_COL={Common:'#ececec',Rare:'#e6c34a','Super Rare':'#c07ae8'};
function unlockChar(id){ // §7: belanja Respect — hanya Prep/deploy phase (D2)
 if(S.owned[id]){toast(CHARS[id].n+' is already unlocked');return;}
 if(night.phase!=='prep'&&night.phase!=='deploy'){
  toast('Unlocking only during Preparation Phase','bad');return;}
 const C=CHARS[id];
 if(S.respect<C.respect){
  toast('Not enough Respect — '+C.n+' costs '+C.respect,'bad');return;}
 S.respect-=C.respect;
 doUnlock(id);
}
function doUnlock(id,src){ // masuk roster → RESERVE (src 'rescue' = F8b §16.3)
 S.owned[id]=true;
 const ch=makeChar(id,homeFor(id)); // F12.5: home fixed sesuai slot ALL_IDS
 ch.deployed=false;              // mulai di reserve
 ch.mesh.visible=false;
 chars.push(ch);
 createSquadCard(ch);           // kartu squad untuk hero baru
 SFX('charUnlock'); // FIX(6): fanfare unlock khusus — toko & rescue sama-sama lewat sini
 renderDeploy();
 layoutSquadCards();
 showUnlockScreen(id,src);
 if(S.rescue&&S.rescue.id===id&&S.rescue.state==='active'){ // D14: sudah lunas via toko
  removeRescueMesh(S.rescue);S.rescue=null;
  toast(CHARS[id].n+' is already yours — the figure outside slips away');
 }
}
function createSquadCard(ch){ // F8a(2): kartu §23.5 utk hero yang di-unlock
 const host=$('squad-container');
 if(!host||$('card-'+ch.id))return;
 const d=document.createElement('div');
 d.id='card-'+ch.id;
 d.className='character-card';
 d.innerHTML=
  '<div class="portrait-box">'
  +'<img id="portrait-'+ch.id+'" src="'+(PORTRAITS[ch.id]||'')+'" alt="" style="width:140px;height:170px">'
  +'<span class="level-badge" id="lvl-'+ch.id+'" title="Level">1</span>'
  +'<span class="ammo-badge" id="mag-'+ch.id+'" title="Magazine">9/9</span>'
  +'<span class="portrait-name">'+ch.n+'</span>'
  +'<span class="down-mark">+</span>'
  +skillIconHtml(ch.id) // F10.2.2b
  +'<div class="skillFill" id="skillFill-'+ch.id+'"></div>' // F10.2.2c: fill durasi skill
  +'</div>'
  +'<div class="character-detail">'
  +'<div class="character-title">'
  +'<div><strong>'+ch.n+'</strong><span id="sub-'+ch.id+'">'
  +(CHARS[ch.id].rarity||'STARTER')+' · '+CHARS[ch.id].weapon.name+'</span></div>'
  +'</div>'
  +'<div id="st-'+ch.id+'" class="st-list"></div>'
  +'<div class="bar-label"><span>HP</span><b id="hp-'+ch.id+'">100 / 100</b></div>'
  +'<div class="meter hp"><i id="hp-bar-'+ch.id+'"></i></div>'
  +'<div class="bar-label"><span>ENERGY</span><b id="en-'+ch.id+'">0 / 100</b></div>'
  +'<div class="meter energy"><i id="en-bar-'+ch.id+'"></i></div>'
  +'<div class="bar-label"><span>XP</span><b id="xp-'+ch.id+'">0 / 1000</b></div>'
  +'<div class="meter xp"><i id="xp-bar-'+ch.id+'"></i></div>'
  +'<div class="card-foot"><span id="buff-'+ch.id+'">—</span></div>' // FIX(27)
  +'</div></div>';
 host.appendChild(d);
 d.addEventListener('click',()=>{
  if(ch.recovering){toast(ch.n+' is RECOVERING','bad');return;}
  if(!ch.deployed){toast(ch.n+' is in reserve — deploy via menu (T)','bad');return;}
  selChar=ch;
  for(const c of chars)c.selected=(c===ch);
  toast(ch.n+' selected');
 });
 makePortrait(ch.id); // FIX(44): snapshot ke PORTRAITS + update <img> (renderer singleton)
}
function showUnlockScreen(id,src){ // §17 — FIX(9): innerHTML SELALU dibangun ulang
 // (ensure() lama memasang html sekali → unlock ke-2+ menampilkan kartu unlock PERTAMA)
 const C=CHARS[id];
 const rar=RARITY_COL[C.rarity]||'#8f8264';
 const stat=(nm,v,mx)=>'<div class="dst"><span>'+nm+'</span>'
  +'<div class="dbar"><i style="width:'+clamp(v/mx*100,0,100)+'%"></i></div>'
  +'<b>'+v+'</b></div>';
 const d=ensure('unlockPanel','position:fixed;inset:0;z-index:33;display:none;'
  +'align-items:center;justify-content:center;background:rgba(5,4,3,.8);pointer-events:auto');
 d.innerHTML=
  '<div class="f3p unlockCard" style="width:380px;text-align:center;padding:22px">'
  +'<h2 style="font:24px Staatliches,sans-serif;color:#d9a13b;letter-spacing:.15em">'
  +(src==='rescue'?'SURVIVOR RESCUED':'CHARACTER UNLOCKED')+'</h2>'
  +'<div id="unlockPortrait">'
  +(PORTRAITS[id]?'<img src="'+PORTRAITS[id]+'" style="width:112px;height:136px;'
  +'image-rendering:pixelated;display:block">':'')
  +skillIconHtml(id) // F10.2.2b
  +'</div>'
  +'<div style="font:28px Staatliches,sans-serif;color:#e7dcc3;letter-spacing:.1em">'+C.n+'</div>'
  +'<div style="font:11px monospace;color:'+rar+';letter-spacing:.2em;margin:4px 0 12px">'
  +C.rarity.toUpperCase()+'</div>'
  +'<div style="text-align:left;padding:0 24px">'
  +stat('ATK',C.atk,225)+stat('HP',C.hp,100)+stat('DEF',C.def,105)
  +stat('AGI',C.agi,70)+stat('SPD',C.spd,70)+'</div>'
  +'<div style="font:10px monospace;color:#5c5340;margin-top:14px">'
  +(src==='rescue'?'They made it inside — DEPLOYED and ready to fight'
  :'Character joins your roster in RESERVE — deploy from this menu')+'</div>'
  +'</div>';
 d.style.display='flex';
 d.onclick=()=>{d.style.display='none';};
 clearTimeout(d._t);
 d._t=setTimeout(()=>{d.style.display='none';},6000);
}
// F7c(3): baris kartu squad = HANYA yang dideploy, urut sesuai urutan deploy
// (kartu persisten — canvas portrait tidak dibangun ulang, aman WebGL)
function layoutSquadCards(){
 const host=$('squad-container');
 if(!host)return;
 for(const id of S.deployOrder){       // re-append berurutan → urutan DOM = urutan deploy
  const card=$('card-'+id);
  if(card){card.style.display='flex';host.appendChild(card);}
 }
 for(const ch of chars){                // sisanya (reserve/recovering) disembunyikan
  if(!S.deployOrder.includes(ch.id)){
   const card=$('card-'+ch.id);
   if(card)card.style.display='none';
  }
 }
}
// ---- F8b: RANDOM EVENT §16 + QTE RESCUE §16.1 ----
// Spot kandidat = pintu/jendela mansion · NPC berdiri 1 blok DI LUAR
// (karakter tak bisa keluar mansion — F4). ox/oy = arah luar dari sel dinding.
const RESCUE_SPOTS=[
 {x:20,y:7, kind:'door',  n:'FRONT DOOR',        ox:0, oy:-1},
 {x:19,y:24,kind:'door',  n:'BACK DOOR',         ox:0, oy:1},
 {x:20,y:24,kind:'door',  n:'BACK DOOR',         ox:0, oy:1},
 {x:25,y:24,kind:'door',  n:'BACK DOOR',         ox:0, oy:1},
 {x:13,y:7, kind:'window',n:'NORTH-WEST WINDOW', ox:0, oy:-1},
 {x:27,y:7, kind:'window',n:'NORTH-EAST WINDOW', ox:0, oy:-1},
 {x:15,y:24,kind:'window',n:'SOUTH-WEST WINDOW', ox:0, oy:1}, // F10.10.1b: window geser 13→15
 {x:9,y:18, kind:'window',n:'WEST WINDOW',       ox:-1,oy:0},
 {x:30,y:18,kind:'window',n:'EAST WINDOW',       ox:1, oy:0}];
const QTE_KEYS={arrowup:0,arrowdown:1,arrowleft:2,arrowright:3};
const QTE_GLYPH=['▲','▼','◀','▶'];
ensure('qtePanel','position:fixed;inset:0;z-index:28;display:none;align-items:center;'
 +'justify-content:center;background:rgba(5,4,3,.55);pointer-events:none',
 '<div class="qteCard"><h2>RESCUE — <span id="qteName"></span></h2>'
 +'<div class="qteRow" id="qteSeq"></div>'
 +'<div class="qteTimer"><i id="qteBar"></i></div>'
 +'<div class="qteMeta"><span id="qteAtt"></span><span id="qteTime"></span></div>'
 +'<div class="qteHint">Arrow keys in order · wrong key / 7s timeout = attempt lost · 2 attempts</div>'
 +'</div>');
ensure('helpLbl','position:fixed;z-index:12;pointer-events:none;display:none;'
 +'transform:translate(-50%,-50%);font:15px Staatliches,sans-serif;color:#ffd24a;'
 +'letter-spacing:.15em;text-shadow:0 2px 0 #000,0 0 8px rgba(255,210,74,.6)');
function rescuePick(){ // §17: roll 60/30/10 → pool LOCKED; tier kosong → fallback semua
 const locked=ALL_IDS.filter(id=>!S.owned[id]);
 if(!locked.length)return null;
 const r=Math.random();
 const tier=r<.10?'Super Rare':r<.40?'Rare':'Common';
 let pool=locked.filter(id=>CHARS[id].rarity===tier);
 if(!pool.length)pool=locked; // F8: belum ada Rare/SR terkunci → semua Common
 return pick(pool);
}
function spawnEventZombies(ev,n,types){ // zombie ring luar — hanya sel '.' valid
 const s=ev.spot,bx=s.x+s.ox,by=s.y+s.oy;
 let placed=0;
 for(const[dx,dy]of[[0,0],[1,0],[-1,0],[0,-1],[0,1],[2,0],[-2,0]]){
  if(placed>=n)break;
  const c=cellAt(bx+dx,by+dy);
  if(c!=='.'&&c!=='F')continue;
  spawnZombie(pick(types),bx+dx+.5+rnd(-.2,.2),by+dy+.5+rnd(-.2,.2));
  placed++;
 }
}
function rollRescueEvent(){ // D8: pause 45% / prep 25% — hanya fase aman §16
 if(S.rescue||S.qte)return;
 if(night.phase!=='pause'&&night.phase!=='prep')return;
 const id=rescuePick();if(!id)return;
 if(Math.random()>(night.phase==='pause'?.12:.06))return; // FIX(34): rescue rate DRASTIS turun (was 45/25)
 const spot=pick(RESCUE_SPOTS);
 const knock=spot.kind==='door';
 const trap=knock&&Math.random()<.55; // FIX(34): bait ratio NAIK (was 35) — pintu = lebih berisiko
 const x=spot.x+spot.ox+.5,z=spot.y+spot.oy+.5;
 const mesh=HERO_MESH[id]();
 mesh.userData.selArrow.visible=false;
 mesh.rotation.y=Math.atan2(LIVING.x-x,LIVING.z-z); // hadap mansion
 mesh.position.set(x,0,z);
 const arrow=new THREE.Mesh(new THREE.ConeGeometry(.16,.42,4),
  new THREE.MeshBasicMaterial({color:0xffd24a}));
 arrow.rotation.x=Math.PI; // mengarah ke bawah, di atas kepala NPC
 const ev={id,spot,x,z,mesh,arrow,knock,trap,
  born:S.now,until:S.now+60,state:'active',drag:0}; // §16.3: tenggat 1 menit
 mesh.userData.entity={kind:'rescue',ref:ev}; // klik kiri → pickEntity
 scene.add(mesh);scene.add(arrow);
 S.rescue=ev;
 if(!knock)spawnEventZombies(ev,3,['Runner','Walker']); // §16.2: dikepung
 toast((knock?'SOMEONE IS KNOCKING AT THE '+spot.n
  :'A SURVIVOR IS TRAPPED AT THE '+spot.n)+' — click them! (60s)','bad');
 banner(knock?'A KNOCK AT THE '+spot.n:'A SURVIVOR NEEDS HELP',
  knock?'ANSWER THE DOOR — OR LET IT GO':'CLICK THEM TO START THE RESCUE');
 SFX('rescue');
 camT.x=clamp(x,4,36);camT.z=clamp(z,4,28);syncCamera(); // D13: auto-fokus kamera
}
function hideHelpLbl(){const el=$('helpLbl');if(el)el.style.display='none';}
function removeRescueMesh(ev){
 if(ev.mesh)scene.remove(ev.mesh);
 if(ev.arrow)scene.remove(ev.arrow);
 hideHelpLbl();
}
function dragAway(ev){ // §16.3: diseret ke hutan — geser keluar + tenggelam 1.2 dtk
 ev.state='drag';ev.drag=1.2;
 if(ev.arrow){scene.remove(ev.arrow);ev.arrow=null;}
 hideHelpLbl();
 floatText(ev.x,ev.z,'DRAGGED AWAY!','dmgC',1);
}
function startRescueQTE(){ // §16.1: klik NPC → 5 panah / 7 dtk / 2 percobaan
 const ev=S.rescue;
 if(!ev||ev.state!=='active'||S.qte)return;
 if(ev.trap){trapReveal();return;} // D12: bukan QTE — umpan!
 S.qte={ev,seq:[],idx:0,t:7,att:0};
 qteNewSeq();
 $('qtePanel').style.display='flex';
 renderQTE();updateQTEBar();
}
function qteNewSeq(){
 const q=S.qte;q.seq=[];
 for(let i=0;i<5;i++)q.seq.push(ri(0,3));
 q.idx=0;q.t=7;
}
function qteInput(a){ // D10: salah tekan = attempt hangus SAAT ITU
 const q=S.qte;if(!q)return;
 if(a===q.seq[q.idx]){
  q.idx++;SFX('qteOk');
  if(q.idx>=q.seq.length){qteSuccess();return;}
  renderQTE();
 }else qteAttemptFail();
}
function qteAttemptFail(){
 const q=S.qte;if(!q)return;
 q.att++;
 if(q.att>=2){qteFail();return;} // FIX(7): gagal total → HANYA qte_fail (tanpa tumpukan qte_wrong)
 SFX('qteBad');                  // wrong/timeout DENGAN retry tersisa → qte_wrong (momen retry)
 qteNewSeq();
 toast('Attempt failed — 1 try left','bad');
 renderQTE();
}
function endQTE(){
 S.qte=null;
 const el=$('qtePanel');if(el)el.style.display='none';
}
function qteSuccess(){
 const ev=S.qte.ev;
 endQTE();
 S.rescue=null;
 S.rescuesDone++; // P2: Survivors Rescued
 S.respect+=10;S.respectEarned+=10; // P11: bonus rescue — +10 Respect instan
 removeRescueMesh(ev);
 banner(CHARS[ev.id].n+' WAS RESCUED','THEY MADE IT INSIDE · +10 RESPECT'); // P11
 doUnlock(ev.id,'rescue'); // F8a: roster + layar unlock §17 — charUnlock bunyi DI SINI (FIX 6)
 rescueDeploy(ev); // FIX(5) D15 §16.3: LANGSUNG playable — deployed & masuk mansion
 chatPush('rescued',chars.find(c=>c.id===ev.id),selChar?selChar.n:'the squad'); // FIX(31)
}
function rescueDeploy(ev){ // D15 + FIX(33): deploy paksa + SWAP otomatis saat over-cap
 const ch=chars.find(c=>c.id===ev.id);
 if(!ch)return;
 const s=ev.spot;
 let sp=null;
 const cand=[[s.x-s.ox,s.y-s.oy],[s.x,s.y],
  [s.x-s.ox+(s.ox?0:1),s.y-s.oy+(s.oy?0:1)],
  [s.x-s.ox-(s.ox?0:1),s.y-s.oy-(s.oy?0:1)]];
 for(const[cx,cy]of cand)
  if(passChar(cx,cy)&&!charOnBlock(cx,cy)){sp=[cx+.5,cy+.5];break;}
 if(!sp)sp=[ch._home.x,ch._home.z];
 ch.x=sp[0];ch.z=sp[1];ch.path=[];ch.lock=null;ch.state='idle';
 ch.deployed=true;
 ch.mesh.visible=true;
 ch.mesh.rotation.y=Math.atan2(ev.x-ch.x,ev.z-ch.z);
 standUp(ch);
 if(!S.deployOrder.includes(ch.id))S.deployOrder.push(ch.id);
 // FIX(33) #1: over-cap via rescue → anggota lain di-swap keluar otomatis.
 // Prioritas bench: deploy cost TERBESAR dulu (menutup selisih paling efisien),
 // hanya char HIDUP (down/recovering dihindari — keputusan aneh dihindari).
 const cap=deployCap();
 let used=deployUsed();
 const phaseSafe=(night.phase==='prep'||night.phase==='deploy'); // FIX(39): intervensi hanya saat menata roster
 if(overDeploy()&&!phaseSafe){ // FIX(47) P6: mid-night: biarkan bertempur, enforce di nextNight
  toast(ch.n+' joins the fight — OVER LIMIT ('+deployCount()+'/'+MAX_DEPLOY_CHARS+' · '+used+'/'+cap+') — reduce during Preparation Phase','bad');
  chatPush('deployed',ch);
 }
 if(overDeploy()&&phaseSafe){
  // FIX(38) #3: simulasikan dulu — adakah kombinasi bench yang (a) menutup selisih
  // DAN (b) MEMPERTAHANKAN minimal 1 char lama di field? Kalau tidak → rescued ke
  // RESERVE (tidak menendas semua pendahulu). Kalau ya → bench minimal-ORANG
  // (greedy: cost TERBESAR dulu = paling sedikit korban).
  const others=chars.filter(c=>c.deployed&&c.id!==ch.id&&!c.recovering&&!c.down)
   .sort((a,b)=>charDeployCost(b)-charDeployCost(a)); // F10.2.3: cost efektif tertinggi dulu
  const sim=[];let u=used,cnt=deployCount(); // FIX(47) P6: simulasi kedua constraint
  for(const o of others){ // simulasi greedy — tidak menyentuh state
   if(u<=cap&&cnt<=MAX_DEPLOY_CHARS)break;
   sim.push(o);u-=charDeployCost(o);cnt--; // F10.2.3
  }
  const keepAtLeast1=sim.length<others.length; // minimal 1 char lama selamat
  if(u<=cap&&cnt<=MAX_DEPLOY_CHARS&&keepAtLeast1){
   const swapped=[];
   for(const o of sim){ // eksekusi hasil simulasi
    cancelConstruction(o);
    if(o._revive)cancelRevive(o);
    o._mot=null;
    o.deployed=false;
    o.mesh.visible=false;
    S.deployOrder=S.deployOrder.filter(id=>id!==o.id);
    used-=CHARS[o.id].deploy;
    swapped.push(o);
   }
   toast(ch.n+' joins — '+swapped.map(o=>o.n).join(', ')
    +' sit this one out ('+used+' / '+cap+')','good');
   chatPush('deployed',ch);
   for(const o of swapped)chatPush('swap',o,'swap');
   if(selChar&&(!selChar.deployed||selChar.recovering)){
    selChar=chars.find(c=>c.deployed&&!c.recovering&&!c.down)||null;
    for(const c of chars)c.selected=(c===selChar);
   }
  }else{
   // FIX(38): tak ada komposisi adil → rescued masuk RESERVE — lineup pemain utuh
   ch.deployed=false;
   ch.mesh.visible=false;
   S.deployOrder=S.deployOrder.filter(id=>id!==ch.id);
   toast(ch.n+' rescued — roster full ('+used+' / '+cap+'). Joins in RESERVE — deploy via T','good');
   if(selChar===ch){selChar=chars.find(c=>c.deployed&&!c.recovering&&!c.down)||null;
    for(const c of chars)c.selected=(c===selChar);}
  }
 }
 layoutSquadCards();
}
function enforceDeployCap(){ // D16 + FIX(33) #4 + FIX(47) P6: bench LIFO sampai
 // KEDUA constraint lulus (cost ≤ cap DAN count ≤ MAX_DEPLOY_CHARS).
 // Char HIDUP didahulukan; down hanya kalau tak ada pilihan.
 const cap=deployCap();
 let used=deployUsed();
 if(!overDeploy())return;
 const tryBench=list=>{
  for(let i=list.length-1;i>=0;i--){
   if(used<=cap&&deployCount()<=MAX_DEPLOY_CHARS)break; // FIX(47): cek kedua
   const ch=list[i];
   if(!ch||!ch.deployed||ch.recovering)continue;
   if(chars.filter(c=>c.deployed&&!c.recovering).length<=1)break;
   cancelConstruction(ch);
   if(ch._revive)cancelRevive(ch);
   ch._mot=null;
   ch.deployed=false;
   ch.mesh.visible=false;
   S.deployOrder=S.deployOrder.filter(x=>x!==ch.id);
   used-=charDeployCost(ch); // F10.2.3
   const why=deployCount()>=MAX_DEPLOY_CHARS?'char limit':'cost cap'; // FIX(47): pesan adaptif
   toast(ch.n+' benched — '+why+' over ('+deployCount()+'/'+MAX_DEPLOY_CHARS+' · '+used+'/'+cap+')','bad');
  }
 };
 tryBench(S.deployOrder.map(id=>chars.find(c=>c.id===id)).filter(c=>c&&!c.down)); // hidup dulu
 tryBench(S.deployOrder.map(id=>chars.find(c=>c.id===id))); // sisa (down) kalau masih over
 if(selChar&&(!selChar.deployed||selChar.recovering)){
  selChar=chars.find(c=>c.deployed&&!c.recovering&&!c.down)||null;
  for(const c of chars)c.selected=(c===selChar);
 }
 layoutSquadCards();
}
function qteFail(){
 const ev=S.qte.ev;
 endQTE();
 SFX('qteFail');
 banner('RESCUE FAILED',CHARS[ev.id].n+' WAS DRAGGED INTO THE FOREST');
 dragAway(ev);
}
function trapReveal(){ // D12: ketukan = umpan — zombie meledak dari treeline
 const ev=S.rescue;
 S.rescue=null;
 removeRescueMesh(ev);
 SFX('trap');
 banner("IT'S A TRAP!",'THE KNOCKING WAS ZOMBIE BAIT');
 spawnEventZombies(ev,4,['Runner','Walker','Biter']);
 toast('Zombies burst from the treeline!','bad');
}
function renderQTE(){
 const q=S.qte;if(!q)return;
 setTxt('qteName',CHARS[q.ev.id].n);
 let h='';
 for(let i=0;i<q.seq.length;i++)
  h+='<span class="qa'+(i<q.idx?' done':i===q.idx?' cur':'')+'">'
   +QTE_GLYPH[q.seq[i]]+'</span>';
 $('qteSeq').innerHTML=h;
 setTxt('qteAtt','ATTEMPT '+(q.att+1)+' / 2');
}
function updateQTEBar(){
 const q=S.qte;if(!q)return;
 setW('qteBar',clamp(q.t/7*100,0,100)+'%');
 setTxt('qteTime',Math.max(0,q.t).toFixed(1)+'s');
}
function updateRescue(dt){ // dipanggil loop §23: panah, timeout, drag, timer QTE
 const ev=S.rescue;
 if(!ev){hideHelpLbl();return;}
 if(ev.state==='active'){
  ev.arrow.position.set(ev.x,1.95+.15*Math.sin(S.now*4),ev.z);
  ev.arrow.visible=((S.now*2|0)%2)===0; // kedip 0.5 dtk
  const el=$('helpLbl');
  if(el){
   const[sx,sy]=toScreen(ev.x,2.45,ev.z);
   el.style.display='block';
   el.style.left=sx+'px';el.style.top=sy+'px';
   el.textContent='HELP!';
  }
  if(!S.qte&&S.now>ev.until){ // §16.3: diabaikan 1 menit → diseret
   toast(CHARS[ev.id].n+' was dragged back into the forest','bad');
   dragAway(ev);
  }
 }else if(ev.state==='drag'){
  ev.drag-=dt;
  const p=1-clamp(ev.drag/1.2,0,1);
  ev.mesh.position.set(ev.x+ev.spot.ox*4*p,-.4*p*p,ev.z+ev.spot.oy*4*p);
  ev.mesh.rotation.y+=dt*6; // sempoyongan diseret
  if(ev.drag<=0){removeRescueMesh(ev);S.rescue=null;}
 }
 if(S.qte){
  S.qte.t-=dt;
  if(S.qte.t<=0)qteAttemptFail();
  else updateQTEBar();
 }
}
// ---- F9b.5: SQUAD CHAT — laporan karakter ala chat bubble (usulan user) ----
// ALERT merah: barricade hancur · char down · sekarat <15HP · elite · boss
// NOTICE hijau: auto-heal · auto-buff · revive selesai · build/repair selesai
// (crafting DIKECUALIKAN). Max 3 bubble: baru masuk bawah, lama naik, paling atas
// fade out. Reporter: diri utk event diri; utk event dunia/orang lain = 1 char hidup
// acak (selected char termasuk). Toast system TETAP utk pesan sistem/UI.
ensure('squadChat','','');
const squadChat=[];
const CHAT_EVENTS={
 barricade:{t:'alert',v:[
  n=>pick(['Barricade is down — '+n+'!','They broke through — '+n+'!','We lost the '+n+'!'])]},
 down:{t:'alert',v:[
  n=>pick([n+' is DOWN!',n+' went down — cover them!',n+' is hit bad — they need help!'])]},
 dying:{t:'alert',v:[
  ()=>pick(['I\'m hit — I need backup!','Taking heavy damage here!','This is bad — I\'m bleeding out!'])]},
 elite:{t:'alert',v:[
  n=>pick(['An ELITE — '+n+'!','Watch out — '+n+' incoming!',n+' has arrived!'])]},
 boss:{t:'alert',v:[
  n=>pick([n+' HAS RISEN — brace yourselves!','It\'s '+n+' — hold the line!','A BOSS — '+n+'!'])]},
 heal:{t:'notice',v:[
  ()=>pick(['Applying bandage — I\'m fine.','Patch me up, good as new.','Auto-med engaged.'])]},
 buff:{t:'notice',v:[
  ()=>pick(['Quick snack — back to work.','Fuel up time.','Eating on the job — don\'t judge.'])]},
 revived:{t:'notice',v:[
  n=>pick(['Thanks, '+n+' — I owe you one.',n+' pulled me back — appreciated.','Good timing, '+n+'.'])]},
 built:{t:'notice',v:[
  n=>pick([n+' is up and solid.','Finished — '+n+' placed.','That\'s a sturdy '+n+'.'])]},
 repaired:{t:'notice',v:[
  n=>pick([n+' patched up — good as new.','Repaired '+n+' — should hold.',n+' reinforced.'])]},
 // FIX(31): deploy + rescue
 deployed:{t:'notice',v:[
  ()=>pick(['Reporting in — let\'s move.','Ready when you are.','On the field. Watch my back.'])]},
 rescued:{t:'notice',v:[
  n=>pick(['Thanks for the save, '+n+' — I\'m in.','You opened the door just in time.','Almost got dragged out there. Let\'s kill some.'])]},
 swap:{t:'notice',v:[ // FIX(33): benched otomatis oleh rescue swap
  ()=>pick(['Fine — I\'ll hold the couch down.','Bench duty. Again.','Someone\'s gotta guard the reserve.'])]}};
function chatReporter(){ // 1 karakter HIDUP acak (deployed, tidak down) — selected termasuk
 const pool=chars.filter(c=>!c.down&&!offField(c));
 return pool.length?pick(pool):null;
}
function chatPush(ev,who,arg){ // F9b.5: buat bubble — who = reporter, arg = string event
 const E=CHAT_EVENTS[ev];if(!E||!who)return;
 const b=document.createElement('div');
 b.className='chatB '+E.t;
 b.innerHTML='<div class="ch"><b>'+who.n+'</b> — '+(E.t==='alert'?'ALERT':'NOTICE')+'</div>'
  +'<div class="msg">'+E.v[0](arg)+'</div>'; // FIX: fungsi pertama = pemilih varian
 $('squadChat').appendChild(b);
 requestAnimationFrame(()=>b.classList.add('show')); // slide-in setelah attach
 squadChat.push({el:b,t:5});
 SFX(E.t==='alert'?'alert':'notice'); // FIX(29): file produksi + fallback synth
 while(squadChat.length>3)squadChatShift(); // cap 3 — paling atas dipaksa fade
}
function squadChatShift(){ // lepas bubble TERATAS (paling lama) dgn fade
 const it=squadChat.shift();
 if(!it)return;
 it.el.classList.add('fade');
 setTimeout(()=>it.el.remove(),450);
}
function updateSquadChat(dt){ // dipanggil loop §23: umur + auto-fade + reposition stack
 for(let i=squadChat.length-1;i>=0;i--){
  const it=squadChat[i];
  it.t-=dt;
  if(it.t<=0){
   it.el.classList.add('fade');
   setTimeout(()=>it.el.remove(),450);
   squadChat.splice(i,1);
  }
 }
 for(let i=0;i<squadChat.length;i++){ // stack: paling baru = bawah (index tinggi)
  const it=squadChat[i];
  it.el.style.top=(squadChat.length-1-i)*-64+'px'; // bergeser ke atas tiap ada baru
 }
}
function chatClear(){ // resetGame / loadGame / defeat
 for(const it of squadChat)it.el.remove();
 squadChat.length=0;
}
// arah barricade dari koordinat (utk varian 'barricade')
function chatDir(x,y){
 const mx=20,my=16; // pusat mansion
 if(Math.abs(x-mx)>Math.abs(y-my))return x<mx?'WEST SIDE':'EAST SIDE';
 return y<my?'NORTH SIDE':'SOUTH SIDE';
}
// ---- F7d: TRANSFER ANTAR KARAKTER §13 + SAVE (Pause, hanya Prep) ----
const SAVE_KEY='musterpointz_save_v1';
ensure('sharePanel','position:fixed;inset:0;display:none;align-items:center;justify-content:center;'
 +'background:rgba(5,4,3,.6);z-index:25;pointer-events:auto',
 '<div class="f3p" style="width:420px"><div class="f3h"><h2 id="shareTitle">INVENTORY SHARING</h2>'
 +'<button class="f3x" id="shareX">×</button></div>'
 +'<div id="shareBody"></div>'
 +'<div class="f3f">Klik item untuk transfer ke seberang · stack & kapasitas berlaku · armor bawa durability</div></div>');
let shareA=null,shareB=null; // kiri = pengirim (char terseleksi) · kanan = ally
function openShare(a,b){ // §13: klik kanan ally hidup ≤1 blok — kapan pun
 closeAllPanels();
 shareA=a;shareB=b;
 S.ui='share';
 $('sharePanel').style.display='flex';
 renderShare();
 SFX('invOpen');
}
function renderShare(){
 const el=$('shareBody');if(!el||!shareA||!shareB)return;
 $('shareTitle').textContent='SHARING — '+shareA.n+' ⇄ '+shareB.n;
 el.innerHTML=
  '<div class="cath">'+shareA.n+' — 12 SLOTS</div><div class="shGrid">'
  +slots12(shareA,'shAClick','shARC')
  +'</div><div class="cath">'+shareB.n+' — 12 SLOTS</div><div class="shGrid">'
  +slots12(shareB,'shBClick','shBRC')
  +'</div>';
}
function slots12(ch,fn,fnR){ // F7d(2): + klik kanan split (fnR)
 let h='';
 for(let i=0;i<12;i++){
  const s=ch.inv[i];
  h+='<div class="islot" onclick="'+fn+'('+i+')"'
   +(fnR?' oncontextmenu="'+fnR+'('+i+',event)"':'')
   +' title="'+(s?ITEMS[s.id].n+' ×'+s.q:'Empty')+'">'
   +(s?icHtml(ITEMS[s.id].ic,ITEMS[s.id].c)
   +'<div class="nm">'+ITEMS[s.id].n+'</div>'
   +'<div class="qty">'+s.q+'</div>':'')+'</div>';
 }
 return h;
}
function shAClick(i){shareMove(shareA,shareB,i,1e9);} // kiri = SEMUA
function shBClick(i){shareMove(shareB,shareA,i,1e9);}
function shARC(i,e){ // F7d(2): klik kanan → split slider
 const s=shareA&&shareA.inv[i];if(!s)return;
 if(s.q<=1){shareMove(shareA,shareB,i,1);return;}
 showSplitPop(e.currentTarget,'shA',i);
}
function shBRC(i,e){
 const s=shareB&&shareB.inv[i];if(!s)return;
 if(s.q<=1){shareMove(shareB,shareA,i,1);return;}
 showSplitPop(e.currentTarget,'shB',i);
}
// F7d(2): shareMove = shareClick sadar kuantitas (n unit; 1e9 = semua)
function shareMove(from,to,i,n){
 if(!from||!to)return;
 const s=from.inv[i];if(!s)return;
 if(s.dur!==undefined){ // armor — butuh slot kosong di tujuan
  let idx=-1;
  for(let j=0;j<12;j++)if(!to.inv[j]){idx=j;break;}
  if(idx<0){toast(to.n+"'s inventory is full",'bad');return;}
  to.inv[idx]={id:s.id,q:1,dur:s.dur,max:s.max, // F10.10.2: propagate quality+sdef
   quality:s.quality||null,sdef:s.sdef||null};
  from.inv[i]=null;
 }else{
  const mx=ITEMS[s.id].stack;
  n=Math.min(n,s.q);
  let q=n,moved=0;
  for(const t of to.inv){
   if(q<=0)break;
   if(t&&t.id===s.id&&t.q<mx){
    const space=Math.min(mx-t.q,q);t.q+=space;q-=space;moved+=space;}
  }
  if(q>0){
   let idx=-1;
   for(let j=0;j<12;j++)if(!to.inv[j]){idx=j;break;}
   if(idx>=0){to.inv[idx]={id:s.id,q:q};moved+=q;q=0;}
  }
  s.q-=moved;
  if(s.q<=0)from.inv[i]=null;
  if(moved<n)toast(to.n+"'s inventory is full — moved "+moved,'bad');
 }
 SFX('click');
 renderShare();
}
// ---- SAVE: manual via Pause — HANYA Preparation Phase (keputusan F7d) ----
function saveGame(){
 if(night.phase!=='prep'){toast('Saving only during Preparation Phase','bad');return false;}
 try{
  const data={
   v:1,night:night.n,phase:night.phase,respect:S.respect, // FIX(37): save dibuat saat prep — load paksa prep apapun isinya
   owned:S.owned, // F8a: kepemilikan roster
   sessionTime:Math.floor(S.time), // P3(2): jam sesi (opsional, §23.10)
   totalKills:S.totalKills,zKills:S.zKills,stoveUses:S.stoveUses,
   // P2: counter statistik sesi — ikut save agar load melanjutkan sesi yang sama
   respectEarned:S.respectEarned,nightsSurvived:S.nightsSurvived,totalDamage:S.totalDamage,
   killsPerChar:S.killsPerChar,dmgPerChar:S.dmgPerChar,deploysPerChar:S.deploysPerChar,
   downsCount:S.downsCount,revivesDone:S.revivesDone,
   buildsDone:S.buildsDone,repairsDone:S.repairsDone,craftsDone:S.craftsDone,rescuesDone:S.rescuesDone,
   healUses:S.healUses,buffUses:S.buffUses,resourcesCollected:S.resourcesCollected,
   deployOrder:S.deployOrder.slice(),
   chars:chars.map(ch=>({id:ch.id,lvl:ch.lvl,xp:Math.floor(ch.xp),sp:ch.sp,
    hp:Math.round(ch.hp),energy:Math.floor(ch.energy),inv:ch.inv,armor:ch.armor,slots:ch.slots,
    autoHeal:ch.autoHeal,autoBuff:ch.autoBuff,
    deployed:ch.deployed,recovering:ch.recovering,
    relN:ch._relN||0,
    spAlloc:ch.spAlloc||{hp:0,atk:0,def:0,agi:0,spd:0},
    tree:ch.tree||{rec:0,off:0,def:0,pas:0}, // F10.2
    journal:ch.journal||null, // F10.4
    jc:ch.jc||emptyJc()})),   // F10.4
   barr:[...barricades.values()].map(b=>({id:b.id,x:b.x,y:b.y,hp:Math.round(b.hp)})),
   traps:[...traps.values()].map(t=>({id:t.id,x:t.x,y:t.y,
    owner:t.owner?t.owner.id:null,used:t.used,
    hp:t.hp||0,max:t.max||0})), // FIX(41): durability trap tersimpan
   walls:[...walls.values()].map(w=>({x:w.x,y:w.y,
    broken:holes.has(w.x+','+w.y),hp:Math.round(w.hp)})),
   lant:[...lanterns.keys()],
   boxs:[...storageBoxes.values()].map(b=>({x:b.x,y:b.y,slots:b.slots})),
   gItems:S.gItems.map(it=>({id:it.id,q:it.q,
    x:+it.x.toFixed(2),z:+it.z.toFixed(2)}))
  };
  localStorage.setItem(SAVE_KEY,JSON.stringify(data));
  toast('GAME SAVED — Night '+night.n+' · '+new Date().toLocaleTimeString(),'good');
  SFX('built');
  return true;
 }catch(e){
  toast('Save failed: '+(e.message||e),'bad');
  return false;
 }
}
function loadGame(){ // F7d: muat → resume di Preparation Phase night tersimpan
 let data=null;
 try{data=JSON.parse(localStorage.getItem(SAVE_KEY));}catch(e){}
 if(!data||data.v!==1){toast('Save not found / corrupt','bad');return false;}
 resetGame(true); // FIX(48) P7: silent — loadGame punya alur render sendiri (tanpa banner RETRY)
 // ===== global & night =====
 night.n=Math.max(1,data.night|0);
 night.phase='prep';night.t=CFG.prepTime; // FIX(37): load SELALU prep — meski save (aneh) berasal dari fase lain
 planEscalation();
 setLightPhase('prep');
 S.respect=data.respect|0;
 S.owned=data.owned||{diaz:true,bambang:true}; // F8a: kepemilikan
 S.totalKills=data.totalKills|0;
 S.zKills=data.zKills||{};
 S.stoveUses=data.stoveUses||0;
 S.time=data.sessionTime||0; // P3(2): pulihkan jam sesi (default 0 kalau save lama)
 // P2: counter statistik sesi — pulihkan dari save (bila ada; save lama → default)
 S.respectEarned=data.respectEarned|0;
 S.nightsSurvived=data.nightsSurvived|0;
 S.totalDamage=data.totalDamage|0;
 S.killsPerChar=data.killsPerChar||{};
 S.dmgPerChar=data.dmgPerChar||{};
 S.deploysPerChar=data.deploysPerChar||{};
 S.downsCount=data.downsCount|0;
 S.revivesDone=data.revivesDone|0;
 S.buildsDone=data.buildsDone|0;
 S.repairsDone=data.repairsDone|0;
 S.craftsDone=data.craftsDone|0;
 S.rescuesDone=data.rescuesDone|0;
 S.healUses=data.healUses||{};
 S.buffUses=data.buffUses||{};
 S.resourcesCollected=data.resourcesCollected||{};
 S.deployOrder=(data.deployOrder||chars.map(c=>c.id))
  .filter(id=>chars.some(c=>c.id===id));
 // ===== karakter =====
 for(const cd of data.chars||[]){
  let ch=chars.find(c=>c.id===cd.id);
  if(!ch&&CHARS[cd.id]){ // F8a: hero di-unlock di sesi sebelumnya → buat ulang
   ch=makeChar(cd.id,homeFor(cd.id)); // F12.5: home fixed sesuai slot ALL_IDS
   ch.mesh.visible=false;
   chars.push(ch);
   createSquadCard(ch); // F8a(2): kartu squad hero yang kembali
  }
  if(!ch)continue;
  ch.lvl=cd.lvl||1;ch.xp=cd.xp||0;ch.sp=cd.sp||0;
  ch.hp=clamp(cd.hp||CHARS[ch.id].hp,1,CHARS[ch.id].hp);
  ch.energy=clamp(cd.energy||0,0,100); // FIX(3): energy ikut dimuat
  ch.inv=Array.isArray(cd.inv)&&cd.inv.length===12?cd.inv:new Array(12).fill(null);
  ch.armor=cd.armor||null;
  ch.slots=cd.slots||{rec:null,buff:null};
  ch.autoHeal=!!cd.autoHeal;ch.autoBuff=!!cd.autoBuff;
  ch._relN=cd.relN||0; // P7: pulihkan counter reload Sobel
  ch.spAlloc=cd.spAlloc||{hp:0,atk:0,def:0,agi:0,spd:0}; // F10.1: alokasi SP
  ch.tree=cd.tree||{rec:0,off:0,def:0,pas:0}; // F10.2: upgrade tree
  ch.journal=cd.journal||null; // F10.4
  ch.jc=cd.jc||emptyJc();      // F10.4
  ch.recovering=!!cd.recovering;
  ch.deployed=cd.deployed!==false&&!ch.recovering;
  ch.mesh.visible=ch.deployed;
 }
 // FIX(37): jaring penganan load — save lama (pre-FIX 33/35) bisa berisi over-cap.
 // Enforce LIFO pra-menu: load SELALU masuk prep dgn susunan legal, pemain
 // punya 5 menit untuk menyesuaikan.
 enforceDeployCap();
 selChar=chars.find(c=>c.deployed)||null;
 for(const c of chars)c.selected=(c===selChar);
 layoutSquadCards();
 // ===== struktur (barikade → jebakan → tembok → lantern → box → item) =====
 for(const bk of[...barricades.values()]){scene.remove(bk.mesh);removeOverhead(bk);}
 barricades.clear();
 for(const b of data.barr||[]){
  if(!BUILDS[b.id]||!inBounds(b.x,b.y))continue;
  const bk=addBarricade(b.x,b.y,b.id);
  bk.hp=clamp(b.hp,1,BUILDS[b.id].hp);
 }
 for(const t of data.traps||[]){
  if(!BUILDS[t.id]||!validFloorCell(t.x,t.y))continue;
  const tr=addTrap(t.id,t.x,t.y,
   t.owner?chars.find(c=>c.id===t.owner):null);
  if(tr&&t.used)tr.used=true;
  if(tr&&t.max&&t.hp!==undefined)tr.hp=clamp(t.hp,0,t.max); // FIX(41)
 }
 for(const w of data.walls||[]){
  if(!inBounds(w.x,w.y))continue;
  const ww=getWall(w.x,w.y);
  ww.hp=clamp(w.hp,0,CFG.wallHP);
  if(w.broken){
   GRID[w.y][w.x]='o';
   if(ww.mesh)scene.remove(ww.mesh);
   ww.mesh=null;
   ww.holeMesh=makeHoleMesh();
   ww.holeMesh.position.set(w.x+.5,0,w.y+.5);
   scene.add(ww.holeMesh);
   holes.set(w.x+','+w.y,ww);
  }else if(ww.hp<CFG.wallHP){ // pernah direpair — tampilan abu-abu
   if(ww.mesh&&ww.mesh!==ww.origMesh)scene.remove(ww.mesh);
   ww.mesh=makeRepairedWallMesh();
   ww.mesh.position.set(w.x+.5,0,w.y+.5);
   scene.add(ww.mesh);
  }
 }
 for(const k of data.lant||[]){
  const[x,y]=String(k).split(',').map(Number);
  if(validFloorCell(x,y))placeObject('lantern',x,y);
 }
 for(const b of data.boxs||[]){
  if(!inBounds(b.x,b.y))continue;
  placeObject('storagebox',b.x,b.y);
  const sb=storageBoxes.get(b.x+','+b.y);
  if(sb&&Array.isArray(b.slots))sb.slots=b.slots;
 }
 for(const it of data.gItems||[]){spawnGItem(it.id,it.q,it.x,it.z);}
 S.state='playing';
 showEl('defeat',false);
 banner('SAVE LOADED','NIGHT '+night.n+' — PREPARATION PHASE');
 toast('Save loaded — Night '+night.n+' — PREPARATION PHASE (5:00) · deploy '+deployUsed()+' / '+deployCap(),'good');
 SFX('prepStart');
 bgmSync();
 return true;
}
{const b=$('shareX');if(b)b.onclick=closeAllPanels;}
// ===== F12.2: OPTIONS PANEL — 3-slider audio (SFX/BGM/UI) =====
// Buka via keybind O atau tombol OPTIONS di pause overlay. z-index 31 → di atas
// pause (29), agar bisa dibuka tanpa menutup pause. Perubahan langsung diterapkan
// + disimpan ke localStorage['mpz_options_v1'].
// F12.4f: z-index 31→42 — supaya panel muncul DI ATAS menuOverlay (z:40).
// Kalau di bawah, panel terbuka tapi tertutup overlay menu → user lihat
// tombol bereaksi tapi panel tidak muncul. 42 = konsisten dgn keybindPanel.
ensure('optionsPanel','position:fixed;inset:0;display:none;align-items:center;justify-content:center;'
 +'background:rgba(5,4,3,.6);z-index:42;pointer-events:auto',
 '<div class="f3p" style="width:460px">'
 +'<div class="f3h"><h2>OPTIONS — AUDIO</h2>'
 +'<button class="f3x" id="optionsX">×</button></div>'
 +'<div style="padding:4px 18px 14px">'
 +'<div class="optRow"><label>SFX</label>'
 +'<input type="range" id="optSfx" min="0" max="100" step="1">'
 +'<span class="val" id="optSfxVal">80%</span></div>'
 +'<div class="optRow"><label>BGM</label>'
 +'<input type="range" id="optBgm" min="0" max="100" step="1">'
 +'<span class="val" id="optBgmVal">40%</span></div>'
 +'<div class="optRow"><label>UI</label>'
 +'<input type="range" id="optUi" min="0" max="100" step="1">'
 +'<span class="val" id="optUiVal">50%</span></div>'
 +'</div>'
 +'<div class="f3f">Perubahan langsung tersimpan · M: mute/unmute global · ESC: tutup</div>'
 +'</div>');
function updateOptionsLabels(){
 const pct=v=>Math.round(v*100)+'%';
 setTxt('optSfxVal',pct(AUD.vol.sfx));
 setTxt('optBgmVal',pct(AUD.vol.bgm));
 setTxt('optUiVal',pct(AUD.vol.ui));
}
function renderOptions(){
 const set=(id,v)=>{const el=$(id);if(el)el.value=Math.round(v*100);};
 set('optSfx',AUD.vol.sfx);set('optBgm',AUD.vol.bgm);set('optUi',AUD.vol.ui);
 updateOptionsLabels();
}
function openOptions(){
 closeAllPanels();
 S.ui='options';
 renderOptions();
 $('optionsPanel').style.display='flex';
 SFX('invOpen');
}
function toggleOptions(){
 if(S.ui==='options'){closeAllPanels();return;}
 openOptions();
}
{ // slider handlers — pasang sekali (panel tidak rebuild)
 // F12.2b: tick SFX saat slider di-release dihapus — bikin bising, tidak penting.
 const w=(id,key)=>{
  const el=$(id);if(!el)return;
  el.addEventListener('input',()=>{
   AUD.vol[key]=clamp(+el.value/100,0,1);
   applyAudioVol();
   updateOptionsLabels();
   saveAudioPrefs();
  });
 };
 w('optSfx','sfx');w('optBgm','bgm');w('optUi','ui');
}
{const b=$('optionsX');if(b)b.onclick=closeAllPanels;}
// F7d + P9: tombol SAVE (grey-out di luar Preparation) & RESTART (merah) di overlay pause.
// pointer-events:auto WAJIB — #pause dibuat dgn pointer-events:none (inherited ke children),
// tanpa ini tombol tidak bisa diklik sama sekali.
{ const p=$('pause');
 if(p&&!$('btnSave')){
  const b=document.createElement('button');
  b.id='btnSave';b.className='dbtn';
  b.style.cssText='margin-top:18px;min-width:180px;pointer-events:auto';
  b.textContent='SAVE GAME';
  b.onclick=()=>saveGame();
  p.appendChild(b);
 }
 if(p&&!$('btnOptions')){ // F12.2: tombol OPTIONS (panel z:31 > pause z:29, aman)
  const ob=document.createElement('button');
  ob.id='btnOptions';ob.className='dbtn';
  ob.style.cssText='margin-top:10px;min-width:180px;pointer-events:auto';
  ob.textContent='OPTIONS';
  ob.onclick=()=>toggleOptions();
  p.appendChild(ob);
 }
 if(p&&!$('btnMainMenu')){ // F12.7: kembali ke menu utama — konfirmasi dulu
  const mb=document.createElement('button');
  mb.id='btnMainMenu';mb.className='dbtn red';
  mb.style.cssText='margin-top:10px;min-width:180px;pointer-events:auto';
  mb.textContent='MAIN MENU';
  mb.onclick=()=>showMainMenuConfirm();
  p.appendChild(mb);
 }
 if(p&&!$('btnRestart')){
  const rb=document.createElement('button');
  rb.id='btnRestart';rb.className='dbtn red';
  rb.style.cssText='margin-top:10px;min-width:180px;pointer-events:auto';
  rb.textContent='RESTART';
  rb.onclick=()=>showRestartConfirm();
  p.appendChild(rb);
 }
 if(p&&!$('pauseFoot')){
  const s=document.createElement('p');
  s.id='pauseFoot';
  s.style.cssText='font:10px monospace;color:#5c5340;margin:10px 0 0';
  s.textContent='Saving available only during Preparation Phase';
  p.appendChild(s);
 }
}
// P9: sinkronkan disabled-state tombol Save dgn fase malam (dipanggil tiap pause dibuka)
function refreshPauseButtons(){
 const bs=$('btnSave');
 if(bs)bs.disabled=night.phase!=='prep';
}
// P9: dialog konfirmasi Restart — reuse .f3p/.dbtn.red pattern
// F10.3: session statistics recap — dipanggil dari End the Night & defeat
function showSessionStats(title,sub,keepRespect){
 const d=ensure('sessionStats','position:fixed;inset:0;z-index:34;display:none;'
  +'align-items:center;justify-content:center;background:rgba(5,4,3,.85);pointer-events:auto');
 setTxt('stTitle',title||'EXPEDITION SUMMARY');
 setTxt('stSub',sub||'');
 // ===== Hitung agregat dari counter P2 =====
 const NORMAL=['Walker','Runner','Crawler','Biter','Shambler','Screecher'];
 const ELITE =['Bloater','Creeper','Sprinter'];
 const BOSS  =['PZero','ZAlpha'];
 const sumBy=list=>list.reduce((s,k)=>s+(S.zKills[k]||0),0);
 const sumObj=o=>Object.values(o||{}).reduce((s,v)=>s+v,0);
 const totalRespect=S.respectEarned||0;
 const totalDmg=S.totalDamage||0;
 const healCount=sumObj(S.healUses);
 const buffCount=sumObj(S.buffUses);
 const resCount=sumObj(S.resourcesCollected);
 // ===== Rows (§23.10) =====
 const rows=[
  ['Night Reached',       fmtNum(S.nightsSurvived||0), true],
  ['Total Respect Gained',fmtNum(totalRespect), true],
  ['Total Damage Dealt',  fmtNum(totalDmg)],
  ['Normal Zombies',      fmtNum(sumBy(NORMAL))],
  ['Elite Zombies',       fmtNum(sumBy(ELITE))],
  ['Boss Zombies',        fmtNum(sumBy(BOSS))],
  ['Down / Revived',      fmtNum(S.downsCount||0)+' / '+fmtNum(S.revivesDone||0)],
  ['Healing Items Used',  fmtNum(healCount)],
  ['Buff Items Used',     fmtNum(buffCount)],
  ['Items Crafted',       fmtNum(S.craftsDone||0)],
  ['Fortifications Built / Repaired', fmtNum(S.buildsDone||0)+' / '+fmtNum(S.repairsDone||0)],
  ['Resources Scavenged', fmtNum(resCount)],
  ['Survivors Rescued',   fmtNum(S.rescuesDone||0)],
  ['Total Game Time',     clockFmt(S.time||0)]
 ];
 let h='';
 for(const[r,v,hi]of rows){
  h+='<div class="stRow'+(hi?' hi':'')+'">'
   +'<span class="lbl">'+r+'</span><span class="val">'+v+'</span></div>';
 }
 $('stGridBody').innerHTML=h;
 // ===== MVP cards (Most Deployed · Damage Dealer · Zombie Slayer) =====
 const pickTop=(obj,valFmt)=>{
  const e=Object.entries(obj||{}).sort((a,b)=>b[1]-a[1])[0];
  if(!e||!e[1])return null;
  const ch=chars.find(c=>c.id===e[0]);
  return ch?{n:ch.n,v:e[1]}:null;
 };
 const mvpDeploy=pickTop(S.deploysPerChar);
 const mvpDmg=pickTop(S.dmgPerChar);
 const mvpKill=pickTop(S.killsPerChar);
 const mvp=(tag,data,fmt)=>{
  if(!data)return '<div class="mvpCard"><div class="mvpTag">'+tag+'</div>'
   +'<div class="mvpEmpty">— no data —</div></div>';
  return '<div class="mvpCard">'
   +'<div class="mvpTag">'+tag+'</div>'
   +'<div class="mvpName">'+data.n+'</div>'
   +'<div class="mvpVal">'+fmt(data.v)+'</div></div>';
 };
 $('stMvp').innerHTML=
  mvp('MOST DEPLOYED',mvpDeploy,v=>fmtNum(v)+' night'+(v>1?'s':''))
  +mvp('MVP · DAMAGE DEALER',mvpDmg,v=>fmtNum(v)+' dmg')
  +mvp('MVP · ZOMBIE SLAYER',mvpKill,v=>fmtNum(v)+' kills');
 // ===== Tombol Try Again =====
 $('btnTryAgain').onclick=()=>{
  d.style.display='none';
  S.paused=false;showEl('pause',false);
  // F10.3: End the Night mempertahankan respect (no rollback); defeat rollback (FIX 32)
  if(keepRespect)S._bankedRespect=S.respect;
  resetGame(false);
 };
 $('btnBackToMenu').onclick=()=>{ // F12.7: ke menu utama, tanpa reset paksa
  d.style.display='none';
  S.paused=false;showEl('pause',false);
  if(keepRespect)S._bankedRespect=S.respect; // hormati End the Night keep-respect
  returnToMainMenu();
 };
 d.style.display='flex';
}
// F10.3: dialog konfirmasi End the Night (hanya prep phase)
function confirmEndNight(){
 const d=ensure('endNightConfirm','position:fixed;inset:0;z-index:35;display:none;'
  +'align-items:center;justify-content:center;background:rgba(5,4,3,.78);pointer-events:auto');
 d.innerHTML=
  '<div class="f3p" style="width:520px;text-align:center;padding:24px">'
  +'<h2 style="font:24px Staatliches,sans-serif;color:#d9a13b;letter-spacing:.14em">'
  +'END THE EXPEDITION?</h2>'
  +'<p style="font:12px monospace;color:#cfc4a6;margin:14px 0 6px;line-height:1.7">'
  +'You will see a full summary of this run, then return to <b style="color:#d9a13b">NIGHT 1</b>.</p>'
  +'<p style="font:11px monospace;color:#8f8264;margin:0 0 20px;line-height:1.7">'
  +'Kept: level · XP · SP · unlocked roster · <b style="color:#7fa35b">all Respect</b>.<br>'
  +'Lost: current night will not begin — you cash out here.</p>'
  +'<div style="display:flex;gap:12px;justify-content:center">'
  +'<button id="endNo" class="dbtn" style="min-width:150px">CANCEL</button>'
  +'<button id="endYes" class="dbtn red" style="min-width:150px">END RUN</button>'
  +'</div></div>';
 d.style.display='flex';
 $('endNo').onclick=()=>{d.style.display='none';SFX('click');};
 $('endYes').onclick=()=>{
  d.style.display='none';SFX('click');
  if(S.ui)closeAllPanels();
  S.paused=true;                 // bekukan game di belakang layar recap
  showSessionStats('EXPEDITION ENDED',
   'You survived '+S.nightsSurvived+' night'+(S.nightsSurvived===1?'':'s')
   +' · cashed out at Night '+(night.n),
   true);                        // keepRespect=true
 };
}
$('endNightBtn').onclick=confirmEndNight;
// F12.7: dialog kembali ke main menu dari pause overlay.
// SAVE & EXIT hanya muncul saat prep phase (saveGame() hanya legal saat prep).
function showMainMenuConfirm(){
 const canSave=night.phase==='prep';
 const d=ensure('mainMenuConfirm','position:fixed;inset:0;z-index:37;display:none;'
  +'align-items:center;justify-content:center;background:rgba(5,4,3,.78);pointer-events:auto');
 d.innerHTML=
  '<div class="f3p" style="width:520px;text-align:center;padding:24px">'
  +'<h2 style="font:22px Staatliches,sans-serif;color:#c0453a;letter-spacing:.14em">'
  +'RETURN TO MAIN MENU?</h2>'
  +'<p style="font:12px monospace;color:#cfc4a6;margin:14px 0 6px;line-height:1.7">'
  +'Current expedition will be discarded.</p>'
  +(canSave
   ?'<p style="font:10px monospace;color:#8f8264;margin:0 0 18px;line-height:1.7">'
    +'Save first if you want to keep your progress.</p>'
   :'<p style="font:10px monospace;color:#8f8264;margin:0 0 18px;line-height:1.7">'
    +'Saving is only available during Preparation Phase.<br>'
    +'Current night\'s progress will be lost.</p>')
  +'<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'
  +'<button id="mmNo" class="dbtn" style="min-width:130px">CANCEL</button>'
  +(canSave?'<button id="mmSave" class="dbtn" style="min-width:130px">SAVE &amp; EXIT</button>':'')
  +'<button id="mmYes" class="dbtn red" style="min-width:130px">EXIT</button>'
  +'</div></div>';
 d.style.display='flex';
 $('mmNo').onclick=()=>{d.style.display='none';SFX('click');};
 $('mmYes').onclick=()=>{
  d.style.display='none';SFX('click');
  if(S.ui)closeAllPanels();
  returnToMainMenu();
 };
 if(canSave)$('mmSave').onclick=()=>{
  if(!saveGame())return; // guard internal — jangan exit kalau save gagal
  d.style.display='none';SFX('click');
  if(S.ui)closeAllPanels();
  returnToMainMenu();
 };
}
function showRestartConfirm(){
 const d=ensure('restartConfirm','position:fixed;inset:0;z-index:35;display:none;'
  +'align-items:center;justify-content:center;background:rgba(5,4,3,.78);pointer-events:auto');
 d.innerHTML=
  '<div class="f3p" style="width:380px;text-align:center;padding:22px">'
  +'<h2 style="font:22px Staatliches,sans-serif;color:#c0453a;letter-spacing:.12em">RESTART RUN?</h2>'
  +'<p style="font:11px monospace;color:#cfc4a6;margin:14px 0 6px;line-height:1.7">'
  +'End this run and return to <b style="color:#d9a13b">NIGHT 1</b>.</p>'
  +'<p style="font:10px monospace;color:#8f8264;margin:0 0 18px;line-height:1.7">'
  +'Kept: level · XP · SP · unlocked roster.<br>'
  +'Lost: this night\'s progress · rewards · Respect earned since this night began.</p>'
  +'<div style="display:flex;gap:10px;justify-content:center">'
  +'<button id="btnRestartNo" class="dbtn" style="min-width:130px">CANCEL</button>'
  +'<button id="btnRestartYes" class="dbtn red" style="min-width:130px">RESTART</button>'
  +'</div></div>';
 d.style.display='flex';
 $('btnRestartNo').onclick=()=>{d.style.display='none';SFX('click');};
 $('btnRestartYes').onclick=()=>{
  d.style.display='none';SFX('click');
  S.paused=false;showEl('pause',false); // lepas freeze sebelum resetGame
  resetGame(false); // P9: banner RETRY tampil + Respect di-roll-back (perilaku = retry pasca-defeat)
 };
}
// ---- F7d(2): SPLIT SLIDER — klik kanan item saat discard/drop/share/storage ----
// Mini window di bawah slot: slider 1..qty + tombol ✕ / ✓ (ikon saja).
// Stack qty 1 → langsung eksekusi tanpa popup. TIDAK untuk special slot.
let splitCtx=null;
function splitQty(mode,idx){
 if(mode==='st')return curStore&&curStore.slots[idx]?curStore.slots[idx].q:0;
 if(mode==='stInv'){const s=panelChar().inv[idx];return s?s.q:0;}
 if(mode==='shA'){const s=shareA&&shareA.inv[idx];return s?s.q:0;}
 if(mode==='shB'){const s=shareB&&shareB.inv[idx];return s?s.q:0;}
 const s=panelChar().inv[idx];return s?s.q:0; // discard/drop
}
function showSplitPop(slot,mode,idx){
 closeSplitPop();
 const qty=splitQty(mode,idx);
 if(!qty)return;
 splitCtx={mode,idx};
 const p=ensure('splitPop','position:fixed;z-index:40;width:150px;'
  +'background:#14110d;border:1px solid #7a6a2c;box-shadow:0 6px 18px #000;'
  +'padding:8px;display:none;pointer-events:auto');
 p.innerHTML= // FIX(9b): dipasang SETIAP panggilan — max/value slider ikut stack AKTIF
  '<div style="display:flex;align-items:center;gap:6px">'
  +'<input id="spRange" type="range" min="1" max="'+qty+'" value="'+qty+'"'
  +' style="flex:1;accent-color:#d9a13b">'
  +'<b id="spVal" style="font:11px monospace;color:#e7dcc3;min-width:22px;'
  +'text-align:right">'+qty+'</b></div>'
  +'<div style="display:flex;gap:6px;justify-content:flex-end;margin-top:6px">'
  +'<button id="spX" title="Cancel" style="width:26px;height:26px;background:#241412;'
  +'border:1px solid #7a3a34;color:#e07a70;font:13px monospace;cursor:pointer">✕</button>'
  +'<button id="spOk" title="Confirm" style="width:26px;height:26px;background:#1a2412;'
  +'border:1px solid #4a6a2c;color:#9ad970;font:13px monospace;cursor:pointer">✓</button></div>';
 const r=slot.getBoundingClientRect();
 p.style.left=Math.min(r.left,innerWidth-160)+'px';
 p.style.top=(r.bottom+4)+'px';
 p.style.display='block';
 const rng=$('spRange');
 rng.oninput=()=>{setTxt('spVal',rng.value);};
 $('spX').onclick=closeSplitPop;
 $('spOk').onclick=()=>splitExec(+rng.value);
 SFX('invOpen');
}
function closeSplitPop(){
 const p=$('splitPop');
 if(p)p.style.display='none';
 splitCtx=null;
}
function splitExec(n){
 if(!splitCtx)return;
 const{mode,idx}=splitCtx;
 closeSplitPop();
 if(mode==='discard'||mode==='drop')invSplitGo(idx,n);
 else if(mode==='shA')shareMove(shareA,shareB,idx,n);
 else if(mode==='shB')shareMove(shareB,shareA,idx,n);
 else if(mode==='st')stSplit(idx,n);
 else if(mode==='stInv')stInvSplit(idx,n);
}
function invSlotRC(e,i,slotEl){ // HANYA saat mode discard/drop aktif
 if(S.invMode!=='discard'&&S.invMode!=='drop')return;
 const s=panelChar().inv[i];if(!s)return;
 if(s.q<=1){invSplitGo(i,1);return;}
 showSplitPop(slotEl||e.currentTarget,S.invMode,i); // F12.13-perf: slotEl dari delegation
}
function invSplitGo(i,n){ // eksekusi discard/drop sebagian
 const ch=panelChar();
 const s=ch.inv[i];if(!s)return;
 n=Math.min(n,s.q);
 if(S.invMode==='discard'){
  s.q-=n;
  if(s.q<=0)ch.inv[i]=null;
  renderInv();
  toast('Discarded '+n+' '+ITEMS[s.id].n,'bad');
 }else if(S.invMode==='drop'){
  if(S.gItems.length>=60){toast('Ground full — cannot drop','bad');return;}
  s.q-=n;
  if(s.q<=0)ch.inv[i]=null;
  spawnGItem(s.id,n,ch.x+rnd(-.6,.6),ch.z+rnd(-.6,.6),S.now+5);
  renderInv();
  toast('Dropped '+n+' '+ITEMS[s.id].n,'good');
 }
}
function stRC(i,e){ // storage → inventory, split
 const s=curStore&&curStore.slots[i];if(!s)return;
 if(s.q<=1){stSplit(i,1);return;}
 showSplitPop(e.currentTarget,'st',i);
}
function stInvRC(i,e){ // inventory → storage, split
 const s=panelChar().inv[i];if(!s)return;
 if(s.q<=1){stInvSplit(i,1);return;}
 showSplitPop(e.currentTarget,'stInv',i);
}
function stSplit(i,n){ // storage → inventory (n unit; pola stClick)
 const ch=panelChar();
 if(!curStore||!ch)return;
 const s=curStore.slots[i];if(!s)return;
 if(s.dur!==undefined){ // armor
  let idx=-1;
  for(let j=0;j<12;j++)if(!ch.inv[j]){idx=j;break;}
  if(idx<0){toast('Inventory full','bad');return;}
  ch.inv[idx]={id:s.id,q:1,dur:s.dur,max:s.max,quality:s.quality||null,sdef:s.sdef||null};
  curStore.slots[i]=null;
 }else{
  const mx=ITEMS[s.id].stack;
  n=Math.min(n,s.q);
  let q=n,moved=0;
  for(const t of ch.inv){
   if(q<=0)break;
   if(t&&t.id===s.id&&t.q<mx){
    const space=Math.min(mx-t.q,q);t.q+=space;q-=space;moved+=space;}
  }
  if(q>0){
   let idx=-1;
   for(let j=0;j<12;j++)if(!ch.inv[j]){idx=j;break;}
   if(idx>=0){ch.inv[idx]={id:s.id,q:q};moved+=q;q=0;}
  }
  s.q-=moved;
  if(s.q<=0)curStore.slots[i]=null;
  if(moved<n)toast('Inventory full — moved '+moved,'bad');
 }
 SFX('click');
 renderStore(curStore);
}
function stInvSplit(i,n){ // inventory → storage (n unit; pola stInvClick)
 const ch=panelChar();
 if(!curStore||!ch)return;
 const s=ch.inv[i];if(!s)return;
 if(s.dur!==undefined){ // armor
  let idx=-1;
  for(let j=0;j<20;j++)if(!curStore.slots[j]){idx=j;break;}
  if(idx<0){toast('Storage full','bad');return;}
  curStore.slots[idx]={id:s.id,q:1,dur:s.dur,max:s.max,quality:s.quality||null,sdef:s.sdef||null};
  ch.inv[i]=null;
 }else{
  const mx=ITEMS[s.id].stack;
  n=Math.min(n,s.q);
  let q=n,moved=0;
  for(const t of curStore.slots){
   if(q<=0)break;
   if(t&&t.id===s.id&&t.q<mx){
    const space=Math.min(mx-t.q,q);t.q+=space;q-=space;moved+=space;}
  }
  if(q>0){
   let idx=-1;
   for(let j=0;j<20;j++)if(!curStore.slots[j]){idx=j;break;}
   if(idx>=0){curStore.slots[idx]={id:s.id,q:q};moved+=q;q=0;}
  }
  s.q-=moved;
  if(s.q<=0)ch.inv[i]=null;
  if(moved<n)toast('Storage full — moved '+moved,'bad');
 }
 SFX('click');
 renderStore(curStore);
}
document.addEventListener('pointerdown',e=>{ // klik di luar popup → tutup
 const p=$('splitPop');
 if(!p||p.style.display!=='block')return;
 if(p.contains(e.target))return;
 closeSplitPop();
},true);
{const r=$('deployBody');if(r)r.addEventListener('click',e=>{
 const b=e.target.closest('.dbtn');if(!b||b.disabled)return;
 if(b.dataset.dw)deployToggle(b.dataset.dw);
 else if(b.dataset.dp)deployToggle(b.dataset.dp);
 else if(b.dataset.un)unlockChar(b.dataset.un); // F8a(2): toko Respect
});}
{const b=$('deployX');if(b)b.onclick=closeAllPanels;}
function closeAllPanels(){
 if(S.ui==='inv')SFX('invClose');
 if(S.ui==='build')SFX('buildClose');
 if(S.ui==='craft')SFX('buildClose');
 if(S.ui==='store'){curStore=null;SFX('boxClose');}
 S.workbench=null; // F10.10.2: workbench off saat panel apapun tutup
 if(S.ui==='deploy')SFX('buildClose'); // F7c
 if(S.ui==='share'){shareA=null;shareB=null;SFX('invClose');} // F7d
 if(S.ui==='char')SFX('invClose'); // F10.1
 if(S.ui==='options')SFX('invClose'); // F12.2
 S.ui=null;
 S.invMode=null;S.invSel=null;
 invDragAbort();
 closeSplitPop(); // F7d(2)
 $('invPanel').style.display='none';
 $('buildPanel').style.display='none';
 $('craftPanel').style.display='none';
 $('storePanel').style.display='none';
 $('deployPanel').style.display='none'; // F7c
 $('sharePanel').style.display='none'; // F7d
 $('charPanel').style.display='none';  // F10.1
 $('optionsPanel').style.display='none'; // F12.2
 // F12.13-defensive: jombPanel & keybindPanel tidak tracked di S.ui. Tutup
 // di sini supaya tidak nyangkut kalau beberapa panel dibuka beruntun.
 // jombPanel: route ke closeJombipedia() kalau state masih 'jombipedia'
 // — jangan hide DOM tanpa reset state (softlock).
 if(S.state==='jombipedia' && typeof closeJombipedia==='function'){closeJombipedia();}
 else{const jp=$('jombPanel');if(jp)jp.style.display='none';}
 {const kp=$('keybindPanel');if(kp)kp.style.display='none';}
 hideSkillTip(); // F10.2.2b: tooltip ikut tertutup saat panel tutup
}
{const b=$('invX');if(b)b.onclick=closeAllPanels;}
// F12.13-perf: event delegation untuk #invGrid — listener dipasang sekali di
// container; child .islot dilacak via e.target.closest('.islot') + data-slot.
// innerHTML replacement di renderInv() tidak menghilangkan listener karena
// mereka nempel di parent, bukan di child.
{const g=$('invGrid');
 if(g && !g._delegated){
  g._delegated=true;
  g.addEventListener('click', e=>{
   const s=e.target.closest('.islot'); if(!s) return;
   invSlotClick(+s.dataset.slot);
  });
  g.addEventListener('contextmenu', e=>{
   const s=e.target.closest('.islot'); if(!s) return;
   invSlotRC(e,+s.dataset.slot,s);
  });
  g.addEventListener('pointerdown', e=>{
   const s=e.target.closest('.islot'); if(!s) return;
   invDragStart(e,+s.dataset.slot,s);
  });
 }
}
{const b=$('buildX');if(b)b.onclick=closeAllPanels;}
{const r=$('buildRows');if(r)r.addEventListener('click',e=>{
 const btn=e.target.closest('.bbtn');if(!btn)return;
 const id=btn.dataset.bid;
 const ch=panelChar(); // F7(3b)
 if(BUILDS[id].access!=='all'&&ch.id!==BUILDS[id].access)return; // F9d D45
 if(!canAfford(BUILDS[id].mats,ch))return;
 if(ch.constr){toast(ch.n+' is already constructing','bad');return;}
 closeAllPanels();
 S.placement={id,owner:ch}; // F7(3b)
 showPlaceMarks();
 toast('Walk to the build spot · click to build · right-click to cancel','good');
});}
// ================= 13c. JEBAKAN (GDD §20.3) =================
// 1 jebakan per blok; hanya lantai DALAM mansion ('_','o','e').
const traps=new Map();
function makeTrapMesh(id){
 const g=new THREE.Group();
 const mk=(w,h,d,c,px,py,pz)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),
   new THREE.MeshLambertMaterial({color:c}));
  m.position.set(px,py,pz);m.castShadow=true;return m;
 };
 if(id==='barbed'){
  const a=mk(1.02,.05,.06,0x9a9488,0,.1,0);a.rotation.y=Math.PI/4;
  const b=mk(1.02,.05,.06,0x8a8478,0,.16,0);b.rotation.y=-Math.PI/4;
  g.add(a,b);
  for(let i=0;i<4;i++)g.add(mk(.05,.12,.05,0x6a6458,-.3+i*.2,.22,0));
 }else if(id==='bear'){
  g.add(mk(.55,.05,.55,0x6a6458,0,.03,0));
  const jawL=mk(.5,.1,.2,0x7a7468,-.2,.12,0);
  const jawR=mk(.5,.1,.2,0x7a7468,.2,.12,0);
  jawL.rotation.z=.7;jawR.rotation.z=-.7;
  g.add(jawL,jawR);g.userData={jawL,jawR};
 }else if(id==='claymore'){
  const body=mk(.44,.2,.1,0x4a4a44,0,.12,0);body.rotation.x=-.35;
  g.add(body,mk(.06,.12,.06,0x3a3a36,-.12,.03,.05),
        mk(.06,.12,.06,0x3a3a36,.12,.03,.05));
  const lamp=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,.05),
   new THREE.MeshBasicMaterial({color:0xff4020}));
  lamp.position.set(0,.24,0);g.add(lamp);g.userData={lamp};
 }else if(id==='incend'){
  g.add(mk(.36,.07,.36,0x8a4428,0,.04,0));
  const lamp=new THREE.Mesh(new THREE.BoxGeometry(.07,.07,.07),
   new THREE.MeshBasicMaterial({color:0xff6030}));
  lamp.position.set(0,.12,0);g.add(lamp);g.userData={lamp};
 }else if(id==='oil'){ // sudah berupa genangan (bucket menuang saat build)
  g.add(mk(.94,.035,.94,0x18120c,0,.02,0));
  const shine=new THREE.Mesh(new THREE.BoxGeometry(.5,.04,.3),
   new THREE.MeshBasicMaterial({color:0x3a3028}));
  shine.position.set(.1,.05,0);g.add(shine);
 }else if(id==='spikes'){
  g.add(mk(.9,.05,.4,0x5a5650,0,.03,0));
  for(let i=0;i<4;i++){
   const s=new THREE.Mesh(new THREE.ConeGeometry(.05,.3,4),
    new THREE.MeshLambertMaterial({color:0x8a8478}));
   s.position.set(-.33+i*.22,.2,0);s.castShadow=true;g.add(s);
  }
 }
 return g;
}
function addTrap(bid,x,y,owner){ // F7(3) + FIX(41): barbed/spikes kini ber-HP — aus per zombie lewat
 const t={id:bid,x,y,owner:owner||null,mesh:makeTrapMesh(bid),used:false,expireAt:0,animT:0,
  hp:BUILDS[bid].hp||0,max:BUILDS[bid].hp||0}; // FIX(41)
 t.mesh.position.set(x+.5,0,y+.5);
 scene.add(t.mesh);traps.set(x+','+y,t);
 return t;
}
function removeTrap(t){
 traps.delete(t.x+','+t.y);scene.remove(t.mesh);
 spawnDebris(t.x+.5,.25,t.y+.5,0x6a6458,5);
}
function validFloorCell(x,y){
 const c=cellAt(x,y);
 if(c!=='_'&&c!=='C'&&c!=='o'&&c!=='e')return false; // F12.5b: +C — C setara floor untuk trap/craft placement
 if(traps.has(x+','+y))return false;
 if(placed.has(x+','+y))return false;
 if(constrAt(x,y))return false; // F7(3b)
 if(charOnBlock(x,y))return false; // F8a(3c: ada karakter di blok
 return true;
}
function charOnBlock(tx,ty){ // F8a(3c): ada karakter hidup di blok ini?
 return chars.some(o=>!o.down&&!offField(o)
  &&Math.floor(o.x)===tx&&Math.floor(o.z)===ty);
}
function placeObject(bid,x,y){
 const wx=x+.5,wz=y+.5;
 let result=null;
 if(bid==='lantern'){
  const g=new THREE.Group();
  const wood=new THREE.MeshLambertMaterial({color:0x6a4c30});
  // F6 final: core emissive kuning-oranye — visible dari SEMUA sisi
  const glow=new THREE.Mesh(new THREE.BoxGeometry(.22,.3,.22),
   new THREE.MeshBasicMaterial({color:0xffc860}));
  glow.position.y=.24;
  const base=new THREE.Mesh(new THREE.BoxGeometry(.3,.06,.3),wood);
  base.position.y=.03;base.castShadow=true;
  const cap=new THREE.Mesh(new THREE.BoxGeometry(.3,.06,.3),wood);
  cap.position.y=.44;cap.castShadow=true;
  for(const[px,pz]of[[-.12,-.12],[.12,-.12],[-.12,.12],[.12,.12]]){
   const post=new THREE.Mesh(new THREE.BoxGeometry(.06,.42,.06),wood);
   post.position.set(px,.24,pz);g.add(post);
  }
  const hook=new THREE.Mesh(new THREE.BoxGeometry(.34,.05,.05),wood);
  hook.position.y=.52;
  g.add(glow,base,cap,hook);
  g.position.set(wx,0,wz);
  const L=new THREE.PointLight(0xffc07a,1.1,5,2);
  L.position.set(wx,.8,wz);
  scene.add(g,L);
  lanterns.set(x+','+y,{mesh:g,light:L,core:glow});
  result=g;
 }else if(bid==='storagebox'){
  const g=new THREE.Group();
  const base=new THREE.Mesh(new THREE.BoxGeometry(.9,.5,.7),
   new THREE.MeshLambertMaterial({color:0x8a6a42}));
  base.position.y=.25;base.castShadow=true;
  const lid=new THREE.Mesh(new THREE.BoxGeometry(.96,.12,.76),
   new THREE.MeshLambertMaterial({color:0x6a4c30}));
  lid.position.y=.56;
  const latch=new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.05),
   new THREE.MeshLambertMaterial({color:0x2a2a2a}));
  latch.position.set(0,.5,.38);
  g.add(base,lid,latch);
  g.position.set(wx,0,wz);
  scene.add(g);
  storageBoxes.set(x+','+y,{mesh:g,slots:new Array(20).fill(null),x,y});
  result=g;
 }
 placed.set(x+','+y,{id:bid,x,y});
 return result;
}
const boomLight=new THREE.PointLight(0xffa050,0,11,2);scene.add(boomLight);
let boomT=0;
function explode(cx,cz,radius,dmg,fire,src){ // F7(3): src = pembangun jebakan
 boomLight.color.setHex(0xffa050);
 SFX(src&&src.kind==='char'&&CHARS[src.id].weapon.type==='boom'?'blast':(fire?'incend':'boom')); // F9c D38: Erry = blast.mp3
 boomLight.position.set(cx,1,cz);boomT=.3;
 spawnDebris(cx,.6,cz,fire?0xff7030:0x55554e,10);
 spawnDebris(cx,.35,cz,0x2a2a24,6);
 for(const z of zombies){
  if(z.dying||z.retreat)continue;
  if(Math.hypot(z.x-cx,z.z-cz)<=radius){
   let d=dmg;
   if(src&&src.id==='erry'&&(z.T.elite||z.T.boss))d*=2; // F9d: pasif Erry — ×2 vs elite/boss
   damageZombie(z,d,src);
   if(fire)applyBurn(z,5,7,src);
  }
 }
}
function onTrapExit(z,tk){ // FIX(41): barbed/spikes AUS, bukan sekali-pakai —
 // normal −1 · elite −5 · boss −10 HP per zombie yang melintas
 const t=traps.get(tk);
 if(!t||t.tripped||(t.id!=='barbed'&&t.id!=='spikes'))return;
 if(!t.max)return removeTrap(t); // trap lama tanpa HP (save lama) → perilaku lama
 const wear=z.T.boss?10:z.T.elite?5:1;
 t.hp-=wear;
 floatText(t.x+.5,t.z+.5,'-'+wear+' HP','dmgZ');
 if(t.hp<=0)removeTrap(t);
}
function updateTraps(dt){
 for(const t of[...traps.values()]){
  const u=t.mesh.userData;
  if(u.lamp)u.lamp.visible=((S.now*2.5|0)%2===0);
  if(t.id==='oil'&&t.used&&S.now>t.expireAt){removeTrap(t);continue;}
  if(t.id==='bear'&&t.animT>0){
   t.animT-=dt;const p=clamp(1-t.animT/.22,0,1);
   u.jawL.rotation.z=.7-p*1.4;u.jawR.rotation.z=-.7+p*1.4;
   if(t.animT<=0)removeTrap(t);
  }
 }
 for(const z of zombies.slice()){
  if(z.retreat)continue;
  if(z.dying){ // mati di atas Metal Spikes → hancur (§20.3)
   const t=traps.get(z._tk||'');
   if(t&&t.id==='spikes'&&!t.tripped)removeTrap(t);
   continue;
  }
  const cx=Math.floor(z.x),cy=Math.floor(z.z),k=cx+','+cy;
  const t=traps.get(k),wasTk=z._tk;
  if(z._tk&&z._tk!==k)onTrapExit(z,z._tk);
  z._tk=(t&&!t.tripped)?k:null;
  if(!t||t.tripped)continue;
  if(wasTk!==k&&(t.id==='barbed'||t.id==='spikes'||t.id==='oil'))SFX('zone');
  if(t.id==='bear'){t.tripped=true;t.animT=.22;applyStun(z,10);}
  else if(t.id==='claymore'){removeTrap(t);explode(cx+.5,cy+.5,2,100,false,t.owner);} // F7(3): kredit ke pembangun
  else if(t.id==='incend'){removeTrap(t);explode(cx+.5,cy+.5,3,50,true,t.owner);}     // F7(3): kredit ke pembangun
  else if(t.id==='oil'){
   if(!t.used){t.used=true;t.expireAt=S.now+5;}
   applySlow(z,.8,.35,'trap'); // FIX(41): 80%
  }else{ // FIX(41): barbed 50% + 5 HP/s · spikes 60% + 10 HP/s — zona kontinu
   applySlow(z,t.id==='barbed'?.5:.6,.35,'trap');
   const dps=t.id==='spikes'?10:5;
   z.zoneAcc=(z.zoneAcc||0)+dps*dt;
   if(z.zoneAcc>=1){const d=Math.floor(z.zoneAcc);z.zoneAcc-=d;damageZombie(z,d,t.owner);} // F7(3): kredit DoT zona
  }
 }
}
// ================= 13d. SISTEM TEMBOK (§14, F5) =================
const walls=new Map(),holes=new Map();
function getWall(x,y){
 let w=walls.get(x+','+y);
 if(!w){
  w={x,y,orig:GRID[y][x],hp:CFG.wallHP,max:CFG.wallHP,
   tier:'normal',tierName:'WALL',isWall:true,
   origMesh:wallMeshes.get(x+','+y),mesh:wallMeshes.get(x+','+y)};
  walls.set(x+','+y,w);
 }
 return w;
}
function makeHoleMesh(){ // reruntuhan lubang
 const g=new THREE.Group();
 const rub=new THREE.MeshLambertMaterial({color:0x5a4a3a});
 const mk=(w,h,d,px,py,pz,rx,rz)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),rub);
  m.position.set(px,py,pz);if(rx)m.rotation.x=rx;if(rz)m.rotation.z=rz;
  m.castShadow=true;return m;
 };
 g.add(mk(1.1,.3,.5,0,.15,.25,.15,0),mk(.9,.25,.6,.1,.12,-.2,-.2,.1),
       mk(.5,.45,.4,-.3,.2,0,0,.35),mk(.4,.2,.4,.35,.1,.3,.4,0));
 return g;
}
function makeRepairedWallMesh(){ // Q3: abu-abu + tambalan semen + retakan
 const g=new THREE.Group();
 const grey=new THREE.MeshLambertMaterial({color:0x8a8680});
 const wall=new THREE.Mesh(new THREE.BoxGeometry(1,2,1),grey);
 wall.position.y=1;wall.castShadow=true;wall.receiveShadow=true;
 g.add(wall);
 const cm=new THREE.MeshBasicMaterial({color:0x2e2a24});
 for(const s of[.5,-.5]){
  const cement=new THREE.Mesh(new THREE.BoxGeometry(.8,.9,.1),
   new THREE.MeshLambertMaterial({color:0x9a968e}));
  cement.position.set(.04,.6,s);g.add(cement);
  [[-.26,.95,.5,.45],[.03,.7,.9,.3],[.27,.5,-.4,.6]].forEach(p=>{
   const c=new THREE.Mesh(new THREE.BoxGeometry(.055,p[3],.055),cm);
   c.position.set(p[0],p[1],s);c.rotation.z=p[2];
   g.add(c);
  });
 }
 return g;
}
function damageWall(w,z){
 w.hp-=z.atk*z.T.bld*zAtkMul(z);SFX('hitBarricade');
 if(!overheadMap.has(w))makeOverhead(w);
 if(w.hp<=0)breakWall(w);
}
function breakWall(w){
 GRID[w.y][w.x]='o'; // jadi jalur terbuka (zombie & karakter bisa lewat)
 if(w.mesh)scene.remove(w.mesh);
 w.mesh=null;
 w.holeMesh=makeHoleMesh();
 w.holeMesh.position.set(w.x+.5,0,w.y+.5);
 scene.add(w.holeMesh);
 holes.set(w.x+','+w.y,w);
 removeOverhead(w);
 spawnDebris(w.x+.5,1,w.y+.5,0x4a3827,16);
 toast('A WALL HAS BEEN BREACHED!','bad');SFX('wallDestroyed');
}
function repairWall(w){
 GRID[w.y][w.x]=w.orig;
 if(w.holeMesh){scene.remove(w.holeMesh);w.holeMesh=null;}
 w.mesh=makeRepairedWallMesh();
 w.mesh.position.set(w.x+.5,0,w.y+.5);
 scene.add(w.mesh);
 holes.delete(w.x+','+w.y);
 w.hp=w.max;
}
function startWallRepair(w){
 const ch=selChar||diaz; // F7(3b)
 if(ch.constr){toast(ch.n+' is already constructing','bad');return;}
 if(!nearBuild(w.x,w.y,ch)){toast('Too far — walk within 1 block first','bad');return;}
 if(!canAfford(WALL_REPAIR.mats,ch)){toast('Repair needs '+matStr(WALL_REPAIR.mats),'bad');return;}
 ch.constr={kind:'wallrepair',owner:ch,wall:w,x:w.x,y:w.y,t:0,dur:WALL_REPAIR.t,cost:WALL_REPAIR.mats};
 toast('Repairing the wall…');
}
// ---- ikon toolbar inventory: tong sampah & tangan ----
const ICON_TRASH=(function(){
 const cv=document.createElement('canvas');cv.width=18;cv.height=18;
 const c=cv.getContext('2d');
 c.fillStyle='#c0453a';
 c.fillRect(5,7,8,8);c.fillRect(3,5,12,2);c.fillRect(7,3,4,2);
 c.fillStyle='#7a2a24';
 c.fillRect(6,9,1,5);c.fillRect(8.5,9,1,5);c.fillRect(11,9,1,5);
 c.fillStyle='#e07a70';
 c.fillRect(5,7,1,8);
 return cv.toDataURL();
})();
const ICON_HAND=(function(){
 const cv=document.createElement('canvas');cv.width=18;cv.height=18;
 const c=cv.getContext('2d');
 c.fillStyle='#d9a13b';
 c.fillRect(5,7,8,8);c.fillRect(5,1,2,7);c.fillRect(8,0,2,8);
 c.fillRect(11,1,2,7);c.fillRect(2,7,2,4);
 c.fillStyle='#f0c868';
 c.fillRect(8,0,2,2);
 return cv.toDataURL();
})();
// ================= 14. SIKLUS NIGHT =================
const night={n:1,wave:0,phase:'intro',t:4,queue:0,spawnT:0,perWave:0,timeBonus:0,
 eliteN:0,bossN:0,eliteQ:0,bossQ:0,elitePlan:[0,0,0,0]};
function planEscalation(){
 night.eliteN=night.n%3===0?night.n/3:0; // FIX(34): elite HANYA malam kelipatan 3 (N3=1 · N6=2 · N9=3) — was floor(n/3) → elite nyempil di N4/N5
 night.bossN=night.n%5===0?night.n/5:0;  // FIX(34): boss hanya kelipatan 5 (N5=1 · N10=2)
 night.elitePlan=[0,0,0,0];
 for(let i=0;i<night.eliteN;i++)
  night.elitePlan[Math.random()<.5?1:2]++;
}
function startDeployPhase(){ // F7c §23.2: menu deploy + countdown 15 dtk
 night.phase='deploy';night.t=15;
 banner('PREPARE YOUR SQUAD','NIGHT 1 BEGINS IN 15 SECONDS');
 openDeploy();
}
function startNightIntro(){
 night.phase='intro';night.t=4;
 S._bankedRespect=S.respect; // FIX(32C)
 // F10.10.3: stand up semua char yang masih seat dari prep
 for(const ch of chars)if(ch.seat){ch.seat=null;standUp(ch);}
 if(!chars.some(c=>c.deployed&&!c.recovering)){ // FIX(38): field kosong → auto-deploy termurah
  const cand=chars.filter(c=>S.owned[c.id]&&!c.recovering)
   .sort((a,b)=>charDeployCost(a)-charDeployCost(b)); // F10.2.3: termurah efektif
  if(cand.length){
   const pickCh=cand[0];
   pickCh.deployed=true;
   pickCh.x=pickCh._home.x;pickCh.z=pickCh._home.z;pickCh.path=[];pickCh.lock=null;
   pickCh.mesh.visible=true;
   if(!S.deployOrder.includes(pickCh.id))S.deployOrder.push(pickCh.id);
   toast('AUTO-DEPLOY: '+pickCh.n+' — the field was empty','bad');
   layoutSquadCards();
  }
 }
 planEscalation();
 for(const c of chars)if(c.deployed&&!c.recovering) // P2: Most Deployed Character
  S.deploysPerChar[c.id]=(S.deploysPerChar[c.id]||0)+1;
 banner('NIGHT '+night.n+' BEGINS','THEY COME FROM THE FOREST');
 SFX('nightBegin');
 if(!AUD.ctx)S.stingPending=true; // autoplay policy — antre sting utk klik pertama
 resetJournalForNight(); // F10.4: repick 3 misi + reset counters
}
function startWave(i){
 night.wave=i;night.phase='wave';night.t=CFG.waveTime;
 for(const ch of chars)ch.stoveWave=-1; // F6: kompor reset per wave — SEMUA karakter
 // F12.13: plateau di Night 12 — night.n lebih tinggi dibatasi zombieCapN.
 const nEff=Math.min(night.n,CFG.zombieCapN);
 night.perWave=Math.ceil((CFG.baseZombies+CFG.zombieGrowth*(nEff-1))/4);
 night.queue=night.perWave;night.spawnT=1.5;
 night.eliteQ=night.elitePlan[i]||0;
 for(let k=0;k<night.eliteQ;k++)spawnZombie('elite');
 night.bossQ=(i===2)?night.bossN:0;
 if(night.bossQ>0){
  let first='';
  for(let k=0;k<night.bossQ;k++){
   const t=pick(['PZero','ZAlpha']);
   spawnZombie(t);if(!first)first=t;
  }
   banner(first==='PZero'?'PATIENT ZERO HAS RISEN':'ZOMBIE ALPHA APPROACHES',
    'WAVE 3 — A BOSS EMERGES FROM THE DARK');
   SFX('bossSpawn');
   chatPush('boss',chatReporter(),first==='PZero'?'PATIENT ZERO':'ZOMBIE ALPHA'); // F9b.5
 }else{
  banner('WAVE '+(i+1)+' — '+WAVE_NAMES[i],
   i===1?'THE DARK IS DEEPEST NOW':'HOLD THE LINE');
  SFX('waveStart');
 }
 setLightPhase('w'+(i+1));
 bgmSync();
}
function startPause(){
 night.phase='pause';night.t=CFG.pauseTime;
 const left=zombies.filter(z=>!z.dying).length;
 banner('TACTICAL PAUSE',left>0?'SPAWNS STOPPED — KILL THE REMAINING '+left:'NO SPAWNS — PREPARE');
 bgmSync();
 rollRescueEvent(); // F8b §16: event paling sering di jeda taktis (45%)
}
function nightEnd(){
 night.phase='dawn';night.t=5;
 const R=clamp(Math.round((10+night.n*3+night.timeBonus*.75)/2),10,40); // P12: floor 10 (was 5) — range 10-40 per malam
 S.respect+=R;
 S.respectEarned+=R; // P2: Total Respect Gained (sesi ini, bukan total saldo)
 S.nightsSurvived++; // P2: Night Reached / Survived
 // F7(2): resolusi tumbang §13 — RECOVERING per karakter (D1)
 for(const ch of chars){
  if(ch.recovering)recoverChar(ch);      // pulih — hadir malam berikutnya
  else if(ch.deployed&&ch.down)enterRecovering(ch); // F7c: hanya yang dideploy
 }
 // F10.4: set night-end flags SEBELUM banner (mis. Flawless butuh cek semua char)
 {const deployed=chars.filter(c=>c.deployed&&!offField(c));
  const anyDown=deployed.some(c=>c.jc&&c.jc.wentDown);
  const aliveCount=deployed.filter(c=>!c.down).length;
  for(const ch of chars){
   if(!ch.jc)continue;
   if(ch.deployed&&!offField(ch)){
    if(!ch.jc.wentDown)ch.jc.surviveClean=1;
    if(ch.hp/ch.es.hpMax>=.8)ch.jc.hp80End=1;
    if(!ch.jc.hadStatus)ch.jc.noStatusEnd=1;
    if(!ch.jc.buffs)ch.jc.noBuffEnd=1; // Pure Skill — tidak pakai buff item sama sekali
    if(!anyDown)ch.jc.flawlessEnd=1;
    if(aliveCount>=2)ch.jc.teamEnd=1;
   }
   checkJournal(ch); // flag night-end mungkin langsung menyelesaikan misi
  }}
 banner('THE NIGHT HAS PASSED','+'+R+' RESPECT');
 toast('Night '+night.n+' survived — +'+R+' Respect (total: '+S.respect+')','good');
 setLightPhase('prep');
 SFX('nightPass');
 bgmSync();
}
function startPrep(){
 // F10.5: n++ dipindah dari nextNight — biar cap baru berlaku SELAMA prep
 // (bukan tunggu 5 menit prep habis baru naik). HUD "NIGHT X" saat prep kini
 // menampilkan malam yang sedang dipersiapkan (lebih intuitif).
 night.n++;night.timeBonus=0;
 night.phase='prep';night.t=CFG.prepTime;
 if(S.gItems.length){
  for(const it of S.gItems)scene.remove(it.mesh);
  S.gItems.length=0;
  toast('Leftover ground items were lost as dawn broke','bad');
 }
 banner('PREPARATION PHASE','05:00 — REPAIR & REBUILD');
 SFX('prepStart');
 bgmSync();
 enforceDeployCap(); // F10.5: bench dari nextNight — cap baru (n sudah naik) langsung berlaku saat prep
 rollRescueEvent(); // F8b §16: event kadang muncul saat prep (25%)
 if(overDeploy()){ // FIX(33) #2 + FIX(47) P6: toast solutif — sebut constraint mana
  const overC=deployUsed()-deployCap(),overN=deployCount()-MAX_DEPLOY_CHARS;
  const cands=chars.filter(c=>c.deployed&&!c.recovering&&!c.down)
   .sort((a,b)=>charDeployCost(b)-charDeployCost(a)).slice(0,2)
   .map(c=>c.n+' ('+charDeployCost(c)+')').join(' or '); // F10.2.3
  const why=(overN>0&&overC>0)?'CHAR LIMIT +'+overN+' & COST +'+overC
   :overN>0?'CHAR LIMIT +'+overN:'COST +'+overC;
  toast('DEPLOY OVER — '+why+' — withdraw '+cands,'bad');
 }
}
function nextNight(){
 // F10.5: n++ · timeBonus=0 · enforceDeployCap() dipindah ke startPrep
 // (cap baru harus berlaku SEJAK awal prep, bukan tunggu prep habis).
 for(const ch of chars){ // F7(2): semua char kumpul di ruang keluarga §15.1
  if(offField(ch))continue;               // absen — mesh tersembunyi
  ch.x=ch._home.x;ch.z=ch._home.z;ch.path=[];ch.lock=null;
  ch.state='idle';ch.mesh.rotation.set(0,0,0); // FIX(3): energy TIDAK direset — terbawa §5
 }
 startNightIntro(); // item lantai sudah bersih sejak startPrep
}
function updateNight(dt){
 if(S.state!=='playing')return;
 const ph=night.phase;
 if(ph==='deploy'){ // F7c §23.2: countdown menu deploy
  night.t-=dt;
  if(night.t<=0){
   if(S.ui==='deploy')closeAllPanels();
   startNightIntro();
  }
  return;
 }
 if(ph==='intro'){
  night.t-=dt;if(night.t<=0)startWave(0);
 }else if(ph==='wave'){
  night.t-=dt;
  if(night.queue>0){
   night.spawnT-=dt;
   if(night.spawnT<=0&&zombies.length<CFG.maxAlive){
    spawnZombie();night.queue--;
    night.spawnT=Math.max(1.2,CFG.waveTime/night.perWave*rnd(.7,1.3));
   }
  }
  if(night.queue<=0&&zombies.length===0&&night.t>3){
   night.timeBonus+=night.t;
   banner('WAVE CLEARED','+'+Math.ceil(night.t)+'s BONUS TIME');
   startPause();
  }else if(night.t<=0)startPause();
 }else if(ph==='pause'){
  night.t-=dt;
  if(night.t<=0){
   if(night.wave>=3)nightEnd();
   else startWave(night.wave+1);
  }
 }else if(ph==='dawn'){
  night.t-=dt;if(night.t<=0)startPrep();
 }else if(ph==='prep'){
  night.t-=dt;if(night.t<=0)nextNight();
 }
}

// ================= 15. PENCAHAYAAN + FOG PATCHES =================
let LT=null,candleMul=1;
const _tc=new THREE.Color();
let fogPatches=[];
const fogPatchMats=[.10,.14,.18].map(o=>new THREE.MeshLambertMaterial({
 color:0xaab2b8,transparent:true,opacity:o,depthWrite:false}));
const fogPatchGeo=new THREE.BoxGeometry(4.5,1.5,3.5);
function setupFogPatches(){
 clearFogPatches();
 for(let i=0;i<18;i++){
  let px,pz;
  do{px=rnd(2,37);pz=rnd(2,29);}while(px>=8&&px<=31&&pz>=6&&pz<=25);
  const m=new THREE.Mesh(fogPatchGeo,pick(fogPatchMats));
  m.position.set(px,.75,pz);
  m.scale.setScalar(rnd(.7,1.3));
  scene.add(m);
  fogPatches.push({m,vx:rnd(-.12,.12),vz:rnd(-.08,.08),ph:rnd(0,6)});
 }
}
function clearFogPatches(){
 for(const p of fogPatches)scene.remove(p.m);
 fogPatches.length=0;
}
function updateFogPatches(dt){
 for(const p of fogPatches){
  p.m.position.x+=p.vx*dt;
  p.m.position.z+=p.vz*dt;
  p.m.position.y=.75+.15*Math.sin(S.now*.4+p.ph);
  if(p.m.position.x<1.5)p.m.position.x=37.5;
  if(p.m.position.x>38)p.m.position.x=2;
  if(p.m.position.z<1.5)p.m.position.z=29.5;
  if(p.m.position.z>30)p.m.position.z=2;
 }
}
function setLightPhase(k){
 LT=LIGHTING[k];
 if(k==='w3')setupFogPatches();
 else clearFogPatches();
}
function updateLighting(dt){
 if(!LT)return;
 const k=Math.min(1,dt*.5);
 _tc.set(LT.bg);scene.background.lerp(_tc,k);
 _tc.set(LT.fog);scene.fog.color.lerp(_tc,k);
 scene.fog.near=lerp(scene.fog.near,LT.fogN,k);
 scene.fog.far =lerp(scene.fog.far, LT.fogF,k);
 _tc.set(LT.amb);amb.color.lerp(_tc,k);
 amb.intensity=lerp(amb.intensity,LT.ambI,k);
 _tc.set(LT.dir);moon.color.lerp(_tc,k);
 moon.intensity=lerp(moon.intensity,LT.dirI,k);
 candleMul=lerp(candleMul,LT.candle,k);
 for(const L2 of candleLights)L2.intensity=L2.userData.base*candleMul;
}

// ================= 16. UPDATE: DIAZ + SKILL =================
function castSkill(ch){ // F9c: 13 skill — guard D27 + mode lempar + 9 baru
 if(S.state!=='playing'||!ch||ch.down||offField(ch))return;
 if(ch.seat)endSeat(ch,true); // F10.10.3: berdiri dulu sebelum skill
 if(hasSt(ch,'STUNNED')){toast(ch.n+' is stunned — skill locked','bad');return;}
 if(ch.constr){toast(ch.n+' is busy constructing — skill locked','bad');return;}
 if(ch._revive){toast(ch.n+' is reviving — skill locked','bad');return;} // F7b
 if(throwState){toast(ch.n+' is already throwing — LMB/RMB first','bad');return;} // F9c
 if(ch.energy<100){
  toast('Energy is not full ('+Math.floor(ch.energy)+'/100)','bad');return;}
 const W=CHARS[ch.id].weapon;
 // ---- skill targeted: butuh target D27 (HAHAHAHA instan-lock utk Hafid via mode) ----
 if(ch.id==='hafid'){ // D44: masuk mode lempar lock-target (validasi target di dalam)
  const t=pickDanger(ch,THROW_ITEMS.hafid.range);
  if(!t){toast('No targets within skill range','bad');return;}
  ch.energy=0;SFX('skill');if(ch.jc)ch.jc.skills++;
  startThrowMode(ch);floatText(ch.x,ch.z,'HAHAHAHA!','skill',1.2);
  ch.skillUntil=S.now+1;
  return;
 }
 if(ch.id==='erry'){ // D38: instan — 5 explosive kipas 45°
  const t=ch.lock&&ch.lock.hp>0?ch.lock:currentTarget(ch);
  if(!t){toast('No targets within skill range','bad');return;}
  ch.energy=0;SFX('skill');if(ch.jc)ch.jc.skills++;
  const base=Math.atan2(t.x-ch.x,t.z-ch.z),fan=45*Math.PI/180;
  const cyc={pending:0,hits:new Map(),owner:ch};
  ch._burst=null; // FIX(30): batalkan burst berjalan — cycle baru tak menabrak yang lama
  ch.cycle=cyc;ch.mag-=W.bullets;
  for(let i=0;i<5;i++){
   const a=base+(i/4-.5)*fan;
   fireBullet(ch,t,cyc,0,{dx:Math.sin(a),dz:Math.cos(a),atk:ch.es.atk,
    boom:true,aoeP:.5,aoeR:3}); // override: 50% ATK radius 3
  }
  floatText(ch.x,ch.z,'EAT THIS!','skill',1.2);
  ch.skillUntil=S.now+1;
  return;
 }
 if(ch.id==='rehan'){ // P8-EXT: enter target-pick mode (guard D27 — validasi target dulu)
  const t=pickKillable(ch,THROW_ITEMS.rehan.range);
  if(!t){toast('No targets within skill range','bad');return;}
  ch.energy=0;SFX('skill');if(ch.jc)ch.jc.skills++;
  startThrowMode(ch);
  floatText(ch.x,ch.z,'"BACK HOME!"','skill',1.2);
  ch.skillUntil=S.now+1;
  return; // buff BELUM aktif — baru saat target dipilih (applyRehanSkill)
 }
 ch.energy=0;SFX('skill');
 if(ch.jc)ch.jc.skills++; // F10.4
 if(ch.id==='diaz'){
  ch.buffs.push({until:S.now+25,u:S.now+25,dur:25,atkP:.3,agiP:.5,spdP:.5,n:'ADRENALINE'});
  ch.skillUntil=S.now+25;
  toast('ADRENALINE — SPD+50% AGI+50% ATK+30% (25s)','good');
  floatText(ch.x,ch.z,'ADRENALINE!','skill',1.2);
 }else if(ch.id==='bambang'){ // F7(3): MOTIVATED — 6 peluru beruntun (D7)
  ch._mot={left:6};
  ch._motHitsLeft=6;
  ch.skillUntil=S.now+1.5; // blokir energi selama rentetan (§5)
  ch.buffs=ch.buffs.filter(b=>!b.mot);
  toast('MOTIVATED — 6 rapid shots · ATK+20% then +10% per hit','good');
  floatText(ch.x,ch.z,'MOTIVATED!','skill',1.2);
 }else if(ch.id==='memet'){ // F8a(3) D5: "Man of Medan"
  const C=CHARS.memet;
  ch._medan={until:S.now+25};
  ch.buffs.push({until:S.now+25,u:S.now+25,dur:25,n:'MAN OF MEDAN',
   defF:C.def*2,spdF:C.spd*1.5}); // +200%/+150% dari BASE → 75/175 total
  ch.path=[];
  ch.skillUntil=S.now+25; // blokir energi selama skill (§5)
  toast('MAN OF MEDAN — DEF+200% SPD+150% · immortal · 25s','good');
  floatText(ch.x,ch.z,'MAN OF MEDAN!','skill',1.2);
 }
  // ===== F9c: 9 SKILL BARU =====
 else if(ch.id==='sobel'){ // D36: Brrrt — 20 dtk, kipas 60° 15 pierce, tanpa mag, interval .6
  ch._brrrt=S.now+20;
  ch.buffs.push({until:S.now+20,dur:20,n:'BRRRT',brrrt:true});
  ch.skillUntil=S.now+20;
  toast('BRRRT — 15 piercing × 60° fan · no ammo (20s) · next reload +50%','good');
  floatText(ch.x,ch.z,'BRRRT, BRTT..!','skill',1.2);
 }else if(ch.id==='vikry'){ // D37: I am the storm — ricochet + self buff
  ch._storm=S.now+15;
  ch.buffs.push({until:S.now+15,dur:15,n:'THE STORM',atkP:.2,spnP:.3});
  ch.skillUntil=S.now+15;
  toast('I AM THE STORM — ricochet ×3 (100/75/70/65%) · STUN 2s (15s)','good');
  floatText(ch.x,ch.z,'I AM THE STORM','skill',1.2);
 }else if(ch.id==='ariz'){ // D39: zona heal di kaki sendiri
  zones.push({x:ch.x,z:ch.z,r:3,t:15,kind:'heal',mesh:makeZoneMesh(ch.x,ch.z,'heal')});
  ch.skillUntil=S.now+15;
  toast('NOT ON MY WATCH! — healing zone 3 blk, HP+20/s (15s)','good');
  floatText(ch.x,ch.z,'NOT ON MY WATCH!','skill',1.2);
 }else if(ch.id==='alvi'){ // D40: mode lempar tray
  startThrowMode(ch);ch.skillUntil=S.now+1;
  floatText(ch.x,ch.z,'FREE MEALS!','skill',1.2);
 }else if(ch.id==='reza'){ // D41 + FIX(41): molotov — impact 50 + burn 75%/s × 10 dtk
  startThrowMode(ch);ch.skillUntil=S.now+1;
  floatText(ch.x,ch.z,'PYROMANIAC!','skill',1.2);
 }else if(ch.id==='lele'){ // D42 + D25: Gorilla Mode
  const c=Math.floor(ch.hp*.5);
  ch.hp-=c;
  ch._gorilla=S.now+15;
  ch.buffs.push({until:S.now+15,dur:15,n:'GORILLA MODE',
   atkF:c,defF:c,agiF:c,spnF:c,gorilla:true});
  ch.skillUntil=S.now+15;
  toast('GORILLA MODE — consumed '+c+' HP → +'+c+' ATK/DEF/AGI/SPD (15s) · next reload +70%','good');
  floatText(ch.x,ch.z,'GORILLA MODE!','skill',1.2);
 }else if(ch.id==='raptor'){ // D43: Quick-scope
  ch._qs=S.now+15;
  ch.buffs.push({until:S.now+15,dur:15,n:'QUICK-SCOPE',atkP:1,spnP:1,agiM:.5});
  ch.skillUntil=S.now+15;
  toast('QUICK-SCOPE — ATK+100% SPD+100% · interval & reload −50% · AGI−50% · range 8 (15s)','good');
  floatText(ch.x,ch.z,'QUICK-SCOPE','skill',1.2);
 }
}
// ---- F9c: MODE LEMPAR (D40/D41/D44) — window 5 dtk, lockdown, timeout = auto-throw ----
// targetPicking: zombie "paling bahaya" = tier tertinggi (boss>elite>normal),
//                lalu terdekat di dalam range skill. Tanpa zombie = cancel otomatis.
const THROW_ITEMS={
 alvi:{range:3,color:0xc0c0c8,zone:'buff',zr:4,zt:35},   // D40: ompreng — tray buff
 reza:{range:5,color:0xd84020,zone:'burn',zr:2,zt:10,dps:.75,impact:50}, // FIX(41): buff — 10 dtk · 75% ATK · impact 50
 hafid:{range:8,color:0x7a1f2b,mode:'lock'},             // D44: sticky — lock target
 rehan:{range:6,color:0xffd24a,mode:'rehan'}};           // P8-EXT: skill target-pick (buff +150%/12s + lock)
function dangerScore(z){ // F9c: boss > elite > normal, lalu jarak
 return (z.T.boss?3:z.T.elite?2:1)*1000-Math.hypot(z.x-throwState.x,z.z-throwState.z);
}
let throwState=null; // {ch,t,item,tx,tz,target}
function startThrowMode(ch){
 const item=THROW_ITEMS[ch.id];if(!item)return;
 if(item.mode==='lock'){ // D44: pilih target paling bahaya OTOMATIS saat masuk mode
  const t=pickDanger(ch,item.range);
  if(!t){toast('No targets within skill range','bad');return;}
  throwState={ch,t:5,item,target:t};
  toast(ch.n+': THROW AT '+t.tierName+' — LMB confirm · RMB cancel · auto-throw in 5s');
 }else if(item.mode==='rehan'){ // P8-EXT: Rehan — target dipilih MANUAL oleh pemain
  const any=pickKillable(ch,item.range);
  if(!any){toast('No targets within skill range','bad');return;}
  throwState={ch,t:5,item,target:null};
  toast(ch.n+': PICK A TARGET — LMB on zombie · RMB cancel · auto in 5s');
 }else{
  throwState={ch,t:5,item,tx:null,tz:null};
  toast(ch.n+': pick a block — LMB throw · RMB cancel · auto-throw in 5s');
 }
 ch.path=[];ch.lock=null; // §4.2: terkunci di tempat selama mode lempar
}
function pickDanger(ch,range){ // zombie paling bahaya dalam range (boss>elite>normal>dekat)
 let best=null,bs=-1e9;
 for(const z of zombies){
  if(z.dying||z.retreat)continue;
  const d=Math.hypot(z.x-ch.x,z.z-ch.z);
  if(d>range)continue;
  const s=(z.T.boss?3:z.T.elite?2:1)*1000-d;
  if(s>bs){bs=s;best=z;}
 }
 return best;
}
// P8-EXT: Rehan — zombie HP terendah dalam range (paling mungkin di-kill → chain reset)
function pickKillable(ch,range){
 let best=null,bh=1e18;
 for(const z of zombies){
  if(z.dying||z.retreat)continue;
  const d=Math.hypot(z.x-ch.x,z.z-ch.z);
  if(d>range)continue;
  if(z.hp<bh){bh=z.hp;best=z;}
 }
 return best;
}
// P8-EXT: skill Rehan — buff +150% ATK 12s + lock target + chain window 12s
function applyRehanSkill(ch,t){
 ch.buffs=ch.buffs.filter(b=>!b.rehan);
 ch.buffs.push({until:S.now+12,u:S.now+12,dur:12,n:'BACK HOME',atkP:1.5,rehan:true});
 ch.lock=t; // override lock-on target — sesuai pilihan pemain
 if(!ch._rehanChain||S.now>ch._rehanChain.until)
  ch._rehanChain={kills:0,until:S.now+12};
 else ch._rehanChain.until=S.now+12;
 ch.skillUntil=S.now+1;
 toast('"JUST LIKE BACK HOME.." — ATK+150% (12s) · target locked · skill-kill refills Energy (max ×4)','good');
 SFX('skill');
}
// FIX(41): ghost lempar = MESH 3D menempel lantai (pola buildGhost) — was kotak
// HTML screen-space yang tampak "2D datar" di kamera isometric
const throwGhostM=new THREE.Group();
const tgOut=new THREE.Mesh(new THREE.PlaneGeometry(1.02,1.02),
 new THREE.MeshBasicMaterial({color:0x1848a0,transparent:true,opacity:.9,depthWrite:false}));
const tgFill=new THREE.Mesh(new THREE.PlaneGeometry(.88,.88),
 new THREE.MeshBasicMaterial({color:0x5ab0ff,transparent:true,opacity:.38,depthWrite:false}));
tgOut.rotation.x=tgFill.rotation.x=-Math.PI/2;
tgFill.position.y=.02;
throwGhostM.add(tgOut,tgFill);
throwGhostM.visible=false;scene.add(throwGhostM);
function throwGhost(){ // D40/D41 + FIX(41): biru=valid / merah=luar range — versi 3D
 if(!throwState||throwState.item.mode==='lock'||throwState.item.mode==='rehan'||!ghostXY){throwGhostM.visible=false;return;} // P8-EXT: rehan skip ghost
 const p=pickGround({clientX:ghostXY.x,clientY:ghostXY.y});
 if(!p){throwGhostM.visible=false;return;}
 const tx=Math.floor(p.x),tz=Math.floor(p.z);
 throwState.tx=tx;throwState.tz=tz;
 const ch=throwState.ch,rng=throwState.item.range;
 const ok=inBounds(tx,tz)&&Math.hypot(tx+.5-ch.x,tz+.5-ch.z)<=rng;
 tgOut.material.color.setHex(ok?0x1848a0:0x6a1410);
 tgFill.material.color.setHex(ok?0x5ab0ff:0xff5040);
 throwGhostM.position.set(tx+.5,.08,tz+.5);
 throwGhostM.visible=true;
 throwState.ok=ok;
}
function updateThrow(dt){ // window 5 dtk — timeout = AUTO-THROW target paling bahaya
 if(!throwState)return;
 throwState.t-=dt;
 if(throwState.t<=0){
  const it=throwState.item;
  if(it.mode==='lock'||it.mode==='rehan'){ // P8-EXT: rehan mode ikut jalur lock
   const t=throwState.target;
   if(!t||t.hp<=0||t.retreat){
    const picker=it.mode==='rehan'?pickKillable:pickDanger; // P8-EXT: rehan → HP terendah
    const nt=picker(throwState.ch,it.range);
    if(nt)throwState.target=nt;else{cancelThrow(false);return;}}
   execThrow();
  }else{
   const t=pickDanger(throwState.ch,it.range); // zombie paling bahaya dalam range
   if(t){ // lempar ke blok zombie tsb
    throwState.tx=Math.floor(t.x);throwState.tz=Math.floor(t.z);throwState.ok=true;
    execThrow();
   }else cancelThrow(false); // tak ada zombie = batal tenang (energy hangus — sudah lewat window)
  }
  return;
 }
 throwGhost();
}
function cancelThrow(refund){ // RMB atau batal — refund=true = kembalikan energy
 if(!throwState)return;
 const ch=throwState.ch;
 if(refund)ch.energy=100;
 throwState=null;
 throwGhostM.visible=false;
 toast(ch.n+': throw cancelled'+(refund?' — Energy refunded':''));
}
function execThrow(){ // konfirmasi LMB / timeout — lempar proyektil melengkung
 const st=throwState;throwState=null;
 throwGhostM.visible=false;
 const ch=st.ch;
 if(st.item.mode==='lock'||st.item.mode==='rehan'){ // D44 / P8-EXT: target-based
  const t=st.target;
  if(!t||t.hp<=0){ch.energy=100;toast('Target lost — Energy refunded','bad');return;}
  if(st.item.mode==='rehan')applyRehanSkill(ch,t); // P8-EXT
  else spawnSticky(ch,t);
 }else{
  if(!st.ok||st.tx===null){ch.energy=100;toast('Invalid spot — Energy refunded','bad');return;}
  spawnThrowItem(ch,st.item,st.tx,st.tz);
 }
}
// ---- F9c: PROYEKTIL LEMPAR — melengkung 0.4 dtk (pola pounce), mesh unik per skill ----
const throwFly=[]; // {ch,item,mesh,x0,z0,tx,tz,t,dur,sticky,target}
function makeThrowMesh(ch){ // D-mesh: ompreng silver 3x2 tipis · molotov merah · bomb maroon+abu
 const g=new THREE.Group();
 if(ch.id==='alvi'){ // ompreng bekal — metallic silver, kotak tipis panjang-lebar 3x2
  const silver=new THREE.MeshLambertMaterial({color:0xc0c0c8});
  const tray=new THREE.Mesh(new THREE.BoxGeometry(.6,.08,.4),silver); // 3x2 skala mini
  tray.position.y=.04;tray.castShadow=true;g.add(tray);
  const food=new THREE.Mesh(new THREE.BoxGeometry(.5,.06,.3),
   new THREE.MeshLambertMaterial({color:0xd8b060}));
  food.position.y=.1;g.add(food);
 }else if(ch.id==='reza'){ // molotov — botol merah keorenan
  const red=new THREE.MeshLambertMaterial({color:0xd84020});
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.09,.11,.26,8),red);
  body.position.y=.13;body.castShadow=true;g.add(body);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.12,8),
   new THREE.MeshLambertMaterial({color:0x8a6a42}));
  neck.position.y=.31;g.add(neck);
  const rag=new THREE.Mesh(new THREE.BoxGeometry(.07,.09,.07),
   new THREE.MeshBasicMaterial({color:0xffd070}));
  rag.position.y=.4;g.add(rag);
 }else{ // hafid — kotak maroon + kotak abu di tengah
  const maroon=new THREE.MeshLambertMaterial({color:0x7a1f2b});
  const grey=new THREE.MeshLambertMaterial({color:0x9a9a94});
  const body=new THREE.Mesh(new THREE.BoxGeometry(.24,.16,.24),maroon);
  body.position.y=.08;body.castShadow=true;g.add(body);
  const core=new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.1),grey);
  core.position.y=.08;g.add(core);
 }
 return g;
}
function spawnThrowItem(ch,item,tx,tz){ // lempar area (tray/molotov)
 const m=makeThrowMesh(ch);
 m.position.set(ch.x,.9,ch.z);
 scene.add(m);
 throwFly.push({ch,item,mesh:m,x0:ch.x,z0:ch.z,tx:tx+.5,tz:tz+.5,t:0,dur:.4});
 SFX('trapSnap');
}
function spawnSticky(ch,t){ // D44: bomb menempel target — terbang ke tubuhnya dulu
 const m=makeThrowMesh(ch);
 m.position.set(ch.x,.9,ch.z);
 scene.add(m);
 throwFly.push({ch,item:THROW_ITEMS.hafid,mesh:m,x0:ch.x,z0:ch.z,
  tx:t.x,tz:t.z,t:0,dur:.4,sticky:t});
}
function updateThrowFly(dt){ // dipanggil loop — pendaratan = efek zona / tempel
 for(const f of throwFly.slice()){
  f.t+=dt;
  const p=Math.min(1,f.t/f.dur);
  const x=lerp(f.x0,f.tx,p),z=lerp(f.z0,f.tz,p);
  const y=.9+Math.sin(Math.PI*p)*1.4; // busur lemparan
  f.mesh.position.set(x,y,z);
  f.mesh.rotation.y+=dt*8;
  if(p>=1){
   scene.remove(f.mesh);throwFly.splice(throwFly.indexOf(f),1);
   if(f.sticky){ // sticky: menempel, timer 5 dtk via zones-like list
    stickyList.push({ch:f.ch,target:f.sticky,mesh:f.mesh,t:5});
    f.mesh.position.set(f.sticky.x,.6,f.sticky.z);
    scene.add(f.mesh); // re-add sebagai tempelan
    toast(f.ch.n+': STICKY PLANTED — 5s');
   }else if(f.item.zone==='buff'){ // D40: tray → zona buff
    zones.push({x:f.tx,z:f.tz,r:f.item.zr,t:f.item.zt,kind:'buff',
     mesh:makeZoneMesh(f.tx,f.tz,'buff')});
    SFX('built');
   }else if(f.item.zone==='burn'){ // FIX(41): impact 50 + burn 75% ATK/s × 10 dtk
    const im=f.item.impact||0;
    for(const z of zombies){ // initial impact — damage flat ke zombie di titik jatuh
     if(z.dying||z.retreat)continue;
     if(Math.hypot(z.x-f.tx,z.z-f.tz)<=1.2)
      damageZombie(z,im,f.ch);
    }
    zones.push({x:f.tx,z:f.tz,r:f.item.zr,t:f.item.zt,kind:'burn',
     dps:f.ch.es.atk*(f.item.dps||.75),owner:f.ch,mesh:makeZoneMesh(f.tx,f.tz,'burn')});
    fxFlash(f.tx,f.tz,0xff6a30);SFX('incend');
   }
  }
 }
}
// ---- sticky bomb Hafid (D44) ----
const stickyList=[];
function updateSticky(dt){
 for(const s of stickyList.slice()){
  if(!s.target||s.target.hp<=0||s.target.dying){ // target mati dulu → ledak di tempat jatuh
   stickyBoom(s);
   continue;
  }
  s.t-=dt;
  s.mesh.position.set(s.target.x,.6,s.target.z);
  if(((s.t*2)|0)!==(((s.t+dt)*2)|0))SFX('sticky'); // tick tiap 0.5 dtk
  if(s.t<=0)stickyBoom(s);
 }
}
function stickyBoom(s){ // D44: 250% target + 200% AoE radius 3 — blast.mp3
 const t=s.target,at=s.ch.es.atk;
 fxFlash(t.x,t.z,0xffa050);
 explode(t.x,t.z,3,at*2,false,s.ch); // 200% AoE — reuse (blast.mp3 utk Hafid? bukan boom-type — pakai 'boom')
 if(t&&!t.dying&&t.hp>0){
  const d=Math.max(1,Math.round(at*2.5*markMul(t)));
  t.hp-=d;
  t.dmgB=t.dmgB||{};t.dmgB[s.ch.id]=(t.dmgB[s.ch.id]||0)+d;
  floatText(t.x,t.z,'-'+d,'dmgZ');flashUnit(t.mesh,.12);
  if(t.hp<=0){
   killZombie(t);
   if((s.ch._bombN||0)<2){ // F9d: pasif Hafid — skill-kill → +25 EN, maks 2×/skill
    s.ch._bombN=(s.ch._bombN||0)+1;
    s.ch.energy=Math.min(100,s.ch.energy+25);
    floatText(s.ch.x,s.ch.z,'+25 EN','skill');
   }
  }
 }
 scene.remove(s.mesh);
 stickyList.splice(stickyList.indexOf(s),1);
 SFX('blast');
}
function tryReload(){ // R = manual reload — karakter TERSELEKSI (F7(2))
 const sc=selChar||diaz;
 if(S.state!=='playing'||sc.down||sc.reloadT>0
  ||sc.mag>=charMagMax(sc))return; // F10.2.4: OFF T3-aware
 if(hasSt(sc,'STUNNED'))return;
 sc.reloadT=charReloadTime(sc); // F10.2.4: helper (SPD · _reloadMul · OFF T2)
 if(sc._reloadMul)sc._reloadMul=null;
 SFX(RELOAD_SFX[sc.id]||'reload');
 floatText(sc.x,sc.z,'RELOADING!','reload',1.2);
}
// F7c(2): cooldown item PER KARAKTER — Sterilized Cloth Diaz ≠ cd Bambang
function itemCdGet(ch,id){return S.itemCd[ch.id+'_'+id]||0}
function itemCdSet(ch,id,until){S.itemCd[ch.id+'_'+id]=until}
function applyHeal(id,ch){ // F7(2) + FIX(46) P5: AoE untuk spray/holywater (GDD §20.2)
 if(ch._medan&&S.now<ch._medan.until)return; // F8a(3) D5: tak bisa disembuh
 const h=HEALS[id];
 // FIX(46): aoeR → heal semua char hidup dalam radius (termasuk pengguna).
 // Aturan: skip Down (harus revive, bukan heal item) · skip off-field (reserve/recovering)
 // · skip target yang sedang Man of Medan (_medan). Item & CD tetap 1× (milik pengguna).
 const targets=h.aoeR
  ?chars.filter(o=>!o.down&&!offField(o)&&Math.hypot(o.x-ch.x,o.z-ch.z)<=h.aoeR)
  :[ch];
 for(const t of targets){
  if(t._medan&&S.now<t._medan.until)continue; // F8a(3) D5: immunity per target
  // F10.2.5: REC T2 +10% heal effect (target-side; stack dengan APapun)
  const tMul=treeHas(t,'rec',2)?1.1:1;
  const gain=t.es.hpMax*h.pct*tMul;
  t.hp=Math.min(t.es.hpMax,t.hp+gain);
  if(h.regen)applyRegen(t,h.regen*tMul,h.regenT);
  if(h.clear)clearStatus(t);
  floatText(t.x,t.z,'+'+Math.round(gain),'heal');
 }
 if(h.aoeR)fxRing(ch.x,ch.z,0x7fd4d4,h.aoeR,.7); // FIX(46): visual ring AoE
 itemCdSet(ch,id,S.now+h.cd); // F7c(2): cd per karakter (hanya pengguna)
 S.healUses[id]=(S.healUses[id]||0)+1; // P2: Healing Items Consumed (1× per pemakaian)
 if(ch.jc)ch.jc.heals++; // F10.4
 SFX('heal');
}
function applyFoodBuff(id,ch){ // F7(2) + F9d: buffBoost Alvi +25%
 const f=FOOD_BUFFS[id];
 let mul=ch.id==='alvi'?1.25:1; // F9d: Alvi +25%
 if(treeHas(ch,'pas',2))mul*=1.1; // F10.2.5: PAS T2 +10% (stack multiplicative)
 ch.buffs=ch.buffs.filter(b=>!b.food); // makanan tak menumpuk — ganti
 ch.buffs.push({until:S.now+f.dur,dur:f.dur,n:ITEMS[id].n.toUpperCase(),
  atkF:f.atkF*mul,defF:f.defF*mul,agiF:f.agiF*mul,spdF:f.spdF*mul,xpP:f.xpP,food:true}); // F9d: ×1.25 utk Alvi
 if(f.clear)clearStatus(ch);
 itemCdSet(ch,id,S.now+f.dur); // F7c(2): cd per karakter
 S.buffUses[id]=(S.buffUses[id]||0)+1; // P2: Buff Items Consumed
 if(ch.jc)ch.jc.buffs++; // F10.4
 SFX('eat');
}
// ---- F6 PENUTUP: KOMPOR §19.2 (keputusan final) ----
// ATK+10 DEF+5 AGI+3 · MaxHP+20 DAN HP+20 (70/100 → 90/120) · 60 dtk
// 1× per WAVE per karakter (F7: loop semua karakter — tanpa cooldown antar karakter)
// Hanya fase 'wave' · stack dengan buff makanan (bukan flag 'food')
// Tanpa field 'dur' → tidak muncul di skill ring (itu milik Adrenaline)
function useStove(ch){ // F7(2): buff kompor masuk ke karakter pengguna
 ch.stoveWave=night.wave;
 ch.buffs.push({until:S.now+60,n:'HOT MEAL',
  atkF:10,defF:5,agiF:3,hpF:20,stove:true});
 ch.hp=Math.min(effStats(ch).hpMax,ch.hp+20);
 floatText(ch.x,ch.z,'HOT MEAL!','skill',1.2);
 toast(ch.n+': HOT MEAL — ATK+10 DEF+5 AGI+3 HP+20 (60s)','good');
 SFX('eat');
 S.stoveUses++;
 if(ch.jc)ch.jc.stove++; // F10.4
}
function useHealItem(){ // H: karakter TERSELEKSI — slot dulu → inventory (F7(2))
 const sc=selChar||diaz;
 if(S.state!=='playing'||sc.down)return;
 if(sc._medan&&S.now<sc._medan.until){ // F8a(3) D5
  toast(sc.n+' cannot be healed during MAN OF MEDAN','bad');return;}
 if(hasSt(sc,'STUNNED')){toast(sc.n+' is stunned','bad');return;}
 const rec=sc.slots.rec;
 if(rec&&itemCdGet(sc,rec.id)<=S.now){ // F7c(2)
  applyHeal(rec.id,sc);
  rec.q--;if(rec.q<=0)sc.slots.rec=null;
  if(S.ui==='inv'&&sc===panelChar())renderInv();
  return;
 }
 for(let i=0;i<12;i++){
  const s=sc.inv[i];
  if(!s||ITEMS[s.id].type!=='heal')continue;
  if(itemCdGet(sc,s.id)>S.now){ // F7c(2)
   toast(ITEMS[s.id].n+' is on cooldown','bad');return;}
  applyHeal(s.id,sc);
  s.q--;if(s.q<=0)sc.inv[i]=null;
  if(S.ui==='inv'&&sc===panelChar())renderInv();
  return;
 }
 toast(sc.n+': no healing item (slot / inventory)','bad');
}
function useBuffItem(){ // G: karakter TERSELEKSI (F7(2))
 const sc=selChar||diaz;
 if(S.state!=='playing'||sc.down)return;
 if(hasSt(sc,'STUNNED')){toast(sc.n+' is stunned','bad');return;}
 const bf=sc.slots.buff;
 if(bf&&itemCdGet(sc,bf.id)<=S.now){ // F7c(2)
  applyFoodBuff(bf.id,sc);
  bf.q--;if(bf.q<=0)sc.slots.buff=null;
  if(S.ui==='inv'&&sc===panelChar())renderInv();
  toast(ITEMS[bf.id].n+' — buff '+FOOD_BUFFS[bf.id].dur+'s','good');
  return;
 }
 for(let i=0;i<12;i++){
  const s=sc.inv[i];
  if(!s||ITEMS[s.id].type!=='buff')continue;
  if(itemCdGet(sc,s.id)>S.now){ // F7c(2)
   toast(ITEMS[s.id].n+' is on cooldown','bad');return;}
  applyFoodBuff(s.id,sc);
  s.q--;if(s.q<=0)sc.inv[i]=null;
  if(S.ui==='inv'&&sc===panelChar())renderInv();
  toast(ITEMS[s.id].n+' — buff '+FOOD_BUFFS[s.id].dur+'s','good');
  return;
 }
 toast(sc.n+': no buff item (slot / inventory)','bad');
}
// F12.6: Vikry cover — within 1 block (Manhattan) dari barricade FLOOR-type
// yang DIA bangun sendiri: Sandbag / Construction Barrier / Concrete Barrier.
// Makeshift (access all) & Reinforced (entry-type) TIDAK dihitung. Barricade
// floor disimpan di `traps` Map (via addTrap karena spot='floor').
const VIKRY_COVER_TYPES=new Set(['sandbag','constr','concrete']);
function inCover(ch){
 if(ch.id!=='vikry')return false;
 const x=Math.floor(ch.x),y=Math.floor(ch.z);
 for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){
  const t=traps.get((x+dx)+','+(y+dy));
  if(t&&VIKRY_COVER_TYPES.has(t.id)&&t.owner===ch)return true;
 }
 return false;
}
function updateChar(ch,dt){ // F7b: + revive channel §4.4
 if(S.state!=='playing')return;
 if(offField(ch))return;               // §13: absen dari medan
 if(ch.down){ch._tgt=null;return;}      // tumbang — tak bisa apa pun
 // F10.10.3: seat mode — auto-stand kalau kena damage, kalau tidak lock + regen
 if(ch.seat){
  if(S.now-ch.lastHit<.5){endSeat(ch);}
  else{
   ch.buffs=ch.buffs.filter(b=>S.now<b.until);
   ch.es=effStats(ch);
   ch.path=[];ch.lock=null;ch.state='idle';ch._tgt=null;
   const rate=ch.seat.kind==='sleep'?10:5;
   ch.hp=Math.min(ch.es.hpMax,ch.hp+rate*dt);
   return;
  }
 }
 ch.buffs=ch.buffs.filter(b=>S.now<b.until);
 if(ch._medan&&S.now>=ch._medan.until)ch._medan=null; // F8a(3): Medan berakhir
 if(ch._brrrt&&S.now>=ch._brrrt){ch._brrrt=null;ch._reloadMul=1.5; // D36: berakhir → reload berikut +50%
  toast('BRRRT over — next reload +50%','bad');}
 if(ch._storm&&S.now>=ch._storm)ch._storm=null;
 if(ch._gorilla&&S.now>=ch._gorilla){ch._gorilla=null;ch._reloadMul=1.7; // D42
  toast('GORILLA MODE over — next reload +70%','bad');}
 if(ch._qs&&S.now>=ch._qs)ch._qs=null;
 // F7(3): pasif Diaz — killstack habis → cooldown aktivasi 10 dtk (§21.1)
 if(ch._ks&&ch._ks.stacks>0&&S.now>=ch._ks.until){
  ch._ks.stacks=0;ch._ks.cdUntil=S.now+10;
 }
 ch._inCover=inCover(ch); // F9d D46: deteksi cover Vikry (semua char dihitung, hanya Vikry dipakai)
 // F10.4: track hadStatus — sekali kena apa pun, flag nyala untuk "No Effect"
 if(ch.jc&&!ch.jc.hadStatus
  &&(hasSt(ch,'STUNNED')||hasSt(ch,'SLOWED')||hasSt(ch,'BURNING')||hasSt(ch,'MARKED')))
  ch.jc.hadStatus=1;
 ch.es=effStats(ch);
 if(ch.hp>ch.es.hpMax)ch.hp=ch.es.hpMax;
 if(!ch._dyingWarned&&ch.hp<15){ // F9b.5: sekarat — lapor SEKALI per episode
  ch._dyingWarned=true;
  chatPush('dying',ch);
 }
 if(ch._dyingWarned&&ch.hp>ch.es.hpMax*.35)ch._dyingWarned=false; // reset setelah pulih
 tickBurn(ch,dt,true);
 if(S.state!=='playing'||ch.down)return;
 if(ch.regen&&S.now<ch.regen.until&&!(ch._medan&&S.now<ch._medan.until)) // F8a(3) D5
  ch.hp=Math.min(ch.es.hpMax,ch.hp+ch.regen.rate*dt);
 // AUTO-HEAL §13 — HP < 80% → Recovery Slot sendiri
 if(ch.autoHeal&&ch.hp<ch.es.hpMax*.8&&!(ch._medan&&S.now<ch._medan.until)){ // F8a(3) D5
  const rec=ch.slots.rec;
  if(rec&&itemCdGet(ch,rec.id)<=S.now){ // F7c(2)
   const id=rec.id;
   applyHeal(id,ch);
   rec.q--;if(rec.q<=0)ch.slots.rec=null;
   toast('AUTO-HEAL: '+ch.n+' — '+ITEMS[id].n,'good');
   chatPush('heal',ch); // F9b.5
   if(S.ui==='inv'&&ch===panelChar())renderInv();
  }
 }
 // AUTO-BUFF — buff makanan habis → Buff Slot sendiri
 if(ch.autoBuff&&!ch.buffs.some(b=>b.food&&S.now<b.until)){
  const bf=ch.slots.buff;
  if(bf&&itemCdGet(ch,bf.id)<=S.now){ // F7c(2)
   const id=bf.id;
   applyFoodBuff(id,ch);
   bf.q--;if(bf.q<=0)ch.slots.buff=null;
   toast('AUTO-BUFF: '+ch.n+' — '+ITEMS[id].n,'good');
   chatPush('buff',ch); // F9b.5
   if(S.ui==='inv'&&ch===panelChar())renderInv();
  }
 }
 if(hasSt(ch,'STUNNED')){ch.path=[];ch.state='idle';ch._tgt=null;
  if(ch._revive)cancelRevive(ch); // F7b: stun memutus channel
  return;}
 if(ch.constr){ch.path=[];ch.state='idle';} // F7(3b): konstruksi MILIK ch
 if(ch._mot){ch.path=[];} // F7(3): MOTIVATED — terkunci di tempat (§4.2)
 if(throwState&&throwState.ch===ch)ch.path=[]; // F9c: mode lempar — lockdown §4.2
 if(ch._medan&&S.now<ch._medan.until)ch.path=[]; // F8a(3) D5: Medan terkunci
 // F7b: REVIVE — channel berjalan; reviver terkunci & tak menembak (§4.4)
 if(ch._revive){
  const rv=ch._revive;
  if(!rv.tgt.down||rv.tgt.recovering)ch._revive=null; // pasien tak perlu lagi
  else{
   ch.path=[];ch.state='idle';
   rv.t+=dt;
   if(rv.t>=rv.dur)completeRevive(ch);
  }
 }
 if(ch.hp<ch.es.hpMax&&S.now-ch.lastHit>5)
  ch.hp=Math.min(ch.es.hpMax,ch.hp+dt);
 if(ch.path.length){
  // F8a(3b): RESERVE BLOCK §4.2 — pemilik = SUDAH settle di blok
  // ATAU sedang menuju blok itu (yang lebih dekat menang; jarak sama = keduanya maju,
  // resolve belakangan saat satu settle). Mundur ke blok CURRENT FLOOR (selalu valid).
  if(ch.path.length===1){
   const fn=ch.path[0],cx=fn[0]+.5,cz=fn[1]+.5;
   const dMe=Math.hypot(ch.x-cx,ch.z-cz);
   const occ=chars.find(o=>{
    if(o===ch||o.down||offField(o))return false;
    if(!o.path.length) // settle di blok tujuan → pemilik mutlak
     return Math.floor(o.x)===fn[0]&&Math.floor(o.z)===fn[1];
    const last=o.path[o.path.length-1]; // en-route menuju blok yang sama?
    if(last[0]!==fn[0]||last[1]!==fn[1])return false;
    return Math.hypot(o.x-cx,o.z-cz)<dMe; // dia lebih dekat → dia pemilik
   });
   if(occ){
    const cur=[Math.floor(ch.x),Math.floor(ch.z)];
    ch.path=(cur[0]!==fn[0]||cur[1]!==fn[1])?[cur]:[]; // FIX(1): bungkus node — path=[[x,z]], bukan [x,z]
    ch.state=ch.path.length?'moving':'idle';
    toast(ch.n+' stopped — '+occ.n+' has that block','bad');
   }
  }
 }
 if(ch.path.length){
  ch.state='moving';
  const[tx,tz]=ch.path[0],wx=tx+.5,wz=tz+.5;
  const dx=wx-ch.x,dz=wz-ch.z,l=Math.hypot(dx,dz)||1;
  const step=Math.min(l,ch.es.agi*(1-slowPct(ch))/25*dt);
  ch.x+=dx/l*step;ch.z+=dz/l*step;ch.walkPhase+=dt*9;
  const si=Math.floor(ch.walkPhase/Math.PI);
  if(si!==ch._si){ch._si=si;SFX(si%2?'stepR':'stepL');}
  if(l<.05){ch.x=wx;ch.z=wz;ch.path.shift();
   ch._lastNode=[tx,tz];
   if(!ch.path.length)ch.state='idle';}
 }else ch.state='idle';
 const tgt=ch._tgt=currentTarget(ch);
 let fx=0,fz=0;
 if(ch._revive&&ch._revive.tgt){ // F7b: hadapi pasien
  fx=ch._revive.tgt.x-ch.x;fz=ch._revive.tgt.z-ch.z;
 }else if(ch.state==='moving'&&ch.path.length){
  fx=ch.path[0][0]+.5-ch.x;fz=ch.path[0][1]+.5-ch.z;
 }else if(tgt){fx=tgt.x-ch.x;fz=tgt.z-ch.z;}
 if(fx||fz){
  const ta=Math.atan2(fx,fz);
  let d=ta-ch.mesh.rotation.y;
  while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;
  ch.mesh.rotation.y+=d*Math.min(1,dt*10);
 }
 if(ch.reloadT>0){
  ch.reloadT-=dt;
  if(ch.reloadT<=0){
   ch._relN=(ch._relN||0)+1; // F9d: counter reload Sobel
   ch.mag=charMagMax(ch); // F10.2.4: OFF T3 +2 · Sobel ×2 tiap reload ke-5
   if(ch.id==='sobel'&&ch._relN%5===0)toast('SOBEL: extended magazine — '+ch.mag+' rounds','good')
   if(ch.id==='raptor'&&ch._lsBonus){ch._lsBonus=null; // F9d: bonus hangus saat mag baru terpasang
    ch.buffs=ch.buffs.filter(b=>!b.lastshot);}
   if(ch.jc)ch.jc.reloads++; // F10.4
   ch.reloadT=0;
  }
 }else if(ch.mag<=0){
  ch.reloadT=charReloadTime(ch); // F10.2.4: helper (SPD · _reloadMul · OFF T2)
  if(ch._reloadMul)ch._reloadMul=null; // sekali pakai
  SFX(RELOAD_SFX[ch.id]||'reload');
  floatText(ch.x,ch.z,'RELOADING!','reload',1.2);
 }
 ch.fireT=Math.max(0,ch.fireT-dt);
 if(ch._revive){ // F7b: reviver tidak menembak
  ch._mot=null;
 }
 // F9b D35 + F9c: BURST BERUNTUN — peluru #2..N tiap 0.12 dtk, kipas per peluru
 else if(ch._burst){
  ch._burst.t-=dt;
  if(ch._burst.t<=0){
   ch._burst.t=.12;ch._burst.left--;
   const bt=currentTarget(ch)||ch._tgt;
   const W=CHARS[ch.id].weapon,n=W.bullets,fan=(W.fan||0)*Math.PI/180;
   if(bt){
    const done=W.bullets-1-ch._burst.left;
    const base=Math.atan2(bt.x-ch.x,bt.z-ch.z);
    const a=(n>1&&fan)?base+((done/(n-1))-.5)*fan:base;
    fireBullet(ch,bt,ch._burst.cyc,done,{dx:Math.sin(a),dz:Math.cos(a)}); // FIX(30): cyc milik burst ini
   }
   if(!bt&&W.sfxOnce)sfxStop(GUN_SFX[ch.id]); // F9c fail-safe: semua target hilang → suara berhenti
   if(ch._burst.left<=0){ch._burst=null;ch.fireT=fireInterval(ch);}
  }
 }
 // F7(3): MOTIVATED — rentetan 6 peluru
 // FIX(4): tanpa target → tembak lurus ke arah hadap terakhir (phantom target),
 // rentetan TETAP dihabiskan §4.2 — tak peduli ada target atau tidak
 else if(ch._mot){
  if(ch.reloadT<=0&&ch.mag>=CHARS[ch.id].weapon.bullets&&ch.fireT===0){ // F8a(3b)
   const t2=tgt||{x:ch.x+Math.sin(ch.mesh.rotation.y)*CHARS[ch.id].weapon.range,
    z:ch.z+Math.cos(ch.mesh.rotation.y)*CHARS[ch.id].weapon.range};
   fire(ch,t2);ch.fireT=.15;ch._mot.left--;
   if(ch._mot.left<=0)ch._mot=null;
  }
 }
 // F7(3): auto-fire SEMUA karakter — F9c: override aktif Brrrt (mag freeze, kipas 60°, 15 pierce)
 else if(ch.state==='idle'&&ch.reloadT<=0&&tgt&&ch.fireT===0&&!ch.constr
  &&(ch.mag>=CHARS[ch.id].weapon.bullets||(ch._brrrt&&S.now<ch._brrrt))){
  if(ch._brrrt&&S.now<ch._brrrt)brrrtVolley(ch,tgt); // D36
  else fire(ch,tgt);
  ch.fireT=fireInterval(ch);
 }
}
// ================= 17. UPDATE: ZOMBIE =================
function spawnZombie(kind,px,pz){
 if(!kind&&zombies.length>=CFG.maxAlive)return;
 let typeName=kind;
 if(!typeName)typeName=Math.random()<.3?'Walker':pick(['Runner','Crawler','Biter','Shambler','Screecher','Spitter']); // F12.13: +Spitter
 else if(typeName==='elite')typeName=pick(['Bloater','Creeper','Sprinter']);
 else if(typeName==='boss')typeName=pick(['PZero','ZAlpha']);
 const T=ZTYPES[typeName],sc=Math.floor(night.n/10);
 const[cx,cy]=px!==undefined?[Math.floor(px),Math.floor(pz)]:pick(SPAWN);
 const z={x:cx+.5+rnd(-.25,.25),z:cy+.5+rnd(-.25,.25),
  T,type:typeName,tierName:ZTYPE_LABEL[typeName]||typeName,tier:T.boss?'boss':T.elite?'elite':'normal', // P8: boss = nama lengkap
  hp:T.hp,max:T.hp,atk:T.atk+sc, // P8: zombie TANPA DEF — atk ke char masih minus DEF char
  path:[],repathT:rnd(0,.8),atkT:0,walkPhase:rnd(0,6),
  dying:false,dyingT:0,retreat:false,
  st:{},_tk:null,zoneAcc:0,flyY:0,sk:{},
  ox:T.big?0:rnd(-.22,.22),oz:T.big?0:rnd(-.22,.22),
  spitCd:rnd(0,1), // F12.13: cooldown spit Spitter (init random biar tidak barrage)
  mesh:makeZombieMesh(typeName)};
 if(T.elite||T.boss){
  // P8: nama key skill tidak berubah (outbreak/roar), hanya efeknya yang swap
  const SK={Bloater:['gas'],Creeper:['pounce'],Sprinter:['frenzy','slash'],
   PZero:['outbreak','swipe'],ZAlpha:['roar','slam']};
  for(const s in SK)z.sk[s]=S.now+rnd(3,6); // F10.5-BUGFIX: SK = Object → for...in (iterate keys). for...of throw "SK is not iterable" — dormant sejak F5, muncul saat elite spawn pertama (N3).
  if(T.elite){toast('AN ELITE APPROACHES — '+typeName.toUpperCase(),'bad');SFX('eliteSpawn');
  chatPush('elite',chatReporter(),typeName.toUpperCase());} // F9b.5
 }
 z.mesh.userData.entity={kind:'zombie',ref:z};
 z.mesh.position.set(z.x,0,z.z);
 scene.add(z.mesh);zombies.push(z);
 return z;
}
// F12.13-perf: A* time-slicing. Budget per frame — cegah spike saat banyak
// zombie repath bersamaan (mis. wave baru spawn, semua dari pintu sama).
// Zombie yang tidak dapat slot → repathT=0 (defer ke frame depan).
// Kapasitas 4 × 60fps = 240 calls/detik, >> kebutuhan ~89/detik untuk 80
// zombie. Headroom 2.7× — tidak ada zombie kelaparan.
const AStarBudget={used:0,max:4};
function astarResetBudget(){AStarBudget.used=0;}
function updateZombie(z,dt){
 const T=z.T;
 if(z.retreat){
  z.mesh.position.y-=dt*.9;
  z.mesh.scale.multiplyScalar(1-dt*.7);
  if(z.mesh.position.y<-1.2){scene.remove(z.mesh);zombies.splice(zombies.indexOf(z),1);}
  return;
 }
 if(z.dying){
  z.dyingT+=dt;
  if(z.dyingT>2){ // F5: ragdoll — part dikelola corpseParts (2 dtk)
   scene.remove(z.mesh);removeOverhead(z);
   zombies.splice(zombies.indexOf(z),1);
  }
  return;
 }
 z.flyY=0;
 if(z.pounce){ // Creeper: lompatan busur — target tersimpan di z.pounce.tgt
  z.pounce.t+=dt;const p=Math.min(1,z.pounce.t/z.pounce.dur);
  z.x=lerp(z.pounce.sx,z.pounce.tx,p);
  z.z=lerp(z.pounce.sz,z.pounce.tz,p);
  z.flyY=Math.sin(Math.PI*p)*1.6;
  z.mesh.rotation.y=Math.atan2(z.pounce.tx-z.pounce.sx,z.pounce.tz-z.pounce.sz);
  if(p>=1){
   const pt=z.pounce.tgt;z.pounce=null;
   spawnDebris(z.x,.2,z.z,0x3a2a1a,5);
   if(pt&&!pt.down&&!offField(pt)){ // F7(2): target tumbang saat melayang → whiff
    hurtChar(pt,60);applyStun(pt,3);
    floatText(pt.x,pt.z,'-60','dmgC');
   }
  }
  return;
 }
 if(z.slamT>0){ // Alpha: lompat slam
  z.slamT-=dt;
  z.flyY=Math.sin(Math.PI*clamp(1-z.slamT/.45,0,1))*.9;
  return;
 }
 if(z.riseT>0){ // summon PZ muncul dari tanah
  z.riseT-=dt;
  z.flyY=-1.4*clamp(z.riseT/.5,0,1);
  return;
 }
 tickBurn(z,dt,false);
 if(z.dying)return;
 if(hasSt(z,'STUNNED')){z.path=[];return;}
 const tc=nearestChar(z.x,z.z); // F7(2): incar char HIDUP terdekat
 if(!tc)return;                 // semua tumbang → defeat sudah dipicu charDown
 if(z.rabid){ // Sprinter: 3 tebasan, total (3×ATK)−DEF (keputusan #4)
  const rt=z.rabid.tgt;
  if(!rt||rt.down||offField(rt))z.rabid=null; // F7(2): korban tumbang → berhenti
  else{
   z.rabid.t-=dt;
   if(z.rabid.t<=0){
    z.rabid.t=.3;z.rabid.hits--;
    flashUnit(rt.mesh,.1);fxSlash(rt.x,rt.z);SFX('slash');
    const d=z.rabid.hits<=0?z.rabid.dLast:z.rabid.d1;
    rt.hp-=d;rt.lastHit=S.now;
    armorWear(rt,d);              // §6.5 per karakter
    cancelConstruction(rt);
    if(rt._revive)cancelRevive(rt); // F7b
    charHurtUI(); // F12.4: rename dari diazHurtUI
    floatText(rt.x,rt.z,'-'+d,'dmgC');
    if(rt.hp<=0){rt.hp=0;charDown(rt);z.rabid=null;return;}
    if(z.rabid.hits<=0)z.rabid=null;
   }
   z.mesh.rotation.y=Math.atan2(rt.x-z.x,rt.z-z.z);
   return;
  }
 }
 if(T.elite||T.boss)updateZSkills(z,dt,tc);
 if(z.type==='Creeper'&&!z.shadowDone&&z.hp<z.max/2){ // pasif Shadow Step
  z.shadowDone=true;z.shdwUntil=S.now+5;
  floatText(z.x,z.z,'SHADOW STEP!','skill');
 }
 const distC=Math.hypot(tc.x-z.x,tc.z-z.z);
 // F12.13: SPITTER — spit jika target dalam 1.5–7 blok + LOS. Tetap jalan
 // (tidak return) — supaya kelihatan seperti meludah sambil mendekat.
 if(z.T.spit){
  if(z.spitCd>0)z.spitCd-=dt;
  if(z.spitCd<=0 && distC>=1.5 && distC<=z.T.spitRange && los(z.x,z.z,tc.x,tc.z)){
   z.spitCd=z.T.interval;
   spawnSpit(z,tc);
   z.mesh.rotation.y=Math.atan2(tc.x-z.x,tc.z-z.z);
  }
 }
 // F10.10.3: toleransi +0.6 saat target seat (char di sofa/kursi/kasur)
 if(S.state==='playing'&&distC<T.meleeRange+(tc.seat?.6:0)&&los(z.x,z.z,tc.x,tc.z)){
  z.path=[];z.atkT-=dt;
  if(z.atkT<=0){
   z.atkT=T.interval;
   const dmg=Math.max(1,Math.round(z.atk*zAtkMul(z)-tc.es.def));
   tc.hp-=dmg;tc.lastHit=S.now;
   if(tc.id==='memet'&&memetMarkSlot(z)) // FIX(45) P4: GDD §21.2 — zombie yang menyerang Memet jadi MARKED
    applyMark(z,1.2,5,'memet');
   armorWear(tc,z.atk*zAtkMul(z)); // §6.5 (F7(2): per karakter)
   floatText(tc.x,tc.z,'-'+dmg,'dmgC');
   flashUnit(tc.mesh,.12);SFX('charHurt'); // F12.4
   cancelConstruction(tc);
   if(tc._revive)cancelRevive(tc); // F7b
   charHurtUI(); // F12.4
   if(tc.hp<=0)charDown(tc); // F7(2)
  }
  z.mesh.rotation.y=Math.atan2(tc.x-z.x,tc.z-z.z);
  return;
 }
 if(z.path.length){
  const[nx,ny]=z.path[0],k2=nx+','+ny,wc=cellAt(nx,ny);
  if((wc==='X'||wc==='#')&&Math.hypot(nx+.5-z.x,ny+.5-z.z)<1.25){
   // F5: zombie besar menyerang tembok
   const w=getWall(nx,ny);
   z.atkT-=dt;
   if(z.atkT<=0){
    z.atkT=T.interval;
    damageWall(w,z);
    spawnDebris(nx+.5,1,ny+.5,0x4a3827,3);
   }
   z.mesh.rotation.y=Math.atan2(nx+.5-z.x,ny+.5-z.z);
   return;
  }
  const bk=barricades.get(k2);
  if(bk&&Math.hypot(nx+.5-z.x,ny+.5-z.z)<1.35){
   z.atkT-=dt;
   if(z.atkT<=0){
    z.atkT=T.interval;
    damageBarricade(bk,z,z.charge?2:1); // frenzy = ×2 (§22.2)
    spawnDebris(nx+.5,.8,ny+.5,0x7a5c38,2);
   }
   z.mesh.rotation.y=Math.atan2(nx+.5-z.x,ny+.5-z.z);
   return;
  }
 }
 if(z.charge&&(S.now>z.charge.until||!barricades.has(z.charge.bk.x+','+z.charge.bk.y)))z.charge=null;
 z.repathT-=dt;
 if(!z.path.length||z.repathT<=0){
  // F12.13-perf: cek budget A* dulu. Kalau penuh, defer ke frame depan
  // (repathT=0 → akan dicoba lagi). Zombie tetap pakai path lama sampai
  // dapat slot — tidak freeze.
  if(AStarBudget.used>=AStarBudget.max){
   z.repathT=0;
  }else{
   AStarBudget.used++;
   // F12.13-perf: jitter .9→.9+rnd(0,.3) supaya repath tidak re-sync
   // (semua zombie balik ke .9s barengan setelah repath pertama).
   z.repathT=.9+rnd(0,.3);
   let tx=Math.floor(tc.x),ty=Math.floor(tc.z),passFn=T.big?passBig:passZomb; // F7(2)
   if(z.charge){tx=z.charge.bk.x;ty=z.charge.bk.y;passFn=passZomb;}
   // F10.10.3: char seat di cell furniture (impassable) → target cell tetangga
   if(tc.seat&&!passFn(tx,ty)){
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){
     if(passFn(tx+dx,ty+dy)){tx+=dx;ty+=dy;break;}
    }
   }
   const p=astar(Math.floor(z.x),Math.floor(z.z),tx,ty,passFn);
   z.path=p||[];
  }
 }
 if(z.path.length){
  const[nx,ny]=z.path[0];
  const wx=nx+.5+z.ox,wz=ny+.5+z.oz;
  const dx=wx-z.x,dz=wz-z.z,l=Math.hypot(dx,dz)||1;
  let agi=T.agi*(1-slowPct(z));
  if(z.shdwUntil&&S.now<z.shdwUntil)agi*=1.5;
  if(z.charge)agi=90; // Frenzy Charge (§22.2)
  const step=Math.min(l,agi/25*dt);
  z.x+=dx/l*step;z.z+=dz/l*step;
  z.walkPhase+=dt*(3+agi/12);
  z.mesh.rotation.y=Math.atan2(dx,dz);
  if(l<.08){z.x=wx;z.z=wz;z.path.shift();}
 }
}
// ================= 17b. SKILL ELITE & BOSS (§22.2-3) =================
function zAtkMul(z){ // Alpha Roar: +30% semua zombie KECUALI Alpha sendiri
 return(S.zBuff&&S.now<S.zBuff.until&&z.type!=='ZAlpha')?S.zBuff.mul:1;
}
function updateZSkills(z,dt,tc){ // F7(2): skill musuh mengincar char terdekat
 const dist=Math.hypot(tc.x-z.x,tc.z-z.z),sk=z.sk;
 if(z.type==='Bloater'){
  if(sk.gas<=S.now&&dist<=3&&los(z.x,z.z,tc.x,tc.z)){
   sk.gas=S.now+10;gasSpew(z,tc);
  }
 }else if(z.type==='Creeper'){
  if(sk.pounce<=S.now&&dist<=4&&dist>1.2&&los(z.x,z.z,tc.x,tc.z)){
   sk.pounce=S.now+12;
   z.pounce={sx:z.x,sz:z.z,tx:tc.x,tz:tc.z,tgt:tc,t:0,dur:.5}; // F7(2): simpan target
   floatText(z.x,z.z,'POUNCE!','skill');SFX('pounce');
  }
 }else if(z.type==='Sprinter'){
  if(!z.charge&&sk.frenzy<=S.now){
   let best=null,bd=16; // 4 blok
   for(const bk of barricades.values()){
    const d=(bk.x+.5-z.x)**2+(bk.y+.5-z.z)**2;
    if(d<bd){bd=d;best=bk;}
   }
   if(best){
    sk.frenzy=S.now+15;
    z.charge={bk:best,until:S.now+4};z.path=[];
    floatText(z.x,z.z,'FRENZY CHARGE!','skill');SFX('frenzy');
   }
  }
  if(sk.slash<=S.now&&dist<1.4+(tc.seat?.6:0)){ // F10.10.3
   sk.slash=S.now+8;
   const dmg=Math.max(1,Math.round(3*z.atk*zAtkMul(z)-tc.es.def));
   z.rabid={tgt:tc,hits:3,t:.15,d1:Math.floor(dmg/3),dLast:dmg-2*Math.floor(dmg/3)};
   floatText(z.x,z.z,'RABID SLASH!','skill');SFX('rabid');
  }
 }else if(z.type==='PZero'){
  if(sk.outbreak<=S.now){ // P8: skill swap — PZ skill 1 = Outbreak Cry (SLOW semua char)
   sk.outbreak=S.now+30;
   outbreakCry(z);
  }
  if(sk.swipe<=S.now&&dist<=3&&los(z.x,z.z,tc.x,tc.z)){
   sk.swipe=S.now+12;infectiousSwipe(z,tc);
  }
 }else if(z.type==='ZAlpha'){
  if(sk.roar<=S.now){ // P8: skill swap — ZAlpha skill 1 = Alpha Roar (summon 4 normal)
   sk.roar=S.now+25;
   alphaRoar(z);
  }
  if(sk.slam<=S.now&&dist<=2.2&&los(z.x,z.z,tc.x,tc.z)){
   sk.slam=S.now+15;groundSlam(z);
  }
 }
}
function gasSpew(z,tc){ // §22.2: BURNING 10 HP/s × 5 dtk — target tc
 fxSphere(lerp(z.x,tc.x,.35),.9,lerp(z.z,tc.z,.35),0x6a9a48,1.2,1.0);
 fxSphere((z.x+tc.x)/2,.9,(z.z+tc.z)/2,0x7aa050,1.5,1.2);
 fxFlash(z.x,z.z,0x7aff50);
 applyBurn(tc,10,5);
 floatText(z.x,z.z,'GAS SPEW!','skill');SFX('bloater_gas'); // F12.3
}
function bloaterBoom(z){ // pasif kematian §22.2 — racun kena semua char hidup ≤3
 fxFlash(z.x,z.z,0x7aff50);
 fxSphere(z.x,.8,z.z,0x7aa050,2.4,1.0);
 fxRing(z.x,z.z,0x7aff50,3,.6);
 spawnDebris(z.x,.7,z.z,0x5a7a40,12);
 floatText(z.x,z.z,'TOXIC EXPLOSION!','skill');SFX('bloater_die'); // F12.3: 1 file (was boom+gas 2 layer)
 for(const ch of chars){ // F7(2)
  if(ch.down||offField(ch))continue;
  if(Math.hypot(ch.x-z.x,ch.z-z.z)<=3){
   hurtChar(ch,50);
   floatText(ch.x,ch.z,'-50','dmgC');
  }
 }
 zones.push({x:z.x,z:z.z,t:5,mesh:makeZoneMesh(z.x,z.z)});
}
function summonNear(z,n){ // Outbreak Call: 4 normal dari tanah
 let s=0;
 for(let t=0;t<30&&s<n;t++){
  const x=Math.floor(z.x)+ri(-2,2),y=Math.floor(z.z)+ri(-2,2);
  const c=cellAt(x,y);
  if(c!=='_'&&c!=='o'&&c!=='e'&&c!=='.')continue;
  const zz=spawnZombie(Math.random()<.5?'Walker':'Runner',x+.5,y+.5);
  if(zz){zz.riseT=.5;spawnDebris(x+.5,.2,y+.5,0x3a2a1a,5);}
  s++;
 }
}
function infectiousSwipe(z,tc){ // §22.3: true dmg base ATK + SLOWED — sapuan 90°
 const ang=Math.atan2(tc.x-z.x,tc.z-z.z);
 z.mesh.rotation.y=ang;
 fxFan(z.x,z.z,ang,0xffa050,3,.5);
 fxRing(z.x,z.z,0xffa050,3,.5);
 fxFlash(z.x,z.z,0xffa050);
 for(const ch of chars){ // F7(2): semua char hidup dalam sapuan
  if(ch.down||offField(ch))continue;
  const dx=ch.x-z.x,dz=ch.z-z.z,d=Math.hypot(dx,dz);
  if(d>3)continue;
  let da=Math.atan2(dx,dz)-ang;
  while(da>Math.PI)da-=Math.PI*2;while(da<-Math.PI)da+=Math.PI*2;
  if(Math.abs(da)<=Math.PI/4){ // dalam fan 90°
   hurtChar(ch,z.T.atk);       // base ATK — "based on base ATK"
   applySlow(ch,.5,3,'zomb');
   floatText(ch.x,ch.z,'-'+z.T.atk,'dmgC');
  }
 }
 floatText(z.x,z.z,'INFECTIOUS SWIPE!','skill');SFX('swipe');
}
function outbreakCry(z){ // P8: PZ skill 1 — SLOW semua char (efek lama Alpha Roar, tanpa buff zombie)
 for(const ch of chars)if(!ch.down&&!offField(ch))applySlow(ch,.5,4,'zomb');
 fxRing(z.x,z.z,0xd9a13b,6,.9);
 fxRing(z.x,z.z,0xffa050,4,.7);
 fxFlash(z.x,z.z,0xffc070);
 floatText(z.x,z.z,'OUTBREAK CRY!','skill');SFX('outbreak_cry'); // F12.3b: file khusus (was SFX('roar'))
 toast('OUTBREAK CRY — ALL characters SLOWED 50%','bad');
}
function alphaRoar(z){ // P8: ZAlpha skill 1 — summon 4 normal + buff ATK zombie +30% (15s).
 // ZAlpha = "pemimpin" — auman bikin zombie lain lebih sadis (tema dipertahankan dari GDD).
 S.zBuff={until:S.now+15,mul:1.3}; // aktifkan buff global zombie
 fxRing(z.x,z.z,0xffa050,4,.7);
 fxFlash(z.x,z.z,0xffc070);
 floatText(z.x,z.z,'ALPHA ROAR!','skill');SFX('alpha_roar'); // F12.3
 summonNear(z,4);
 toast('ALPHA ROAR — 4 zombies summoned · zombie ATK +30% (15s)','bad');
}
function groundSlam(z){ // §22.3 + keputusan #5 (fix 150) — semua char ≤2 blok
 z.slamT=.45;
 fxFlash(z.x,z.z,0xff8040);
 fxRing(z.x,z.z,0xffa050,2.2,.5);
 spawnDebris(z.x,.4,z.z,0x4a3a28,10);
 floatText(z.x,z.z,'GROUND SLAM!','skill');SFX('slam');
 for(const ch of chars){ // F7(2)
  if(ch.down||offField(ch))continue;
  if(Math.hypot(ch.x-z.x,ch.z-z.z)<=2){
   hurtChar(ch,150);
   applyStun(ch,4);
  }
 }
 let best=null,bd=9; // hancurkan barikade terdekat ≤3 blok
 for(const bk of barricades.values()){
  const d=(bk.x+.5-z.x)**2+(bk.y+.5-z.z)**2;
  if(d<bd){bd=d;best=bk;}
 }
 if(best)destroyBarricade(best);
}
// ================= 18. UPDATE: PELURU =================
function updateBullets(dt){
 for(const b of bullets.slice()){
  const step=CFG.bulletSpeed*dt;
  const px=b.x, pz=b.z;                // ← simpan posisi lama utk segment check
  b.x+=b.dx*step;b.z+=b.dz*step;b.trav+=step;
  const by=lerp(b.y0,.78,clamp(b.trav/b.max,0,1));
  if(b.mesh)b.mesh.position.set(b.x,by,b.z);

  const wallHit=blocksBul(Math.floor(b.x),Math.floor(b.z));
  const maxed  =b.trav>=b.max;

  // ---- deteksi tabrakan berbasis SEGMEN (anti-tunneling) ----
  // F12.9: multi-block hitbox untuk Bloater (2×2, hx=hz=1) & PZ (3×3,
  // hx=hz=1.5). Segment di-sample tiap ≤0.5 blok (bullet max ~0.75 blok/frame
  // @dt=.05 · 15 u/dtk → cukup 2 iterasi). Hit kalau ada sample point di dalam
  // AABB zombie. Untuk zombie ukuran 1×1, tetap circle radius (lebih murah).
  let hit=null;
  {
   const sdx=b.x-px, sdz=b.z-pz;
   const slen2=sdx*sdx+sdz*sdz;
   const segLen=Math.sqrt(slen2);
   for(const z of zombies){
    if(z.dying||z.retreat)continue;
    if(b.hitSet.has(z))continue;        // D28: peluru pierce tak kena 2×
    if(z.T.occ){
     const hx=z.T.occ.hx, hz=z.T.occ.hz;
     const rxmin=z.x-hx, rxmax=z.x+hx;
     const rzmin=z.z-hz, rzmax=z.z+hz;
     const steps=Math.max(1,Math.ceil(segLen/.5));
     let inside=false;
     for(let i=0;i<=steps;i++){
      const t=i/steps;
      const sx=px+sdx*t, sz=pz+sdz*t;
      if(sx>=rxmin&&sx<=rxmax&&sz>=rzmin&&sz<=rzmax){inside=true;break;}
     }
     if(inside){hit=z;break;}
    }else{
     const hr=(z.T.hitR||.4)+.15;       // toleransi radius (normal 1×1)
     let t=0;
     if(slen2>1e-6){
      t=((z.x-px)*sdx+(z.z-pz)*sdz)/slen2;
      if(t<0)t=0;else if(t>1)t=1;
     }
     const cx=px+sdx*t, cz=pz+sdz*t;
     const dd=(z.x-cx)*(z.x-cx)+(z.z-cz)*(z.z-cz);
     if(dd<hr*hr){hit=z;break;}
    }
   }
  }

  // ---- peluru explosive (Erry): ledak saat impact apa pun ----
  if(b.boom){
   if(hit||wallHit||maxed){
    const dmg=b.atk*(b.aoeP!==undefined?b.aoeP:1);
    explode(b.x,b.z,b.aoeR||3,dmg,false,b.owner);
    killBullet(b);
   }
   continue;
  }

  // ---- peluru biasa: REGISTRASI HIT (inilah yang hilang sebelumnya) ----
  if(hit){
   ifhit(b,hit);
   if(!bullets.includes(b))continue;   // non-pierce sudah di-kill oleh ifhit
  }

  if(wallHit||maxed){killBullet(b);continue;}
  if(!b.cyc){killBullet(b);continue;}  // FIX(30): yatim — bersihkan
 }
}
// ===== 18b. SPITTER PROJECTILE (F12.13) =====
// Proyektil ludah hijau. Busur 0.45s, AoE impact radius 1.0 blok.
// Siapa pun (karakter) di dalam radius impact kena BURN 10 HP/s × 5s
// (ignore DEF — applyBurn bekerja langsung ke HP). Dodge: bergerak >1 blok
// dari titik impact selama 0.45s.
const spitFly=[];
function spawnSpit(z,tc){
 const m=new THREE.Mesh(new THREE.BoxGeometry(.14,.14,.14),
  new THREE.MeshBasicMaterial({color:0x40e040}));
 m.position.set(z.x,1.05,z.z);
 scene.add(m);
 spitFly.push({mesh:m,x0:z.x,z0:z.z,tx:tc.x,tz:tc.z,t:0,dur:.45,owner:z});
 SFX('gas');
}
function updateSpit(dt){
 for(const s of spitFly.slice()){
  s.t+=dt;
  const p=Math.min(1,s.t/s.dur);
  const x=lerp(s.x0,s.tx,p), z=lerp(s.z0,s.tz,p);
  const y=1.05+Math.sin(Math.PI*p)*1.1;
  s.mesh.position.set(x,y,z);
  s.mesh.rotation.x+=dt*8;
  s.mesh.rotation.y+=dt*6;
  if(p>=1){
   scene.remove(s.mesh);
   spitFly.splice(spitFly.indexOf(s),1);
   // impact AoE radius 1.0 — karakter yang tidak kabur kena burn
   for(const ch of chars){
    if(ch.down||offField(ch))continue;
    if(Math.hypot(ch.x-s.tx,ch.z-s.tz)<=1.0){
     applyBurn(ch,s.owner.T.spitBurnDps,s.owner.T.spitBurnT,s.owner);
     floatText(ch.x,ch.z,'SPIT!','skill');
    }
   }
   fxSphere(s.tx,.7,s.tz,0x40e040,1.0,.35);
  }
 }
}
function ifhit(b,hit){
 if(hit&&!b.cyc)return; // FIX(30): peluru yatim — hit tanpa cycle = buang peluru saja
 if(hit){
  if(b.hitSet.has(hit))return; // D28: peluru pierce tak mengenai korban yang sama 2×
  b.hitSet.add(hit);
  // F10.5-B: DAMAGE LANGSUNG per peluru — pure ATK, 1 peluru = 1 ATK (b.atk).
  // Multi-projectile (Vikry/Lele) sudah dibagi di fire() → tiap proyektil = ATK÷proj.
  // Tidak ada lagi akumulasi cyc.hits + resolveCycle untuk damage.
  const wasAlive=hit.hp>0;
  const dmg=Math.max(1,Math.round(b.atk));
  damageZombie(hit,dmg,b.owner);
  // Tracker cycle untuk passive berbasis total per-cycle (Lele bigHitHeal).
  b.cyc.hits.set(hit,(b.cyc.hits.get(hit)||0)+b.atk);
  // Passive Rehan — skill-kill refills Energy (per-hit, cek kill dari peluru ini)
  if(wasAlive&&hit.hp<=0&&b.owner.id==='rehan')rehanChainKill(b.owner);
  // F10.2.5: REC T4 — +1 HP per bullet that hits (silent)
  if(treeHas(b.owner,'rec',4))
   b.owner.hp=Math.min(b.owner.es.hpMax,b.owner.hp+1);
  // D33: on-hit status senjata
  if(b.slow)applySlow(hit,b.slow,b.slowT,'char');
  if(b.stun)applyStun(hit,b.stun);
  if(b.qsStun){ // F9c D43: STUN 3s, cd 3s per target
   if(!hit._qsCd||S.now>=hit._qsCd){applyStun(hit,3);hit._qsCd=S.now+3;}
  }
  if(b.burnP)applyBurn(hit,Math.max(1,b.atk*b.burnP),b.burnT,b.owner); // D31: atribusi src utk pasif Reza F9d
  if(b.owner.id==='bambang')applyMark(hit,1.5,5,'bambang'); // F8a(3) D6: + src
  // FIX(45) P4: Memet MARK — hook DIPINDAH ke updateZombie (musuh yang menyerang Memet
  // yang kena mark, sesuai GDD §21.2). Bukan saat Memet menembak.
  if(b.mot&&b.owner._motHitsLeft>0)bumpMot(b.owner); // F7(3): MOTIVATED per hit
  if(!b.pierce)killBullet(b); // D28: pierce MENERUS setelah kena
 }
}
function memetMarkSlot(z){ // F8a(3)+FIX(45) §21.2: maks 5 musuh (penyerang Memet) tertanda simultan
 const m=z.st&&z.st.MARKED;
 if(m&&m.src&&m.src.memet&&S.now<=m.src.memet.until)return true; // slot sendiri
 let n=0;
 for(const q of zombies){
  if(q.dying)continue;
  const mm=q.st&&q.st.MARKED;
  if(mm&&mm.src&&mm.src.memet&&S.now<=mm.src.memet.until)n++;
 }
 return n<5;
}
// F7(3): MOTIVATED — hit ke-n: ATK+20% lalu +10%/hit (maks +70% di hit ke-6)
function bumpMot(ch){
 ch._motHitsLeft--;
 ch.buffs=ch.buffs.filter(b=>!b.mot);
 const stacks=Math.min(6,6-ch._motHitsLeft);
 ch.buffs.push({until:S.now+10,dur:10,n:'MOTIVATED',
  atkP:.2+.1*(stacks-1),mot:true});
}

// ================= 19. UI =================
function toast(msg,cls){
 SFX('tick');
 const t=document.createElement('div');
 t.className='toast '+(cls||'');t.textContent=msg;
 $('toasts').appendChild(t);
 setTimeout(()=>{t.style.transition='opacity .5s';t.style.opacity=0;
  setTimeout(()=>t.remove(),500)},3400);
}
function banner(a,b){
 const el=$('banner');
 el.querySelector('.b1').textContent=a;
 el.querySelector('.b2').textContent=b||'';
 el.style.opacity=1;
 clearTimeout(el._t);el._t=setTimeout(()=>el.style.opacity=0,2400);
}
// F12.13-perf: floatText object pool. Div di-pre-create sekali, reuse via
// display:block/none. Menghilangkan ~50-80 createElement + appendChild/detik
// saat combat padat (Brrrt Sobel, burst Reza, Ariz, dll).
const floatList=[];
const FLOAT_POOL_SIZE=60;
const floatPool=[];
function _floatPoolInit(){
 const host=$('floaters'); if(!host) return;
 for(let i=0;i<FLOAT_POOL_SIZE;i++){
  const el=document.createElement('div');
  el.className='float';
  el.style.display='none';
  host.appendChild(el);
  floatPool.push({el,active:false});
 }
}
function _floatAcquire(){
 for(const s of floatPool) if(!s.active) return s;
 // pool penuh: reuse slot paling tua (index 0 di floatList)
 const oldest=floatList[0];
 if(oldest){ floatList.shift(); oldest.slot.active=false; return oldest.slot; }
 return floatPool[0]||null;
}
function floatText(x,z,txt,cls,dy){
 const slot=_floatAcquire(); if(!slot) return;
 const el=slot.el;
 el.className='float '+(cls||'');
 el.textContent=txt;
 el.style.display='block';
 el.style.opacity='';
 slot.active=true;
 floatList.push({x,z,y:1.6+(dy||0),el,slot,t:1.1});
}
const _v=new THREE.Vector3();
function toScreen(x,y,z){
 _v.set(x,y,z).project(camera);
 return[(_v.x+1)/2*innerWidth,(1-_v.y)/2*innerHeight];
}
function updateFloats(dt){
 for(const f of floatList.slice()){
  f.t-=dt;f.y+=dt*1.1;
  if(f.t<=0){
   f.el.style.display='none';
   if(f.slot)f.slot.active=false;
   floatList.splice(floatList.indexOf(f),1);
   continue;
  }
  const[sx,sy]=toScreen(f.x,f.y,f.z);
  f.el.style.left=sx+'px';f.el.style.top=sy+'px';
  f.el.style.opacity=clamp(f.t/.4,0,1);
 }
}
let hudT=0;
function refreshHud(){
 setTxt('hNight',night.n);
 setTxt('hPhase',night.phase==='deploy'?'DEPLOY': // F7c: fase menu deploy awal
  night.phase==='intro'?'NIGHT BEGINS':
  night.phase==='wave'?'WAVE '+(night.wave+1)+'/4':
  night.phase==='pause'?'TACTICAL PAUSE':
  night.phase==='dawn'?'DAWN':'PREPARATION');
 setTxt('hTimer',fmt(night.t));
 const ht=$('hTimer');if(ht)ht.classList.toggle('green',night.phase==='prep');
 setTxt('hWalkers',zombies.filter(z=>!z.dying&&!z.retreat).length+
  (night.phase==='wave'&&night.queue>0?' +'+night.queue:''));
 setTxt('hKills',S.totalKills);
 setTxt('hRes',S.respect);
 // ===== SQUAD CARDS (§23.5) — F7: per karakter =====
 for(const ch of chars){
  setTxt('lvl-'+ch.id,ch.lvl);
  setTxt('sub-'+ch.id,(CHARS[ch.id].rarity||'STARTER')+' · '+CHARS[ch.id].weapon.name
   +(ch.sp>0?' · '+ch.sp+' SP':'')); // F8a(2): rarity pada label
  setW('hp-bar-'+ch.id,clamp(ch.hp/ch.es.hpMax*100,0,100)+'%');
  setTxt('hp-'+ch.id,Math.ceil(ch.hp)+' / '+ch.es.hpMax);
  setW('en-bar-'+ch.id,clamp(ch.energy,0,100)+'%');
  setTxt('en-'+ch.id,Math.floor(ch.energy)+' / 100');
  setW('xp-bar-'+ch.id,clamp(ch.xp/1000*100,0,100)+'%');
  setTxt('xp-'+ch.id,ch.xp+' / 1000');
  setTxt('mag-'+ch.id,ch.mag+' / '+charMagMax(ch)); // F10.2.4: OFF T3-aware
  const magEl=$('mag-'+ch.id); // FIX(21g): badge ikut kuning + kedip saat reload
  if(magEl){
   magEl.classList.toggle('blinkfast',ch.reloadT>0);
   magEl.style.color=ch.reloadT>0?'#e6c34a':'';
  }
  const acts=ch.buffs.filter(b=>S.now<b.until);
  const buffNow=acts[acts.length-1];
  let bt=buffNow?buffNow.n+' '+Math.ceil(buffNow.until-S.now)+'s':'—';
  if(ch._ks&&ch._ks.stacks>0&&S.now<ch._ks.until)
   bt='KILLSTREAK ×'+ch._ks.stacks+' · '+Math.ceil(ch._ks.until-S.now)+'s'; // F7(3)
  if(ch.reloadT>0)bt+=' · RELOADING '+ch.reloadT.toFixed(1)+'s'; // FIX(27): countdown pindah ke baris buff
  if(ch.seat)bt=(ch.seat.kind==='sleep'?'SLEEPING':'SITTING')+' · '+Math.ceil(ch.hp)+'/'+ch.es.hpMax; // F10.10.3
  setTxt('buff-'+ch.id,bt);
  const buffEl=$('buff-'+ch.id); // FIX(27): kedip kuning saat reload (perilaku wep lama)
  if(buffEl){
   buffEl.classList.toggle('blinkfast',ch.reloadT>0);
   buffEl.style.color=ch.reloadT>0?'#e6c34a':'';
  }
  const stLines=[];
  if(hasSt(ch,'STUNNED'))stLines.push('STUNNED '+Math.ceil(ch.st.STUNNED.until-S.now)+'s');
  if(hasSt(ch,'SLOWED'))stLines.push('SLOWED '+Math.ceil(ch.st.SLOWED.until-S.now)+'s');
  if(hasSt(ch,'BURNING'))stLines.push('BURNING '+Math.ceil(ch.st.BURNING.until-S.now)+'s');
  if(hasSt(ch,'MARKED'))stLines.push('MARKED '+Math.ceil(ch.st.MARKED.until-S.now)+'s');
  const stBox=$('st-'+ch.id);
  if(stBox){
   stBox.innerHTML=stLines.map(s=>'<span>'+s+'</span>').join('');
   stBox.style.display=stLines.length?'flex':'none';
  }
  const cardEl=$('card-'+ch.id);
  if(cardEl){
   cardEl.classList.toggle('selected',ch.selected);
   cardEl.classList.toggle('down',ch.down);               // F7(2) §23.9
   cardEl.classList.toggle('recovering',ch.recovering);   // F7(2) §23.9
   cardEl.classList.toggle('resv',!ch.deployed);          // F7c: reserve — kartu redup
   cardEl.classList.toggle('critical',!ch.down&&!offField(ch)
    &&S.state!=='defeat'&&ch.hp<ch.es.hpMax*.3);
  }
 }
 setTxt('nrNight','NIGHT '+night.n);
 setTxt('nrClock',clockFmt(S.time));
 const cyc=CFG.waveTime+CFG.pauseTime,total=cyc*4;
 let prog=0;
 if(night.phase==='wave')prog=night.wave*cyc+(CFG.waveTime-night.t);
 else if(night.phase==='pause')prog=night.wave*cyc+CFG.waveTime+(CFG.pauseTime-night.t);
 else if(night.phase==='dawn'||night.phase==='prep')prog=total;
 const mk=$('nbMark');if(mk)mk.style.left=(clamp(prog/total,0,1)*100)+'%';
 for(let i=0;i<4;i++){
  const s=$('ns'+i);
  if(s)s.classList.toggle('on',prog>i*cyc);
 }
 const sb=$('skipBtn');
 if(sb)sb.style.display=night.phase==='prep'?'block':'none';
 const en=$('endNightBtn'); // F10.3: tampil hanya prep phase (bukan deploy/intro)
 if(en)en.style.display=night.phase==='prep'?'block':'none';
 setTxt('siRes',S.respect); // F7c §23.6: info bar di bawah kartu squad
 setTxt('siDep',deployCount()+'/'+MAX_DEPLOY_CHARS+' · '+deployUsed()+'/'+deployCap()); // FIX(47) P6
 {const sd=$('siDep'); // FIX(5) §16.3 + FIX(47): over → merah berkedip (kedua constraint)
  if(sd)sd.classList.toggle('overCap',overDeploy());}
 // F7(3c): daftar zombie dibunuh — hanya jenis yang sudah dibunuh
 {
  const kl=$('killList');
  if(kl){
   let h='';
   for(const k in S.zKills){
    const T=ZTYPES[k];
    const col=T.boss?'#ff5030':T.elite?'#e6c34a':'#ececec'; // boss merah · elite oren · normal putih
    const nm=(k==='PZero'?'PATIENT ZERO':k==='ZAlpha'?'ZOMBIE ALPHA':k);
    h+='<div><span style="color:'+col+';font-weight:700">'+nm+'</span>'
     +' <span style="color:#fff;font-weight:400">× '+S.zKills[k]+'</span></div>'; // counter tetap putih
   }
   if(kl._h!==h){kl._h=h;kl.innerHTML=h;} // update DOM hanya saat berubah
  }
 }
}
// (6) skill timer ring — lingkaran biru muda, wipe-down
function updateSkillRing(){ // F10.2.2c: fill di ikon skill squad card (ring dunia DIHAPUS)
 // Semua fill di-reset dulu — supaya char yang baru tidak "menahan" isi lama
 for(const ch of chars){
  const f=$('skillFill-'+ch.id);
  if(f)f.classList.remove('on');
 }
 const sc=selChar||diaz;
 if(!sc)return;
 const buff=sc.buffs.find(b=>S.now<b.until&&b.dur&&!b.food);
 const f=$('skillFill-'+sc.id);
 if(!buff||!f)return;
 const pct=clamp((buff.u-S.now)/buff.dur,0,1);
 f.style.transform='scaleY('+pct+')';
 f.classList.add('on');
}

// ============ 20. UI OVERHEAD 2D =================
const TIER_CLS={normal:'nmzom',elite:'nmeli',boss:'nmbos'};
const overheadMap=new Map();
function makeOverhead(ent){
 const host=$('overheads');
 const root=document.createElement('div');root.className='ovh';
 const fills={};
 if(ent.kind==='char'){ // F7: overhead generik semua karakter §23.7
  root.innerHTML='<div class="rvh">+</div>' // F7b(2): tanda revive saat down
   +'<div class="nm nmchr">'+ent.n+'<span class="lvl">1</span></div>'
   +'<div class="bars"><div class="bar2 hp"><i></i></div>'
   +'<div class="bar2 en"><i></i></div><div class="bar2 xpb"><i></i></div></div>';
  const f=root.querySelectorAll('.bar2 i');
  fills.hp=f[0];fills.en=f[1];fills.xp=f[2];
  fills.lvl=root.querySelector('.lvl');
 }else{
  root.innerHTML='<div class="nm '+TIER_CLS[ent.tier]+'">'+ent.tierName+'</div>'
   +'<div class="bars"><div class="bar2 zhp"><i></i></div></div>';
  fills.hp=root.querySelector('.bar2 i');
 }
 host.appendChild(root);
 const rec={root,fills,cache:{lvl:-1}};
 overheadMap.set(ent,rec);
 return rec;
}
function removeOverhead(ent){
 const rec=overheadMap.get(ent);
 if(rec){rec.root.remove();overheadMap.delete(ent);}
}
function setFill(rec,key,ratio){
 ratio=clamp(ratio,0,1);
 if(rec.cache[key]!==ratio){
  rec.cache[key]=ratio;
  rec.fills[key].style.transform='scaleX('+Math.max(ratio,.02)+')';
 }
}
function updateOverheads(){
 for(const ch of chars){ // F7: overhead semua karakter §23.7
  if(offField(ch)){ // F7c: reserve/recovering — sembunyikan overhead bekas
   const od=overheadMap.get(ch);
   if(od)od.root.style.display='none';
   continue;
  }
  const dsh=stairHeight(Math.floor(ch.x),Math.floor(ch.z));
  const d=overheadMap.get(ch)||makeOverhead(ch);
  d.root.style.display='block'; // F7c: pulihkan saat kembali dari reserve
  const[dx,dy]=toScreen(ch.x,1.95+dsh,ch.z);
  d.root.style.transform='translate('+dx+'px,'+dy+'px) translate(-50%,-100%)';
  // F7b(2): down → bar HP/EN/XP hilang · "+" revive muncul di atas nama
  const bars=d.root.querySelector('.bars'),rvh=d.root.querySelector('.rvh');
  if(bars)bars.style.display=ch.down?'none':'flex';
  if(rvh)rvh.style.display=ch.down?'block':'none';
  setFill(d,'hp',ch.hp/ch.es.hpMax);
  setFill(d,'en',ch.energy/100);
  setFill(d,'xp',ch.xp/1000);
  if(d.cache.lvl!==ch.lvl){d.cache.lvl=ch.lvl;
   d.fills.lvl.textContent=ch.lvl;}
 }
 for(const z of zombies){
  if(z.dying||z.retreat)continue;
  const rec=overheadMap.get(z)||makeOverhead(z);
  const zsh=stairHeight(Math.floor(z.x),Math.floor(z.z));
  const[sx,sy]=toScreen(z.x,(z.T.crawl?.8:(z.T.ovh||1.75))+zsh,z.z);
  rec.root.style.transform='translate('+sx+'px,'+sy+'px) translate(-50%,-100%)';
  setFill(rec,'hp',z.hp/z.max);
 }
 for(const bk of barricades.values()){
  const rec=overheadMap.get(bk);
  if(!rec)continue;
  const[sx,sy]=toScreen(bk.x+.5,1.6,bk.y+.5);
  rec.root.style.transform='translate('+sx+'px,'+sy+'px) translate(-50%,-100%)';
  setFill(rec,'hp',bk.hp/bk.max);
 }
}

// ================= 21. INPUT =================
const raycaster=new THREE.Raycaster();
const groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
const ndc=e=>({x:e.clientX/innerWidth*2-1,y:-(e.clientY/innerHeight)*2+1});
function pickEntity(e){
 raycaster.setFromCamera(ndc(e),camera);
 for(const h of raycaster.intersectObjects(scene.children,true)){
  let o=h.object;
  while(o&&!o.userData.entity)o=o.parent;
  if(o)return o.userData.entity;
 }
 return null;
}
function pickGround(e){
 raycaster.setFromCamera(ndc(e),camera);
 const p=new THREE.Vector3();
 return raycaster.ray.intersectPlane(groundPlane,p)?p:null;
}
function showPathDots(path){
 for(const d of pathDots)scene.remove(d);
 pathDots.length=0;
 for(const[cx,cz]of path.slice(0,24)){
  const m=new THREE.Mesh(dotGeo,dotMat);
  m.position.set(cx+.5,.14+stairHeight(cx,cz),cz+.5);m.userData.t=1;
  scene.add(m);pathDots.push(m);
 }
}
// (5) DRAG PAN — klik kiri + tahan + geser = pan kamera;
//     klik singkat = select/place
let dragS=null;
renderer.domElement.addEventListener('pointerdown',e=>{
 if(S.paused||S.ui)return;
 if(e.button===0){
  dragS={x:e.clientX,y:e.clientY,dragging:false};
 }
 // klik kanan: proses langsung (tidak berubah)
 if(e.button!==2)return;
 if(throwState){cancelThrow(true);return;} // F9c: RMB = cancel + energy refund
 if(S.placement){S.placement=null;clearPlaceMarks();
  toast('Placement cancelled');return;}
 const sc=selChar; // F7(2): perintah untuk karakter TERSELEKSI (D2)
 if(!sc||sc.down||offField(sc))return; // tumbang/absen tak bisa dikomandani
 const ent=pickEntity(e);
 // F7b §4.4: REVIVE — klik kanan karakter yang TUMBANG (dalam 1 blok)
 if(ent&&ent.kind==='char'&&ent.ref.down&&!ent.ref.recovering){
  if(Math.hypot(sc.x-ent.ref.x,sc.z-ent.ref.z)>1.9){
   toast('Too far — walk within 1 block of '+ent.ref.n,'bad');return;}
  if(sc.constr)cancelConstruction(sc);   // kerja terhenti — prioritas menyelamatkan
  if(sc._revive&&sc._revive.tgt===ent.ref){toast('Already reviving '+ent.ref.n);return;}
  if(sc._revive)cancelRevive(sc);
  startRevive(sc,ent.ref);
  return;
 }
 // F7b: aksi klik kanan LAIN oleh reviver → channel batal
 if(sc._revive)cancelRevive(sc);
 if(ent&&ent.kind==='zombie'&&!ent.ref.dying&&!ent.ref.retreat){
  sc.lock=ent.ref;toast('TARGET LOCKED — '+ent.ref.tierName);
  return;
 }
 // F7d §13: TRANSFER — klik kanan ALLY hidup ≤1 blok → panel sharing
 if(ent&&ent.kind==='char'&&ent.ref!==sc&&!ent.ref.down&&!offField(ent.ref)){
  if(Math.hypot(sc.x-ent.ref.x,sc.z-ent.ref.z)>1.9){
   toast('Too far — walk within 1 block to share','bad');return;}
  openShare(sc,ent.ref);
  return;
 }
 const p=pickGround(e);if(!p)return;
 const tx=Math.floor(p.x),ty=Math.floor(p.z);
 if(!inBounds(tx,ty))return;
 const c=cellAt(tx,ty),k2=tx+','+ty;
 // F10.10.3: klik pada sofa/kursi/kasur → duduk/tidur
 if(c==='s'||c==='c'||c==='B'||c==='b'){
  if(sc.seat)endSeat(sc,true);
  startSeat(sc,tx,ty,c);
  return;
 }
 // F10.10.3: klik selain furniture seat → stand up dulu
 if(sc.seat)endSeat(sc);
 {const oc=constrAt(tx,ty); // F7(3b): konstruksi siapa pun di sel ini
  if(oc){constrStopWork(oc);oc.owner.constr=null;
   toast('Construction cancelled — no materials lost');return;}}
 const bk=barricades.get(k2);
 if(bk){
  if(Math.hypot(sc.x-(tx+.5),sc.z-(ty+.5))>3.2){
   toast('Too far — move closer to the barricade','bad');return;}
  if(bk.hp<bk.max)startRepair(bk);
  else toast('Barricade is intact');
  return;
 }
 const hole=holes.get(k2);
 if(hole&&!bk){
  if(Math.hypot(sc.x-(tx+.5),sc.z-(ty+.5))>3.2){
   toast('Too far — move closer to the breach','bad');return;}
  startWallRepair(hole);
  return;
 }
 const sbox=storageBoxes.get(k2);
 if(sbox){
  if(Math.hypot(sc.x-(tx+.5),sc.z-(ty+.5))>3.2){
   toast('Too far — move closer to the storage box','bad');return;}
  openStore(sbox);
  return;
 }
 if(c==='a'){ // F10.10.2: workbench (garage apparatus) — buka craft panel dgn flag
  if(Math.hypot(sc.x-(tx+.5),sc.z-(ty+.5))>3.2){
   toast('Too far — move closer to the workbench','bad');return;}
  openWorkbench(sc);
  return;
 }
 if(c==='f'){
  if(Math.hypot(sc.x-FIREPIT.x,sc.z-FIREPIT.z)<3){
   if(fireplace.t>0)toast('The fireplace is already burning');
   else{fireplace.t=60;toast('The fireplace is lit — 60s of light','good');}
   return;
  }
  toast('Terlalu jauh dari perapian — dekati dulu','bad');return;
 }
 if(c==='k'){ // kompor §19.2 — hanya saat wave, 1× per wave PER karakter
  if(night.phase!=='wave'){
   toast('The stove can only be used during a wave','bad');return;}
  if(Math.hypot(sc.x-(tx+.5),sc.z-(ty+.5))>3.2){
   toast('Too far — move closer to the stove','bad');return;}
  if(sc.stoveWave===night.wave){
   toast(sc.n+' already had a hot meal this wave','bad');return;}
  useStove(sc);
  return;
 }
 if(!passChar(tx,ty)){
  if(c==='g')
   toast('Pintu garasi terkunci rapat — tidak bisa dibuka','bad');
  else toast('Tidak bisa bergerak ke sana','bad');
  return;
 }
 // §4.2: blok tujuan tak boleh ditempati karakter lain (lewat-diwaktu jalan boleh)
 if(chars.some(o=>o!==sc&&!o.down&&!offField(o)
  &&Math.floor(o.x)===tx&&Math.floor(o.z)===ty)){
  toast('Block occupied — choose another spot','bad');return;}
 if(sc.constr){
  toast(sc.n+' is busy constructing — cannot move','bad');return;}
 const path=astar(Math.floor(sc.x),Math.floor(sc.z),tx,ty,passChar);
 if(!path){toast('No path','bad');return;}
 sc.path=path;showPathDots(path);
});
renderer.domElement.addEventListener('pointermove',e=>{
 ghostXY={x:e.clientX,y:e.clientY}; // F6.5(fix 2): track posisi mouse utk ghost
 if(dragS&&(e.buttons&1)){
  const dx=e.clientX-dragS.x,dy=e.clientY-dragS.y;
  if(!dragS.dragging&&Math.hypot(dx,dy)>10)dragS.dragging=true;
  if(dragS.dragging){
   // grab-scene convention: drag kanan = scene geser kanan
   const k=.018/camera.zoom;
   camT.x-=(dx+dy)*k;
   camT.z+=(dx-dy)*k;
   camT.x=clamp(camT.x,4,36);camT.z=clamp(camT.z,4,28);
   syncCamera();
   dragS.x=e.clientX;dragS.y=e.clientY;
  }
 }
});
renderer.domElement.addEventListener('pointerup', e => {
  if (e.button === 0 && dragS) {
    const wasDrag = dragS.dragging;
    dragS = null;
    if (wasDrag) return;
    if (S.paused || S.ui) return;

    if (throwState) { // F9c + P8-EXT: LMB = konfirmasi lempar / pick target
      const st=throwState;
      if(st.item.mode==='lock'){execThrow();}
      else if(st.item.mode==='rehan'){ // P8-EXT: Rehan — WAJIB klik zombie
       const ent=pickEntity(e);
       if(ent&&ent.kind==='zombie'&&!ent.ref.dying&&!ent.ref.retreat){
        const z=ent.ref;
        if(Math.hypot(z.x-st.ch.x,z.z-st.ch.z)<=st.item.range){
         st.target=z;execThrow();return;
        }
        toast('Target out of range — pick closer','bad');return;
       }
       toast('Pick a zombie — LMB on a target','bad');return;
      }
      else{
       const p=pickGround(e);
       if(p){st.tx=Math.floor(p.x);st.tz=Math.floor(p.z);
        st.ok=Math.hypot(st.tx+.5-st.ch.x,st.tz+.5-st.ch.z)<=st.item.range;
        execThrow();}
      }
      // P8-EXT: return TANPA SYARAT — semua jalur di mode throw (lock/rehan/ground)
      // sudah menangani aksinya sendiri. Return ini WAJIB: mencegah LMB jatuh ke blok
      // select/unselect di bawah (klik zombie / miss-click lantai = pick, bukan unselect).
      return;
    }
    if (S.placement) {
      const p = pickGround(e);
      if(p){
       if(S.placement.src==='craft')tryCraftPlace(Math.floor(p.x),Math.floor(p.z));
       else tryPlace(Math.floor(p.x),Math.floor(p.z));
      }
      return;
    }

    const ent = pickEntity(e);
    if (ent && ent.kind === 'rescue') { // F8b §16.1: klik NPC rescue → QTE / jebakan
      if (!S.qte && S.rescue && S.rescue.state === 'active') startRescueQTE();
      return; // NPC bukan target seleksi — jangan deselect
    }
    const wasSel = selChar; // F7: seleksi multi-karakter (D2)
    selChar = (ent && ent.kind === 'char' && ent.ref.deployed && !ent.ref.recovering) ? ent.ref : null; // F7c
    for (const ch of chars) ch.selected = (ch === selChar);
    if (selChar && selChar !== wasSel) {
      toast(selChar.n + ' selected');
    } else if (!selChar && wasSel) {
      toast('Character unselected');
    }
  }
});
document.addEventListener('contextmenu',e=>e.preventDefault());
const keys={};
// F10.1: K/J/L sudah terimplementasi — KEY_HINTS J/K/L dihapus.
// Sisa entry hanya untuk key yang belum aktif.
const KEY_HINTS={};
addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();
 if(k==='escape'){
  const tc=$('treeConfirm'); // F10.2.2: tutup dialog upgrade tree dulu
  if(tc&&tc.style.display==='flex'){tc.style.display='none';return;}
  const ec=$('endNightConfirm'); // F10.3: tutup dialog End the Night
  if(ec&&ec.style.display==='flex'){ec.style.display='none';return;}
  const kp=$('keybindPanel'); // F12.11b: panel keybind tidak tracked S.ui → ESC manual
  if(kp&&kp.style.display==='flex'){closeKeybinds();return;}
  if(S.state==='jombipedia'){closeJombipedia();return;} // F12.11
  if(S.ui){closeAllPanels();return;}
  if(S.state==='playing'){S.paused=!S.paused;if(S.paused)refreshPauseButtons();showEl('pause',S.paused);bgmPause(S.paused);constrPauseWork(S.paused);} // P9: refresh grey-out Save
  return;
 }
  if(k==='m'){toggleMute();return;} // F5: mute — global, tak butuh seleksi
 keys[k]=true;
 if(S.paused||S.state!=='playing')return;
 if(S.qte){ // F8b §16.1 D10: QTE aktif — panah = tebakan, key lain ditelan
  const a=QTE_KEYS[k];
  if(a!==undefined)qteInput(a);
  return;
 }
 if(k==='t'){toggleDeploy();return;} // F7c: menu deploy — global
 if(k==='o'){toggleOptions();return;} // F12.2: OPTIONS — global (tanpa perlu selected char)
 // F12.14: keybind 1-5 — select karakter berdasar urutan kartu squad (kiri → kanan).
 // S.deployOrder di-update saat deploy/withdraw, jadi index otomatis mengikuti
 // susunan kartu yang sedang tampil.
 if(k.length===1 && k>='1' && k<='5'){
  const idx=+k-1;
  const id=S.deployOrder[idx];
  if(!id)return; // slot kosong (mis. baru deploy 3 char, tekan 4)
  const ch=chars.find(c=>c.id===id);
  if(!ch)return;
  if(ch.recovering){toast(ch.n+' is RECOVERING','bad');return;}
  if(!ch.deployed){toast(ch.n+' is in reserve — deploy via menu (T)','bad');return;}
  selChar=ch;
  for(const c of chars)c.selected=(c===ch);
  toast(ch.n+' selected');
  return;
 }
 // aksi karakter (skill/reload/menu) butuh karakter terseleksi — GDD §2
 // "the currently controlled character's ..." menu
 if(!selChar&&(k==='q'||k==='r'||k==='i'||k==='b'||k==='c'||k==='h'||k==='g'
  ||k==='k'||k==='j'||k==='l')){ // F10.1: +K/J/L
  toast('No selected character — Select a Character','bad');
  return;
 }
 if(k==='q')castSkill(selChar||diaz);
 else if(k==='r')tryReload();
 else if(k==='i')togglePanel('inv');
 else if(k==='b')togglePanel('build');
 else if(k==='c')togglePanel('craft');
 else if(k==='h')useHealItem();
 else if(k==='g')useBuffItem();
 else if(k==='k')openCharPanel('stats');   // F10.1
 else if(k==='j')openCharPanel('journal'); // F10.1 (placeholder F10.4)
 else if(k==='l')openCharPanel('upgrade'); // F10.1 (placeholder F10.2)
 else if(KEY_HINTS[k])toast(KEY_HINTS[k]);
});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
addEventListener('blur',()=>{for(const k in keys)keys[k]=false});
// ---- F6: auto-pause saat tab/browser tidak aktif (visibilitychange) ----
// F12.4g: tambah auto-RESUME saat tab kembali terlihat. Pause yang dipicu
// visibility ditandai S._hiddenPause supaya tidak menimpa pause manual (user
// tekan ESC sebelum alt-tab) — pause manual tetap butuh ESC untuk unpause.
document.addEventListener('visibilitychange',()=>{
 if(!document.hidden){
  // Tab kembali terlihat → resume jika pause dipicu visibility (bukan ESC).
  if(S._hiddenPause){
   S._hiddenPause=false;
   if(S.state==='playing'){S.paused=false;showEl('pause',false);}
   bgmPause(false);      // BGM lanjut — main menu, wave, prep, atau defeat
   constrPauseWork(false); // suara kerja konstruksi lanjut dari posisi pause
  }
  return;
 }
 if(S.state==='playing'){
  if(S.ui)closeAllPanels();         // panel terbuka → tutup biar pause bersih
  if(!S.paused){
   S.paused=true;
   S._hiddenPause=true;             // tandai: pause ini dipicu visibility
   refreshPauseButtons();
   showEl('pause',true);
  }
 }else{
  S._hiddenPause=true;              // menu/defeat — BGM juga perlu resume
 }
 bgmPause(true);
 constrPauseWork(true);
});
addEventListener('wheel',e=>{
 // F12.11-B3: saat Jombipedia terbuka, wheel mengontrol zoom 3D viewer.
 // F12.11-B3-fix: scroll UP (deltaY<0) → zoom IN (kamera mendekat, z lebih kecil).
 if(S.state==='jombipedia'){
  if(typeof jombCam!=='undefined' && jombCam){
   // F12.11-B3-fix2: clamp range proporsional baseZoom supaya model tinggi
   // (ZAlpha/PZero) bisa di-zoom-out lebih jauh tanpa terpotong.
   const bz = (jombCam.userData && jombCam.userData.baseZoom) || 3.2;
   const minZ = bz * 0.45;
   const maxZ = bz * 2.4;
   jombCam.position.z = clamp(jombCam.position.z*(e.deltaY<0?.89:1.12), minZ, maxZ);
  }
  return;
 }
 camera.zoom=clamp(camera.zoom*(e.deltaY<0?1.12:.89),.55,2.2);
 camera.updateProjectionMatrix();
},{passive:true});
{const sb=$('skipBtn');if(sb)sb.onclick=()=>{
 if(night.phase==='prep')night.t=Math.min(night.t,.5);};}

// ================= 22. KEKALAHAN & RESET =================
let defeatT=0;
// ---- F7(2): TUMBANG & RECOVERING (§4.4 / §13 — versi pra-revive, F7b) ----
function charDown(ch){ // HP 0 → rebah, diabaikan musuh, tak bisa apa pun
 if(ch._medan&&S.now<ch._medan.until){ // F8a(3) D5: HP floor 1 — tak bisa mati
  ch.hp=1;
  if(!ch._medan.lf||S.now>ch._medan.lf+2){ // throttle anti-spam float
   ch._medan.lf=S.now;
   floatText(ch.x,ch.z,'IMMORTAL!','skill');
  }
  return;
 }
 if(ch.down||offField(ch))return;
 ch.down=true;ch.hp=0;
 S.downsCount++; // P2: Down & Revive Count
 if(ch.jc)ch.jc.wentDown=1; // F10.4: flag untuk Survivor/Flawless
 ch.path=[];ch.lock=null;ch.state='idle';ch._tgt=null;
 if(ch._burst){ch._burst=null;if(CHARS[ch.id].weapon.sfxOnce)sfxStop(GUN_SFX[ch.id]);} // F9c fail-safe
 const u=ch.mesh.userData; // snapshot pose 3-sumbu (F7(2.5): per-model)
 ch._fall={g:[u.gunArm.rotation.x,u.gunArm.rotation.y,u.gunArm.rotation.z],
  o:u.offArm?[u.offArm.rotation.x,u.offArm.rotation.y,u.offArm.rotation.z]:[0,0,0],
  lx:u.legL.rotation.x,lz:u.legL.rotation.z,
  rx:u.legR.rotation.x,rz:u.legR.rotation.z};
 ch._downAnimT=0;
 cancelConstruction(ch);
 if(ch._revive)cancelRevive(ch); // F7b: reviver tumbang → channel putus
 if(selChar===ch){selChar=null;for(const c of chars)c.selected=false;}
 floatText(ch.x,ch.z,ch.n+' IS DOWN','dmgC',1.2);
 toast(ch.n+' IS DOWN — right-click within 1 block to revive','bad');
 chatPush('down',chatReporter()||ch,ch.n); // F9b.5: char lain melaporkan
 SFX('charHurt'); // F12.4
 if(chars.some(c=>c.deployed)&&chars.every(c=>!c.deployed||c.down))defeat(); // FIX(38): 0-deployed ≠ defeat
}
function updateDownPose(ch,dt){ // animasi rebah — pose per model (F7(2.5))
 ch._downAnimT+=dt;
 const p=clamp(ch._downAnimT/1.3,0,1),q=p*p,ql=Math.min(1,p*1.25);
 const u=ch.mesh.userData,F=ch._fall||{};
 const D=u.death||{gun:[1.45,.99,0],off:[0,0,.12],lift:.025}; // fallback = pose Diaz
 const L=(a,b)=>lerp(a,b,ql);
 if(u.rig){u.rig.rotation.x=-1.38*q;
  u.rig.position.y=(D.lift!==undefined?D.lift:.025)*q;} // F7(2.5c): lift per model
 u.gunArm.rotation.set(
  L(F.g?F.g[0]:0,D.gun[0]),
  L(F.g?F.g[1]:0,D.gun[1]),
  L(F.g?F.g[2]:0,D.gun[2]));
 if(u.offArm)u.offArm.rotation.set(
  L(F.o?F.o[0]:0,D.off[0]),
  L(F.o?F.o[1]:0,D.off[1]),
  L(F.o?F.o[2]:0,D.off[2]));
 u.legR.rotation.x=L(F.rx||0,-.16);u.legR.rotation.z=L(F.rz||0,.30);
 u.legL.rotation.x=L(F.lx||0,-.16);u.legL.rotation.z=L(F.lz||0,-.14);
}
// ---- F7b: REVIVE §4.4 — channel 7 dtk, 10% HP, cancel: pindah/damage/stun ----
ensure('reviveRing','position:fixed;z-index:12;pointer-events:none;width:36px;height:36px;'
 +'display:none;transform:translate(-50%,-50%)',
 '<div id="rvRing" style="width:100%;height:100%;border-radius:50%;'
 +'-webkit-mask:radial-gradient(circle,transparent 11px,black 12px);'
 +'mask:radial-gradient(circle,transparent 11px,black 12px)"></div>'
 +'<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);'
 +'font:16px monospace;color:#7fa35b;text-shadow:0 1px 0 #000">+</div>');
function startRevive(rev,tgt){ // F7b + F9d + F10.2.4
 if(rev._mot)rev._mot=null;
 let dur=rev.id==='ariz'?2:7; // F9d pasif §21.2: Ariz 2s, others 7s
 // F10.2.4: REC T1 (−1s saat DIRIMU down) — target-side
 if(treeHas(tgt,'rec',1))dur-=1;
 // F10.2.4: REC T3 (−2s saat membantu ORANG LAIN) — reviver-side
 if(treeHas(rev,'rec',3))dur-=2;
 if(dur<1)dur=1; // floor 1s (Ariz 2s + REC T3 2s = −2 → floor ke 1)
 rev._revive={tgt,t:0,dur};
 rev.path=[];rev.lock=null;
 toast(rev.n+' is reviving '+tgt.n+' — '+dur+'s','good');
 SFX('heal');
}
function completeRevive(rev){ // selesai — §4.4: bangkit dengan 10% HP
 const tgt=rev._revive.tgt;
 rev._revive=null;
 tgt.down=false;
 tgt.hp=Math.max(1,Math.round(CHARS[tgt.id].hp*.1));
 tgt.state='idle';tgt.path=[];tgt.lock=null;tgt._tgt=null;
 standUp(tgt);
 floatText(tgt.x,tgt.z,'REVIVED!','heal',1.2);
 toast(tgt.n+' revived — 10% HP','good');
 S.revivesDone++; // P2: Down & Revive Count
 if(rev.jc)rev.jc.revives++; // F10.4 (reviver yang dapat credit)
 chatPush('revived',tgt,rev.n); // F9b.5: yang di-revive berterima kasih ke penyelamat
 SFX('built');
}
function cancelRevive(ch){
 if(!ch||!ch._revive)return;
 const t=ch._revive.tgt;
 ch._revive=null;
 toast(ch.n+' stopped reviving '+t.n,'bad');
}
function standUp(ch){
 if(!ch||!ch.mesh)return;
 const u=ch.mesh.userData;
 if(!u)return;
 ch.mesh.rotation.set(0,0,0);
 if(u.rig){u.rig.rotation.set(0,0,0);u.rig.position.set(0,0,0);}
 if(u.gunArm)u.gunArm.rotation.set(u.aim?u.aim.down:0,0,0);
 if(u.offArm)u.offArm.rotation.set(0,0,0);
 if(u.legL)u.legL.rotation.set(0,0,0);
 if(u.legR)u.legR.rotation.set(0,0,0);
 ch._fall=null;ch._downAnimT=0;
}
// ===== F10.10.3: DUDUK & TIDUR (GDD §19.2) =====
// Klik kanan pada sofa(`s`)/kursi(`c`)/kasur(`B`,`b`) → char duduk atau tidur.
// Radius Chebyshev ≤ 1 (sama logic repair/build). Regen +5 HP/s (sit) atau
// +10 HP/s (sleep), DEF di-nol-kan (vulnerable). Auto-stand saat kena damage
// atau perintah lain. Pose: sit = kaki horizontal + rig turun · sleep = rebah.
function startSeat(ch,tx,ty,furn){
 if(!ch||!ch.mesh||ch.down||offField(ch))return;
 const isSleep=(furn==='B'||furn==='b');
 const kind=isSleep?'sleep':'sit';
 const dx=Math.abs(Math.floor(ch.x)-tx),dz=Math.abs(Math.floor(ch.z)-ty); // F10.13b: tz→ty (typo F10.10.3 — ReferenceError tiap klik seat)
 if(Math.max(dx,dz)>1){toast('Too far — move within 1 block','bad');return;}
 if(ch.constr)cancelConstruction(ch);
 if(ch._revive)cancelRevive(ch);
 ch.seat={kind,tx,ty,furn};
 ch.x=tx+.5;ch.z=ty+.5;
 ch.path=[];ch.lock=null;ch._tgt=null;ch.state='idle';
 // F10.13a: furnRot lokal IIFE buildWorld → tidak accessible. Replikasi inline
 // khusus 4 furnitur seat-able (s=sofa, c=kursi, B/b=kasur).
 let rotY=0;
 if(furn==='c'){
  if(cellAt(tx+1,ty)==='t')rotY=Math.PI/2;
  else if(cellAt(tx-1,ty)==='t')rotY=-Math.PI/2;
  else if(cellAt(tx,ty-1)==='t')rotY=Math.PI;
 }else if(furn==='s'){
  if(tx===17&&ty>=8&&ty<=10)rotY=Math.PI/2;
 }
 ch.mesh.rotation.y=rotY;
 toast(ch.n+' is '+(isSleep?'sleeping':'sitting')+' — DEF 0 · regen '+(isSleep?10:5)+'/s · any damage or command to stand','good');
 SFX('heal');
}
function endSeat(ch,silent){
 if(!ch||!ch.mesh||!ch.seat)return;
 ch.seat=null;
 if(!silent)toast(ch.n+' stands up');
 standUp(ch);
}
function updateSeatPose(ch){
 if(!ch||!ch.mesh||!ch.seat)return;
 const u=ch.mesh.userData;
 if(!u)return;
 const isSleep=ch.seat.kind==='sleep';
 if(u.rig){
  if(isSleep){u.rig.rotation.x=-Math.PI/2;u.rig.position.set(0,0,0);}
  else{u.rig.rotation.x=0;u.rig.position.set(0,-.15,0);}
 }
 const legRot=isSleep?0:-1.4;
 if(u.legL)u.legL.rotation.set(legRot,0,0);
 if(u.legR)u.legR.rotation.set(legRot,0,0);
 if(u.gunArm)u.gunArm.rotation.set(u.aim?u.aim.down:0,0,0);
 if(u.offArm)u.offArm.rotation.set(0,0,0);
}
function updateReviveRing(){ // ring hijau "+" di atas PASIEN
 const el=$('reviveRing');
 let rv=null;
 for(const ch of chars)if(ch._revive){rv=ch._revive;break;}
 if(!rv||!rv.tgt.down){el.style.display='none';return;}
 const tg=rv.tgt;
 const dsh=stairHeight(Math.floor(tg.x),Math.floor(tg.z));
 const[sx,sy]=toScreen(tg.x,2.0+dsh,tg.z);
 el.style.display='block';
 el.style.left=sx+'px';el.style.top=sy+'px';
 const deg=clamp(rv.t/rv.dur*360,0,360);
 $('rvRing').style.background='conic-gradient(#7fa35b 0deg '+deg+'deg, rgba(18,28,14,.6) '+deg+'deg 360deg)';
}
function enterRecovering(ch){ // §13: tak di-revive saat malam berakhir
 ch.recovering=true;ch.down=false;ch.hp=0;ch.deployed=false; // F7c: benched ke reserve
 ch.seat=null; // F10.10.3-FIX: pastikan tidak ada state seat yang tersisa
 S.deployOrder=S.deployOrder.filter(id=>id!==ch.id);layoutSquadCards(); // F7c(3)
 ch.inv=new Array(12).fill(null);   // penalti F6.5 — kini per karakter
 ch.armor=null;ch.slots.rec=null;ch.slots.buff=null;
 ch.buffs=[];ch.regen=null;ch.st={};
 ch.mesh.visible=false;
 if(selChar===ch)selChar=null;
 toast(ch.n+' was left behind — RECOVERING: misses the next night, gear lost','bad');
}
function recoverChar(ch){ // kembali malam berikutnya — HP penuh (D1)
 ch.recovering=false;ch.down=false;ch.deployed=true; // F7c: kembali bertugas di medan
 if(!S.deployOrder.includes(ch.id))S.deployOrder.push(ch.id); // F7c(3)
 layoutSquadCards();
 ch.hp=CHARS[ch.id].hp;
 ch.x=ch._home.x;ch.z=ch._home.z;ch.path=[];ch.lock=null;ch.state='idle';
 ch.energy=0;
 ch.mesh.visible=true;
 standUp(ch); // F7b: pose berdiri bersama
 toast(ch.n+' has recovered — ready for tonight','good');
}
function defeat(){ // F7(2): SEMUA karakter tumbang §4.4/§23.11
 S.state='defeat';defeatT=1.6;
 banner('NO SURVIVORS LEFT','ENDING THE NIGHT');
 SFX('defeat');
 bgmDefeat();constrStopAll();
 if(S.qte)endQTE(); // F8b: overlay QTE tutup sebelum layar kekalahan
}
function showDefeatScreen(){
 setTxt('defStats','Zombie dibunuh: '+S.totalKills
  +' · Malam: '+night.n
  +' · Level: '+chars.map(c=>c.n+' '+c.lvl).join(' / ')
  +' · Respect: '+S.respect);
 showEl('defeat',true);
 // F10.3 §23.11: notif 2.5s → auto ke Session Overview
 clearTimeout(showDefeatScreen._t);
 showDefeatScreen._t=setTimeout(()=>{
  showEl('defeat',false);
  showSessionStats('NO SURVIVORS LEFT',
   'Night '+night.n+' · the expedition ends here',
   false);          // keepRespect=false → rollback sesuai FIX(32)
 },2500);
}
// F10.3-fix: btnRetry dihapus — restart pasca-defeat dilakukan via #sessionStats
function resetGame(silent){ // FIX(48) P7: silent=true → skip banner RETRY + Deploy Menu (dipakai loadGame)
 clearTimeout(showDefeatScreen._t); // F10.3: batalkan auto-transition kalau reset cepat
 const ss=$('sessionStats');if(ss)ss.style.display='none'; // F10.3: tutup recap
 for(const z of zombies){scene.remove(z.mesh);removeOverhead(z);}
 zombies.length=0;
 for(const b of bullets)if(b.mesh)b.mesh.visible=false;bullets.length=0;
 for(const d of pathDots)scene.remove(d);pathDots.length=0;
 // F12.13-perf: pool tidak di-remove, cukup hide + release slot
 for(const f of floatList){f.el.style.display='none';if(f.slot)f.slot.active=false;}
 floatList.length=0;
 for(const it of S.gItems)scene.remove(it.mesh);S.gItems.length=0;
 for(const bk of[...barricades.values()]){scene.remove(bk.mesh);removeOverhead(bk);}
 barricades.clear();setupBarricades();
 for(const t of traps.values())scene.remove(t.mesh);
 traps.clear();
 for(const w of walls.values()){
  if(w.holeMesh)scene.remove(w.holeMesh);
  if(w.mesh&&w.mesh!==w.origMesh)scene.remove(w.mesh);
  if(w.origMesh)scene.add(w.origMesh);
  GRID[w.y][w.x]=w.orig;
  removeOverhead(w);
 }
 walls.clear();holes.clear();
 for(const f of fxList)scene.remove(f.m);fxList.length=0;
 for(const cp of corpseParts)scene.remove(cp.m);
 corpseParts.length=0;
 for(const zn of zones)scene.remove(zn.mesh);zones.length=0;
 S.zBuff={until:0,mul:1};
 for(const L of lanterns.values()){scene.remove(L.mesh);scene.remove(L.light);}
 lanterns.clear();
 for(const b of storageBoxes.values())scene.remove(b.mesh);
 storageBoxes.clear();
 curStore=null;
 placed.clear();
 S.itemCd={};
 S.zKills={}; // F7(3c): reset kill list (retry/night gagal)
 // F10-prep (P3): RETRY = SESI BARU (keputusan B2) — nol semua counter statistik §23.10.
 // loadGame() juga lewat sini, tapi menimpa semua dari save setelahnya (P2.15).
 S.time=0;S.totalKills=0;S.stoveUses=0;
 S.respectEarned=0;S.nightsSurvived=0;S.totalDamage=0;
 S.killsPerChar={};S.dmgPerChar={};S.deploysPerChar={};
 S.downsCount=0;S.revivesDone=0;S.buildsDone=0;S.repairsDone=0;
 S.craftsDone=0;S.rescuesDone=0;
 S.healUses={};S.buffUses={};S.resourcesCollected={};
 for(const p of stPops)p.el.remove();stPops.length=0;
 chatClear(); // F9b.5
 if(throwState){throwState=null;throwGhostM.visible=false;} // F9c
 for(const f of throwFly)scene.remove(f.mesh);throwFly.length=0; // F9c
 for(const s of stickyList)scene.remove(s.mesh);stickyList.length=0; // F9c
 constrStopAll(); // F7(3b)
 for(const ch of chars)ch.constr=null;
 S.placement=null;clearPlaceMarks();closeAllPanels();
 if(S.rescue){removeRescueMesh(S.rescue);S.rescue=null;} // F8b: event dibatalkan
 if(S.qte)endQTE(); // F8b
 // ===== F7(2): reset SEMUA karakter + defeat penalty per karakter =====
 // Item inventory + special slots + armor HILANG (semua tumbang saat defeat).
 // Dipertahankan: Level, XP, SP — F10 nanti: alokasi SP (K) + Upgrade Tree (L).
 for(const ch of chars){
  ch.inv=new Array(12).fill(null);
  ch.armor=null;ch.slots.rec=null;ch.slots.buff=null;
  ch.buffs=[];ch.regen=null;ch.st={};
  if(ch.flames)ch.flames.visible=false;
  Object.assign(ch,{x:ch._home.x,z:ch._home.z,
   hp:CHARS[ch.id].hp,mag:CHARS[ch.id].weapon.mag,
   reloadT:0,fireT:0,energy:0,path:[],lock:null,state:'idle',lastHit:-99,
   stoveWave:-1,down:false,recovering:false,deployed:true,seat:null}); // F7c: roster penuh saat retry + F10.10.3
  ch._fall=null;ch._downAnimT=0;ch._tgt=null;ch._aimT=-99;
  ch._ks={until:0,stacks:0,cdUntil:0}; // F7(3): reset pasif
  ch._mot=null;ch._motHitsLeft=0;ch.cycle=null;ch._revive=null;
  ch._burst=null; // F8a(3b)
  if(CHARS[ch.id]&&CHARS[ch.id].weapon.sfxOnce)sfxStop(GUN_SFX[ch.id]); // F9c fail-safe
  ch._reloadMul=null; // F9b D34
  ch._relN=0;ch._lsBonus=null;ch._bombN=0; // F9d: pasif counters
  ch.jc=emptyJc();ch.journal=null; // F10.4: journal reset (repick di startNightIntro berikutnya)
  ch._inCover=false;
  ch.buffs=ch.buffs.filter(b=>!b.lastshot); // F9d: buff lastShot ikut bersih
  ch.mesh.visible=true;ch.mesh.rotation.set(0,0,0);
  const u=ch.mesh.userData;
  if(u.rig){u.rig.rotation.set(0,0,0);u.rig.position.set(0,0,0);}
  u.gunArm.rotation.set(u.aim?u.aim.down:0,0,0);
  if(u.offArm)u.offArm.rotation.set(0,0,0);
  u.legL.rotation.set(0,0,0);u.legR.rotation.set(0,0,0);
 }
 selChar=diaz;
 for(const c of chars)c.selected=(c===diaz);
 // FIX(32): RETRY = kembali ke NIGHT 1 + deploy menu pembuka §23.2.
 // Bertahan: level/XP/SP, roster unlock (S.owned), Respect terkumpul,
 // deploy cap mengikuti night.n=1 → 20 (cap lama ikut reset — night baru).
 S.respect=S._bankedRespect!==undefined?S._bankedRespect:S.respect; // FIX(32): retry & restart = roll-back ke Respect pra-night (reward hangus — cegah farming abuse)
 night.n=1;
 S.deployOrder=chars.map(c=>c.id); // F7c(3): urutan default
 enforceDeployCap(); // FIX(33) #3: roster > cap 20 di-bench SEBELUM menu — pemain lihat susunan legal
 layoutSquadCards();
 Object.assign(night,{wave:0,phase:'deploy',t:15,queue:0,spawnT:0,timeBonus:0,eliteQ:0,bossQ:0});
 planEscalation();
 setLightPhase('prep');
 S.state='playing';
 showEl('defeat',false);
 // FIX(48) P7: parameter `silent` — loadGame memanggil resetGame(true) agar tidak
 // memunculkan banner "RETRY" + Deploy Menu sesaat sebelum layar "SAVE LOADED".
 if(!silent){
  openDeploy(); // FIX(32): buka Deploy Menu seperti game baru (startDeployPhase tanpa banner dobel)
  banner('RETRY — NIGHT 1','PREPARE YOUR SQUAD');
 }
 bgmRestart();
}

// ================= 23. GAME LOOP =================
const clock=new THREE.Clock();
function d2(ax,az,bx,bz){const dx=ax-bx,dz=az-bz;return dx*dx+dz*dz}
function loop(){
 requestAnimationFrame(loop);
 const dt=Math.min(clock.getDelta(),.05);
 // F12.4e: state MENU — canvas TIDAK dirender (HTML overlay fullscreen foto
 // menutupinya). Hanya clear color buffer, hemat GPU. Semua logic game di-skip.
 if(S.state==='menu'){
  renderer.clear();
  return;
 }
// F12.11-B2: state JOMBIPEDIA — render scene 3D terpisah.
if(S.state==='jombipedia'){
 if(typeof jombTick === 'function'){
  try{ jombTick(dt); }catch(e){ console.error('[JOMB]',e); }
  return;
 }
 renderer.clear();
 return;
}
 try{
  if(!S.paused){
   S.now+=dt;S.time+=dt;
   if(S.state==='playing'){
    for(const ch of chars)updateChar(ch,dt); // F7(2): semua karakter
    astarResetBudget(); // F12.13-perf: reset budget A* tiap frame
    for(const z of zombies.slice())updateZombie(z,dt);
    updateTraps(dt);
    updateZones(dt);updateFX(dt);
    updateBullets(dt);
    updateSpit(dt); // F12.13: proyektil Spitter
    updateNight(dt);
    updateRescue(dt); // F8b: panah HELP / timeout 60s / drag + timer QTE
    }else if(S.state==='defeat'){
    defeatT-=dt; // pose rebah tiap karakter ditangani updateDownPose di loop chars
    if(defeatT<=0&&$('defeat').style.display!=='flex')showDefeatScreen();
   }
   // F7: posisi + animasi jalan + seleksi SEMUA karakter
   for(const ch of chars){
    if(offField(ch))continue;  // F7(2): RECOVERING — absen dari medan §13
    const u=ch.mesh.userData;
    const dsh=stairHeight(Math.floor(ch.x),Math.floor(ch.z));
    const fh=floorHeight(Math.floor(ch.x),Math.floor(ch.z)); // F10.13i: top floor (.08 tile / 0 ground)
    // F10.13c: sleep offset .40→.58 — top kasur dunia ≈.44 + half-thickness tubuh rebah ≈.14.
    // (Sit tetap .15 — sudah pas di sofa/kursi.)
    const ySeat=ch.seat?(ch.seat.kind==='sleep'?.58:.15):0;
    ch.mesh.position.set(ch.x,
     dsh+fh+ySeat+(ch.state==='moving'?Math.abs(Math.sin(ch.walkPhase))*.05:0),ch.z);
    if(ch.down){ // F7(2): TUMBANG — pose rebah (pola death-pose, semua state)
     updateDownPose(ch,dt);
    }else if(ch.seat){
     updateSeatPose(ch); // F10.10.3: duduk/tidur — lock pose
    }else if(S.state!=='defeat'){
     const sw=ch.state==='moving'?Math.sin(ch.walkPhase)*.55:0;
     u.legL.rotation.x=sw;u.legR.rotation.x=-sw;
     // F7(1.5b): POSE SENJATA — _tgt di-cache updateChar (hemat LOS ganda)
     if(u.aim){
      const tgt=ch._tgt;
      if(tgt)ch._aimT=S.now;
      const engaged=S.now-(ch._aimT||-99)<.6;  // grace 0.6 dtk anti-kedip
      const base=engaged?u.aim.up:u.aim.down;
      const k=Math.min(1,dt*10);
      for(const p of u.aim.parts){
       let r=base;
       if(!engaged)r+=(p.position.x>0?1:-1)*sw*.7;
       p.rotation.x+=(r-p.rotation.x)*k;
      }
      if(u.aimSupport){ // FIX(19b): dua tangan — kiri memegang handguard saat menembak
       const s=u.aimSupport;
       const rx=engaged?-1.45:sw*.7,rz=engaged?-.85:0;
       s.rotation.x+=(rx-s.rotation.x)*k;
       s.rotation.z+=(rz-s.rotation.z)*k;
      }else if(u.offArm&&!u.aim.parts.includes(u.offArm))
       u.offArm.rotation.x=sw*.7;              // lengan polos (Diaz kiri)
     }else if(u.offArm)u.offArm.rotation.x=sw*.7;
    }
    if(u.selArrow)u.selArrow.visible=ch.selected&&!ch.down;
    if(u.flashT>0){u.flashT-=dt;
     if(u.flashT<=0)for(const m of u.flashMats)m.emissive.setRGB(0,0,0);}
    if(ch._muzT>0){ // FIX(8): flash per karakter — di larasnya sendiri
     ch._muzT-=dt;
     for(let i=0;i<ch._flashes.length;i++){
      const fm=ch._flashes[i];
      fm.visible=ch._muzT>0&&(i===0||ch._muzDual);
      fm.scale.setScalar(rnd(.8,1.2));
     }
    }else for(const fm of ch._flashes)fm.visible=false;
   }
   for(const z of zombies){
    const zu=z.mesh.userData;
    if(z.retreat)z.mesh.position.set(z.x,z.mesh.position.y,z.z);
    else{
     const zfh=floorHeight(Math.floor(z.x),Math.floor(z.z)); // F10.13i: top floor
     z.mesh.position.set(z.x,stairHeight(Math.floor(z.x),Math.floor(z.z))+zfh+(z.flyY||0),z.z);
    }
    if(!z.retreat&&!z.dying&&(zu.legL||zu.armL)){
     const s=Math.sin(z.walkPhase);
     if(zu.legL){zu.legL.rotation.x=s*.5;zu.legR.rotation.x=-s*.5;}
     if(zu.armL){
      // FIX(12e): base=0 → cakar crawler menjulur HORIZONTAL ke depan (sejajar
      // lantai), tidak naik ke atas maupun turun. Amp .3 → osilasi kecil saat
      // merayap. Walker/others tetap -1.05 (pose mengangkat).
      // F12.11-fix7: Creeper (quadruped knuckle-walker) pakai base=-.55
      // (matching pose build) supaya lengan tetap menggantung ke tanah.
      const beast = z.T.crawl || z.type === 'Creeper';
      const base = beast ? (z.type==='Creeper' ? -.55 : 0) : -1.05;
      const amp  = beast ? .30 : .15;
      zu.armL.rotation.x=base-s*amp;zu.armR.rotation.x=base+s*amp;
     }
    }
    if(zu.flashT>0){zu.flashT-=dt;
     if(zu.flashT<=0)for(const m of zu.flashMats)m.emissive.setRGB(0,0,0);}
   }
   {const sc=selChar||chars.find(c=>!offField(c))||diaz; // F7c: fallback char di medan
    const scSh=stairHeight(Math.floor(sc.x),Math.floor(sc.z));
    lantern.position.set(sc.x,1.7+scSh,sc.z);
    // F10.13e: ring dashed aqua bawah kaki char terpilih — y=.095 di atas top
    // lantai (.08), rotate kontinu, hide saat tidak ada seleksi valid.
    if(selChar&&!selChar.down&&!offField(selChar)){
     const selSh=stairHeight(Math.floor(selChar.x),Math.floor(selChar.z));
     selRing.visible=true;
     selRing.position.set(selChar.x,selSh+.095,selChar.z);
     // F10.13g: 8 detik/putaran = π/4 ≈ 0.785 rad/s (was 3s/rev @ 2.094)
     selRing.rotation.y+=dt*(Math.PI/4);
    }else selRing.visible=false;}
   if(muzzleT>0){muzzleT-=dt;
    muzzleLight.intensity=3.2*Math.max(0,muzzleT/.07);}
   else muzzleLight.intensity=0;
   if(boomT>0){boomT-=dt;boomLight.intensity=6*Math.max(0,boomT/.3);}
   else boomLight.intensity=0;
   if(fireplace.t>0){
    fireplace.t-=dt;
    fireLight.intensity=.85+rnd(-.15,.15);
    if(fireMesh){fireMesh.visible=true;
     fireMesh.children[0].scale.set(rnd(.8,1.2),rnd(.85,1.25),1);
     fireMesh.children[1].scale.set(rnd(.7,1.3),rnd(.8,1.3),1);
     fireMesh.children[2].scale.set(rnd(.6,1.4),rnd(.7,1.3),1);}
   }else{fireLight.intensity=0;if(fireMesh)fireMesh.visible=false;}
   updateDebris(dt);
   for(const L of lanterns.values()){
    L.light.intensity=1.05+rnd(-.18,.18);
    L.core.scale.setScalar(rnd(.85,1.15));
   }
   updateCorpseParts(dt);
   updateFogPatches(dt);
   for(const d of pathDots.slice()){
    d.userData.t-=dt;d.scale.setScalar(Math.max(.01,d.userData.t));
    if(d.userData.t<=0){scene.remove(d);pathDots.splice(pathDots.indexOf(d),1);}
   }
   for(const it of S.gItems.slice()){
    it.mesh.position.y=.12+.04*Math.sin(S.now*3+it.ph);
    it.mesh.rotation.y+=dt;
    if(S.state==='playing'&&S.now>=(it.noPick||0)){
     for(const ch of chars){ // F7(2): char hidup terdekat dalam radius pickup
      if(ch.down||offField(ch))continue;
      if(d2(ch.x,ch.z,it.x,it.z)<=2.25){
       const left=addItem(it.id,it.q,ch);
       if(left<it.q){
        floatText(it.x,it.z,'+'+(it.q-left)+' '+ITEMS[it.id].n,'gainItem');SFX('pickup');
        S.resourcesCollected[it.id]=(S.resourcesCollected[it.id]||0)+(it.q-left); // P2: scavenge
        if(ch.jc){ // F10.4
         ch.jc.resTotal+=(it.q-left);
         if(it.id==='metal')ch.jc.res_metal+=(it.q-left);
         if(it.id==='cloth')ch.jc.res_cloth+=(it.q-left);
        }
        if(S.ui==='inv'&&ch===panelChar())renderInv();
        if(S.ui==='store'&&curStore)renderStore(curStore);
       }
       if(left>0)it.q=left;
       else{scene.remove(it.mesh);S.gItems.splice(S.gItems.indexOf(it),1);}
       break;
      }
     }
    }
   }
   // konstruksi per karakter — ring & suara masing-masing (F7(3b), D5 paralel)
   for(const ch of chars){
    const co=ch.constr;
    if(!co){hideConstrRing(ch);continue;}
    co.t+=dt;
    if(co.sndT===undefined){
     co.sndT=0;
     co.wn=constrWorkSnd(co);
     if(co.wn){
      if(sfxHasCustom(co.wn))constrPlayWork(co,co.wn);
      else co.tick=true; // file tidak ada → fallback ketukan berulang
     }
    }
    if(co.tick){
     co.sndT-=dt;
     if(co.sndT<=0){
      if(!sfxHasCustom(co.wn))SFX(co.wn); // tick hanya prosedural
      co.sndT=.85;
     }
    }
    const dsh2=stairHeight(co.x,co.y);
    const[sx,sy]=toScreen(co.x+.5,1.4+dsh2,co.y+.5);
    const ring=constrRing(ch);
    ring.style.display='block';
    ring.style.left=sx+'px';ring.style.top=sy+'px';
    updateProgIcon(co,ring.querySelector('.cprLbl'));
    const deg=clamp(co.t/co.dur*360,0,360);
    ring.querySelector('.cprRing').style.background=
     'conic-gradient(#d9a13b 0deg '+deg+'deg, rgba(30,24,16,.6) '+deg+'deg 360deg)';
    if(co.kind==='craft'&&S.ui==='craft'&&co.owner===panelChar())
     updateCraftWipe(co); // F6.5(3a)+F7(3b): wipe HANYA di menu pemilik craft
    if(co.t>=co.dur){
     if(!canAfford(co.cost,co.owner))
      toast('Not enough materials — construction cancelled','bad');
     else{
      consumeMats(co.cost,co.owner);
      if(co.kind==='build'){
       const ow=co.owner;
       const face=Math.atan2(ow.x-(co.x+.5),ow.z-(co.y+.5));
       if(BUILDS[co.bid].spot==='floor'){
        const tr=addTrap(co.bid,co.x,co.y,ow);
        if(tr)tr.mesh.rotation.y=face;
       }else addBarricade(co.x,co.y,co.bid);
       toast(BUILDS[co.bid].n+' BUILT','good');
       S.buildsDone++; // P2: Fortifications Built
       if(co.owner.jc){ // F10.4
        co.owner.jc.builds++;
        if(co.bid==='makeshift')co.owner.jc.makeshiftCount++;
       }
       chatPush('built',co.owner,BUILDS[co.bid].n);} // F9b.5
      else if(co.kind==='wallrepair'){
       repairWall(co.wall);
       toast('WALL REPAIRED — full HP (grey patch)','good');
       S.repairsDone++; // P2: Fortifications Repaired
       chatPush('repaired',co.owner,'the wall');} // F9b.5
      else if(co.kind==='craft'){
       // slot sudah memuat item sama → hasil craft stack ke SANA (milik pemilik)
       const tp=ITEMS[co.bid].type,ow=co.owner;
       let placed=false;
       if(tp==='heal'&&ow.slots.rec&&ow.slots.rec.id===co.bid
        &&ow.slots.rec.q<ITEMS[co.bid].stack){
        ow.slots.rec.q++;placed=true;
       }else if(tp==='buff'&&ow.slots.buff&&ow.slots.buff.id===co.bid
        &&ow.slots.buff.q<ITEMS[co.bid].stack){
        ow.slots.buff.q++;placed=true;
       }
       // Pindahkan dua baris ini ke atas
       const isArmor=ITEMS[co.bid].type==='armor';
       const qual=(isArmor&&ow.id==='sobel')?'sobel':null;

       if(!placed){
        // F10.10.2: armor craft — assign quality 'sobel' kalau crafter adalah Sobel.
        // Bonus: dur/max ×1.25, sdef ×1.1. Field sdef dibaca saat equip.
        if(isArmor){
         let placedArmor=false;
         for(let ii=0;ii<12;ii++)if(!ow.inv[ii]&&ii!==dragRes){
          const A=ARMORS[co.bid];
          const dur=qual==='sobel'?Math.round(A.dur*1.25):A.dur;
          ow.inv[ii]={id:co.bid,q:1,dur,max:dur,
           quality:qual,sdef:qual==='sobel'?Math.round(A.def*1.1):null};
          placedArmor=true;break;
         }
         if(!placedArmor)spawnGItem(co.bid,1,ow.x+rnd(-.3,.3),ow.z+rnd(-.3,.3));
        }else{
         const left=addItem(co.bid,1,ow);
         if(left>0)spawnGItem(co.bid,left,ow.x+rnd(-.3,.3),ow.z+rnd(-.3,.3));
        }
       }
       toast(ITEMS[co.bid].n+' CRAFTED'+(placed?' → SLOT':'')+(qual==='sobel'?' ★ SOBEL':''),'good');
       S.craftsDone++; // P2: Items Crafted
       if(co.owner.jc){ // F10.4
        co.owner.jc.crafts++;
        if(ITEMS[co.bid].type==='heal')co.owner.jc.healCrafts++;
        if(co.bid==='military')co.owner.jc.militaryCraft++;
       }
      }
      else if(co.kind==='cplace'){
       const ow=co.owner;
       const face=Math.atan2(ow.x-(co.x+.5),ow.z-(co.y+.5));
       const obj=placeObject(co.bid,co.x,co.y);
       if(obj)obj.rotation.y=face;
       toast(ITEMS[co.bid].n+' PLACED','good');}
      else{co.bk.hp=co.bk.max;
       toast(co.bk.n+' REPAIRED — full HP','good');
       S.repairsDone++; // P2: Fortifications Repaired
       if(co.owner.jc){ // F10.4
        co.owner.jc.builds++;
        if(co.bk.id==='makeshift')co.owner.jc.makeshiftCount++;
       }
       chatPush('repaired',co.owner,co.bk.n);} // F9b.5
      SFX('built');
      if(S.ui==='inv'&&ch===panelChar())renderInv();
      if(S.ui==='craft'&&ch===panelChar())renderCraft();
     }
     constrStopWork(co);
     ch.constr=null;
    }
   }
   updateSkillRing();updateBuildGhost();updateReviveRing(); // F7b
   updateSquadChat(dt); // F9b.5: umur & stack bubble
   updateThrow(dt);updateThrowFly(dt);updateSticky(dt); // F9c: mode lempar + proyektil + sticky
   const pan=CFG.panSpeed*dt/camera.zoom;
   if(keys.w){camT.x-=pan;camT.z-=pan}
   if(keys.s){camT.x+=pan;camT.z+=pan}
   if(keys.a){camT.x-=pan;camT.z+=pan}
   if(keys.d){camT.x+=pan;camT.z-=pan}
   camT.x=clamp(camT.x,4,36);camT.z=clamp(camT.z,4,28);
   syncCamera();
   updateLighting(dt);
   updateFloats(dt);
   updateStPops(dt);
   updateOverheads();
   hudT-=dt;if(hudT<=0){hudT=.15;refreshHud();}
   {const jT=S.now-((loop._jT)||0);if(jT>=.5){loop._jT=S.now;
    for(const ch of chars)checkJournal(ch);}} // F10.4: cek misi tiap 0.5s
  }
 }catch(err){
  reportErr(err&&err.message||String(err));
 }
 if(composer)composer.render();
 else renderer.render(scene,camera);
}

// ================= 24. BOOT =================
{
 const kl=document.createElement('div'); // F7(3c): kill list (pengganti resStrip)
 kl.id='killList';
 kl.style.cssText='position:fixed;top:50px;left:12px;pointer-events:none;z-index:10;'
  +'display:flex;flex-direction:column;gap:1px;font-size:11px;'
  +'text-shadow:0 1px 2px #000,0 0 4px #000';
 document.body.appendChild(kl);
}
{
 const old=$('mini');if(old)old.remove(); // kartu mini lama pensiun
 const host=document.createElement('div');
 host.className='squad-cards';host.id='squad-container';
 let h='';
 for(const ch of chars){ // F7: kartu per karakter §23.5
  h+='<div id="card-'+ch.id+'" class="character-card'+(ch.selected?' selected':'')+'">'
  +'<div class="portrait-box">'
  +'<img id="portrait-'+ch.id+'" src="" alt="" style="width:140px;height:170px">'
  +'<span class="level-badge" id="lvl-'+ch.id+'" title="Level">1</span>'
  +'<span class="ammo-badge" id="mag-'+ch.id+'" title="Magazine">9/9</span>'
  +'<span class="portrait-name">'+ch.n+'</span>'
  +'<span class="down-mark">+</span>'
  +skillIconHtml(ch.id) // F10.2.2b: ikon skill bottom-right potret
  +'<div class="skillFill" id="skillFill-'+ch.id+'"></div>' // F10.2.2c: fill durasi skill
  +'</div>'
  +'<div class="character-detail">'
  +'<div class="character-title">'
  +'<div><strong>'+ch.n+'</strong><span id="sub-'+ch.id+'">STARTER · '+CHARS[ch.id].weapon.name+'</span></div>'
  +'</div>'
  +'<div id="st-'+ch.id+'" class="st-list"></div>'
  +'<div class="bar-label"><span>HP</span><b id="hp-'+ch.id+'">100 / 100</b></div>'
  +'<div class="meter hp"><i id="hp-bar-'+ch.id+'"></i></div>'
  +'<div class="bar-label"><span>ENERGY</span><b id="en-'+ch.id+'">0 / 100</b></div>'
  +'<div class="meter energy"><i id="en-bar-'+ch.id+'"></i></div>'
  +'<div class="bar-label"><span>XP</span><b id="xp-'+ch.id+'">0 / 1000</b></div>'
  +'<div class="meter xp"><i id="xp-bar-'+ch.id+'"></i></div>'
  +'<div class="card-foot"><span id="buff-'+ch.id+'">—</span></div>' // FIX(27): wep dihapus — duplikat label sub-
  +'</div></div>';
 }
 host.innerHTML=h;
 document.body.appendChild(host);
 for(const ch of chars){ // F7: klik kartu = seleksi
  const card=$('card-'+ch.id);
  if(card)card.addEventListener('click',()=>{
   if(ch.recovering){toast(ch.n+' is RECOVERING','bad');return;}
   if(!ch.deployed){toast(ch.n+' is in reserve — deploy via menu (T)','bad');return;} // F7c
   selChar=ch;
   for(const c of chars)c.selected=(c===ch);
   toast(ch.n+' selected');
  });
 }
}
{
 const si=document.createElement('div'); // F7c §23.6: info bar di bawah kartu
 si.id='squadInfo';
 si.innerHTML='<span>★ <b id="siRes">0</b> RESPECT</span>'
  +'<span class="dep">DEPLOY <b id="siDep">2/5 · 20/100</b></span>'; // FIX(47) P6
 document.body.appendChild(si);
}
S.deployOrder=chars.map(c=>c.id); // F7c(3): urutan awal
layoutSquadCards();
const PORTRAITS={}; // F7c: snapshot potret (dataURL) utk kartu deploy
// FIX(44): WebGL context leak — dulu tiap hero bikin WebGLRenderer baru
// (13 context saat boot + 1 tiap unlock runtime) → tembus limit browser ~16
// → context lama dibunuh acak → canvas utama blank. Kini 1 singleton offscreen
// renderer, di-reuse utk SEMUA hero. Total context tetap 2 (main + portrait).
let _prR=null,_prCanvas=null,_prScene=null,_prCam=null;
function _prInit(){
 if(_prR)return;
 _prCanvas=document.createElement('canvas');
 _prCanvas.width=140;_prCanvas.height=170;
 _prR=new THREE.WebGLRenderer({canvas:_prCanvas,alpha:true,antialias:true});
 _prR.setPixelRatio(Math.min(devicePixelRatio,2));
 _prR.setSize(140,170,false);
 _prScene=new THREE.Scene();
 _prScene.add(new THREE.AmbientLight(0xf0e0c8,1.3));
 const sun=new THREE.DirectionalLight(0xfff4d7,1.6);
 sun.position.set(-2,4,3);_prScene.add(sun);
 // framing: kepala dekat nama (atas), celana jeans sedikit terlihat (bawah)
 // frame dunia y ≈ 0.30 (paha atas) – 1.46 (rambut) — pusat .88, tinggi 1.16
 _prCam=new THREE.OrthographicCamera(-.48,.48,.58,-.58,.1,15);
 _prCam.position.set(.85,1.15,4);
 _prCam.lookAt(0,1.15,0);
}
function _prClearModel(){ // dispose model lama — geometry & material tak di-share dgn gameplay
 if(!_prScene)return;
 for(const o of _prScene.children.slice()){
  if(o.isLight)continue;
  _prScene.remove(o);
  o.traverse(c=>{
   if(c.geometry)c.geometry.dispose();
   if(c.material){
    if(Array.isArray(c.material))for(const m of c.material)m.dispose();
    else c.material.dispose();
   }
  });
 }
}
function makePortrait(heroId){ // F8a + FIX(44): reuse singleton, snapshot ke PORTRAITS
 _prInit();
 try{
  _prClearModel();
  const model=HERO_MESH[heroId](); // F8a: pabrik per hero
  model.userData.selArrow.visible=false; // segitiga seleksi tak ikut difoto 😄
  if(model.userData.aim)for(const p of model.userData.aim.parts)
   p.rotation.x=model.userData.aim.up; // F7(1.5): potret memakai pose tempur
  model.rotation.y=-.32;                // pose 3/4
  _prScene.add(model);
  _prR.render(_prScene,_prCam);
  try{PORTRAITS[heroId]=_prCanvas.toDataURL();}catch(e){} // F7c: snapshot
  // update <img> di kartu squad bila sudah ada di DOM (boot / unlock runtime)
  const img=$('portrait-'+heroId);
  if(img&&img.tagName==='IMG'&&PORTRAITS[heroId])img.src=PORTRAITS[heroId];
 }catch(e){console.warn('Portrait render failed:',e);}
}
for(const id of ALL_IDS)makePortrait(id); // F8a: snapshot SEMUA hero (owned+locked)
{
 if($('mini')){
  const mb=document.createElement('div');
  mb.id='mBuff';mb.className='sub';
  $('mini').appendChild(mb);
 }
}
setupBarricades();
// ===== F12.4: MAIN MENU (§23.1) =====
// Overlay HTML di atas canvas — tombol bottom-left, gradient vignette kiri→kanan.
// Latar 3D = menuScene (signpost Z + mobil rusak + silhouette mansion).
ensure('menuOverlay','',''
 +'<div id="menuBg"></div>'
 +'<div id="menuVignette"></div>'
 +'<div id="menuFlicker"></div>'
 +'<div id="menuSmoke">'
 +'<span></span><span></span><span></span><span></span><span></span><span></span>'
 +'</div>'
 +'<div class="menuTitle">THE MUSTER POINT<span class="menuZ">Z</span></div>'
 +'<div class="menuSub">ENDLESS STAGE SURVIVAL</div>'
 +'<div class="menuBtns">'
 +'<button class="menuBtn primary" id="btnSurvive">SURVIVE</button>'
 +'<button class="menuBtn" id="btnLoadSave">LOAD LAST SAVE</button>'
 +'<button class="menuBtn" id="btnMenuOptions">OPTIONS</button>'
 +'<button class="menuBtn" id="btnKeybinds">KEYBINDINGS</button>'
 +'<button class="menuBtn" id="btnJombipedia">JOMBIPEDIA</button>'
 +'<button class="menuBtn" id="btnExit">EXIT</button>'
 +'</div>'
 +'<div class="menuFoot">v0.12 · Phase 12 · pre-release</div>');
// KEYBINDINGS panel — dibuka dari menu (bisa juga dari pause nanti)
ensure('keybindPanel','position:fixed;inset:0;display:none;align-items:center;'
 +'justify-content:center;background:rgba(5,4,3,.75);z-index:42;pointer-events:auto',
 '<div class="f3p" style="width:640px">'
 +'<div class="f3h"><h2>KEYBINDINGS</h2>'
 +'<button class="f3x" id="keybindX">×</button></div>'
 +'<div style="padding:14px 22px;display:grid;grid-template-columns:1fr 1fr;gap:0 30px">'
 +'<div class="kbRow"><b>WASD</b><span>Pan camera</span></div>'
 +'<div class="kbRow"><b>SCROLL</b><span>Zoom</span></div>'
 +'<div class="kbRow"><b>LMB</b><span>Select / place</span></div>'
 +'<div class="kbRow"><b>RMB</b><span>Move / lock / interact</span></div>'
 +'<div class="kbRow"><b>Q</b><span>Skill</span></div>'
 +'<div class="kbRow"><b>R</b><span>Reload</span></div>'
 +'<div class="kbRow"><b>I</b><span>Inventory</span></div>'
 +'<div class="kbRow"><b>B</b><span>Building</span></div>'
 +'<div class="kbRow"><b>C</b><span>Crafting</span></div>'
 +'<div class="kbRow"><b>T</b><span>Deploy menu</span></div>'
 +'<div class="kbRow"><b>K</b><span>Character stats</span></div>'
 +'<div class="kbRow"><b>J</b><span>Journal</span></div>'
 +'<div class="kbRow"><b>L</b><span>Upgrade tree</span></div>'
 +'<div class="kbRow"><b>H</b><span>Heal item</span></div>'
 +'<div class="kbRow"><b>G</b><span>Buff item</span></div>'
 +'<div class="kbRow"><b>O</b><span>Options</span></div>'
 +'<div class="kbRow"><b>M</b><span>Mute toggle</span></div>'
 +'<div class="kbRow"><b>ESC</b><span>Pause / close</span></div>'
 +'</div>'
 +'<div class="f3f">Fixed keybindings for this build</div>'
 +'</div>');
// F12.4b: hide/show SEMUA HUD gameplay sekaligus. Dipanggil saat masuk/keluar
// menu — supaya topbar, night bar, rail, squad cards, squad info, kill list,
// floaters & overheads tidak menumpuk di atas menu overlay.
// Pakai '' (bukan 'block') agar display asli dari CSS (flex/grid) kembali.
function setGameHudVisible(v){
 const d=v?'':'none';
 for(const id of ['hud','squad-container','squadInfo','killList','floaters','overheads']){
  const el=document.getElementById(id);
  if(el)el.style.display=d;
 }
 if(!v){ // skipBtn/endNightBtn punya logic refreshHud — paksa hide saat menu
  const sb=document.getElementById('skipBtn');if(sb)sb.style.display='none';
  const en=document.getElementById('endNightBtn');if(en)en.style.display='none';
 }
}
function openKeybinds(){
 const p=$('keybindPanel');
 if(p)p.style.display='flex';
 SFX('invOpen');
}
function closeKeybinds(){
 const p=$('keybindPanel');
 if(p)p.style.display='none';
 SFX('invClose');
}
function menuExitConfirm(){
 const d=ensure('exitConfirm','position:fixed;inset:0;z-index:44;display:none;'
  +'align-items:center;justify-content:center;background:rgba(5,4,3,.85);pointer-events:auto');
 d.innerHTML='<div class="f3p" style="width:440px;text-align:center;padding:24px">'
  +'<h2 style="font:22px Staatliches,sans-serif;color:#c0453a;letter-spacing:.14em">'
  +'LEAVE THE GAME?</h2>'
  +'<p style="font:11px monospace;color:#cfc4a6;margin:14px 0 18px;line-height:1.7">'
  +'For browser security, force-closing a tab is not allowed from scripts.<br>'
  +'Use <b style="color:#d9a13b">Ctrl+W</b> / <b style="color:#d9a13b">Alt+F4</b>, '
  +'or click the tab\'s close button.</p>'
  +'<div style="display:flex;gap:10px;justify-content:center">'
  +'<button id="exitNo" class="dbtn" style="min-width:140px">CANCEL</button>'
  +'<button id="exitYes" class="dbtn red" style="min-width:140px">OK</button>'
  +'</div></div>';
 d.style.display='flex';
 $('exitNo').onclick=()=>{d.style.display='none';SFX('click');};
 $('exitYes').onclick=()=>{
  d.style.display='none';
  try{window.open('','_self');window.close();}catch(e){}
  // fallback — browser blok close dari script (perilaku umum):
  banner('YOU MAY CLOSE THIS TAB','THANK YOU FOR PLAYING');
 };
}
// F12.7: SURVIVE = selalu New Game (Night 1 fresh). Load dari save punya
// tombol eksplisit sendiri (LOAD LAST SAVE). showContinueDialog tetap ada
// di code untuk reuse di masa depan, tapi tidak dipanggil dari sini.
function startFromMenu(){
 showEl('menuOverlay',false);
 showEl('pause',false); // F12.8c: defensive — pastikan pause tidak nyangkut
 setGameHudVisible(true);
 S.state='playing';
 S.paused=false;
 resumeAudio();
 startDeployPhase();
 toast('Bunuh zombie → ambil drop → tekan B untuk membangun barikade','good');
 bgmSync();
}
function loadFromMenu(){
 if(!localStorage.getItem(SAVE_KEY)){toast('No save file found','bad');return;}
 showEl('menuOverlay',false);
 showEl('pause',false); // F12.8c: defensive
 setGameHudVisible(true);
 S.state='playing';
 S.paused=false;
 resumeAudio();
 if(!loadGame())startDeployPhase(); // save korup → fallback new game
 bgmSync();
}
// F12.7: kembali ke menu dari pause overlay / session stats. Silent reset
// (FIX 48) — tanpa banner RETRY, tanpa Deploy Menu, langsung menu overlay.
function returnToMainMenu(){
 resetGame(true);
 night.phase='deploy';night.t=15; // konsisten state pre-game
 S.state='menu';
 S.paused=true;
 // F12.8c: bersihkan overlay pause/defeat yang bisa tertinggal dari state
 // sebelumnya. Tanpa ini, pause overlay tetap visible di belakang menu, dan
 // saat user klik SURVIVE lagi, pause-nya kelihatan seperti "balik ke pause".
 showEl('pause',false);
 showEl('defeat',false);
 showEl('menuOverlay',true);
 setGameHudVisible(false);
 bgmSync(); // fade ke menu BGM
}
{const b=$('btnSurvive');if(b)b.onclick=startFromMenu;}
{const b=$('btnLoadSave');
 if(b){
  b.onclick=loadFromMenu;
  b.disabled=!localStorage.getItem(SAVE_KEY); // F12.7: grey-out kalau no save
 }}
{const b=$('btnMenuOptions');if(b)b.onclick=()=>openOptions();}
{const b=$('btnKeybinds');if(b)b.onclick=()=>openKeybinds();}
{const b=$('btnJombipedia');
 if(b){
  b.onclick=()=>{
   if(typeof openJombipedia==='function') openJombipedia();
  };
 }}
{const b=$('btnExit');if(b)b.onclick=()=>menuExitConfirm();}
{const b=$('keybindX');if(b)b.onclick=closeKeybinds;}
// ===== F12.11: JOMBIPEDIA overlay — bestiary + roster reference =====
ensure('jombPanel',
 'position:fixed;inset:0;z-index:43;display:none;pointer-events:auto;'
 +'background:transparent;box-sizing:border-box',
 '<div id="jombHeader"><h1>JOMBIPEDIA</h1><p>BESTIARY &amp; ROSTER REFERENCE</p></div>'
 +'<div id="jombTabs">'
 +'<button class="jombTab on" id="jombTabZom">ZOMBIES</button>'
 +'<button class="jombTab" id="jombTabRoster">SURVIVORS</button>'
 +'</div>'
 +'<div id="jombRoster"></div>'
 +'<div id="jombInfo"></div>'
 +'<div id="jombToolbar">'
 +'<button class="jombBtn on" id="jombTt">TURNTABLE: ON</button>'
 +'<button class="jombBtn" id="jombSt">STANCE: IDLE</button>'
 +'<button class="jombBtn" id="jombRst">RESET VIEW</button>'
 +'<button class="jombBtn" id="jombCloseBtn">&times; CLOSE</button>'
 +'</div>'
 +'<div id="jombHint">LMB: Rotate · RMB: Pan · Scroll: Zoom</div>');
// ===== F12.11-B3: MOUSE DRAG ROTATE =====
// Listener di #jombPanel. Trigger hanya kalau klik tepat pada panel (target===jp),
// BUKAN pada roster item / tab / tombol — sehingga klik UI tetap berfungsi normal.
// pointermove/up dipasang di window supaya drag tetap ter-track saat mouse
// keluar area panel.
(function jombDragInit(){
 const jp = document.getElementById('jombPanel');
 if(!jp){ console.warn('[JOMB-B3] jombPanel not found — drag disabled'); return; }

 jp.addEventListener('pointerdown', e=>{
  if(e.target !== jp) return;          // klik di UI → biarkan handler child
  if(e.button !== 0) return;           // hanya LMB
  jombDrag = {
   x0: e.clientX, y0: e.clientY,
   rotY0: jombRotY, rotX0: jombRotX
  };
  jp.style.cursor = 'grabbing';
  try{ jp.setPointerCapture(e.pointerId); }catch(_){}
 });

 jp.addEventListener('pointermove', e=>{
  if(!jombDrag) return;
  const dx = e.clientX - jombDrag.x0;
  const dy = e.clientY - jombDrag.y0;
  jombRotY = jombDrag.rotY0 + dx * .012;                 // yaw bebas
  jombRotX = Math.max(-.6, Math.min(.6, jombDrag.rotX0 + dy * .008)); // pitch clamp
 });

 const endDrag = e=>{
  if(!jombDrag) return;
  jombDrag = null;
  jp.style.cursor = '';
  try{ if(e && e.pointerId !== undefined) jp.releasePointerCapture(e.pointerId); }catch(_){}
 };
 jp.addEventListener('pointerup', endDrag);
 jp.addEventListener('pointercancel', endDrag);
 jp.addEventListener('pointerleave', e=>{
  // pointerleave tidak selalu trigger kalau pointer-capture aktif,
  // tapi berguna sebagai fallback kalau releasePointerCapture gagal
  if(jombDrag && e.buttons === 0) endDrag(e);
 });
 console.warn('[JOMB-B3] drag rotate initialized');
})();

function jombCleanup(){
 jombDisposeModel();
}

function openJombipedia(){
 const panel = $('jombPanel');
 if(!panel) return;

 // TAMBAHKAN BARIS INI: Cegah pemanggilan ganda jika sudah di dalam Jombipedia
 if(S.state === 'jombipedia') return; 

 if(S.ui) closeAllPanels();
 const menu = $('menuOverlay');
 if(menu) menu.style.display = 'none';
 panel.style.display = 'block';
 panel.style.pointerEvents = 'auto';
 S._jombReturn = S.state;
 S._jombPaused = S.paused;
 S.state = 'jombipedia';
 renderJombipedia();
 SFX('invOpen');
}

function closeJombipedia(){
 const panel = $('jombPanel');
 if(!panel) return;
 panel.style.display = 'none';
 panel.style.pointerEvents = 'none';
 jombDisposeModel();
 S.state = S._jombReturn || 'menu';
 S.paused = S._jombPaused || false;
 if(S.state === 'menu'){
  const menu = $('menuOverlay');
  if(menu) menu.style.display = 'flex';
 }else if(S.state === 'playing'){
  setGameHudVisible(true);
  if(S.paused) showEl('pause', true);
 }
 bgmSync();
 SFX('invClose');
}

function renderJombipedia(){
 const rosterEl = $('jombRoster');
 const infoEl = $('jombInfo');
 if(!rosterEl || !infoEl) return;
 rosterEl.innerHTML = '';
 infoEl.innerHTML = '';

 if(jombTab === 'zombies'){
  const zKeys = Object.keys(ZTYPES);
  zKeys.forEach((k, idx)=>{
   const z = ZTYPES[k];
   const item = document.createElement('div');
   item.className = 'jombItem' + (z.boss ? ' boss' : z.elite ? ' elite' : '') + (idx === 0 ? ' on' : '');
   item.innerHTML = '<span>' + (ZTYPE_LABEL[k] || k) + '</span><span class="sub">' + (z.boss ? 'BOSS' : z.elite ? 'ELITE' : 'NORMAL') + '</span>';
   item.onclick = ()=>{
    document.querySelectorAll('.jombItem').forEach(el=>el.classList.remove('on'));
    item.classList.add('on');
    showJombiInfo(k, z);
    if(typeof jombLoadModel==='function') jombLoadModel(k);
    SFX('click');
   };
   rosterEl.appendChild(item);
  });
  if(zKeys.length){
   showJombiInfo(zKeys[0], ZTYPES[zKeys[0]]);
   if(typeof jombLoadModel==='function') jombLoadModel(zKeys[0]);
  }
 } else {
  ALL_IDS.forEach((id, idx)=>{
   const c = CHARS[id];
   if(!c) return;
   const item = document.createElement('div');
   item.className = 'jombItem' + (idx === 0 ? ' on' : '');
   item.innerHTML = '<span>' + c.n + '</span><span class="sub">' + (c.rarity || 'STARTER').toUpperCase() + '</span>';
   item.onclick = ()=>{
    document.querySelectorAll('.jombItem').forEach(el=>el.classList.remove('on'));
    item.classList.add('on');
    showHeroInfo(id, c);
    if(typeof jombLoadModel==='function') jombLoadModel(id);
    SFX('click');
   };
   rosterEl.appendChild(item);
  });
  if(ALL_IDS.length && CHARS[ALL_IDS[0]]){
   showHeroInfo(ALL_IDS[0], CHARS[ALL_IDS[0]]);
   if(typeof jombLoadModel==='function') jombLoadModel(ALL_IDS[0]);
  }
 }
}

function showJombiInfo(name, z){
 const el = $('jombInfo');
 if(!el) return;
 el.innerHTML = '<div class="head"><div><h2>' + (ZTYPE_LABEL[name] || name) + '</h2>'
  +'<span class="sub">' + (z.boss ? 'THREAT: BOSS' : z.elite ? 'THREAT: ELITE' : 'NORMAL INFECTED') + '</span></div></div>'
  +'<div class="jombStat"><span>HEALTH</span><b>' + z.hp + '</b></div>'
  +'<div class="jombStat"><span>ATTACK</span><b class="warn">' + z.atk + '</b></div>'
  +'<div class="jombStat"><span>AGILITY</span><b>' + z.agi + '</b></div>'
  +'<div class="jombStat"><span>INTERVAL</span><b>' + z.interval + 's</b></div>'
  +'<div class="jombStat"><span>XP DROP</span><b class="good">+' + z.xp + ' XP</b></div>';
}

function showHeroInfo(id, c){
 const el = $('jombInfo');
 if(!el) return;
 const pName = PASSIVE_NAMES[c.passive] || c.passive.toUpperCase();
 el.innerHTML = '<div class="head"><div><h2>' + c.n + '</h2>'
  +'<span class="sub">' + (c.rarity || 'STARTER').toUpperCase() + ' &middot; ' + c.weapon.name + '</span></div></div>'
  +'<div class="jombStat"><span>BASE HP</span><b>' + c.hp + '</b></div>'
  +'<div class="jombStat"><span>BASE ATK</span><b>' + c.atk + '</b></div>'
  +'<div class="jombStat"><span>BASE DEF</span><b>' + c.def + '</b></div>'
  +'<div class="jombStat"><span>BASE SPD</span><b>' + c.spd + '</b></div>'
  +'<div class="jombBlock"><span class="title">SKILL &mdash; ' + c.skill + '</span>'
  +'<div class="jombSkill">' + c.skd + '</div>'
  +'<span class="title">PASSIVE &mdash; ' + pName + '</span>'
  +'<div class="jombSkill passive">' + c.psd + '</div></div>';
}

// Inisialisasi Event Listener Jombipedia
{
 const cl = $('jombCloseBtn');
 if(cl) cl.onclick = closeJombipedia;
 const cl2 = $('jombClose');
 if(cl2) cl2.onclick = closeJombipedia;

 const tZ = $('jombTabZom'), tR = $('jombTabRoster');
 if(tZ) tZ.onclick = ()=>{ 
  tZ.classList.add('on'); 
  if(tR) tR.classList.remove('on'); 
  jombTab = 'zombies'; 
  renderJombipedia(); 
  SFX('click'); 
 };
 if(tR) tR.onclick = ()=>{ 
  tR.classList.add('on'); 
  if(tZ) tZ.classList.remove('on'); 
  jombTab = 'chars'; 
  renderJombipedia(); 
  SFX('click'); 
 };

 const tt = $('jombTt');
 if(tt) tt.onclick = ()=>{ jombTurntable = !jombTurntable;
  tt.classList.toggle('on', jombTurntable);
  tt.textContent = 'TURNTABLE: ' + (jombTurntable?'ON':'OFF'); SFX('click'); };

 const st = $('jombSt');
 if(st) st.onclick = ()=>{ jombStance = !jombStance;
  st.classList.toggle('on', jombStance);
  st.textContent = 'STANCE: ' + (jombStance?'AIMING':'IDLE');
  jombApplyStance(); SFX('click'); };

 {const rst = $('jombRst');
  if(rst) rst.onclick = ()=>{
   // F12.11-B3: reset STATE rotasi (sumber kebenaran) + rotasi model +
   // pedal + turntable flag supaya drag benar-benar "reset".
   jombRotY = -.32;
   jombRotX = 0;
   if(jombModel){
    jombModel.rotation.y = jombRotY;
    jombModel.rotation.x = jombRotX;
   }
   jombPed.rotation.y = 0;
   // F12.11-B3: reset zoom ke default juga
   if(typeof jombCam!=='undefined' && jombCam) jombCam.position.z = 3.2;
   SFX('click');
  };}

 // Fail-safe click delegation untuk tombol Jombipedia di menu utama maupun pause
 document.addEventListener('click', e => {
  const btn = e.target.closest && e.target.closest('.menuBtn, .dbtn, button');
  if(btn && (btn.id === 'btnJombipedia' || (btn.textContent && btn.textContent.trim().toUpperCase() === 'JOMBIPEDIA'))){
   openJombipedia();
  }
 });
}

// ================= PRELOADER ENGINE =================
function startPreloading(onComplete) {
  let loaded = 0;
  const imageSources = [
    'loading.jpg',
    'assets/crafting_progress.png',
    'assets/repair.build_progress.png'
  ];
  for (const k in ITEMS) if (ITEMS[k].ic) imageSources.push('assets/' + ITEMS[k].ic);
  for (const k in BUILDS) if (BUILDS[k].ic) imageSources.push('assets/' + BUILDS[k].ic);
  for (const id of ALL_IDS) imageSources.push('assets/skill_' + id + '.png');

  const audioList = Object.values(sfxCustom).map(s => s.el);
  for (const k in bgmTracks) audioList.push(bgmTracks[k]);

  const totalAssets = imageSources.length + audioList.length + 1;

  const updateProgress = (label) => {
    loaded++;
    const pct = Math.min(100, Math.floor((loaded / totalAssets) * 100));
    const fill = $('preloadBarFill');
    const txtPct = $('preloadPct');
    const txtStatus = $('preloadStatus');
    
    if (fill) fill.style.width = pct + '%';
    if (txtPct) txtPct.textContent = pct + '%';
    if (txtStatus && label) txtStatus.textContent = label.toUpperCase();

    if (loaded >= totalAssets) {
      setTimeout(() => {
        const loader = $('preloader');
        if (loader) loader.classList.add('done');
        if (typeof onComplete === 'function') onComplete();
      }, 200);
    }
  };

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => updateProgress('Font dimuat...')).catch(() => updateProgress());
  } else {
    updateProgress();
  }

  imageSources.forEach(src => {
    const img = new Image();
    img.onload = () => updateProgress('Memuat Tekstur...');
    img.onerror = () => updateProgress('Aset dilewati...');
    img.src = src;
  });

  audioList.forEach(el => {
    if (el.readyState >= 2) {
      updateProgress('Audio siap...');
    } else {
      const onReady = () => {
        el.removeEventListener('canplaythrough', onReady);
        el.removeEventListener('error', onReady);
        updateProgress('Memuat Suara...');
      };
      el.addEventListener('canplaythrough', onReady);
      el.addEventListener('error', onReady);
      el.load();
    }
  });

  setTimeout(() => {
    if (loaded < totalAssets) {
      const loader = $('preloader');
      if (loader) loader.classList.add('done');
      if (typeof onComplete === 'function') onComplete();
    }
  }, 3500);
}

// Boot masuk MAIN MENU via Preloader — pastikan semua aset siap tanpa glitch
startPreloading(() => {
  S.state='menu';
  S.paused=true;
  showEl('menuOverlay',true);
  setGameHudVisible(false);
  {const r=$('rail');if(r){
   const add=t=>{const d=document.createElement('div');d.innerHTML=t;r.appendChild(d);};
   add('<b>Q</b>skill');add('<b>B</b>build');add('<b>C</b>craft');
   add('<b>H</b>heal');add('<b>G</b>buff');add('<b>R</b>reload');add('<b>M</b>mute');
  }}
  {const h=$('hint');if(h)h.remove();}
  document.title='The Muster PointZ — Fase 9';
  _floatPoolInit();
  loop();
});