var container, camera, controls, scene, renderer, cameralight, stats, socket;

var sysconf_template_row;
var connections_template_row;

var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;
var ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT;

var system = [];

var nodes = {};

var STATUS = Object.freeze({IDLE: 1, BUSY:2, OFF: 0});


$(document).ready(function () {

    initGui();

    /*socket = io('http://localhost:'+config.SOCKET_PORT);

    socket.on('news', function (data) {
        console.log(data);
    });*/

});

function initGui() {
    $('div#menu button#main-menu').trigger('click');

    $('#mainMenu input#PLANET_SIZE_RANGE_min').val(config.PLANET_SIZE_RANGE.min);
    $('#mainMenu input#PLANET_SIZE_RANGE_max').val(config.PLANET_SIZE_RANGE.max);
    $('#mainMenu input#SYSTEM_RADIUS_RANGE_min').val(config.SYSTEM_RADIUS_RANGE.min);
    $('#mainMenu input#SYSTEM_RADIUS_RANGE_max').val(config.SYSTEM_RADIUS_RANGE.max);
    $('#mainMenu input#SUN_SIZE_RANGE_min').val(config.SUN_SIZE_RANGE.min);
    $('#mainMenu input#SUN_SIZE_RANGE_max').val(config.SUN_SIZE_RANGE.max);
    $('#mainMenu input#NUM_PLANETS').val(config.NUM_PLANETS);

    sysconf_template_row = $('#systemconfigurator table tbody tr:first-of-type').detach();
    connections_template_row = $('#connections table tbody tr:first-of-type').detach();

    $('[data-action="sysconfAddRow"]').click(sysconfAddRow);

    $('[data-action="connectionAddRow"]').click(connectionAddRow);

    $('[data-action="simTogglePlay"]').click(simTogglePlay);

    $('[data-action="systemSave"]').click(systemSave);

    $('[data-action="systemLoad"]').click(systemLoad);

    $('.btn-file :file').on('fileSelect', fileSelect);

    $('.btn-file :file').on('change', fileChange);

    $('#mainMenu').on('show.bs.modal', loadTextareaSystem);

    $('a[data-toggle="tab"]').on('show.bs.tab', showTab);


    $('#mainMenu .modal-footer .btn-primary').click(apply);

}

function showTab(event) {
    switch($(event.target).attr('href')) {
        case '#connections':
            $('.modal-footer button.apply').addClass('hide');
            $('.modal-footer button.cancel').addClass('hide');
            $('.modal-footer button.ok').removeClass('hide');
            break;
        default:
            $('.modal-footer button.apply').removeClass('hide');
            $('.modal-footer button.cancel').removeClass('hide');
            $('.modal-footer button.ok').addClass('hide');
    }
}

function fileSelect(event, numFiles, label) {

    var input = $(this).parents('.input-group').find(':text'),
        log = numFiles > 1 ? numFiles + ' files selected' : label;

    if (input.length) {
        input.val(log);
    } else {
        if (log) alert(log);
    }
}

function loadTextareaSystem() {
    $('textarea#system').html(JSON.stringify(system));
}

function fileChange() {
    var input = $(this),
        numFiles = input.get(0).files ? input.get(0).files.length : 1,
        label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    input.trigger('fileSelect', [numFiles, label]);
}

function systemSave() {
    var blob = new Blob($('textarea#system').val().split('\n'), {type: "text/x-json;charset=utf-8"});
    saveAs(blob, "system.json");
}

function systemLoad() {
    if ($('#loadfile').prop("files").length == 1) {
        var file = $('#loadfile').prop("files")[0];
        console.log(file);
        var reader = new FileReader();
        reader.onload = function (e) {
            var dataPrefix = 'base64,';
            $('textarea#system').html(atob(e.target.result.substr(e.target.result.lastIndexOf(dataPrefix) + dataPrefix.length)));
        };

        reader.readAsDataURL(file);
    }
}

function clearContainer() {
    $('#container > *').remove();
    $('#stats > *').remove();
}

