import React from 'react'
import * as d3 from 'd3';
import { useContext, useEffect, useRef } from 'react'
import ChartContext from '@/context/ChartContext';
import THEME from "@/lib/helpers/theme";

function Line({
    setLegend,
    filters,
    data = [],
    reload = true,
    groups = [],
    chartId = 'modal',
    colorGroups = [],
    yAxis = {},
    xAxis = {}
}) {

    const chartType = 'line'
    const colors = useRef({})
    const chartData = useRef([])
    const hasLoaded = useRef(false)

    const {
        getChartSelector,
        toolTipHandlers,
        appendTooltip,
    } = useContext(ChartContext)

    const showXLabels = () => xAxis.showLabels !== undefined ? xAxis.showLabels : true

    const showYLabels = () => yAxis.showLabels !== undefined ? yAxis.showLabels : true

    const buildChart = () => {

        const dyWidth = Math.max(460, data.length * 150)
        const margin = { top: 10, right: 30, bottom: 30, left: 50 },
            width = (Math.min((dyWidth), 1000)) - margin.left - margin.right,
            height = 430 - margin.top - margin.bottom;
        const marginY = (margin.top + margin.bottom) * 3
        const marginX = (margin.left + margin.right) * 3

        // append the svg object to the body of the page
        const svg = d3.create("svg")
            .attr("width", width + marginX)
            .attr("height", height + marginY)
        //.attr("viewBox", [0, 0, width + marginX, height + marginY])

        const g = svg
            .append("g")
            .attr("transform", `translate(${margin.left + 20},${margin.top + 50})`)


        // Reformat the data: we need an array of arrays of {x, y} tuples
        const dataReady = groups.map(function (group) {
            return {
                name: group,
                values: data.map(function (d) {
                    return { xValue: d.xValue, yValue: d[group] || 0, group };
                })
            };
        });

        let maxY = 0;
        let minY = Infinity;
        for (let d of data) {
            let list = Object.values(d)
            for (let x of list) {
                if (typeof x === 'number') {
                    maxY = Math.max(maxY, x)
                    minY = Math.min(minY, x)
                }
            }

        }

        let xGroups = data.map((d) => d.xValue)
        if (xAxis.prefix) {
            xGroups.unshift(xAxis.prefix)
        }
        if (xAxis.suffix) {
            xGroups.push(xAxis.suffix)
        }
        const yStartPos = -(maxY * .02)

        // A color scale: one color for each group
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        const groupColor = (d) => {
            let pos = -1
            let name = d.name
            for (let i = 0; i < colorGroups.length; i++) {
                if (d.name.includes(colorGroups[i])) {
                    pos = (i + 1) * 20;
                    name = name.replace(colorGroups[i], '')
                    break;
                }
            }
            let gColor = colorScale(name)
            let color = gColor
          
            if (pos !== -1) {
                gColor = THEME.lightenDarkenColor(gColor, pos)
            }

            return {color, gColor}

        }

        const formatVal = (v) => yAxis.formatter ? yAxis.formatter(v) : v

        // Add X axis --> it is a date format
        const x = d3.scalePoint()
            .domain(xGroups)
            .range([0, width]);
        g.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x));

        // Add Y axis
        const y = d3.scaleLinear()
            .domain([yStartPos, maxY * 1.02])
            .range([height, 0]);
        g.append("g")
            .call(d3.axisLeft(y).tickFormat((y) => yAxis.formatter ? yAxis.formatter(y) : (y).toFixed()))
        
        if (showYLabels()) {
            svg.append("g")
            .append("text")
            .attr("class", "y label")
            .attr("text-anchor", "end")
            .attr("y",  yAxis.labelPadding || 0)
            .attr("x", (height/1.7) * -1)
            .attr("dy", ".74em")
            .attr("transform", "rotate(-90)")
            .text(yAxis.label || "Frequency")
        }
        
            
        if (xAxis.label && showXLabels()) {
            svg.append("g")
                .append("text")
                .attr("class", "x label")
                .attr("text-anchor", "end")
                .attr("x", width / 1.3)
                .attr("y", height * 1.3)
                .text(xAxis.label)
        }

        // Add the lines
        const line = d3.line()
            .x(d => x(d.xValue))
            .y(d => y(d.yValue))
        
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


        const paths = g.selectAll("line--lines")
            .data(dataReady)
            .join("path")
            .attr("d", d => {
                return line(d.values)
            })
            .attr('pointer-events', 'none')
            .attr("stroke", d => {

                const {color, gColor} = groupColor(d)
                const label = d.name
                const sum = d.values.reduce((accumulator, c) => accumulator + c.yValue, 0);
                colors.current[label] = { color: gColor, style: { border: `solid 3px ${color}`, borderRadius: '50%' }, label, value: formatVal(sum) }
                return color
            })
            .style("stroke-width", 4)
            .style("fill", "none")


        // Add the points
        g
            // First we need to enter in a group
            .selectAll("line--nodes")
            .data(dataReady)
            .join('g')
            .style("fill", d => {
                const {gColor} = groupColor(d)
                return gColor
            })
            // Second we need to enter in the 'values' part of this group
            .selectAll("line--dots")
            .data(d => d.values)
            .join("circle")
            .attr("cx", d => x(d.xValue))
            .attr("cy", d => y(d.yValue))
            .attr("r", 5)
            .attr('pointer-events', 'all')
            .attr('data-linename', (d) => d.group.replaceAll(':', '_'))
            .attr('data-value', (d) => formatVal(d.yValue))
            .attr('data-label', (d) => `${d.group} \n ${d.xValue}`)

        // Add a legend at the end of each line
        g
            .selectAll("line--labels")
            .data(dataReady)
            .join('g')
            .append("text")
            .datum(d => { return { name: d.name, value: d.values[d.values.length - 1] }; }) // keep only the last value of each time series
            .attr("transform", d => `translate(${x(d.value.xValue)},${y(d.value.yValue)})`) // Put the text at the position of the last point
            .attr("x", 12) // shift the text a bit more right
            .attr('class', (d) => `line--${d.name.replaceAll(':', '_')}`)
            .text(d => d.name)
            .style("fill", d => {
                const {gColor} = groupColor(d)
                return gColor
            })
            .style("font-size", 10)
            .style("opacity", 0)


        svg.selectAll("circle")
            .on("mouseenter", toolTipHandlers(chartId, chartType).mouseenter)
            .on("mouseleave", toolTipHandlers(chartId, chartType).mouseleave)

        let path, length


        paths
            .each(function (d, i) {

                path = d3.select(this)
                length = path.node().getTotalLength()

                path
                    .attr("stroke-dasharray", length + " " + length)
                    .attr("stroke-dashoffset", length)
                    .transition()
                    .ease(d3.easeLinear)
                    .attr("stroke-dashoffset", 0)
                    .duration(500)

            })


        return svg.node();
    }

    const updateChart = () => {
        $(getChartSelector(chartId, chartType)).html('')
        appendTooltip(chartId, chartType)
        $(getChartSelector(chartId, chartType)).append(buildChart())

        if (setLegend) {
            setLegend(Object.keys(colors.current).keySort(colors.current))
        }
    }

    useEffect(() => {
        if (reload || chartData.current.length !== groups.length || !hasLoaded.current) {
            hasLoaded.current = true
            chartData.current = Array.from(groups)
            colors.current = {}
            updateChart()
        }

    }, [data])

    useEffect(() => {
        updateChart()
    }, [filters])

    return (
        <div className={`c-visualizations__chart c-visualizations__line`} id={`c-visualizations__line--${chartId}`} data-type='line'></div>
    )
}

export default Line