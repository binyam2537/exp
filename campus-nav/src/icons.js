// Minimal stroke icons (24×24 grid). Usage: icon('search')
const P = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  swap: '<path d="M8 4v15M4.5 7.5L8 4l3.5 3.5M16 20V5M12.5 16.5L16 20l3.5-3.5"/>',
  locate: '<path d="M20.5 3.5L3.5 10.6l7 2.9 2.9 7z" fill="currentColor"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke-linejoin="round"/>',
  pause: '<path d="M8.5 5.5v13M15.5 5.5v13" stroke-width="3"/>',
  route: '<path d="M6 19V11a4 4 0 0 1 4-4h8"/><path d="M14.5 3.5L18 7l-3.5 3.5"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8" fill="currentColor" stroke="none"/><path d="M9 21l2.6-6.2L14 17v4M11.6 14.8l1-5.3-3 1.4L8 14M12.6 9.5l2.2 2.6 3 .9"/>',
  // categories
  classroom: '<path d="M2.5 9L12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v4.5c1.5 1.6 3.3 2.3 5.5 2.3s4-.7 5.5-2.3V11M21.5 9v5"/>',
  lab: '<path d="M9.5 3.5h5M10.5 3.5v5.5L5 18.5A1.6 1.6 0 0 0 6.4 21h11.2a1.6 1.6 0 0 0 1.4-2.5L13.5 9V3.5M7.5 14.5h9"/>',
  lecture: '<rect x="3.5" y="4" width="17" height="11" rx="1.8"/><path d="M12 15v5M8 20h8"/>',
  office: '<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8v1.7M3.5 12.5h17"/>',
  restroom: '<circle cx="7.5" cy="4.6" r="1.6" fill="currentColor" stroke="none"/><circle cx="16.5" cy="4.6" r="1.6" fill="currentColor" stroke="none"/><path d="M6 21v-6H4.8V9.5h5.4V15H9v6M15 21v-4.5h-2.6l2.2-7h3.8l2.2 7H18V21M12 3v18"/>',
  stairs: '<path d="M3.5 20h4.5v-4.5h4.5V11H17V6.5h3.5"/>',
  lift: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9.5 9.5L12 7l2.5 2.5M9.5 14.5L12 17l2.5-2.5"/>',
  // manoeuvres
  straight: '<path d="M12 21V4M6.5 9.5L12 4l5.5 5.5"/>',
  left: '<path d="M17 21v-7.5A4.5 4.5 0 0 0 12.5 9H5M9.5 4.5L5 9l4.5 4.5"/>',
  right: '<path d="M7 21v-7.5A4.5 4.5 0 0 1 11.5 9H19M14.5 4.5L19 9l-4.5 4.5"/>',
  'slight-left': '<path d="M15 21v-6.5L7.5 7M7.5 13V7h6"/>',
  'slight-right': '<path d="M9 21v-6.5L16.5 7M16.5 13V7h-6"/>',
  uturn: '<path d="M8 21V9a4.5 4.5 0 0 1 9 0v6M13.5 11.5L17 15l3.5-3.5"/>',
  arrive: '<path d="M12 21.5s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" fill="currentColor" stroke="none"/><circle cx="12" cy="10.5" r="2.4" fill="#fff" stroke="none"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
};

export function icon(name, cls = '') {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
}
