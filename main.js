var baseUrl = 'http://localhost:8111/';
$.get(baseUrl, function(data) {
    var chirp = $('<audio>').attr('src', WTM.settings['proximity_sound_file'])[0];
    chirp.volume = WTM.settings.alert_volume;
    
    var _title = document.title;

    $(document.body).html(data.replace('<head>', '<head><base href="' + baseUrl + '">'));

    $('<link rel="stylesheet" type="text/css">')
            .attr('href', chrome.extension.getURL('main.css')).appendTo($('head'));

    $('script:not([src])').each(function() {
        eval($(this).text());
    });

    var _player;

    function _rel(a, b, canvas) {
        return a * canvas.width * map_scale + map_pan[b];
    }

    var _draw_player = draw_player;
    draw_player = function(canvas, ctx, item, dt) {

        // Draw proximity radius circle
        if (map_info) {
            var x = item['x'];
            var y = item['y'];

            var sx = _rel(x, 0, canvas);
            var sy = _rel(y, 1, canvas);
        
            var map_min = map_info['map_min'];
            var map_max = map_info['map_max'];
            var m_in_px = canvas.width / (map_max[0] - map_min[0]);

            ctx.beginPath();
            ctx.arc(sx, sy, WTM.settings['proximity_radius'] * m_in_px * map_scale, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, .25)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.closePath();
        }

        return _draw_player.apply(this, arguments);
    };

    var _draw_map_object = draw_map_object;
    draw_map_object = function(canvas, ctx, item) {

        var x = item['x'];
        var y = item['y'];

        var sx = _rel(x, 0, canvas);
        var sy = _rel(y, 1, canvas);

        if (item['type'] === 'aircraft') {
            ctx.save();
            ctx.translate(sx, sy);
            var dir = Math.atan2(item['dx'], -item['dy']);
            ctx.rotate(dir);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = calcMapObjectColor(item);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#000';
            var font_size = WTM.settings['plane_icon_size'];
            var text;
            var icon = item['icon'];
            if (icon === 'Fighter') {
                font_size -= 2;
                text = 'a';
            } else if (icon === 'Bomber') {
                font_size += 2;
                text = 'b';
            } else if (icon === 'Assault') {
                font_size -= 1;
                text = 'c';
            }
            ctx.font = font_size + "px plane_icons";
            ctx.fillText(text, 0, 0);
            ctx.strokeText(text, 0, 0);
            ctx.restore();
        } else {
            var results = _draw_map_object.apply(this, arguments);
            return results;
        }
    };

    var _type_priority = {
        'aircraft': 3,
        'ground_model': 2,
        'airfield': 1
    };
    
    
    var last_proximate_enemies = 0;
    
    var _update_object_positions = update_object_positions;
    update_object_positions = function(objects) {
        _player = null;
        
        objects.sort(function(a, b) {
            if (a['icon'] === 'Player') {
                _player = a;
            }
            // Put aircrafts at the end so they are drawn last
            return (_type_priority[a['type']] || 0) > (_type_priority[b['type']] || 0);
        });
        if (map_info && _player) {
            var proximate_enemies = 0;
            var min_distance = null;
            var friendlies = 0;
            $.each(objects, function(i, item) {
                if (item['type'] !== 'aircraft' || item['icon'] === 'Player') {
                    return;
                }
                var color = item['color[]'];
                if (color[0] < color[2]) {
                    // Skip friendlies
                    friendlies += 1;
                    return;
                }

                var x = item['x'];
                var y = item['y'];

                var map_min = map_info['map_min'];
                var map_max = map_info['map_max'];
                var map_x = (map_max[0] - map_min[0]);
                var map_y = (map_max[1] - map_min[1]);

                var distance_x = Math.abs(x - _player['x']) * map_x;
                var distance_y = Math.abs(y - _player['y']) * map_y;

                var distance = Math.sqrt(Math.pow(distance_x, 2) + Math.pow(distance_y, 2));
                
                if (min_distance === null) {
                    min_distance = distance;
                } else {
                    min_distance = Math.min(distance, min_distance);
                }

                if (distance < WTM.settings.proximity_radius) {
                    proximate_enemies += 1;
                }
            });
            if (proximate_enemies > last_proximate_enemies) {
                chirp.play();
            }
            var title_info = [];
            if (proximate_enemies) {
                title_info.push('E:' + proximate_enemies);
            }
            if (min_distance !== null) {
                title_info.push(' > ' + (min_distance / 1000).toFixed(2) + ' km');
            }
            title_info.push('F:' + friendlies);
            
            document.title = '(' + title_info.join(' ') + ') ' + _title;
            
            last_proximate_enemies = proximate_enemies;
        }   
        _update_object_positions.apply(this, arguments);
    };

//    var _ = ;
//     = function() {
//        var results = _.apply(this, arguments);
//        return results;
//    };

    var $scripts = $('script[src][async]');
    var scriptsLoaded = 0;
    $scripts.load(function() {
        scriptsLoaded += 1;
        if (scriptsLoaded === $scripts.length) {
            init();
        }
    });
}).fail(function() {
    $('body').html('<p>Failed to open <a href="' + baseUrl + '">' + baseUrl + '</a>'
            + '</p><p><a href="">Refresh</a> this page to try again.</p>');
});