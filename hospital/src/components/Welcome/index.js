import React from 'react';

const WelcomeDialog = ({ welcome_open, credential_accepted }) => {
 
    // const getWelcomeDisplay = () => {
    //     return welcome_open ? 'block' : 'none';
    // }

    // const getWaitingDisplay = () => {
    //     return credential_accepted ? 'none' : 'block';
    // }
    
    const getWelcomeDisplay = () => {
        return welcome_open ? 'none' : 'block';
    }

    const getWaitingDisplay = () => {
        return credential_accepted ? 'block' : 'none';
    }

    return (
        <div style={{ display: getWelcomeDisplay() }} className="welcomepanel">
            <div style={{ borderBottom: '1px solid white' }}>
                <p>Welcome to St Elsewhere Hospital</p>
            </div>
            <div style={{ marginTop: '35px' }}>
                <p> Click on Register to create a new user account, or Login to sign in with an existing account.
                    
                </p>
                <div style={{ display: getWaitingDisplay() }} className = "bottomright">
                    Awaiting User Registration Credential Acceptance...
                </div>
            </div>
        </div>
    );
}
export default WelcomeDialog