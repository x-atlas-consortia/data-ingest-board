import React from 'react'
import * as d3 from 'd3';
import { useContext, useEffect, useRef } from 'react'
import ChartContext from '@/context/ChartContext';

function GroupedBar({
    setLegend,
    filters,
    data = [],
    reload = true,
    subGroupLabels = {},
    chartId = 'modal',
    style = {},
    yAxis = {},
    xAxis = {}
}) {
    const {
        getChartSelector,
        toolTipHandlers,
        svgDo,
        appendTooltip } = useContext(ChartContext)


    const chartType = 'groupedBar'
    const colors = useRef({})
    const chartData = useRef([])
    const hasLoaded = useRef(false)

    const getSubGroupSum = (key) => {
        let sum = 0
        for (let d of data) {
            sum += d[key]
        }
        return sum
    }

    const buildChart = () => {

        const sizing = svgDo({data}).sizing(style, chartId, chartType)
        let {width, height, margin} = sizing

        // append the svg object to the body of the page
        const svg = d3.create("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("viewBox", [0, 0, width, height + margin.top])

        const g = svg
            .append("g")

        const subgroups = Object.keys(subGroupLabels)

        const groups = data.map(d => (d.group))

        // Add X axis
        const x = d3.scaleBand()
            .domain(groups)
            .range([margin.left, width - margin.right])
            .padding([0.2])

        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x));

        let maxY = 0;
        for (let d of data) {
            for (let subgroup of subgroups) {
                maxY = Math.max(maxY, d[subgroup] || 0)
            }
        }

        const ticks = yAxis.scaleLog || yAxis.ticks ? yAxis.ticks || 3 : undefined
        const scaleMethod = yAxis.scaleLog ? d3.scaleLog : d3.scaleLinear
        const minY = yAxis.scaleLog ? 1 : -(maxY * 0.02)

        const yaxis = scaleMethod()
            .domain([minY, maxY])

        if (yAxis.scaleLog) {
            yaxis.nice()
        }

        // Add Y axis
        const y = yaxis
            .range([height - margin.bottom, margin.top])

        g.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(ticks))

        var xSubgroup = d3.scaleBand()
            .domain(subgroups)
            .range([0, x.bandwidth()])
            .padding([0.05])

        svgDo({xAxis, yAxis}).axisLabels({svg, sizing})

        // color palette = one color per subgroup
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

        const formatVal = ({d, v}) => svgDo({}).valueFormatter({d, v, style})

        const getSubgroupLabel = (v) => subGroupLabels[v] || v

        svgDo({}).grid({g, y, hideGrid: style.hideGrid, ticks, sizing})

        // Show the bars
        g.append("g")
            .selectAll("g")
            // Enter in the stack data = loop key per key = group per group
            .data(data)
            .join("g")
                .attr("transform", function(d) { return "translate(" + x(d.group) + ",0)"; })
            .selectAll("rect")
            // enter a second time = loop subgroup per subgroup to add all rectangles
            .data(function(d) { 
                return subgroups.map(function(key) { return {key: key, group: d.group, val: d[key] || 0}; }); })
            .join("rect")
            .attr("fill", d => {
                const color = colorScale(d.key)
                const label = getSubgroupLabel(d.key)
                colors.current[label] = { color, label, value: formatVal({d, v: getSubGroupSum(d.key)}) }
                return color
            })
            .attr('data-value', d => {
                return formatVal({d, v: d.val})
            })
            .attr('data-label', d => {
                return getSubgroupLabel(d.key)
            })
            .attr("class", d => `bar--${getSubgroupLabel(d.key).toDashedCase()}`)
            .attr("x", d => xSubgroup(d.key))
            .attr("y", y(minY))
            .attr("height", 0)
            .attr("width", xSubgroup.bandwidth())
            .append("title")
            .text(d => {
                return `${d.group}\n${getSubgroupLabel(d.key)}: ${formatVal({d, v: d.val})}`
            })

        svg.selectAll("rect")
            .on("mouseover", toolTipHandlers(chartId, chartType).mouseover)
            .on("mousemove", toolTipHandlers(chartId, chartType).mousemove)
            .on("mouseleave", toolTipHandlers(chartId, chartType).mouseleave)

        svg.selectAll("rect")
            .transition()
            .duration(800)
            .attr("height", d => {
                return y(minY) - y(d.val)
            })
            .attr("y", d => {
                return y(d.val)
            })

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
    }, [filters, yAxis])

    return (
        <div className={`c-visualizations__chart c-visualizations__groupedBar c-bar`} id={`c-visualizations__groupedBar--${chartId}`}></div>
    )
}

export default GroupedBar