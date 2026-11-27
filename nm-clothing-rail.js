(() => {
  if (customElements.get('nm-clothing-rail')) return;
  class ClothingRail extends HTMLElement {
    connectedCallback() {
      if(this.cleanup) return;
      const track=this.querySelector('.nmRail__track');
      const items=[...this.querySelectorAll('.nmRail__item')];
      const dialog=this.querySelector('dialog');
      if(!track||!items.length||!dialog) return;
      const abort=new AbortController(),signal=abort.signal;
      const $=s=>this.querySelector(s);
      const on=(el,event,fn,options)=>el?.addEventListener(event,fn,{...options,signal});
      const reduced=matchMedia('(prefers-reduced-motion: reduce)');
      const desktop=matchMedia('(hover: hover) and (pointer: fine)');
      const compact=matchMedia('(max-width: 850px)');
      const root=this, labels=this.dataset, buttons=items.map(el=>el.querySelector('button'));
      track.style.setProperty('--nm-rack-count',String(items.length));
      const activeText=$('[data-rail-active]'),count=$('[data-rail-count]'),play=$('[data-rail-play]');
      const figure=$('.nmRail__figure'), detailImage=$('[data-detail-image]'), detailZoom=$('[data-rail-zoom]');
      const cart=$('[data-rail-cart]'),link=$('.nmRail__link'),title=$('[data-rail-title]'),desc=$('[data-rail-desc]'), viewStatus=$('[data-view-status]');
      const faceKeys=['front','profile','texture'];
      const faceNames={front:'Frente',profile:'Perfil',texture:'Textura'};
      const faceButtons=faceKeys.map(key=>$('[data-face='+key+']'));
      let detailPaths={}, detailName='', detailView='front', detailZoomName='', modalMute=0, detailVariant=null, cartHandoff=null;
      let index=0, visible=false, held=false, hovering=false, editor=!!window.Shopify?.designMode;
      let paused=labels.autoplay!=='true'||reduced.matches, timer=0, scrollTimer=0, ignoreScrollUntil=0;
      let drag=null, blockClick=0, opener=null, modalSwipe=null, pageOverflow=null, poseFrame=0, lastPose=0, pointerX=null, lastBrush=null,touchPress=null;
      // On touch the native scroll position is the source of truth. Snap, arrow
      // navigation and a slow finger drag all display the same garment.
      let scrollFrame=0,measureFrame=0,compactMotion=false,scrollBusy=false,pendingIndex=null;
      let centers=[],strengths=items.map(()=>null);
      const poses=items.map(()=>({x:0,dx:0,y:0,dy:0,z:0,dz:0,a:0,da:0,t:0,dt:0}));
      function monitorFrames(){
        // A failed selected density is not a failed garment. Prefer the other
        // copy of that exact view, then one separately cached retry on 1x.
        for(const [n,item] of items.entries())for(const view of ['front','side']){
          const im=buttons[n].querySelector('.nmRail__photo--'+view);
          if(!im?.getAttribute('src'))continue;
          const normal=new URL(im.getAttribute('src'),document.baseURI);
          const hd=im.dataset.railHd?new URL(im.dataset.railHd,document.baseURI):null;
          const retry=new URL(normal);retry.searchParams.set('rail-fallback','1');
          const offers=[normal.href,hd?.href,retry.href].filter(Boolean),seen=new Set();
          let queued=false;
          const attr='data-rail-'+view+'-lost';
          const fail=()=>{
            if(queued)return;
            queued=true;
            im.setAttribute('data-rail-unavailable','');
            seen.add(im.currentSrc||im.src);
            const next=offers.find(src=>!seen.has(src));
            if(next){
              im.removeAttribute('srcset');
              im.src=next;
            }else item.setAttribute(attr,'');
            // A source replacement can emit another error; don't coalesce a
            // genuine new network error, only a duplicate of the same turn.
            queueMicrotask(()=>{queued=false});
          };
          on(im,'load',()=>{im.removeAttribute('data-rail-unavailable');item.removeAttribute(attr);});
          on(im,'error',fail);
          if(im.complete&&im.naturalWidth===0)fail();
        }
      }
      if(root.id==='perchero')monitorFrames();
      function stepPose(now){
        const t=lastPose?Math.min(.032,(now-lastPose)/1000):1/60;
        lastPose=now;poseFrame=0;
        let moving=false;
        for(let n=0;n<items.length;n++){
          const p=poses[n],d=n-index;
          const brush=pointerX!==null&&!held&&desktop.matches&&!reduced.matches;
          const grip=drag?.on&&drag.index===n&&!reduced.matches;
          const targets={
            x:grip?(drag.delta||0)*.25:brush&&Math.abs(d)===1?Math.sign(d)*5:0,
            y:brush?(d===0?pointerX*12:Math.abs(d)===1?Math.sign(d)*5:0):0,
            z:brush&&d===0?26:grip?33:0,
            a:grip?(drag.delta||0)*.048:brush&&d===0?pointerX*4:0,
            t:brush&&d===0?pointerX*6:0
          };
          for(const k of Object.keys(targets)){
            const v='d'+k,bias=targets[k]-p[k];p[v]+=(bias*150-p[v]*15)*t;p[k]+=p[v]*t;
            if(Math.abs(p[v])>.06||Math.abs(targets[k]-p[k])>.06)moving=true;
          }
          const st=items[n].style;
          st.setProperty('--nm-x',p.x.toFixed(2)+'px');st.setProperty('--nm-yaw',p.y.toFixed(2)+'deg');st.setProperty('--nm-z',p.z.toFixed(2)+'px');st.setProperty('--nm-sway',p.a.toFixed(2)+'deg');st.setProperty('--nm-tag',p.t.toFixed(2)+'deg');
        }
        if(moving)poseFrame=requestAnimationFrame(stepPose);else lastPose=0;
      }
      function kick(){
        if(reduced.matches){for(const item of items)for(const k of ['x','yaw','z','sway','tag'])item.style.removeProperty('--nm-'+k);return;}
        if(!poseFrame)poseFrame=requestAnimationFrame(stepPose);
      }
      const wrap=i=>(i+items.length)%items.length;
      const number=n=>String(n).padStart(2,'0');
      function label(n){
        const changed=index!==n;
        index=n;
        items.forEach((el,i)=>{
          const active=i===n;
          if(el.hasAttribute('data-active')!==active)el.toggleAttribute('data-active',active);
          if(buttons[i].getAttribute('aria-current')!==String(active))buttons[i].setAttribute('aria-current',String(active));
        });
        const name=items[n].dataset.name, position=number(n+1)+' / '+number(items.length);
        if(activeText.textContent!==name&&activeText.textContent!==(window.NM_LANG?.t(name)??name))activeText.textContent=name;
        if(count.textContent!==position)count.textContent=position;
        return changed;
      }
      function paint(){
        scrollFrame=0;
        if(!compactMotion||!centers.length||dialog.open)return;
        const x=track.scrollLeft+track.clientWidth/2;
        let nearest=0,dist=Infinity;
        for(let i=0;i<centers.length;i++){
          const d=Math.abs(centers[i]-x);
          if(d<dist){nearest=i;dist=d;}
        }
        for(let i=0;i<items.length;i++){
          const offset=x-centers[i];
          const neighbor=offset<0?centers[i-1]:centers[i+1];
          const fallback=centers[i===0?1:i-1];
          const pitch=Math.max(1,Math.abs((neighbor??fallback??centers[i]+1)-centers[i]));
          // Settle front just before center and stay in profile outside
          // the nearest slot. Smoothstep avoids start/stop discontinuities.
          let progress=Math.min(1,Math.max(0,(.87-Math.abs(offset)/pitch)/.71));
          progress=progress*progress*(3-2*progress);
          if(reduced.matches)progress=Number(i===nearest);
          const v=Math.round(progress*256);
          if(v!==strengths[i]){
            strengths[i]=v;
            const f=v/256,st=items[i].style;
            st.setProperty('--rail-front-alpha',f.toFixed(3));
            st.setProperty('--rail-side-alpha',(1-f).toFixed(3));
            st.setProperty('--rail-front-angle',(-54*(1-f)).toFixed(2)+'deg');
            st.setProperty('--rail-front-width',(.79+.21*f).toFixed(3));
            st.setProperty('--rail-side-angle',(15*f).toFixed(2)+'deg');
            st.setProperty('--rail-side-width',(1-.14*f).toFixed(3));
            st.setProperty('--rail-garment-scale',(.87+.13*f).toFixed(3));
          }
        }
        label(nearest);
      }
      function requestPaint(){if(!scrollFrame)scrollFrame=requestAnimationFrame(paint)}
      function measure(){
        measureFrame=0;
        const was=compactMotion;
        compactMotion=compact.matches&&items.length>1&&track.scrollWidth>track.clientWidth+1;
        track.toggleAttribute('data-glide',compactMotion);
        if(compactMotion){
          const t=track.getBoundingClientRect();
          centers=items.map(el=>{const r=el.getBoundingClientRect();return track.scrollLeft+r.left-t.left+r.width/2});
          if(!held&&!scrollBusy)center(items[pendingIndex??index],true);
          paint();
        }else if(was){centers=[];strengths.fill(null);pendingIndex=null;}
      }
      function queueMeasure(){if(!measureFrame)measureFrame=requestAnimationFrame(measure)}
      function settle(){
        clearTimeout(scrollTimer);scrollBusy=false;pendingIndex=null;
        if(compactMotion)requestPaint();else if(!dialog.open&&!held&&performance.now()>=ignoreScrollUntil)select(nearest());
        arm();
      }
      function arm(){
        clearTimeout(timer);
        if(editor||paused||reduced.matches||!visible||held||hovering||scrollBusy||dialog.open||document.querySelector('dialog[open]')||document.hidden||(root.contains(document.activeElement)&&document.activeElement?.matches(':focus-visible'))||items.length<2)return;
        timer=setTimeout(()=>select((pendingIndex??index)+1,true),Math.max(2000,Math.min(10000,Number(labels.interval)||4000)));
      }
      function center(el,instant){
        if(track.scrollWidth<=track.clientWidth+1)return;
        const tr=track.getBoundingClientRect(),r=el.getBoundingClientRect();
        const left=track.scrollLeft+r.left-tr.left+(r.width-track.clientWidth)/2;
        ignoreScrollUntil=performance.now()+550;
        track.scrollTo({left,behavior:instant||reduced.matches?'instant':'smooth'});
      }
      function select(i,scroll=false,instant=false){
        const before=index,next=wrap(i);
        // Direct selection on a narrow rail animates its scroll; the facing
        // photograph and label follow its physical location, not a timer.
        if(compactMotion&&scroll){
          pendingIndex=next;
          center(items[next],instant||Math.abs(before-next)>1);
          if(instant||reduced.matches)paint();else requestPaint();
          arm();return;
        }
        label(next);
        if(before!==index&&!reduced.matches&&!compactMotion){
          const delta=index>before?1:-1;
          poses[index].da+=delta*39; poses[index].dt+=delta*52;
          if(poses[index-delta])poses[index-delta].da-=delta*21;
          if(poses[index+delta])poses[index+delta].da+=delta*19;
        }
        kick();
        if(scroll)center(items[index],instant);
        arm();
      }
      function updatePlay(){
        if(!play)return;
        play.setAttribute('aria-label',paused?labels.playLabel:labels.pauseLabel);
        play.setAttribute('aria-pressed',paused?'true':'false');
        play.textContent=paused?'▷':'Ⅱ';
      }
      function face(view){
        if(!detailPaths[view]||!detailImage||!detailZoom)return;
        detailView=view;
        const name=faceNames[view];
        figure.dataset.view=view;
        detailZoomName=detailName+' · '+name;
        detailImage.alt=detailZoomName;
        detailImage.src=detailPaths[view];
        detailZoom.setAttribute('aria-label','Ampliar: '+name);
        detailZoom.setAttribute('aria-haspopup','dialog');
        for(const [i,key] of faceKeys.entries()){
          faceButtons[i].hidden=!detailPaths[key];
          faceButtons[i].setAttribute('aria-pressed',String(key===view));
        }
        viewStatus.textContent=name;
        if(!reduced.matches&&detailImage.animate)detailImage.animate([{opacity:.48},{opacity:1}],{duration:170,easing:'ease-out'});
      }
      function stepView(direction){
        const available=faceKeys.filter(key=>detailPaths[key]);
        if(available.length<2)return;
        const index=available.indexOf(detailView);
        face(available[(index+direction+available.length)%available.length]);
      }
      function open(n){
        select(n,compactMotion,true);const d=items[n].dataset;
        const source=buttons[n].querySelector('.nmRail__photo--front');
        const profile=buttons[n].querySelector('.nmRail__photo--side');
        opener=buttons[n];title.textContent=d.name;desc.textContent=d.description||'';desc.hidden=!d.description;
        detailVariant=d.productId&&d.color?{productId:d.productId,color:d.color,opener}:null;
        if(cart)cart.hidden=!detailVariant;
        link.hidden=!d.url;if(d.url)link.setAttribute('href',d.url);else link.removeAttribute('href');
        detailName=d.name;
        detailPaths={front:d.large||source?.currentSrc||source?.src,profile:d.profile||profile?.currentSrc||profile?.src,texture:d.texture};
        detailZoom.hidden=!detailPaths.front;
        dialog.scrollTop=0;
        face('front');
        modalMute=0;
        if(!dialog.open){dialog.showModal();pageOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';}
        const target=$('.nmRail__close');target?.focus({preventScroll:true});
        if(!reduced.matches&&figure.animate){
          const r=source?.getBoundingClientRect(),to=figure.getBoundingClientRect();
          if(r?.width&&to.width) figure.animate([{transform:'translate('+((r.left+r.width/2)-(to.left+to.width/2))+'px,'+((r.top+r.height/2)-(to.top+to.height/2))+'px) scale('+Math.min(.85,r.width/to.width)+')',opacity:.25},{transform:'none',opacity:1}],{duration:470,easing:'cubic-bezier(.21,.72,.27,1)'});
        }
        arm();
      }
      const restoreScroll=()=>{if(pageOverflow!==null){document.documentElement.style.overflow=pageOverflow;pageOverflow=null}};
      const observer=new IntersectionObserver(([e])=>{visible=e.isIntersecting;arm()},{threshold:.2});
      observer.observe(track);
      items.forEach((el,n)=>{
        on(buttons[n],'click',e=>{if(dialog.open||(e.detail&&performance.now()<blockClick))return;open(n)});
        on(buttons[n],'focus',()=>{if(!dialog.open&&!held&&buttons[n].matches(':focus-visible'))select(n,compactMotion);arm()});

      });
      on(track,'pointerenter',e=>{if(e.pointerType==='mouse'){hovering=true;arm()}});
      on(track,'pointerleave',()=>{hovering=false;pointerX=null;lastBrush=null;kick();arm()});
      on(track,'pointermove',e=>{
        if(e.pointerType!=='mouse'||!desktop.matches||held||dialog.open)return;
        const now=performance.now();
        const distance=lastBrush?e.clientX-lastBrush.x:0;
        if(lastBrush&&Math.abs(distance)<2)return;
        lastBrush={x:e.clientX,t:now};
        let best=index,metric=Infinity;
        items.forEach((item,n)=>{
          const r=item.getBoundingClientRect();const dist=Math.abs(r.left+r.width/2-e.clientX);
          if(dist<metric&&dist<=r.width/2+7){best=n;metric=dist;}
        });
        const box=items[index].getBoundingClientRect();
        const central=Math.abs(e.clientX-(box.left+box.width/2))<box.width*.45;
        if(best!==index&&!central)select(best);
        const r=items[index].getBoundingClientRect();
        pointerX=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/Math.max(25,r.width/2)));
        poses[index].da+=Math.max(-18,Math.min(18,distance*.15));
        kick();
      },{passive:true});
      function nearest(){
        const first=items[0].getBoundingClientRect(),last=items.at(-1).getBoundingClientRect(),r=track.getBoundingClientRect();
        if(track.scrollLeft<=1)return 0;
        if(track.scrollLeft>=track.scrollWidth-track.clientWidth-1)return items.length-1;
        const x=r.left+r.width/2;
        if(x<=first.left)return 0;
        if(x>=last.right)return items.length-1;
        return items.reduce((out,el,n)=>{const q=el.getBoundingClientRect(),d=Math.abs(q.left+q.width/2-x);return d<out.d?{d,n}:out},{d:Infinity,n:0}).n;
      }
      on(track,'scroll',()=>{
        if(dialog.open)return;
        if(compactMotion){
          scrollBusy=true;clearTimeout(timer);requestPaint();clearTimeout(scrollTimer);
          scrollTimer=setTimeout(settle,130);
          return;
        }
        if(performance.now()<ignoreScrollUntil||drag?.on)return;
        clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{if(!held)select(nearest())},90);
      },{passive:true});
      on(track,'scrollend',()=>{if(compactMotion)settle()},{passive:true});
      on(track,'pointerdown',e=>{
        if(!e.isPrimary||e.button!==0)return;
        held=true;scrollBusy=false;pendingIndex=null;clearTimeout(scrollTimer);
        if(e.pointerType==='touch'){
          blockClick=0;touchPress={id:e.pointerId,x:e.clientX,y:e.clientY,at:items.indexOf(e.target.closest('.nmRail__item'))};
          if(performance.now()<ignoreScrollUntil)track.scrollTo({left:track.scrollLeft,behavior:'instant'});
        }
        ignoreScrollUntil=0;arm();
        if(e.pointerType==='mouse')drag={id:e.pointerId,x:e.clientX,y:e.clientY,on:false,origin:track.scrollLeft,index};
      });
      on(window,'pointermove',e=>{
        if(touchPress?.id===e.pointerId){const dx=e.clientX-touchPress.x,dy=e.clientY-touchPress.y;if(Math.hypot(dx,dy)>13)touchPress.moved=true;}
        if(!drag||e.pointerId!==drag.id)return;
        const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
        if(!drag.on&&Math.abs(dx)>9&&Math.abs(dx)>Math.abs(dy)*1.15){
          drag.on=true;track.setAttribute('data-drag','');try{track.setPointerCapture(e.pointerId)}catch{}
        }
        if(drag.on){if(e.cancelable)e.preventDefault();drag.delta=Math.max(-110,Math.min(110,dx));track.scrollLeft=drag.origin-dx;kick();}
      },{passive:false});
      function release(e){
        if(!held||!e.isPrimary)return;
        held=false;const d=drag;drag=null;
        if(touchPress?.id===e.pointerId){
          const contact=touchPress;touchPress=null;
          const tap=e.type==='pointerup'&&!contact.moved&&Math.hypot(e.clientX-contact.x,e.clientY-contact.y)<13;
          if(!tap)blockClick=performance.now()+360;
          else if(contact.at>=0){blockClick=performance.now()+300;open(contact.at);}

        }
        track.removeAttribute('data-drag');kick();
        if(d?.on){blockClick=performance.now()+420;const dx=e.clientX-d.x;select(d.index+(e.type==='pointerup'&&Math.abs(dx)>20?(dx<0?1:-1):0),true)}
        arm();
      }
      on(window,'pointerup',release);on(window,'pointercancel',release);
      on(track,'dragstart',e=>e.preventDefault());
      on(track,'keydown',e=>{
        if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;
        const target=wrap(e.key==='Home'?0:e.key==='End'?items.length-1:(pendingIndex??index)+(e.key==='ArrowRight'?1:-1));
        e.preventDefault();select(target,true);buttons[target].focus({preventScroll:true});
      });
      on($('[data-rail-prev]'),'click',()=>select((pendingIndex??index)-1,true));on($('[data-rail-next]'),'click',()=>select((pendingIndex??index)+1,true));
      on(play,'click',()=>{if(reduced.matches)return;paused=!paused;updatePlay();arm()});
      faceButtons.forEach((button,i)=>on(button,'click',()=>face(faceKeys[i])));
      on(detailZoom,'click',e=>{
        if(!dialog.open||!detailPaths[detailView]||(e.detail&&performance.now()<modalMute))return;
        document.dispatchEvent(new CustomEvent('nm:zoom-photo',{detail:{src:detailPaths[detailView],alt:detailZoomName,opener:detailZoom}}));
      });
      on(dialog,'click',e=>{
        if(e.target!==dialog)return;
        const r=dialog.getBoundingClientRect();
        if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDetails();
      });
      on(cart,'click',()=>{
        if(!dialog.open||!detailVariant||cartHandoff)return;
        cartHandoff=detailVariant;
        closeDetails();
      });
      function closeDetails(){
        if(dialog.open)dialog.close();
        if(!dialog.open)finishClose();
      }
      function finishClose(){
        if(dialog.open||(!opener&&!cartHandoff&&pageOverflow===null))return;
        const to=opener,purchase=cartHandoff;
        opener=null;cartHandoff=null;modalSwipe=null;detailVariant=null;
        detailPaths={};detailZoomName='';detailName='';detailView='front';
        detailImage?.removeAttribute('src');if(detailImage)detailImage.alt='';
        if(viewStatus)viewStatus.textContent='';
        if(cart)cart.hidden=true;
        title.textContent='';desc.textContent='';desc.hidden=true;
        link.hidden=true;link.removeAttribute('href');
        restoreScroll();
        if(purchase)document.dispatchEvent(new CustomEvent('nm:cart-quick-add',{detail:purchase}));
        if(!document.querySelector('dialog[open]'))to?.focus({preventScroll:true});
        arm();
      }
      on(dialog,'close',finishClose);
      on(dialog,'cancel',e=>{e.preventDefault();closeDetails()});
      on($('.nmRail__close'),'click',e=>{e.preventDefault();closeDetails()});
      on(dialog,'keydown',e=>{
        if(e.altKey||e.ctrlKey||e.metaKey)return;
        const available=faceKeys.filter(key=>detailPaths[key]);
        if(available.length<2)return;
        if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();stepView(e.key==='ArrowRight'?1:-1)}
        else if(e.key==='Home'||e.key==='End'){e.preventDefault();face(e.key==='Home'?available[0]:available.at(-1))}
      });
      on(figure,'pointerdown',e=>{if(e.isPrimary&&e.button===0)modalSwipe={id:e.pointerId,x:e.clientX,y:e.clientY,dragging:false}});
      on(window,'pointermove',e=>{
        if(modalSwipe?.id!==e.pointerId)return;
        const dx=e.clientX-modalSwipe.x,dy=e.clientY-modalSwipe.y;
        if(modalSwipe.dragging)return;
        if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){modalSwipe=null;modalMute=performance.now()+400;return}
        if(Math.abs(dx)<12||Math.abs(dx)<Math.abs(dy)*1.15)return;
        modalSwipe.dragging=true;
      },{passive:true});
      on(window,'pointercancel',e=>{if(modalSwipe?.id===e.pointerId){modalSwipe=null;modalMute=performance.now()+400}});
      on(window,'pointerup',e=>{
        if(modalSwipe?.id!==e.pointerId)return;
        const d=modalSwipe;modalSwipe=null;
        const dx=e.clientX-d.x,dy=e.clientY-d.y;
        if(d.dragging||Math.hypot(dx,dy)>14)modalMute=performance.now()+400;
        if(Math.abs(dx)>=42&&Math.abs(dx)>Math.abs(dy)*1.25)stepView(dx<0?1:-1);
      });
      on(this,'focusin',arm);on(this,'focusout',()=>queueMicrotask(arm));
      on(document,'visibilitychange',arm);
      on(document,'close',()=>queueMicrotask(arm),{capture:true});
      on(reduced,'change',()=>{requestPaint();if(reduced.matches)paused=true;if(play)play.hidden=reduced.matches||labels.autoplay!=='true';updatePlay();arm()});
      on(this,'shopify:block:select',e=>{editor=true;clearTimeout(timer);const found=items.findIndex(el=>el===e.target||el.contains(e.target));if(found>=0)select(found,true,true)});
      const sizing=typeof ResizeObserver==='function'?new ResizeObserver(queueMeasure):null;
      sizing?.observe(track);on(window,'resize',queueMeasure,{passive:true});on(window,'load',queueMeasure,{once:true});on(compact,'change',queueMeasure);
      this.cleanup=()=>{
        abort.abort();observer.disconnect();sizing?.disconnect();clearTimeout(timer);clearTimeout(scrollTimer);cancelAnimationFrame(poseFrame);cancelAnimationFrame(scrollFrame);cancelAnimationFrame(measureFrame);track.removeAttribute('data-glide');
        if(dialog.open)dialog.close();restoreScroll();delete this.cleanup;this.removeAttribute('data-ready');
      };
      this.setAttribute('data-ready','');
      if(play)play.hidden=reduced.matches||labels.autoplay!=='true'||items.length<2;
      updatePlay();const first=Math.max(0,Math.min(items.length-1,Number(labels.feature)||0));select(first,true,true);measure();queueMeasure();
    }
    disconnectedCallback(){this.cleanup?.()}
  }
  customElements.define('nm-clothing-rail',ClothingRail);
})();
