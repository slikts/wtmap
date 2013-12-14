var WTM = {
    defaults: {
        proximity_radius: 5000,
        proximity_sound_file: chrome.extension.getURL('sounds/chirp.ogg'),
        alert_volume: 0.15,
        plane_icon_size: 25,
        base_url: 'http://localhost:8111/'
    },
    settings: {},
    update: function() {
        var self = this;
        $.each(self.defaults, function(key, value) {
            var result = localStorage[key] || value;
            if (typeof value === 'number') {
                result = parseFloat(result, 10);
            } else {
                result = result.trim();
            }
            self.settings[key] = result;
        });

        this.settings.base_url = self.settings.base_url.replace(/\/+$/, '') + '/';
    },
    icons: {
        a: 0.92,
        b: 1.08,
        c: 0.96
    }
};

WTM.update();