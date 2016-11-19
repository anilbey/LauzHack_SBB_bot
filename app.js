var restify = require('restify');
var builder = require('botbuilder');
var intents = new builder.IntentDialog();
var request = require('request');

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});


var connector = new builder.ChatConnector({
    appId: "2111b6c3-8f46-4cc7-b25f-48f6a53a201f",
    appPassword: "Si2TEockygRc3ne545pgLnV"
});

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());


// Create LUIS recognizer that points at our model and add it as the root '/' dialog for our Cortana Bot.
var model = 'https://api.projectoxford.ai/luis/v2.0/apps/1f93109d-4c78-48fe-b4a0-7e042ea6109d?subscription-key=15c26916b6ed43c8adb3f34f6ef76277&verbose=true';
var recognizer = new builder.LuisRecognizer(model);
var dialog = new builder.IntentDialog({recognizers: [recognizer]});
bot.dialog('/', dialog);

dialog.matches('search train', [
    function (session, args, next) {

        session.dialogData.when = builder.EntityRecognizer.findEntity(args.entities, 'builtin.datetime.date');
        if (session.dialogData.when) {
            session.dialogData.when = session.dialogData.when.entity;
        }
        var time = builder.EntityRecognizer.resolveTime(args.entities);

        session.dialogData.source = builder.EntityRecognizer.findEntity(args.entities, 'source');
        session.dialogData.destination = builder.EntityRecognizer.findEntity(args.entities, 'destination');
        session.dialogData.destination = session.dialogData.destination.entity;

        if (session.dialogData.source) {
            session.dialogData.source = session.dialogData.source.entity;
        }

        if (!time) {
            builder.Prompts.text(session, 'And when would you like to go?');

        } else {
            session.dialogData.timestamp = time.getTime();
            console.log("set time");
            next();
        }
    },
    function (session, results, next) {
        var time;
        if (results.response) {
            console.log("response ricevuta setto time");
            session.dialogData.when = results.response;
            time = builder.EntityRecognizer.resolveTime([results.response]);
        } else if (session.dialogData.timestamp) {
            time = new Date(session.dialogData.timestamp);

        }
        session.dialogData.timestamp = time;


        next();
    },
    function (session, results, next) {

        if (!session.dialogData.source) {
            builder.Prompts.text(session, 'And from where are you going?');
        } else {
            next({response: source});
        }
    },

    function (session, results) {
        if (results.response) {
            session.dialogData.source = results.response;


            builder.Prompts.text(session, 'Good! here how you can go from ' + session.dialogData.source + ' to ' +
                session.dialogData.destination + " " + session.dialogData.when);


            request({
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                uri: 'http://transport.opendata.ch/v1/connections?from=Lausanne&to=Zürich+HB&datetime=2016-11-20T00%3A00',
                method: 'GET'
            }, function (err, res, body) {
                if (err) {
                    return console.log('Error:' + error);
                    builder.Prompts.text("error");
                }
                if (res.statusCode !== 200) {
                    return console.log('Invalid Status Code Returned:', res.statusCode);

                    builder.Prompts.text("505");
                }
                builder.Prompts.text("workerd");
            });


        } else {
            session.send('Sorry, I cannot help you');
        }
    }

]);
