import React, {useContext} from 'react'
import Visualizations from "@/components/Visualizations";
import {ChartProvider} from "@/context/ChartContext";
import AppTableContext from '@/context/TableContext';

function ChartsWrapper({filters, hasInitViz, setHasInitViz, data, countFilteredRecords}) {
const {handleTableChange} = useContext(AppTableContext)
  return (
    <ChartProvider>
        <Visualizations hasInitViz={hasInitViz} setHasInitViz={setHasInitViz} data={countFilteredRecords(data, filters)} filters={filters} applyFilters={handleTableChange} />
    </ChartProvider>
  )
}

export default ChartsWrapper