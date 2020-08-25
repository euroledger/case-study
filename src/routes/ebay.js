import axios from 'axios';

const acmeRoutes = {
    async issue(policyDetails) {
        await axios.post('/api/acme/issue', policyDetails);
        await axios.post('/api/credential_accepted', null);
    },
    async revoke() {
        await axios.post('/api/acme/revoke', null);
    }
}

export default acmeRoutes;