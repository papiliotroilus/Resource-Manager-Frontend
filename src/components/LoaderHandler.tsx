function LoaderHandler(loaderData:{response:{status:number, text:string}} | undefined) {
    console.log("Function loader data:")
    console.log(loaderData)
    if (!loaderData) {
        return "Code 500 Cannot fetch from backend"
    }
    const response = loaderData.response
    if (response.status !== 200) {
        return `Code ${response.status} ${response.text}`
    }
    return undefined
}

export default LoaderHandler