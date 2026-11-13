import { createContext, useRef } from 'react'
import * as d3 from "d3";
import THEME from "@/lib/helpers/theme";
import { eq } from "@/lib/helpers/general";

const ChartContext = createContext({})

export const ChartProvider = ({ children, onBuildToolTip }) => {

    const chartId = useRef('main')
    const colors = useRef({})
    const chartData = useRef([])

    const selectors = {
        base: 'c-visualizations__'
    }

    const getChartSelector = (chartId, chart = 'column', withHash = true) => `${withHash ? '#' : ''}${selectors.base}${chart}--${chartId}`


    const appendTooltip = (id, chart = 'column') => {
        chartId.current = id
        d3.select(getChartSelector(id, chart))
            .append('div')
            .attr('id', `${selectors.base}tooltip--${id}`)
            .style('opacity', 0)
            .attr('class', `${selectors.base}tooltip`)
    }

    const getTooltipSelector = (id) => `#${selectors.base}tooltip--${id}`

    const getTooltip = (id) => d3.select(getTooltipSelector(id))

    const handleLineLabel = (id, e, v) => {
        const $element = $(getTooltipSelector(id)).parent()
        const type = $element.attr('data-type')
        if (eq(type, 'line')) {
            const lineName = e.currentTarget.getAttribute('data-linename')
            d3.select(`.line--${lineName}`).style('opacity', v)
        }
    }

    const buildTooltip = (id, e, d) => {
        const containerRect = $(getTooltipSelector(id)).parent()[0]?.getBoundingClientRect()
        const gap = 30 // add a margin to prevent chrome flickering due to overlapping with tooltip
        const label = (e.currentTarget.getAttribute('data-label')) || d.label || d.data?.label
        const value = (e.currentTarget.getAttribute('data-value')) || d.value || d.data?.value

        handleLineLabel(id, e, '1')

        let html = `<em>${label}</em>: <strong>${value}</strong>`
        if (onBuildToolTip) {
            e.colors = colors.current
            html = onBuildToolTip(id, e, d, { label, value }) || html
        }

        getTooltip(id)
            .html(html)

        // 1. Get dimensions and bounding boxes
        const tooltipRect = $(getTooltipSelector(id))[0]?.getBoundingClientRect() 

        let targetX = e.clientX - containerRect.left + gap // 2. Calculate cursor position relative to the container coordinates
        let targetY = e.clientY - containerRect.top + gap // 3. Right boundary collision check

        if (targetX + tooltipRect.width > containerRect.width) {
            // Flip to left side of the cursor if it overflows right
            targetX =
                e.clientX - containerRect.left - tooltipRect.width - gap
        } // Left boundary fallback safety
        if (targetX < 0) targetX = 0 // 4. Bottom boundary collision check

        if (targetY + tooltipRect.height > containerRect.height) {
            // Flip above the cursor if it overflows bottom
            targetY =
                e.clientY - containerRect.top - tooltipRect.height - gap
        } // Top boundary fallback safety
        if (targetY < 0) targetY = 0 // 5. Apply bounded positions

        getTooltip(id)
            .style('left', targetX + 'px')
            .style('top', targetY + 'px')
    }

    const visibleTooltip = (id, e, d) => {
        getTooltip(id)
            .style('opacity', 1)
        d3.select(this)
            .style('opacity', 0.9)
            .style('cursor', 'pointer')
    }

    const toolTipHandlers = (id) => {
        return {
            mouseover: function (e, d) {
                visibleTooltip(id, e, d)
            },
            mouseenter: function (e, d) {
                e.stopPropagation()
                visibleTooltip(id, e, d)
                buildTooltip(id, e, d)
            },
            mousemove: function (e, d) {
                buildTooltip(id, e, d)
            },
            mouseleave: function (e, d, modShape = true) {
                e.stopPropagation()
                handleLineLabel(id, e, '0')
                getTooltip(id)
                    .style('opacity', 0)
                if (modShape) {
                    d3.select(this)
                    .style('stroke', 'none')
                    .style('cursor', 'default')
                    .style('opacity', 1)
                }
            }
        };
    }

    const getSubGroupSum = (data, key) => {
        let sum = 0
        for (let d of data) {
            sum += d[key] || 0
        }
        return sum
    }

    const svgDo = ({xAxis, yAxis, data}) => {
        const showXLabels = () => xAxis.showLabels !== undefined ? xAxis.showLabels : true
        const showYLabels = () => yAxis.showLabels !== undefined ? yAxis.showLabels : true

        const _truncateLabel = (label) => {
            return label.length > 30 ? label.substring(0, 27) + "..." : label;
        }

        return {
            showXLabels,
            showYLabels,
            getColor: (label, style, colorScale) => {
                const color =
                    style?.colorMethods &&
                    style?.colorMethods[style.colorMethodKey]
                        ? style?.colorMethods[style.colorMethodKey](label)
                        : style?.monoColor
                          ? style?.monoColor
                          : colorScale(label)
                return color
            },
            axis: ({ name = 'y', max, axis, range}) => {
                max = max || d3.max(data, (d) => d.value)
                // Chart must have a minimum height/width to be able to click. 2% of the max value seems good
                const min = axis.scaleLog ? 1 : -(max * 0.02)
                const domain = [min, max]
                const ticks =
                    axis.scaleLog || axis.ticks ? axis.ticks || 3 : undefined
        
                let ax = axis.scaleLog
                    ? d3.scaleLog().domain(domain).nice()
                    : d3.scaleLinear().domain(domain)

                if (range) {
                    ax = ax.range(range)
                }
                
                return {[name]: ax, ticks, domain}
            },
            sortLabels: () => {
                let names
                if (xAxis.noSortLabels) {
                    names = data.map((d) => d.label)
                } else {
                    data.sort((a, b) => b.value - a.value)
                    const groups = d3.groupSort(
                        data,
                        ([d]) => -d.value,
                        (d) => d.label
                    )
                    names = groups.map((g) => g)
                }
                return names
            },
            sizing: (style, chartId, chart = 'column') => {
                let $parent = $(getChartSelector(chartId, chart))
                let divWidth = $parent.width()
                let i = 0
                
                while (divWidth <= 0 && i < 10) {
                    $parent = $parent.parent()
                    divWidth = $parent.width()
                    i++
                }

                let _minWidth = 728
                console.log('minWidth', _minWidth, style, divWidth)

                //divWidth = Math.min(divWidth, data?.length * 110)
                divWidth = Math.max(_minWidth, divWidth)

                const minWidth = style.minWidth || divWidth || 728
                
                const minHeight = style.minHeight || 500

                const width = style.width || minWidth
                const height = style.height || minHeight
                const margin = { top: 30, right: 0, bottom: 10, left: 70, ...(style.margin || {}) };
            
                return {width, height, margin,
                    isMobile: width < 500,
                    font: style.fontSize || {title: '16px'}
                }
            },
            truncateLabel: (label) => {
                return _truncateLabel(label)
            },
            adjustSizingByTicks: (sz, names, marginX = 'bottom') => {
            
                // We need to calculate the maximum label width to adjust for the label being at 45 degrees.
                const tempSvg = d3.select("body").append("svg").attr("class", "temp-svg").style("visibility", "hidden");
                let maxLabelWidth = 0;
                names.forEach(name => {
                    const truncName = _truncateLabel(name);
                    const textElement = tempSvg.append("text").text(truncName).style("font-size", "11px");
                    const bbox = textElement.node().getBBox();
                    if (bbox.width > maxLabelWidth) {
                        maxLabelWidth = bbox.width;
                    }
                    textElement.remove();
                });
                tempSvg.remove();
    
                // Adjust the bottom margin and height to not cut off the labels.
                sz.margin[marginX] = sz.margin[marginX] + maxLabelWidth * Math.sin(Math.PI / 4);
                sz.height = sz.height + maxLabelWidth * Math.sin(Math.PI / 4);
            },
            axisLabels: ({svg, sizing}) => {
                 if (yAxis.label && showYLabels()) {
                    svg.append("g")
                    .append("text")
                    .style("font-size", sizing.font.title)
                    .attr("class", "y label")
                    .attr("text-anchor", "start")
                    .attr("y",  yAxis.labelPadding || -20)
                    .attr("x", (sizing.height / 2) * -1)
                    .attr("dy", ".74em")
                    .attr("transform", "rotate(-90)")
                    .text(yAxis.label)
                }
                
                    
                if (xAxis.label && showXLabels()) {
                    svg.append("g")
                        .append("text")
                        .style("font-size", sizing.font.title)
                        .attr("class", "x label")
                        .attr("text-anchor", "middle")
                        .attr("x", (sizing.width / 2) + (sizing.margin.left / 2))
                        .attr("y", sizing.height + (sizing.margin.top / 2))
                        .text(xAxis.label)
                }
            },
            grid: ({g, y, hideGrid, ticks, sizing}) => {
                if (!hideGrid) {
                    g.append("g")
                        .selectAll(".y-grid")
                        .data(y.ticks(ticks))
                        .enter().append("line")
                        .attr("class", "y-grid")
                        .attr("x1", sizing.margin.left)
                        .attr("y1", d => Math.ceil(y(d)))
                        .attr("x2", sizing.width - sizing.margin.right)
                        .attr("y2", d => Math.ceil(y(d)))
                        .style("stroke", "#eee") // Light gray
                        .style("stroke-width", "1px")
                }
            },
            valueFormatter: ({style, d, v}) => { 
                return style.valueFormatter ? style.valueFormatter({d, v}) : v
            },
            rotateLabels: ({ axisGroup, axis}) => {
                if (axis.rotateLabels) {
                    axisGroup
                        .style("text-anchor", "end")
                        .attr("dx", "-0.8em")
                        .attr("dy", "0.15em")
                        .attr("transform", "rotate(-45)")
                        .text(function (d) {
                            return _truncateLabel(d)
                        })
                }
            },
            bubbleLegend: ({svg, radius, height, width = 90}) => {
                let legendData = radius.ticks(4).slice(1)
                legendData = legendData.reduce((acc, d, i) => {
                    let value
                    if (i == 0) {
                        value = d
                    } else if (i == 1) {
                        value = d * 2.5
                    } else {
                        value = d * 5
                    }
                    acc.push(value)
                    return acc
                }, [])
                const legend = svg.append("g")
                    .attr("fill", "#777")
                    .attr("transform", `translate(${width}, ${height - 10})`)
                    .attr("text-anchor", "middle")
                    .style("font", "10px sans-serif")
                    .selectAll()
                    .data(legendData)
                    .join("g")

                legend.append("circle")
                    .attr("fill", "none")
                    .attr("stroke", "#ccc")
                    .attr("cy", d => -radius(d))
                    .attr("r", radius)

                legend.append("text")
                    .attr("y", d => -2 * radius(d))
                    .attr("dy", "1.3em")
                    .text(radius.tickFormat(4, "s"))
            }

        }
    }

    

    return <ChartContext.Provider value={{
        getChartSelector,
        toolTipHandlers,
        appendTooltip,
        svgDo,
        selectors,
        colors,
        chartData,
        getSubGroupSum,
    }}>{children}</ChartContext.Provider>
}

export default ChartContext
