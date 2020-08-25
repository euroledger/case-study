import axios from 'axios';

const ebayRoutes = {
    async issue(ebayDSR) {
        await axios.post('/api/ebay/issue', ebayDSR);
    
        console.log("BARK waiting for credential to be accepted...");
        await axios.post('/api/credential_accepted', null);
    },
    async revoke() {
        await axios.post('/api/ebay/revoke', null);
    },
    async getAuthentication() {
        return await axios.get('/auth/ebay');
    },
    async getFeedback() {
        return await axios.get('/api/ebay/feedback');
    }
}

export default ebayRoutes;