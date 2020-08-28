import axios from 'axios';

const acmeRoutes = {
    async issue(policyDetails) {
        await axios.post('/api/acme/issue', policyDetails);
        console.log("WAITING FOR CREDENIAL ACCEPTANCE...")
        await axios.post('/api/credential_accepted', null);

        console.log("READY!");
    },
    async revoke() {
        await axios.post('/api/acme/revoke', null);
    },
    async verifyInsurance() {
        await axios.post('/api/verifypolicy', null);

        return await axios.get('/api/verificationreceived');
    }
}

export default acmeRoutes;