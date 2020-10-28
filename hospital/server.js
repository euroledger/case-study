const http = require('http');
const parser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { createTerminus } = require('@godaddy/terminus');
const express = require('express');
const ngrok = require('ngrok');
const cache = require('./model');
const utils = require('./utils');

const debug = require('debug')('tmp:server');



var fs = require('fs');
var https = require('https');

require('dotenv').config();

// const { AgencyServiceClient, Credentials } = require("@streetcred.id/service-clients");

// const client = new AgencyServiceClient(
//     new Credentials(process.env.ACCESSTOK, process.env.SUBKEY),
//     { noRetryPolicy: true });

const { CredentialsServiceClient, Credentials } = require("@trinsic/service-clients");

const client = new CredentialsServiceClient(
    new Credentials(process.env.ACCESSTOK),
    { noRetryPolicy: true });

var certOptions = {
    key: fs.readFileSync(path.resolve('./cert/server.key')),
    cert: fs.readFileSync(path.resolve('./cert/server.crt'))
}

var app = express();
app.use(cors());
app.use(parser.json());
app.use(express.static(path.join(__dirname, 'build')))


app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/build/index.html'));
});

let acmeCredentialId;
let connectionId;
let registered = false;
let loginConfirmed = false;
let credentialAccepted = false;
let verificationAccepted = false;
let platform;
let name = '';
let connectionAndCredentials;

// WEBHOOK ENDPOINT
app.post('/webhook', async function (req, res) {
    try {
        console.log("got webhook" + req + "   type: " + req.body.message_type);
        if (req.body.message_type === 'new_connection') {

            connectionId = req.body.object_id;

            console.log("new connection notif, connection = ", req.body);
            try {
                // use the connection contract to get the name for the front end to use
                console.log("Calling getConnection with connection id", connectionId);
                connectionContract = await getConnectionWithTimeout(connectionId);
                console.log("--------------->NEW CONNECTION: ", connectionContract);
                name = connectionContract.name;
            } catch (e) {
                console.log(e.message || e.toString());
                return
            }
            registered = true;

            const attribs = cache.get(req.body.object_id);
            console.log("attribs from cache = ", attribs);
            var param_obj = JSON.parse(attribs);

            
            var params =
            {
                // credentialOfferParameters: {
                    definitionId: process.env.CRED_DEF_ID_USER_DETAILS,
                    connectionId: req.body.object_id,
                    credentialValues: {
                        'First Name': param_obj["firstname"],
                        'Last Name': param_obj["lastname"],
                        'Email Address': param_obj["email"],
                        'Country': param_obj["country"],
                        'St Elsewhere Access Token': param_obj["passcode"]
                    // }
                }
            }
            console.log(">>>>>>>>>>>>> Creating credential with params ", params);
            await client.createCredential(params);
            console.log("CREDENTIAL CREATED user details!");
        }
        else if (req.body.message_type === 'credential_request') {
            console.log("cred request notif");
            // if (connected) {
            console.log("IMPORTANT platform = ", platform);

            if (platform === "acme") {
                acmeCredentialId = req.body.object_id;
                console.log("Issuing acme credential to wallet, id = ", acmeCredentialId);
                await client.issueCredential(acmeCredentialId);
            } else {
                // user details
                userRegistrationCredentialId = req.body.object_id;
                console.log("Issuing user details credential to wallet, id = ", userRegistrationCredentialId);
                await client.issueCredential(userRegistrationCredentialId);
            }
            console.log("Credential Issue -> DONE");
            credentialAccepted = true;
            // }
        }
        else if (req.body.message_type === 'verification') {
            console.log("cred verificatation notif");

            console.log(req.body);

            console.log("Getting verification attributes with verification id of ", req.body.object_id);

            let proof = await client.getVerification(req.body.object_id);

            console.log("Proof received; proof data = ", proof["proof"]);

            if (platform === "acme") {
                const data = proof["proof"]["Proof of Invoice"]["attributes"];

                verifyRecord = {
                    invoiceNumber: data["Invoice Number"],
                    hospitalName: data["Hospital Name"],
                    invoiceDate: data["Invoice Date"],
                    insurancePolicyNumber: data["Insurance Policy Number"],
                    invoiceAmount: data["Amount"],
                    treatmentDescription: data["Treatment Description"]
                };

                verificationAccepted = true;

                console.log(verifyRecord);
            } else {

                connectionId = proof["proof"]["Login Verification"]["attributes"]["Acme Access Token"];

                // verify that the connection record exists for this id
                let connectionContract;
                try {
                    connectionContract = await getConnectionWithTimeout(connectionId);
                } catch (e) {
                    console.log(e.message || e.toString());
                    res.status(500).send("connection record not found for id " + connectionId);
                }

                if (connectionContract) {
                    console.log("connectionContract = ", connectionContract);

                    console.log("---------------- GET ALL CREDENTIALS -------------------");

                    // retreive all credentials for this id
                    let credentials = await client.listCredentials();
                    var issuedCredentialsForThisConnection = credentials.filter(function (credential) {
                        return credential.connectionId === connectionId;
                    });
                    console.log(issuedCredentialsForThisConnection)

                    var issuedCredentialsForThisUser = credentials.filter(function (credential) {
                        return credential.state === "Issued" && credential.connectionId === connectionId;
                    });

                    // console.log(issuedCredentialsForThisUser);

                    connectionAndCredentials = {
                        connectionContract: connectionContract,
                        credentials: issuedCredentialsForThisUser
                    }
                    // save the credential IDs of previously issued credentials -> these can be used for revocation
                    issuedCredentialsForThisUser.forEach(credential => {
                        if (credential.values.Platform === "acme") {
                            console.log("-> Setting acmeCredentialId to ", credential.credentialId);
                            acmeCredentialId = credential.credentialId;
                        }
                    });
                    verificationAccepted = true;
                    loginConfirmed = true;
                    // res.status(200).send(connectionAndCredentials);

                } else {
                    console.log("connection record not found for id ", connectionId);
                    res.status(500);
                }
            }
        } else {
            console.log("WEBHOOK message_type = ", req.body.message_type);
            console.log("body = ", req.body);
        }
    }
    catch (e) {
        console.log("/webhook error: ", e.message || e.toString());
    }
});


