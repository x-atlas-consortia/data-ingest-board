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

const AppTableContext = createContext({})

export const AppTableProvider = ({ children, context, baseColumns }) => {
    let _a;
    const DragIndexContext = createContext({ active: -1, over: -1 })
    const [dragIndex, setDragIndex] = useState({ active: -1, over: -1 })
    const STORE_KEY = storageKey(`table.${context}`)
    const [dragEnd, setDragEnd] = useState(0)

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

    const getColumns = (cols) => {
        let orderedColumns = cols
        try {
            let _orderedColumns = []
            if (dragEnd === 0) {
                // Initialize with order from storage
                let columnOrder = localStorage.getItem(STORE_KEY)
                if (columnOrder) {
                    columnOrder = JSON.parse(columnOrder)
                }
                let dict = {}
                for (let c of cols) {
                    dict[c.dataIndex] = c
                }
                for (let c of columnOrder) {
                    _orderedColumns.push(dict[c])
                }
                orderedColumns = Array.from(_orderedColumns)
            }

            const _cols =  (orderedColumns.map((column, i) =>
                {
                    column.key = column.dataIndex
                    return Object.assign(Object.assign({}, column), {
                        key: `${i}`,
                        onHeaderCell: () => ({ id: `${i}` }),
                        onCell: () => ({ id: `${i}` }),
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
            localStorage.setItem(STORE_KEY, JSON.stringify(columns.map(a => a.dataIndex)))
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

    return (
        <AppTableContext.Provider value={{
            setColumns,
            getColumns,
            columns,
            TableBodyCell,
            TableHeaderCell,
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
