import React, { useContext } from 'react'
import AppContext from '../../context/AppContext'
import {MailOutlined, UserOutlined, LoginOutlined} from '@ant-design/icons'
import {robotoLight, robotoBold } from "../../lib/fonts";
import AppBanner from "../AppBanner";

const AppLogin = ({ onLogin, unauthorized, onLogout }) => {

    const {t, getUserEmail} = useContext(AppContext)

    const pageData = () => {
        if (unauthorized) {
            const body = <div>
                <p>You are trying to access the {t('HuBMAP')} Data Ingest Board logged in as <strong className={robotoBold.className}>{getUserEmail()}</strong>.
                You are not authorized to log into this application with that account.  Please check that
                you have registered via the <a href={t('https://profile.hubmapconsortium.org/profile')} className='lnk--ic'>Member Registration Page <UserOutlined /></a>,
                have provided Globus account information and are logging in with that account.</p>

                <p>You will receive an email from Globus notifying that you have been invited to join
                    the <strong className={robotoBold.className}>{t('HuBMAP-Read')}</strong> group. You must click the link that says "Click here to apply for
                    membership" then click "Accept
                    Invitation" in the browser.</p>

                <p>Once you have confirmed your registration information you can <a href='/login' className='lnk--ic'>log in <LoginOutlined /></a> again.</p>

                <p>If you continue to have issues accessing this site please contact the &nbsp;
                    <a href={`mailto:${t('help@hubmapconsortium.org')}`} className='lnk--ic'>{t('HuBMAP')} Help Desk <MailOutlined /></a>.
                </p>
            </div>
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