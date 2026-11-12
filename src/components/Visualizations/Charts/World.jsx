import { useContext, useEffect, useRef, memo } from 'react'
import * as d3 from 'd3'
import ChartContext from '@/context/ChartContext'
import * as topojson from 'topojson-client'
import worldGeo from '@/lib/worldGeo.json'
import worldCities from '@/lib/worldCities.json'

const World = memo(
    ({ setLegend, data = [], chartId = 'modal', style = {} }) => {
        const {
            colors,
            getChartSelector,
            toolTipHandlers,
            svgDo,
            selectors,
            appendTooltip
        } = useContext(ChartContext)

        const chartType = 'geoWorld'
        const chartData = useRef([])
        const hasLoaded = useRef(false)

        const buildChart = () => {
            colors.current = {}
            const formattedData = data.map((d) => ({
                ...d,
                meta: worldCities.find(
                    (city) => city.city_ascii.toUpperCase() === d.data?.city?.toUpperCase()
                ),
            }))
                .filter((d) => d.meta)
                .sort((a, b) => d3.descending(a.value, b.value))


            console.log('FS', formattedData)

            // Construct the radius scale.
            const radius = d3.scaleSqrt([0, d3.max(formattedData, d => d.value)], [0, 40]);

            const sizing = svgDo({ data }).sizing(style, chartId, chartType)
            const valueExtent = d3.extent(data, (d) => +d.value)
            const size = d3
                .scaleSqrt()
                .domain(valueExtent) // What's in the data
                .range([1, 50])

            const width = 1300
            const height = 700
            // const { width, height } = sizing

            // const projection = d3.geoMercator()
            //     .center([0,20])                // GPS of location to zoom on
            //     .scale(99)                       // This is like the zoom
            //     .translate([ width/2, height/2 ])

            const projection = d3
                .geoNaturalEarth1()
                .scale(width / 1.5 / Math.PI)
                .translate([width / 2, height / 1.7])

            // Create the SVG container.
            const svg = d3
                .create('svg')
                .attr('width', width)
                .attr('height', height)
                .attr('viewBox', [0, 0, width, height])

            svg.append('g')
                .selectAll('path')
                .data(worldGeo.features)
                .join('path')
                .attr('fill', '#b8b8b8')
                .attr('d', d3.geoPath().projection(projection))
                .style('stroke', 'white')
                .style('opacity', 0.3)

            
            svg
                .selectAll("myCircles")
                .data(formattedData)
                .enter()
                .append('circle')
                .attr('cx', function (d) {
                    return projection([d.meta.lng, d.meta.lat])[0]
                })
                .attr('cy', function (d) {
                    return projection([d.meta.lng, d.meta.lat])[1]
                })
                .attr('r', d => size(d.value))
                .style('fill', 'red')
                .attr('stroke-width', 1)
                .attr('fill-opacity', 0.4)
                .attr('class', 'circle-value')
                .attr('data-value', d => d.value)
                .attr('data-label', d => `${d.data.country}, ${d.data.city}`)

            // Create the legend.
            const legend = svg.append("g")
                .attr("fill", "#777")
                .attr("transform", `translate(${50}, ${height - 10})`)
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

            svg.selectAll('.circle-value')
                .on("mouseover", toolTipHandlers(chartId).mouseover)
                .on("mousemove", toolTipHandlers(chartId).mousemove)
                .on("mouseleave", function (e, d) {
                    toolTipHandlers(chartId).mouseleave(e, d, false)
                })

            return svg.node()
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
            <div
                className={`${selectors.base}chart ${selectors.base}geoWorld`}
                id={`${selectors.base}geoWorld--${chartId}`}
            ></div>
        )
    }
)

export default World
