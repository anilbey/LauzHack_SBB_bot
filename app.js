var restify = require('restify');
var builder = require('botbuilder');



var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});


var connector = new builder.ChatConnector({
    appId: "9e3499d5-9ff1-4c6a-95bc-b6b5401ae462",
    appPassword: "ZnEihHXZMFo9Mq899QsbRJp"
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());


bot.dialog('/', function (session) {
    session.send("Hello World");
});