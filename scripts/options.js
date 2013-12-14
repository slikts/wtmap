(function() {
    'use strict';

    var $inputs = $('input');

    var $feet = $('#feet');
    var $proximity_radius = $('#proximity_radius');
    var $plane_icon_preview = $('#plane_icon_preview');
    var $plane_icon_size = $('#plane_icon_size');

    $inputs.change(function() {
        var $this = $(this);
        $this.data('changed', $this.val() != WTM.settings[$this.attr('id')]);
    });

    function update_feet() {
        $feet.text((parseInt($proximity_radius.val(), 10) / 1000 * 0.621371).toFixed(2));
    }

    $proximity_radius.keyup(update_feet);

    var previews = {};
    $.each(WTM.icons, function(key) {
        var icon = $('<span>').text(key);
        $plane_icon_preview.append(icon);
        previews[key] = icon;
    });

    function update_icons() {
        var size = parseInt($plane_icon_size.val(), 10) || WTM.defaults.plane_icon_size;
        $.each(WTM.icons, function(key, value) {
            previews[key].css({
                'fontSize': size * value + 'px'
            });
        });
    }

    $plane_icon_size.keyup(update_icons);

    function load_values() {
        $inputs.each(function() {
            var $this = $(this);
            $this.val(WTM.settings[$this.attr('id')])
                    .data('changed', false);
        });
        update_feet();
        update_icons();
    }

    var status_timeout;
    function display_status(text) {
        $status.text(text);
        window.clearTimeout(status_timeout);
        status_timeout = window.setTimeout(function() {
            $status.text('');
        }, 3000);
    }

    load_values();


    var $status = $('#status');
    $('#save').click(function() {
        chrome.permissions.remove({origins: [WTM.settings.base_url]},
        function() {
        });
        
        $inputs.each(function() {
            var $this = $(this);
            var val = $this.val();
            var key = $this.attr('id');
            var default_val = WTM.defaults[key];
            if (typeof default_val === 'number') {
                val = parseInt(val, 10);
            }
            if (!val || val === default_val) {
                // Reset to default
                localStorage.removeItem(key);
                return;
            }
            localStorage[key] = val;
        });
        WTM.update();
        load_values();

        chrome.permissions.request({origins: [WTM.settings.base_url]},
        function() {
        });
       
        display_status('Options saved');
    });
    $('#restore').click(function() {
        if (!confirm('Are you sure you want to restore the default options?')) {
            return;
        }
        WTM.settings = jQuery.extend({}, WTM.defaults);
        $.each(WTM.defaults, function(key) {
            localStorage.removeItem(key);
        });
        load_values();

        display_status('Defaults restored')
    });

    $('#test_sound').click(function() {
        var audio = new Audio($('#proximity_sound_file').val());
        audio.volume = parseFloat($('#alert_volume').val(), 10);
        audio.play();
        return false;
    });

    window.onbeforeunload = function() {
        var changes = false;
        $inputs.each(function() {
            if ($(this).data('changed')) {
                changes = true;
                return false;
            }
        });
        if (changes) {
            return 'Unsaved changes.';
        }
    };

})();
