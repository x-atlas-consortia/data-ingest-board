import React from 'react'
import * as d3 from 'd3';
import { useContext, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import ChartContext from '@/context/ChartContext';

export const prepareStackedData = (data) => {
    let sorted = []
    for (let d of data) {
        sorted.push(Object.fromEntries(
            Object.entries(d).sort(([, a], [, b]) => b - a)
        ))
    }
    return sorted
}

function StackedBar({
    setLegend,
    filters,
    data = [],
    reload = true,
    chartId = 'modal',
}) {
    const {
        getChartSelector,
        toolTipHandlers,
        appendTooltip } = useContext(ChartContext)

    const hasLoaded = useRef(false)

    const buildChart = () => {

        var margin = { top: 10, right: 30, bottom: 20, left: 50 },
            width = 460 - margin.left - margin.right,
            height = 300 - margin.top - margin.bottom;
        const marginY = (margin.top + margin.bottom) * 2
        const marginX = margin.left + margin.right

        // append the svg object to the body of the page
        const svg = d3.create("svg")
            .attr("width", width + marginX)
            .attr("height", height + marginY)
            .attr("viewBox", [0, 0, width + marginX, height + marginY])

        const g = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`)

        var subgroups = Object.keys(data[0]).slice(1)


        const groups = data.map(d => (d.name))

        // Add X axis
        const x = d3.scaleBand()
            .domain(groups)
            .range([0, width])
            .padding([0.2])

        g.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).tickSizeOuter(0));

        let maxY = 0;
        for (let d of data) {
            for (let subgroup of subgroups) {
                maxY = Math.max(maxY, d[subgroup])
            }
        }
        const yStartPos = -(maxY * .02)

        var stack = d3.stack()
            .keys(subgroups)
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetNone);

        const stackedData = stack(data);

        // Add Y axis
        const y = d3.scaleLinear()
            .domain([0, maxY])
            .range([height, 0]);
        g.append("g")
            .call(d3.axisLeft(y));

        // color palette = one color per subgroup
        const color = d3.scaleOrdinal(d3.schemeCategory10)

        // Show the bars
        g.append("g")
            .selectAll("g")
            // Enter in the stack data = loop key per key = group per group
            .data(stackedData)
            .join("g")
            .attr("fill", d => color(d.key))
            .selectAll("rect")
            // enter a second time = loop subgroup per subgroup to add all rectangles
            .data(d => d)
            .join("rect")
            .attr("x", d => x(d.data.name))
            .attr("y", d => {
                return y(d[1] - d[0])
            })
            .attr("height", d => {
                return y(d[0]) - y(d[1])
            })
            .attr("width", x.bandwidth())

        return svg.node();
    }

    const updateTable = (chartId = 'modal') => {
        $(getChartSelector(chartId, 'stackedBar')).html('')
        appendTooltip(chartId)
        $(getChartSelector(chartId, 'stackedBar')).append(buildChart())

        if (setLegend) {
            setLegend(colors)
        }
    }

    useEffect(() => {
        if (reload || !hasLoaded.current) {
            hasLoaded.current = true
            updateTable()
        }

    }, [data])

    useEffect(() => {
        updateTable()
    }, [filters])

    return (
        <div className={`c-visualizations__chart c-visualizations__stackedBar c-bar`} id={`c-visualizations__stackedBar--${chartId}`}></div>
    )
}

export default StackedBar