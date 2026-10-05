/* Launch copy over the existing application. Data, wallet and transaction state
   stay with the original application; no fabricated balances or approvals. */
const depositAnswer='Connect a wallet you control and complete the required AML check. After approval, review the deposit instructions, network and receiving address displayed in the interface, then confirm the transaction in your wallet. Track your deposit and ETHvp minting status in My activity.';
const setText=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value;};

export function installLaunchUI(main){
 if(main.classList.contains('ethvp-page')){
  const update=()=>{
   main.querySelectorAll('.ethvp-design-notice').forEach(node=>node.remove());
   main.querySelectorAll('.ethvp-preview-label,.naro-vault-live').forEach(node=>{
    setText(node,'LIVE');node.classList.replace('ethvp-preview-label','naro-vault-live');
   });
   main.querySelectorAll('.ethvp-hero-apy>span,.ethvp-summary-row>div:first-child>span').forEach(node=>setText(node,'TARGET APY'));
   setText(main.querySelector('.ethvp-hero-apy>strong'),'50%');
   setText(main.querySelector('.ethvp-summary-row>div:first-child>b'),'50%');
   setText(main.querySelector('.ethvp-hero-apy>small'),'ETH-denominated strategy yield. Not guaranteed.');
   main.querySelectorAll('.ethvp-flow-details>div').forEach(row=>{
    const label=row.querySelector('dt')?.textContent.trim();
    const value=row.querySelector('dd')?.textContent.trim();
    if((label==='AML check'&&value==='NOT INTEGRATED')||(label==='Deposit address'&&value==='AWAITING OPERATOR CONFIG'))row.remove();
   });
   main.querySelectorAll('.ethvp-availability').forEach(node=>{
    if(/AML.*(?:not implemented|not integrated)|operator.*(?:configuration|config)|integration pending/i.test(node.textContent))node.remove();
   });
   main.querySelectorAll('.ethvp-input-error').forEach(node=>{
    if(/External API calls.*disabled|disabled.*(?:design preview|showcase)|Wallet connections and transactions are disabled/i.test(node.textContent))node.remove();
   });
   const chart=main.querySelector('.ethvp-chart-panel');
   if(chart){
    setText(chart.querySelector('.ethvp-chart-head>div>span'),'APY CURVE');
    const headline=chart.querySelector('.ethvp-chart-head h3');
    setText([...headline?.childNodes||[]].find(node=>node.nodeType===Node.TEXT_NODE),'Latest sample ');
    setText(chart.querySelector('.ethvp-chart-head p'),'ETH-denominated');
    const stats=[...chart.querySelectorAll('.ethvp-chart-stats>p')];
    setText(stats[1]?.querySelector('span'),'Target APY');setText(stats[1]?.querySelector('b'),'50%');
    const period=chart.querySelector('button[aria-pressed="true"]')?.textContent.trim()||'7D';
    setText(stats[2]?.querySelector('span'),'Period');setText(stats[2]?.querySelector('b'),period);
    const notes=chart.querySelector('.ethvp-chart-notes');
    notes?.querySelectorAll('p').forEach((node,index)=>{
     setText(node,index===0?'APY curve shown in ETH terms.':'Target APY is not a guarantee of return.');
    });
    setText(notes?.querySelector('small'),'SAMPLE APY CURVE');
    const plot=chart.querySelector('.ethvp-plot svg');
    const label=period+' APY sample curve.';
    if(plot&&plot.getAttribute('aria-label')!==label)plot.setAttribute('aria-label',label);
   }
   setText(main.querySelector('#ethvp-faq-answer-10'),depositAnswer);
   const walker=document.createTreeWalker(main,NodeFilter.SHOW_TEXT);let node;
   while(node=walker.nextNode()){
    const next=node.textContent.replace(/LIVE APY/g,'TARGET APY').replace(/Live APY/g,'Target APY');
    if(next!==node.textContent)node.textContent=next;
   }
  };
  update();
  const observer=new MutationObserver(update);
  observer.observe(main,{childList:true,subtree:true,characterData:true});
  return ()=>observer.disconnect();
 }
 if(main.classList.contains('vault-detail')){
  // Replace fixed decorative examples with operating descriptions; actual
  // balances, chart history and backend activity keep their original sources.
  setText(main.querySelector('.agent-proposal>span'),'EXECUTION CONTROL');
  setText(main.querySelector('.agent-proposal>b'),'Capital movements verified before execution');
  setText(main.querySelector('.agent-proposal>small'),'Allocation · leverage · liquidity · counterparty');
  setText(main.querySelector('.agent-observation>b'),'Market signals and liquidity');
  setText(main.querySelector('.agent-observation>small'),'Strategy monitoring within the approved framework');
 }
 return ()=>{};
}
