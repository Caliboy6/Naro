import { mountWorkflow, mountControlGate } from './workflow.js';
import { installPartnerBrands } from './brand-system.js';
import { mountTraceLedger } from './trace-ledger.js';
import { installLaunchUI } from './launch-ui.js';

/* Review adapter over the public site's rendered markup. Production integration
   should mount the two exported components in the corresponding React views. */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let currentMain=null;
let disposers=[];
let scheduled=false;

const aiIcon='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 21 8v8l-9 5-9-5V8l9-5Z M12 3v18M3 8l9 5 9-5M3 16l9-5 9 5" stroke="currentColor" stroke-width="1.2"/></svg>';

function brandMarkup(){
 return '<span class="naro-brand-lockup"><span class="naro-symbol-window"><img src="/assets/naro-supplied.png" alt=""></span><span class="naro-word-window"><img src="/assets/naro-supplied.png" alt=""></span></span>';
}

function updateBrand(main){
 main.querySelectorAll('.brand').forEach(brand=>{
  brand.innerHTML=brandMarkup();
  brand.setAttribute('aria-label','NARO home');
 });
 // Replace the inaccurate drawn N inside the coordinator panel, too.
 main.querySelectorAll('.naro-mini').forEach(el=>{
  el.innerHTML='<span class="naro-symbol-window"><img src="/assets/naro-supplied.png" alt="NARO"></span>';
 });
 main.querySelectorAll('.stack-icon.naro-icon').forEach(el=>{
  el.innerHTML='<span class="naro-symbol-window"><img src="/assets/naro-supplied.png" alt="NARO"></span>';
 });
}

function installNavigation(main){
 const header=main.querySelector('.site-header');
 if(!header)return;
 const exploreTarget='/vaults';
 const nav=header.querySelector('nav');
 if(nav){nav.innerHTML=`<a class="naro-explore-link" href="${exploreTarget}">Explore Vaults<span class="naro-nav-symbol" aria-hidden="true">↗</span></a>`;}
 header.classList.add('naro-minimal-header');
 main.querySelectorAll('a[href="/#vaults"],a[href="#vaults"]').forEach(a=>a.setAttribute('href',exploreTarget));
 main.querySelectorAll('.hero-actions .primary-action,.closing-cta .primary-action,.final-cta .primary-action,.cta-panel .primary-action').forEach(a=>{
  const closing=!!a.closest('.closing-cta');
  const arrow=closing?a.querySelector('svg'):null;
  a.setAttribute('href',closing?'/ethvp':exploreTarget);a.textContent=closing?'Explore the first ETH vault':'Explore Vaults';
  if(arrow)a.append(arrow);
 });
 main.querySelectorAll('a').forEach(a=>{
  if(a.textContent.trim()==='Compare vault architecture'){a.setAttribute('href','/vaults');a.textContent='Explore all vaults';}
 });
 const routeToVault=event=>{
  const link=event.target.closest('a');
  const target=link?.getAttribute('href');
  if((target==='/vaults'||target==='/ethvp')&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey&&event.button===0){
   event.preventDefault();event.stopPropagation();location.assign(target);
  }
 };
 main.addEventListener('click',routeToVault,true);
 disposers.push(()=>main.removeEventListener('click',routeToVault,true));
}

function installEthNaming(main){
 const normalize=value=>value.replace(/\bETH(?:vc|vp)\b/gi,'ETHvp');
 const update=()=>{
  const walker=document.createTreeWalker(main,NodeFilter.SHOW_TEXT);let node;
  while(node=walker.nextNode()){
   const value=normalize(node.textContent);
   if(value!==node.textContent)node.textContent=value;
  }
  main.querySelectorAll('[alt],[title],[aria-label],[placeholder]').forEach(el=>{
   for(const name of ['alt','title','aria-label','placeholder']){
    const original=el.getAttribute(name);if(original===null)continue;
    const value=normalize(original);if(value!==original)el.setAttribute(name,value);
   }
  });
 };
 update();
 const namingObserver=new MutationObserver(update);
 namingObserver.observe(main,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['alt','title','aria-label','placeholder']});
 disposers.push(()=>namingObserver.disconnect());
}

