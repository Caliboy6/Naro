/** BTCvc proposal FAQ. Supplied product copy; isolated from every other preview. */
const FAQ_ITEMS = [
  {
    question: 'What does the 1:1 ratio mean?',
    paragraphs: [
      'The 1:1 ratio describes the BTC conversion basis under the program terms, before applicable fees. It is not a guarantee of the secondary-market price of BTCvc.',
      'Rewards are distributed separately in BTCvc rather than through an increase in the conversion ratio. Minting and redemption remain subject to eligibility, lock-up conditions, fees, and processing requirements.',
    ],
  },
  {
    question: 'How are rewards calculated?',
    paragraphs: [
      'BTCvc rewards are allocated based on the amount of eligible BTCvc you hold and how long you hold it during each UTC calendar month.',
      'Your share of the monthly reward pool is calculated using your time-weighted eligible balance, rather than your balance at a single month-end snapshot.',
      'The reward pool is determined from actual distributable net returns after applicable strategy fees and reconciliation. Rewards are variable and are not guaranteed.',
    ],
  },
  {
    question: 'How are rewards distributed?',
    paragraphs: [
      'Rewards are distributed in BTCvc through separate monthly transfers, not through token rebasing.',
      'Each UTC calendar month is reconciled after month-end. Finalized rewards are distributed during the announced payment window in the following month.',
      'Transferring or redeeming your principal does not erase the reward entitlement accumulated during your earlier eligible holding period. Payment remains subject to the program’s eligibility requirements.',
    ],
  },
  {
    question: 'When do rewards begin, and what does the confirmation time mean?',
    paragraphs: [
      'Your balance begins accumulating reward weight once your BTC deposit has completed the required confirmations, BTCvc has been successfully minted, and the balance is eligible under the program.',
      'The confirmation estimate displayed on the page relates to BTC deposit confirmation. It is not the principal lock-up period or the time required to process a redemption. Actual confirmation times may vary.',
      'Final reward amounts are determined through monthly reconciliation. Eligibility to earn rewards does not guarantee a positive return.',
    ],
  },
  {
    question: 'Is there a lock-up period?',
    paragraphs: [
      'Each new BTC deposit has its own three-calendar-month principal lock-up, starting from the recorded mint-completion time.',
      'Additional deposits have separate unlock times and do not extend the lock-up of your existing principal.',
      'The Redeem tab shows your currently eligible amount and the next applicable unlock information. Principal cannot be redeemed before its applicable unlock time.',
    ],
  },
  {
    question: 'Can I transfer BTCvc during the lock-up period?',
    paragraphs: [
      'Transfers carrying the associated program rights are supported between eligible participants through the program’s supported transfer process.',
      'Transferred principal retains its original unlock time. The lock-up is neither restarted nor shortened.',
      'Reward weight accumulated before the transfer remains with the sender. The eligible recipient begins accumulating reward weight after the transfer is completed.',
      'Unsupported wallet transfers, exchange transactions, liquidity-pool interactions, or cross-chain movements should not be assumed to transfer program redemption rights automatically.',
    ],
  },
  {
    question: 'Are monthly rewards subject to a new lock-up?',
    paragraphs: [
      'Finalized BTCvc rewards do not receive an additional three-month principal lock-up when they are distributed.',
      'Distributed rewards may be submitted for redemption, subject to eligibility, applicable fees, and normal processing times.',
      'Rewards that remain in an eligible balance begin contributing to future reward weight from the time they are credited. Accrued but undistributed rewards do not compound.',
    ],
  },
  {
    question: 'How do I redeem my BTC?',
    paragraphs: [
      'Once your principal has unlocked, you may submit a redemption request through the Redeem tab. Eligible distributed rewards may also be included without an additional three-month lock-up.',
      'Before submission, the interface shows the eligible amount, applicable fees, Bitcoin receiving address, and estimated net BTC proceeds.',
      'Accepted requests are generally processed within 3–5 business days, subject to the program’s processing conditions.',
      'Amounts committed to an accepted redemption request stop accumulating new reward weight. Previously accumulated reward entitlement is retained for monthly reconciliation.',
    ],
  },
  {
    question: 'Are returns guaranteed, and what risks should I consider?',
    paragraphs: [
      'No. The target APY is indicative, denominated in BTC, and not guaranteed. Actual rewards depend on distributable net returns and may be lower than the target or zero.',
      '“Net of strategy fees” does not mean that every possible fee is included. Any additional applicable minting, redemption, or network fees are shown before you confirm the relevant transaction.',
      'Execution controls do not eliminate market, counterparty, custody, liquidity, smart-contract, or operational risks. Losses or redemption delays may occur.',
      'Review the applicable product terms, fee information, and risk disclosures before participating.',
    ],
  },
];

const installations = new WeakMap();
let faqInstance = 0;

