var url = chrome.extension.getURL('index.html');
var $redirect = $('<div id="wtm-redirect">')
        .html('Copy and paste <input type="text" readonly="readonly"> to the address bar to use the WT map extension')
        .css({
            'position': 'fixed',
            'top': '0',
            'left': '0',
            'background': '#fff',
            'color': '#999',
            'padding': '0 5px',
            'width': '100%',
            'text-align': 'center'
        })
        .appendTo('body');
$redirect.find('input')
        .attr('size', url.length)
        .val(url)
        .click(function() {
            $(this).select();
        });
$('body').css({
    'position': 'relative',
    'top': $redirect.height() + 'px'
});