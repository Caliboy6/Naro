/* Official VETA pixels in an SVG viewport. A browser luminance filter removes
   the supplied dark field while retaining the original symbol and lettering. */
let logoId = 0;
export function vetaLogo({ markOnly = false, decorative = false } = {}) {
 const id=`veta-source-${++logoId}`;
 return `<svg class="${markOnly ? 'veta-mark' : 'veta-logo'}" viewBox="${markOnly ? '35 13 38 42' : '34 13 148 42'}" ${decorative ? 'aria-hidden="true"' : 'role="img" aria-label="VETA"'} xmlns="http://www.w3.org/2000/svg"><defs><filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 .638 2.146 .216 0 -1"/></filter></defs><image href="/assets/veta-supplied.png" width="225" height="66" filter="url(#${id})"/></svg>`;
}

export function installPartnerBrands(scope = document) {
 scope.querySelectorAll('.stack-icon.ciara-icon').forEach(el => {
  el.classList.add('partner-brand');
  el.innerHTML='<img class="ciara-mark" src="/assets/ciara-mark.svg" alt="Ciara">';
 });
 scope.querySelectorAll('.stack-icon.veta-icon').forEach(el => {
  el.classList.add('partner-brand');
  el.innerHTML=vetaLogo();
 });
 scope.querySelectorAll('.verified-chip,.vd-verified').forEach(el => {
  el.innerHTML=vetaLogo({markOnly:true,decorative:true})+'<span>VETA VERIFIED</span>';
  el.setAttribute('aria-label','VETA VERIFIED');
 });
 const control=scope.querySelector('.metric-rail > div:nth-child(3) > strong');
 if(control)control.innerHTML=vetaLogo();
}