//FRONTEND ENDPOINTS

app.post('/api/acme/issue', cors(), async function (req, res) {

    console.log("IN /api/acme/issue: attributes = ", req.body);
    platform = "acme";
    if (connectionId) {
        var params =
        {
            credentialOfferParameters: {
                definitionId: process.env.POLICY_ID,
                connectionId: connectionId,
                credentialValues: {
                    "Policy ID": req.body["policyID"],
                    "Effective Date": req.body["effectiveDate"],
                    "Expiry Date": req.body["expiryDate"],
                    "Insurance Company": req.body["insuranceCompany"],
                }
            }
        }
        console.log("issue credential with connection id " + connectionId + " params = ", params);
        await client.createCredential(params);
        console.log("----------------------> CREDENTIAL CREATED!");
        res.status(200).send();
    } else {
        res.status(500).send("Not connected");
    }
});

app.post('/api/verifyinvoice', cors(), async function (req, res) {
    platform = "acme";
    verificationAccepted = false;
    const d = new Date();
    const params =
    {
        verificationPolicyParameters: {
            "name": "Proof of Invoice",
            "version": "1.0",
            "attributes": [
                {
                    "policyName": "Proof of Invoice",
                    "attributeNames": [
                        "Invoice Number",
                        "Hospital Name",
                        "Invoice Date",
                        "Insurance Policy Number",
                        "Amount",
                        "Treatment Description"

                    ],
                    "restrictions": null
                }
            ],
            "predicates": []
        }
    }
    console.log("send verification request, connectionId = ", connectionId, "; params = ", params);
    const resp = await client.sendVerificationFromParameters(connectionId, params);
    res.status(200).send();
});

app.get('/api/verificationreceived', cors(), async function (req, res) {
    console.log("Waiting for verification...");
    await utils.until(_ => verificationAccepted === true);

    res.status(200).send(verifyRecord);
});


async function findClientConnection(connectionId) {
    return await client.getConnection(connectionId);
}

async function getConnectionWithTimeout(connectionId) {
    let timeoutId;

    const delay = new Promise(function (resolve, reject) {
        timeoutId = setTimeout(function () {
            reject(new Error('timeout'));
        }, 3000);
    });

    // overall timeout
    return Promise.race([delay, findClientConnection(connectionId)])
        .then((res) => {
            clearTimeout(timeoutId);
            return res;
        });
}

app.post('/api/login', cors(), async function (req, res) {
    // send connectionless proof request for user registration details

    const policyId = process.env.LOGIN_VERIF_ID;
    const resp = await client.createVerificationFromPolicy(policyId);

    console.log("resp = ", resp);

    res.status(200).send({ login_request_url: resp.verificationRequestUrl });
});

app.get('/api/signout', cors(), async function (req, res) {
    console.log("Signing out...");
    loginConfirmed = false;
    res.status(200).send();
});

app.get('/api/loginconfirmed', cors(), async function (req, res) {
    console.log("Waiting for login confirmation...loginConfirmed = ", loginConfirmed);
    await utils.until(_ => loginConfirmed === true);
    console.log("--> DONE off we go")
    res.status(200).send(connectionAndCredentials);
});


app.post('/api/register', cors(), async function (req, res) {
    console.log("Getting invite...")
    console.log("Invite params = ", req.body);
    const invite = await getInvite(req.body.passcode);
    const attribs = JSON.stringify(req.body);
    console.log("invite= ", invite);
    cache.add(invite.connectionId, attribs);
    console.log("setting invite URL to ", invite.invitationUrl);
    res.status(200).send({ invite_url: invite.invitationUrl });
});

app.post('/api/acme/revoke', cors(), async function (req, res) {
    console.log("revoking acme credential, id = ", acmeCredentialId);
    await client.revokeCredential(acmeCredentialId);
    console.log("ACME Credential revoked!");

    console.log("++++ SEND MESSAGE WITH CONNECTION ID ", connectionId);
    const params =
    {
        basicMessageParameters: {
            "connectionId": connectionId,
            "text": "Acme credential has been revoked. You may want to delete this from your wallet."
        }
    };
    const resp = await client.sendMessage(params);

    console.log("------- Message sent to user's agent !");

    res.status(200).send();
});

app.get('/api/connected', cors(), async function (req, res) {
    console.log("Waiting for connection...");
    await utils.until(_ => registered === true);
    res.status(200).send(name);
});


app.post('/api/credential_accepted', cors(), async function (req, res) {
    console.log("Waiting for credential to be accepted...");
    await utils.until(_ => credentialAccepted === true);
    credentialAccepted = false;
    res.status(200).send();
});


const getInvite = async (id) => {
    try {
        var result = await client.createConnection({
            connectionInvitationParameters: {
                connectionId: id,
                multiParty: false
            }
        });
        console.log(">>>>>>>>>>>> INVITE = ", result);
        return result;
    } catch (e) {
        console.log(e.message || e.toString());
    }
}




/**
 * Listen on provided port, on all network interfaces.
 */

const port = normalizePort('3002');
app.set('port', port);

const server = http.createServer(app);

server.listen(port, async function () {
    const url_val = await ngrok.connect(port);
    console.log("============= \n\n" + url_val + "\n\n =========");
    let response = await client.createWebhook({
        url: url_val + "/webhook",  // process.env.NGROK_URL
        type: "Notification"
    });
    cache.add("webhookId", response.id);
    console.log('Listening on port %d', server.address().port);
});
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    let port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    let bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    let addr = server.address();
    let bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}


// ---------------------------------------------------------------------------------------------
// for graceful closing
// var server = https.createServer(certOptions, app);
// async function onSignal() {
//     var webhookId = cache.get("webhookId");
//     const p1 = await client.removeWebhook(webhookId);
//     return Promise.all([p1]);
// }
// createTerminus(server, {
//     signals: ['SIGINT', 'SIGTERM'],
//     healthChecks: {},
//     onSignal
// });

// const PORT = process.env.PORT || 3002;
// var server = server.listen(PORT, async function () {

//     try {
//         const url_val = process.env.NGROK_URL + "/webhook";

//         console.log("Using ngrok (webhook) url of ", url_val);
//         var response = await client.createWebhook({
//             webhookParameters: {
//                 url: url_val,  // process.env.NGROK_URL
//                 type: "Notification"
//             }
//         });
//     }
//     catch (e) {
//         console.log(e);
//     }

//     cache.add("webhookId", response.id);
//     console.log('Listening on port %d', server.address().port);
// });
