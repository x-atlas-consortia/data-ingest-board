import {useContext, useEffect, useRef, memo} from "react";
import * as d3 from "d3";
import ChartContext from "@/context/ChartContext";

const Pie = memo(({
    setLegend,
    data = [],
    chartId = 'modal',
    onSectionClick,
    style = {},
}) => {

    const {
        colors,
        getChartSelector,
        toolTipHandlers,
        selectors,
        svgDo,
        appendTooltip } = useContext(ChartContext)

    const hasLoaded = useRef(false)
    const chartType = 'pie'
    const chartData = useRef([])

    const buildChart = ()  => {
        colors.current = {}

        // Specify the chart’s dimensions.
        const width = 928;
        const height = Math.min(width, 500);

        // Create the color scale.
        const colorScale = d3.scaleOrdinal()
            .domain(data.map(d => d.label))
            .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), data.length).reverse())

        // Create the pie layout and arc generator.
        const pie = d3.pie()
            .sort(null)
            .value(d => d.value);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(Math.min(width, height) / 2 - 1);

        const arcOver = d3.arc()
            .innerRadius(0)
            .outerRadius(Math.min(width, height) / 3);

        const labelRadius = arc.outerRadius()() * 0.8;

        // A separate arc generator for labels.
        const arcLabel = d3.arc()
            .innerRadius(labelRadius)
            .outerRadius(labelRadius);

        const arcs = pie(data);

        // Create the SVG container.
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-width / 2, -height / 2, width, height])

        // Add a sector path for each value.
        svg.append("g")
            .attr("stroke", "white")
            .selectAll()
            .data(arcs)
            .join("path")
            .attr("class", d => `slice--${d.data.id}`)
            .attr("fill", d => {
                const color = svgDo({}).getColor(d.data.label, style, colorScale)
                colors.current[d.data.label] = {color, value: d.data.value, label: d.data.label};
                return color
            })
            .attr("d", arc)
            .on("click", function(event, d) {
                if (onSectionClick) {
                    onSectionClick(d.data.label)
                }
            })
            .append("title")
            .text(d => `${d.data.label}: ${d.data.value.toLocaleString("en-US")}`);

        // Create a new arc generator to place a label close to the edge.
        // The label shows the value if there is enough room.
        svg.append("g")
            .attr("text-anchor", "middle")
            .selectAll()
            .data(arcs)
            .join("text")
            .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
            .call(text => text.append("tspan")
                .attr("y", "-0.4em")
                .attr("font-weight", "bold")
                //.text(d => data.length < 8 ? d.data.label : '' )
                )
            .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
                .attr("x", 0)
                .attr("y", "0.7em")
                .attr("fill-opacity", 0.7)
                .text(d => '')); //d.data.value.toLocaleString("en-US")

        svg.selectAll('path')
            .on("mouseover", toolTipHandlers(chartId, chartType).mouseover)
            .on("mousemove", toolTipHandlers(chartId, chartType).mousemove)
            .on("mouseleave", toolTipHandlers(chartId, chartType).mouseleave)

        return svg.node();
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

    return (
        <div className={`${selectors.base}chart ${selectors.base}pie`} id={`${selectors.base}pie--${chartId}`}></div>
    )
})

export default Pie