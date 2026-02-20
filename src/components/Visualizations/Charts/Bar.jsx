import * as d3 from 'd3';
import { useContext, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import ChartContext from '@/context/ChartContext';

function Bar({
    setLegend,
    filters,
    data = [],
    chartId = 'modal',
    reload = true,
    onSectionClick,
    style = {},
    yAxis = {},
    xAxis = {},
}) {

    const hasLoaded = useRef(false)
    const {
        getChartSelector,
        toolTipHandlers,
        svgDo,
        appendTooltip } = useContext(ChartContext)

    const colors = {}
    const chartData = useRef([])

    const truncateLabel = (label) => {
        return label.length > 30 ? label.substring(0, 27) + "..." : label;
    }

    const showXLabels = () => xAxis.showLabels !== undefined ? xAxis.showLabels : true

    const buildChart = () => {
        let names 
        if (xAxis.noSortLabels) {
            names = data.map((d) => d.label)
        } else {
            data.sort((a, b) => b.value - a.value)
            const groups = d3.groupSort(data, ([d]) => -d.value, (d) => d.label);
            names = groups.map((g) => g)
        }
    
        // Declare the chart dimensions and margins.
        const sizing = svgDo({data}).sizing(style, chartId)
    
        if (showXLabels()) {
            svgDo({}).adjustSizingByTicks(sizing, names)
        }

        let {width, height, margin} = sizing

        // Declare the x (horizontal position) scale.
        const x = d3.scaleBand()
            .domain(names) // descending value
            .range([margin.left, width - margin.right])
            .padding(0.2);

        const scaleRange = data.length <= 1 ? 2 : data.length

        // Create the color scale.
        const colorScale = d3.scaleOrdinal()
            .domain(data.map(d => d.label))
            .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), scaleRange))

        // Bar must have a minimum height to be able to click. 2% of the max value seems good
        const maxY = d3.max(data, (d) => d.value);
        const minY = yAxis.scaleLog ? 1 : (-(maxY * .02))
        const yDomain = [minY, maxY]
        const ticks = yAxis.scaleLog || yAxis.ticks ? yAxis.ticks || 3 : undefined

        // Declare the y (vertical position) scale.
        let y = yAxis.scaleLog ? d3.scaleLog()
            .domain(yDomain).nice() : d3.scaleLinear().domain(yDomain)

           y = y.range([height - margin.bottom, margin.top]);

        // Create the SVG container.
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height + margin.top])

        svgDo({}).grid({g: svg, y, hideGrid: style.hideGrid, ticks, sizing})
        const formatVal = ({d, v}) => svgDo({}).valueFormatter({d, v, style})

        // Add a rect for each bar.
        svg.append("g")
            .selectAll()
            .data(data)
            .join("rect")
            .attr("class", d => `bar--${d.id?.toDashedCase()}`)
            .attr("x", (d) => x(d.label))
            .attr('data-value', (d) => formatVal({d, v:  d.value}))
            .attr("fill", function (d) {
                const color = style?.colorMethods && style?.colorMethods[style.colorMethodKey] ? style?.colorMethods[style.colorMethodKey](d.label) : (style?.monoColor ? style?.monoColor : colorScale(d.label));
                colors[d.label] = { color, value: formatVal({d, v:  d.value}), label: d.label };
                return color;
            })
            .attr("y", (d) => y(minY))
            .attr("height", (d) => y(minY) - y(minY))
            .attr("width", x.bandwidth())
            .on("click", function (event, d) {
                if (onSectionClick) {
                    onSectionClick(d.label)
                }
            });

        // Animation
        svg.selectAll("rect")
            .transition()
            .duration(800)
            .attr("y", (d) => y(d.value))
            .attr("height", function (d) { return y(minY) - y(d.value); })
            .delay(function (d, i) { return (i * 100) })

        svg.selectAll("rect")
            .on("mouseover", toolTipHandlers(chartId).mouseover)
            .on("mousemove", toolTipHandlers(chartId).mousemove)
            .on("mouseleave", toolTipHandlers(chartId).mouseleave)

        // Add the x-axis and label.
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("display", showXLabels() ? "block" : "none")
            .style("text-anchor", "end")
            .style("font-size", "11px")
            .attr("dx", "-0.8em")
            .attr("dy", "0.15em")
            .attr("transform", "rotate(-45)")
            .text(function (d) {
                return truncateLabel(d);
            });

        // Add the y-axis and label, and remove the domain line.
        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(ticks).tickFormat((y) => yAxis.formatter ? yAxis.formatter(y) : (y).toFixed()))

        svgDo({xAxis, yAxis}).axisLabels({svg, sizing})

        // Return the SVG element.
        return svg.node();
    }

    const updateChart = () => {
        $(getChartSelector(chartId)).html('')
        appendTooltip(chartId)
        $(getChartSelector(chartId)).append(buildChart())

        if (setLegend) {
            setLegend(colors)
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
    }, [filters, yAxis])

    return (
        <div className={`c-visualizations__chart c-visualizations__bar c-bar`} id={`c-visualizations__bar--${chartId}`}></div>
    )
}


Bar.propTypes = {
    children: PropTypes.node
}

export default Bar