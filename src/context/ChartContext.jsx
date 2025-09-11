import { createContext, useEffect, useState, useRef} from 'react'
import * as d3 from "d3";
import THEME from "@/lib/helpers/theme";

const ChartContext = createContext({})

export const ChartProvider = ({ children }) => {

    const chartId = useRef('main')
    let currentColorPointer = 1
    let currentColorIndex = 0
    const selectors = {
        base: 'c-visualizations__'
    }

    const getChartSelector = (chartId, chart = 'bar', withHash = true) => `${withHash ? '#' : ''}${selectors.base}${chart}--${chartId}`

    const randomColor = () => {
        let colors = THEME.lightColors()

        let color = THEME.lightenDarkenColor(colors[currentColorIndex].substr(1), currentColorPointer * -5);
        currentColorPointer++
        currentColorIndex++
        if (currentColorPointer >= colors.length) {
            currentColorPointer = 1
            currentColorIndex = 0
        }
        return {color: '#'+color}
    }

    const appendTooltip = (id, chart = 'bar') => {
        chartId.current = id
        d3.select(getChartSelector(id, chart))
            .append('div')
            .attr('id', `${selectors.base}tooltip--${id}`)
            .style('opacity', 0)
            .attr('class', `${selectors.base}tooltip`)
    }

    const isBar = (chart) => chart === 'bar'

    const isStackedBar = (chart) => chart === 'stackedBar'

    const isBarType = (chart) => isBar(chart) || isStackedBar(chart)

    const getTooltip = (id) => d3.select(`#${selectors.base}tooltip--${id}`)

    const toolTipHandlers = (id, chart = 'bar') => {
        return {
            mouseover: function(d) {
                getTooltip(id)
                    .style('opacity', 1)
                d3.select(this)
                    .style('opacity', 0.9)
                    .style('cursor', 'pointer')
            },
            mousemove: function(e, d) {
                const isModal = id === 'modal'
                const scale = (isModal ? (isBarType(chart) ? 1.5 : 1) : 5)
                const x = isBarType(chart) || !isModal ? d3.pointer(e)[0] : 200 + d3.pointer(e)[0]
                const label = d.label || d.data?.label || (e.currentTarget.getAttribute('data-label'))
                const value = d.value || d.data?.value || (e.currentTarget.getAttribute('data-value'))
                getTooltip(id)
                    .html(`<span>${label}</span>: ${value}`)
                    .style('left', x / scale + 'px')
                    .style(isBarType(chart) ? 'bottom' : 'top', isBarType(chart) ? (d3.pointer(e)[1] /scale) : 0   + 'px')
            },
            mouseleave: function(d) {
                getTooltip(id)
                    .style('opacity', 0)
                d3.select(this)
                    .style('stroke', 'none')
                    .style('cursor', 'default')
                    .style('opacity', 1)
            }
        };
    }

    return <ChartContext.Provider value={{
        getChartSelector,
        toolTipHandlers,
        appendTooltip,
        selectors
    }}>{children}</ChartContext.Provider>
}

export default ChartContext
