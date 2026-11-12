import * as d3 from 'd3'
import { useContext, useEffect, useRef, memo } from 'react'
import PropTypes from 'prop-types'
import ChartContext from '@/context/ChartContext'

const Bar = memo(({
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
    const { getChartSelector, toolTipHandlers, svgDo, appendTooltip } =
        useContext(ChartContext)

    const chartType = 'bar'
    const colors = useRef({})
    const chartData = useRef([])

    const showXLabels = () =>
        xAxis.showLabels !== undefined ? xAxis.showLabels : true

    const buildChart = () => {
        let names = svgDo({ data, xAxis }).sortLabels()

        // Declare the chart dimensions and margins.
        const sizing = svgDo({ data }).sizing(style, chartId, chartType)

        if (showXLabels()) {
            svgDo({}).adjustSizingByTicks(sizing, names)
        }

        let { width, height, margin } = sizing

        // Declare the x (horizontal position) scale.
        const y = d3
            .scaleBand()
            .domain(names) // descending value
            .range([0, height])
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

        // Bar must have a minimum height to be able to click. 2% of the max value seems good
        const maxX = d3.max(data, (d) => d.value)
        const minX = xAxis.scaleLog ? 1 : -(maxX * 0.02)
        const xDomain = [minX, maxX]
        const ticks =
            xAxis.scaleLog || xAxis.ticks ? xAxis.ticks || 3 : undefined

        // Declare the y (vertical position) scale.
        let x = xAxis.scaleLog
            ? d3.scaleLog().domain(xDomain).nice()
            : d3.scaleLinear().domain(xDomain)

        x = x.range([margin.left, width])

        // Create the SVG container.
        const svg = d3
            .create('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [
                0,
                0,
                width + margin.left + margin.right,
                height + margin.top + margin.bottom
            ])

        const g = svg
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top * 2})`)

        //svgDo({}).grid({ g: svg, y: x, hideGrid: style.hideGrid, ticks, sizing })
        const formatVal = ({ d, v }) =>
            svgDo({}).valueFormatter({ d, v, style })

        // Add a rect for each bar.
        g.append('g')
            .selectAll()
            .data(data)
            .join('rect')
            .attr('class', (d) => `bar--${d.id?.toDashedCase()}`)
            .attr('y', (d) => y(d.label))
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
            .attr('x', (d) => x(minX))
            .attr('height', y.bandwidth())
            .attr('width', (d) => x(minX) - x(minX))
            .on('click', function (event, d) {
                if (onSectionClick) {
                    onSectionClick(d.label)
                }
            })

        // Animation
        g.selectAll('rect')
            .transition()
            .duration(800)
            .attr('width', function (d) {
                return x(d.value)
            })
            .delay(function (d, i) {
                return i * 100
            })

        g.selectAll('rect')
            .on('mouseover', toolTipHandlers(chartId, chartType).mouseover)
            .on('mousemove', toolTipHandlers(chartId, chartType).mousemove)
            .on('mouseleave', toolTipHandlers(chartId, chartType).mouseleave)

        // Add the x-axis and label.
        const xAxisGroup = g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(
                d3
                    .axisBottom(x)
                    .tickFormat((x, i) =>
                        xAxis.formatter ? xAxis.formatter(x, i) : x
                    )
            )
            .selectAll('text')
            .style('font-size', '14px')
        if (xAxis.rotateLabels) {
            xAxisGroup
                .style('text-anchor', 'end')
                .attr('dx', '-0.8em')
                .attr('dy', '0.15em')
                .attr('transform', 'rotate(-45)')
        }         

        // Add the y-axis and label, and remove the domain line.
        g.append('g')
            .attr('transform', `translate(${margin.left + margin.right},0)`)
            .call(
                d3
                    .axisLeft(y)
                    .ticks(ticks)
                    .tickFormat((y) =>
                        yAxis.formatter ? yAxis.formatter(y) : y
                    )
            )
            .selectAll('text')
            .style('font-size', '14px')

        g.selectAll('.text')
            .data(data)
            .enter()
            .append('text')
            .attr('class', 'number-label')
            .text(function (d) {
                return formatVal({ d, v: d.value })
            })
            .attr('y', function (d) {
                return y(d.label) + y.bandwidth() / 1.3
            }) 
            .attr('x', function (d) {
                return x(minX)
            }) 
            .attr('text-anchor', 'middle') // Align center
            .style('font-size', '12px')
            .style('fill', '#333')
            .style('opacity', 0)

        g.selectAll('.number-label')
            .transition()
            .duration(800)
            .style('opacity', 1)
            .attr('x', function (d) {
                return x(d.value) + 20
            })
            .delay(function (d, i) {
                return i * 100
            })


        // Return the SVG element.
        return svg.node()
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
    }, [filters, xAxis])

    return (
        <div
            className={`c-visualizations__chart c-visualizations__bar c-bar`}
            id={`c-visualizations__bar--${chartId}`}
        ></div>
    )
})

Bar.propTypes = {
    children: PropTypes.node
}

export default Bar
