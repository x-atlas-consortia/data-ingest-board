import {useContext, useEffect, useState} from 'react'
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

function Visualizations({ data }) {

    const [legend, setLegend] = useState([])
    const [column, setColumn] = useState('group_name')
    const [chart, setChart] = useState('chart')
    const [chartData, setChartData] = useState([])

    const filterChartData = () => {
        console.log(data)
        let dict = {}
        for (let d of data) {
            let key = d[column]
            if (dict[key] === undefined) {
                dict[key] = {label: key, value: 0}
            }
            dict[key].value++
        }
        console.log(Object.values(dict))
        setChartData(Object.values(dict))
    }

    useEffect(() => {
        filterChartData()
    }, [data, column])

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
        {
            label: (<span><LineChartOutlined /> Line Chart</span>),
            key: 'line'
        },
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
            key: 'organ_type',
            disabled: true,
        },
    ];

    const getColumnName = () => {
        const c = columns.filter((c) => c.key === column)
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

                                        <Dropdown className={'c-visualizations__columnDropdown'} menu={columnMenuProps} placement="bottomLeft" arrow>
                                            <Button>Select a data column</Button>
                                        </Dropdown>

                                        <Dropdown className={'c-visualizations__chartDropdown'} menu={chartMenuProps} placement="bottomRight" arrow>
                                            <Button><AreaChartOutlined /></Button>
                                        </Dropdown>
                                    </Col>
                                    <Col span={3} offset={15}>
                                        <Button block icon={<ExpandAltOutlined />} size={'large'} >
                                            Fullscreen
                                        </Button>
                                    </Col>
                                </Row>
                                <Row>
                                    <div style={{width: '100%'}} className={'text-center'}>
                                        <h4>{TABLE.cols.n(column, getColumnName())}</h4>
                                        <span></span>
                                    </div>
                                </Row>
                                <Row>
                                    <Col span={18} push={6}>
                                        <Bar setLegend={setLegend} data={chartData} />
                                    </Col>
                                    <Col span={6} pull={18}>

                                        <Row>
                                            <Legend
                                                setLegend={setLegend}
                                                legend={legend}
                                            />
                                        </Row>
                                    </Col>
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