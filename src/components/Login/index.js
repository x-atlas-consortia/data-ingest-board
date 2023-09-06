import React, { useContext } from 'react'
import { Roboto } from 'next/font/google'
import AppContext from '../../context/AppContext'

const roboto_light = Roboto( {
    weight: '300',
    subsets: ['latin']
})

const Login = ({ onLogin, unauthorized, onLogout }) => {

    const {t} = useContext(AppContext)

    const pageData = () => {
        if (unauthorized) {
            return {
                title: 'Unauthorized',
                body: 'You are logged in to an account without access. Please log out and log back in with a {0} Consortium Registered Account',
                cb: onLogout,
                btn: 'Log Out'
            }
        } else {
            return {
                title: '{0} Data Ingest Board',
                body: 'User authentication is required to view the Dataset Publishing Dashboard. Please click the button below and you will be redirected to a login page. There you can login with your institution credentials. Thank you!',
                cb: onLogin,
                btn: 'Log in with your institution credentials'
            }
        }
    }
    const details = pageData()
    return (
        <div>
            <div className="container">
                <div className="c-login row mt-4">
                    <h1 className="c-login__head col-6">{t(details.title, [t('HuBMAP')])}</h1>
                    <p className={`c-login__txt ${roboto_light.className}`}>
                        {t(details.body, [t('HuBMAP')])}
                    </p>
                    <div className="row">
                        <button className="c-login__btn col-4" onClick={details.cb}>
                            {details.btn}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login