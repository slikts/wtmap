//window.location.href = chrome.extension.getURL('index.html');
//<meta http-equiv="refresh" content="5; url=http://example.com/">
//$('<meta http-equiv="refresh">').attr('content', "1; url=" + chrome.extension.getURL('index.html')).appendTo($('head'));
//$('<a>asd</a>').attr('href', chrome.extension.getURL('index.html')).appendTo(document.body).css({
//    position: 'absolute',
//    zIndex: 100
//}).click(function() {
////chrome.browserAction.onClicked.addListener(function(activeTab)
////{
////    var newURL = "http://www.youtube.com/watch?v=oHg5SJYRHA0";
//    chrome.tabs.create({ url: chrome.extension.getURL('index.html') });
////});
//    return false;
//}).text(chrome.i18n.getMessage('extName'));

console.log(123)
$('body').html('')