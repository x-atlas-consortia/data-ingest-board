import React, { useState, useEffect } from "react";
import { Roboto } from 'next/font/google';
import styles from '@/styles/login.module.css';

const roboto_heavy = Roboto({
    weight: '500',
    subsets: ['latin']
})

const Login = () => {
    return (
        <div className={`${styles.LoginBox}`}>
            <h1 className={`${styles.LoginHeader} ${roboto_heavy.className}`}>
                HuBMAP Dataset Dashboard</h1>
            <p>
                User authentication is required to view the Dataset Publishing Dashboard.
                Please click the button below and you will be redirected to a login page. There you can login with your
                institution credentials. Thank you!
            </p>
            <hr style={{color: '#085464', borderTop: '1px'}} />
            <button>Mybutton</button>

        </div>
    )
}

export default Login