import axios from 'axios';

const uberRoutes = {
    async issue(uberRatings) {
        await axios.post('/api/uber/issue', uberRatings);

        await axios.post('/api/credential_accepted', null);
    },
    async revoke() {
        await axios.post('/api/uber/revoke', null);
    },
    async getFeedback() {
        return await axios.get('/api/uber/feedback');
    }
}

export default uberRoutes;