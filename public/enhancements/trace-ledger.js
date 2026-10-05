import { vetaLogo } from './brand-system.js';

// The figures below are explanatory examples, not product parameters or live data.
const RECORDS = Object.freeze([
  {
    title: 'Rebalance BTCvp allocation',
    shortTitle: 'Allocation rebalance',
    category: 'ALLOCATION',
    outcome: 'Within approved allocation',
    blocked: false,
    proposal: 'An illustrative +3.2% allocation adjustment.',
    check: 'Within this example’s approved allocation framework.',
    execution: 'Release the approved example for execution.',
    fields: [['PROPOSED ADJUSTMENT', '+3.2%'], ['EXAMPLE CONDITION', 'Approved allocation']],
    note: 'This example links the proposal, policy decision and resulting action.',
  },
  {
    title: 'Leverage proposal',
    shortTitle: 'Leverage proposal',
    category: 'POLICY BOUNDARY',
    outcome: 'Above the example mandate',
    blocked: true,
    proposal: 'A proposal requests 2.8× leverage in this example.',
    check: 'The 2.8× request exceeds the example limit of 2.0×.',
    execution: 'Execution is withheld after the policy rejection.',
    fields: [['REQUESTED LEVERAGE', '2.8×'], ['EXAMPLE LIMIT', '2.0×']],
    note: 'The rejected proposal remains visible. Capital movement is not released.',
  },
  {
    title: 'Liquidity reserve',
    shortTitle: 'Reserve restoration',
    category: 'LIQUIDITY',
    outcome: 'Reserve condition satisfied',
    blocked: false,
    proposal: 'Restore the example liquidity reserve to 14.0%.',
    check: 'The proposed reserve meets this example’s approved condition.',
    execution: 'Release the approved reserve adjustment.',
    fields: [['EXAMPLE RESERVE', '14.0%'], ['EXAMPLE CONDITION', 'Reserve restored']],
    note: 'The record explains why the example adjustment clears the policy check.',
  },
]);

const PROPOSAL_END = 1800;
const CHECK_END = 4200;
const EXECUTION_END = 6500;
let instanceId = 0;

const icon = (kind) => {
  const paths = {
    proposal: '<path d="M5 3h7l4 4v10H5V3Zm7 0v4h4M8 10h5M8 13h5"/>',
    execution: '<path d="M3 10h13m-5-5 5 5-5 5M3 5v10"/>',
    check: '<path d="m4 10 4 4 8-8"/>',
    block: '<rect x="4" y="4" width="12" height="12" rx="3"/><path d="m7 7 6 6M13 7l-6 6"/>',
    pending: '<circle cx="10" cy="10" r="6"/><path d="M10 6v4l3 2"/>',
    pause: '<path d="M7 5v10M13 5v10"/>',
    play: '<path d="m7 4 9 6-9 6V4Z"/>',
    replay: '<path d="M4 8a6 6 0 1 1 0 5M4 3v5h5"/>',
  };
  return `<svg class="naro-trace-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[kind] || paths.pending}</svg>`;
};

/**
 * Mount a self-contained illustrative decision ledger into an empty host.
 * Selection always restarts the selected example. Playback stops at its outcome.
 * Offscreen and hidden periods do not advance elapsed time.
 * Reduced motion presents the full, static result and keeps record selection usable.
 */
