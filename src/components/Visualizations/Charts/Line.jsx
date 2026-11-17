import React, { memo } from 'react'
import * as d3 from 'd3'
import { useContext, useEffect, useRef } from 'react'
import ChartContext from '@/context/ChartContext'
import THEME from '@/lib/helpers/theme'

const Line = memo(
    ({
        setLegend,
        filters,
        data = [],
        subGroupLabels = {},
        chartId = 'modal',
        style = {},
        yAxis = {},
        xAxis = {}
    }) => {
        const chartType = 'line'
        const chartData = useRef([])
        const hasLoaded = useRef(false)

        const {
            colors,
            getChartSelector,
            toolTipHandlers,
            getSubGroupSum,
            appendTooltip,
            svgDo
        } = useContext(ChartContext)

        const buildChart = () => {
            colors.current = {}
            const sizing = svgDo({ data }).sizing(style, chartId, chartType)
            let { width, height, margin } = sizing

            // append the svg object to the body of the page
            const svg = d3
                .create('svg')
                .attr('width', width)
                .attr('height', height)
                .attr('viewBox', [0, 0, width, height + margin.top])

            const g = svg.append('g')

            const formatVal = ({ d, v }) =>
                svgDo({}).valueFormatter({ d, v, style })

            const getSubgroupLabel = (v) => subGroupLabels[v] || v

            const maxY = d3.max(data, (d) => d.value)

            // A color scale: one color for each group
            const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

            const sumstat = d3.group(data, (d) => d.subGroup) // nest function allows to group the calculation per level of a factor

            // 3. Setup scales
            const x = d3
                .scaleTime()
                .domain(d3.extent(data, (d) => d.group))
                .range([0, width])

            const { y, domain, ticks } = svgDo({ data }).axis({
                max: maxY,
                axis: yAxis,
                range: [height, 0]
            })

            // 4. Draw axes
            svg.append('g')
                .attr('transform', `translate(0,${height})`)
                .call(d3.axisBottom(x).tickFormat((x) =>
                        xAxis.formatter ? xAxis.formatter(x) : x
                    ))

            svg.append('g').call(
                d3
                    .axisLeft(y)
                    .ticks(ticks)
                    .tickFormat((y) =>
                        yAxis.formatter ? yAxis.formatter(y) : y.toFixed()
                    )
            )

            // 5. Draw lines
            const lineGenerator = d3
                .line()
                .x((d) => x(d.group))
                .y((d) => y(d.value))

            svg.selectAll('.line')
                .data(sumstat)
                .join('path')
                .attr('fill', 'none')
                .attr('stroke', (d) => {
                    const key = d[0]
                    const label = getSubgroupLabel(key)
                    const color = style.colorScale
                        ? style.colorScale({ d, maxY })
                        : colorScale(key)
                    colors.current[key] = {
                        color,
                        label,
                        key,
                        value: formatVal({ d, v: getSubGroupSum(data, key) })
                    }
                    return color
                })
                .attr('stroke-width', 2)
                .attr('d', (d) => lineGenerator(d[1]))

            // 6. Add interactive overlay and dots
            const tooltip = d3
                .select('body')
                .append('div')
                .attr('class', 'tooltip')
                .style('position', 'absolute')
                .style('visibility', 'hidden')
                .style('background', 'white')
                .style('padding', '8px')
                .style('border', '1px solid #ccc')
                .style('border-radius', '4px')

            // Create dot group per series
            const dots = svg
                .selectAll('.dot-group')
                .data(sumstat)
                .join('g')
                .attr('class', 'dot-group')

            dots.append('circle')
                .attr('r', 0)
                .attr('fill', (d) => colorScale(d[0]))
                .attr('stroke', '#fff')
                .attr('stroke-width', 2)

            const hoverLine = svg.append("line")
              .attr("class", "hover-line")
              .attr("y1", 0)
              .attr("y2", height)
              .style("stroke", "#999")
              .style("stroke-dasharray", "4,4")
              .style("opacity", 0)

            // Transparent rect for mouse tracking
            svg.append('rect')
                .attr('width', width)
                .attr('height', height)
                .attr('fill', 'none')
                .attr('pointer-events', 'all')
                .on('mouseover', function (event, d) {
                    toolTipHandlers(chartId).mouseover(event, d)
                })
                .on('pointermove', pointermoved)
                .on('pointerleave', pointerleft)

            const bisect = d3.bisector((d) => d.group).left

            function pointermoved(event, d) {
                const [xm] = d3.pointer(event)
                const dateValue = x.invert(xm)

                // Find closest data point for each series and update dot positions
                dots.selectAll('circle')
                    .attr('cx', (d) => {
                        const seriesData = d[1]
                        const i = bisect(seriesData, dateValue, 1)
                        const d0 = seriesData[i - 1]
                        const d1 = seriesData[i]
                        const closest =
                            d1 && dateValue - d0.group > d1.group - dateValue
                                ? d1
                                : d0
                        return x(closest.group)
                    })
                    .attr('cy', (d) => {
                        const seriesData = d[1]
                        const i = bisect(seriesData, dateValue, 1)
                        const d0 = seriesData[i - 1]
                        const d1 = seriesData[i]
                        const closest =
                            d1 && dateValue - d0.group > d1.group - dateValue
                                ? d1
                                : d0
                        return y(closest.value)
                    })
                    .attr('r', 5)

                hoverLine.style("opacity", 1);
                hoverLine.attr("transform", `translate(${x(dateValue)}, 0)`)

                toolTipHandlers(chartId).mousemove(event, {
                    ...d,
                    group: d3.timeFormat('%Y-%m-%d')(dateValue) + 'T00:00:00',
                    date: dateValue,
                    colors: colors.current
                })
            }

            function pointerleft(event, d) {
                dots.selectAll('circle').attr('r', 0)
                hoverLine.style("opacity", 0);
                toolTipHandlers(chartId).mouseleave(event, d, false)
            }

            return svg.node()
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
        }, [filters])

        return (
            <div
                className={`c-visualizations__chart c-visualizations__line`}
                id={`c-visualizations__line--${chartId}`}
                data-type='line'
            ></div>
        )
    }
)

export default Line
