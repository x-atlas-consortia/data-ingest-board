import Spinner from '@/components/Spinner'
import {getHeadersWith} from '@/lib/helpers/general'
import { getHierarchy } from '@/lib/helpers/hierarchy'
import URLS from '@/lib/helpers/urls'
import axios from 'axios'
import * as d3 from 'd3'
import { sankey as d3sankey, sankeyLinkHorizontal } from 'd3-sankey'
import {useContext, useEffect, useRef, useState} from 'react'
import AppContext from "@/context/AppContext";

function Sankey({ filters }) {
    const {globusToken} = useContext(AppContext)
    const [loading, setLoading] = useState(true)
    const [graph, setGraph] = useState(null)
    const containerRef = useRef(null)
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 })

    const validFilterMap = {
        group_name: 'dataset_group_name',
        dataset_type: 'dataset_dataset_type',
        organ: 'organ_type',
        status: 'dataset_status'
    }

    const getValidFilters = () => {
        // converts the filter from the URL to the field names returned from the sankey endpoint
        // also splits comma separated filter values into an array
        return Object.keys(filters).reduce((acc, key) => {
            if (validFilterMap[key.toLowerCase()] !== undefined) {
                acc[validFilterMap[key].toLowerCase()] = filters[key].split(',')
            }
            return acc
        }, {})
    }

    const fetchData = async () => {
        // call the sankey endpoint
        const res = await axios.get(URLS.entity.sankey(), getHeadersWith(globusToken))
        const data = res.data.map((row) => {
            return { ...row, organ_type: getHierarchy(row.organ_type) }
        })

        // filter the data if there are valid filters
        const validFilters = getValidFilters()
        let filteredData = data
        if (Object.keys(validFilters).length > 0) {
            // Filter the data based on the valid filters
            filteredData = data.filter((row) => {
                // this acts as an AND filter
                for (const [field, validValues] of Object.entries(validFilters)) {
                    if (!validValues.includes(row[field].toLowerCase())) {
                        return false
                    }
                }
                return true
            })
        }

        // group the data into nodes and links
        const columnNames = Object.values(validFilterMap)
        const newGraph = { nodes: [], links: [] }
        filteredData.forEach((row) => {
            columnNames.forEach((columnName, columnIndex) => {
                if (columnIndex !== columnNames.length - 1) {
                    let found = newGraph.nodes.find((found) => found.column === columnIndex && found.name === row[columnNames[columnIndex]])
                    if (found === undefined) {
                        found = { node: newGraph.nodes.length, name: row[columnName], column: columnIndex }
                        newGraph.nodes.push(found)
                    }

                    let found2 = newGraph.nodes.find((found2) => found2.column === columnIndex + 1 && found2.name === row[columnNames[columnIndex + 1]])
                    if (found2 === undefined) {
                        found2 = { node: newGraph.nodes.length, name: row[columnNames[columnIndex + 1]], column: columnIndex + 1 }
                        newGraph.nodes.push(found2)
                    }

                    let found3 = newGraph.links.find((found3) => found3.source === found.node && found3.target === found2.node)
                    if (found3 === undefined) {
                        found3 = { source: found.node, target: found2.node, value: 0 }
                        newGraph.links.push(found3)
                    }
                    found3.value = found3.value + 1
                }
            })
        })

        setLoading(false)
        setGraph(newGraph)
    }

    const handleWindowResize = () => {
        if (!containerRef.current) return
        setContainerDimensions({
            width: containerRef.current.clientWidth,
            height: Math.max(containerRef.current.clientHeight, 1080)
        })
    }

    useEffect(() => {
        fetchData()
        handleWindowResize()
        window.addEventListener('resize', handleWindowResize)

        return () => {
            window.removeEventListener('resize', handleWindowResize)
        }
    }, [])

    useEffect(() => {
        if (!graph || !containerDimensions.width || !containerDimensions.height) return

        // svg dimensions
        const margin = { top: 20, right: 20, bottom: 20, left: 20 }
        const width = containerDimensions.width - margin.left - margin.right
        const height = containerDimensions.height - margin.top - margin.bottom

        const color = d3.scaleOrdinal(d3.schemeCategory10)

        // Layout the svg element
        const container = d3.select(containerRef.current)
        const svg = container.append('svg').attr('width', width).attr('height', height).attr('transform', `translate(${margin.left},${margin.top})`)

        // Set up the Sankey generator
        const sankey = d3sankey()
            .nodeWidth(30)
            .nodePadding(15)
            .extent([
                [0, margin.top],
                [width, height - margin.bottom]
            ])

        // Create the Sankey layout
        const { nodes, links } = sankey({
            nodes: graph.nodes.map((d) => Object.assign({}, d)),
            links: graph.links.map((d) => Object.assign({}, d))
        })

        // Define the drag behavior
        const drag = d3
            .drag()
            .on('start', function (event, d) {
                d3.select(this).raise()
                d.dragging = {
                    offsetX: event.x - d.x0,
                    offsetY: event.y - d.y0
                }
            })
            .on('drag', function (event, d) {
                d.x0 = Math.max(0, Math.min(width - d.x1 + d.x0, event.x - d.dragging.offsetX))
                d.y0 = Math.max(0, Math.min(height - d.y1 + d.y0, event.y - d.dragging.offsetY))
                d.x1 = d.x0 + sankey.nodeWidth()
                d.y1 = d.y0 + (d.y1 - d.y0)
                d3.select(this).attr('transform', `translate(${d.x0},${d.y0})`)
                svg.selectAll('.c-sankey__link').attr('d', sankeyLinkHorizontal())
                sankey.update({ nodes, links })
                link.attr('d', sankeyLinkHorizontal())
            })
            .on('end', function (event, d) {
                delete d.dragging
            })

        // Links
        const link = svg
            .append('g')
            .selectAll('.link')
            .data(links)
            .join('path')
            .attr('class', 'c-sankey__link')
            .attr('d', sankeyLinkHorizontal())
            .attr('stroke-width', (d) => Math.max(2, d.width))
            .append('title')
            .text((d) => `${d.source.name} → ${d.target.name}\n${d.value} Datasets`) // Tooltip

        // Nodes
        const node = svg
            .append('g')
            .selectAll('.node')
            .data(nodes)
            .join('g')
            .attr('class', 'c-sankey__node')
            .attr('transform', (d) => `translate(${d.x0},${d.y0})`)
            .call(drag)

        node.append('rect')
            .attr('height', (d) => Math.max(5, d.y1 - d.y0))
            .attr('width', sankey.nodeWidth())
            .attr('fill', (d) => color(d.name))
            .attr('stroke-width', 0)
            .append('title')
            .text((d) => `${d.name}\n${d.value} Datasets`) // Tooltip

        node.append('text')
            .attr('x', -6)
            .attr('y', (d) => (d.y1 - d.y0) / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'end')
            .text((d) => d.name)
            .filter((d) => d.x0 < width / 2)
            .attr('x', 6 + sankey.nodeWidth())
            .attr('text-anchor', 'start')

        return () => {
            svg.remove()
        }
    }, [graph, containerDimensions])

    return (
        <div ref={containerRef} className='c-sankey__container'>
            {loading && <Spinner />}
        </div>
    )
}

export default Sankey
