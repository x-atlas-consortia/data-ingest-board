import React, { Suspense, useState, useEffect, useContext } from 'react';
import AppContext from '@/context/AppContext';
import { Spin, Skeleton, Alert } from 'antd';
import { callService, eq, getHeadersWith, formatNum, formatBytes, roundToTheNearest } from "@/lib/helpers/general";
import URLS from '@/lib/helpers/urls';


function DetailSuspence({ query, buildCallback, suspenseFallback, suspenseBlockStyle = false }) {

  const [data, setData] = useState(null);
  const { globusToken } = useContext(AppContext); 

  useEffect(() => {
    // Fetch or initialize data here
    const fetchData = async () => {
      try {
        const url = URLS.ingest.analytics.query();
        const headers = getHeadersWith(globusToken).headers

        if (Array.isArray(query)) {
         
            const responses = await Promise.all(
                query.map((q) =>
                    callService(url, headers, { query: q }, 'POST')
                )
            )

            if (responses.every((response) => response.status == 200)) {
                setData(responses.map((response) => response.data))
            }
        } else {
            const response = await callService(url, headers, { query }, 'POST')

            if (response.status == 200) {
                setData(response.data)
            }
        }
        
      } catch (error) {
        console.error(error);
      }
    };
    
    const timer = setTimeout(() => {
      fetchData();
    }, 100);
    return () => clearTimeout(timer);
  }, [query]);
  
  return (
    <>
      {data ? <span>{buildCallback(data)}</span> : suspenseFallback || !suspenseBlockStyle ? <Skeleton.Input active={true} size="small" /> : <Skeleton.Input className="w-100" active style={{ width: '100%', height: '300px', marginTop: '20px' }} />}
    </>
  );
}

export default DetailSuspence;