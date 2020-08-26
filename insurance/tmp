var http = require('http');
var parser = require('body-parser');
var cors = require('cors');
var path = require('path');
var { createTerminus } = require('@godaddy/terminus');
var express = require('express');
var ngrok = require('ngrok');
var cache = require('./model');
var utils = require('./utils');

require('dotenv').config();

const { AgencyServiceClient, Credentials } = require("@streetcred.id/service-clients");
console.log("ACCESSTOK = ", process.env.ACCESSTOK);
const client = new AgencyServiceClient(new Credentials(process.env.ACCESSTOK, process.env.SUBKEY));

var app = express();
app.use(cors());
app.use(parser.json());
app.use(express.static(path.join(__dirname, 'build')))

app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, '/build/index.html'));
});

let credentialId;
let connectionId;
let connected = false;
let credentialAccepted = false;


// WEBHOOK ENDPOINT
app.post('/webhook', async function (req, res) {
    try {
        console.log("got webhook" + req + "   type: " + req.body.message_type);
        if (req.body.message_type === 'new_connection') {
            console.log("new connection notif, connectionId = ", req.body.object_id);
            const attribs = cache.get(req.body.object_id);
            console.log("attribs = ", attribs);
            var param_obj = JSON.parse(attribs);
            var params =
            {
                credentialOfferParameters: {
                    definitionId: process.env.CRED_DEF_ID,
                    connectionId: req.body.object_id,
                    credentialValues: {
                        "User Name": param_obj["name"],
                        "Feedback Score": param_obj["score"]
                    }
                }
            }
            await client.createCredential(params);
            connected = true;
        }
        else if (req.body.message_type === 'credential_request') {
            console.log("cred request notif");

            const attribs = cache.get(req.body.data.ConnectionId)
            if (attribs) {
                var param_obj = JSON.parse(attribs);

                credentialId = req.body.object_id
                await client.issueCredential(credentialId);
                console.log("Credential Issue -> DONE");
                credentialAccepted = true;
            }
        }
    }
    catch (e) {
        console.log("/webhook: ", e.message || e.toString());
    }
});

//FRONTEND ENDPOINT
app.post('/api/issue', cors(), async function (req, res) {
    const invite = await getInvite();
    const attribs = JSON.stringify(req.body);

    console.log("invite= ", invite);
    cache.add(invite.connectionId, attribs);
    connectionId = invite.connectionId;
    res.status(200).send({ invite_url: invite.invitation });
});

app.post('/api/reissue', cors(), async function (req, res) {
    console.log("reissue params = ", req.body);
    var params =
    {
        credentialOfferParameters: {
            definitionId: process.env.CRED_DEF_ID,
            connectionId: connectionId,
            credentialValues: {
                "User Name":req.body["name"],
                "Feedback Score":req.body["score"]
            }
        }
    }
    await client.createCredential(params);
    res.status(200).send();
});

app.post('/api/revoke', cors(), async function (req, res) {
    console.log("revoking credential, id = ", credentialId);
    await client.revokeCredential(credentialId);
    console.log("Credential revoked!");
    res.status(200).send();
});

app.post('/api/connected', cors(), async function (req, res) {
    console.log("Waiting for connection...");
    await utils.until(_ => connected === true);
    res.status(200).send();
});


app.post('/api/credenial_accepted', cors(), async function (req, res) {
    console.log("Waiting for credential to be accepted...");
    await utils.until(_ => credentialAccepted === true);
    res.status(200).send();
});

const getInvite = async () => {
    try {
        var result = await client.createConnection({
            connectionInvitationParameters: {
                connectionId: "unique id",
                multiParty: false
            }
        });
        return result;
    } catch (e) {
        console.log(e.message || e.toString());
    }
}

// for graceful closing
var server = http.createServer(app);

async function onSignal() {
    var webhookId = cache.get("webhookId");
    const p1 = await client.removeWebhook(webhookId);
    return Promise.all([p1]);
}
createTerminus(server, {
    signals: ['SIGINT', 'SIGTERM'],
    healthChecks: {},
    onSignal
});

const PORT = process.env.PORT || 3002;
var server = server.listen(PORT, async function () {
    const url_val = await ngrok.connect(PORT);
    console.log("============= \n\n" + url_val + "\n\n =========");
    var response = await client.createWebhook({
        webhookParameters: {
            url: url_val + "/webhook",  // process.env.NGROK_URL
            type: "Notification"
        }
    });

    cache.add("webhookId", response.id);
    console.log('Listening on port %d', server.address().port);
});