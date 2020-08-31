import axios from 'axios';

const signInRoutes = {
    async register(registrationInfo) {
        console.log("----> register user");
        return await axios.post('/api/register', registrationInfo);
    },
    async waitForConnection() {
        return await axios.get('/api/connected', null);
    },
    async waitForCredentialAccepted() {
        await axios.post('/api/credential_accepted', null);
    },
    async login() {
        return await axios.post('/api/login', null);
    },
    async signout() {
        return await axios.get('/api/signout', null);
    },
    async waitForLoginConfirmed() {
        return await axios.get('/api/loginconfirmed');
    } 
}

export default signInRoutes;