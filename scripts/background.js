if (localStorage['welcome'] !== 'true') {
    chrome.tabs.create({ url: chrome.extension.getURL('options.html') });
    localStorage['welcome'] = 'true';
}