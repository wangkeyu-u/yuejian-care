(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else{root.MoonIcons=factory();root.MoonIcons.hydrate(root.document);}})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const paths={
    heart:'<path d="M20.5 5.8a5 5 0 0 0-7.1 0L12 7.2l-1.4-1.4a5 5 0 0 0-7.1 7.1L12 21l8.5-8.1a5 5 0 0 0 0-7.1Z"/>',
    moon:'<path d="M20.1 14.3A8.4 8.4 0 0 1 9.7 3.9a8.5 8.5 0 1 0 10.4 10.4Z"/><circle cx="18.5" cy="5.5" r="1" fill="currentColor" stroke="none"/>',
    calendar:'<rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M7.5 3v4M16.5 3v4M3.5 10h17M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01"/>',
    book:'<path d="M12 6c-2.6-1.7-5.6-2-9-1v15c3.4-1 6.4-.7 9 1 2.6-1.7 5.6-2 9-1V5c-3.4-1-6.4-.7-9 1Zm0 0v15"/>',
    settings:'<path d="M3 6h3m4 0h11M3 12h11m4 0h3M3 18h5m4 0h9"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>',
    arrowRight:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
    external:'<path d="M6 18 18 6M7 6h11v11"/>',
    chevronLeft:'<path d="m14.5 5.5-6.5 6.5 6.5 6.5"/>',
    chevronRight:'<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',
    down:'<path d="M12 4v15m-6-6 6 6 6-6"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    bookmark:'<path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-4-6 4Z"/>',
    bookmarkFilled:'<path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-4-6 4Z" fill="currentColor"/>',
    check:'<path d="m5 12 4.5 4.5L19 7"/>'
  };
  function icon(name){if(!Object.hasOwn(paths,name))return '';return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]}</svg>`;}
  function hydrate(scope){if(scope)for(const el of scope.querySelectorAll('[data-icon]'))el.innerHTML=icon(el.dataset.icon);}
  return {icon,hydrate};
});
