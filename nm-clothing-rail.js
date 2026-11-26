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
      const root=this, labels=this.dataset, buttons=items.map(el=>el.querySelector('button'));
      const activeText=$('[data-rail-active]'),count=$('[data-rail-count]'),play=$('[data-rail-play]');
      const figure=$('.nmRail__figure'),spin=$('.nmRail__spin'),front=$('[data-front-img]'),back=$('[data-back-img]');
      const link=$('.nmRail__link'),title=$('[data-rail-title]'),desc=$('[data-rail-desc]'),tag=$('[data-modal-tag]');
      const endView=$('[data-face=back]'),frontView=$('[data-face=front]');
      let index=0, visible=false, held=false, hovering=false, editor=!!window.Shopify?.designMode;
      let paused=labels.autoplay!=='true'||reduced.matches, timer=0, scrollTimer=0, ignoreScrollUntil=0;
      let drag=null, blockClick=0, opener=null, modalSwipe=null, pageOverflow=null, poseFrame=0, lastPose=0, pointerX=null, lastBrush=null,touchPress=null;
      const poses=items.map(()=>({x:0,dx:0,y:0,dy:0,z:0,dz:0,a:0,da:0,t:0,dt:0}));
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
      function arm(){
        clearTimeout(timer);
        if(editor||paused||reduced.matches||!visible||held||hovering||dialog.open||document.hidden||(root.contains(document.activeElement)&&document.activeElement?.matches(':focus-visible'))||items.length<2)return;
        timer=setTimeout(()=>select(index+1,true),Math.max(2000,Math.min(10000,Number(labels.interval)||4000)));
      }
      function center(el,instant){
        if(track.scrollWidth<=track.clientWidth+1)return;
        const tr=track.getBoundingClientRect(),r=el.getBoundingClientRect();
        const left=track.scrollLeft+r.left-tr.left+(r.width-track.clientWidth)/2;
        ignoreScrollUntil=performance.now()+550;
        track.scrollTo({left,behavior:instant||reduced.matches?'instant':'smooth'});
      }
      function select(i,scroll=false,instant=false){
        const before=index;index=wrap(i);
        if(before!==index&&!reduced.matches){
          const delta=index>before?1:-1;
          poses[index].da+=delta*39; poses[index].dt+=delta*52;
          if(poses[index-delta])poses[index-delta].da-=delta*21;
          if(poses[index+delta])poses[index+delta].da+=delta*19;
        }
        kick();
        items.forEach((el,n)=>{el.toggleAttribute('data-active',n===index);buttons[n].setAttribute('aria-current',n===index?'true':'false')});
        activeText.textContent=items[index].dataset.name;
        count.textContent=number(index+1)+' / '+number(items.length);
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
        const useBack=view==='back'&&!endView.hidden;
        spin.style.removeProperty('--nm-turn');spin.dataset.view=useBack?'back':'front';
        front.setAttribute('aria-hidden',String(useBack));
        back.setAttribute('aria-hidden',String(!useBack));
        endView.setAttribute('aria-pressed',String(useBack));
        frontView.setAttribute('aria-pressed',String(!useBack));
      }
      function open(n){
        select(n);const d=items[n].dataset;
        const source=buttons[n].querySelector('.nmRail__photo--front');
        opener=buttons[n];title.textContent=d.name;desc.textContent=d.description||'';desc.hidden=!d.description;
        tag.textContent=d.tag||'';tag.hidden=!d.tag||labels.tags==='false';
        link.hidden=!d.url;if(d.url)link.setAttribute('href',d.url);else link.removeAttribute('href');
        front.alt=d.name;front.src=d.large||source?.currentSrc||source?.src||'';
        endView.hidden=!d.back;frontView.hidden=!d.back;back.hidden=!d.back;back.alt=d.name+' · '+endView.textContent.trim();
        if(d.back)back.src=d.back;else back.removeAttribute('src');
        face('front');
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
        on(buttons[n],'focus',()=>{if(!dialog.open)select(n);arm()});

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
        if(dialog.open||performance.now()<ignoreScrollUntil||drag?.on)return;
        clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{if(!held)select(nearest())},110);
      },{passive:true});
      on(track,'pointerdown',e=>{
        if(!e.isPrimary||e.button!==0)return;
        held=true;clearTimeout(scrollTimer);
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
        e.preventDefault();select(e.key==='Home'?0:e.key==='End'?items.length-1:index+(e.key==='ArrowRight'?1:-1),true);buttons[index].focus({preventScroll:true});
      });
      on($('[data-rail-prev]'),'click',()=>select(index-1,true));on($('[data-rail-next]'),'click',()=>select(index+1,true));
      on(play,'click',()=>{if(reduced.matches)return;paused=!paused;updatePlay();arm()});
      on(frontView,'click',()=>face('front'));on(endView,'click',()=>face('back'));
      on(dialog,'click',e=>{if(e.target===dialog)dialog.close()});
      on(dialog,'close',()=>{restoreScroll();opener?.focus({preventScroll:true});arm()});
      on(dialog,'keydown',e=>{if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&!endView.hidden){e.preventDefault();face(spin.dataset.view==='front'?'back':'front')}});
      on(figure,'pointerdown',e=>{if(e.isPrimary&&e.button===0&&!endView.hidden)modalSwipe={id:e.pointerId,x:e.clientX,y:e.clientY,on:false,start:spin.dataset.view==='back'?180:0}});
      on(window,'pointermove',e=>{
        if(modalSwipe?.id!==e.pointerId||reduced.matches)return;
        const dx=e.clientX-modalSwipe.x,dy=e.clientY-modalSwipe.y;
        if(!modalSwipe.on){
          if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){modalSwipe=null;return}
          if(Math.abs(dx)<8)return;
          modalSwipe.on=true;figure.setAttribute('data-turning','');
          if(e.pointerType==='mouse')try{figure.setPointerCapture(e.pointerId)}catch{}
        }
        spin.style.setProperty('--nm-turn',(modalSwipe.start+Math.max(-178,Math.min(178,dx*1.06)))+'deg');
      });
      function finishModalTurn(e){
        if(modalSwipe?.id!==e.pointerId)return;
        const d=modalSwipe;modalSwipe=null;figure.removeAttribute('data-turning');
        const dx=e.clientX-d.x,dy=e.clientY-d.y;
        if(e.type==='pointerup'&&Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.3&&!endView.hidden)face(d.start?'front':'back');
        else face(d.start?'back':'front');
      }
      on(window,'pointerup',finishModalTurn);on(window,'pointercancel',finishModalTurn);
      on(this,'focusin',arm);on(this,'focusout',()=>queueMicrotask(arm));
      on(document,'visibilitychange',arm);
      on(reduced,'change',()=>{if(reduced.matches)paused=true;if(play)play.hidden=reduced.matches||labels.autoplay!=='true';updatePlay();arm()});
      on(this,'shopify:block:select',e=>{editor=true;clearTimeout(timer);const found=items.findIndex(el=>el===e.target||el.contains(e.target));if(found>=0)select(found,true,true)});
      this.cleanup=()=>{
        abort.abort();observer.disconnect();clearTimeout(timer);clearTimeout(scrollTimer);cancelAnimationFrame(poseFrame);
        if(dialog.open)dialog.close();restoreScroll();delete this.cleanup;this.removeAttribute('data-ready');
      };
      this.setAttribute('data-ready','');
      if(play)play.hidden=reduced.matches||labels.autoplay!=='true'||items.length<2;
      updatePlay();const first=Math.max(0,Math.min(items.length-1,Number(labels.feature)||0));select(first,true,true);
    }
    disconnectedCallback(){this.cleanup?.()}
  }
  customElements.define('nm-clothing-rail',ClothingRail);
})();
