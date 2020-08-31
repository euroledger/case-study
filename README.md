# Case Study: Medical Insurance Demo Quickstart

This is the case study demo application which allows a user to create a new account with a fictional medical insurance company, Acme Insurance, and then, once registered, to create a new insurance policy. Once the new policy is created, Acme issues the new insurance policy certificate as a verifiable credential to the user wallet, which resides on a mobile app.

The insurance certificate credential is a digital representation of a paper insurance certificate, and is proof that the holder of the certificate has a non-revoked insurance policy.

There is a second web application which is a prototype of a hospital website. This site allows the same user as above to request a medical certificate, which represents a proof that the user (patient) has received some medical treatment and the value of that treatment. This user can then request that Acme Insurance request this certificate as proof of treatment received as part of the claims procedure. Once verified, the user is then reimbursed by Acme for medical costs incurred.

The SSI agent communication uses the Trinsic API and the User Wallet is the standard Trinsic Phone App.

# ExpressJS 

The two web servers are written using ExpressJS which allows them to listen to external communications (webhooks) via their SSI agent, and also API calls from the front end instructing the server(s) to perform some action.


# Acme Insurance : Registration 

Registration is carried out by a call from the client to the /api/register endpoint. This creates a connection invite with a createConnection() call to the Trinsic (Aries) API. Once the invite is generated it is returned to the client which encodes it in a QRCode.

The user scans the QRCode which causes an invite to be displayed; if accepted, a callback is fired (via a webhook), received in the /webhooks endpoint. The type of the webhook will be new_connection. 

In response to the webhook event, the server issues a registration credential which contains the entered data plus the connection id generated in the connect process. This "access token" is used in the login procedure via a proof request: the access token is used to reestablish the previously created connection by obtainin the connection record from the issuer (Acme) wallet.

The type of webhook event received in response to a user accepting a credential offer is "credential_request". Once this is received the credential is written to the issuer wallet via an API call: issueCredential(credential id)

# Acme Insurance : Policy Credential

Once the user is registered the New Policy form is displayed. This is an example of the kind of form typically used to enter data about a person's medical situation. Insurance companies use this to tailor a policy and premium to that user's circumstances.

Once the data are entered, the user clicks on "Issue Credential". At this point, in a production system, a data record would be written to a database. Here we just issue a new credential. 

The endpoint for this is /api/acme/issue. Here an API call is made to createCredential with the params being the fields of the credential definition.

As for the registration credential, a webhook is received with type "credential_request". Again to complete the process and write the credential to the issuer wallet, we call issueCredential.This also results in the user wallet seeing the credential state move from "pending" to "issued" (with the date of issuance).

The policy contains 
    policy ID
    effective Date
    expiry Date
    Insurance Company

So in a sense is a digital representation of a traditional paper insurance certificate.

# St Elsewhere Hospital Registration and Proof Request of Insurance Policy

Registration is identical to the Acme registration process.

In order to verify that a particular patient is insured, the hospital sends a proof request to the user. Assuming they have the policy certificate on their phone they can then present this.

The endpoint for requesting a policy is /api/verifypolicy. The fields specified are a subset of the fields of the credential defintion, although in this case we request all fields.

Proof requests can also contain predicates, whereby an attribute value is set according to some rule, e.g., age > 18 as a zero knowledge proof.

Once the credential request has been accepted a webhook is received with a message type of verification.

This message contains a verification id, which must then be used in an API call to getVerification(verification id). This call retrieves the verification record which is then sent back to the client.

# St Elsewhere Invoice Credential

Once the hospital has completed some treatment and needs to request payment, it issues and invoice with the amount and data about the treatment. The client code calls the endpoint /api/hospital/issue where a similar process to the policy credential is followed:
API call to createCredential() followed by a webhook with type credential_request and then a call to issueCredential() to complete the process.

# Acme Insurance : Claims Procedure

The final step in the business workflow is to send a proof request to the user from the insurance company requesting the hospital invoice. This is similar to the previous proof requests. It uses the server endpoint /api/verifyinvoice.

