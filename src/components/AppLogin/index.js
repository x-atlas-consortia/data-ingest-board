import React, { useContext } from 'react'
import { Roboto } from 'next/font/google'
import AppContext from '../../context/AppContext'
import {MailOutlined} from '@ant-design/icons'

const roboto_light = Roboto( {
    weight: '300',
    subsets: ['latin']
})

const AppLogin = ({ onLogin, unauthorized, onLogout }) => {

    const {t, getUserEmail} = useContext(AppContext)

    const pageData = () => {
        if (unauthorized) {
            const body = <div>
                <p>You are trying to access the {t('HuBMAP')} Data Ingest Board logged in as <strong className='font-weight-bold'>{getUserEmail()}</strong>.
                You are not authorized to log into this application with that account.  Please check that
                you have registered via the <a href={t('https://profile.hubmapconsortium.org/profile')}>Member Registration Page</a>,
                have provided Globus account information and are logging in with that account.</p>

                <p>Once you have confirmed your registration information you can <a href='/login'>log in</a> again.</p>

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
            <div className="container">
                <div className={`c-login row mt-4 ${unauthorized ? 'alert alert-danger' : ''}`}>
                    <h1 className="c-login__head col-6">{t(details.title, [t('HuBMAP')])}</h1>
                    <div className={`c-login__txt ${roboto_light.className}`}>
                        {details.body}
                    </div>
                    <div className="row mt-3">
                        <button className="c-login__btn col-4" onClick={details.cb}>
                            {details.btn}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppLogin