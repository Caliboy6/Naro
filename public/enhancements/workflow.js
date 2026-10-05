import { vetaLogo } from './brand-system.js';

/**
 * NARO illustrative workflow components.
 * Usage: import { mountWorkflow, mountControlGate } from './workflow.js';
 *        const cleanup = mountWorkflow(document.querySelector('#workflow'));
 * Load workflow.css once. Each mount returns a cleanup function.
 * These demonstrations do not fetch data or initiate transactions.
 */

let instanceCount = 0;

const icons = {
  intent: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  state: '<path d="M5 8c0-2 14-2 14 0s-14 2-14 0Zm0 0v8c0 2 14 2 14 0V8M5 12c0 2 14 2 14 0"/>',
  policy: '<path d="m12 3 8 3v6c0 4-3.5 7-8 9-4.5-2-8-5-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  orchestration: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4M5 5l3 3m8 8 3 3M5 19l3-3m8-8 3-3"/>',
  record: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  execution: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m8 5 11 7-11 7V5Z"/>',
  replay: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  arrow: '<path d="M4 12h16m-5-5 5 5-5 5"/>',
  block: '<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>',
};

const svg = (name, className = '') => `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.intent}</svg>`;

const steps = [
  { title: 'CIARA FRAMEWORK', role: 'ciara', short: 'Defines the operating boundaries.', field: 'Framework', value: 'Approved strategies & risk limits', description: 'Ciara defines the approved strategies, allocation framework and risk limits that set BTCvp’s operating boundaries.' },
  { title: 'NARO COORDINATION', role: 'naro', short: 'Monitors conditions. Proposes actions.', field: 'Authority', value: 'Proposals within the framework', description: 'Naro monitors conditions and proposes allocation, rebalancing and risk actions within Ciara’s framework. Naro cannot independently move capital.' },
  { title: 'VETA VERIFICATION', role: 'veta', short: 'Checks constraints before execution.', field: 'Verification', value: 'Independent constraint checks', description: 'Veta independently checks allocation, leverage, venue, counterparty, liquidity, redemption and risk constraints before execution.' },
  { title: 'EXECUTION OUTCOME', role: 'outcome', short: 'Execute or withhold.', field: 'Outcome', value: 'Pending verification', description: 'An action proceeds only after Veta’s checks pass. If the proposed action falls outside the approved framework, execution is withheld.' },
];

function workflowRoleIcon(role) {
  if (role === 'ciara') return '<img class="ciara-mark" src="/assets/ciara-mark.svg" alt="" aria-hidden="true">';
  if (role === 'naro') return '<span class="naro-symbol-window" aria-hidden="true"><img src="/assets/naro-supplied.png" alt=""></span>';
  if (role === 'veta') return vetaLogo({ markOnly: true, decorative: true });
  return svg('execution');
}

function createRoot(container, className) {
  if (!container || typeof container.appendChild !== 'function') {
    throw new TypeError('NARO workflow: pass a DOM container element.');
  }
  const root = document.createElement('section');
  root.className = `naroflow ${className}`;
  root.dataset.naroComponent = className;
  container.appendChild(root);
  return root;
}

function listen(target, event, callback, options, cleanups) {
  target.addEventListener(event, callback, options);
  cleanups.push(() => target.removeEventListener(event, callback, options));
}

