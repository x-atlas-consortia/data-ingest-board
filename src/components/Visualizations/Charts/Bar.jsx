import * as d3 from 'd3'
import { useContext, useEffect, useRef, memo } from 'react'
import PropTypes from 'prop-types'
import ChartContext from '@/context/ChartContext'
import THEME from '@/lib/helpers/theme'

const Bar = memo(({
    setLegend,
    filters,
    data = [],
    chartId = 'modal',
    style = {},
    yAxis = {},
    xAxis = {}
}) => {
    const hasLoaded = useRef(false)
    const { colors, getChartSelector, toolTipHandlers, svgDo, appendTooltip } =
        useContext(ChartContext)

    const chartType = 'bar'
    const chartData = useRef([])

    const buildChart = () => {
        colors.current = {}
        const names = svgDo({ data, xAxis }).sortLabels()

        // Declare the chart dimensions and margins.
        const sizing = svgDo({ data }).sizing(style, chartId, chartType)

        if (svgDo({ xAxis }).showXLabels()) {
            svgDo({}).adjustSizingByTicks(sizing, names, 'left')
        }

        const { width, height, margin } = sizing

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

        // Declare the x (horizontal position) scale.
        const {x, domain, ticks} = svgDo({ data }).axis({ name: 'x', axis: xAxis, range: [margin.left, width - margin.left] })
        const minX = domain[0]

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
            .attr('transform', `translate(${margin.left}, ${margin.top})`)

        //svgDo({}).grid({ g: svg, y: x, hideGrid: style.hideGrid, ticks, sizing })
        const formatVal = ({ d, v }) =>
            svgDo({}).valueFormatter({ d, v, style })

        // Add a rect for each bar.
        g.append('g')
            .selectAll()
            .data(data)
            .join('rect')
            .attr('class', (d) => `bar bar--${d.id?.toDashedCase()}`)
            .attr('y', (d) => y(d.label) + svgDo({}).shapeBandwidth(y).offset)
            .attr('data-value', (d) => formatVal({ d, v: d.value }))
            .attr('fill', (d) => {
                const color = svgDo({}).getColor(d.label, style, colorScale)
                const legendKey = style.legendKey ? style.legendKey(d) : d.label
                colors.current[legendKey] = {
                    color,
                    value: style.legendValue ? style.legendValue({ d, v: d.value, data }) : formatVal({ d, v: d.value }),
                    label: style.legendLabel ? style.legendLabel(d) : d.label
                }
                return color
            })
            .attr('x', (d) => x(minX))
            .attr('height', svgDo({}).shapeBandwidth(y).size)
            .attr('width', (d) => x(minX) - x(minX))
            .on('mouseover', toolTipHandlers(chartId, chartType).mouseover)
            .on('mousemove', toolTipHandlers(chartId, chartType).mousemove)
            .on('mouseleave', toolTipHandlers(chartId, chartType).mouseleave)

        // Animation
        g.selectAll('rect')
            .transition()
            .duration(800)
            .attr('width', (d) => x(d.value))
            .delay(function (d, i) {
                return i * 100
            })

        // Add the x-axis and label.
        const xAxisGroup = g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(
                d3
                    .axisBottom(x)
                    .ticks(ticks)
                    .tickFormat((x, i) =>
                        xAxis.formatter ? xAxis.formatter(x, i) : x
                    )
            )
            .selectAll('text')
            .style('font-size', '14px')
            
            
        svgDo({ xAxis }).rotateLabels({ axisGroup: xAxisGroup, axis: xAxis })

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

            .text(function (d) {
                return svgDo({ xAxis }).truncateLabel(d, 20)
            })
            .append('title')
            .text((d) => {
                return d
            })

        g.selectAll('.text')
            .data(data)
            .enter()
            .append('text')
            .attr('class', 'number-label')
            .text((d) => formatVal({ d, v: d.value }))
            .attr('dy', '0.35em') // vertical optical centering
            .attr('y',(d) => y(d.label) + svgDo({}).shapeBandwidth(y).offset + (svgDo({}).shapeBandwidth(y).size / 2)) 
            .attr('x', (d) => x(minX))
            .attr('text-anchor', 'start')
            .style('font-size', THEME.visualizations.font.size)
            .style('fill', THEME.visualizations.font.color)
            .style('opacity', 0)

        g.selectAll('.number-label')
            .transition()
            .duration(800)
            .style('opacity', 1)
            .attr('x', (d) => x(d.value) + 20)
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
            !hasLoaded.current ||
            JSON.stringify(chartData.current) !== JSON.stringify(data)
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
            className={`c-visualizations__chart c-visualizations__bar`}
            id={`c-visualizations__bar--${chartId}`}
        ></div>
    )
})

Bar.propTypes = {
    children: PropTypes.node
}

export default Bar