/** Mounts beside the hidden original list, preserving React's nodes and section. */
export function installBTCvcFAQ(main) {
  if (!main || typeof main.querySelector !== 'function') return () => {};
  const section = main.querySelector('.faq-section');
  const originalList = section?.querySelector('.faq-list:not([data-btcvc-product-faq])');
  if (!section || !originalList) return () => {};
  if (installations.has(originalList)) return installations.get(originalList);

  const originallyHidden = originalList.hidden;
  const originalAriaHidden = originalList.getAttribute('aria-hidden');
  const hadOriginalClass = originalList.classList.contains('btcvc-product-faq-original');
  const instance = `btcvc-product-faq-${++faqInstance}`;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Map();
  const handlers = [];
  const rows = [];
  let destroyed = false;
  const hadSectionClass = section.classList.contains('btcvc-product-faq-section');
  section.classList.add('btcvc-product-faq-section');
  originalList.classList.add('btcvc-product-faq-original');
  originalList.hidden = true;
  originalList.setAttribute('aria-hidden', 'true');
  const list = document.createElement('div');
  list.className = 'faq-list btcvc-product-faq-list';
  list.dataset.btcvcProposalFaq = 'installed';
  originalList.after(list);

  for (const [index, item] of FAQ_ITEMS.entries()) {
    const article = document.createElement('article');
    article.className = 'btcvc-product-faq-item';
    article.dataset.btcvcProposalFaqItem = String(index + 1);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btcvc-product-faq-button';
    button.id = `${instance}-question-${index + 1}`;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', `${instance}-answer-${index + 1}`);
    const number = document.createElement('span');
    number.className = 'btcvc-product-faq-number';
    number.textContent = String(index + 1).padStart(2, '0');
    number.setAttribute('aria-hidden', 'true');
    const question = document.createElement('b');
    question.className = 'btcvc-product-faq-question';
    question.textContent = item.question;
    const icon = document.createElement('i');
    icon.className = 'btcvc-product-faq-icon';
    icon.textContent = '+';
    icon.setAttribute('aria-hidden', 'true');
    button.append(number, question, icon);

    // A direct article > p keeps the existing FAQ typography and spacing rules.
    const answer = document.createElement('p');
    answer.className = 'btcvc-product-faq-answer';
    answer.id = `${instance}-answer-${index + 1}`;
    answer.setAttribute('aria-labelledby', button.id);
    answer.setAttribute('aria-hidden', 'true');
    answer.hidden = true;
    for (const paragraph of item.paragraphs) {
      const block = document.createElement('span');
      block.className = 'btcvc-product-faq-paragraph';
      block.textContent = paragraph;
      answer.appendChild(block);
    }
    article.append(button, answer);
    list.appendChild(article);
    rows.push({ article, button, answer, icon });
  }

  function settle(row, open) {
    row.answer.style.height = '';
    row.answer.style.marginBottom = '';
    row.answer.style.opacity = '';
    row.answer.hidden = !open;
  }

  function setExpanded(row, open) {
    const running = animations.get(row.answer);
    const startHeight = row.answer.hidden ? 0 : row.answer.getBoundingClientRect().height;
    const startMargin = row.answer.hidden ? 0 : parseFloat(getComputedStyle(row.answer).marginBottom) || 0;
    if (running) {
      running.cancel();
      animations.delete(row.answer);
    }
    row.button.setAttribute('aria-expanded', String(open));
    row.answer.setAttribute('aria-hidden', String(!open));
    row.article.classList.toggle('open', open);
    row.article.classList.toggle('btcvc-product-faq-open', open);
    row.icon.textContent = open ? '−' : '+';
    row.answer.hidden = false;

    if (motion.matches || typeof row.answer.animate !== 'function') {
      settle(row, open);
      return;
    }

    row.answer.style.height = '';
    row.answer.style.marginBottom = '';
    const endHeight = open ? row.answer.scrollHeight : 0;
    const endMargin = open ? parseFloat(getComputedStyle(row.answer).marginBottom) || 0 : 0;
    const animation = row.answer.animate([
      { height: `${startHeight}px`, marginBottom: `${startMargin}px`, opacity: startHeight ? 1 : 0 },
      { height: `${endHeight}px`, marginBottom: `${endMargin}px`, opacity: open ? 1 : 0 },
    ], { duration: 260, easing: 'cubic-bezier(.22,.7,.2,1)', fill: 'forwards' });
    animations.set(row.answer, animation);
    animation.onfinish = () => {
      if (destroyed || animations.get(row.answer) !== animation) return;
      animations.delete(row.answer);
      settle(row, open);
      animation.cancel();
    };
  }

  for (const row of rows) {
    const click = () => setExpanded(row, row.button.getAttribute('aria-expanded') !== 'true');
    row.button.addEventListener('click', click);
    handlers.push(() => row.button.removeEventListener('click', click));
  }

  const onMotion = () => {
    if (!motion.matches) return;
    for (const row of rows) {
      animations.get(row.answer)?.cancel();
      settle(row, row.button.getAttribute('aria-expanded') === 'true');
    }
    animations.clear();
  };
  motion.addEventListener('change', onMotion);

  const cleanup = () => {
    if (destroyed) return;
    destroyed = true;
    animations.forEach(animation => animation.cancel());
    animations.clear();
    handlers.forEach(remove => remove());
    motion.removeEventListener('change', onMotion);
    list.remove();
    originalList.hidden = originallyHidden;
    if (originalAriaHidden === null) originalList.removeAttribute('aria-hidden');
    else originalList.setAttribute('aria-hidden', originalAriaHidden);
    if (!hadOriginalClass) originalList.classList.remove('btcvc-product-faq-original');
    if (!hadSectionClass) section.classList.remove('btcvc-product-faq-section');
    installations.delete(originalList);
  };
  installations.set(originalList, cleanup);
  return cleanup;
}
