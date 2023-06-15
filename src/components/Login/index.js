import React, { useState, useEffect } from "react";
import { Roboto } from 'next/font/google';

const roboto_light = Roboto( {
    weight: '300',
    subsets: ['latin']
})

const Login = ({ onLogin }) => {

    return (
        <div className="LoginBox container">
            <div className="row">
                <h1 className="LoginHeader col-6">
                    HuBMAP Data Ingest Board</h1>
            </div>
            <p className={`LoginText ${roboto_light.className}`}>
                User authentication is required to view the Dataset Publishing Dashboard.
                Please click the button below and you will be redirected to a login page. There you can login with your
                institution credentials. Thank you!
            </p>
            <div className="row">
                <button className="LoginButton col-4" onClick={onLogin}>
                    Log in with your institution credentials
                </button>
            </div>
        </div>
    )
}

export default Login