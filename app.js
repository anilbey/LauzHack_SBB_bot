var restify = require('restify');
var builder = require('botbuilder');
var intents = new builder.IntentDialog();
var requestify = require('requestify');

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

        session.dialogData.source = builder.EntityRecognizer.findEntity(args.entities, 'from');
        session.dialogData.destination = builder.EntityRecognizer.findEntity(args.entities, 'destination');


        if (!session.dialogData.source && !session.dialogData.destination) {
            return;
        }


        session.dialogData.destination = session.dialogData.destination.entity;

        if (session.dialogData.source) {
            session.dialogData.source = session.dialogData.source.entity;
        }


        if (!time) {
            builder.Prompts.time(session, 'And when would you like to go?');

        } else {
            session.dialogData.timestamp = time.getTime();
            next();
        }
    },
    function (session, results, next) {
        var time;
        if (results.response) {
            session.dialogData.when = results.response;
            console.log(results.response);
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
            next();
        }
    },

    function (session, results, next) {
        if (results.response || session.dialogData.source) {
            if (!session.dialogData.source) {
                session.dialogData.source = results.response;
            }

            console.log("checking trains");
            if (typeof (session.dialogData.timestamp) == "object") {

                session.dialogData.timestamp = session.dialogData.timestamp.toISOString();
            }
            var myRequest = 'http://transport.opendata.ch/v1/connections?from=' +
                session.dialogData.source +
                '&to=' + session.dialogData.destination +
                '&datetime=' +
                session.dialogData.timestamp;
            console.log(myRequest);

            session.send('Good! let me find you how to go from ' + session.dialogData.source + ' to ' +
                session.dialogData.destination + " " + session.dialogData.when + "...");
            session.sendTyping();

            console.log("sent mex");
            requestify.get(myRequest)
                .then(function (response) {
                    console.log("XHR");
                    session.send("There are " + response.getBody().connections.length + " solutions");
                    session.dialogData.tickets = response.getBody().connections;
                    for (var x = 0; x < response.getBody().connections.length; x++) {

                        var mySolutions = printSolution(response.getBody().connections[x]);
                        session.send((x + 1) + ") " + mySolutions);

                    }
                    console.log("now next");
                    next();
                });

        } else {
            session.send('Sorry, I cannot help you');
        }
    },
    function (session, results) {
        builder.Prompts.text(session, "In which ticket are you interested?");

    }, function (session, results) {

        if (results.response) {

            var numberChosen = Number(results.response);
            var connection = session.dialogData.tickets[numberChosen - 1];

            for (var x = 0; x < connection.sections.length; x++) {
                var mySolutions = printProductSolution(session.dialogData.tickets[numberChosen - 1].sections[x]);
                session.send(mySolutions);
            }
            var urlLink = 'If you want to buy the ticket, go here: ';
            urlLink += 'https://int-www.sbb.ch/ticketshop/b2c/adw.do?artikelnummer=125&von=';
            urlLink += session.dialogData.source;
            urlLink + '&nach=';
            urlLink += session.dialogData.destination;
            urlLink += '&reiseDatum=';
            urlLink += session.dialogData.timestamp;

            console.log(String(urlLink));
            session.send(String(urlLink));
        }


        session.endDialog();
    }


]);


function printProductSolution(connection) {

    var res = "";

    var departure = new Date(connection.departure.departure).toGMTString();
    var arrival = new Date(connection.arrival.arrival);

    arrival = (arrival.getHours() - 1) + ":" + arrival.getMinutes();


    var locationName = connection.departure.location.name;
    var via = connection.journey.name;
    var locationArrival = connection.arrival.location.name;

    res += "Departure: " + departure;
    res += " from: " + locationName;
    res += " via: " + via;
    res += " to: " + locationArrival;
    res += " Arrival: " + arrival;

    return res;
}

function printSolution(connection) {

    var res = "";

    var departure = new Date(connection.from.departure).toGMTString();
    var arrival = new Date(connection.to.arrival).toGMTString();
    var duration = toDuration(connection.duration);

    res += "Starting: " + departure;
    res += " - ";
    res += "Arrival: " + arrival;
    res += " - ";
    res += "Duration: " + duration;

    return res;
}
function toDuration(duration) {
    var result = "";
    duration = duration.split("d");

    var day = duration[0];

    var mytime = duration[1];

    if (Number(day) == 1) {
        result += Number(day) + " day";
    } else if (Number(day) >= 1) {
        result += Number(day) + " days";
    }
    var splittedTime = mytime.split(":");

    result += splittedTime[0] + "h ";
    result += splittedTime[1] + "m";
    return result;
}