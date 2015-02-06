var container, camera, controls, scene, renderer, cameralight, stats;

var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;
var VIEW_ANGLE = 45;
var ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT;
var NEAR = 0.1;
var FAR = 600000;


var PLANET_SIZE_RANGE = {min: 5, max: 80};
var SYSTEM_RADIUS_RANGE = {min: 500, max: 12000};
var SUN_SIZE_RANGE = {min: 120, max: 240};

NUM_PLANETS = 400;

var system = [];


$(document).on('change', '.btn-file :file', function() {
    var input = $(this),
        numFiles = input.get(0).files ? input.get(0).files.length : 1,
        label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    input.trigger('fileselect', [numFiles, label]);
});

$(document).ready( function() {

    $('div#menu button').trigger('click');

    $('#mainMenu input#PLANET_SIZE_RANGE_min').val(PLANET_SIZE_RANGE.min);
    $('#mainMenu input#PLANET_SIZE_RANGE_max').val(PLANET_SIZE_RANGE.max);
    $('#mainMenu input#SYSTEM_RADIUS_RANGE_min').val(SYSTEM_RADIUS_RANGE.min);
    $('#mainMenu input#SYSTEM_RADIUS_RANGE_max').val(SYSTEM_RADIUS_RANGE.max);
    $('#mainMenu input#SUN_SIZE_RANGE_min').val(SUN_SIZE_RANGE.min);
    $('#mainMenu input#SUN_SIZE_RANGE_max').val(SUN_SIZE_RANGE.max);
    $('#mainMenu input#NUM_PLANETS').val(NUM_PLANETS);

    var sysconf_template_row = $('#systemconfigurator table tbody tr:first-of-type').detach();

    $('[data-action="sysconf-add"]').click(function () {

        var new_row = sysconf_template_row.clone();

        var sysconf_type = $('select#sysconf_type option:selected');
        var sysconf_size = $('input#sysconf_size');
        var sysconf_position = $('input#sysconf_position');
        var sysconf_color = $('input#sysconf_color');

        new_row.find('td.type').html(sysconf_type.text());
        new_row.find('td.type').data('value', sysconf_type.val());
        new_row.find('td.size').html(sysconf_size.val());
        new_row.find('td.size').data('value', sysconf_size.val());
        new_row.find('td.position').html('('+sysconf_position.val()+')');
        new_row.find('td.position').data('value', sysconf_position.val());
        new_row.find('td.color').find('span').css('background-color', sysconf_color.val());
        new_row.find('td.color').data('value', sysconf_color.val());//.replace(/\#/, '0x'));

        new_row.appendTo('#systemconfigurator table tbody');

        $('[data-action="sysconf-remove"]').unbind('click').click(function () {
            $(this).closest('tr').remove();
        });
    });

    $('[data-action="system-save"]').click(function () {
        var blob = new Blob($('textarea#system').val().split('\n'), {type: "text/x-json;charset=utf-8"});
        saveAs(blob, "system.json");
    });

    $('[data-action="system-load"]').click(function () {

        if($('#loadfile').prop("files").length == 1) {
            var file = $('#loadfile').prop("files")[0];
            var reader = new FileReader();
            reader.onload = function (e) {
                var dataPrefix = 'base64,';
                $('textarea#system').html(atob(e.target.result.substr(e.target.result.lastIndexOf(dataPrefix)+dataPrefix.length)));
            };

            reader.readAsDataURL(file);
        }

    });

    $('.btn-file :file').on('fileselect', function(event, numFiles, label) {

        var input = $(this).parents('.input-group').find(':text'),
            log = numFiles > 1 ? numFiles + ' files selected' : label;

        if( input.length ) {
            input.val(log);
        } else {
            if( log ) alert(log);
        }

    });

    $('#mainMenu').on('show.bs.modal', function () {
        $('textarea#system').html(JSON.stringify(system));
    });

    $('#mainMenu .modal-footer .btn-primary').click(function () {

        $('#mainMenu .modal-footer .btn').attr('disabled', true);
        $('span#loading').show();

        setTimeout(function() {

            switch($('#mainMenu .tab-content .active').attr('id')) {

                case 'random':

                    system.length = 0;

                    PLANET_SIZE_RANGE.min = parseInt($('#mainMenu input#PLANET_SIZE_RANGE_min').val());
                    PLANET_SIZE_RANGE.max = parseInt($('#mainMenu input#PLANET_SIZE_RANGE_max').val());
                    SYSTEM_RADIUS_RANGE.min = parseInt($('#mainMenu input#SYSTEM_RADIUS_RANGE_min').val());
                    SYSTEM_RADIUS_RANGE.max = parseInt($('#mainMenu input#SYSTEM_RADIUS_RANGE_max').val());
                    SUN_SIZE_RANGE.min = parseInt($('#mainMenu input#SUN_SIZE_RANGE_min').val());
                    SUN_SIZE_RANGE.max = parseInt($('#mainMenu input#SUN_SIZE_RANGE_max').val());
                    NUM_PLANETS = parseInt($('#mainMenu input#NUM_PLANETS').val());

                    system.push({
                        type: 'Sun',
                        size: (Math.floor(Math.random() * (SUN_SIZE_RANGE.max - SUN_SIZE_RANGE.min + 1)) + SUN_SIZE_RANGE.min),
                        position: {x: 0, y: 0, z: 0},
                        color: '#ffff00'
                    });

                    for (var i = 0; i < NUM_PLANETS; i++) {

                        var originDistance = Math.floor(Math.random() * (SYSTEM_RADIUS_RANGE.max - SYSTEM_RADIUS_RANGE.min + 1)) + SYSTEM_RADIUS_RANGE.min;
                        var sizeDistanceFactor = originDistance / SYSTEM_RADIUS_RANGE.max;
                        var pos = randomSpherePoint(originDistance);

                        system.push({
                            type: 'Planet',
                            size: (Math.floor(Math.random() * (PLANET_SIZE_RANGE.max - PLANET_SIZE_RANGE.min + 1) * sizeDistanceFactor) + PLANET_SIZE_RANGE.min),
                            position: {x: pos.x, y: pos.y, z: pos.z},
                            color: '#f0f0f0'
                        });

                    }


                    clearContainer();
                    initSystem(system);
                    animate();

                    break;

                case 'systemconfigurator':

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

                    break;



                case 'saveload':
                    system = JSON.parse($('textarea#system').val());

                    clearContainer();
                    initSystem(system);
                    animate();

                    break;



            }

            $('#mainMenu').modal('hide');
            $('#mainMenu .modal-footer .btn').removeAttr('disabled');
            $('span#loading').hide();

        },50);
    });

    //initRandom();
    //animate();

});


function clearContainer() {
    $('#container > *').remove();
    $('#stats > *').remove();
}

function initSystem(system) {

    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    camera.position.z = Math.floor(SYSTEM_RADIUS_RANGE.max / 2);

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
                console.log(planet);
                break;
            case 'PLANET':
                var color = new THREE.Color(obj.color);
                var planet = new THREE.Mesh(new THREE.SphereGeometry(obj.size, 32, 16), new THREE.MeshLambertMaterial({color: color}));
                planet.position.set(obj.position.x, obj.position.y, obj.position.z);
                planet.updateMatrix();
                planet.matrixAutoUpdate = false;
                scene.add(planet);
                console.log(planet);
                break;
            default:
                console.error(obj); throw 'the entered object type is not supported';
                break;
        }
    }

    cameralight = new THREE.DirectionalLight(0xffffff, 1);
    cameralight.position.set(camera.position.x, camera.position.y, camera.position.z);
    scene.add(cameralight);

    var ambLight = new THREE.AmbientLight(0x010101);
    scene.add(ambLight);

    stats = new Stats();
    document.getElementById('stats').appendChild( stats.domElement );

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