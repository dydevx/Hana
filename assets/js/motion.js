// Progressive enhancement: content is visible before JS and remains readable if motion is off.
export function initMotion() {
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
  const control=document.querySelector('#motion-toggle');
  const running=new Set();
  let paused=false;
  let scrollFrame=0;
  let pointerFrame=0;
  try { paused=sessionStorage.getItem('hana-motion-paused')==='true'; } catch {}
  const enabled=()=>!paused&&!reduced.matches;
  function syncMotion() {
    root.dataset.motion=enabled()?'on':'off';
    if(control){
      control.hidden=false;
      control.disabled=reduced.matches;
      control.setAttribute('aria-pressed',String(!enabled()));
      control.querySelector('[data-motion-label]').textContent=reduced.matches?'Bewegung reduziert':paused?'Bewegung aktivieren':'Bewegung pausieren';
      control.querySelector('.motion-icon').textContent=enabled()?'Ⅱ':'▷';
    }
    if(!enabled()){
      for(const animation of running)animation.cancel();
      running.clear();
      resetPointer();
    }
  }
  function animate(element,frames,options={}) {
    if(!element||!enabled()||!element.animate||document.hidden)return;
    const animation=element.animate(frames,{duration:650,easing:'cubic-bezier(.22,1,.36,1)',...options});
    running.add(animation);
    animation.finished.then(()=>running.delete(animation),()=>running.delete(animation));
    return animation;
  }
  control?.addEventListener('click',()=>{paused=!paused;try{sessionStorage.setItem('hana-motion-paused',String(paused));}catch{}syncMotion();});
  reduced.addEventListener('change',syncMotion);
  // Reveal heading lines without delaying the hero photograph or first interaction.
  function enterHero() {
    document.querySelectorAll('.hero-line').forEach((line,index)=>animate(line,[{transform:'translateY(24px)',opacity:.5},{transform:'translateY(0)',opacity:1}],{duration:720,delay:index*100}));
    animate(document.querySelector('.hero-actions'),[{transform:'translateY(12px)'},{transform:'translateY(0)'}],{duration:650,delay:160});
  }
  const visual=document.querySelector('.hero-visual');
  function resetPointer(){visual?.style.removeProperty('--image-x');visual?.style.removeProperty('--image-y');}
  visual?.addEventListener('pointermove',event=>{
    if(!enabled()||!finePointer.matches||pointerFrame)return;
    pointerFrame=requestAnimationFrame(()=>{
      pointerFrame=0;
      if(!enabled())return;
      const rect=visual.getBoundingClientRect();
      visual.style.setProperty('--image-x',`${((event.clientX-rect.left)/rect.width-.5)*-12}px`);
      visual.style.setProperty('--image-y',`${((event.clientY-rect.top)/rect.height-.5)*-10}px`);
    });
  });
  visual?.addEventListener('pointerleave',resetPointer);
  const progress=document.querySelector('.scroll-progress');
  const header=document.querySelector('.site-header');
  function updateScroll(){
    scrollFrame=0;
    const max=root.scrollHeight-innerHeight;
    if(progress)progress.style.transform=`scaleX(${max>0?Math.min(1,Math.max(0,scrollY/max)):0})`;
    header?.classList.toggle('is-scrolled',scrollY>40);
  }
  addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);},{passive:true});
  addEventListener('resize',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);},{passive:true});
  // Each group gets a distinct treatment, rather than fading every section identically.
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      const el=entry.target;
      observer.unobserve(el);
      if(el.matches('.about-composition')){
        animate(el.querySelector('.about-image'),[{clipPath:'inset(0 12% 0 0)'},{clipPath:'inset(0 0% 0 0)'}],{duration:900});
        animate(el.querySelector('.about-detail'),[{transform:'translate(15px,22px) rotate(-6deg)'},{transform:'translate(0,0) rotate(0)'}],{duration:850,delay:160});
      } else if(el.matches('.gallery-grid')){
        el.querySelectorAll('.gallery-item').forEach((photo,index)=>animate(photo,[{transform:'translateY(30px)',opacity:.55},{transform:'translateY(0)',opacity:1}],{duration:700,delay:index*70}));
      } else if(el.matches('.order-steps')){
        el.querySelectorAll('li>span').forEach((number,index)=>animate(number,[{transform:'translateY(16px)',opacity:.4},{transform:'translateY(0)',opacity:1}],{duration:500,delay:index*130}));
      } else if(el.matches('.reservation-hours')){
        animate(el,[{transform:'translateX(24px)',opacity:.65},{transform:'translateX(0)',opacity:1}],{duration:750});
        animate(el.querySelector('.reservation-flower'),[{transform:'rotate(-12deg)'},{transform:'rotate(0)'}],{duration:1000});
      }
    }
  },{threshold:.16});
  document.querySelectorAll('.about-composition,.gallery-grid,.order-steps,.reservation-hours').forEach(el=>observer.observe(el));
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-add]'))animate(document.querySelector('.cart-trigger'),[{transform:'translateY(0)'},{transform:'translateY(-4px)',offset:.4},{transform:'translateY(0)'}],{duration:280});
    const filter=event.target.closest('[data-filter]');
    if(filter)document.querySelectorAll('.dish:not([hidden])').forEach((dish,index)=>animate(dish,[{opacity:.5},{opacity:1}],{duration:230,delay:Math.min(index,5)*25}));
  });
  document.querySelector('#lightbox-image')?.addEventListener('load',event=>{
    if(document.querySelector('#lightbox').open)animate(event.target,[{opacity:.5,transform:'scale(.98)'},{opacity:1,transform:'scale(1)'}],{duration:250});
  });
  document.addEventListener('visibilitychange',()=>{
    root.dataset.pageHidden=String(document.hidden);
    if(document.hidden){for(const animation of running)animation.finish();}
  });
  syncMotion();
  updateScroll();
  enterHero();
}
