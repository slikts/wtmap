$.get(WTM.settings.base_url, function(data) {
    var _title = document.title;

    var persist_scale = localStorage.persist_scale;
    if (!persist_scale || persist_scale === 'NaN') {
        persist_scale = localStorage.persist_scale = "0.00005";
    }

    var $wtm_scripts = $('script');

    $(document.body).html(data
            .replace('<head>', '<head><base href="' + WTM.settings.base_url + '">')
            .replace(/\ssrc="/g, ' data-src="')
            .replace(/'#555'/g, "'rgba(255, 255, 255, .13)'")
            .replace(/'#111'/g, "'rgba(0, 0, 0, .75)'")
            );

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
        var icon_texts = WTM.icon_texts;

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

        function add_panel(id) {
            var $caption = $('<div class="wtm-caption">');
            var $contents = $('<div id="wtm-' + id + '" class="wtm-panel-contents">');
            return $('<div id="wtm-' + id + '-root" class="wtm-panel">')
                    .append($caption)
                    .data('$caption', $caption)
                    .append($contents)
                    .data('$contents', $contents);
        }

        var $map_root = add_panel('map').appendTo(document.body);
        var $sidepanels = $('<div id="wtm-sidepanels">').appendTo(document.body);
        var $state_root = add_panel('state').appendTo($sidepanels);
        var $indicators_root = add_panel('indicators').appendTo($sidepanels);

        var $canvas = $('#map-canvas').appendTo($map_root.data('$contents'));
        _canvas = $canvas[0];
        _ctx = _canvas.getContext('2d');


        var $mapsummary = $('<table id="wtm-mapsummary">').appendTo($map_root);
        var mapsummary_rows = [$('<tr id="wtm-bluerow">').appendTo($mapsummary),
            $('<tr id="wtm-redrow">').appendTo($mapsummary)];
        var summary_order = ['Fighter', 'Bomber', 'Assault',
            'Tracked', 'Wheeled', 'Ship', 'Airdefence', 'Structure'];

        var _update_object_positions = update_object_positions;
        update_object_positions = function(objects) {
            _player = null;

            try{
                objects.sort(function(a, b) {
                    if (a.icon === 'Player') {
                        _player = a;
                    }
    
                    // Put aircrafts at the end so they are drawn last
                    return (_type_priority[a.type] || 0) > (_type_priority[b.type] || 0);
                });

                var summary = {
                };

                if (map_info) {
                    var min_distance = null;
                    var friendlies = 0;
                    var enemies = 0;
                    $.each(objects, function(i, item) {
                        var color = item['color[]'];
                        var team = color[0] > color[2] ? 'red' : 'blue';

                        var icon = item.icon;
                        if (icon !== 'none' && icon !== 'Player') {
                            var _summary = summary[icon];
                            if (!_summary) {
                                _summary = summary[icon] = [0, 0];
                            }
                            _summary[team === 'blue' ? 0 : 1] += 1;
                        }

                        if (item.type !== 'aircraft' || item.icon === 'Player') {
                            return;
                        }

                        if (team === 'blue') {
                            friendlies += 1;
                        } else {
                            enemies += 1;
                        }

                        if (team === 'red' && _player) {
                            var distance = get_distance(item.x, item.y, _player.x, _player.y);
                            //item._player_distance = distance;

                            if (min_distance === null || distance < min_distance) {
                                min_distance = distance;
                            }
                        }
                    });
                    var rows = mapsummary_rows;
                    rows[0].html('');
                    rows[1].html('');
                    var wtm_icons = WTM.icons;
                    var order = summary_order
                            .slice(0)
                            .concat(Object.keys(summary)
                                    .filter(function(x) {
                                        return !~summary_order.indexOf(x);
                                    }));

                    $.each(order, function(i, icon) {
                        var team_objects = summary[icon];
                        if (!team_objects) {
                            return;
                        }
                        var icon_text;
                        var aircraft;
                        if (icon in icon_texts) {
                            icon_text = icon_texts[icon];
                            aircraft = true;
                        } else if (icon === 'Airdefence') {
                            icon_text = '4';
                        } else if (icon === 'Structure') {
                            icon_text = '5';
                        } else {
                            icon_text = icon[0];
                        }
                        $.each(team_objects, function(i, count) {
                            var $row = rows[i];
                            var $icon = $('<th>').text(count ? icon_text : '')
                                    .attr('title', icon)
                                    .appendTo($row);
                            if (aircraft) {
                                $icon.addClass('wtm-aircraft')
                                        .css('fontSize', 23 * wtm_icons[icon_text] + 'px');
                            }
                            $('<td>').text(count ? count : '')
                                    .attr('title', icon)
                                    .appendTo($row);
                            if (!count) {

                            }
                        });
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
                    if (friendlies) {
                        title_info.push('F:' + friendlies);
                    }

                    if (title_info.length) {
                        document.title = '(' + title_info.join(' ') + ') ' + _title;
                    } else {
                        document.title = _title;
                    }
                }
                _update_object_positions.apply(this, arguments);
            }catch(e){
                console.log(e)
            }
        };

        var $map_info = $('<span id="wtm-mapinfo">').appendTo($map_root.data('$caption'));
        var $map_dimension_info = $('<span id="wtm-mapdimensions">').appendTo($map_info);
        var $map_grid_info = $('<span id="wtm-mapgrid">').appendTo($map_info);
        var _map_units = WTM.settings.units === 'meters' ? 'km' : 'mi';

        var _update_map_info = update_map_info;
        update_map_info = function(info) {
            _update_map_info.apply(this, arguments);

            var map_min = info.map_min;
            var map_max = info.map_max;

            if (!map_min || !map_max) {
                return;
            }

            _map_width = map_max[0] - map_min[0];
            _map_height = map_max[1] - map_min[0];

            $map_dimension_info.html(
                    Math.round(WTM.m2x(_map_width, _map_units))
                    + '&times'
                    + Math.round(WTM.m2x(_map_height, _map_units))
                    + ' ' + _map_units
                    );
            $map_grid_info.text(
                    WTM.m2x(map_info.grid_steps[0], _map_units).toFixed(2)
                    + ' ' + _map_units
                    );

            map_scale = _map_width * parseFloat(persist_scale, 10);

            update_scale();
        };

        function xhr_onload(handler, send, rate) {
            if (this.on) {
                handler(this.responseText ? JSON.parse(this.responseText) : null);
            }
            setTimeout(send, rate);
        }

        function send_xhr(url) {
            if (this.on) {
                this.open('GET', url, true);
                this.send();
            } else {
                this.onload();
            }
        }

        function poll_url(url, handler, rate, on) {
            var xhr = new XMLHttpRequest();
            var send = send_xhr.bind(xhr, url);
            xhr.onload = xhr_onload.bind(xhr, handler, send, rate);
            xhr.on = on;
            send();
            return xhr;
        }

        var $map_scaleinfo = $('<span id="wtm-mapscale">').appendTo($map_info);
        function update_scale() {
            $map_scaleinfo.text(map_scale.toFixed(2));
        }

        var _addWheelHandler = addWheelHandler;
        addWheelHandler = function(elem, handler) {
            var _handler = handler;

            handler = function() {
                _handler.apply(this, arguments);
                persist_scale = localStorage.persist_scale = map_scale / _map_width;
                update_scale();
            };

            return _addWheelHandler.apply(this, arguments);
        };

        save_positions = function() {
        };

        function update_table(data, data_store, $table, data_key) {
            if (!data || !data.valid) {
                $.each(data_store, function(key) {
                    delete data_store[key];
                });
                $table.find('tr').remove();
                return;
            }
            $.each(data_store, function(key, $val) {
                if (!(key in data)) {
                    $val.parent().remove();
                    delete data_store[key];
                }
            });
            $.each(data, function(key, val) {
                if (key === 'valid') {
                    return;
                }
                var $val = data_store[key];
                var _key = key.split(',');
                var _unit = _key[1] || '';
                if (_unit === ' %') {
                    _unit = _unit.trim();
                }
                val = val + _unit;
                if (!$val) {
                    var ls_key = _key[0] + '_hl_' + data_key;
                    var $row = $('<tr>');
                    $row.click(function() {
                        localStorage[ls_key] = 1 - (localStorage[ls_key] || 0);
                        $row.toggleClass('hl');
                    })
                            .append($('<th>').text(_key[0].replace('_', ' ')));
                    if (localStorage[ls_key] * 1) {
                        $row.addClass('hl');
                    }
                    data_store[key] = $('<td>').appendTo($row).text(val);
                    $table.append($row);
                } else {
                    $val.text(val);
                }
            });
        }

        var $indicators_table = $('<table class="wtm-data">').appendTo('#wtm-indicators');
        var indicators_data = {};
        function update_indicators(data) {
            update_table(data, indicators_data, $indicators_table, 'indicators');
        }

        var $state_table = $('<table class="wtm-data">').appendTo('#wtm-state');
        var state_data = {};
        function update_state(data) {
            update_table(data, state_data, $state_table, 'state');
        }

        load_positions = function() {
        };

        $.fn.resizable = function() {
        };

        init();

        // Clear existing intervals
        for (var i = 1, n = setTimeout(function() {
        }, 0); i < n; i++) {
            window.clearInterval(i);
        }

        poll_url('/map_obj.json',
                update_object_positions, _settings.object_update_rate, true);
        poll_url('/map_info.json',
                update_map_info, _settings.map_info_update_rate, true);
        var state_xhr = poll_url('/state',
                update_state, _settings.panels_update_rate, _settings.update_state);
        var indicators_xhr = poll_url('/indicators',
                update_indicators, _settings.panels_update_rate, _settings.update_indicators);

        update_scale();

        var panel_padding = 5;
        function position_panels() {
            var canvas_size = Math.max(document.documentElement.clientHeight - 80, 350);
            if ($canvas.width() !== canvas_size) {
                _canvas.width = canvas_size;
                _canvas.height = canvas_size;
            }
            $sidepanels.css('left', canvas_size + panel_padding * 2 + 2);
            update_scale();
        }

        function add_checkbox($panel, setting, xhr) {
            $panel.data('$caption').append($('<div class="wtm-toggle">')
                    .append(
                            $('<label>')
                            .attr('for', setting + '-toggle')
                            .text('Update')
                            )
                    .append(
                            $('<input type="checkbox">')
                            .attr('id', setting + '-toggle')
                            .attr('checked', !!_settings[setting])
                            .change(function() {
                                var checked = this.checked;
                                xhr.on = checked;
                                localStorage[setting] = _settings[setting] = checked * 1;
                                $panel[(checked ? 'remove' : 'add') + 'Class']('off');
                            })
                            )
                    );
            if (!_settings[setting]) {
                $panel.addClass('off');
            }
        }

        add_checkbox($indicators_root, 'update_indicators', indicators_xhr);
        add_checkbox($state_root, 'update_state', state_xhr);

        position_panels();

        window.onload = function() {
        };

        $(window).resize(function() {
//            map_scale = map_scale / (ui.size.width / _canvas.width);
            position_panels();
        });
    }
}).fail(function() {
    window.location.href = 'error.html';
});