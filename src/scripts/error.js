$('#link').attr('href', WTM.settings.base_url).text(WTM.settings.base_url);


chrome.permissions.contains({origins: [WTM.settings.base_url]},
function(contains) {
    if (!contains) {
        $('#err1').hide();
        $('#err2').show();
    }
});
$('#request').click(function() {
    chrome.permissions.request({origins: [WTM.settings.base_url]},
    function(contains) {
        if (contains) {
            window.location.href = 'index.html';
        }
    });
});