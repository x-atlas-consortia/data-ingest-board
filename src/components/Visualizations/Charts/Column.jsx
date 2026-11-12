import * as d3 from 'd3'
import { useContext, useEffect, useRef, memo } from 'react'
import PropTypes from 'prop-types'
import ChartContext from '@/context/ChartContext'

const Column = memo(({
    setLegend,
    filters,
    data = [],
    chartId = 'modal',
    onSectionClick,
    style = {},
    yAxis = {},
    xAxis = {}
}) => {
    const hasLoaded = useRef(false)
    const { colors, getChartSelector, toolTipHandlers, svgDo, appendTooltip } =
        useContext(ChartContext)
    const chartData = useRef([])

    const buildChart = () => {
        colors.current = {}
        let names =  svgDo({ data, xAxis }).sortLabels()

        // Declare the chart dimensions and margins.
        const sizing = svgDo({ data }).sizing(style, chartId)

        if (svgDo({ xAxis }).showXLabels() && xAxis.rotateLabels) {
            svgDo({}).adjustSizingByTicks(sizing, names)
        }

        const { width, height, margin } = sizing

        // Declare the x (horizontal position) scale.
        const x = d3
            .scaleBand()
            .domain(names) // descending value
            .range([margin.left, width - margin.right])
            .padding(0.2)

        const scaleRange = data.length <= 1 ? 2 : data.length

        // Create the color scale.
        const colorScale = d3
            .scaleOrdinal()
            .domain(data.map((d) => d.label))
            .range(
                d3.quantize(
                    (t) => d3.interpolateSpectral(t * 0.8 + 0.1),
                    scaleRange
                )
            )
  
        const {y, domain, ticks} = svgDo({ data }).axis({ axis: yAxis, range: [height - margin.bottom, margin.top] })
        const [minY, maxY] = domain

        // Create the SVG container.
        const svg = d3
            .create('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, height + margin.top])

        svgDo({}).grid({ g: svg, y, hideGrid: style.hideGrid, ticks, sizing })
        const formatVal = ({ d, v }) =>
            svgDo({}).valueFormatter({ d, v, style })

        // Add a rect for each bar.
        svg.append('g')
            .selectAll()
            .data(data)
            .join('rect')
            .attr('class', (d) => `column--${d.id?.toDashedCase()}`)
            .attr('x', (d) => x(d.label))
            .attr('data-value', (d) => formatVal({ d, v: d.value }))
            .attr('fill', function (d) {
                const color = svgDo({}).getColor(d.label, style, colorScale)
                colors.current[d.label] = {
                    color,
                    value: formatVal({ d, v: d.value }),
                    label: d.label
                }
                return color
            })
            .attr('y', (d) => y(minY))
            .attr('height', (d) => y(minY) - y(minY))
            .attr('width', x.bandwidth())
            .on('click', function (event, d) {
                if (onSectionClick) {
                    onSectionClick(d.label)
                }
            })

        // Animation
        svg.selectAll('rect')
            .transition()
            .duration(800)
            .attr('y', (d) => y(d.value))
            .attr('height', function (d) {
                return y(minY) - y(d.value)
            })
            .delay(function (d, i) {
                return i * 100
            })

        // Add the x-axis and label.
        const xAxisGroup = svg.append('g')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(
                d3
                    .axisBottom(x)
                    .tickFormat((x, i) =>
                        xAxis.formatter ? xAxis.formatter(x, i) : x
                    )
            )
            .selectAll('text')
            .attr('class', 'x-axis-label')
            .style('display', svgDo({  xAxis }).showXLabels() ? 'block' : 'none')
            .style('font-size', '11px')
            

        svgDo({ xAxis }).rotateLabels({ axisGroup: xAxisGroup, axis: xAxis })

        // Add the y-axis and label, and remove the domain line.
        svg.append('g')
            .attr('transform', `translate(${margin.left},0)`)
            .call(
                d3
                    .axisLeft(y)
                    .ticks(ticks)
                    .tickFormat((y) =>
                        yAxis.formatter ? yAxis.formatter(y) : y.toFixed()
                    )
            )

        svgDo({ xAxis, yAxis }).axisLabels({ svg, sizing })

        const highlightGroup = svg.append("g").attr("class", "highlights")

        highlightGroup.selectAll(".column-hover")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "column-hover")
            .attr('data-value', (d) => formatVal({ d, v: d.value }))
            .attr("x", d => x(d.label)) // Match the x position of the data band
            .attr("width", x.bandwidth())  // Match the exact width of the column band
            .attr("y", d => margin.top)                       // Start from the very top of the chart
            .attr("height", d => y(minY) - margin.top)        // Stretch to the very bottom of the chart
            .style("fill", "transparent")       // Invisible by default, but still interactive
            .style("pointer-events", "all")     // Crucial: ensures transparent elements catch mouse events
            .on("mouseover", function(event, d) {
                // Turn the background a subtle gray or light color on hover
                d3.select(this).style("fill", "rgba(0, 0, 0, 0.05)");
                toolTipHandlers(chartId).mouseover(event, d)
            })
            .on("mouseout", function(event, d) {
                toolTipHandlers(chartId).mouseleave(event, d, false)
                // Reset to transparent when the mouse leaves the column space
                d3.select(this).style("fill", "transparent");
               
            })
            .on('mousemove', toolTipHandlers(chartId).mousemove)

        // Return the SVG element.
        return svg.node()
    }

    const updateChart = () => {
        $(getChartSelector(chartId)).html('')
        appendTooltip(chartId)
        $(getChartSelector(chartId)).append(buildChart())

        if (setLegend) {
            setLegend(colors.current)
        }
    }
    useEffect(() => {
        if (
            chartData.current.length !== data.length ||
            !hasLoaded.current
        ) {
            hasLoaded.current = true
            chartData.current = Array.from(data)
            updateChart()
        }
    }, [data])

    useEffect(() => {
        updateChart()
    }, [filters, yAxis])

    return (
        <div
            className={`c-visualizations__chart c-visualizations__bar c-bar`}
            id={`c-visualizations__column--${chartId}`}
        ></div>
    )
})

Column.propTypes = {
    children: PropTypes.node
}

export default Column
