import {createFileRoute, Link} from '@tanstack/react-router'
import {keycloak} from "../main.tsx";
import request from 'superagent'
import LoaderHandler from '../components/LoaderHandler.tsx'
import {Space} from '@mantine/core'
import PageNavigator from '../components/PageNavigator.tsx'
import {DataTable} from 'mantine-datatable'
import IDButton from '../components/IDButton.tsx'
import ErrorHandler from '../components/ErrorHandler.tsx'

export const Route = createFileRoute('/reservations')({
    beforeLoad: async() => {await keycloak.updateToken()},
    loaderDeps: (search) => (search),
    loader: ({ deps: { search } }) => fetchData(search),
    component: SearchReservations
})

const fetchData = async (search:object) => {
    try {
        const backendURL = import.meta.env.VITE_BACKEND_URL || window.process.env.VITE_BACKEND_URL
        let requestURL=`${backendURL}v1/reservations`
        // Take only relevant query params, remove invalid ones, and add defaults if missing
        const cleanedParams = Object.fromEntries(
            Object.entries(search).filter(([k, v]) =>
                (['userID', 'user', 'resourceID', 'resource', 'startsBefore', 'startsAfter', 'endsBefore', 'endsAfter',
                        'col', 'dir', 'size', 'page'].includes(k) && (
                        (typeof v === 'string' && v !== "") || (typeof v === 'number' && !isNaN(v))
                    )
                )
            )
        )
        cleanedParams['col'] ??= 'startTime'
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

function SearchReservations() {
    try {
        const loaderData = Route.useLoaderData()
        LoaderHandler(loaderData)
        const response = loaderData.response
        const queryParams:{size:string, page:string} = loaderData.cleanedParams
        const pageSize = Number(queryParams.size)
        const pageNumber = Number(queryParams.page)
        const results = response.body.pageReservations
        const totalResults = response.body.totalReservations
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
                <div>Displaying reservations {pageStart} - {pageEnd} / {totalResults} matching criteria {JSON.stringify(queryParams)}</div>
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
                        {accessor: 'reservationID', title: 'ID', render: (record) =>
                                <IDButton ID={record.reservationID} position="left" />
                        },
                        {accessor: 'reservationID', title: 'Details', render: (record) =>
                                <Link to={`/reservation/${record.reservationID}`}>{'View'}</Link>
                        },
                        {accessor: 'reservedResource.resourceID', hidden:true},
                        {accessor: 'reservedResource.resourceName', title: 'Resource', render: (record) =>
                                // @ts-expect-error because Mantine DataTables fails to properly infer types of nested properties
                                <><Link to={`/resource/${record.reservedResource.resourceID}`}>{record.reservedResource.resourceName}</Link></>
                        },
                        {accessor: 'startTime', title: 'Start time', render: (record) =>
                                <>{new Date(record.startTime).toLocaleString()}</>
                        },
                        {accessor: 'endTime', title: 'End time', render: (record) =>
                                <>{new Date(record.endTime).toLocaleString()}</>
                        },
                        {accessor: 'reservee.userID', hidden:true},
                        {accessor: 'reservee.userName', title: 'Reservee', render: (record) =>
                                // @ts-expect-error because Mantine DataTables fails to properly infer types of nested properties
                                <><Link to={`/user/${record.reservee.userID}`}>{record.reservee.userName}</Link></>
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