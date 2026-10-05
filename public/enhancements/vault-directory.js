/* Standalone vault directory: decorative interaction only, no wallet or data calls. */
import { installPartnerBrands } from './brand-system.js';
installPartnerBrands();
const grid=document.querySelector('.vd-grid');
const eth=grid?.querySelector('.vd-card-eth');
if(eth)grid.prepend(eth);
grid?.querySelectorAll('.vd-card').forEach((card,index)=>{
 const label=card.querySelector('.vd-index');
 if(label)label.textContent=String(index+1).padStart(2,'0')+' / '+(card.classList.contains('vd-card-eth')?'ETH':'BTC');
});
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(pointer: fine)');
const cards = [...document.querySelectorAll('.vd-card')];
let enterTimer;

if (!reducedMotion.matches) {
  document.body.classList.add('vd-ready');
  enterTimer = window.setTimeout(() => document.body.classList.add('vd-entered'), 1000);
}

for (const card of cards) {
  let frame = 0;
  let lastPoint = null;
  const scan = () => {
    if (!reducedMotion.matches) card.classList.add('vd-scanned');
  };
  const reset = () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    lastPoint = null;
    card.style.setProperty('--vd-rx', '0deg');
    card.style.setProperty('--vd-ry', '0deg');
  };
  card.addEventListener('pointerenter', scan);
  card.addEventListener('focus', () => {
    scan();
    card.style.setProperty('--vd-px', '50%');
    card.style.setProperty('--vd-py', '35%');
  });
  card.addEventListener('pointermove', (event) => {
    if (reducedMotion.matches || !finePointer.matches || event.pointerType === 'touch') return;
    lastPoint = { x: event.clientX, y: event.clientY };
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      if (!lastPoint) return;
      const bounds = card.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (lastPoint.x - bounds.left) / bounds.width));
      const y = Math.min(1, Math.max(0, (lastPoint.y - bounds.top) / bounds.height));
      card.style.setProperty('--vd-px', `${x * 100}%`);
      card.style.setProperty('--vd-py', `${y * 100}%`);
      card.style.setProperty('--vd-rx', `${(0.5 - y) * 5}deg`);
      card.style.setProperty('--vd-ry', `${(x - 0.5) * 5}deg`);
    });
  }, { passive: true });
  card.addEventListener('pointerleave', reset);
  card.addEventListener('blur', reset);
  reducedMotion.addEventListener('change', reset);
}

reducedMotion.addEventListener('change', () => {
  window.clearTimeout(enterTimer);
  document.body.classList.add('vd-entered');
});
