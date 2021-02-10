//require---------------------------------------------------------
var express=require("express");
var app=express();
const generateUniqueId = require('generate-unique-id');
app.set("view engine","ejs");
 var bodyparser=require("body-parser");
const screenshotmachine = require('screenshotmachine');
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
 app.use(bodyparser.urlencoded({extended:true}));

var webpage={
	name:String,
	url:String,
	id:String
}

//Google API------------------------------------------------------

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}




app.get('/',function(req,res){
	res.render('screenshot');
})
app.post('/screenshot',function(req,res){
	webpage.url=req.body.weburl;
	webpage.name= req.body.webname;
	
	//=req.body.webname;
	const id = generateUniqueId({
		useNumbers:true,
		useLetters:false,
		length: 10,
	});
	webpage.id=id;
	//---------------------
	const Start = () => {
        fs.readFile('credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
            authorize(JSON.parse(content), uploadToDrive);
        });
    }

    const uploadToDrive = auth => {
        const customerKey = '321ae2';
        secretPhrase = 'oquzzzzz';

        
            options = {
                //mandatory parameter
                url: `${webpage.url}`,
                // all next parameters are optional, see our website screenshot API doc for more details
                dimension: '1920x1080',
                device: 'desktop',
                format: 'jpg',
                cacheLimit: '0',
                delay: '200',
                zoom: '100'
            }

            const apiUrl = screenshotmachine.generateScreenshotApiUrl(customerKey, secretPhrase, options);
            const output = `${webpage.id}_${webpage.name}.jpg`;

            screenshotmachine.readScreenshot(apiUrl).pipe(fs.createWriteStream(`./media/${output}`).on('close', function () {
                console.log('Save Done!  File:' + output);

                const drive = google.drive({ version: 'v3', auth });
                const fileMetadata = {
                    'name': output,
                    parents: ['1ODtiMtdp2DBr-4bkbrSW37b1bN1i0JVz']
                };
                const media = {
                    mimeType: 'image/jpeg',
                    body: fs.createReadStream(`./media/${output}`)
                };
                drive.files.create({
                    resource: fileMetadata,
                    media: media,
                    fields: 'id'
                }, function (err) {
                    if (err) {
                        // Handle error
                        console.error(err);
                    } else {
                        console.log('Upload Done! File: ', output);
                    }
                });
            }));


        


    }

    Start();
	
	
	
	
	//------------------------------------
	
	
	
	
	res.redirect('/')
	
	
})


app.listen(3000,function(){
	console.log("The server has started");
});





















