var s = document.createElement('script');
if (window.location.host.endsWith('williamhill.com') || window.location.host.endsWith('sportsbook.caesars.com') || window.location.host.endsWith('sportsbook.draftkings.com')) {
    s.src = chrome.runtime.getURL('inject_fetch.js');
}
else if (window.location.host.endsWith('betway.com')) {
    s.src = chrome.runtime.getURL('inject_xhr.js');
}
s.onload = function () {
    //this.remove();
};
(document.head || document.documentElement).appendChild(s);
