import * as d3 from "d3";

import {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import THEME from "@/lib/helpers/theme";

function Bar({ setLegend, data = [] }) {

    const colors = {}
    const usedColors = {}

    const randomColor = () => {
        let col;
        do {
            col = THEME.randomColor()
            if (!usedColors[col.color]) {
                usedColors[col.color] = true;
            }
        } while (!usedColors[col.color])
        return col;
    }

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
            .attr("x", (d) => x(labelShortName(d.label)))
            .attr("fill", function (d) {
                const color = randomColor().color;
                colors[d.label] = {color, value: d.value, label: d.label};
                return color; })
            .attr("y", (d) => y(d.value))
            .attr("height", (d) => y(0) - y(d.value))
            .attr("width", x.bandwidth());

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

    useEffect(() => {
        $('#c-visualizations__bar').html(buildChart())
        setLegend(colors)
    }, [data])

    return (
        <div className={`c-visualizations__bar c-Bar`} id={'c-visualizations__bar'}></div>
    )
}


Bar.propTypes = {
    children: PropTypes.node
}

export default Bar