function initSystem(system) {

    camera = new THREE.PerspectiveCamera(config.VIEW_ANGLE, ASPECT, config.NEAR, config.FAR);
    camera.position.z = Math.floor(config.SYSTEM_RADIUS_RANGE.max / 2);

    scene = new THREE.Scene();

    for (i in system) {
        var obj = system[i];

        switch (obj.type.toUpperCase()) {
            case 'SUN':
                var color = new THREE.Color(obj.color);
                var sun = new THREE.Mesh(new THREE.SphereGeometry(obj.size, 64, 32), new THREE.MeshLambertMaterial({color: color}));
                sun.position.set(obj.position.x, obj.position.y, obj.position.z);
                sun.updateMatrix();
                sun.matrixAutoUpdate = false;
                scene.add(sun);
                //console.log(planet);
                break;
            case 'PLANET':
                var color = new THREE.Color(obj.color);
                var planet = new THREE.Mesh(new THREE.SphereGeometry(obj.size, 32, 16), new THREE.MeshLambertMaterial({color: color}));
                planet.position.set(obj.position.x, obj.position.y, obj.position.z);
                planet.updateMatrix();
                planet.matrixAutoUpdate = false;
                scene.add(planet);
                //console.log(planet);
                break;
            default:
                console.error(obj);
                throw 'the entered object type is not supported';
                break;
        }
    }

    cameralight = new THREE.DirectionalLight(0xffffff, 1);
    cameralight.position.set(camera.position.x, camera.position.y, camera.position.z);
    scene.add(cameralight);

    var ambLight = new THREE.AmbientLight(0x010101);
    scene.add(ambLight);

    stats = new Stats();
    document.getElementById('stats').appendChild(stats.domElement);

    renderer = new THREE.WebGLRenderer({antialias: false});
    //renderer.setClearColor( scene.fog.color, 1 );
    renderer.setSize(window.innerWidth, window.innerHeight);

    container = document.getElementById('container');
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', render);

    window.addEventListener('resize', onWindowResize, false);

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    cameralight.position.set(camera.position.x, camera.position.y, camera.position.z);

    stats.update();
}

function render() {
    renderer.render(scene, camera);
}


function randomSpherePoint(radius, origin) {

    if (typeof origin != 'object') {
        origin = new THREE.Vector3(0, 0, 0);
    }

    var u = Math.random();
    var v = Math.random();
    var theta = 2 * Math.PI * u;
    var phi = Math.acos(2 * v - 1);
    var x = origin.x + (radius * Math.sin(phi) * Math.cos(theta));
    var y = origin.y + (radius * Math.sin(phi) * Math.sin(theta));
    var z = origin.z + (radius * Math.cos(phi));
    return new THREE.Vector3(x, y, z);
}

function getStatus(host, port) {
    return 0;
}

function sysconfAddRow() {

    var sysconf_type = $('select#sysconf_type option:selected');
    var sysconf_size = $('input#sysconf_size');
    var sysconf_position = $('input#sysconf_position');
    var sysconf_color = $('input#sysconf_color');

    var new_row = sysconf_template_row.clone();

    new_row.find('td.type').html(sysconf_type.text());
    new_row.find('td.type').data('value', sysconf_type.val());
    new_row.find('td.size').html(sysconf_size.val());
    new_row.find('td.size').data('value', parseInt(sysconf_size.val()));
    new_row.find('td.position').html('(' + sysconf_position.val() + ')');
    new_row.find('td.position').data('value', sysconf_position.val());
    new_row.find('td.color').find('span').css('background-color', sysconf_color.val());
    new_row.find('td.color').data('value', sysconf_color.val());//.replace(/\#/, '0x'));

    new_row.find('[data-action="sysconfRemoveRow"]').click(sysconfRemoveRow);

    new_row.appendTo('#systemconfigurator table tbody');
}

function sysconfRemoveRow() {
    $(this).closest('tr').remove();
}

function connectionAddRow() {

    var host = $('input#connections_host').val();
    var port = parseInt($('input#connections_port').val());

    var hostPort = host + ':' + port;

    var duplicate = false;
    $('#connections table tbody tr').each(function () {
        if ($(this).data('host-port') == hostPort) {
            duplicate = true;
            return false;
        }
    });

    if (duplicate === true) {
        return false;
    }

    var new_row = connections_template_row.clone();

    new_row.find('td.host').html(host);
    new_row.find('td.host').data('value', host);
    new_row.find('td.port').html(port);
    new_row.find('td.port').data('value', port);
    new_row.find('td.status').find('span.status-on').show();
    new_row.find('td.status').find('span.status-off').show();
    new_row.data('host-port', hostPort);

    new_row.find('[data-action="connectionRemoveRow"]').click(connectionRemoveRow);

    new_row.find('[data-action="connectionRefresh"]').click(connectionRefresh);

    new_row.appendTo('#connections table tbody');

    $('input#connections_port').val(port+1);

    //socket.emit('connectNode', { host: host, port: parseInt(port) });

    nodes[hostPort] = {
        host: host,
        port: port,
        online: false,
        lastping: 0,
        socket: io.connect('http://'+hostPort)
    };

    nodes[hostPort].socket.on('nodeStatus', function (data) {
        console.log(data);
        setConnectionState(hostPort, data.status);
    });

    setTimeout(function(){new_row.find('[data-action="connectionRefresh"]').trigger('click');}, 200);
}

