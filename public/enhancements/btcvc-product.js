import { installBTCvcFAQ } from './btcvc-product-faq.js';

const vetaDescription='Veta verifies in-scope capital movements against configured constraints before execution.';
const verificationHint='Verification of configured execution constraints; not a guarantee of returns or capital protection.';
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const setText=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value;};
const isBTCvc=()=>/^\/btcvc\/?$/.test(location.pathname);
let main,dialog,pending,faqCleanup;
const contexts=()=>window.naroBTCvcContexts||{};
const signature=data=>JSON.stringify([data.mode,data.amount,data.bitcoinAddress,data.receivingAddress,data.network,data.chainId,data.bitcoinConnected,data.evmConnected]);

function installChart(){
 const card=main.querySelector('.vault-data-column > .bg-panel');if(!card)return;
 card.classList.add('btcvc-product-restored-chart');
 const head=card.querySelector(':scope > div:first-child');
 setText(head?.querySelector(':scope > div:first-child > span'),'Cumulative Net Return');
 setText(card.querySelector(':scope > div:last-of-type'),'Net return (%)');
 card.querySelector('svg')?.setAttribute('aria-label','Cumulative net return · existing series');
 if(!card.querySelector('.btcvc-product-series-note')){
  const tag=document.createElement('span');tag.className='btcvc-product-series-tag';tag.textContent='REFERENCE SERIES';head?.querySelector(':scope > div:first-child')?.append(tag);
  const note=document.createElement('p');note.className='btcvc-product-series-note';note.textContent='From 1 Jan 2026 · Existing cumulative series; rewards and reinvestment are not separately itemized.';card.append(note);
 }
 head?.querySelectorAll(':scope > div:last-child > span').forEach(button=>{
  button.setAttribute('role','button');button.setAttribute('tabindex','0');button.setAttribute('aria-pressed',String(button.classList.contains('bg-accent')));
  if(!button.dataset.btcvcKeyboard){button.dataset.btcvcKeyboard='true';button.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();button.click();}});}
 });
}

function updateCopy(){
 const reward=main.querySelector('.mandate-grid > article:nth-child(2)');
 setText(reward?.querySelector('h3'),'Monthly BTCvc distributions');
 setText(reward?.querySelector('p'),'Rewards are allocated based on eligible balance and holding time, and paid through separate BTCvc transfers—not token rebasing.');
 const control=main.querySelector('.mandate-status');
 if(control){control.classList.add('btcvc-product-control');control.dataset.control='unavailable';setText([...control.querySelector('h3')?.childNodes||[]].find(n=>n.nodeType===3),' Status unavailable');setText(control.querySelector('p'),vetaDescription);}
 setText(main.querySelector('.agent-proposal > b'),vetaDescription);
 const monitor=main.querySelector('.coordinator-head small');
 if(monitor){monitor.classList.add('btcvc-product-monitor');setText([...monitor.childNodes].find(n=>n.nodeType===3),' Status unavailable');}
 const chain=main.querySelector('.agent-proposal p .approved');if(chain){chain.classList.add('btcvc-product-veta-step');setText(chain,'Veta');}
 main.querySelectorAll('.verified-chip').forEach(chip=>{chip.setAttribute('title',verificationHint);chip.setAttribute('tabindex','0');chip.setAttribute('aria-label',`VETA VERIFIED. ${verificationHint}`);});
 const footer=main.querySelector(':scope > footer');
 if(footer&&!footer.dataset.btcvcFooter){footer.dataset.btcvcFooter='true';const links=footer.querySelector(':scope > div');links.classList.add('btcvc-product-footer-links');links.innerHTML='<a href="/">Home</a><a href="/vaults">Vaults</a><a href="/#controls">Controls</a><a href="https://docs.vishwalab.com/" target="_blank" rel="noopener noreferrer">Documentation</a><a href="mailto:tech@vishwanetwork.xyz">Support</a>';}
}

