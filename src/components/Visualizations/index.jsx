import {useEffect, useState, useRef} from 'react'
import PropTypes from 'prop-types'
import {
    AreaChartOutlined,
    PieChartOutlined,
    BarChartOutlined,
    ShareAltOutlined,
} from '@ant-design/icons';
import {Col, Collapse, Row, Dropdown, Button, Modal, Tooltip} from "antd";
import Bar from "@/components/Visualizations/Charts/Bar";
import Legend from "@/components/Visualizations/Legend";
import TABLE from "@/lib/helpers/table";
import THEME from "@/lib/helpers/theme";
import FilmStrip from "@/components/Visualizations/FilmStrip";
import Pie from "@/components/Visualizations/Charts/Pie";
import ENVS from '@/lib/helpers/envs';
import {getHierarchy} from "@/lib/helpers/hierarchy";
import {scaleOrdinal} from 'd3'
import Palette from 'xac-sankey/dist/js/util/Palette'
import useContent from "@/hooks/useContent";
import {getUBKGName, eq} from "@/lib/helpers/general";
import AppTooltip from '../AppTooltip';

function Visualizations({ data, filters, applyFilters, hasInitViz, setHasInitViz, defaultColumn = 'group_name' }) {
    const defaultChartTypes = ENVS.datasetCharts().reduce((acc, c) => {
        acc[c.key] = c.default;
        return acc
    }, {})

    const [legend, setLegend] = useState([])
    const [column, setColumn] = useState(defaultColumn)
    const [chartTypes, setChartTypes] = useState(defaultChartTypes)
    const [chartData, setChartData] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [selectedFilterValues, setSelectedFilterValues] = useState([])
    const { colorPalettes} = useContent()
    const hasHandledChartHotlinking = useRef(false)

    const getStatusColor = (label) => {
        return THEME.getStatusColor(label).bg
    }

    const [colorMethods, setColorMethods] = useState({'status': getStatusColor,})

    const hierarchyColumns = ['organ']

    const filterChartData = (col) => {
        let dict = {}
        for (let d of data) {
            let key = d[col]
            if (hierarchyColumns.includes(col)) {
                key = getHierarchy(getUBKGName(key))
            }
            if (dict[key] === undefined) {
                dict[key] = {label: key, value: 0, id: d.uuid}
            }
            dict[key].value++
        }
        const values = Object.values(dict).filter((v) => v.label !== '')
        return values.sort((a, b) => b.value - a.value)
    }

    const getColorScale = (key, palette) => {
        return colorPalettes && Object.keys(colorPalettes).length ? scaleOrdinal(Object.keys(colorPalettes[key]), Object.values(colorPalettes[key])) : scaleOrdinal(palette)
    }

    const applyColors = () => {

        let _colorMethods = {
            ...colorMethods,
            organ: ENVS.isHM() ? undefined : getColorScale('organs', Palette.pinkColors),
            source_type: ENVS.isHM() ? undefined : scaleOrdinal(Palette.yellowColors),
            dataset_type: ENVS.isHM() ? undefined :  getColorScale('datasetTypes', Palette.greenColors),
            group_name: ENVS.isHM() ? undefined :  getColorScale('groups', Palette.blueGreyColors),

        }
        setColorMethods(_colorMethods)
    }

    const handleChartRequest = () => {
        const query = new URLSearchParams(window.location.search)
        const viz = query.get('chart')
        let chartType = query.get('chartType')?.toLowerCase()
        if (viz) {
            for (let c of columns) {
                if (eq(c.key, viz) || eq(c.label, viz)) {
                    hasHandledChartHotlinking.current = true
                    if (chartType && ['bar', 'pie'].comprises(chartType)) {
                        handleChartMenuClick({key: chartType, column: c.key})
                    }
                    openMiniChartInModal(c)
                    break
                }
            }
        }
    }

    useEffect(() => {
        if (data && data.length && !hasHandledChartHotlinking.current) {
            handleChartRequest()
        }
    }, [data])

    useEffect(() => {
        const filteredData = filterChartData(column)

        applyColors()
        setChartData(filteredData)
        setHasInitViz(true)
    }, [data, column, hasInitViz])

    const handleColumnMenuClick = (e) => {
        setColumn(e.key)
    }

    const handleChartMenuClick = (e) => {
        setChartTypes((prevTypes) => {
            return {
                ...prevTypes,
                [e.column || column]: e.key
            }
        })
    }

    const handleChartItemClick = (label) => {
        // Used for both the legend and chart items
        setSelectedFilterValues((prevValues) => {
            if (prevValues.includes(label)) {
                return prevValues.filter((v) => v !== label);
            } else {
                return [...prevValues, label];
            }
        })
    }

    const handleModalClose = (shouldApplyFilters) => {
        if (selectedFilterValues.length > 0 && shouldApplyFilters) {
            const query = new URLSearchParams(window.location.search)
            const pageSize = query.get('page_size') || 10

            // This overrides any existing filters
            const filtersToApply = {
                [column]: selectedFilterValues.map((v) => v.toLowerCase())
            }

            const pagination = {
                currentPage: 1,
                pageSize: pageSize,
            }

            const sorter = {
                field: column,
                order: 'ascend',
            }

            applyFilters(pagination, filtersToApply, sorter, {})
        }

        setSelectedFilterValues([])
        setShowModal(false)
    }

    const charts = [
        {
            label: (<span><BarChartOutlined /> Bar Chart</span>),
            key: 'bar'
        },
        {
            label:  (<span><PieChartOutlined /> Pie Chart</span>),
            key: 'pie'
        },
    ];

    const columns = ENVS.datasetCharts()

    const getColumnName = ( col ) => {
        col = col || column
        const c = columns.filter((c) => c.key === col)
        return c[0].label
    }

    const columnMenuProps = {
        items: columns,
        onClick: handleColumnMenuClick,
    }

    const chartMenuProps = {
        items: charts,
        onClick: handleChartMenuClick,
    }

    const baseStyle = {
        width: '25%',
    }

    const isBar = (key) => chartTypes[key] === 'bar'
    const isPie = (key) => chartTypes[key] === 'pie'

    const openMiniChartInModal = (c) => {
        handleColumnMenuClick(c)
        setShowModal(true)
    }

    const getMiniCharts = () => {
        let charts = []
        let i = 0
        const chartClassName = 'c-visualizations__miniCharts'
        for (let c of columns) {
            let _data = filterChartData(c.key)
            if (_data.length > 1) {
                charts.push(
                    <div
                        onClick={() => openMiniChartInModal(c)}
                        key={i}
                        style={{ ...baseStyle }}
                        className={c.key === column ? chartClassName+' is-active' : chartClassName}
                    >
                        {hasInitViz && isBar(c.key) && (
                            <Bar
                                data={_data}
                                filters={filters}
                                column={c.key}
                                chartId={i.toString()}
                                reload={false}
                                yAxis={{showLabels: false}}
                                xAxis={{showLabels: false, colorMethods }}
                            />
                        )}
                        {hasInitViz && isPie(c.key) && (
                            <Pie
                                data={_data}
                                column={c.key}
                                chartId={i.toString()}
                                xAxis={{ colorMethods }}
                            />
                        )}
                        <div className='text-center'>
                            <small>{getColumnName(c.key)}</small>
                        </div>
                    </div>
                )
            }

            i++
        }
        if (charts.length === 0) {
            return (
                <div className='text-center w-100'>
                    There is not enough data to present meaningful visualizations.
                </div>
            )
        }

        return charts
    }

    const hasMeaningfulData = () => chartData.length > 1

    const getShareAbleURL = () => {
        navigator.clipboard.writeText(`${location.host}/?chart=${column}&chartType=${chartTypes[column] || 'bar'}`)
    }   

    return (
        <div className='c-visualizations my-3'>
            <Collapse
                size='large'
                defaultActiveKey={['1']}
                items={[
                    {
                        key: '1',
                        label: (
                            <div>
                                <PieChartOutlined />{' '}
                                <span className={'h6 mx-2'}>
                                    Visualizations
                                </span>
                            </div>
                        ),
                        children: (
                            <>
                                <Row>
                                    <div className='container'>
                                        <FilmStrip>
                                            {getMiniCharts()}
                                        </FilmStrip>
                                    </div>
                                </Row>

                                <Modal
                                    className='c-chart c-chart--modal'
                                    classNames={{ body: 'c-chart__body' }}
                                    title={<div>
                                        <span>{TABLE.cols.n(
                                            column,
                                            getColumnName()
                                        )}</span>
                                        <span style={{float: 'right'}} >
                                            <AppTooltip title={'Shareable URL copied to clipboard!'}>
                                            <span onClick={getShareAbleURL} >
                                                <Tooltip title='Copy shareable URL' placement='left'><ShareAltOutlined style={{color: 'var(--bs-blue)', cursor: 'pointer'}} /></Tooltip>
                                            </span>
                                        </AppTooltip>
                                        </span>
                                    </div>}
                                    centered
                                    closable={false}
                                    open={showModal}
                                    onOk={() => handleModalClose(true)}
                                    onCancel={() => handleModalClose(false)}
                                    okText='Set filters and close'
                                    cancelText='Close'
                                    okButtonProps={{ disabled: selectedFilterValues.length === 0 }}
                                >
                                    <Row>
                                        <div className='c-visualizations__dropdownContainer'>
                                            <Dropdown
                                                className='c-visualizations__columnDropdown'
                                                menu={columnMenuProps}
                                                placement='bottomLeft'
                                                arrow
                                            >
                                                <Button>
                                                    Select a data column
                                                </Button>
                                            </Dropdown>

                                            <Dropdown
                                                className='c-visualizations__chartDropdown'
                                                menu={chartMenuProps}
                                                placement='bottomRight'
                                                arrow
                                            >
                                                <Button>
                                                    <AreaChartOutlined />
                                                </Button>
                                            </Dropdown>
                                        </div>
                                    </Row>

                                    <Row>
                                        {!hasMeaningfulData() && (
                                            <Col className='text-center w-100' span={24} >
                                                There is not enough data to present a meaningful chart visualization.
                                            </Col>
                                        )}

                                        <Col className='mt-4 ps-md-4' md={{ span: 18, push: 6 }} sm={{ span: 24 }} xs={{ span: 24 }}>
                                            {isBar(column) && hasMeaningfulData() && (
                                                <Bar
                                                    setLegend={setLegend}
                                                    data={chartData}
                                                    column={column}
                                                    onSectionClick={handleChartItemClick}
                                                    xAxis={{showLabels: true, colorMethods }}
                                                />
                                            )}
                                            {isPie(column) && hasMeaningfulData() && (
                                                <Pie
                                                    setLegend={setLegend}
                                                    data={chartData}
                                                    column={column}
                                                    xAxis={{ colorMethods }}
                                                    onSectionClick={handleChartItemClick}
                                                />
                                            )}
                                        </Col>

                                        <Col className='mt-4' md={{ span: 6, pull: 18 }} sm={{ span: 24 }} xs={{ span: 24 }}>
                                            {hasMeaningfulData() && <Legend
                                                legend={legend}
                                                selectedValues={selectedFilterValues}
                                                onItemClick={handleChartItemClick}
                                            />}
                                        </Col>
                                    </Row>
                                </Modal>
                            </>
                        )
                    }
                ]}
            />
        </div>
    )
}


Visualizations.propTypes = {
    children: PropTypes.node
}

export default Visualizations
