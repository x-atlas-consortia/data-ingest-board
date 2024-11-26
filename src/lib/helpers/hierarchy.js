export const getHierarchy = (str) => {
    if (!window.UBKG) return str
    let res = window.UBKG.organTypesGroups[str.trim().toLowerCase()]
    if (!res) {
        const r = new RegExp(/.+?(?=\()/)
        res = str.match(r)

        return res && res.length ? res[0].trim() : str
    }
    return res
}
