var WTM = {
    defaults: {
        proximity_radius: 5000,
        proximity_sound_file: chrome.extension.getURL('chirp.ogg'),
        alert_volume: 0.01,
        plane_icon_size: 25
    },
    settings: {},
    update: function() {
        $.each(WTM.defaults, function(key, value) {
            var result = localStorage[key] || value;
            if (typeof value === 'number') {
                result = parseFloat(result, 10);
            }
            WTM.settings[key] = result;
        });
    }   
};

WTM.update();