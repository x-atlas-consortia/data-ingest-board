import {useContext, useEffect, useRef, memo} from "react";
import * as d3 from "d3";
import ChartContext from "@/context/ChartContext";
import { usaGeo } from "@/lib/usaGeo";
import * as topojson from "topojson-client";
import us from "@/lib/counties-albers-10m.json"

const USA = memo(({
    setLegend,
    data = [],
    chartId = 'modal',
    style = {},
}) => {

    const {
        colors,
        getChartSelector,
        toolTipHandlers,
        selectors,
        appendTooltip } = useContext(ChartContext)

    const chartType = 'geoUSA'
    const chartData = useRef([])
    const hasLoaded = useRef(false)

    const cityMap = usaGeo.reduce((map, d) => {
        map.set(d.city_name, d)
        return map
    }, new Map())

    const countyMap = new Map(topojson.feature(us, us.objects.counties).features.map(d => [d.id, d]))

    const stateMap = new Map(topojson.feature(us, us.objects.states).features.map(d => [d.id, d]))

    const buildChart = ()  => {
        colors.current = {}

        const formattedData = data.map((d) => ({
        ...d,
        county: countyMap.get(cityMap.get(d.data?.city?.toUpperCase())?.county_fipcode),
        state: stateMap.get(cityMap.get(d.data?.city?.toUpperCase())?.state_fipcode)
      }))
        .filter(d => d.county)
        .sort((a, b) => d3.descending(a.value, b.value));

        const centroid = (feature) => {
            const path = d3.geoPath();
            return path.centroid(feature);
        }

        console.log('USA', formattedData)

        // Specify the chart’s dimensions.
        const width = 1100;
        const height = 610;

        // Construct the radius scale.
        const radius = d3.scaleSqrt([0, d3.max(formattedData, d => d.value)], [0, 40]);

        // Construct a path generator.
        const path = d3.geoPath();

        // Create the SVG container. Its dimensions correspond to the bounding-box
        // of the pre-projected US shapefile. 
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])

        // Create the cartographic background layers.
        svg.append("path")
            .datum(topojson.feature(us, us.objects.nation))
            .attr("fill", "#ddd")
            .attr("d", path);

        svg.append("path")
            .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-linejoin", "round")
            .attr("d", path);

        // Create the legend.
        const legend = svg.append("g")
            .attr("fill", "#777")
            .attr("transform", `translate(${width - 50}, ${height - 10})`)
            .attr("text-anchor", "middle")
            .style("font", "10px sans-serif")
          .selectAll()
            .data(radius.ticks(4).slice(1))
          .join("g");

        legend.append("circle")
            .attr("fill", "none")
            .attr("stroke", "#ccc")
            .attr("cy", d => -radius(d))
            .attr("r", radius);

        legend.append("text")
            .attr("y", d => -2 * radius(d))
            .attr("dy", "1.3em")
            .text(radius.tickFormat(4, "s"));

        // Add a circle for each county, with a title (tooltip).
        const format = d3.format(",.0f");
        svg.append("g")
            .attr("fill", "brown")
            .attr("fill-opacity", 0.5)
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5)
          .selectAll()
          .data(formattedData)
          .join("circle")
            .attr('class', 'circle-value')
            .attr('data-value', d => d.value)
            .attr('data-label', d => `${d.county.properties.name}, ${d.state.properties.name}`)
            .attr("transform", d => `translate(${centroid(d.county)})`)
            .attr("r", d => radius(d.value));

        

        svg.selectAll('.circle-value')
            .on("mouseover", toolTipHandlers(chartId).mouseover)
            .on("mousemove", toolTipHandlers(chartId).mousemove)
            .on("mouseleave", function (e, d) {
                toolTipHandlers(chartId).mouseleave(e, d, false)
            })

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
            chartData.current.length !== data.length ||
            !hasLoaded.current
        ) {
            hasLoaded.current = true
            chartData.current = Array.from(data)
            updateChart()
        }
    }, [data])

    return (
        <div className={`${selectors.base}chart ${selectors.base}geoUSA`} id={`${selectors.base}geoUSA--${chartId}`}></div>
    )
})

export default USA