/** Timer with independently tracked pause reasons and preserved step timing. */
function createClock(root, onTick, onPauseChange, cleanups) {
  const reasons = new Set();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timer = null;
  let remaining = 900;
  let deadline = 0;
  let destroyed = false;

  const clear = () => {
    if (timer !== null) {
      remaining = Math.max(0, deadline - performance.now());
      window.clearTimeout(timer);
      timer = null;
    }
  };
  const schedule = () => {
    // A null tick interval means a completed playback stays stopped until reset.
    if (destroyed || reasons.size || motion.matches || timer !== null || !Number.isFinite(remaining)) return;
    deadline = performance.now() + remaining;
    timer = window.setTimeout(() => {
      timer = null;
      remaining = onTick();
      schedule();
    }, remaining);
  };
  const sync = () => {
    clear();
    root.classList.toggle('is-paused', reasons.size > 0);
    root.classList.toggle('is-reduced', motion.matches);
    onPauseChange(reasons, motion.matches);
    schedule();
  };
  const setPaused = (reason, paused) => {
    if (paused) reasons.add(reason);
    else reasons.delete(reason);
    sync();
  };
  const onVisibility = () => setPaused('hidden', document.hidden);
  listen(document, 'visibilitychange', onVisibility, false, cleanups);
  const onMotion = () => {
    if (!motion.matches && !Number.isFinite(remaining)) remaining = 900;
    sync();
  };
  if (motion.addEventListener) listen(motion, 'change', onMotion, false, cleanups);
  else if (motion.addListener) {
    motion.addListener(onMotion);
    cleanups.push(() => motion.removeListener(onMotion));
  }
  if ('IntersectionObserver' in window) {
    reasons.add('offscreen');
    const observer = new IntersectionObserver(([entry]) => {
      setPaused('offscreen', !entry.isIntersecting);
    }, { threshold: 0.12 });
    observer.observe(root);
    cleanups.push(() => observer.disconnect());
  }
  if (document.hidden) reasons.add('hidden');
  cleanups.push(() => {
    destroyed = true;
    clear();
  });
  return {
    start: sync,
    setPaused,
    isManuallyPaused: () => reasons.has('manual'),
    isReduced: () => motion.matches,
    reset(delay = 900) {
      clear();
      remaining = delay;
      sync();
    },
  };
}

function inspectPause(root, inspectionArea, clock, cleanups) {
  listen(inspectionArea, 'pointerenter', (event) => {
    if (event.pointerType !== 'touch') clock.setPaused('inspect-pointer', true);
  }, false, cleanups);
  listen(inspectionArea, 'pointerleave', () => clock.setPaused('inspect-pointer', false), false, cleanups);
  listen(inspectionArea, 'focusin', () => clock.setPaused('inspect-focus', true), false, cleanups);
  listen(inspectionArea, 'focusout', (event) => {
    if (!inspectionArea.contains(event.relatedTarget)) clock.setPaused('inspect-focus', false);
  }, false, cleanups);
}

/** Draw arrows only in the measured gaps; DOM and focus order remain sequential. */
function mountConnections(grid, nodes, id, cleanups) {
  const layer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  layer.classList.add('naroflow-connections');
  layer.setAttribute('aria-hidden', 'true');
  layer.setAttribute('focusable', 'false');
  layer.innerHTML = `<defs><marker id="${id}-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M1 1 L5 3.5 L1 6" fill="none" stroke="context-stroke" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>${nodes.slice(1).map((_, index) => `<g class="naroflow-connection" data-connection="${index}"><path class="naroflow-connection-track" fill="none" marker-end="url(#${id}-arrow)"/><path class="naroflow-connection-pulse" fill="none" pathLength="100"/></g>`).join('')}`;
  grid.appendChild(layer);
  const links = [...layer.querySelectorAll('.naroflow-connection')];
  let disposed = false;
  let frame = null;
  const draw = () => {
    frame = null;
    if (disposed) return;
    const bounds = grid.getBoundingClientRect();
    layer.setAttribute('viewBox', `0 0 ${bounds.width || 1} ${bounds.height || 1}`);
    const rects = nodes.map((node) => node.getBoundingClientRect());
    links.forEach((link, index) => {
      const from = rects[index];
      const to = rects[index + 1];
      let x1, y1, x2, y2;
      // Snake placement means neighboring stages share a row or column.
      if (Math.abs((from.top + from.bottom - to.top - to.bottom) / 2) < 5) {
        y1 = y2 = (from.top + from.bottom + to.top + to.bottom) / 4 - bounds.top;
        const rightward = to.left > from.left;
        x1 = (rightward ? from.right + 2 : from.left - 2) - bounds.left;
        x2 = (rightward ? to.left - 2 : to.right + 2) - bounds.left;
      } else {
        x1 = x2 = (from.left + from.right + to.left + to.right) / 4 - bounds.left;
        y1 = from.bottom + 2 - bounds.top;
        y2 = to.top - 2 - bounds.top;
      }
      const path = `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)}`;
      link.querySelectorAll('path').forEach((line) => line.setAttribute('d', path));
    });
  };
  const requestDraw = () => {
    if (disposed || frame !== null) return;
    frame = window.requestAnimationFrame(draw);
  };
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(requestDraw);
    observer.observe(grid);
    nodes.forEach((node) => observer.observe(node));
    cleanups.push(() => observer.disconnect());
  } else listen(window, 'resize', requestDraw, false, cleanups);
  if (document.fonts) {
    document.fonts.ready.then(requestDraw);
    listen(document.fonts, 'loadingdone', requestDraw, false, cleanups);
  }
  requestDraw();
  cleanups.push(() => {
    disposed = true;
    if (frame !== null) window.cancelAnimationFrame(frame);
    layer.remove();
  });
  return (active, complete) => links.forEach((link, index) => {
    link.classList.toggle('is-current', !complete && index === active);
    link.classList.toggle('is-complete', complete || index < active);
  });
}