function mountScene(host, options={}){
 let disposed=false;let cleanup;
 import('./core-scene.js').then(module=>{if(!disposed)cleanup=module.mountCoreScene(host,options);});
 return ()=>{disposed=true;cleanup?.();};
}

function replaceText(main){
 const walker=document.createTreeWalker(main,NodeFilter.SHOW_TEXT);
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 const replacements=[
  ['VETA GUARDED','VETA VERIFIED'],['GUARDED BY VETA','VETA VERIFIED'],
  ['ETH-denominated live yield with execution guarded by Veta.','AI-coordinated ETH yield. Verified before execution.'],
  ['Guarded execution.','Verified execution.'],
  ['Naro AI Guardrailed ETH Yield Vault','Naro AI Vault · ETH-denominated strategies'],
 ];
 for(const node of nodes){let value=node.textContent;for(const [from,to] of replacements)value=value.replaceAll(from,to);if(value!==node.textContent)node.textContent=value;}
 main.querySelectorAll('.verified-chip').forEach(el=>el.setAttribute('title','Capital movements are checked against predefined constraints before execution.'));
}

function installHero(main){
 const stage=main.querySelector('.intelligence-stage');
 if(stage){
  stage.className='naro-core-stage';
  stage.setAttribute('aria-label','NARO AI core and independent verification boundary');
  stage.innerHTML='';
  disposers.push(mountScene(stage,{labels:'footer',controls:false}));
  const protocol=document.createElement('section');protocol.className='naro-protocol-section';protocol.id='protocol';
  protocol.innerHTML='<div class="naro-protocol-heading"><div><span class="eyebrow">BTCvp / HOW IT WORKS</span><h2>Defined rules.<br><em>Verified actions.</em></h2></div><p>Ciara sets the framework. Naro coordinates within it. VETA checks capital movements before execution.</p></div><div class="naro-workflow-stage"></div>';
  main.querySelector('.metric-rail').after(protocol);
  disposers.push(mountWorkflow(protocol.querySelector('.naro-workflow-stage')));
  const workflowTitle=protocol.querySelector('.naroflow-header h3');
  if(workflowTitle)workflowTitle.textContent='The BTCvp operating path.';
 }
 const pill=main.querySelector('.release-pill');
 if(pill)pill.innerHTML='<span class="ai-spark">'+aiIcon+'</span> AI COORDINATION / VERIFIED EXECUTION';
 const copy=main.querySelector('.hero-copy > p');
 if(copy)copy.textContent='Naro coordinates strategy within Ciara’s approved framework. Veta independently verifies every capital movement against predefined constraints before execution.';
 const proof=main.querySelector('.hero-proof');
 if(proof)proof.remove();
 main.querySelectorAll('.hero-actions a[href="#controls"]').forEach(link=>link.remove());
 const ethCard=main.querySelector('.vault-ethvp .vault-card-copy .eyebrow');
 if(ethCard)ethCard.innerHTML='<span class="ai-vault-inline">'+aiIcon+' AI VAULT</span> / ETH STRATEGIES';
 const ethMetric=main.querySelector('.vault-ethvp .vault-card-metrics small');
 if(ethMetric)ethMetric.textContent='TARGET APY';
 const ethTarget=main.querySelector('.vault-ethvp .vault-card-metrics strong');
 if(ethTarget)ethTarget.textContent='50%';
 const ethStatus=main.querySelector('.vault-ethvp .vault-card-line');
 if(ethStatus)ethStatus.textContent='LIVE · ETH-DENOMINATED';
 const capitalCaption=main.querySelector('.metric-rail>div:first-child>span');
 if(capitalCaption)capitalCaption.textContent='Vault capital';
 const coverage=main.querySelector('.metric-rail>div:nth-child(2)');
 if(coverage){coverage.querySelector('strong').textContent='BTC · ETH';coverage.querySelector(':scope>span')?.remove();}
 const settlement=main.querySelector('.metric-rail>div:nth-child(4)');
 if(settlement){settlement.querySelector('strong').textContent='PHAROS · SUI';settlement.querySelector(':scope>span')?.remove();}
}

