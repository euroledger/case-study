const eBayApi = require('@hendt/ebay-api');
const utils = require('../utils');
const cors = require('cors');

module.exports = (app) => {
    let ebayUserData = {};
    let feedbackObtained = false;

    const eBay = new eBayApi({
        appId: 'MikeRich-EuroLedg-PRD-f193ff38b-ecdaff89',
        certId: 'PRD-193ff38bb57e-c123-43e7-ac39-b145',
        sandbox: false,
        siteId: eBayApi.SiteId.EBAY_GB, // see https://developer.ebay.com/DevZone/merchandising/docs/Concepts/SiteIDToGlobalID.html

        // optinal parameters, should be omitted if not used
        devId: '5ac3b11b-0734-4a47-a382-726a92d7a7aa', // required for traditional trading API
        ruName: 'Mike_Richardson-MikeRich-EuroLe-jkelbu' // Required for authorization code grant
    });

    app.get('/auth/ebay', cors(), function (req, res) {

        console.log("Get URL for eBay sign-in");
        const authUrl = eBay.auth.oAuth2.generateAuthUrl();
        console.log(authUrl);

        // better to use res.redirect here but that causes a CORS error which 
        // has no obvious solution
        // so send the url back to the client and do the redirect there
        res.status(200).send(authUrl);
    });

    // this endpoint is a requirement of the eBAY API. Not sure what it is supposed to do
    app.get('/auth/privacy', cors(), function (req, res) {
        res.send("You are ok with us!"); // TODO privacy statement??
    });

    app.get('/auth/ebay/callback',
        async (req, res) => {
            // req.body.query contains the code to be used for API calls (user token)
            const code = req.query.code;
            try {
                // exchange code for access token
                const token = await eBay.auth.oAuth2.getToken(code);
                eBay.auth.oAuth2.setCredentials(token);

                const data = await eBay.trading.GetUser();
                console.log(data);

                feedbackObtained = true;
                ebayUserData = data.User;

                // res.status(200);
                res.redirect("http://localhost:3000/");
            } catch (error) {
                console.log(error);
                console.log(`Error to get Access token :${JSON.stringify(error)}`);
            }
        }
    );

    app.get('/api/ebay/feedback', cors(), async function (req, res) {
        console.log("Waiting for EBAY feedback...");
        await utils.until(_ => feedbackObtained === true);
        res.status(200).send(ebayUserData);
    });
    
};