function updateForm(){
 const card=main.querySelector('.vault-side > .bg-panel');if(!card)return;
 const redeem=!![...card.querySelectorAll(':scope > div')].find(node=>node.textContent.startsWith('Your BTCvc is returned'));
 card.dataset.btcvcMode=redeem?'redeem':'mint';
 const legacy=Array.from(card.children);
 legacy.forEach(node=>{
  if(node.textContent.startsWith('Deposits are sent from your connected wallet to custody')||node.textContent.startsWith('⚠️ Deposit through this interface'))node.style.setProperty('display','none','important');
 });
 let notice=card.querySelector('.btcvc-product-deposit-notice');
 if(!notice){notice=document.createElement('p');notice.className='btcvc-product-deposit-notice';notice.textContent='Use this interface to create your deposit transaction. Sending BTC to the custody address alone may not complete the minting process.';card.append(notice);}
 notice.hidden=redeem;
 let balances=card.querySelector('.btcvc-product-balances');
 if(!balances){balances=document.createElement('dl');balances.className='btcvc-product-balances';balances.innerHTML='<div><dt>Total BTCvc balance</dt><dd data-total>—</dd></div><div><dt>Locked principal</dt><dd>—</dd></div><div><dt>Eligible to redeem</dt><dd>—</dd></div><div><dt>Pending redemption</dt><dd>—</dd></div>';card.children[1]?.before(balances);}
 balances.hidden=!redeem;
 setText(balances.querySelector('[data-total]'),contexts().redeem?.evmConnected&&contexts().redeem?.totalBalance!=null?contexts().redeem.totalBalance:'—');
 card.querySelectorAll('input').forEach((input,index)=>input.setAttribute('aria-label',index===0?(redeem?'BTCvc amount':'BTC amount'):(redeem?'Estimated BTC':'Expected BTCvc')));
 const details=contexts()[redeem?'redeem':'mint'];
 const amountInput=card.querySelector('input:not([readonly])');
 amountInput?.setAttribute('aria-invalid','false');
 if(amountInput&&details?.totalBalance!=null&&redeem&&Number(amountInput.value)>Number(details.totalBalance)){amountInput.setAttribute('aria-invalid','true');showError('Amount exceeds your BTCvc wallet balance.');}
 else if(card.querySelector('.btcvc-product-form-error')?.dataset.balanceError==='true')card.querySelector('.btcvc-product-form-error').hidden=true;
}

function showError(message){
 const card=main?.querySelector('.vault-side > .bg-panel');if(!card)return;
 let error=card.querySelector('.btcvc-product-form-error');if(!error){error=document.createElement('p');error.className='btcvc-product-form-error';error.setAttribute('role','alert');card.append(error);}
 error.hidden=false;error.dataset.balanceError=String(message.includes('exceeds'));setText(error,message);
}

function finish(accepted){
 const active=pending;if(!active)return;
 pending=null;dialog?.close();dialog?.remove();dialog=null;active.resolve(accepted);
}