export function mountTraceLedger(host) {
  if (!host || typeof host.replaceChildren !== 'function') return () => {};
  const doc = host.ownerDocument;
  const win = doc.defaultView;
  const id = `naro-trace-${++instanceId}`;
  const media = win.matchMedia('(prefers-reduced-motion: reduce)');
  const root = doc.createElement('div');
  root.className = 'naro-trace-ledger';
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', 'Illustrative decision records');
  root.innerHTML = `
    <div class="naro-trace-topline">
      <span class="naro-trace-eyebrow">Decision ledger<span aria-hidden="true">.</span></span>
      <span class="naro-trace-demo"><i aria-hidden="true"></i>ILLUSTRATIVE RECORDS</span>
    </div>
    <div class="naro-trace-workspace">
      <div class="naro-trace-records" role="tablist" aria-label="Choose an illustrative decision">
        ${RECORDS.map((record, index) => `
          <button class="naro-trace-record${index === 0 ? ' is-selected' : ''}" type="button" role="tab" id="${id}-record-${index}" aria-controls="${id}-panel" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" data-record="${index}" data-outcome="${record.blocked ? 'blocked' : 'passed'}">
            <span class="naro-trace-record-top"><span class="naro-trace-record-number">0${index + 1}</span><span class="naro-trace-record-category">${record.category}</span><span class="naro-trace-record-symbol" aria-hidden="true">${icon(record.blocked ? 'block' : 'check')}</span></span>
            <strong class="naro-trace-record-title">${record.title}</strong>
            <span class="naro-trace-record-outcome">${record.outcome}</span>
            <span class="naro-trace-record-link" aria-hidden="true">${icon('execution')}</span>
          </button>`).join('')}
      </div>
      <div class="naro-trace-panel" id="${id}-panel" role="tabpanel" aria-labelledby="${id}-record-0" tabindex="0"></div>
    </div>
    <div class="naro-trace-footer">
      <span class="naro-trace-disclaimer">Explanatory examples. No live vault activity.</span>
      <span class="naro-trace-selection-hint">Select a record to replay its decision.</span>
    </div>
    <span class="naro-trace-announcer" aria-live="polite" aria-atomic="true"></span>`;
  host.replaceChildren(root);

  const panel = root.querySelector('.naro-trace-panel');
  const tabs = [...root.querySelectorAll('.naro-trace-record')];
  const announcer = root.querySelector('.naro-trace-announcer');
  let selected = 0;
  let elapsed = media.matches ? EXECUTION_END : 0;
  let userPaused = false;
  let visible = false;
  let destroyed = false;
  let frame = 0;
  let lastTime = 0;
  let previousStage = '';
  let previousPercent = -1;
  let previousControlState = '';
  let refs;

  const record = () => RECORDS[selected];
  const duration = () => record().blocked ? CHECK_END : EXECUTION_END;
  const finished = () => elapsed >= duration();
  const canPlay = () => !destroyed && !media.matches && !userPaused && visible && !doc.hidden && !finished() && root.isConnected;
  const announce = (message) => { announcer.textContent = message; };

  function createPanel() {
    const item = record();
    panel.setAttribute('aria-labelledby', `${id}-record-${selected}`);
    panel.innerHTML = `
      <div class="naro-trace-panel-heading">
        <div><span class="naro-trace-decision-label">DECISION 0${selected + 1}</span><h3 class="naro-trace-heading">${item.shortTitle}</h3></div>
        <span class="naro-trace-state" data-state="pending"><i aria-hidden="true"></i><span>In review</span></span>
      </div>
      <ol class="naro-trace-flow" aria-label="Decision stages">
        <li class="naro-trace-step" data-step="0"><span class="naro-trace-step-icon">${icon('proposal')}</span><div class="naro-trace-step-body"><strong class="naro-trace-step-title">AI proposal</strong><span class="naro-trace-step-status">Preparing</span></div><span class="naro-trace-step-index" aria-hidden="true">01</span></li>
        <li class="naro-trace-step" data-step="1"><span class="naro-trace-step-icon naro-trace-veta">${vetaLogo({markOnly: true, decorative: true})}</span><div class="naro-trace-step-body"><strong class="naro-trace-step-title">VETA policy check</strong><span class="naro-trace-step-status">Waiting</span></div><span class="naro-trace-step-index" aria-hidden="true">02</span></li>
        <li class="naro-trace-step" data-step="2"><span class="naro-trace-step-icon">${icon('execution')}</span><div class="naro-trace-step-body"><strong class="naro-trace-step-title">Execution</strong><span class="naro-trace-step-status">Held</span></div><span class="naro-trace-step-index" aria-hidden="true">03</span></li>
      </ol>
      <div class="naro-trace-evidence-grid"><div class="naro-trace-detail">
        <span class="naro-trace-detail-label">PROPOSAL CONTEXT</span>
        <p class="naro-trace-detail-copy">${item.proposal}</p>
        <dl class="naro-trace-fields">${item.fields.map(([label, value]) => `<div class="naro-trace-field"><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>
      </div>
      <div class="naro-trace-result" data-result="pending">
        <span class="naro-trace-result-icon">${icon('pending')}</span>
        <div><span class="naro-trace-result-label">EXECUTION RESULT</span><strong class="naro-trace-result-title">Awaiting policy decision</strong><p class="naro-trace-result-evidence">An execution outcome follows the policy check.</p></div>
      </div></div>
      <div class="naro-trace-playback">
        <div class="naro-trace-playback-meta"><span class="naro-trace-playback-label">AI proposal</span><span class="naro-trace-playback-stage">01 / 03</span></div>
        <div class="naro-trace-progress" role="progressbar" aria-label="Illustrative trace playback" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div>
        <div class="naro-trace-controls">
          <button type="button" class="naro-trace-control naro-trace-pause" data-action="pause">${icon('pause')}<span>Pause</span></button>
          <button type="button" class="naro-trace-control naro-trace-replay" data-action="replay">${icon('replay')}<span>Replay trace</span></button>
        </div>
      </div>`;
    refs = {
      state: panel.querySelector('.naro-trace-state'),
      stateText: panel.querySelector('.naro-trace-state > span'),
      steps: [...panel.querySelectorAll('.naro-trace-step')],
      detailLabel: panel.querySelector('.naro-trace-detail-label'),
      detailCopy: panel.querySelector('.naro-trace-detail-copy'),
      result: panel.querySelector('.naro-trace-result'),
      resultIcon: panel.querySelector('.naro-trace-result-icon'),
      resultTitle: panel.querySelector('.naro-trace-result-title'),
      resultEvidence: panel.querySelector('.naro-trace-result-evidence'),
      progress: panel.querySelector('.naro-trace-progress'),
      playbackLabel: panel.querySelector('.naro-trace-playback-label'),
      playbackStage: panel.querySelector('.naro-trace-playback-stage'),
      pause: panel.querySelector('.naro-trace-pause'),
      replay: panel.querySelector('.naro-trace-replay'),
    };
    previousStage = '';
    previousPercent = -1;
    previousControlState = '';
  }

  function stageAtTime() {
    if (elapsed < PROPOSAL_END) return 'proposal';
    if (elapsed < CHECK_END) return 'check';
    if (record().blocked) return 'blocked';
    if (elapsed < EXECUTION_END) return 'execution';
    return 'complete';
  }

  function render() {
    const item = record();
    const stage = stageAtTime();
    const complete = stage === 'complete';
    const blocked = stage === 'blocked';
    const checkPassed = stage === 'execution' || complete;
    root.dataset.stage = stage;
    root.dataset.motion = media.matches ? 'reduced' : 'full';
    root.dataset.playing = String(canPlay());
    root.dataset.paused = String(userPaused && !finished());
    // A rejected proposal never fills the rail beyond the policy-check node.
    const railProgress = elapsed < PROPOSAL_END
      ? 0.5 * elapsed / PROPOSAL_END
      : item.blocked ? 0.5 : Math.min(1, 0.5 + 0.5 * (elapsed - PROPOSAL_END) / (CHECK_END - PROPOSAL_END));
    root.style.setProperty('--naro-trace-progress', String(railProgress));
    root.style.setProperty('--naro-trace-playback-progress', String(Math.min(1, elapsed / duration())));
    const percent = Math.round(Math.min(100, elapsed / duration() * 100));
    if (percent !== previousPercent) {
      refs.progress.setAttribute('aria-valuenow', String(percent));
      previousPercent = percent;
    }
    const controlState = `${media.matches}/${finished()}/${userPaused}`;
    if (controlState !== previousControlState) {
      const pauseLabel = media.matches ? 'Static trace' : finished() ? 'Complete' : userPaused ? 'Resume' : 'Pause';
      refs.pause.disabled = media.matches || finished();
      refs.pause.setAttribute('aria-label', media.matches ? 'Static completed trace' : finished() ? 'Illustrative trace complete' : userPaused ? 'Resume illustrative trace' : 'Pause illustrative trace');
      refs.pause.innerHTML = `${icon(userPaused ? 'play' : 'pause')}<span>${pauseLabel}</span>`;
      refs.replay.disabled = media.matches;
      refs.replay.title = media.matches ? 'Your motion preference displays a static completed trace.' : 'Replay this illustrative decision from its proposal.';
      previousControlState = controlState;
    }
    if (stage === previousStage) return;
    previousStage = stage;

    refs.steps.forEach((step, index) => {
      const activeIndex = stage === 'proposal' ? 0 : stage === 'check' || blocked ? 1 : 2;
      const isComplete = index === 0 && stage !== 'proposal' || index === 1 && checkPassed || index === 2 && complete;
      step.classList.toggle('is-active', index === activeIndex && !finished());
      step.classList.toggle('is-complete', isComplete);
      step.classList.toggle('is-blocked', index === 1 && blocked);
      step.classList.toggle('is-withheld', index === 2 && blocked);
      step.dataset.state = index === 1 && blocked ? 'blocked' : index === 2 && blocked ? 'withheld' : isComplete ? 'complete' : index === activeIndex ? 'active' : 'waiting';
    });
    const labels = stage === 'proposal' ? ['Preparing', 'Waiting', 'Held']
      : stage === 'check' ? ['Proposed', 'Checking', 'Held']
      : blocked ? ['Proposed', 'Blocked', 'Not executed']
      : complete ? ['Proposed', 'Passed', 'Complete']
      : ['Proposed', 'Passed', 'Executing'];
    refs.steps.forEach((step, index) => step.querySelector('.naro-trace-step-status').textContent = labels[index]);
    refs.state.dataset.state = blocked ? 'blocked' : checkPassed ? 'passed' : 'pending';
    refs.stateText.textContent = blocked ? 'Blocked' : complete ? 'Passed' : checkPassed ? 'Policy passed' : stage === 'check' ? 'Checking policy' : 'In review';
    refs.detailLabel.textContent = stage === 'proposal' ? 'PROPOSAL CONTEXT' : stage === 'check' || blocked ? 'POLICY DECISION' : 'VERIFIED PATH';
    refs.detailCopy.textContent = stage === 'proposal' ? item.proposal : stage === 'check' || blocked ? item.check : stage === 'execution' ? item.execution : item.note;
    refs.result.dataset.result = blocked ? 'blocked' : complete ? 'passed' : 'pending';
    refs.resultIcon.innerHTML = icon(blocked ? 'block' : complete ? 'check' : 'pending');
    refs.resultTitle.textContent = blocked ? 'Blocked before execution' : complete ? 'Illustrative execution complete' : stage === 'execution' ? 'Executing approved example' : 'Awaiting policy decision';
    refs.resultEvidence.textContent = blocked ? 'Policy rejection recorded. No execution released.' : complete ? 'Proposal, policy decision and outcome linked.' : stage === 'execution' ? 'The passed policy decision accompanies the example action.' : 'An execution outcome follows the policy check.';
    refs.playbackLabel.textContent = media.matches ? 'Static completed trace' : blocked ? 'Stopped at the policy boundary' : complete ? 'Proposal · Policy · Outcome' : stage === 'check' ? 'Checking the policy boundary' : stage === 'execution' ? 'Executing the approved example' : 'Preparing the AI proposal';
    refs.playbackStage.textContent = blocked ? '02 / 03 · BLOCKED' : stage === 'proposal' ? '01 / 03' : stage === 'check' ? '02 / 03' : '03 / 03';
    if (visible || media.matches) announce(`${item.title}. ${refs.playbackLabel.textContent}. ${blocked ? 'No execution was released.' : ''}`);
  }

  function stopFrame() {
    if (frame) win.cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  }

  function schedule() {
    if (canPlay() && !frame) frame = win.requestAnimationFrame(tick);
  }

  function tick(time) {
    frame = 0;
    if (!canPlay()) { stopFrame(); render(); return; }
    if (lastTime) elapsed = Math.min(duration(), elapsed + Math.min(120, Math.max(0, time - lastTime)));
    lastTime = time;
    render();
    if (finished()) { lastTime = 0; return; }
    schedule();
  }

  function restart(index = selected, focus = false) {
    stopFrame();
    selected = index;
    userPaused = false;
    elapsed = media.matches ? duration() : 0;
    tabs.forEach((tab, tabIndex) => {
      const active = tabIndex === selected;
      tab.classList.toggle('is-selected', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    createPanel();
    render();
    if (focus) tabs[selected].focus();
    announce(`${record().title}. ${media.matches ? 'Static completed trace.' : 'Playback restarted from the AI proposal.'}`);
    schedule();
  }

  function handleClick(event) {
    const target = event.target.closest?.('button');
    if (!target || !root.contains(target)) return;
    if (target.hasAttribute('data-record')) { restart(Number(target.dataset.record)); return; }
    if (target.dataset.action === 'replay') { restart(); refs.replay.focus({preventScroll: true}); return; }
    if (target.dataset.action === 'pause' && !media.matches && !finished()) {
      userPaused = !userPaused;
      stopFrame();
      render();
      announce(`${record().title}. Playback ${userPaused ? 'paused for inspection.' : 'resumed.'}`);
      schedule();
    }
  }

  function handleKey(event) {
    const tab = event.target.closest?.('.naro-trace-record');
    if (!tab || !root.contains(tab)) return;
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (selected + 1) % RECORDS.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (selected + RECORDS.length - 1) % RECORDS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = RECORDS.length - 1;
    else return;
    event.preventDefault();
    restart(next, true);
  }

  function handleVisibility() {
    stopFrame();
    render();
    schedule();
  }

  function handleMotion() {
    stopFrame();
    // Turning off animation immediately resolves this example to its static result.
    if (media.matches) { elapsed = duration(); userPaused = false; }
    previousStage = '';
    render();
    schedule();
  }

  const observer = new win.IntersectionObserver(entries => {
    visible = entries.some(entry => entry.target === root && entry.isIntersecting);
    stopFrame();
    render();
    schedule();
  }, {threshold: 0.08});
  root.addEventListener('click', handleClick);
  root.addEventListener('keydown', handleKey);
  doc.addEventListener('visibilitychange', handleVisibility);
  if (media.addEventListener) media.addEventListener('change', handleMotion);
  else media.addListener(handleMotion);
  createPanel();
  render();
  observer.observe(root);

  return () => {
    if (destroyed) return;
    destroyed = true;
    stopFrame();
    observer.disconnect();
    root.removeEventListener('click', handleClick);
    root.removeEventListener('keydown', handleKey);
    doc.removeEventListener('visibilitychange', handleVisibility);
    if (media.removeEventListener) media.removeEventListener('change', handleMotion);
    else media.removeListener(handleMotion);
    root.remove();
  };
}