/** Mount BTCvp's four-role operating model. Returns a cleanup function. */
export function mountWorkflow(container) {
  const cleanups = [];
  const id = `naro-workflow-${++instanceCount}`;
  const root = createRoot(container, 'naroflow-workflow');
  root.classList.add('naroflow-btcvp');
  root.setAttribute('aria-label', 'BTCvp operating model');
  let active = 0;
  let inspected = null;
  let outside = false;
  let complete = false;
  let previouslyReduced = false;
  let clock;

  root.innerHTML = `
    <div class="naroflow-header">
      <div><span class="naroflow-eyebrow">BTCvp operating model</span><h3>AI proposes. Independent checks govern execution.</h3></div>
      <div class="naroflow-actions">
        <button class="naroflow-action" type="button" data-action="pause" aria-label="Pause operating model playback">${svg('pause')}<span>Pause</span></button>
        <button class="naroflow-action naroflow-replay" type="button" data-action="replay" aria-label="Replay operating model playback">${svg('replay')}<span>Replay</span></button>
      </div>
    </div>
    <div class="naroflow-scenarios naroflow-workflow-scenarios" role="group" aria-label="Choose an operating model scenario">
      <button type="button" class="naroflow-scenario is-selected" data-workflow-scenario-choice="approved" aria-pressed="true">Approved action</button>
      <button type="button" class="naroflow-scenario" data-workflow-scenario-choice="outside" aria-pressed="false">Outside policy</button>
    </div>
    <div class="naroflow-grid" role="group" aria-label="BTCvp operating roles">
      ${steps.map((step, index) => `<button type="button" class="naroflow-node" data-step="${index}" aria-controls="${id}-detail" aria-pressed="${index === 0}">
        <span class="naroflow-node-top"><span class="naroflow-icon naroflow-role-icon naroflow-role-icon-${step.role}">${workflowRoleIcon(step.role)}</span><span class="naroflow-number">0${index + 1}</span></span>
        <span class="naroflow-node-title">${step.title}</span>
        <span class="naroflow-node-summary">${step.short}</span>
        <span class="naroflow-node-field"><span>${step.field}</span><span${index === 3 ? ' data-workflow-outcome-value' : ''}>${step.value}</span></span>
        <span class="naroflow-node-status"><span class="naroflow-status-dot"></span><span data-node-status>Waiting</span></span>
        <span class="naroflow-progress" aria-hidden="true"></span>
      </button>`).join('')}
    </div>
    <div class="naroflow-detail" id="${id}-detail" aria-live="polite" aria-atomic="true"><span class="naroflow-detail-index">01 / ${steps[0].title}</span><p>${steps[0].description}</p></div>
    <div class="naroflow-footer"><span class="naroflow-overall-status">Stage 01 of 04</span><span>Inspect any role</span></div>
    <p class="naroflow-source-note">Based on BTCvp’s published operating model. Illustrative playback. <span><a href="https://vault.vishwalab.com/btcvp" target="_blank" rel="noopener noreferrer">BTCvp</a><span aria-hidden="true"> · </span><a href="https://docs.vishwalab.com/" target="_blank" rel="noopener noreferrer">Documentation</a></span></p>`;

  const nodes = [...root.querySelectorAll('.naroflow-node')];
  const scenarios = [...root.querySelectorAll('[data-workflow-scenario-choice]')];
  const grid = root.querySelector('.naroflow-grid');
  const detail = root.querySelector('.naroflow-detail');
  const status = root.querySelector('.naroflow-overall-status');
  const pauseButton = root.querySelector('[data-action="pause"]');
  const replayButton = root.querySelector('[data-action="replay"]');
  const renderConnections = mountConnections(grid, nodes, id, cleanups);
  const links = [...grid.querySelectorAll('.naroflow-connection')];
  const doneLabels = ['Framework defined', 'Action proposed', 'Checks passed', 'Approved execution'];
  const currentLabels = ['Operating framework', 'Proposing an action', 'Checking constraints', 'Approved execution'];

  const descriptionFor = (index) => {
    if (index === 2 && outside && complete) return 'Veta independently checks the proposed action against the operating constraints. In this scenario, the action falls outside policy and execution is withheld.';
    if (index === 3 && outside) return 'An action that falls outside the approved framework is withheld at Veta’s verification boundary. No execution proceeds in this scenario.';
    if (index === 3 && active === 3) return 'In this scenario, the proposed action passes Veta’s independent checks and proceeds along the approved execution path.';
    return steps[index].description;
  };
  const renderDetail = () => {
    const selected = inspected === null ? active : inspected;
    detail.innerHTML = `<span class="naroflow-detail-index">0${selected + 1} / ${steps[selected].title}</span><p>${descriptionFor(selected)}</p>`;
  };

  const render = () => {
    const selected = inspected === null ? active : inspected;
    const outcome = outside && complete ? 'withheld' : !outside && active === 3 ? 'approved' : 'pending';
    root.dataset.workflowStage = String(active);
    root.dataset.workflowScenario = outside ? 'outside' : 'approved';
    root.dataset.workflowOutcome = outcome;
    root.classList.toggle('is-outside-policy', outside);
    root.classList.toggle('is-workflow-complete', complete);
    root.classList.toggle('is-workflow-withheld', outcome === 'withheld');
    nodes.forEach((node, index) => {
      const done = (!outside && complete) || index < active;
      const current = !complete && index === active;
      node.classList.toggle('is-complete', done);
      node.classList.toggle('is-current', current);
      node.classList.toggle('is-selected', index === selected);
      node.classList.toggle('is-blocked', outside && complete && index === 2);
      node.classList.toggle('is-inactive', outside && index === 3);
      node.classList.toggle('is-withheld', outcome === 'withheld' && index === 3);
      if (current) node.setAttribute('aria-current', 'step');
      else node.removeAttribute('aria-current');
      node.setAttribute('aria-pressed', String(index === selected));
      node.querySelector('[data-node-status]').textContent = outside && complete && index === 2 ? 'Outside policy' : outside && index === 3 ? complete ? 'Execution withheld' : 'Awaiting verification' : done ? doneLabels[index] : current ? currentLabels[index] : 'Waiting';
    });
    // Light the incoming connection for the active role. The execution connection
    // stays inactive throughout the outside-policy scenario, including its ending.
    renderConnections(outside && complete ? active : active - 1, complete && !outside);
    links.forEach((link, index) => {
      const executionBlocked = outside && index === 2;
      link.classList.toggle('is-inactive', executionBlocked);
      link.classList.toggle('is-withheld', executionBlocked && complete);
      if (executionBlocked) link.classList.remove('is-current', 'is-complete');
    });
    scenarios.forEach((button) => {
      const selected = button.dataset.workflowScenarioChoice === (outside ? 'outside' : 'approved');
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    root.querySelector('[data-workflow-outcome-value]').textContent = outcome === 'withheld' ? 'Execution withheld' : outcome === 'approved' ? 'Approved execution' : 'Pending verification';
    nodes[3].querySelector('.naroflow-role-icon').innerHTML = outcome === 'withheld' ? svg('block') : workflowRoleIcon('outcome');
    renderDetail();
    pauseButton.disabled = complete || (clock && clock.isReduced());
  };
  const stageStatus = () => complete ? outside ? 'Execution withheld · outside policy' : 'Approved playback complete' : `Stage 0${active + 1} of 04`;
  const tick = () => {
    if (complete) return null;
    if (active < (outside ? 2 : 3)) active += 1;
    else complete = true;
    render();
    status.textContent = stageStatus();
    return complete ? null : active === 2 ? 1700 : active === 3 ? 1500 : 1100;
  };
  clock = createClock(root, tick, (reasons, reduced) => {
    if (reduced) {
      active = outside ? 2 : 3;
      complete = true;
      render();
    } else if (previouslyReduced) {
      active = 0;
      complete = false;
      inspected = null;
      render();
    }
    previouslyReduced = reduced;
    pauseButton.innerHTML = `${svg(reasons.has('manual') ? 'play' : 'pause')}<span>${reasons.has('manual') ? 'Continue' : 'Pause'}</span>`;
    pauseButton.setAttribute('aria-label', reasons.has('manual') ? 'Continue operating model playback' : 'Pause operating model playback');
    pauseButton.setAttribute('aria-pressed', String(reasons.has('manual')));
    pauseButton.disabled = reduced || complete;
    replayButton.disabled = reduced;
    status.textContent = reduced ? `${outside ? 'Execution withheld' : 'Approved path'} · static view` : complete ? stageStatus() : reasons.has('manual') ? 'Paused' : reasons.has('inspect-pointer') || reasons.has('inspect-focus') ? 'Paused while inspecting' : stageStatus();
  }, cleanups);

  nodes.forEach((node, index) => listen(node, 'click', () => {
    inspected = index;
    render();
  }, false, cleanups));
  nodes.forEach((node, index) => {
    listen(node, 'pointerenter', (event) => {
      if (event.pointerType !== 'touch') { inspected = index; render(); }
    }, false, cleanups);
    listen(node, 'focusin', () => { inspected = index; render(); }, false, cleanups);
  });
  listen(grid, 'pointerleave', () => {
    if (!grid.contains(document.activeElement)) { inspected = null; render(); }
  }, false, cleanups);
  listen(grid, 'focusout', (event) => {
    if (!grid.contains(event.relatedTarget)) { inspected = null; render(); }
  }, false, cleanups);
  scenarios.forEach((button) => listen(button, 'click', () => {
    outside = button.dataset.workflowScenarioChoice === 'outside';
    active = 0;
    complete = false;
    inspected = null;
    render();
    clock.reset(1100);
  }, false, cleanups));
  listen(pauseButton, 'click', () => clock.setPaused('manual', !clock.isManuallyPaused()), false, cleanups);
  listen(replayButton, 'click', () => {
    active = 0;
    complete = false;
    inspected = null;
    render();
    clock.setPaused('manual', false);
    clock.reset(1100);
  }, false, cleanups);
  inspectPause(root, grid, clock, cleanups);
  render();
  clock.start();
  return () => {
    cleanups.forEach((cleanup) => cleanup());
    root.remove();
  };
}

/** Mount a policy gate illustration. Returns a cleanup function. */
export function mountControlGate(container) {
  const cleanups = [];
  const id = `naro-gate-${++instanceCount}`;
  const root = createRoot(container, 'naroflow-gate');
  root.setAttribute('aria-label', 'Illustrative VETA verification boundary');
  let outside = false;
  let active = 0;
  let complete = false;
  let previouslyReduced = false;
  let clock;
  root.innerHTML = `
    <div class="naroflow-header"><div><span class="naroflow-eyebrow">ILLUSTRATIVE WORKFLOW</span><h3>AI proposes. VETA verifies.</h3></div></div>
    <p class="naroflow-gate-intro">An illustration of a proposed action passing through a verification boundary.</p>
    <div class="naroflow-scenarios" role="group" aria-label="Choose an illustrative policy scenario">
      <button type="button" class="naroflow-scenario is-selected" data-scenario="approved" aria-pressed="true">Approved</button>
      <button type="button" class="naroflow-scenario" data-scenario="outside" aria-pressed="false">Outside policy</button>
    </div>
    <div class="naroflow-gate-path" role="group" aria-label="Verification stages">
      <button type="button" class="naroflow-gate-node" data-gate-step="0" aria-controls="${id}-detail">${svg('orchestration', 'naroflow-gate-icon')}<span class="naroflow-node-title">AI PROPOSES</span><span class="naroflow-node-summary">Strategy intent</span></button>
      <span class="naroflow-gate-link" aria-hidden="true">${svg('arrow')}</span>
      <button type="button" class="naroflow-gate-node naroflow-gate-boundary" data-gate-step="1" aria-controls="${id}-detail">${vetaLogo()}<span class="naroflow-node-title">VETA VERIFIES</span><span class="naroflow-node-summary">Policy boundary</span><span class="naroflow-boundary-tag">VERIFICATION GATE</span></button>
      <span class="naroflow-gate-link naroflow-gate-link-out" aria-hidden="true">${svg('arrow')}</span>
      <button type="button" class="naroflow-gate-node" data-gate-step="2" aria-controls="${id}-detail">${svg('execution', 'naroflow-gate-icon')}<span class="naroflow-node-title" data-outcome-title>APPROVED EXECUTION</span><span class="naroflow-node-summary" data-outcome-summary>Approved path</span></button>
    </div>
    <div class="naroflow-detail" id="${id}-detail" aria-live="polite" aria-atomic="true"><span class="naroflow-detail-index">POLICY EXAMPLE</span><p data-gate-detail>Within the illustrative policy: the proposed action passes verification and proceeds along the approved path.</p></div>
    <div class="naroflow-footer"><span class="naroflow-overall-status">Illustrative sequence</span><span class="naroflow-actions"><button class="naroflow-action" type="button" data-action="pause" aria-label="Pause verification illustration">${svg('pause')}<span>Pause</span></button><button class="naroflow-action" type="button" data-action="replay" aria-label="Replay verification illustration">${svg('replay')}<span>Replay</span></button></span></div>
    <p class="naroflow-demo-note">Conceptual example only. No live policy decision or transaction is shown.</p>`;

  const nodes = [...root.querySelectorAll('[data-gate-step]')];
  const scenarios = [...root.querySelectorAll('[data-scenario]')];
  const path = root.querySelector('.naroflow-gate-path');
  const status = root.querySelector('.naroflow-overall-status');
  const pauseButton = root.querySelector('[data-action="pause"]');
  const replayButton = root.querySelector('[data-action="replay"]');
  const detail = root.querySelector('[data-gate-detail]');
  const defaultDetail = () => outside ? 'Outside the illustrative policy: verification stops the proposed action at the boundary. The execution path remains inactive.' : 'Within the illustrative policy: the proposed action passes verification and proceeds along the approved path.';
  const render = () => {
    root.classList.toggle('is-outside-policy', outside);
    root.classList.toggle('is-gate-complete', complete);
    root.dataset.gateStage = String(active);
    nodes.forEach((node, index) => {
      node.classList.toggle('is-current', !complete && index === active);
      node.classList.toggle('is-complete', (!outside && complete) || index < active);
      node.classList.toggle('is-blocked', outside && index === 1 && complete);
      node.classList.toggle('is-inactive', outside && index === 2);
      if (!complete && index === active) node.setAttribute('aria-current', 'step');
      else node.removeAttribute('aria-current');
    });
    scenarios.forEach((button) => {
      const selected = button.dataset.scenario === (outside ? 'outside' : 'approved');
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    root.querySelector('[data-outcome-title]').textContent = outside ? 'EXECUTION PAUSED' : 'APPROVED EXECUTION';
    root.querySelector('[data-outcome-summary]').textContent = outside ? 'No action proceeds' : 'Approved path';
  };
  const tick = () => {
    if (complete) {
      active = 0;
      complete = false;
    } else if (active < (outside ? 1 : 2)) active += 1;
    else complete = true;
    render();
    status.textContent = complete ? outside ? 'Illustrative action stopped' : 'Illustrative path verified' : active === 0 ? 'Proposing' : active === 1 ? 'Verifying' : 'Approved path';
    return complete ? 2800 : active === 1 ? 1600 : 1100;
  };
  clock = createClock(root, tick, (reasons, reduced) => {
    if (reduced) { active = outside ? 1 : 2; complete = true; render(); }
    else if (previouslyReduced) { active = 0; complete = false; render(); }
    previouslyReduced = reduced;
    pauseButton.innerHTML = `${svg(reasons.has('manual') ? 'play' : 'pause')}<span>${reasons.has('manual') ? 'Continue' : 'Pause'}</span>`;
    pauseButton.setAttribute('aria-label', reasons.has('manual') ? 'Continue verification illustration' : 'Pause verification illustration');
    pauseButton.setAttribute('aria-pressed', String(reasons.has('manual')));
    pauseButton.disabled = reduced;
    replayButton.disabled = reduced;
    status.textContent = reduced ? 'Static example · reduced motion' : reasons.has('manual') ? 'Paused' : reasons.has('inspect-pointer') || reasons.has('inspect-focus') ? 'Paused while inspecting' : complete ? outside ? 'Illustrative action stopped' : 'Illustrative path verified' : active === 0 ? 'Proposing' : active === 1 ? 'Verifying' : 'Approved path';
  }, cleanups);

  scenarios.forEach((button) => listen(button, 'click', () => {
    outside = button.dataset.scenario === 'outside';
    active = 0;
    complete = false;
    detail.textContent = defaultDetail();
    render();
    clock.reset(1100);
  }, false, cleanups));
  const descriptions = [
    'AI proposes an action based on the strategy objective. A proposal must still pass the verification boundary.',
    'VETA represents the verification boundary in this illustration. The proposed action is evaluated against the applicable policy before proceeding.',
    'An approved action proceeds along the illustrated execution path. This diagram does not represent a live transaction.',
  ];
  nodes.forEach((node, index) => listen(node, 'click', () => {
    detail.textContent = index === 2 && outside ? 'The proposed action is outside this illustrative policy. Execution remains paused at the verification boundary.' : descriptions[index];
    nodes.forEach((item, itemIndex) => item.classList.toggle('is-selected', itemIndex === index));
  }, false, cleanups));
  listen(pauseButton, 'click', () => clock.setPaused('manual', !clock.isManuallyPaused()), false, cleanups);
  listen(replayButton, 'click', () => {
    active = 0;
    complete = false;
    detail.textContent = defaultDetail();
    render();
    clock.setPaused('manual', false);
    clock.reset(1100);
  }, false, cleanups);
  inspectPause(root, path, clock, cleanups);
  render();
  clock.start();
  return () => {
    cleanups.forEach((cleanup) => cleanup());
    root.remove();
  };
}
