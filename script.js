var context;
var drawVisual;
var canvas, canvasCtx;
var visualSelect, analyser;
var filterNode, low, mid, high;
var buttons, file, fileName;

var arr = {};
arr['rock'] = [20, -10, 20];
arr['pop'] = [0, 15, 0];
arr['jazz'] = [-15, 10, 10];
arr['classic'] = [-10, 10, -10];
arr['none'] = [0, 0, 0];

function stopSound() {
  if (source) {
    source.stop(0);
    buttons[0].disabled = false;
    buttons[1].disabled = true;
  }
}

function playSound() {
  source = context.createBufferSource();
  source.buffer = audioBuffer;
  source.loop = false;
  source.connect(low);
  low.connect(mid);
  mid.connect(high);
  high.connect(analyser);
  analyser.connect(context.destination);
  source.start(0);
  visualize();
  buttons[0].disabled = true;
  buttons[1].disabled = false;
}

function initSound(arrayBuffer) {
  context.decodeAudioData(arrayBuffer, function(buffer) {
    audioBuffer = buffer;
    buttons = document.querySelectorAll('button');
    buttons[0].disabled = false;
    buttons[1].disabled = false;
  }, function(e) {
    console.log('Error decoding', e);
  }); 
}

function initEqualizer() {  
  low = context.createBiquadFilter();
  low.type = 'lowshelf';
  low.frequency.value = 320.0;
  low.Q.value = 0.0;

  mid = context.createBiquadFilter();
  mid.type = 'peaking';
  mid.frequency.value = 1000.0;
  mid.Q.value = 0.0;

  high = context.createBiquadFilter();
  high.type = 'highshelf';
  high.frequency.value = 3200.0;
  high.Q.value = 0.0;
}

function initVisualizer() {
  analyser = context.createAnalyser();
  analyser.minDecibels = -90;
  analyser.maxDecibels = -10;
  analyser.smoothingTimeConstant = 0.85;

  canvas = document.querySelector('.visualizer');
  canvasCtx = canvas.getContext("2d");

  var intendedWidth = document.querySelector('.wrapper').clientWidth;

  canvas.setAttribute('width', intendedWidth);
}

function initEvents() {
  var btnPlay = document.getElementById('play');
  var btnStop = document.getElementById('stop');
  var dropArea = document.getElementById('dropArea');
  var equalizer = document.getElementById('equalizer');
  fileName = document.getElementById('fileName');
  visualSelect = document.getElementById('visual');
  file = document.getElementById('file');

  file.addEventListener('change', function(e) {  
    var reader = new FileReader();
    reader.onload = function(e) {
      initSound(e.target.result);
    };
    fileName.innerHTML = e.target.files[0].name;
    reader.readAsArrayBuffer(e.target.files[0]);

    printMeta(e.target.files[0]);
  }, false);

  equalizer.addEventListener('change', function(e) {  
    changeFilter(equalizer.value);
  }, false);

  btnPlay.addEventListener('click', function(e) {  
    playSound();
  }, false);

  btnStop.addEventListener('click', function(e) {  
    stopSound();
  }, false);

  dropArea.addEventListener('drop', dropEvent, false);
  dropArea.addEventListener('dragover', dragOver, false);
}

function dropEvent(evt) {
  evt.stopPropagation();
  evt.preventDefault();

  var droppedFiles = evt.dataTransfer.files;

  var reader = new FileReader();
  reader.onload = function(e) {
    initSound(e.target.result);
    fileName.innerHTML = droppedFiles[0].name;
  };
  reader.readAsArrayBuffer(droppedFiles[0]);
  printMeta(droppedFiles[0]);
}

function dragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  return false;
}

function visualize() {
  width = canvas.width - 10;
  height = canvas.height;

  analyser.fftSize = 1024;
  var bufferLength = analyser.fftSize;
  var dataArray = new Float32Array(bufferLength);

  canvasCtx.clearRect(0, 0, width, height);

  function draw() {

    drawVisual = requestAnimationFrame(draw);

    analyser.getFloatTimeDomainData(dataArray);

    canvasCtx.fillStyle = '#ebebeb';
    canvasCtx.fillRect(0, 0, width, height);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    var sliceWidth = width * 1.0 / bufferLength;
    var x = 0;
    
    for(var i = 0; i < bufferLength; i++) {
 
      var v = dataArray[i] * 200.0;
      var y = height/2 + v;

      if(i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width-10, canvas.height/2);
    canvasCtx.stroke();
  };

  draw();
}

function changeFilter(filterType){
  values = arr[filterType];
  low.gain.value = values[0];
  mid.gain.value = values[1];
  high.gain.value = values[2];
}

function printMeta(file) {
  id3(file, function(err, tags) {
    var meta = document.getElementById('meta');
    meta.innerHTML = tags.artist+': '+tags.title;
  });
}

function init() {
	try {
		window.AudioContext = window.AudioContext||window.webkitAudioContext;
		context = new AudioContext();

    initEvents();

    initEqualizer();

    initVisualizer();
	}
	catch(e) {
		alert(e);
	}
}

window.addEventListener('load', init, false);