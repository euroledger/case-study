import React, { Component } from 'react';
import './button.css';
import invoiceItems from './components/Fields/invoice';
import policyItems from './components/Fields/policy';
import RegistrationDialog from './components/RegistrationDialog';
import NavBar from './components/NavBar';
import Form from './components/Form';
import Paper from '@material-ui/core/Paper';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import TabPanel from './components/TabPanel';
import WelcomeDialog from './components/Welcome';

import GlobalCss from './components/Global';

import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import axios from 'axios';
import QRcode from 'qrcode.react';
import crypto from 'crypto';
import hospitalRoutes from './routes/hospital';
import signInRoutes from './routes/signInRoutes';

axios.defaults.baseURL = 'http://localhost:5002/';
axios.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';

const r = Math.random().toString(26).substring(2, 4).toUpperCase();
const invoiceNumber = r + Math.floor(1000 + Math.random() * 9000).toString();

const muiTheme = createMuiTheme({
    typography: {
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
        insuranceCompany: "",
    },
    invoice: {
        invoiceNumber: invoiceNumber,
        hospitalName: "St Elsewhere Hospital, Gotham City",
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
        insurance_policy_received: true,
        claim_button_disabled: true
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

    onIssueInvoice = async () => {
        const invoiceDetails = {
            invoiceNumber: invoiceNumber,
            hospitalName: this.state.invoice.hospitalName,
            invoiceDate: this.state.invoice.invoiceDate,
            insurancePolicyNumber: this.state.invoice.insurancePolicyNumber,
            amount: this.state.invoice.invoiceAmount + ".00",
            treatmentDescription: this.state.invoice.treatmentDescription
        }

        this.setState(prevState => ({
            acme: { ...prevState.acme, credential_accepted: false }
        }));

        await hospitalRoutes.issue(invoiceDetails);

        this.setState(prevState => ({
            acme: { ...prevState.acme, credential_accepted: true, has_been_revoked: false },
            invoice: { ...prevState.invoice, invoiceNumber: invoiceNumber }
        }));
    }

    onRequestInsurancePolicy = async () => {
        this.setState(prevState => ({
            acme: { ...prevState.acme, insurance_policy_received: false },
        }));
        let resp;
        try {
            resp = await hospitalRoutes.verifyInsurance();
        }
        catch (e) {
            console.log(e);
        }
        this.setState(prevState => ({
            acme: { ...prevState.acme, insurance_policy_received: true, claim_button_disabled: false },
            policy: {...prevState.policy, 
                policyID: resp.data.policyID,
                effectiveDate: resp.data.effectiveDate,
                expiryDate: resp.data.expiryDate,
                insuranceCompany: resp.data.insuranceCompany,
            }, 
            invoice: {...prevState.invoice, 
                insurancePolicyNumber: resp.data.policyID,
            }
        }));
        console.log("LOGIN ok! resp = ", resp);
    }

    setPolicyFieldValue = (event) => {
        const { target: { name, value } } = event;

        this.setState(prevState => ({
            user: {
                ...prevState.user, [name]: value
            }
        }));
    }

    setInvoiceFieldValue = (event) => {
        const { target: { name, value } } = event;

        this.setState(prevState => ({
            invoice: {
                ...prevState.invoice, [name]: value
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
                login: true, connection_name: name, register: true, loggingIn: false
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
        const user = await hospitalRoutes.getFeedback();

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

    getCancelInvoiceLabel(platform) {
        return (this.state.acme.credential_accepted ? "Cancel Invoice" : "Awaiting Acceptance...");
    }

    getPolicyLabel() {
        return (this.state.acme.insurance_policy_received ? "Request Insurance Policy" : "Awaiting Proof...");
    }

    getInvoiceLabel() {
        return (this.state.acme.credential_accepted ? "Issue Invoice Credential" : "Awaiting Acceptance...");
    }

    getDisabled(platform) {
        return (!this.state[platform].credential_accepted || !(this.state.acme.insurance_policy_received));
    }

    getClaimDisabled(platform) {
        return (!this.state[platform].credential_accepted || !(this.state.acme.insurance_policy_received) || (this.state.acme.claim_button_disabled));
    }

    requestPolicyButton() {
        return (
            <div style={{ marginTop: '50px', }}>
                <Button className="registerbutton" disabled={this.getDisabled("acme")}
                    onClick={() => this.onRequestInsurancePolicy()} >
                    {this.getPolicyLabel("acme")}
                </Button>
            </div>
        )
    }

    invoiceButton() {
        if (this.state.acme.has_been_revoked) {
            return (
                <div style={{ marginTop: '45px', marginBottom: '20px' }}>
                    <Button className="registerbutton" disabled={this.getClaimDisabled("acme")}
                        onClick={() => this.onIssueInvoice()} >
                        {this.getInvoiceLabel()}
                    </Button>
                </div>
            )
        } else {
            return (
                <div style={{ marginTop: '45px', marginBottom: '20px' }}>
                    <Button className="revokebutton" disabled={this.getDisabled("acme")}
                        onClick={() => this.onReimburse()} >
                        {this.getCancelInvoiceLabel()}
                    </Button>
                </div>
            )
        }
    }

    getQRCodeLabel() {
        return this.state.registering ? "Scan this QR code to Register with St.Elsewhere Hospital" : "Scan this QR code to Login"
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
        const invoiceDate = this.formatDate(new Date(), 0);
        this.setState(prevState => ({
            invoice: { ...prevState.invoice, invoiceDate: invoiceDate }
        }));
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

        // const getTabDisplay = () => {
        //     return this.state.welcome_open ? 'block' : 'none';
        // }

        return (
            <ThemeProvider muiTheme={muiTheme}>
                <div >
                    <GlobalCss></GlobalCss>
                    <NavBar parent={this}></NavBar>

                    <Paper style={{
                        height: '800px',
                        backgroundImage: `url(${"hospital.jpg"})`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center center",
                        backgroundSize: "cover",
                        backgroundAttachment: "fixed",
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        flexGrow: 1
                    }}>
                        <WelcomeDialog
                            welcome_open={this.state.welcome_open}
                            credential_accepted={this.state.acme.credential_accepted}
                        >
                        </WelcomeDialog>
                        <div style={{ display: getTabDisplay() }}>
                            <Tabs
                                value={this.state.value}
                                onChange={this.handleChange}
                                
                                initialSelectedIndex="1"
                                centered
                            >

                                <Tab label="Request Insurance Policy" {...a11yProps(0)} />
                                <Tab label="Raise Invoice" {...a11yProps(1)} />
                            </Tabs>
                            <TabPanel value={this.state.value} index={0}>
                                <Form
                                    parent={this}
                                    items={policyItems}
                                    loading={this.state.acme.loading}
                                    card={this.state.policy}
                                    title={"Request Insurance Policy"}
                                    action={"policy"}>
                                </Form>
                            </TabPanel>
                            <TabPanel value={this.state.value} index={1}>
                                <Form
                                    parent={this}
                                    items={invoiceItems}
                                    loading={this.state.acme.loading}
                                    card={this.state.invoice}
                                    title={"Raise Patient Invoice"}
                                    action={"invoice"}>
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