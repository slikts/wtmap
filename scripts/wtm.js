var WTM = {
    defaults: {
        proximity_radius: 5000,
        units: 'meters',
        alert_volume: 0.3,
        plane_icon_size: 25,
        base_url: 'http://localhost:8111/',
        map_center: 1,
        map_scale: 60,
        relative_alert_levels: 1
    },
    alert_sound: 'sounds/chirp',
    settings: {},
    update: function() {
        var settings = this.settings;
        $.each(this.defaults, function(key, value) {
            var result = localStorage[key] || value;
            if (typeof value === 'number') {
                result = parseFloat(result, 10);
            } else {
                result = result.trim();
            }
            settings[key] = result;
        });

        settings.base_url = settings.base_url.replace(/\/+$/, '') + '/';
        if (!/https?:\/\//.test(settings.base_url)) {
            settings.base_url = 'http://' + settings.base_url;
        }
    },
    icons: {
        a: 0.92,
        b: 1.08,
        c: 0.96
    },
    play_alert: function(level, volume) {
        level = level || 0;
        volume = volume || this.settings.alert_volume;
        var rel = WTM.settings.relative_alert_levels;
        if (rel) {
            volume = Math.min(1, volume + level * 0.035);
        } else {
            level = 0;
        }
        var url = chrome.extension.getURL(this.alert_sound + level + '.ogg');
        var audio = new Audio(url);
        audio.volume = volume;
        audio.play();
        if (rel) {
            window.setTimeout(function() {
                var audio = new Audio(url);
                var echo_volume = Math.max(0, volume  * level * 0.05 - Math.max(0, 0.15 - level * 0.05));
                if (!echo_volume) {
                    return;
                }
                audio.volume = echo_volume ;
                audio.play();
            }, 40 - level);
        }
    },
    conversion: {
        'meters': 1,
        'feet': 3.28084,
        'mi': 0.000621371,
        'km': 0.001,
        'nmi': 0.000539957
    },
    m2x: function(m, x) {
        return m * this.conversion[x];
    },
    x2m: function(m, x) {
        return m / this.conversion[x];
    }
};

WTM.update();