import React, { memo } from 'react'
import * as d3 from 'd3'
import { useContext, useEffect, useRef } from 'react'
import ChartContext from '@/context/ChartContext'

const StackedColumn = memo(({
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
    const { getChartSelector, toolTipHandlers, svgDo, appendTooltip } =
        useContext(ChartContext)

    const chartType = 'stackedColumn'
    const colors = useRef({})
    const chartData = useRef([])
    

    const getSubGroupSum = (key) => {
        let sum = 0
        for (let d of data) {
            sum += d[key] || 0
        }
        return sum
    }

    const buildChart = () => {
      
        const sizing = svgDo({ data }).sizing(style, chartId, chartType)
        let { width, height, margin } = sizing
        const rotateLabels = xAxis.rotateLabels || sizing.isMobile

        // append the svg object to the body of the page
        const svg = d3
            .create('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, height + margin.top])

        const g = svg.append('g')

        const subgroups = Object.keys(subGroupLabels)

        const groups = data.map((d) => d?.group)

        // Add X axis
        const x = d3
            .scaleBand()
            .domain(groups)
            .range([margin.left, width - margin.right])
            .padding([0.2])

        const xAxisGroup = g.append('g')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickFormat((x, i) =>
                        xAxis.formatter ? xAxis.formatter(x, i) : x
                    ))

        const ticks =
            yAxis.scaleLog || yAxis.ticks ? yAxis.ticks || 3 : undefined
        const scaleMethod = yAxis.scaleLog ? d3.scaleLog : d3.scaleLinear

        const _minY = yAxis.minY || (yAxis.scaleLog ? 1 : 0)

        const stackGen = d3.stack()
          .keys(subgroups)
          .value((d, k) => {
            return +d[k] || _minY
          })

        const stackedSeries = stackGen(data)
        const maxY = d3.max(stackedSeries, d => d3.max(d, d => d[1]))
        const minY = yAxis.scaleLog ? 1 : -(maxY * 0.02)
        const minRange = height - margin.bottom

        const yaxis = scaleMethod().domain([minY, maxY])

        if (yAxis.scaleLog) {
            yaxis.nice()
        }

        // Add Y axis
        const y = yaxis.range([minRange, margin.top])

        g.append('g')
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

        // color palette = one color per subgroup
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

        const formatVal = ({ d, v }) =>
            svgDo({}).valueFormatter({ d, v, style })

        const getSubgroupLabel = (v) => subGroupLabels[v] || v

        svgDo({}).grid({ g, y, hideGrid: style.hideGrid, ticks, sizing })

        // Show the bars
        g.append('g')
            .selectAll('g')
            // Enter in the stack data = loop key per key = group per group
            .data(stackedSeries)
            .join("g")
              .attr('class', d => style.highlight === d.key ? 'g--highlight' : '')
              .attr("fill", d => {
                const color = style.colorScale  ? style.colorScale({d, maxY}) : colorScale(d.key)
                const label = getSubgroupLabel(d.key)
                colors.current[label] = { color, label, value: formatVal({d, v: getSubGroupSum(d.key)}) }
                return color
            })
            .selectAll("rect")
            // enter a second time = loop subgroup per subgroup to add all rectangles
            .data(D => D.map(d => (d.key = D.key, d)))
            .join("rect")
            .attr('data-value', d => {
                return formatVal({d, v: d.data[d.key]})
            })
            .attr('data-label', d => {
                return getSubgroupLabel(d.key)
            })
            .attr("class", d => `stackedColumn--${getSubgroupLabel(d.key)?.toDashedCase()} ${style.highlight === d.key ? 'stackedColumn--highlighted' : ''}`)
            
            .attr("x", d => x(d.data.group))
            .attr("y", d => {
              return y(minY)
            })
            .attr("height", 0)
            .attr("width", x.bandwidth() )
            .append("title")
            .text(d => {
                return `${xAxis.formatter ? xAxis.formatter(d.data.group) : d.data.group}\n${getSubgroupLabel(d.key)}: ${formatVal({d, v: d.data[d.key]})}`
            })

        svg.selectAll('rect')
            .on('mouseover', toolTipHandlers(chartId, chartType).mouseover)
            .on('mousemove', toolTipHandlers(chartId, chartType).mousemove)
            .on('mouseleave', toolTipHandlers(chartId, chartType).mouseleave)

        svg.selectAll("rect")
            .transition()
            .duration(800)
            .attr("y", d => {
              return y(d[1])
            })
            .attr("height", d => {
                const x = d[0] == _minY ? minRange : y(d[0] || minY)
                return x - y(d[1])
            })


        xAxisGroup.selectAll(".tick text")
        .style("cursor", "pointer") 
        .on("mouseover", function(event, d) {
          toolTipHandlers(chartId).mouseover(event, d)
        })
        .on("mousemove", function(event, d) {
          event.fromTick = true
          event.colors = colors.current
          toolTipHandlers(chartId).mousemove(event, d)
        })
        .on("mouseout", function(event, d) {
          event.fromTick = true

          toolTipHandlers(chartId).mouseleave(event, d, false)
        })

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
    }, [filters, yAxis])

    return (
        <div
            className={`c-visualizations__chart c-visualizations__stackedColumn c-bar`}
            id={`c-visualizations__stackedColumn--${chartId}`}
        ></div>
    )
})

export default StackedColumn
