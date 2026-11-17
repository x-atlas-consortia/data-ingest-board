import React, { memo } from 'react'
import * as d3 from 'd3';
import { useContext, useEffect, useRef } from 'react'
import ChartContext from '@/context/ChartContext';
import THEME from "@/lib/helpers/theme";

const Line = memo(({
    setLegend,
    filters,
    data = [],
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
        appendTooltip,
        svgDo,
    } = useContext(ChartContext)

    const buildChart = () => {
        colors.current = {}
        const sizing = svgDo({data}).sizing(style, chartId, chartType)
        let {width, height, margin} = sizing

        // append the svg object to the body of the page
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height + margin.top])

        const g = svg
            .append("g")

 
        const maxY = d3.max(data, function(d) { return +d.value; })
        const minY = -(maxY * .02)

        // A color scale: one color for each group
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
        //const groups = d3.extent(data, function(d) { return d.group; })
        const groups = data.map((d) => d.group)

        const sumstat = d3.group(data, d => d.subGroup); // nest function allows to group the calculation per level of a factor

        
        // Add X axis --> it is a date format
        const x = d3.scaleBand()
          .domain(groups)
          .range([ 0, width ])
          .padding(0.1);

        const xAxisGroup =svg.append("g")
          .attr("transform", `translate(0, ${height})`)
          .call(d3.axisBottom(x).ticks(10).tickFormat((d, i) => i % 12 === 0 ? new Date(d).getMonth() : ""))
          .selectAll('text')
          .style('font-size', '14px')
          .style("text-anchor", "end")
                        .attr("dx", "-0.8em")
                        .attr("dy", "0.15em")
                        .attr("transform", "rotate(-45)")

        // Add Y axis
        const y = d3.scaleLinear()
          .domain([0, maxY])
          .range([ height, 0 ]);
        svg.append("g")
          .call(d3.axisLeft(y));

        // Draw the line
        svg.selectAll(".line")
            .data(sumstat)
            .join("path")
              .attr("fill", "none")
              .attr("stroke", function(d){ 
                return colorScale(d[0]) 
              })
              .attr("stroke-width", 1.5)
              .attr("d", function(d){
                return d3.line()
                  .x(function(d) { 
                    return x(d.group) //+ x.bandwidth() / 2; 

                  })
                  .y(function(d) { 
                    return y(d.value); 
                  })
                  (d[1])
                  
              })
           

        // Interactive Elements (Hover Line & Point)
        const hoverGroup = svg.append("g")
          .style("display", "none");

        hoverGroup.append("line")
          .attr("class", "hover-line")
          .attr("y1", 0)
          .attr("y2", height)
          .attr("stroke", "#999")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4,4");

        // Add a transparent overlay to catch mouse events across the chart area
        svg.append("rect")
          .attr("width", width)
          .attr("height", height)
          .attr("fill", "none")
          .attr("pointer-events", "all")
          .on("mouseover", () => hoverGroup.style("display", null))
          .on("mouseout", () => {
            hoverGroup.style("display", "none");
            d3.selectAll(".highlight-circle").remove();
          })
          .on("mousemove", function(event) {
            const [mouseX] = d3.pointer(event);
            
            // Find the closest category band based on mouseX
            const step = x.step();
            const index = Math.min(
              groups.length - 1,
              Math.max(0, Math.floor(mouseX / step))
            );
            const hoveredCategory = groups[index];
            console.log("Hovered Category:", hoveredCategory);
            const xPos = x(hoveredCategory); // + x.bandwidth() / 2;

            // Move vertical line to the center of the band
            hoverGroup.select(".hover-line")
              .attr("transform", `translate(${xPos}, 0)`);

            // Remove old highlight circles and draw current ones
            svg.selectAll(".highlight-circle").remove();

            // data.forEach(series => {
            //   const pointData = series.values.find(v => v.category === hoveredCategory);
            //   if (pointData) {
            //     svg.append("circle")
            //       .attr("class", "highlight-circle")
            //       .attr("cx", xPos)
            //       .attr("cy", y(pointData.value))
            //       .attr("r", 6)
            //       .attr("fill", color(series.name))
            //       .attr("stroke", "#fff")
            //       .attr("stroke-width", 2);
            //   }
            // });
          });

        return svg.node();
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
        if ( !hasLoaded.current) {
            hasLoaded.current = true
            colors.current = {}
            updateChart()
        }

    }, [data])

    useEffect(() => {
        updateChart()
    }, [filters])

    return (
        <div className={`c-visualizations__chart c-visualizations__line`} id={`c-visualizations__line--${chartId}`} data-type='line'></div>
    )
})

export default Line