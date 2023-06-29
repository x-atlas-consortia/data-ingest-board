import React, { useState, useEffect } from "react";
import { Roboto } from 'next/font/google';

const roboto_light = Roboto( {
    weight: '300',
    subsets: ['latin']
})

const Login = ({ onLogin, unauthorized, onLogout }) => {
    return (
        <div>
            {unauthorized ? (
                <div className="container">
                    <div className="LoginBox row">
                        <h1 className="LoginHeader col-6">Unauthorized</h1>
                        <p className={`LoginText ${roboto_light.className}`}>
                            You are logged in to an account without access. Please log out and log back in with a HuBMAP Consortium Registered Account
                        </p>
                        <div className="row">
                            <button className="LoginButton col-4" onClick={onLogout}>
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="container">
                    <div className="LoginBox row">
                        <h1 className="LoginHeader col-6">HuBMAP Data Ingest Board</h1>
                        <p className={`LoginText ${roboto_light.className}`}>
                            User authentication is required to view the Dataset Publishing Dashboard. Please click the button below and you will be redirected to a login page. There you can login with your institution credentials. Thank you!
                        </p>
                        <div className="row">
                            <button className="LoginButton col-4" onClick={onLogin}>
                                Log in with your institution credentials
                            </button>
                        </div>
                    </div>
                </div>
      )}
    </div>
  );
};

export default Login