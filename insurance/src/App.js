import React, { Component } from 'react';
import './button.css';
import claimItems from './components/Fields/claim';
import newPolicyItems from './components/Fields/newpolicy';
import RegistrationDialog from './components/RegistrationDialog';
import NavBar from './components/NavBar';
import Form from './components/Form';
import Paper from '@material-ui/core/Paper';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import TabPanel from './components/TabPanel';

import GlobalCss from './components/Global';

import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import axios from 'axios';
import QRcode from 'qrcode.react';
import crypto from 'crypto';
import acmeRoutes from './routes/acme';
import signInRoutes from './routes/signInRoutes';

axios.defaults.baseURL = 'https://localhost:3002/';
axios.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';

const policyID = Math.floor(10000000 + Math.random() * 90000000);

const muiTheme = createMuiTheme({
    typography: {
        // "fontFamily": `"Roboto", "Helvetica", "Arial", sans-serif`,
        "fontFamily": `"Lato","Arial","Helvetica","FreeSans","sans-serif"`,
        "fontSize": 14,
        "fontWeightLight": 300,
        "fontWeightRegular": 400,
        "fontWeightMedium": 500
    }
});
const initState = {
    policy: {
        policyID: "",
        effectiveDate: "",
        expiryDate: "",
        insuranceCompany: "Acme",
        smoker: "",
        drinker: "",
        age: "",
        illnesses: "",
        active: "",
        socialSecurityNumber: ""
    },
    claim: {
        invoiceNumber: "",
        hospitalName: "",
        invoiceDate: "",
        insurancePolicyNumber: "",
        invoiceAmount: "",
        treatmentDescription: ""
    },

    qr_open: false,
    welcome_open: true,
    qr_hasClosed: false,
    qr_placeholder: "",
    invite_url: "",
    login_url: "",
    registering: false,
    loggingIn: false,
    acme: {
        qr_feedbackCollected: false,
        credential_accepted: true,
        verification_accepted: true,
        has_been_revoked: true,
        loading: false,
        hospital_certificate_received: false
    },

    register: false,
    register_form_open: false,
    login: false,
    // login_form_open: false,
    firstname: '',
    lastname: '',
    email: '',
    connection_name: sessionStorage.getItem("name"),
    country: '',
    collapse_open: false,
    login_loading: false,
    userData: {},
    value: 0
};
export class App extends Component {

    constructor(props) {
        super(props);
        this.state = initState;
    }

    setCollapseClosed() {
        this.setState({
            collapse_open: false
        });
    }

    onIssue = async () => {
        const effectiveDate = this.formatDate(new Date(), 0);
        const expiryDate = this.formatDate(new Date(), 1);
        const policyDetails = {
            policyID: policyID.toString(),
            effectiveDate: effectiveDate,
            expiryDate: expiryDate,
            insuranceCompany: this.state.policy.insuranceCompany
        }

        this.setState(prevState => ({
            acme: { ...prevState.acme, credential_accepted: false }
        }));
        await acmeRoutes.issue(policyDetails);
        this.setState(prevState => ({
            acme: { ...prevState.acme, credential_accepted: true, has_been_revoked: false },
            policy: { ...prevState.policy, policyID: policyID },
            // claim: { ...prevState.policy, policyID: policyID, customerName: this.state.connection_name }
        }));
    }

    onRequestCertificate = async () => {
        // fire a proof request for the hospital certificate

        this.setState(prevState => ({
            acme: { ...prevState.acme, verification_accepted: false },
        }));

        let resp;
        try {
            console.log("VERIFY INVOICE....");
            resp = await acmeRoutes.verifyInvoice();
            console.log("ok! resp = ", resp);
        }
        catch (e) {
            console.log(e);
            return;
        }

        this.setState(prevState => ({
            acme: { ...prevState.acme, hospital_certificate_received: true, verification_accepted: true, claim_button_disabled: false },
            claim: {...prevState.claim, 
                invoiceNumber: resp.data.invoiceNumber,
                hospitalName: resp.data.hospitalName,
                invoiceDate: resp.data.invoiceDate,
                insurancePolicyNumber: resp.data.insurancePolicyNumber,
                invoiceAmount: resp.data.invoiceAmount,
                treatmentDescription: resp.data.treatmentDescription
            }
        }));
        console.log("ok! resp = ", resp);
    }

