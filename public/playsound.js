window.addEventListener('load', init, false);
function init() {
    try { 
        context = new AudioContext();
        console.log('Init completed.');
    }
    catch(e) {
        alert('Web Audio API is not supported in this browser!');
    }
}

function play(){
    var request = new XMLHttpRequest();
    var input_text = $('#textarea').val();
    var convert_url = "/convert?input=" + input_text;
    request.open('GET', convert_url, true );
    request.responseType = 'arraybuffer';
    request.onload = function() {
        var context = new AudioContext();
        var audioSource = context.createBufferSource();
        audioSource.connect(context.destination);
        context.decodeAudioData(request.response, function(res) {
            audioSource.buffer = res;
            audioSource.start(0);
        });
    }
    request.send();
}