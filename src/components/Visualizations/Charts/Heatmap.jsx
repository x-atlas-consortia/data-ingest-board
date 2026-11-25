import {useContext, useEffect, memo, useRef} from "react";
import * as d3 from "d3";
import ChartContext from "@/context/ChartContext";
import THEME from "@/lib/helpers/theme";

const Heatmap = memo(({
    setLegend,
    data = [],
    chartId = 'modal',
    onSectionClick,
    xAxis = {},
    yAxis = {},
    style = {},
}) => {

    const hasLoaded = useRef(false)
    const {
        colors,
        getChartSelector,
        toolTipHandlers,
        selectors,
        svgDo,
        appendTooltip } = useContext(ChartContext)

    const chartType = 'heatmap'
    const chartData = useRef([])

    const buildChart = ()  => {
        colors.current = {}

        const sizing = svgDo({ data }).sizing(style, chartId, chartType)

        const { width, height, margin } = sizing

        const svg = d3
                    .create('svg')
                    .attr('width', width)
                    .attr('height', height)
                    .attr('viewBox', [0, 0, width, height + margin.top])

        const groups = data.map((d) => d.group)
        const yGroups = data.map((d) => d.yGroup)


        const x = d3.scaleBand()
          .range([ 0, width ])
          .domain(groups)
          .padding(0.01);
        svg.append("g")
          .attr("transform", `translate(0, ${height})`)
          .call(d3.axisBottom(x).tickFormat((x, i) =>
                        xAxis.formatter ? xAxis.formatter(x, i) : x
                    ))

        // Build X scales and axis:
        const y = d3.scaleBand()
          .range([ height, 0 ])
          .domain(yGroups)
          .padding(0.01);

        svg.append("g")
          .call(d3.axisLeft(y).tickFormat((x, i) =>
                        yAxis.formatter ? yAxis.formatter(x, i) : x
                    ))

        const colorScale = d3.scaleLinear()
        .range(["white", style.monoColor || THEME.visualizations.defaultFill])
        .domain([d3.min(data, (d) => d.value), d3.max(data, (d) => d.value)])
        

        svg.selectAll()
            .data(data, function(d) {return d.group+':'+d.yGroup;})
            .join("rect")
            .attr("x", function(d) { return x(d.group) })
            .attr("y", function(d) { return y(d.yGroup) })
            .attr("width", x.bandwidth() )
            .attr("height", y.bandwidth() )
            .style("fill", function(d) { return colorScale(d.value)} )
            .on('mouseover', toolTipHandlers(chartId, chartType).mouseover)
            .on('mousemove', toolTipHandlers(chartId, chartType).mousemove)
            .on('mouseleave', toolTipHandlers(chartId, chartType).mouseleave)

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
        <div className={`${selectors.base}chart ${selectors.base}heatmap`} id={`${selectors.base}heatmap--${chartId}`}></div>
    )
})

export default Heatmap