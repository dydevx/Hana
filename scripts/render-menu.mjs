import { escapeHTML as e, money } from '../assets/js/core.js';

const dishImages = new Set([
 'hana-16','hana-17','hana-213','hana-214','hana-216',
 'hana-230','hana-231','hana-232','hana-233',
 'hana-242','hana-243','hana-245','hana-248','hana-249',
 'hana-260','hana-263','hana-265','hana-266','hana-267','hana-270',
 'hana-280','hana-283','hana-284','hana-285',
 'hana-330','hana-332','hana-333','hana-335','hana-336','hana-338','hana-339','hana-340'
]);
export function renderMenuNavigation(menu) {
 const count=items=>new Set(items.map(i=>i.group||i.id)).size;
 return `<nav class="categories" aria-labelledby="menu-nav-title"><a href="#menu-results" data-menu-category="all"><span>Alle Kategorien</span><small>${count(menu.categories.flatMap(c=>c.items))}</small></a>${menu.categories.map(cat=>`<a href="#category-${e(cat.id)}" data-menu-category="${e(cat.id)}"><span>${e(cat.name)}</span><small>${count(cat.items)}</small></a>`).join('')}</nav>`;
}
export function renderMenuTools() {
 return `<div class="menu-tools"><label class="search"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><span class="sr-only">Gericht suchen</span><input id="dish-search" type="search" placeholder="Gericht suchen…" autocomplete="off"></label><div class="filters" aria-label="Gerichte filtern"><button data-filter="all" aria-pressed="true">Alle</button><button data-filter="vegetarian" aria-pressed="false">Vegetarisch</button><button data-filter="vegan" aria-pressed="false">Vegan</button><button data-filter="spicy" aria-pressed="false">Scharf</button></div></div>`;
}
export function renderMenu(menu) {
 return menu.categories.map(cat => {
  const groups = new Map();
  for (const item of cat.items) { const key = item.group || item.id; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(item); }
  return `<section class="menu-category" id="category-${e(cat.id)}"><h3>${e(cat.name)}${cat.quantityLabel?` <small>${e(cat.quantityLabel)}</small>`:''}</h3><div class="dish-grid">${[...groups.values()].map(options => {
   const i = options[0];
   const photo=dishImages.has(i.id)?`<figure class="dish-media"><img src="assets/images/menu-items/${e(i.id)}.webp" alt="${e(i.name)} aus der HANA Speisekarte" loading="lazy" decoding="async"></figure>`:'';
   return `<article class="dish" data-item="${e(i.id)}" data-options="${e(options.map(o=>o.id).join(' '))}" data-category="${e(cat.id)}" data-search="${e(options.map(o=>[o.number,o.name,o.description,o.variant].join(' ')).join(' ').toLocaleLowerCase('de'))}" data-vegetarian="${options.some(o=>o.vegetarian)}" data-vegan="${options.some(o=>o.vegan)}" data-spicy="${options.some(o=>o.spicy)}"><div class="dish-copy"><div class="dish-topline"><span data-dish-number>${e(i.number)}</span><strong data-dish-price>${money(i.priceCents)}</strong></div>${photo}<h4>${e(i.name)}</h4><p data-dish-description>${e(i.description)}</p><span class="dish-tags" data-dish-tags>${[i.quantityLabel,i.vegan?'Vegan':i.vegetarian?'Vegetarisch':'',i.spicy?'Scharf':''].filter(Boolean).map(e).join(' · ')}</span>${options.length>1?`<label class="variant-label" for="variant-${e(i.group)}">Wahlweise mit<select id="variant-${e(i.group)}" data-variant>${options.map(o=>`<option value="${e(o.id)}" data-item="${e(o.id)}">${e(o.variant)} · ${money(o.priceCents)}</option>`).join('')}</select></label>`:''}${i.choices?`<p class="small">Geschmackswunsch bitte bei den Bestellhinweisen angeben.</p>`:''}<details class="dish-details" ${!itemMeta(i)?'hidden':''}><summary>Allergene &amp; Hinweise</summary><p class="dish-meta" data-dish-meta>${itemMeta(i)}</p></details></div><div class="dish-action"><button class="button" data-add="${e(i.id)}" aria-label="${e(i.name)}${i.variant?' mit '+e(i.variant):''} hinzufügen"><span data-dish-count></span><span>In den Warenkorb</span></button></div></article>`;
  }).join('')}</div></section>`;
 }).join('');
}
export function itemMeta(i) {
 return [i.allergens?.length?'Allergene (Flyer): '+i.allergens.join(', '):'',i.additives?.length?'Zusatzstoffe: '+i.additives.join(', '):''].filter(Boolean).map(e).join(' · ');
}
