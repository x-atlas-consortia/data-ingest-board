import { useContext, useEffect, useRef, memo } from 'react'
import * as d3 from 'd3'
import ChartContext from '@/context/ChartContext'
import world from '@/lib/world-topology.json'
import worldCities from '@/lib/world-cities.json' //https://simplemaps.com/data/world-cities
import THEME from '@/lib/helpers/theme'

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

            // Construct the radius scale.
            const radius = d3.scaleSqrt([0, d3.max(formattedData, d => d.value)], [0, 40]);


            const width = 1300
            const height = 700
            
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
                .data(world.features)
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
                .attr('r', d => radius(d.value))
                .style('fill', THEME.visualizations.defaultFill)
                .attr('fill-opacity', 0.5)
                .attr("stroke", "#fff")
                .attr('class', 'circle-value')
                .attr('data-value', d => d.value)
                .attr('data-label', d => `${d.data.country}, ${d.data.city}`)

            // Create the legend.
            svgDo({}).bubbleLegend({svg, radius, height})

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
