const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');
const { text } = require('express');

app.use(express.static('public'));
app.use(bodyParser.json());      
app.use(bodyParser.urlencoded({     
    extended: true
}));


// endpoint URL for my region
var azure_convert_url = "https://eastus.tts.speech.microsoft.com/cognitiveservices/v1"
// endpoint to get access toke to use speech service for my region above
var azure_auth_url = "https://eastus.api.cognitive.microsoft.com/sts/v1.0/issueToken"


/* my API key would go here. This would be sent to the access token endpoint to get the access token, which would be used
to then get access to the API URL and convert my text to speech.
*/
var azure_key = "";


// name of my voice. This is sent in the body
var voice_name = "Microsoft Server Speech Text to Speech Voice (en-US, AriaNeural)";

/* 
setting the variable to this, if it is blank letting the user know to enter in text. If the users enters in text,
then this text variable is replaced with the entered text.
*/
var input_text = "Please enter text to convert to speech.";


// this gets the index page where the user enters in the text to conver to speech. This page is the UI.
app.get('/', (req, res) => {
    console.log("Index page successfully loaded.");
    res.sendFile(__dirname + '/index.html');
});


/* This is what I call a blank URL. This is because it doesn't return a page with UI/UX. This endpoint is used to connect 
with Azure and conver the text to speech. Once the user hits the submit button, the entered text is sent to this endpoint.
This endpoint is the one that will access the Microsoft API and pass the entered text in to convert to speech.
*/
app.get('/convert', (req, res) => {
    
    /* 
    If statmeent to make sure there is entered text. If so, then we set the target_text variable to the entered text.
    If there is not entered text, then we set the target text to "Please enter text to convert to speech." to speak outloud.
    */
    if (req.query.input.length > 0){
        input_text = req.query.input;
    } else {
        input_text = "Please enter text to convert to speech."
    }
    /*
    Step 1 is to send a post request, to the authentication url, with our subscription key. This verifies that we are actually
    enrolled in the plan. The header needs to be as stated with the API key which is geenrated when you enroll in Azure.
    */
    request({
        method: 'POST',
        uri: azure_auth_url,
        headers: {
            'Ocp-Apim-Subscription-Key': azure_key
        }
    }, 
    
    /*
    Step 2 is once the autentication is complete, Azure sends an access token in the body, back to you. This is only done
    if the API Key is real.

    We need to retrieve the access token and send it to the API URL (above) because it acts as a "key" to unlock the software,
    which will convert our text to speech and send back an audio which our browser will play.

    We create a function to handle the response from the request above. We say, if there is an error, we want to print the 
    error in the console log. This is the other most else statement below. If there is no error and the response code is 200 
    (successful) then we can proceed to send another post request to the API URL because Azure was able to send us an access 
    token. This is the outer most if statement below.

    Inside this if statement, we retrive the body, which is the access token and save it in a variable. Within the "if" 
    statement we create another request, this time to the API URL. The headers are exactly, the way they are written based 
    on the Azure documentation. The body, includes the name of the neural voice we are using as well as the user input text we 
    retreived. 

    Since we are creating another request, we need a nested "if-else" statement within our parent if statement, to handle the
    reponse. Like before, if there is an error, we want to print the error in the console log. Otherwise, if there is no error 
    and the response code is 200 (successful) then in the console log, we print successful and our browser automatically 
    "plays" the text, which Azure converted to speech. This set of function and if-else statements is inside our parent if 
    statement.

    That is it! This is how the endpoint converts text to speech!
    */
    
    function (error, response, body) {
        if (response.statusCode == 200) {
            var accessToken = body;
            request({
                method: 'POST',
                uri: azure_convert_url,
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'User-Agent': 'text-to-speech',
                    'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
                    'Content-Type': 'application/ssml+xml',
                    'cache-control': 'no-cache',

                },
                body: '<speak version=\'1.0\' xml:lang=\'en-US\'>\n<voice  name=\''+ voice_name +'\'>' + input_text + '</voice> </speak>'
            }, 

                function (error, response, body){
                    if (response.statusCode == 200) {
                        console.log("Success! We have converted the following to speech: " + input_text);
                    } else {
                        console.log(error)
                    }
                }).pipe(res);
        } else {
           console.log(error);
        }
    });
});

var port = 3000;
app.listen(port, () => console.log('Listening on port 3000!'));