function review(data){
 if(!isBTCvc()||!main)return Promise.resolve(false);
 if(pending)finish(false);
 const amount=Number(data.amount),mint=data.mode==='mint';
 if(!Number.isFinite(amount)||amount<=0||(mint&&amount<0.0001)){showError(mint?'Enter at least 0.0001 BTC.':'Enter a positive BTCvc amount.');return Promise.resolve(false);}
 if(!data.bitcoinConnected||!data.evmConnected||!data.bitcoinAddress||!data.receivingAddress){showError('Connect your Bitcoin wallet and BTCvc receiving wallet before proceeding.');return Promise.resolve(false);}
 if(mint&&data.balanceSats!=null&&amount*1e8>Math.max(0,data.balanceSats-2000)){showError('Insufficient Bitcoin wallet balance including reserved network fees.');return Promise.resolve(false);}
 if(!mint&&data.totalBalance!=null&&amount>Number(data.totalBalance)){showError('Amount exceeds your BTCvc wallet balance.');return Promise.resolve(false);}
 const rows=mint?[
  ['BTC amount',`${amount.toFixed(8)} BTC`],['Receiving network',data.networkLabel],['Receiving address',data.receivingAddress],
  ['Expected BTCvc',`≈ ${amount.toFixed(8)} BTCvc`],['Fees','Bitcoin network fee (BTC): confirmed in your wallet and paid separately from the deposit. Mint fees are not separately itemized.'],
  ['Principal lock-up','3 calendar months'],['Estimated unlock time','Determined when minting completes.'],['Eligibility','KYB / KYC required']
 ]:[
  ['BTCvc amount',`${amount.toFixed(8)} BTCvc`],['Bitcoin receiving address',data.bitcoinAddress],
  ['Fees',`${data.networkLabel} network fee (${data.network==='pacific'?'PROS':'PHRS'}): confirmed and paid in your wallet. Redemption fees are not separately itemized.`],
  ['Estimated BTC',`≈ ${amount.toFixed(8)} BTC`],['Estimated processing time','3–5 business days after an eligible request is accepted']
 ];
 dialog=document.createElement('dialog');dialog.className='btcvc-product-dialog';dialog.setAttribute('aria-labelledby','btcvc-confirm-title');
 dialog.innerHTML=`<div class="btcvc-product-dialog-head"><span>${mint?'MINT':'REDEEM'} / REVIEW</span><button type="button" data-close aria-label="Close confirmation">×</button></div><h2 id="btcvc-confirm-title">${mint?'Review your mint.':'Review your redemption.'}</h2><p class="btcvc-product-dialog-intro">${mint?'Check the destination and principal conditions before signing.':'Check the amount and Bitcoin destination before submitting.'}</p><dl>${rows.map(([label,value])=>`<div><dt>${label}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>${mint?'':'<p class="btcvc-product-reward-note">Amounts committed to an accepted redemption request stop accumulating new reward weight. Previously accumulated reward entitlement is retained for monthly reconciliation.</p>'}<p class="btcvc-product-quote-notice">Conversion basis: ≈ 1:1. Review the final network fee in your wallet before signing.</p><div class="btcvc-product-dialog-actions"><button type="button" data-close>Back</button><button type="button" data-confirm>${mint?'Confirm mint':'Submit request'}</button></div>`;
 document.body.append(dialog);
 return new Promise(resolve=>{
  pending={resolve,data,signature:signature(data)};
  dialog.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>finish(false)));
  dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false);});
  dialog.querySelector('[data-confirm]').addEventListener('click',event=>{
   event.currentTarget.disabled=true;
   const current=contexts()[data.mode];
   if(!isBTCvc()||!current||signature(current)!==pending?.signature){finish(false);showError('Your wallet, network or amount changed. Review the transaction again.');return;}
   finish(true);
  });
  dialog.showModal();
 });
}

window.naroBTCvcReviewMint=review;window.naroBTCvcReviewRedemption=review;
window.addEventListener('naro:btcvc-wallet',event=>{
 if(pending&&event.detail.mode===pending.data.mode&&signature(event.detail)!==pending.signature){finish(false);showError('Your wallet, network or amount changed. Review the transaction again.');}
 if(isBTCvc()&&main)updateForm();
});
window.addEventListener('pagehide',()=>finish(false));

function mount(){
 if(!isBTCvc()){finish(false);if(main){faqCleanup?.();faqCleanup=null;main=null;}return;}
 const next=document.querySelector('main.vault-detail');if(!next)return;
 if(main!==next){finish(false);faqCleanup?.();main=next;main.classList.add('btcvc-product-page');faqCleanup=installBTCvcFAQ(main);}
 installChart();updateCopy();updateForm();
}
let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount();});}).observe(document.getElementById('root'),{childList:true,subtree:true,characterData:true});
mount();
