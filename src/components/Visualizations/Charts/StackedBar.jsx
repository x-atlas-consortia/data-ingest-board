import React from 'react'
import * as d3 from 'd3';
import { useContext, useEffect, useRef } from 'react'
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
    subGroupLabels = {},
    chartId = 'modal',
    yAxis = {},
    xAxis={}
}) {
    const {
        getChartSelector,
        toolTipHandlers,
        appendTooltip } = useContext(ChartContext)


    const chartType = 'stackedBar'
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

        const dyWidth = Math.max(460, data.length * 150)
        const margin = { top: 10, right: 30, bottom: 40, left: 50 },
            width = (Math.min((dyWidth), 1000)) - margin.left - margin.right,
            height = 420 - margin.top - margin.bottom;
        const marginY = (margin.top + margin.bottom) * 3
        const marginX = margin.left + margin.right

        // append the svg object to the body of the page
        const svg = d3.create("svg")
            .attr("width", width + marginX)
            .attr("height", height + marginY)
            .attr("viewBox", [0, 0, width + marginX, height + marginY])

        const g = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top + 50})`)

        const subgroups = Object.keys(data[0]).slice(1)

        const groups = data.map(d => (d.group))

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
            .call(d3.axisLeft(y))
            
        if (showYLabels()) {
            svg.append("g")
            .append("text")
            .attr("class", "y label")
            .attr("text-anchor", "end")
            .attr("y",  yAxis.labelPadding || 0)
            .attr("x", (height/2) * -1)
            .attr("dy", ".74em")
            .attr("transform", "rotate(-90)")
            .text(yAxis.label || "Frequency")
        }
        
            
        if (xAxis.label && showXLabels()) {
            svg.append("g")
                .append("text")
                .attr("class", "x label")
                .attr("text-anchor", "end")
                .attr("x", width / 1.5)
                .attr("y", height * 1.3)
                .text(xAxis.label)
        }

        // color palette = one color per subgroup
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

        const formatVal = (v) => xAxis.formatter ? xAxis.formatter(v) : v

        const getSubgroupLabel = (v) => subGroupLabels[v] || v

        g.selectAll(".y-grid")
            .data(y.ticks())
            .enter().append("line")
            .attr("class", "y-grid")
            .attr("x1", 0)
            .attr("y1", d => Math.ceil(y(d)))
            .attr("x2", width)
            .attr("y2", d => Math.ceil(y(d)))
            .style("stroke", "#eee") // Light gray
            .style("stroke-width", "1px")

        // Show the bars
        g.append("g")
            .selectAll("g")
            // Enter in the stack data = loop key per key = group per group
            .data(stackedData)
            .join("g")
            .attr("fill", d => {
                const color = colorScale(d.key)
                const label = getSubgroupLabel(d.key)
                colors.current[label] = { color, label, value: formatVal(getSubGroupSum(d.key)) }
                return color
            })
            .selectAll("rect")
            // enter a second time = loop subgroup per subgroup to add all rectangles
            .data(D => D.map(d => (d.key = D.key, d)))
            .join("rect")
            .attr('data-value', d => formatVal(d[1] - d[0]))
            .attr('data-label', d => {
                return getSubgroupLabel(d.key)
            })
            .attr("x", d => x(d.data.group))
            .attr("y", height)
            .attr("height", 0)
            .attr("width", x.bandwidth())
            .append("title")
            .text(d => {
                return `${d.data.group}\n${getSubgroupLabel(d.key)}: ${formatVal(d[1] - d[0])}`
            })

        svg.selectAll("rect")
            .on("mouseover", toolTipHandlers(chartId, chartType).mouseover)
            .on("mousemove", toolTipHandlers(chartId, chartType).mousemove)
            .on("mouseleave", toolTipHandlers(chartId, chartType).mouseleave)

        svg.selectAll("rect")
            .transition()
            .duration(800)
            .attr("height", d => {
                return y(d[0]) - y(d[1])
            })
            .attr("y", d => {
                return y(d[1] - d[0])
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
    }, [filters])

    return (
        <div className={`c-visualizations__chart c-visualizations__stackedBar c-bar`} id={`c-visualizations__stackedBar--${chartId}`}></div>
    )
}

export default StackedBar