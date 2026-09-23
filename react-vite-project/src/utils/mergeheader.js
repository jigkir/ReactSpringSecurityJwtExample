function mergeHeaders(...headerInits) {
    let result = {}
    headerInits.forEach((init) => {
        new Headers(init).forEach((value, key) => {
            if (value === "null" || value === "undefined") {
                // same as object spread: undefined overrides the current value
                // "null" and "undefined" got stringified in the process and are not valid headers values
                // therefore in this case we can remove the header
                delete result[key]
            } else {
                // add the header
                result[key] = value
            }
        })
    })
    return result
}

export default mergeHeaders;