Once the credential request has been accepted a webhook is received with a message type of verification.

This message contains a verification id, which must then be used in an API call to getVerification(verification id). This call retrieves the verification record which is then sent back to the client.

# utils Until() function

Both acme and st elsewher use the utils.until() function to avoid race conditions. This is just a function that polls for a certain boolean expression to be satisfied before it releases the programme flow back to the caller via a resolved promise.

A better solution might be to use web notifications.

# Install and Run ngrok
To run the client app (for acme and st elsewhere it is necessary to install and run the ngrok tunneling software so that webhook calls get routed correctly through to http://localhost:3002 (the express server port for acme). and http://localhost:5002 (the server port for st elsewhere).

https://ngrok.com/download

Once installed set up the config file to contain

~/.ngrok2/ngrok.yml


authtoken: <NGROK YOUR TOKEN>
tunnels:
  acme:
    proto: http
    addr: https://localhost:3002
  stelsewhere:
    proto: http
    addr: 5002

We use one https and one http connection just to illustrate the possibilities for tunneling.


Then start the service with:

./ngrok start -all

You will see something like

    Forwarding                    http://85b3b019da0a.ngrok.io -> http://localhost:5002                                     Forwarding                    https://85b3b019da0a.ngrok.io -> http://localhost:5002                                    Forwarding                    http://ba28cb436dc9.ngrok.io -> https://localhost:3002                                    Forwarding                    https://ba28cb436dc9.ngrok.io -> https://localhost:3002 




In the .env file for acme change the NGROK key as follows:
    
    NGROK_URL='https://ba28cb436dc9.ngrok.io'

In the .env file for st elsewhere change the NGROK key as follows:
    
    NGROK_URL='http://85b3b019da0a.ngrok.io'

Note that the ngrok service is only needed in dev to allow webhook events to be routed from outside a local wifi into a particular PC. In production, as services would be deployed on cloud VPS hosts, this would not be required.
## Install mobile wallet

### iOS
 1. If you are using iOS, download the [Trinsic identity agent](https://apps.apple.com/us/app/streetcred-identity-agent/id1475160728)
 
### Android
 1. If you are using Android, download the app "Trinsic identity wallet" from Play Store

## Steps to run the two servers

### Prepare issuer portal
 1. clone the repository
 `git clone https://github.com/euroledger/capena-delega.git`
 
 1. navigate into the directory
 `cd capena-delega`
 
 1. install the dependencies
 `npm install .`

 1. Open up the repository in a code editor of your choice

 
### Running the application
Assuming everything still works correctly, you are ready to run the application. 

- Run with npm
`npm run start`

- The main screen will be displayed:

    <img src="assets/main.png"
        alt="Organizations"
        style="padding-top: 20px; padding-bottom: 20px" 
        width="600"
        height="400"/>

- The first thing to do is register. Click on the toolbar link and fill out the form:

  <img src="assets/registerscreen.png"
        alt="Organizations"
        style="padding-top: 20px; padding-bottom: 20px" 
        width="700"
        height="400"/>

- If you're using the Streetcred Wallet, make sure your agent is configured to the Sovrin Staging network 

- When you click "Register" a QR Code is displayed. This is the invite to connect. Scan the QR with your mobile wallet

    <img src="assets/qrcode.png"
        alt="Organizations"
        style="padding-top: 20px; padding-bottom: 20px" 
        width="600"
        height="340"/>

This is a connection invitation. Webhooks will automatically issue the User Details credential once this is scanned

- Accept the credential offer

- The User (Registration) credentials will be issued (along with an auto generated passcode)

Once this is done, eBay and Etsy credentials can be imported and then issued to the user wallet. 

To login, a QR Code will be issued 


### Issuing and Revoking Credentials

To load user data from platforms select the platform and click on "Import User Reputation Data". You will be asked to sign in to that platfom.

Once the data are loaded you can then Issue and Revoke credentials. On each occasion you will be asked to confirm or decline this on the mobile wallet app.