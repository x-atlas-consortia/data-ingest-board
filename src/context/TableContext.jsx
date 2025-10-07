import {createContext, useEffect, useState, useRef, useContext} from 'react'
import {
    closestCenter,
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import {
    arrayMove,
    horizontalListSortingStrategy,
    SortableContext,
    useSortable
} from '@dnd-kit/sortable'
import {storageKey} from "@/lib/helpers/general";
import RouterContext from "@/context/RouterContext";

const AppTableContext = createContext({})

export const TABLE_COL_ORDER_KEY = 'table.orderedColumns.'
export const TABLE_COL_HIDDEN_KEY = 'table.hiddenColumns.'

const DragIndexContext = createContext({ active: -1, over: -1 })

export const AppTableProvider = ({ children,  context, baseColumns, initialColumnsToHide = [] }) => {
    let _a;

    const [dragIndex, setDragIndex] = useState({ active: -1, over: -1 })
    const orderedColumnsStoreKey = storageKey(`${TABLE_COL_ORDER_KEY}${context}`)
    const hiddenColumnsStoreKey = storageKey(`${TABLE_COL_HIDDEN_KEY}${context}`)
    const [dragEnd, setDragEnd] = useState(0)
    const [hiddenColumns, setHiddenColumns] = useState(initialColumnsToHide)
    const {setFilters, setPage, setPageSize} = useContext(RouterContext)
    const sortingInfo = useRef(null)
    const adjustedFilters = useRef(null)

    useEffect(() => {
        $('body').on('click', '.ant-table-filter-dropdown-btns', (e)=> {
            setFilters(adjustedFilters.current)
        })
    }, []);

    const getColumnsDict = (cols) => {
        let dict = {}
        for (let c of cols) {
            dict[c.dataIndex] = c
        }
        return dict
    }
    const handleHiddenColumns = (hidden) => {
        for (let c of columns) {
            c.hidden = hidden.comprises(c.dataIndex)
        }
        localStorage.setItem(hiddenColumnsStoreKey, JSON.stringify(hidden))
        setHiddenColumns(hidden)
    }

    const dragActiveStyle = (dragState, id) => {
        const { active, over, direction } = dragState
        // drag active style
        let style = {}
        if (active && active === id) {
            style = { backgroundColor: 'gray', opacity: 0.5 }
        }
        // dragover dashed style
        else if (over && id === over && active !== over) {
            style =
                direction === 'right'
                    ? { borderRight: '1px dashed gray' }
                    : { borderLeft: '1px dashed gray' }
        }
        return style
    }
    const TableBodyCell = (props) => {
        const dragState = useContext(DragIndexContext)
        return (
            <td
                {...props}
                style={Object.assign(
                    Object.assign({}, props.style),
                    dragActiveStyle(dragState, props.id)
                )}
            />
        )
    }
    const TableHeaderCell = (props) => {
        const dragState = useContext(DragIndexContext)
        const { attributes, listeners, setNodeRef, isDragging } = useSortable({
            id: props.id
        })
        const style = Object.assign(
            Object.assign(
                Object.assign(Object.assign({}, props.style), {
                    cursor: 'move'
                }),
                isDragging
                    ? { position: 'relative', zIndex: 9999, userSelect: 'none' }
                    : {}
            ),
            dragActiveStyle(dragState, props.id)
        )
        return (
            <th
                {...props}
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
            />
        )
    }

    const getHiddenColumns = () => {
        let hiddenColumns = localStorage.getItem(hiddenColumnsStoreKey)
        if (hiddenColumns) {
            hiddenColumns = JSON.parse(hiddenColumns)
        } else {
            hiddenColumns = initialColumnsToHide
        }
        return hiddenColumns
    }

    const getColumns = (cols) => {
        let orderedColumns = cols
        try {
            let _orderedColumns = []
            if (dragEnd === 0) {
                // Initialize with order from storage
                let columnOrder = localStorage.getItem(orderedColumnsStoreKey)
                if (columnOrder) {
                    columnOrder = JSON.parse(columnOrder)

                    let dict = getColumnsDict(cols)
                    for (let c of columnOrder) {
                        _orderedColumns.push(dict[c])
                    }
                    orderedColumns = Array.from(_orderedColumns)
                }

                let hiddenColumns = getHiddenColumns()
                for (let c of orderedColumns) {
                    c.hidden = hiddenColumns.comprises(c.dataIndex)
                }
            }

            const _cols =  (orderedColumns.map((column, i) =>
                {
                    column.key = column.dataIndex
                    const id = column.dataIndex || `${i}`
                    return Object.assign(Object.assign({}, column), {
                        key: id,
                        onHeaderCell: () => ({ id }),
                        onCell: () => ({ id }),
                    })
                }
            ))
            return _cols
        } catch (e) {
            console.error(e)
        }
        return []
    }

    const [columns, setColumns] = useState(getColumns(baseColumns))

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                // https://docs.dndkit.com/api-documentation/sensors/pointer#activation-constraints
                distance: 1,
            },
        }),
    );

    useEffect(() => {
        if (dragEnd !== 0) {
            localStorage.setItem(orderedColumnsStoreKey, JSON.stringify(columns.map(a => a.dataIndex)))
        }

    }, [dragEnd]);

    const onDragEnd = ({ active, over }) => {
        if (active.id !== (over === null || over === void 0 ? void 0 : over.id)) {
            setColumns(prevState => {
                const activeIndex = prevState.findIndex(
                    i => i.key === (active === null || active === void 0 ? void 0 : active.id),
                );
                const overIndex = prevState.findIndex(
                    i => i.key === (over === null || over === void 0 ? void 0 : over.id),
                );
                return arrayMove(prevState, activeIndex, overIndex);
            });
            setDragEnd(dragEnd+1)
        }
        setDragIndex({ active: -1, over: -1 });
    };
    const onDragOver = ({ active, over }) => {
        const activeIndex = columns.findIndex(i => i.key === active.id);
        const overIndex = columns.findIndex(
            i => i.key === (over === null || over === void 0 ? void 0 : over.id),
        );
        setDragIndex({
            active: active.id,
            over: over === null || over === void 0 ? void 0 : over.id,
            direction: overIndex > activeIndex ? 'right' : 'left',
        });
    };

    const handleTableChange = (pagination, _filters, sorter, {}) => {

        const query = new URLSearchParams(window.location.search)

        setPage(pagination.current)
        setPageSize(pagination.pageSize)
        let correctedFilters = {}
        let filtersToRemove = {}

        for (let filter in _filters) {
            if (_filters[filter]) {
                correctedFilters[filter] = _filters[filter];
            } else {
                filtersToRemove[filter] = true
            }
        }

        for (let correctedFilter in correctedFilters){
            if (Array.isArray(correctedFilters[correctedFilter])){
                correctedFilters[correctedFilter] = correctedFilters[correctedFilter].join(',');
            }
        }




        const clearSort = () => {
            //setSortOrder(undefined)
            //setSortField(undefined)
            sortingInfo.current = null
            query.delete('sort_field')
            query.delete('sort_order')
        }

        if (sorter.field) {
            const sortingFlag = `${sorter.field}_${sorter.order}`
            if (sortingInfo.current === sortingFlag) {
                setFilters(correctedFilters)
            }
            query.set('sort_field', sorter.field);
            if (sorter.order) {
                sortingInfo.current = sortingFlag
                query.set('sort_order', sorter.order);
            } else {
                clearSort()
            }

        } else {
            adjustedFilters.current = correctedFilters
            setFilters(correctedFilters)
            clearSort()
        }
        Object.keys(correctedFilters).forEach(key => {
            if (correctedFilters[key]) {
                let val = Array.isArray(correctedFilters[key]) ? correctedFilters[key] : [correctedFilters[key]]
                query.set(key, val.join(','));
            } else {
                query.delete(key);
            }
        });

        Object.keys(filtersToRemove).forEach(key => {
            query.delete(key);
        });

        if (pagination.current && pagination.current !== 1) {
            query.set('page', pagination.current);
        } else {
            query.delete('page');
        }
        if (pagination.pageSize && pagination.pageSize !== 10) {
            query.set('page_size', pagination.pageSize);
        } else {
            query.delete('page_size');
        }
        window.history.pushState(null, null, `?${query.toString()}`);
    }

    return (
        <AppTableContext.Provider value={{
            context,
            handleHiddenColumns,
            getHiddenColumns,
            setColumns,
            getColumns,
            getColumnsDict,
            columns,
            TableBodyCell,
            TableHeaderCell,
            handleTableChange,
            baseColumns,
            hiddenColumns,
            dragIndex
        }}>
            <DndContext
                sensors={sensors}
                modifiers={[restrictToHorizontalAxis]}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                collisionDetection={closestCenter}
            >
                <SortableContext items={columns.map(i => {
                    return i.key
                })} strategy={horizontalListSortingStrategy}>
                    <DragIndexContext.Provider value={dragIndex}>
            {children}
                    </DragIndexContext.Provider>
                </SortableContext>
                <DragOverlay>
                    <th style={{ backgroundColor: 'gray', padding: 16 }}>
                        {(_a = columns[columns.findIndex(i => i.key === dragIndex.active)]) === null ||
                        _a === void 0
                            ? void 0
                            : _a.title}
                    </th>
                </DragOverlay>
            </DndContext>
        </AppTableContext.Provider>
    )
}

export default AppTableContext