function installVaultShowcase(main){
 const showcase=main.querySelector('.vault-showcase');
 if(!showcase)return;
 const title=showcase.querySelector('.section-heading h2');
 if(title)title.innerHTML='Bluechip assets is where Naro starts.<br><em>GPU is next.</em>';
 const description=showcase.querySelector('.section-heading>p');
 if(description)description.textContent='The first Naro vaults apply the shared AI coordination and verification stack to bluechip assets, with capital movements checked against predefined constraints.';
 showcase.classList.add('naro-priority-vaults');
 const protocol=main.querySelector('.naro-protocol-section');
 if(protocol)protocol.before(showcase);
 else main.querySelector('.metric-rail')?.after(showcase);
 const vaultNumber=showcase.querySelector('.section-kicker span');
 if(vaultNumber)vaultNumber.textContent='01';
 const narrativeNumber=main.querySelector('.narrative-section .section-kicker span');
 if(narrativeNumber)narrativeNumber.textContent='02';
}

function installTransparency(main){
 const section=main.querySelector('.transparency-section');
 if(!section)return;
 section.classList.add('naro-transparency');
 section.setAttribute('aria-labelledby','naro-transparency-title');
 section.querySelector('.section-kicker').innerHTML='<span>04</span> RADICAL TRANSPARENCY';
 const grid=section.querySelector('.transparency-grid');
 grid.innerHTML=`<div class="naro-transparency-copy"><h2 id="naro-transparency-title"><span>Every decision</span><span>leaves a</span><em>verifiable trace.</em></h2><p>See what Naro proposed, how VETA checked it, and why an action was executed or stopped.</p><a class="naro-trace-cta" href="/vaults">Explore verified vaults <span aria-hidden="true">↗</span></a><div class="naro-transparency-note"><span aria-hidden="true"></span>Visible reasoning. Verifiable outcomes.</div></div><div class="naro-transparency-mount"></div>`;
 disposers.push(mountTraceLedger(grid.querySelector('.naro-transparency-mount')));
}

function installEthVault(main){
 if(!main.classList.contains('ethvp-page'))return;
 const title=main.querySelector('.ethvp-hero-title');
 const badges=document.createElement('div');badges.className='naro-eth-badges';
 badges.innerHTML='<span class="naro-ai-vault-badge">'+aiIcon+' AI VAULT</span>';
 const verified=title.querySelector('.verified-chip');
 if(verified)badges.append(verified);
 title.prepend(badges);
 const description=main.querySelector('.ethvp-description');
 if(description)description.textContent='An AI-coordinated vault for ETH-denominated strategies. Naro monitors market conditions and coordinates proposals within Ciara’s approved framework. Veta independently checks each capital movement against predefined constraints before execution.';
 const section=document.createElement('section');section.className='naro-ai-control-section';
 section.setAttribute('aria-labelledby','naro-ai-control-title');
 section.innerHTML='<div class="naro-ai-control-copy"><span class="eyebrow">AI COORDINATION / EXECUTION CONTROL</span><h2 id="naro-ai-control-title">AI proposes.<br><em>Policy decides.</em></h2><p>Naro coordinates the strategy. Veta verifies the action. Capital moves only after the predefined checks pass.</p><a href="https://docs.vishwalab.com/" target="_blank" rel="noopener noreferrer">Explore the verification framework <span aria-hidden="true">↗</span></a></div><div class="naro-control-mount"></div>';
 const controls=main.querySelector('.ethvp-controls-section');
 controls.before(section);
 disposers.push(mountControlGate(section.querySelector('.naro-control-mount')));
 const ambient=document.createElement('div');ambient.className='naro-vault-scene';ambient.setAttribute('aria-hidden','true');
 main.querySelector('.ethvp-hero').prepend(ambient);
 disposers.push(mountScene(ambient,{variant:'vault',labels:false}));
}

