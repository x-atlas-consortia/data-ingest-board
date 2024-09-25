import * as d3 from "d3";
import {useContext, useEffect, useRef} from 'react'
import PropTypes from 'prop-types'
import ChartContext from "@/context/ChartContext";

function Bar({ setLegend, column, filters,  data = [], colorMethods = {}, chartId = 'modal', reload = true }) {

    const hasLoaded = useRef(false)
    const {
        getChartSelector,
        toolTipHandlers,
        Tooltip,
        appendTooltip } = useContext(ChartContext)

    const colors = {}


    const buildChart = ()  => {
        // Declare the chart dimensions and margins.
        const width = 928;
        const height = 500;
        const marginTop = 30;
        const marginRight = 0;
        const marginBottom = 30;
        const marginLeft = 40;

        const labelShortName = (g) => g.substr(0, 3)
        data.sort((a, b) => b.value - a.value)
        const groups = d3.groupSort(data, ([d]) => -d.value, (d) => d.label);
        const shortNames = groups.map((g) => labelShortName(g))

        // Declare the x (horizontal position) scale.
        const x = d3.scaleBand()
            .domain(shortNames) // descending value
            .range([marginLeft, width - marginRight])
            .padding(0.1);

        // Create the color scale.
        const colorS = d3.scaleOrdinal()
            .domain(data.map(d => d.label))
            .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), data.length))

        // Declare the y (vertical position) scale.
        const y = d3.scaleLinear()
            .domain([0, d3.max(data, (d) => d.value)])
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
            .attr("x", (d) => x(labelShortName(d.label)))
            .attr("fill", function (d) {
                const color = colorMethods[column] ? colorMethods[column](d.label) : colorS(d.label);
                colors[d.label] = {color, value: d.value, label: d.label};
                return color; })
            .attr("y", (d) => y(0))
            .attr("height", (d) => y(0) - y(0))
            .attr("width", x.bandwidth());

        // Animation
        svg.selectAll("rect")
            .transition()
            .duration(800)
            .attr("y", (d) => y(d.value))
            .attr("height", function(d) { return y(0) - y(d.value); })
            .delay(function(d,i){return(i*100)})

        svg.selectAll("rect")
            .on("mouseover", toolTipHandlers(chartId).mouseover)
            .on("mousemove", toolTipHandlers(chartId).mousemove)
            .on("mouseleave", toolTipHandlers(chartId).mouseleave)

        // Add the x-axis and label.
        svg.append("g")
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(d3.axisBottom(x).tickSizeOuter(0));

        // Add the y-axis and label, and remove the domain line.
        svg.append("g")
            .attr("transform", `translate(${marginLeft},0)`)
            .call(d3.axisLeft(y).tickFormat((y) => (y).toFixed()))
            .call(g => g.select(".domain").remove())
            .call(g => g.append("text")
                .attr("x", -marginLeft)
                .attr("y", 10)
                .attr("fill", "currentColor")
                .attr("text-anchor", "start")
                .text("↑ Frequency"));

        // Return the SVG element.
        return svg.node();
    }

    const updateTable = () => {
        $(getChartSelector(chartId)).html('')
        appendTooltip(chartId)
        $(getChartSelector(chartId)).append(buildChart())

        if (setLegend) {
            setLegend(colors)
        }
    }
    useEffect(() => {
        if (reload || !hasLoaded.current) {
            hasLoaded.current = true
            updateTable()
        }

    }, [data])

    useEffect(() => {
        updateTable()
    }, [filters])

    return (
        <div className={`c-visualizations__chart c-visualizations__bar c-bar`} id={`c-visualizations__bar--${chartId}`}></div>
    )
}


Bar.propTypes = {
    children: PropTypes.node
}

export default Bar