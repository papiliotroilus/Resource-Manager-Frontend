import {createFileRoute, Link} from '@tanstack/react-router'
import {keycloak} from "../main.tsx";
import request from 'superagent'
import LoaderHandler from '../components/LoaderHandler.tsx'
import {Space} from '@mantine/core'
import PageNavigator from '../components/PageNavigator.tsx'
import {DataTable} from 'mantine-datatable'
import IDButton from '../components/IDButton.tsx'
import ErrorHandler from '../components/ErrorHandler.tsx'

export const Route = createFileRoute('/users')({
    beforeLoad: async() => {await keycloak.updateToken()},
    loaderDeps: (search) => (search),
    loader: ({ deps: { search } }) => fetchData(search),
    component: SearchUsers
})

const fetchData = async (search:object) => {
    try {
        const backendURL = import.meta.env.VITE_BACKEND_URL || window.process.env.VITE_BACKEND_URL
        let requestURL=`${backendURL}v1/users/`
        // Take only relevant query params, remove invalid ones, and add defaults if missing
        const cleanedParams = Object.fromEntries(
            Object.entries(search).filter(([k, v]) =>
                (['user', 'col', 'dir', 'size', 'page'].includes(k) && (
                        (typeof v === 'string' && v !== "") || (typeof v === 'number' && !isNaN(v))
                    )
                )
            )
        )
        cleanedParams['col'] ??= 'userName'
        cleanedParams['dir'] ??= 'asc'
        cleanedParams['size'] ??= 10
        cleanedParams['page'] ??= 1
        const requestParams = new URLSearchParams(cleanedParams).toString()
        if (requestParams.length > 0) {
            requestURL = `${requestURL}?${requestParams}`
        }
        const response = await request
            .get(requestURL)
            .set({
                Authorization: `Bearer ${keycloak.token}`
            })
            .ok(() => true)
        return {cleanedParams, response}
    } catch (error) {
        console.log(error)
        throw "Failed to fetch data"
    }
}

function SearchUsers() {
    try {
        const loaderData = Route.useLoaderData()
        LoaderHandler(loaderData)
        const response = loaderData.response
        const queryParams:{size:string, page:string} = loaderData.cleanedParams
        const pageSize = Number(queryParams.size)
        const pageNumber = Number(queryParams.page)
        const results = response.body.pageUsers
        const totalResults = response.body.totalUsers
        let pageStart = pageSize * (pageNumber - 1) + 1
        if (totalResults === 0) {
            pageStart = 0
        }
        let pageEnd = pageSize * (pageNumber)
        if (pageEnd > totalResults) {
            pageEnd = totalResults
        }
        const lastPage = Math.ceil(totalResults/pageSize)
        return (
            <>
                <div>Displaying users {pageStart} - {pageEnd} / {totalResults} matching criteria {JSON.stringify(queryParams)}</div>
                <Space h="xs" />
                <PageNavigator lastPage={lastPage} queries={queryParams}/>
                <Space h="xs" />
                <DataTable
                    withTableBorder
                    withColumnBorders
                    striped
                    highlightOnHover
                    records={results}
                    columns={[
                        {accessor: 'userID', title: 'ID', render: (record) =>
                                <IDButton ID={record.userID} position="left" />
                        },
                        {accessor: 'userName', title: 'Name', render: (record) =>
                                <Link to={`/user/${record.userID}`}>{record.userName}</Link>
                        },
                        {accessor: '_count.resources', title: 'Resources', render: (record) =>
                                // @ts-expect-error because Mantine DataTables fails to properly infer types of nested properties
                                <Link to={`/resources/?userID=${record.userID}`}>{record._count.resources}</Link>
                        },
                        {accessor: '_count.reservations', title: 'Reservations', render: (record) =>
                                // @ts-expect-error because Mantine DataTables fails to properly infer types of nested properties
                                <Link to={`/reservations/?userID=${record.userID}`}>{record._count.reservations}</Link>
                        }
                    ]}
                />
                <Space h="xs" />
                <PageNavigator lastPage={lastPage} queries={queryParams}/>
            </>
        )
    } catch (error) {
        return (
            <ErrorHandler error={error}/>
        )
    }
}