import React, { useContext, useEffect, useState } from 'react'
import AppContext from '@/context/AppContext'

import { MailOutlined, UserOutlined, LoginOutlined } from '@ant-design/icons'
import { robotoBold } from "@/lib/fonts";
import { eq } from '@/lib/helpers/general';

function Unauthorized({withLayout = false}) {
  const { t, getUserEmail } = useContext(AppContext)
  const [pageName, setPageName ] = useState('Data Ingest Board')

  useEffect(() => {
    if (eq(location.pathname, '/usage')) {
      setPageName('Usage Dashboard')
    }
  }, [])

  const body = (
    <div>
      <p>You are trying to access the {t('HuBMAP')} {pageName} logged in as <strong className={robotoBold.className}>{getUserEmail()}</strong>.
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
  )

  if (withLayout) {
    return (<div className='alert alert-danger'>
      <h1 className="col-lg-6 col-10">{t('Unauthorized', [t('HuBMAP')])}</h1>
      {body}
      </div>)
  }

  return (
    body
  )
}

export default Unauthorized