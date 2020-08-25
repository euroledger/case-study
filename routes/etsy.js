// Express routes for Etsy API
const url = require('url');
const etsyjs = require('etsy-js');
const utils = require('../utils')
const cors = require('cors');

module.exports = (app) => {
    let userData = {};
    let feedbackObtained = false;

    console.log("ETSY KEYSTRING = ", process.env.ETSY_KEYSTRING);

    const etsyclient = etsyjs.client({
        key: process.env.ETSY_KEYSTRING,
        secret: process.env.ETSY_SHARED_SECRET,
        callbackURL: 'https://localhost:3002/auth/etsy/callback'
    });

    let etsyToken, etsySecret;

    app.get('/auth/etsy', function (req, res) {

        // console.log(">>>> feedbackObtained = ", feedbackObtained);
        // if (feedbackObtained === true) {
        //     res.status(200); // no point going across to etsy if already got the credentials
        //     return;
        // }
        console.log("Get URL for ETSY sign-in");

        etsyclient.requestToken(function (err, response) {
            if (err) {
                return console.log(err);
            }
            etsyToken = response.token;
            etsySecret = response.tokenSecret;
            res.status(200).send(response.loginUrl);
        });
    });

    app.get('/auth/etsy/callback', function (req, res) {
        var query, verifier;

        // parse the query string for OAuth verifier
        query = url.parse(req.url, true).query;
        verifier = query.oauth_verifier;

        console.log("query = ", query);
        console.log("verifier = ", verifier);

        if (userData.body) {
            res.redirect("http://localhost:3000/");
        }
        // final part of OAuth dance, request access token and secret with given verifier
        let ret = etsyclient.accessToken(etsyToken, etsySecret, verifier, function (err, response) {
            // update our session with OAuth token and secret

            let authorisedClient = etsyclient.auth(response.token, response.tokenSecret);

            let user = authorisedClient.user("__SELF__");

            user.find(function (err, body, headers) {
                if (err) {
                    console.log(err);
                }
                if (body) {
                    feedbackObtained = true;
                    userData = body.results[0];
                    console.log(userData);
                    res.redirect("http://localhost:3000/");
                }
            });

        });

        app.get('/api/etsy/feedback', cors(), async function (req, res) {
            console.log("Waiting ETSY for feedback...");
            await utils.until(_ => feedbackObtained === true);

            console.log("ETSY userData = ", userData);
            res.status(200).send(userData);
        });
    });
}