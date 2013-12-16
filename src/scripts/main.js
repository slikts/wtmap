$.get(WTM.settings.base_url, function(data) {
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

    var _map_width, _map_height;

    function get_distance(x1, y1, x2, y2) {
        var dx = Math.abs(x1 - x2) * _map_width;
        var dy = Math.abs(y1 - y2) * _map_height;

        return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    }

    var _canvas, _ctx;

    function _draw_text_icon(text, sx, sy, dir, color, font_size, font_face) {
        font_face = font_face || 'plane_icons';
        _ctx.save();
        _ctx.translate(sx, sy);
        _ctx.rotate(dir);
        _ctx.textAlign = 'center';
        _ctx.textBaseline = 'middle';
        _ctx.fillStyle = color;
        _ctx.lineWidth = 1;
        _ctx.strokeStyle = '#000';
        _ctx.font = font_size + "px " + font_face;
        _ctx.fillText(text, 0, 0);
        _ctx.strokeText(text, 0, 0);
        _ctx.restore();
    }

    function main() {

        var _player;

        function center_view(x, y, c_width, c_height) {
            map_pan[0] = -(x * c_width * map_scale) + c_width / 2;
            map_pan[1] = -(y * c_width * map_scale) + c_height / 2;
            clampMapPan();
        }

        function _rel(a, b, c) {
            return a * c * map_scale + map_pan[b];
        }

        var _draw_player = draw_player;
        draw_player = function(canvas, ctx, item, dt) {
            if (!isDraggingMap && WTM.settings.map_center) {
                center_view(item.x, item.y, canvas.width, canvas.height);
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

            var x = item.x;
            var y = item.y;

            var sx = _rel(x, 0, _canvas.width);
            var sy = _rel(y, 1, _canvas.height);

            if (item.type === 'aircraft') {
                var dir = Math.atan2(item.dx, -item.dy);
                var color = calcMapObjectColor(item);
                var text = icon_texts[item.icon];
                var font_size = WTM.settings.plane_icon_size * WTM.icons[text];
                _draw_text_icon(text, sx, sy, dir, color, font_size);
            } else {
                _draw_map_object.apply(this, arguments);
            }
        };

        var _type_priority = {
            'aircraft': 3,
            'ground_model': 2,
            'airfield': 1
        };

        var _update_object_positions = update_object_positions;
        update_object_positions = function(objects) {
            _player = null;

            objects.sort(function(a, b) {
                if (a.icon === 'Player') {
                    _player = a;
                }
                // Put aircrafts at the end so they are drawn last
                return (_type_priority[a.type] || 0) > (_type_priority[b.type] || 0);
            });
            if (map_info && _player) {
                var min_distance = null;
                var friendlies = 0;
                var enemies = 0;
                $.each(objects, function(i, item) {
                    if (item.type !== 'aircraft' || item.icon === 'Player') {
                        return;
                    }
                    var color = item['color[]'];
                    if (color[0] < color[2]) {
                        friendlies += 1;
                        return;
                    } else {
                        enemies += 1;
                    }

                    var x = item.x;
                    var y = item.y;

                    var min_other_distance = null;

                    var distance = get_distance(x, y, _player.x, _player.y);

                    if (min_distance === null || distance < min_distance) {
                        min_distance = distance;
                    }
                });

                var title_info = [];
                if (enemies) {
                    title_info.push('E:' + enemies);
                }
                if (min_distance !== null) {
                    var _units = WTM.settings.units === 'meters' ? 'km' : 'mi';
                    var _min_distance = (WTM.m2x(min_distance, _units)).toFixed(2);
                    title_info.push(' > ' + _min_distance + ' ' + _units);
                }
                title_info.push('F:' + friendlies);

                document.title = '(' + title_info.join(' ') + ') ' + _title;
            }
            _update_object_positions.apply(this, arguments);
        };

        var _update_map_info = update_map_info;
        update_map_info = function(info) {
            var auto_scale = WTM.settings.map_center;
            var prevMapGen, newMapGen;

            if (auto_scale) {
                prevMapGen = (map_info && ('map_generation' in map_info)) ? map_info.map_generation : -1;
                newMapGen = (info && ('map_generation' in info)) ? info.map_generation : -1;
            }

            _update_map_info.apply(this, arguments);

            var map_min = info.map_min;
            var map_max = info.map_max;

            _map_width = map_max[0] - map_min[0];
            _map_height = map_max[1] - map_min[0];

            if (auto_scale && prevMapGen != newMapGen) {
                map_scale = WTM.m2x(_map_width * WTM.settings.map_scale / _canvas.width, 'nmi');
            }
        };

        init();

        _canvas = document.getElementById('map-canvas');
        _ctx = _canvas.getContext('2d');
    }
}).fail(function() {
    window.location.href = 'error.html';
});