function installMotion(main){
 const sections=main.querySelectorAll('.naro-protocol-section,.narrative-section,.vault-showcase,.control-section,.transparency-section,.ethvp-controls-section,.ethvp-terms-section,.ethvp-live-surface,.naro-ai-control-section,.vault-overview,.vault-live-grid');
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('naro-revealed');observer.unobserve(entry.target);}
 },{threshold:.06});
 for(const [i,el] of Array.from(sections).entries()){
  el.classList.add('naro-reveal');el.style.setProperty('--naro-reveal-delay',Math.min(i%3*60,120)+'ms');
  if(reducedMotion.matches)el.classList.add('naro-revealed');else observer.observe(el);
 }
 disposers.push(()=>observer.disconnect());
 const ambientObserver=new IntersectionObserver(entries=>{
  for(const entry of entries)entry.target.classList.toggle('naro-offscreen',!entry.isIntersecting);
 },{rootMargin:'40px'});
 main.querySelectorAll('.audit-terminal,.stack-flow').forEach(el=>ambientObserver.observe(el));
 disposers.push(()=>ambientObserver.disconnect());
 const stage=main.querySelector('.naro-workflow-stage');
 if(stage&&window.matchMedia('(pointer:fine)').matches&&!reducedMotion.matches){
  const move=e=>{const bounds=stage.getBoundingClientRect();stage.style.setProperty('--pointer-x',(e.clientX-bounds.left)+'px');stage.style.setProperty('--pointer-y',(e.clientY-bounds.top)+'px');};
  stage.addEventListener('pointermove',move,{passive:true});disposers.push(()=>stage.removeEventListener('pointermove',move));
 }
 main.classList.add('naro-page-enter');
 const timer=setTimeout(()=>main.classList.remove('naro-page-enter'),550);disposers.push(()=>clearTimeout(timer));
 installScrollCinema(main);
}

function installScrollCinema(main){
 const targets=[...main.querySelectorAll('.operating-stack article,.control-grid article,.audit-terminal,.naro-control-mount')];
 let raf=0;let live=true;
 const update=()=>{
  raf=0;if(!live||reducedMotion.matches)return;
  const height=window.innerHeight;
  main.style.setProperty('--naro-scroll',String(Math.min(window.scrollY/(height*2),1)));
  for(const el of targets){
   const r=el.getBoundingClientRect();const progress=Math.max(-1,Math.min(1,(r.top+r.height/2-height/2)/height));
   el.style.setProperty('--naro-depth-y',(-progress*13).toFixed(2)+'px');
   el.style.setProperty('--naro-depth-angle',(progress*2).toFixed(2)+'deg');
  }
 };
 const schedule=()=>{if(!raf)raf=requestAnimationFrame(update);};
 window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});update();
 disposers.push(()=>{live=false;cancelAnimationFrame(raf);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);});
 main.querySelectorAll('.vault-card,.operating-stack article').forEach(el=>{
  if(!matchMedia('(pointer:fine)').matches||reducedMotion.matches)return;
  const move=e=>{const r=el.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;el.style.setProperty('--naro-tilt-x',(-y*5).toFixed(2)+'deg');el.style.setProperty('--naro-tilt-y',(x*5).toFixed(2)+'deg');el.style.setProperty('--naro-light-x',(x+.5)*100+'%');el.style.setProperty('--naro-light-y',(y+.5)*100+'%');};
  const leave=()=>{el.style.setProperty('--naro-tilt-x','0deg');el.style.setProperty('--naro-tilt-y','0deg');};
  el.addEventListener('pointermove',move,{passive:true});el.addEventListener('pointerleave',leave,{passive:true});
  disposers.push(()=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',leave);});
 });
}

function enhance(){
 const main=document.querySelector('main.site-shell');
 if(!main||main===currentMain)return;
 disposers.forEach(dispose=>dispose?.());disposers=[];currentMain=main;
 updateBrand(main);replaceText(main);installHero(main);installVaultShowcase(main);installEthVault(main);installPartnerBrands(main);installTransparency(main);installNavigation(main);installEthNaming(main);disposers.push(installLaunchUI(main));installMotion(main);
 if(location.hash){requestAnimationFrame(()=>{try{main.querySelector(location.hash)?.scrollIntoView();}catch{}});}
}
const observer=new MutationObserver(()=>{
 if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;enhance();});
});
observer.observe(document.getElementById('root'),{childList:true,subtree:true});
enhance();
