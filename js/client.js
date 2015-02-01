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


$(document).ready(function () {

    $('#mainMenu input#PLANET_SIZE_RANGE_min').val(PLANET_SIZE_RANGE.min);
    $('#mainMenu input#PLANET_SIZE_RANGE_max').val(PLANET_SIZE_RANGE.max);
    $('#mainMenu input#SYSTEM_RADIUS_RANGE_min').val(SYSTEM_RADIUS_RANGE.min);
    $('#mainMenu input#SYSTEM_RADIUS_RANGE_max').val(SYSTEM_RADIUS_RANGE.max);
    $('#mainMenu input#SUN_SIZE_RANGE_min').val(SUN_SIZE_RANGE.min);
    $('#mainMenu input#SUN_SIZE_RANGE_max').val(SUN_SIZE_RANGE.max);
    $('#mainMenu input#NUM_PLANETS').val(NUM_PLANETS);


    $('#mainMenu .modal-footer .btn-primary').click(function () {

        $('#mainMenu .modal-footer .btn').attr('disabled', true);
        $('span#loading').show();

        setTimeout(function() {

            switch($('#mainMenu .tab-content .active').attr('id')) {
                case 'random':

                    PLANET_SIZE_RANGE.min = parseInt($('#mainMenu input#PLANET_SIZE_RANGE_min').val());
                    PLANET_SIZE_RANGE.max = parseInt($('#mainMenu input#PLANET_SIZE_RANGE_max').val());
                    SYSTEM_RADIUS_RANGE.min = parseInt($('#mainMenu input#SYSTEM_RADIUS_RANGE_min').val());
                    SYSTEM_RADIUS_RANGE.max = parseInt($('#mainMenu input#SYSTEM_RADIUS_RANGE_max').val());
                    SUN_SIZE_RANGE.min = parseInt($('#mainMenu input#SUN_SIZE_RANGE_min').val());
                    SUN_SIZE_RANGE.max = parseInt($('#mainMenu input#SUN_SIZE_RANGE_max').val());
                    NUM_PLANETS = parseInt($('#mainMenu input#NUM_PLANETS').val());

                    clearContainer();
                    initRandom();
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

function initRandom() {

    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    camera.position.z = Math.floor(SYSTEM_RADIUS_RANGE.max / 2);

    scene = new THREE.Scene();


    for (var i = 0; i < NUM_PLANETS; i++) {

        var originDistance = Math.floor(Math.random() * (SYSTEM_RADIUS_RANGE.max - SYSTEM_RADIUS_RANGE.min + 1)) + SYSTEM_RADIUS_RANGE.min;

        sizeDistanceFactor = originDistance / SYSTEM_RADIUS_RANGE.max;

        var pos = randomSpherePoint(originDistance);

        var size = Math.floor(Math.random() * (PLANET_SIZE_RANGE.max - PLANET_SIZE_RANGE.min + 1) * sizeDistanceFactor) + PLANET_SIZE_RANGE.min;

        var planet = new THREE.Mesh(new THREE.SphereGeometry(size, 32, 16), new THREE.MeshLambertMaterial({color: 0xf0f0f0}));
        planet.position = pos;
        planet.updateMatrix();
        planet.matrixAutoUpdate = false;
        scene.add(planet);

    }

    var sunsize = Math.floor(Math.random() * (SUN_SIZE_RANGE.max - SUN_SIZE_RANGE.min + 1)) + SUN_SIZE_RANGE.min;

    var sun = new THREE.Mesh(new THREE.SphereGeometry(sunsize, 64, 32), new THREE.MeshLambertMaterial({color: 0xffff00}));
    sun.position.set(0, 0, 0);
    scene.add(sun);

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

function initJson(json) {

    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    camera.position.z = Math.floor(SYSTEM_RADIUS_RANGE.max / 2);

    scene = new THREE.Scene();

    $.each(json, function(idx, obj) {
        switch (obj.type) {
            case 'SUN':
                var sun = new THREE.Mesh(new THREE.SphereGeometry(obj.size, 64, 32), new THREE.MeshLambertMaterial({color: 0xffff00}));
                sun.position.set(obj.position.x, obj.position.y, obj.position.z);
                sun.updateMatrix();
                sun.matrixAutoUpdate = false;
                scene.add(sun);
                break;
            case 'PLANET':
            default:
                var planet = new THREE.Mesh(new THREE.SphereGeometry(obj.size, 32, 16), new THREE.MeshLambertMaterial({color: 0xf0f0f0}));
                planet.position.set(obj.position.x, obj.position.y, obj.position.z);
                planet.updateMatrix();
                planet.matrixAutoUpdate = false;
                scene.add(planet);
                break;
        }
    });

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
        origin = new THREE.Vector3(0, 0, 0)
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