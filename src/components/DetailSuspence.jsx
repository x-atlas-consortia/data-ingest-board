import React, { Suspense, useState, useEffect, useContext } from 'react';
import AppContext from '@/context/AppContext';
import { Spin, Skeleton, Alert } from 'antd';
import { callService, eq, getHeadersWith, formatNum, formatBytes, roundToTheNearest } from "@/lib/helpers/general";
import URLS from '@/lib/helpers/urls';


function DetailSuspence({ query, buildCallback, suspenseFallback }) {

  const [data, setData] = useState(null);
  const { globusToken } = useContext(AppContext); // Replace SomeContext with the actual context providing globusToken

  useEffect(() => {
    // Fetch or initialize data here
    const fetchData = async () => {
      try {
        const url = URLS.ingest.analytics.query();
        const headers = getHeadersWith(globusToken).headers
        const response = await callService(url,
                                headers,
                                {query},
                                'POST');
      
        if (response.status == 200) {
          setData(response.data);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, [query]);
  
  return (
    <>
      {data ? <span>{buildCallback(data)}</span> : suspenseFallback || <Skeleton.Input active={true} size="small" />}
    </>
  );
}

export default DetailSuspence;