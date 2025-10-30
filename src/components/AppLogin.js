import React, { useContext } from 'react'
import AppContext from '@/context/AppContext'
import {robotoLight} from "@/lib/fonts";
import AppBanner from "@/components/AppBanner";
import Unauthorized from '@/components/Unauthorized';

const AppLogin = ({ onLogin, unauthorized, onLogout }) => {

    const {t} = useContext(AppContext)

    const pageData = () => {
        if (unauthorized) {
            const body = <Unauthorized />
            return {
                title: 'Unauthorized',
                body,
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
            <AppBanner />
            <div className="container">
                <div className={`c-login mt-4 ${unauthorized ? 'alert alert-danger' : ''}`}>
                    <h1 className="c-login__head col-lg-6 col-10">{t(details.title, [t('HuBMAP')])}</h1>
                    <div className={`c-login__txt ${robotoLight.className}`}>
                        {details.body}
                    </div>
                    <div className="row mt-3">
                        <button className="c-login__btn col-lg-4 col-10" onClick={details.cb}>
                            {details.btn}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppLogin