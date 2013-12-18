$.get(WTM.settings.base_url, function(data) {
    var _title = document.title;

    if (!localStorage.persist_scale) {
        localStorage.persist_scale = "0.00005";
    }

    var $wtm_scripts = $('script');

    $(document.body).html(data
            .replace('<head>', '<head><base href="' + WTM.settings.base_url + '">')
            .replace(/\ssrc="/g, ' data-src="'));

    var loaded_scripts = 0;
    var scripts = [];
    var $scripts = $('script').not($wtm_scripts);
    var $eval = $([]);
    var _settings = WTM.settings;
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
    var _canvas, _ctx;

    function get_distance(x1, y1, x2, y2) {
        var dx = Math.abs(x1 - x2) * _map_width;
        var dy = Math.abs(y1 - y2) * _map_height;

        return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    }

    function hex_to_rgba(hex, alpha) {
        return 'rgba(' + [parseInt(hex.substr(1, 2), 16),
            parseInt(hex.substr(3, 2), 16),
            parseInt(hex.substr(5, 2), 16)].join(',') +
                ',' + alpha + ')';
    }

    function _draw_text_icon(text, sx, sy, dir, fill,
            alpha, font_size, font_face, stroke, text_align, text_baseline) {
        if (alpha) {
            if (fill) {
                fill = hex_to_rgba(fill, alpha);
            }
            if (stroke) {
                stroke = hex_to_rgba(stroke, alpha);
            }
        }
        font_face = font_face || 'plane_icons';
        text_align = text_align || 'center';
        text_baseline = text_baseline || 'middle';
        _ctx.save();
        _ctx.translate(sx, sy);
        _ctx.rotate(dir);
        _ctx.textAlign = text_align;
        _ctx.textBaseline = text_baseline;
        _ctx.fillStyle = fill;
        _ctx.strokeStyle = stroke;
        _ctx.lineWidth = 1;
        _ctx.font = font_size + "px " + font_face;
        _ctx.fillText(text, 0, 0);
        if (stroke) {
            _ctx.strokeText(text, 0, 0);
        }
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
                var offscreen = false;
                var offscreen_offset = 12;

                var slope = (_canvas.height / 2 - sy) / (_canvas.width / 2 - sx);
                var y_intercept = sy - slope * sx;
                //var offscreen_align = 'center';
                //var offscreen_baseline;

                if (sx > _canvas.width) {
                    sx = _canvas.width - offscreen_offset;
                    sy = slope * sx + y_intercept;
                    offscreen = true;
                    //offscreen_align = 'right';
                } else if (sx < 0) {
                    sx = offscreen_offset;
                    sy = slope * sx + y_intercept;
                    offscreen = true;
                    //offscreen_align = 'left';
                }
                if (sy > _canvas.height) {
                    sy = _canvas.height - offscreen_offset;
                    sx = (sy - y_intercept) / slope;
                    offscreen = true;
                    //offscreen_baseline = 'top';
                } else if (sy < 0) {
                    sy = offscreen_offset;
                    sx = (sy - y_intercept) / slope;
                    offscreen = true;
                    //offscreen_baseline = 'bottom';
                }
                var alpha;
                if (offscreen) {
                    alpha = '.35';
                } else {
                    alpha = '1';
                }
                _draw_text_icon(text, sx, sy, dir, color, alpha, font_size, null, '#000000');
                //var distance = item._player_distance;
                //distance = distance? (distance / 1000).toFixed(2) + ' km' : '';
                //if (offscreen) {
                //    _draw_text_icon(distance, sx, sy, 0, '#ffffff', '.75', 11,
                //            'Tahoma', null, offscreen_align, offscreen_baseline);
                //}
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
                    }
                    enemies += 1;

                    var distance = get_distance(item.x, item.y, _player.x, _player.y);
                    item._player_distance = distance;

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
        var _initial_scale = false;
        update_map_info = function(info) {
            _update_map_info.apply(this, arguments);

            var map_min = info.map_min;
            var map_max = info.map_max;

            _map_width = map_max[0] - map_min[0];
            _map_height = map_max[1] - map_min[0];

            if (!_initial_scale) {
                map_scale = _map_width * parseFloat(localStorage.persist_scale, 10);
                _initial_scale = true;
            }
        };

        function xhr_onload(handler) {
            if (this.responseText) {
                handler(JSON.parse(this.responseText));
            }
        }

        function get_xhr(url, handler) {
            var xhr = new XMLHttpRequest();
            xhr.onload = xhr_onload.bind(xhr, handler);
            xhr.open('GET', url, true);
            xhr.send();
        }

        WTM.get_object_positions = get_xhr.bind(WTM, '/map_obj.json', update_object_positions);
        window.setInterval(WTM.get_object_positions, _settings.object_update_rate);
        WTM.get_object_positions();
        WTM.get_map_info = get_xhr.bind(WTM, '/map_info.json', update_map_info);
        window.setInterval(WTM.get_map_info, 5000);
        WTM.get_map_info();
        if (_settings.update_hud) {
            $('#hud-evt-msg-root').addClass('show');
            $('#hud-dmg-msg-root').addClass('show');
        }
        if (_settings.update_chat) {
            $('#game-chat-root').addClass('show');
        }
        if (_settings.update_indicators) {
            $('#indicators-root').addClass('show');
        }
        updateSlow = function() {
            //'/hudmsg', data:{'lastEvt':lastEvtMsgId, 'lastDmg':lastDmgMsgId} update_hud_msg
            if (_settings.update_hud) {
                get_xhr('/hudmsg?lastEvt=' + lastEvtMsgId + '&lastDmg=' + lastDmgMsgId, update_hud_msg);
            }
            if (_settings.update_chat) {
                get_xhr('/gamechat?lastId=' + lastChatRecId, update_game_chat);
            }
            if (_settings.update_indicators) {
                get_xhr('/indicators', update_indicators);
            }
        };

        var _addWheelHandler = addWheelHandler;
        addWheelHandler = function(elem, onWheel) {
            var _onWheel = onWheel;

            onWheel = function() {
                _onWheel.apply(this, arguments);
                localStorage.persist_scale = map_scale / _map_width;
            };

            return _addWheelHandler.apply(this, arguments);
        };

        init();

        var $canvas = $('#map-canvas');
        _canvas = $canvas[0];
        _ctx = _canvas.getContext('2d');

        var _option_stop = $canvas.resizable('option', 'stop');
        $canvas.resizable('option', 'stop', function(event, ui) {
            map_scale = map_scale / (ui.size.width / _canvas.width);
            _option_stop.apply(this, arguments);
        });
    }
}).fail(function() {
    window.location.href = 'error.html';
});