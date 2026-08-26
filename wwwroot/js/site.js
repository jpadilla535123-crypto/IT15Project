// Live search for the top bar search input.
(function () {
    var input = document.querySelector('.search-bar input[type="search"]');
    if (!input) return;

    var params = new URL(window.location.href).searchParams;
    var initial = params.get('search');
    if (initial) input.value = initial;

    var timer = null;
    input.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
            var value = input.value.trim();
            var current = new URL(window.location.href);
            var isEvents = /\/Events/i.test(current.pathname);
            var target;
            if (isEvents) {
                target = current;
                if (value) {
                    target.searchParams.set('search', value);
                } else {
                    target.searchParams.delete('search');
                }
                target.searchParams.delete('page');
            } else {
                target = new URL('/Events', window.location.origin);
                if (value) target.searchParams.set('search', value);
            }
            window.location.href = target.toString();
        }, 400);
    });
})();