    setPolicyFieldValue = (event) => {
        const { target: { name, value } } = event;

        this.setState(prevState => ({
            user: {
                ...prevState.user, [name]: value
            }
        }));
    }


    loadacmeCredentials = (credentials) => {
        const acmeValues = credentials.filter(function (credential) {
            return credential.values.Platform === "acme";
        });

        let acmeFields;
        let creationDate;
        if (acmeValues.length > 0) {
            acmeFields = acmeValues[acmeValues.length - 1].values;
            creationDate = acmeValues[acmeValues.length - 1].issuedAtUtc;
            var d = new Date(creationDate);
            // d.setMonth(d.getMonth() + 1);
            this.setState(prevState => ({
                acme: {
                    ...prevState.acme, qr_feedbackCollected: true,
                    credential_accepted: true, has_been_revoked: false,
                    loading: false
                },
                user: {
                    UserID: acmeFields["User Name"],
                    FeedbackScore: acmeFields["Feedback Score"],
                    RegistrationDate: acmeFields["Registration Date"],
                    UniqueNegativeFeedbackCount: acmeFields["Negative Feedback Count"],
                    UniquePositiveFeedbackCount: acmeFields["Positive Feedback Count"],
                    PositiveFeedbackPercent: acmeFields["Positive Feedback Percent"],
                    CreationDate: this.formatDate(d)
                }
            }));
            sessionStorage.setItem("waitingForacmeUserData", "false");
            // sessionStorage.setItem("acmeUserData", JSON.stringify(this.state.user));
            // sessionStorage.setItem("acmeStateData", JSON.stringify(this.state.acme));
            sessionStorage.setItem("state", JSON.stringify(this.state));

        }
    }

    logout = async () => {
        // reset all forms, reset component state, 
        console.log("Logging out...");
        await signInRoutes.signout();
        console.log("Setting state back to init state")
        this.setState(initState);
        sessionStorage.setItem("state", null);
    }

    postLogin = async () => {
        this.setState({
            login_loading: true, loggingIn: true
        });
        let resp;
        try {
            resp = await signInRoutes.login();
        }
        catch (e) {
            console.log(e);
        }

        console.log("LOGIN ok! resp = ", resp);

        this.setState({
            login_loading: false,
        });

        this.setState({ invite_url: resp.data.login_request_url });

        this.setQRFormOpen(true);

        console.log("WAITING FOR LOGIN DATA...")

        const login = await signInRoutes.waitForLoginConfirmed();

        this.setQRFormOpen(false);

        if (login && login.status === 200) {
            console.log("Connection  = ", login.data);
            const name = login.data.connectionContract.name;

            this.setState({
                login: true, connection_name: name, register: true, loggingIn: false, welcome_open: false
            });
            sessionStorage.setItem("name", name);
            sessionStorage.setItem("login", true);

            // push the credentials back in to the forms for the correct platforms
            this.loadacmeCredentials(login.data.credentials);
        } else {
            console.log("no connection found");
            this.setState({
                collapse_open: true
            });
        }
    }

    postRegister = async (form) => {
        // const passcode = Math.floor(Math.random() * 900000) + 100000;

        const passcode = crypto.randomBytes(20).toString('hex');

        const registrationInfo = {
            firstname: form.firstname,
            lastname: form.lastname,
            email: form.email,
            country: form.country,
            passcode: passcode
        }
        console.log(registrationInfo);
        const response = await signInRoutes.register(registrationInfo);
        console.log(response);

        this.setState({ invite_url: "https://web.cloud.streetcred.id/link/?c_i=" + response.data.invite_url });

        const resp = await signInRoutes.waitForConnection();

        this.setState(prevState => ({
            login: true,
            connection_name: resp.data,
            qr_open: false,
            acme: { ...prevState.acme, credential_accepted: false },
        }));
        sessionStorage.setItem("name", this.state.connection_name);
        sessionStorage.setItem("login", true);

        await signInRoutes.waitForCredentialAccepted();

        console.log("setting login to true");

        this.setState(prevState => ({
            qr_open: false,
            login: true,
            register: true,
            registering: false,
            welcome_open: false,
            acme: { ...prevState.acme, credential_accepted: true },
        }));
    }

    registerFormOpen = (open) => {
        this.setState({
            register_form_open: open,
            registering: true
        });
    }

    loginFormOpen = (open) => {
        this.setState({
            login_formi_open: open
        });
    }

