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

    const getChartSelector = (chartId, withHash = true) => `${withHash ? '#' : ''}${selectors.base}bar--${chartId}`

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

    const appendTooltip = (id) => {
        chartId.current = id
        d3.select(getChartSelector(id))
            .append('div')
            .attr('id', `${selectors.base}tooltip--${id}`)
            .style('opacity', 0)
            .attr('class', `${selectors.base}tooltip`)
    }

    const getTooltip = (id) => d3.select(`#${selectors.base}tooltip--${id}`)

    const toolTipHandlers = (id) => {
        return {
            mouseover: function(d) {
                getTooltip(id)
                    .style('opacity', 1)
                d3.select(this)
                    .style('opacity', 0.9)
                    .style('cursor', 'pointer')
            },
            mousemove: function(e, d) {
                const scale = (id === 'modal' ? 1.5 : 5)
                getTooltip(id)
                    .html(`<span>${d.label}</span>: ${d.value}`)
                    .style('left', d3.pointer(e)[0] / scale + 'px')
                    .style('bottom', d3.pointer(e)[1] /scale   + 'px')
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


    const addHandlers = (id, tag = 'rect') => {
        d3.select(getChartSelector(id)).selectAll(tag)
            .on("mouseover", toolTipHandlers.mouseover)
            .on("mousemove", toolTipHandlers.mousemove)
            .on("mouseleave", toolTipHandlers.mouseleave)
    }

    return <ChartContext.Provider value={{
        getChartSelector,
        addHandlers,
        toolTipHandlers,
        appendTooltip,
    }}>{children}</ChartContext.Provider>
}

export default ChartContext
