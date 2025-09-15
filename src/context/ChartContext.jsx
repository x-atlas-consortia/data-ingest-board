import { createContext, useEffect, useState, useRef } from 'react'
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
        return { color: '#' + color }
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

    const getTooltipSelector = (id) => `#${selectors.base}tooltip--${id}`

    const getTooltip = (id) => d3.select(getTooltipSelector(id))

    const buildTooltip = (id, chart, e, d) => {
        const $element = $(getTooltipSelector(id)).parent()
        // const miniCharts = $element.parents('.c-visualizations__miniCharts')
        // const isMiniChart = miniCharts.length > 0
        const marginY = 40 // add a margin to prevent chrome flickering due to overlapping with tooltip
        const label = (e.currentTarget.getAttribute('data-label')) || d.label || d.data?.label
        const value = (e.currentTarget.getAttribute('data-value')) || d.value || d.data?.value
        const rect = $element[0]?.getBoundingClientRect()

        const xPos = e.clientX - rect.left
        const yPos = e.clientY - rect.top - marginY

        getTooltip(id)
            .html(`<span>${label}</span>: ${value}`)
            .style('left', xPos + 'px')
            .style('top', yPos + 'px')
    }

    const visibleTooltip = (id, chart, e, d) => {
        getTooltip(id)
            .style('opacity', 1)
        d3.select(this)
            .style('opacity', 0.9)
            .style('cursor', 'pointer')
    }

    const toolTipHandlers = (id, chart = 'bar') => {
        return {
            mouseover: function (e, d) {
                visibleTooltip(id, chart, e, d)
            },
            mouseenter: function (e, d) {
                e.stopPropagation()
                visibleTooltip(id, chart, e, d)
                buildTooltip(id, chart, e, d)
            },
            mousemove: function (e, d) {
                buildTooltip(id, chart, e, d)
            },
            mouseleave: function (e, d) {
                e.stopPropagation()
                console.log('mouse leave', e)
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
