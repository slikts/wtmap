if (!localStorage['welcome']) {
    chrome.tabs.create({ url: chrome.extension.getURL('options.html') });
    localStorage['welcome'] = true;
}