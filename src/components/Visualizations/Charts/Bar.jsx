import * as d3 from 'd3';
import {useContext, useEffect, useRef} from 'react'
import PropTypes from 'prop-types'
import ChartContext from '@/context/ChartContext';

function Bar({
    setLegend,
    column,
    filters,
    data = [],
    colorMethods = {},
    chartId = 'modal',
    reload = true,
    showXLabels = true,
    onSectionClick,
    yAxis ={},
}) {

    const hasLoaded = useRef(false)
    const {
        getChartSelector,
        toolTipHandlers,
        appendTooltip } = useContext(ChartContext)

    const colors = {}
    const chartData = useRef([])

    const truncateLabel = (label) => {
        return label.length > 30 ? label.substring(0, 27) + "..." : label;
    }

    const buildChart = ()  => {
        data.sort((a, b) => b.value - a.value)
        const groups = d3.groupSort(data, ([d]) => -d.value, (d) => d.label);
        const names = groups.map((g) => g)

        // Declare the chart dimensions and margins.
        const width = 928;
        let height = 500;
        const marginTop = 30;
        const marginRight = 0;
        let marginBottom = 30;
        let marginLeft = 80;

        if (showXLabels) {
            // We need to calculate the maximum label width to adjust for the label being at 45 degrees.
            const tempSvg = d3.select("body").append("svg").attr("class", "temp-svg").style("visibility", "hidden"); 
            let maxLabelWidth = 0;
            names.forEach(name => {
                const truncName = truncateLabel(name);
                const textElement = tempSvg.append("text").text(truncName).style("font-size", "11px");
                const bbox = textElement.node().getBBox();
                if (bbox.width > maxLabelWidth) {
                    maxLabelWidth = bbox.width;
                }
                textElement.remove();
            });
            tempSvg.remove();

            // Adjust the bottom margin and height to not cut off the labels.
            marginBottom = marginBottom + maxLabelWidth * Math.sin(Math.PI / 4);
            height = height + maxLabelWidth * Math.sin(Math.PI / 4);
        }

        // Declare the x (horizontal position) scale.
        const x = d3.scaleBand()
            .domain(names) // descending value
            .range([marginLeft, width - marginRight])
            .padding(0.1);

        const scaleRange = data.length <= 1 ? 2 : data.length

        // Create the color scale.
        const colorScale = d3.scaleOrdinal()
            .domain(data.map(d => d.label))
            .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), scaleRange))

        // Bar must have a minimum height to be able to click. 2% of the max value seems good
        const maxY = d3.max(data, (d) => d.value);
        const yStartPos = -(maxY * .02)

        // Declare the y (vertical position) scale.
        const y = d3.scaleLinear()
            .domain([yStartPos, maxY])
            .range([height - marginBottom, marginTop]);

        // Create the SVG container.
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto;");

        // Add a rect for each bar.
        svg.append("g")
            .selectAll()
            .data(data)
            .join("rect")
            .attr("class", d => `bar--${d.id}`)
            .attr("x", (d) => x(d.label))
            .attr('data-value', (d) => yAxis.formatter ? yAxis.formatter(d.value) : d.value)
            .attr("fill", function (d) {
                const color = colorMethods[column] ? colorMethods[column](d.label) : colorScale(d.label);
                colors[d.label] = {color, value: yAxis.formatter ? yAxis.formatter(d.value) : d.value, label: d.label};
                return color; })
            .attr("y", (d) => y(yStartPos))
            .attr("height", (d) => y(yStartPos) - y(yStartPos))
            .attr("width", x.bandwidth())
            .on("click", function(event, d) {
                if (onSectionClick) {
                    onSectionClick(d.label)
                }
            });

        // Animation
        svg.selectAll("rect")
            .transition()
            .duration(800)
            .attr("y", (d) => y(d.value))
            .attr("height", function(d) { return y(yStartPos) - y(d.value); })
            .delay(function(d,i){return(i*100)})

        svg.selectAll("rect")
            .on("mouseover", toolTipHandlers(chartId).mouseover)
            .on("mousemove", toolTipHandlers(chartId).mousemove)
            .on("mouseleave", toolTipHandlers(chartId).mouseleave)

        // Add the x-axis and label.
        svg.append("g")
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(d3.axisBottom(x).tickSizeOuter(0))
            .selectAll("text")
            .style("display", showXLabels ? "block" : "none")
            .style("text-anchor", "end")
            .style("font-size", "11px")
            .attr("dx", "-0.8em")
            .attr("dy", "0.15em")
            .attr("transform", "rotate(-45)")
            .text(function(d) {
                return truncateLabel(d);
            });

        // Add the y-axis and label, and remove the domain line.
        svg.append("g")
            .attr("transform", `translate(${marginLeft},0)`)
            .call(d3.axisLeft(y).tickFormat((y) => yAxis.formatter ? yAxis.formatter(y) :  (y).toFixed()))
            //.call(g => g.select(".domain").remove())
            .call(g => g.append("text")
                .attr("x", -marginLeft)
                .attr("y", 10)
                .attr("fill", "currentColor")
                .attr("text-anchor", "start")
                .text(yAxis.label || "↑ Frequency"))
            .selectAll("text")
            .style("font-size", "11px"); 

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
    }, [filters])

    return (
        <div className={`c-visualizations__chart c-visualizations__bar c-bar`} id={`c-visualizations__bar--${chartId}`}></div>
    )
}


Bar.propTypes = {
    children: PropTypes.node
}

export default Bar