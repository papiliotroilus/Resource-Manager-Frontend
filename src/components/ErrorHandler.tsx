function ErrorHandler({error}: {error:unknown}) {
    if (typeof error === "string" && error.slice(0, 4) === "Code") {
        return (
            <>
                <b>{error.slice(4, 8)}</b>
                <p>{error.slice(9)}</p>
            </>
        )
    } else {
        return (
            <>
                <b>500</b>
                <p>Unexpected error</p>
            </>
        )
    }
}

export default ErrorHandler