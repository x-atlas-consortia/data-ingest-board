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
    yAxis = {},
    xAxis = {}
}) {
    const {
        getChartSelector,
        toolTipHandlers,
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

    const showXLabels = () => xAxis.showLabels !== undefined ? xAxis.showLabels : true

    const showYLabels = () => yAxis.showLabels !== undefined ? yAxis.showLabels : true

    const buildChart = () => {

        const width = 728;
        let height = 500;
        const margin = {top: 30, right: 0, bottom: 50 * 1.5, left: 90 * 1.3}

        // append the svg object to the body of the page
        const svg = d3.create("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("viewBox", [0, 0, width, height])

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

        if (showYLabels()) {
            svg.append("g")
                .append("text")
                .attr("class", "y label")
                .attr("text-anchor", "end")
                .attr("y",  yAxis.labelPadding || 40)
                .attr("x", (height/3) * -1)
                .attr("dy", ".74em")
                .attr("transform", "rotate(-90)")
                .text(yAxis.label || "Frequency")
        }


        if (xAxis.label && showXLabels()) {
            svg.append("g")
                .append("text")
                .attr("class", "x label")
                .attr("text-anchor", "middle")
                .attr("x", width / 2 + margin.left/2)
                .attr("y", height - (margin.bottom/2))
                .text(xAxis.label)
        }

        // color palette = one color per subgroup
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

        const formatVal = (v) => xAxis.formatter ? xAxis.formatter(v) : v

        const getSubgroupLabel = (v) => subGroupLabels[v] || v

        g.selectAll(".y-grid")
            .data(y.ticks(ticks))
            .enter().append("line")
            .attr("class", "y-grid")
            .attr("x1", margin.left)
            .attr("y1", d => Math.ceil(y(d)))
            .attr("x2", width - margin.right)
            .attr("y2", d => Math.ceil(y(d)))
            .style("stroke", "#eee") // Light gray
            .style("stroke-width", "1px")

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
                colors.current[label] = { color, label, value: formatVal(getSubGroupSum(d.key)) }
                return color
            })
            .attr('data-value', d => {
                return formatVal(d.val)
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
                return `${d.group}\n${getSubgroupLabel(d.key)}: ${formatVal(d.val)}`
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