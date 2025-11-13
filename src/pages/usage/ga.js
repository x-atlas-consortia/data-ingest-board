import React, { useRef, useEffect, useState, useContext } from 'react';
import { Layout  } from 'antd';
import AppSideNavBar from "@/components/AppSideNavBar";
import AppContext from "@/context/AppContext";
import Spinner from '@/components/Spinner';
import { eq } from '@/lib/helpers/general';
import ENVS from '@/lib/helpers/envs';

const UsageGoogleAnalytics = ({}) => {
    const {isLoading, isAuthenticated} = useContext(AppContext)
    const [dataSource, setDataSource] = useState(null)
    const lookerStudioFrame = useRef(null)

    const [isIframeLoaded, setIsIframeLoaded] = useState(false)

    const handleIframeLoad = () => {
        setIsIframeLoaded(true)
    }

    useEffect(() => {
        const currentIframe = lookerStudioFrame.current
        if (currentIframe) {
        currentIframe.addEventListener('load', handleIframeLoad)
        return () => {
            currentIframe.removeEventListener('load', handleIframeLoad)
        };
        }
    }, [lookerStudioFrame.current])

    const getGoogleLookerStudio = () => {
     
      const query = new URLSearchParams(window.location.search)
      const requestedDataSource = query.get('v')
      const lookerStudio = ENVS.lookerStudio()
      if (!Array.isArray(lookerStudio)) return []
      let _dataSource = lookerStudio[0]
 
      for (let l of lookerStudio) {
          if (eq(requestedDataSource, l.name.toDashedCase())) {
            _dataSource = l
            break
          }
      }
      
      setDataSource(_dataSource)
    }

    useEffect(() => {
        if (isAuthenticated) {
          getGoogleLookerStudio()
        }
    }, [isAuthenticated])


    if (!isAuthenticated && !isLoading) {
         window.location = '/'
    }

    if (!isAuthenticated) {
        return <Spinner tip='' size='small' />
    }

    return (
        <Layout style={{ minHeight: '100vh', maxHeight: '2000px' }}>
            <AppSideNavBar isGoogleAnalytics={true}  />
            {!isIframeLoaded && <div className='mx-auto w-100 text-center'><Spinner tip='Loading report from Google Looker Studio...' /></div>}
            {isAuthenticated && dataSource && <Layout>
                <div className='c-iframeReport'><iframe ref={lookerStudioFrame} width="100%" height="100%" src={`https://lookerstudio.google.com/embed/reporting${dataSource.path}`} ></iframe></div>
            </Layout>}
        </Layout>
    );
};
export default UsageGoogleAnalytics;