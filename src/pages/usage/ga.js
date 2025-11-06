import React, { useEffect, useState, useContext } from 'react';
import { Layout  } from 'antd';
import AppSideNavBar from "@/components/AppSideNavBar";
import AppContext from "@/context/AppContext";
import Spinner from '@/components/Spinner';
import Unauthorized from '@/components/Unauthorized';
import { eq } from '@/lib/helpers/general';
import ENVS from '@/lib/helpers/envs';


const UsageGoogleAnalytics = ({}) => {
    const { globusToken, isLoading, isAuthenticated} = useContext(AppContext)
    const [showUnauthorized, setShowUnauthorized] = useState(false)
    const [dataSource, setDataSource] = useState(null)

    const getGoogleLookerStudio = () => {
     
      const query = new URLSearchParams(window.location.search)
      const requestedDataSource = query.get('v')
      const lookerStudio = ENVS.lookerStudio()
      let path = lookerStudio[0].path
 
      for (let l of lookerStudio) {
          if (eq(requestedDataSource, l.name.toDashedCase())) {
            path = l.path
            break
          }
      }
      
      setDataSource(path)
    }

    useEffect(() => {
        if (isAuthenticated) {
          getGoogleLookerStudio()
        }
    }, [isAuthenticated])

    if (!isAuthenticated) {
        return <Spinner tip='' size='small' />
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <AppSideNavBar isGoogleAnalytics={true}  />
            {showUnauthorized && <div className='container mt-5'><Unauthorized withLayout={true} /></div>}
            {!showUnauthorized && dataSource && <Layout>
                <iframe width="100%" height="100%" src={`https://lookerstudio.google.com/embed/reporting${dataSource}`} ></iframe>
            </Layout>}
        </Layout>
    );
};
export default UsageGoogleAnalytics;