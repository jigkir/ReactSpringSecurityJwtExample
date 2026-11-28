function mergeHeaders(...headerInits) {
    let result = {}
    headerInits.forEach((init) => {
        new Headers(init).forEach((value, key) => {
            if (value === "null" || value === "undefined") {



                delete result[key]
            } else {

                result[key] = value
            }
        })
    })
    return result
}

export default mergeHeaders;
