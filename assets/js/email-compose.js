export function emailPlatform({ userAgent = '', platform = '', maxTouchPoints = 0 } = {}) {
 if (/iPhone|iPad|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)) return 'ios';
 if (/Android/i.test(userAgent)) return 'android';
 return 'desktop';
}

export function emailComposeLinks(to, subject, body, platform = 'desktop') {
 const query = `to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
 const mail = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
 const web = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
 let gmail = web;
 if (platform === 'ios') gmail = `googlegmail:///co?${query}`;
 if (platform === 'android') gmail = `intent:${mail.slice('mailto:'.length)}#Intent;scheme=mailto;action=android.intent.action.SENDTO;package=com.google.android.gm;S.browser_fallback_url=${encodeURIComponent(web)};end`;
 return { mail, gmail, web };
}
