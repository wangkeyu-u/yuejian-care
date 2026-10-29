'use strict';
(() => {
 const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const animate=(node,frames,duration=200)=>{if(!node?.animate||reduced())return;node.getAnimations().forEach(a=>a.cancel());node.animate(frames,{duration,easing:'cubic-bezier(.22,1,.36,1)'});};
 // Month movement follows the arrow; changing records never replays the calendar.
 document.addEventListener('click',event=>{const control=event.target.closest('#month-prev,#month-next,#month-today');if(!control)return;const direction=control.id==='month-prev'?-1:control.id==='month-next'?1:0;animate(document.querySelector('#calendar-grid'),[{opacity:.55,transform:`translateX(${direction*10}px)`},{opacity:1,transform:'translateX(0)'}]);});
 document.addEventListener('toggle',event=>{if(event.target.tagName!=='DETAILS'||!event.target.open||!event.target.matches('.evidence-detail,.analysis-block'))return;for(const child of event.target.children)if(child.tagName!=='SUMMARY')animate(child,[{opacity:.4,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],180);},true);
})();
