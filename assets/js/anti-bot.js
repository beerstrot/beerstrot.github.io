(function() {
    var formLoadTime = Date.now();
    var MIN_FILL_TIME_MS = 3000;

    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'register-btn') {
            var honeypot = document.getElementById('website-url');
            var isBotHoneypot = honeypot && honeypot.value.length > 0;
            var isBotSpeed = (Date.now() - formLoadTime) < MIN_FILL_TIME_MS;

            if (isBotHoneypot || isBotSpeed) {
                e.stopImmediatePropagation();
                e.preventDefault();
                return false;
            }
        }
    }, true);
})();
