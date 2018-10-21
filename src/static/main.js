$(function() {

    $('select[data-route]').on('change', function (e) {
        var data = $(e.target).data();
        var route = [data.route, data.method].join('/');
        var stub = $(e.target).val();
        setStub(route, stub);
    });

    $('#environment-form select').on('change', function (e) {
        $(this).closest('form').submit();
    });

    $('#preset-form select').on('change', function (e) {
        var name = e.target.value;
        setPreset(name);
    });


});

function setPreset(name) {
    $.ajax({
        url: '/services/setPreset',
        method: 'GET',
        dataType: 'json',
        data: {
            name: name
        },
        complete: function(){
            window.location.reload();
        }
    })
}

function setStub(route, stub) {
    $.ajax({
        url: '/services/setRoute',
        method: 'GET',
        dataType: 'json',
        data: {
            route: route,
            stub: stub
        },
        complete: function(){
            window.location.reload();
        }
    })
}
