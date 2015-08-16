var context;
var drawVisual;
var canvas, canvasCtx;
var visualSelect, analyser;


function stopSound() {
  if (source) {
    source.stop(0);
  }
}

function playSound() {
  source = context.createBufferSource(); // Global so we can .noteOff() later.
  source.buffer = audioBuffer;
  source.loop = false;
  source.connect(analyser);
  analyser.connect(context.destination);
  source.start(0); 
  console.log(source);
  visualize();
}

function initSound(arrayBuffer) {
  context.decodeAudioData(arrayBuffer, function(buffer) {
    audioBuffer = buffer;
    console.log(audioBuffer);
    var buttons = document.querySelectorAll('button');
    buttons[0].disabled = false;
    buttons[1].disabled = false;
    console.log(buttons);
  }, function(e) {
    console.log('Error decoding', e);
  }); 
}

function dropEvent(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var droppedFiles = evt.dataTransfer.files;

    var reader = new FileReader();
    reader.onload = function(e) {
      console.log(droppedFiles[0]);
      initSound(e.target.result);
    };
    reader.readAsArrayBuffer(droppedFiles[0]);
    
}

function dragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    return false;
}

window.addEventListener('load', init, false);
function init() {
	try {
		window.AudioContext = window.AudioContext||window.webkitAudioContext;
		context = new AudioContext();

    visualSelect = document.getElementById("visual");
    var file = document.getElementById('file');
    var btnPlay = document.getElementById('play');
    var btnStop = document.getElementById('stop');
    var dropArea = document.getElementById('dropArea');

    analyser = context.createAnalyser();
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.85;

    canvas = document.querySelector('.visualizer');
    canvasCtx = canvas.getContext("2d");
    console.log(canvasCtx);

    var intendedWidth = document.querySelector('.wrapper').clientWidth;

    canvas.setAttribute('width',intendedWidth);

    visualSelect = document.getElementById("visual");

    var drawVisual;

    file.addEventListener('change', function(e) {  
      var reader = new FileReader();
      reader.onload = function(e) {
        initSound(e.target.result);
      };
      reader.readAsArrayBuffer(e.target.files[0]);
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
	catch(e) {
		alert('Web Audio API is not supported in this browser');
		alert(e);
	}
}


function visualize() {
  WIDTH = canvas.width;
  HEIGHT = canvas.height;

  analyser.fftSize = 1024;
  var bufferLength = analyser.fftSize;
  console.log(bufferLength);
  var dataArray = new Float32Array(bufferLength);

  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

  function draw() {

    drawVisual = requestAnimationFrame(draw);

    analyser.getFloatTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    var sliceWidth = WIDTH * 1.0 / bufferLength;
    var x = 0;
    
    for(var i = 0; i < bufferLength; i++) {
 
      var v = dataArray[i] * 200.0;
      var y = HEIGHT/2 + v;

      if(i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height/2);
    canvasCtx.stroke();
  };

  draw();

  

}