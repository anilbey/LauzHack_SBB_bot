var restify = require('restify');
var builder = require('botbuilder');



var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});


var connector = new builder.ChatConnector({
    //appId: "2111b6c3-8f46-4cc7-b25f-48f6a53a201f",
    //appPassword: "Si2TEockygRc3ne545pgLnV"
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());


bot.dialog('/', function (session) {
    console.log("received");
    session.send("Hello World");
});