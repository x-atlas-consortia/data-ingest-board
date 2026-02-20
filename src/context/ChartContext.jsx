import { createContext, useRef } from 'react'
import * as d3 from "d3";
import THEME from "@/lib/helpers/theme";
import { eq } from "@/lib/helpers/general";

const ChartContext = createContext({})

export const ChartProvider = ({ children }) => {

    const chartId = useRef('main')
    let currentColorPointer = 1
    let currentColorIndex = 0
    const selectors = {
        base: 'c-visualizations__'
    }

    const getChartSelector = (chartId, chart = 'bar', withHash = true) => `${withHash ? '#' : ''}${selectors.base}${chart}--${chartId}`

    const randomColor = () => {
        let colors = THEME.lightColors()

        let color = THEME.lightenDarkenColor(colors[currentColorIndex].slice(1), currentColorPointer * -5);
        currentColorPointer++
        currentColorIndex++
        if (currentColorPointer >= colors.length) {
            currentColorPointer = 1
            currentColorIndex = 0
        }
        return { color }
    }

    const appendTooltip = (id, chart = 'bar') => {
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

    const buildTooltip = (id, chart, e, d) => {
        const $element = $(getTooltipSelector(id)).parent()
        const marginY = 40 // add a margin to prevent chrome flickering due to overlapping with tooltip
        const label = (e.currentTarget.getAttribute('data-label')) || d.label || d.data?.label
        const value = (e.currentTarget.getAttribute('data-value')) || d.value || d.data?.value
        const rect = $element[0]?.getBoundingClientRect()

        const xPos = e.clientX - rect.left
        const yPos = e.clientY - rect.top - marginY

        handleLineLabel(id, e, '1')

        getTooltip(id)
            .html(`<em>${label}</em>: <strong>${value}</strong>`)
            .style('left', xPos + 'px')
            .style('top', yPos + 'px')
    }

    const visibleTooltip = (id, chart, e, d) => {
        getTooltip(id)
            .style('opacity', 1)
        d3.select(this)
            .style('opacity', 0.9)
            .style('cursor', 'pointer')
    }

    const toolTipHandlers = (id, chart = 'bar') => {
        return {
            mouseover: function (e, d) {
                visibleTooltip(id, chart, e, d)
            },
            mouseenter: function (e, d) {
                e.stopPropagation()
                visibleTooltip(id, chart, e, d)
                buildTooltip(id, chart, e, d)
            },
            mousemove: function (e, d) {
                buildTooltip(id, chart, e, d)
            },
            mouseleave: function (e, d) {
                e.stopPropagation()
                handleLineLabel(id, e, '0')
                getTooltip(id)
                    .style('opacity', 0)
                d3.select(this)
                    .style('stroke', 'none')
                    .style('cursor', 'default')
                    .style('opacity', 1)
            }
        };
    }

    const svgDo = ({xAxis, yAxis, data}) => {
        const showXLabels = () => xAxis.showLabels !== undefined ? xAxis.showLabels : true
        const showYLabels = () => yAxis.showLabels !== undefined ? yAxis.showLabels : true

        const _truncateLabel = (label) => {
            return label.length > 30 ? label.substring(0, 27) + "..." : label;
        }
        return {
            sizing: (style, chartId, chart = 'bar') => {
                let $parent = $(getChartSelector(chartId, chart))
                let divWidth = $parent.width()
                let i = 0
                
                while (divWidth <= 0 && i < 10) {
                    $parent = $parent.parent()
                    divWidth = $parent.width()
                    i++
                }

                let _minWidth = 728

                divWidth = Math.min(divWidth, data?.length * 110)
                divWidth = Math.max(_minWidth, divWidth)

                const minWidth = style.minWidth || divWidth || 728
                const minHeight = style.minHeight || 500

                const width = style.width || minWidth
                const height = style.height || minHeight
                const margin = { top: 30, right: 0, bottom: 30 * 1.5, left: 70, ...(style.margin || {}) };
            
                return {width, height, margin,
                    isMobile: width < 500,
                    font: style.fontSize || {title: '16px'}
                }
            },
            truncateLabel: (label) => {
                return _truncateLabel(label)
            },
            adjustSizingByTicks: (sz, names) => {
            
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
                sz.margin.bottom = sz.margin.bottom + maxLabelWidth * Math.sin(Math.PI / 4);
                sz.height = sz.height + maxLabelWidth * Math.sin(Math.PI / 4);
            },
            axisLabels: ({svg, sizing}) => {
                 if (showYLabels()) {
                    svg.append("g")
                    .append("text")
                    .style("font-size", sizing.font.title)
                    .attr("class", "y label")
                    .attr("text-anchor", "start")
                    .attr("y",  yAxis.labelPadding || -20)
                    .attr("x", (sizing.height / 2) * -1)
                    .attr("dy", ".74em")
                    .attr("transform", "rotate(-90)")
                    .text(yAxis.label || "Frequency")
                }
                
                    
                if (xAxis.label && showXLabels()) {
                    svg.append("g")
                        .append("text")
                        .style("font-size", sizing.font.title)
                        .attr("class", "x label")
                        .attr("text-anchor", "middle")
                        .attr("x", (sizing.width / 2) + sizing.margin.right)
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
            }

        }
    }

    

    return <ChartContext.Provider value={{
        getChartSelector,
        toolTipHandlers,
        appendTooltip,
        svgDo,
        selectors
    }}>{children}</ChartContext.Provider>
}

export default ChartContext
