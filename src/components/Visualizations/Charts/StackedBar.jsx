import * as d3 from 'd3'
import { useContext, useEffect, useRef, memo } from 'react'
import PropTypes from 'prop-types'
import ChartContext from '@/context/ChartContext'
import THEME from '@/lib/helpers/theme'

const StackedBar = memo(({
    setLegend,
    filters,
    data = [],
    subGroupLabels = {},
    chartId = 'modal',
    style = {},
    yAxis = {},
    xAxis = {}
}) => {
    const hasLoaded = useRef(false)
    const {  getSubGroupSum, colors, getChartSelector, toolTipHandlers, svgDo, appendTooltip } =
        useContext(ChartContext)

    const chartType = 'stackedBar'
    const chartData = useRef([])

    const buildChart = () => {
        colors.current = {}
        let names = svgDo({ data, xAxis }).sortLabels('group')

        // Declare the chart dimensions and margins.
        const sizing = svgDo({ data }).sizing(style, chartId, chartType)

        if (svgDo({ xAxis }).showXLabels()) {
            svgDo({}).adjustSizingByTicks(sizing, names, 'left')
        }

        
        const { width, height, margin } = sizing
        // Create the color scale.
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

        const subgroups = Object.keys(subGroupLabels)
        const getSubgroupLabel = (v) => subGroupLabels[v] || v

        const groups = data.map((d) => d?.group)
        
        const _minX = xAxis.minY || (xAxis.scaleLog ? 1 : 0)

         // Determine the series that need to be stacked.
        const stackGen = d3.stack()
                  .keys(subgroups)
                  .value((d, k) => {
                    return +d[k] || _minX
                  })
        
        const series = stackGen(data)

        // Compute the height from the number of stacks.
        sizing.height = series[0].length * 25 + margin.top + margin.bottom;
        
        const maxX = d3.max(series, d => d3.max(d, d => d[1]))

        const {x, domain, ticks} = svgDo({ data }).axis({ name: 'x', max: maxX, axis: xAxis, range: [margin.left, width - margin.left] })
        const minX = domain[0]

        const y =  d3.scaleBand()
            .domain(d3.groupSort(data, D => -d3.sum(D, d => d.value), d => d.group))
            .range([0, height])
            .padding(0.2);


        // A function to format the value in the tooltip.
        const formatVal = ({ d, v }) =>
            svgDo({}).valueFormatter({ d, v, style })

        // Create the SVG container.
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0,    width + margin.left + margin.right,
                height + margin.top + margin.bottom])

        const g = svg
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`)

        // Append a group for each series, and a rect for each element in the series.
        g.append("g")
          .selectAll()
          .data(series)
          .join("g")
            .attr("fill", d => {
              const color = svgDo({}).getColor(d.key, style, colorScale)
                const legendKey = style.legendKey ? style.legendKey(d) : d.key
                colors.current[legendKey] = {
                    color,
                    key: d.key,
                    value: style.legendValue ? style.legendValue({ d, v: d.value, data }) : formatVal({d, v: getSubGroupSum(data, d.key)}),
                    label: style.legendLabel ? style.legendLabel(d) : getSubgroupLabel(d.key)
                }
                return color
            }
          )
          .selectAll("rect")
          .data(D => D.map(d => (d.key = D.key, d)))
          .join("rect")
            .attr("x", d => x(minX))
            .attr("y", d => {
          
              return y(d.data.group)
            })
            .attr("height", y.bandwidth())
            .attr("width", d => 0)
            .on('mouseover', toolTipHandlers(chartId, chartType).mouseover)
            .on('mousemove', toolTipHandlers(chartId, chartType).mousemove)
            .on('mouseleave', toolTipHandlers(chartId, chartType).mouseleave)


        g.selectAll("rect")
            .transition()
            .duration(800)
            .attr("x", d => {
              const v = d[0] == _minX ? minX : (d[0] || minX)
              return x(v)
            })
            .attr("width", d => {
                const v = d[0] == _minX ? minX : (d[0] || minX)
                return x(d[1]) - x(v)
            })

        // Append the horizontal axis.
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
                    .style('font-size', '12px')

        // Append the vertical axis.
        const yAxisGroup = g.append('g')
            .attr('transform', `translate(${margin.left},0)`)
            .call(
                d3
                    .axisLeft(y)
                    .ticks(ticks)
                    .tickFormat((y) =>
                        yAxis.formatter ? yAxis.formatter(y) : y
                    )
            )

        yAxisGroup
             .selectAll('.tick text')
             .style('cursor', 'pointer')
             .on('mouseover', function (event, d) {
                 toolTipHandlers(chartId).mouseover(event, d)
             })
             .on('mousemove', function (event, d) {
                 event.stacked = true
                 event.colors = colors.current
                 toolTipHandlers(chartId).mousemove(event, d)
             })
             .on('mouseout', function (event, d) {
                 toolTipHandlers(chartId).mouseleave(event, d, false)
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
            className={`c-visualizations__chart c-visualizations__stackedBar`}
            id={`c-visualizations__stackedBar--${chartId}`}
        ></div>
    )
})

StackedBar.propTypes = {
    children: PropTypes.node
}

export default StackedBar
