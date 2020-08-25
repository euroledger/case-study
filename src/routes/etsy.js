import axios from 'axios';

const etsyRoutes = {
    async issue(etsyRatings) {
        await axios.post('/api/etsy/issue', etsyRatings);

        await axios.post('/api/credential_accepted', null);
    },
    async revoke() {
        await axios.post('/api/etsy/revoke', null);
    },
    async getFeedback() {
        return await axios.get('/api/etsy/feedback');
    },
    async getAuthentication() {
        return await axios.get('/auth/etsy');
    }
}

export default etsyRoutes;