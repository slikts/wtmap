$.get(WTM.settings.base_url, function(data) {
    var sound_file = WTM.settings['proximity_sound_file'];
    var volume = WTM.settings.alert_volume;
    function play_sound() {
        WTM.play_sound(sound_file, volume);
    }

    var _title = document.title;

    var $wtm_scripts = $('script');

    $(document.body).html(data
            .replace('<head>', '<head><base href="' + WTM.settings.base_url + '">')
            .replace(/\ssrc="/g, ' data-src="'));

    var loaded_scripts = 0;
    var scripts = [];
    var $scripts = $('script').not($wtm_scripts);
    var $eval = $([]);
    $scripts.each(function() {
        var $this = $(this);
        var src = $this.data('src');
        if (!src) {
            scripts.push($this.text());
            loaded_scripts += 1;
            $eval = $eval.add($this);
            return;
        }
        scripts.push(src);
    });

    $scripts.not($eval).each(function() {
        var $this = $(this);
        var src = $this.data('src');

        $.get(src, function(data) {
            loaded_scripts += 1;
            scripts[scripts.indexOf(src)] = data;
            if (loaded_scripts === scripts.length) {
                $.each(scripts, function(i, item) {
                    eval(item);
                });
                main();
            }
        });
    });


    function main() {

        var _player;

        function center_view(x, y, c_width, c_height) {
            map_pan[0] = -(x * c_width * map_scale) + c_width / 2;
            map_pan[1] = -(y * c_width * map_scale) + c_height / 2;
        }

        function _rel(a, b, c) {
            return a * c * map_scale + map_pan[b];
        }

        var _draw_player = draw_player;
        draw_player = function(canvas, ctx, item, dt) {

            // Draw proximity radius circle
            if (map_info) {
                var x = item['x'];
                var y = item['y'];

                var c_width = canvas.width;
                var c_height = canvas.width;


                if (!isDraggingMap && WTM.settings['map_center']) {
                    center_view(x, y, c_width, c_height);
                }

                var sx = _rel(x, 0, c_width);
                var sy = _rel(y, 1, c_height);
                var map_width_km = map_info['map_max'][0] - map_info['map_min'][0];

                ctx.beginPath();
                ctx.arc(sx, sy, WTM.settings['proximity_radius'] * canvas.width / map_width_km * map_scale, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 255, 255, .25)';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.closePath();

            }

            return _draw_player.apply(this, arguments);
        };

        var _draw_map_object = draw_map_object;
        var icon_texts = {
            'Fighter': 'a',
            'Bomber': 'b',
            'Assault': 'c'
        };

        draw_map_object = function(canvas, ctx, item) {

            var x = item['x'];
            var y = item['y'];

            var sx = _rel(x, 0, canvas.width);
            var sy = _rel(y, 1, canvas.height);

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

                var text = icon_texts[item['icon']];
                var font_size = WTM.settings['plane_icon_size'] * WTM.icons[text];

                ctx.font = font_size + "px plane_icons";
                ctx.fillText(text, 0, 0);
                ctx.strokeText(text, 0, 0);
                ctx.restore();
            } else {
                _draw_map_object.apply(this, arguments);
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
                    play_sound();
                }
                var title_info = [];
                if (proximate_enemies) {
                    title_info.push('E:' + proximate_enemies);
                }
                if (min_distance !== null) {
                    var _units = WTM.settings.units === 'meters' ? 'km' : 'mi';
                    var _min_distance = (WTM.m2x(min_distance, _units)).toFixed(2);
                    title_info.push(' > ' + _min_distance + ' ' + _units);
                }
                title_info.push('F:' + friendlies);

                document.title = '(' + title_info.join(' ') + ') ' + _title;

                last_proximate_enemies = proximate_enemies;
            }
            _update_object_positions.apply(this, arguments);
        };

        var _update_map_info = update_map_info;
        update_map_info = function(info) {
            var auto_scale = WTM.settings['map_center'];
            var prevMapGen, newMapGen;

            if (auto_scale) {
                prevMapGen = (map_info && ('map_generation' in map_info)) ? map_info['map_generation'] : -1;
                newMapGen = (info && ('map_generation' in info)) ? info['map_generation'] : -1;
            }

            _update_map_info.apply(this, arguments);

            if (auto_scale && prevMapGen != newMapGen) {
                var canvas = document.getElementById('map-canvas');
                var map_width_km = map_info['map_max'][0] - map_info['map_min'][0];

                map_scale = WTM.m2x(map_width_km * WTM.settings['map_scale'] / canvas.width, 'nmi');
            }
        };

        //    var _ = ;
        //     = function() {
        //        var results = _.apply(this, arguments);
        //        return results;
        //    };

        init();
    }
}).fail(function() {
    window.location.href = 'error.html';
});