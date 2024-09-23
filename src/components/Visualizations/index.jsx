import {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {
    AreaChartOutlined,
    PieChartOutlined,
    BarChartOutlined,
    LineChartOutlined,
    ExpandAltOutlined
} from '@ant-design/icons';
import {Col, Collapse, Row, Dropdown, Button} from "antd";
import Bar from "@/components/Visualizations/Charts/Bar";
import Legend from "@/components/Visualizations/Legend";
import TABLE from "@/lib/helpers/table";
import THEME from "@/lib/helpers/theme";
import FilmStrip from "@/components/Visualizations/FilmStrip";
import Pie from "@/components/Visualizations/Charts/Pie";

function Visualizations({ data, filters, defaultColumn = 'group_name' }) {

    const [legend, setLegend] = useState([])
    const [column, setColumn] = useState(defaultColumn)
    const [chart, setChart] = useState('bar')
    const [chartData, setChartData] = useState([])


    const filterChartData = (col) => {
        let dict = {}
        for (let d of data) {
            let key = d[col]
            if (dict[key] === undefined) {
                dict[key] = {label: key, value: 0, id: d.uuid}
            }
            dict[key].value++
        }
        return Object.values(dict)
    }

    useEffect(() => {
        setChartData(filterChartData(column))
    }, [data, column])

    const getStatusColor = (label) => {
        return THEME.getStatusColor(label).bg
    }

    const handleColumnMenuClick = (e) => {
        console.log('click', e);
        setColumn(e.key)
    }

    const handleChartMenuClick = (e) => {
        console.log('click', e)
        setChart(e.key)
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
        // {
        //     label: (<span><LineChartOutlined /> Line Chart</span>),
        //     key: 'line'
        // },
    ];

    const columns = [
        {
            label: 'Group Name',
            key: 'group_name',
            active: true,
        },
        {
            label: 'Status',
            key: 'status',
        },
        {
            label: TABLE.cols.n('source_type', 'Source Type'),
            key: TABLE.cols.f('source_type'),
        },
        {
            label: 'Dataset Type',
            key: 'dataset_type',
        },
        {
            label: 'Organ Type',
            key: 'organ',
            disabled: true,
        },
    ];

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

    const isBar = () => chart === 'bar'
    const isPie = () => chart === 'pie'

    const colorMethods = {
        'status': getStatusColor
    }
    
    const getMiniCharts = () => {
        let charts = []
        let i = 0
        for (let c of columns) {
            let _data = filterChartData(c.key)
            if (_data.length > 1) {
                charts.push(
                    <div
                        onClick={() => handleColumnMenuClick(c)}
                        key={i}
                        style={{ ...baseStyle }}
                        className={c.key === column ? 'is-active' : ''}
                    >
                        {isBar() && (
                            <Bar
                                data={_data}
                                filters={filters}
                                column={c.key}
                                chartId={i.toString()}
                                colorMethods={colorMethods}
                                reload={false}
                            />
                        )}
                        {isPie() && (
                            <Pie
                                data={filterChartData(c.key)}
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
        return charts
    }

    const hasMeaningfulData = () => chartData.length > 1

    return (
        <div className={'c-visualizations my-3'}>
            <Collapse
                size='large'
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
                            <div>
                                <Row>
                                    <Col span={6}>
                                        <Dropdown
                                            className={
                                                'c-visualizations__columnDropdown'
                                            }
                                            menu={columnMenuProps}
                                            placement='bottomLeft'
                                            arrow
                                        >
                                            <Button>
                                                Select a data column
                                            </Button>
                                        </Dropdown>

                                        <Dropdown
                                            className={
                                                'c-visualizations__chartDropdown'
                                            }
                                            menu={chartMenuProps}
                                            placement='bottomRight'
                                            arrow
                                        >
                                            <Button>
                                                <AreaChartOutlined />
                                            </Button>
                                        </Dropdown>
                                    </Col>
                                    <Col span={3} offset={15}>
                                        <Button
                                            block
                                            icon={<ExpandAltOutlined />}
                                            size={'large'}
                                        >
                                            Fullscreen
                                        </Button>
                                    </Col>
                                </Row>
                                <Row>
                                    <div
                                        style={{ width: '100%' }}
                                        className={'text-center'}
                                    >
                                        <h4>
                                            {TABLE.cols.n(
                                                column,
                                                getColumnName()
                                            )}
                                        </h4>
                                        {!hasMeaningfulData() && <div className={'mt-4'}>There is not enough data to present a meaningful chart visualization.</div>}
                                    </div>
                                </Row>
                                <Row>
                                    <Col span={18} push={6}>
                                        {isBar() && hasMeaningfulData() && (
                                            <Bar
                                                setLegend={setLegend}
                                                data={chartData}
                                                column={column}
                                                colorMethods={colorMethods}
                                            />
                                        )}
                                        {isPie() && hasMeaningfulData() && (
                                            <Pie
                                                setLegend={setLegend}
                                                data={chartData}
                                                column={column}
                                                colorMethods={colorMethods}
                                            />
                                        )}

                                    </Col>
                                    <Col span={6} pull={18}>
                                        <Row>
                                            {hasMeaningfulData() && <Legend
                                                setLegend={setLegend}
                                                legend={legend}
                                            />}
                                        </Row>
                                    </Col>
                                </Row>
                                <Row>
                                    <div className='container mt-5'>
                                        <FilmStrip>
                                            {getMiniCharts()}
                                        </FilmStrip>
                                    </div>
                                </Row>
                            </div>
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