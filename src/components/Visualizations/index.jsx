import {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {
    AreaChartOutlined,
    PieChartOutlined,
    BarChartOutlined,
} from '@ant-design/icons';
import {Col, Collapse, Row, Dropdown, Button, Modal} from "antd";
import Bar from "@/components/Visualizations/Charts/Bar";
import Legend from "@/components/Visualizations/Legend";
import TABLE from "@/lib/helpers/table";
import THEME from "@/lib/helpers/theme";
import FilmStrip from "@/components/Visualizations/FilmStrip";
import Pie from "@/components/Visualizations/Charts/Pie";
import ENVS from '@/lib/helpers/envs';
import {getHierarchy} from "@/lib/helpers/hierarchy";

function Visualizations({ data, filters, applyFilters, defaultColumn = 'group_name' }) {
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

    const hierarchyColumns = ['organ']

    const filterChartData = (col) => {
        let dict = {}
        for (let d of data) {
            let key = d[col]
            if (hierarchyColumns.includes(col)) {
                key = getHierarchy(key)
            }
            if (dict[key] === undefined) {
                dict[key] = {label: key, value: 0, id: d.uuid}
            }
            dict[key].value++
        }
        const values = Object.values(dict)
        return values.sort((a, b) => b.value - a.value)
    }

    useEffect(() => {
        const filteredData = filterChartData(column)
        setChartData(filteredData)
    }, [data, column])

    const getStatusColor = (label) => {
        return THEME.getStatusColor(label).bg
    }

    const handleColumnMenuClick = (e) => {
        setColumn(e.key)
    }

    const handleChartMenuClick = (e) => {
        setChartTypes((prevTypes) => {
            return {
                ...prevTypes,
                [column]: e.key
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

    const colorMethods = {
        'status': getStatusColor
    }

    const openMiniChartInModal = (c) => {
        handleColumnMenuClick(c)
        setShowModal(true)
    }

    const getMiniCharts = () => {
        let charts = []
        let i = 0
        for (let c of columns) {
            let _data = filterChartData(c.key)
            if (_data.length > 1) {
                charts.push(
                    <div
                        onClick={() => openMiniChartInModal(c)}
                        key={i}
                        style={{ ...baseStyle }}
                        className={c.key === column ? 'is-active' : ''}
                    >
                        {isBar(c.key) && (
                            <Bar
                                data={_data}
                                filters={filters}
                                column={c.key}
                                chartId={i.toString()}
                                colorMethods={colorMethods}
                                showXLabels={false}
                                reload={false}
                            />
                        )}
                        {isPie(c.key) && (
                            <Pie
                                data={_data}
                                column={c.key}
                                chartId={i.toString()}
                                colorMethods={colorMethods}
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
                                    className='c-chart-modal'
                                    classNames={{ body: 'c-chart-modal__body' }}
                                    title={TABLE.cols.n(
                                        column,
                                        getColumnName()
                                    )}
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
                                        <Col span={24}>
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
                                        </Col>
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
                                                    colorMethods={colorMethods}
                                                    showXLabels={true}
                                                    onSectionClick={handleChartItemClick}
                                                />
                                            )}
                                            {isPie(column) && hasMeaningfulData() && (
                                                <Pie
                                                    setLegend={setLegend}
                                                    data={chartData}
                                                    column={column}
                                                    colorMethods={colorMethods}
                                                    onSectionClick={handleChartItemClick}
                                                />
                                            )}
                                        </Col>

                                        <Col className='mt-4' md={{ span: 6, pull: 18 }} sm={{ span: 24 }} xs={{ span: 24 }}>
                                            {hasMeaningfulData() && <Legend
                                                legend={legend}
                                                setLegend={setLegend}
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
