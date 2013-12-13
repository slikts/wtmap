
(function() {
    'use strict';
    
    var $inputs = $('input');
    
    function load_values() {
        $inputs.each(function() {
            var $this = $(this);
            $this.val(WTM.settings[$this.attr('id')]);
        });
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
        
        display_status('Options saved');
    });
    $('#restore').click(function() {
        if (!confirm('Are you sure you want to restore the defaults?')) {
            return;
        }
        WTM.settings = jQuery.extend({}, WTM.defaults);
        $.each(WTM.defaults, function(key) {
            localStorage.removeItem(key);
        });
        load_values();
        
        display_status('Defaults restored')
    });

})();
