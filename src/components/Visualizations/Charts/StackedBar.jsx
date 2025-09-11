import React from 'react'
import * as d3 from 'd3';
import { useContext, useEffect, useRef } from 'react'
import ChartContext from '@/context/ChartContext';
import { formatNum } from '@/lib/helpers/general';

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
    subGroupLabels = {},
    chartId = 'modal',
}) {
    const {
        getChartSelector,
        toolTipHandlers,
        appendTooltip } = useContext(ChartContext)

    const hasLoaded = useRef(false)

    const chartType = 'stackedBar'
    const colors = useRef({})
    const chartData = useRef([])

    const getSubGroupSum = (key) => {
        let sum = 0
        for (let d of data) {
            sum += d[key]
        }
        return sum
    }

    const buildChart = () => {

        const dyWidth = Math.max(460, data.length * 150)
        const margin = { top: 10, right: 30, bottom: 20, left: 50 },
            width = (Math.min((dyWidth), 1000)) - margin.left - margin.right,
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

        const subgroups = Object.keys(data[0]).slice(1)

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
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

        // Show the bars
        g.append("g")
            .selectAll("g")
            // Enter in the stack data = loop key per key = group per group
            .data(stackedData)
            .join("g")
            .attr("fill", d => {
                const color = colorScale(d.key)
                const label = subGroupLabels[d.key]
                colors.current[label] = { color, label, value: formatNum(getSubGroupSum(d.key)) }
                return color
            })
            .selectAll("rect")
            // enter a second time = loop subgroup per subgroup to add all rectangles
            .data(D => D.map(d => (d.key = D.key, d)))
            .join("rect")
            .attr('data-value', d => d[1] - d[0])
            .attr('data-label', d => {
                return subGroupLabels[d.key]
            })
            .attr("x", d => x(d.data.name))
            .attr("y", d => {
                return y(d[1] - d[0])
            })
            .attr("height", d => {
                return y(d[0]) - y(d[1])
            })
            .attr("width", x.bandwidth())
            .append("title")
            .text(d => {
                return `${d.data.name}\n${subGroupLabels[d.key]}: ${formatNum(d[1] - d[0])}`
            })

        svg.selectAll("rect")
            .on("mouseover", toolTipHandlers(chartId, chartType).mouseover)
            .on("mousemove", toolTipHandlers(chartId, chartType).mousemove)
            .on("mouseleave", toolTipHandlers(chartId, chartType).mouseleave)

        return svg.node();
    }

    const updateChart = () => {
        $(getChartSelector(chartId, chartType)).html('')
        appendTooltip(chartId, chartType)
        $(getChartSelector(chartId, chartType)).append(buildChart())

        if (setLegend) {
            setLegend(colors.current)
        }
    }

    useEffect(() => {
        if (reload || chartData.current.length !== data.length || !hasLoaded.current) {
            hasLoaded.current = true
            chartData.current = Array.from(data)
            updateChart()
        }

    }, [data])

    useEffect(() => {
        updateChart()
    }, [filters])

    return (
        <div className={`c-visualizations__chart c-visualizations__stackedBar c-bar`} id={`c-visualizations__stackedBar--${chartId}`}></div>
    )
}

export default StackedBar