    formatDate = (date, addYears) => {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1), // add 1 as January = 0
            day = '' + d.getDate(),
            year = d.getFullYear() + addYears;

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }

    acmeGetUserData = async () => {
        console.log("Waiting for the feedback to arrive...");
        const user = await acmeRoutes.getFeedback();

        console.log("User Data = ", user.data);

        var d = new Date();
        d.setMonth(d.getMonth() + 1);
        this.setState(prevState => ({
            acme: {
                ...prevState.acme, qr_feedbackCollected: true,
                loading: false
            },
            user: {
                UserID: user.data.UserID,
                FeedbackScore: user.data.FeedbackScore,
                RegistrationDate: user.data.RegistrationDate.substring(0, 10),
                UniqueNegativeFeedbackCount: user.data.UniqueNegativeFeedbackCount,
                UniquePositiveFeedbackCount: user.data.UniquePositiveFeedbackCount,
                PositiveFeedbackPercent: user.data.PositiveFeedbackPercent,
                CreationDate: this.formatDate(d)
            }
        }));

        window.stop();
        sessionStorage.setItem("waitingForacmeUserData", "false");
        // sessionStorage.setItem("acmeUserData", JSON.stringify(this.state.user));
        // sessionStorage.setItem("acmeStateData", JSON.stringify(this.state.acme));
        sessionStorage.setItem("state", JSON.stringify(this.state));

        this.setState({ value: 0 });
    }

    getInitialAcceptedLabel() {
        return (this.state.acme.credential_accepted ? "Create Policy" : "Awaiting Acceptance...");
    }

    getAcceptedLabelRevoke(platform) {
        return (this.state[platform].credential_accepted ? "Cancel Policy" : "Awaiting Acceptance...");
    }

    getCertificateLabel() {
        return (this.state.acme.verification_accepted ? "Request Hospital Invoice" : "Awaiting Proof...");
    }

    getAcceptedLabelIssue(platform) {
        return (this.state[platform].credential_accepted ? "Issue Credential" : "Awaiting Acceptance...");
    }

    getReimburseLabel() {
        return "Submit Claim";
    }

    getDisabled(platform) {
        return (!this.state[platform].credential_accepted || !this.state[platform].verification_accepted);
    }

    getVerifyDisabled(platform) {
        return (this.state[platform].has_been_revoked || !(this.state[platform].verification_accepted));
    }


    issuePolicyButton() {
        if (!this.state.acme.has_been_revoked) {
            return (<Button className="revokebutton" disabled={this.getDisabled("acme")}
                onClick={() => this.onacmeRevoke()}>
                {this.getAcceptedLabelRevoke("acme")}
            </Button>)
        } else {
            return (<Button className="registerbutton" disabled={this.getDisabled("acme")}
                onClick={() => this.onIssue()} >
                {this.getAcceptedLabelIssue("acme")}
            </Button>)
        }

    }

    claimButton() {
        if (!this.state.acme.hospital_certificate_received) {
            return (
                <div style={{ marginTop: '45px', marginBottom: '20px' }}>
                    <Button className="registerbutton" disabled={this.getDisabled("acme")}
                        onClick={() => this.onRequestCertificate()} >
                        {this.getCertificateLabel()}
                    </Button>
                </div>
            )
        } else {
            return (
                <div style={{ marginTop: '45px', marginBottom: '20px' }}>
                    <Button className="revokebutton" disabled={this.getDisabled("acme")}
                        onClick={() => this.onReimburse()} >
                        {this.getReimburseLabel()}
                    </Button>
                </div>
            )
        }
    }

    getQRCodeLabel() {
        return this.state.registering ? "Scan this QR code to Register with Acme Insurance" : "Scan this QR code to Login"
    }

    handleLoginClose() {
        this.setState({
            login_form_open: false
        });
    }

    startLoader() {
        this.setState({
            loading: true
        });
    }

    setQRFormOpen(open) {
        this.setState({
            qr_open: open
        });
    }

    reloadLoginDetails() {
        this.setState({ connection_name: sessionStorage.getItem("name") })
        const l = sessionStorage.getItem("login") === "true" ? true : false;
        if (l) {
            console.log(">>>>>>>>>>>>>>>>>>>>>> componentDidMount: set login to ", l);
            this.setState({ login: true })
        }
    }

    reloadacmeUserDetails() {
        const state = JSON.parse(sessionStorage.getItem("state"));
        console.log("state = ", state);
        if (state) {
            this.setState(prevState => ({
                state: { ...prevState, state }
            }));
        }
    }

    getLoginLabel() {
        return this.state.login ? "Sign Out" : "Login"
    }

    getRegisterLabel() {
        return this.state.register ? this.state.connection_name : "Register"
    }

    componentDidMount() {
        this.reloadLoginDetails();
        this.reloadacmeUserDetails();
        if (sessionStorage.getItem("selectedTab")) {
            console.log("Setting selected tab to ", sessionStorage.getItem("selectedTab"))
            this.setState({ value: parseInt(sessionStorage.getItem("selectedTab")) })
        } else {
            console.log("No selected tab");
        }
    }

    handleChange = (event, newValue) => {
        this.setState({ value: newValue });
    };

    render() {


        let web = sessionStorage.getItem("waitingForacmeUserData");
        if (web === "true") {
            this.acmeGetUserData();
        }
        const card = this.state;


        const a11yProps = (index) => {
            return {
                id: `simple-tab-${index}`,
                'aria-controls': `simple-tabpanel-${index}`,
            };
        }

        const getTabDisplay = () => {
            return this.state.welcome_open ? 'none' : 'block';
        }

        const getWelcomeDisplay = () => {
            return this.state.welcome_open ? 'block' : 'none';
        }

        const getWaitingDisplay = () => {
            return this.state.acme.credential_accepted ? 'none' : 'block';
        }

        // const getTabDisplay = () => {
        //     return this.state.welcome_open ? 'block' : 'none';
        // }

        // const getWelcomeDisplay = () => {
        //     return this.state.welcome_open ? 'none' : 'block';
        // }

        // const getWaitingDisplay = () => {
        //     return this.state.acme.credential_accepted ? 'block' : 'none';
        // }

        return (
            <ThemeProvider muiTheme={muiTheme}>
                <div >
                    <GlobalCss></GlobalCss>
                    <NavBar parent={this}></NavBar>

                    <Paper style={{
                        height: '800px',
                        backgroundImage: `url(${"insurance7.jpg"})`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center center",
                        backgroundSize: "cover",
                        backgroundAttachment: "fixed",
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        flexGrow: 1
                    }}>
                        <div style={{ display: getWelcomeDisplay() }} className="welcomepanel">
                            <div style={{ borderBottom: '1px solid white' }}>
                                <p>Welcome to Acme Insurance</p>
                            </div>
                            <div style={{ marginTop: '35px' }}>
                                <p> Click on Register to create a new user account, or Login to sign in with an existing account.
                                    
                                </p>
                                <div style={{ display: getWaitingDisplay() }} className = "bottomright">
                                    Awaiting User Registration Credential Acceptance...
                                </div>
                            </div>
                        </div>
                        <div style={{ display: getTabDisplay() }}>
                            <Tabs
                                value={this.state.value}
                                onChange={this.handleChange}
                                TabIndicatorProps={{style: {background:'#3366ff'}}}
                                initialSelectedIndex="1"
                                centered
                            >

                                <Tab label="New Policy" {...a11yProps(0)} />
                                <Tab label="Enter Claim" {...a11yProps(1) } />
                            </Tabs>
                            <TabPanel value={this.state.value} index={0}>
                                <Form
                                    parent={this}
                                    items={newPolicyItems}
                                    loading={this.state.acme.loading}
                                    card={this.state.policy}
                                    title={"Create New Insurance Policy"}
                                    action={"policy"}>
                                </Form>
                            </TabPanel>
                            <TabPanel value={this.state.value} index={1}>
                                <Form
                                    parent={this}
                                    items={claimItems}
                                    loading={this.state.acme.loading}
                                    card={this.state.claim}
                                    title={"Claim Details"}
                                    action={"claim"}>
                                </Form>
                            </TabPanel>

                        </div>

                    </Paper>
                    <RegistrationDialog
                        form_open={this.state.register_form_open}
                        parent={this}>
                    </RegistrationDialog>
                    <Dialog open={this.state.qr_open} onClose={() => this.setState({ qr_open: false, qr_hasClosed: true })}>
                        <DialogTitle style={{ width: "300px" }}>{this.getQRCodeLabel()}</DialogTitle>
                        <QRcode size="200" value={this.state.invite_url} style={{ margin: "0 auto", padding: "10px" }} />
                    </Dialog>
                </div >
            </ThemeProvider >
        )
    }
}