// Canonical DuoFit characters. Compose decorations around them; never redraw identity.
// Shared by the real app and component gallery. No records, storage or network calls.
window.DuoFitMascots = (() => {
  const sources = Object.freeze({
    today: Object.freeze({hus:'assets/login/hus-running.webp',wife:'assets/login/wife-running.webp'}),
    diet: Object.freeze({hus:'assets/mood/hus-meal.webp',wife:'assets/mood/wife-meal.webp'}),
    record: 'assets/meal-art/record-couple-v1.webp?v=meal1'
  });
  const heart = '<svg class="ui-icon sm mascot-heart" viewBox="0 0 24 24" aria-hidden="true"><use href="#ic-heart"/></svg>';
  function render(kind,person,base='') {
    if (!['today','diet','record'].includes(kind) || !['hus','wife'].includes(person)) throw new Error('Unknown mascot variant');
    const src = base + (kind==='record'?sources.record:sources[kind][person]);
    const size = kind==='record'?[184,112]:[128,128];
    const image = `<img src="${src}" width="${size[0]}" height="${size[1]}" alt="" loading="lazy" decoding="async">`;
    return `<span class="ds-mascot-group ${kind}-art" data-mascot="${kind}" aria-hidden="true">${kind==='today'?'<span class="mascot-copy">好好吃饭<br>就是爱自己</span>':''}${image}<span class="mascot-decoration">${heart}${kind==='record'?heart+heart:''}</span></span>`;
  }
  return Object.freeze({sources,render});
})();