function setConnectionState(hostPort, status) {
    $('#connections table tbody tr').each(function() {
        if($(this).data('host-port') == hostPort) {
            switch(status) {
                case STATUS.IDLE:
                    $(this).find('td.status span').addClass('hide');
                    $(this).find('td.status span.status-idle').removeClass('hide');
                    break;
                case STATUS.BUSY:
                    $(this).find('td.status span').addClass('hide');
                    $(this).find('td.status span.status-busy').removeClass('hide');
                    break;
                case STATUS.OFF:
                    $(this).find('td.status span').addClass('hide');
                    $(this).find('td.status span.status-off').removeClass('hide');
                    break;
            }
        }
    });
}

function connectionRefresh() {

    console.log('send getNodeStatus');

    var hostPort = $(this).closest('tr').data('host-port');

    if(nodes[hostPort].socket.connected == true) {
        nodes[hostPort].socket.emit('getNodeStatus', {hostPort: hostPort});
    }
    else {
        setConnectionState(hostPort, STATUS.OFF);
    }

}

function connectionRemoveRow() {

    var hostPort = $(this).closest('tr').data('host-port');
    delete nodes[hostPort];
    $(this).closest('tr').remove();
}

function simTogglePlay() {
    if ($(this).hasClass('play')) {
        alert('play');
    }
    else {
        alert('pause');
    }
    $(this).toggleClass('btn-success btn-warning play pause');
    $(this).find('span').toggleClass('hide');
}

function apply() {

    $('#mainMenu .modal-footer .btn').attr('disabled', true);
    $('span#loading').show();

    setTimeout(function () {

        switch ($('#mainMenu .tab-content .active').attr('id')) {

            case 'random':
                applyRandom();
                break;

            case 'systemconfigurator':
                applySysconf();
                break;

            case 'saveload':
                applySaveLoad();
                break;

            case 'connections':
                applyConnections();
                break;
        }

        $('#mainMenu').modal('hide');
        $('#mainMenu .modal-footer .btn').removeAttr('disabled');
        $('span#loading').hide();

    }, 50);
}

function applyRandom() {
    system.length = 0;

    config.PLANET_SIZE_RANGE.min = parseInt($('#mainMenu input#PLANET_SIZE_RANGE_min').val());
    config.PLANET_SIZE_RANGE.max = parseInt($('#mainMenu input#PLANET_SIZE_RANGE_max').val());
    config.SYSTEM_RADIUS_RANGE.min = parseInt($('#mainMenu input#SYSTEM_RADIUS_RANGE_min').val());
    config.SYSTEM_RADIUS_RANGE.max = parseInt($('#mainMenu input#SYSTEM_RADIUS_RANGE_max').val());
    config.SUN_SIZE_RANGE.min = parseInt($('#mainMenu input#SUN_SIZE_RANGE_min').val());
    config.SUN_SIZE_RANGE.max = parseInt($('#mainMenu input#SUN_SIZE_RANGE_max').val());
    config.NUM_PLANETS = parseInt($('#mainMenu input#NUM_PLANETS').val());

    system.push({
        type: 'Sun',
        size: (Math.floor(Math.random() * (config.SUN_SIZE_RANGE.max - config.SUN_SIZE_RANGE.min + 1)) + config.SUN_SIZE_RANGE.min),
        position: {x: 0, y: 0, z: 0},
        color: '#ffff00'
    });

    for (var i = 0; i < config.NUM_PLANETS; i++) {

        var originDistance = Math.floor(Math.random() * (config.SYSTEM_RADIUS_RANGE.max - config.SYSTEM_RADIUS_RANGE.min + 1)) + config.SYSTEM_RADIUS_RANGE.min;
        var sizeDistanceFactor = originDistance / config.SYSTEM_RADIUS_RANGE.max;
        var pos = randomSpherePoint(originDistance);

        system.push({
            type: 'Planet',
            size: (Math.floor(Math.random() * (config.PLANET_SIZE_RANGE.max - config.PLANET_SIZE_RANGE.min + 1) * sizeDistanceFactor) + config.PLANET_SIZE_RANGE.min),
            position: {x: pos.x, y: pos.y, z: pos.z},
            color: '#f0f0f0'
        });

    }

    clearContainer();
    initSystem(system);
    animate();
}

function applySysconf() {
    system.length = 0;

    $('#systemconfigurator table tbody tr').each(function () {

        var pos = $(this).find('td.position').data('value').split(',');

        system.push({
            type: $(this).find('td.type').data('value'),
            size: parseInt($(this).find('td.size').data('value')),
            position: {x: parseInt(pos[0]), y: parseInt(pos[1]), z: parseInt(pos[2])},
            color: $(this).find('td.color').data('value')
        });
    });

    clearContainer();
    initSystem(system);
    animate();
}

function applySaveLoad() {
    system = JSON.parse($('textarea#system').val());

    clearContainer();
    initSystem(system);
    animate();
}

function applyConnections() {

}