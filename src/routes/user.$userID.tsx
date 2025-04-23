import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {keycloak} from "../main.tsx";
import request from 'superagent'
import LoaderHandler from '../components/LoaderHandler.tsx';
import { useState } from 'react';
import {DataTable, DataTableSortStatus} from 'mantine-datatable'
import useAuthStore from '../hooks/authStore.tsx';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {Button, Grid, Group, Modal, Space, Stack, Table, Text } from '@mantine/core';
import IDButton from '../components/IDButton.tsx';
import {IconUserDown, IconUserUp, IconUserX } from '@tabler/icons-react';
import ErrorHandler from '../components/ErrorHandler.tsx'

export const Route = createFileRoute('/user/$userID')({
    beforeLoad: async() => {await keycloak.updateToken()},
    loader: ({ params }) => fetchData(params.userID),
    component: ShowUser,
})

const fetchData = async (userID:string) => {
    const backendURL = import.meta.env.VITE_BACKEND_URL || window.process.env.VITE_BACKEND_URL
    const requestURL = `${backendURL}v1/users/${userID}`
    const response = await request
        .get(requestURL)
        .set({
            Authorization: `Bearer ${keycloak.token}`
        })
        .ok(() => true)
    const roleURL = `${backendURL}v1/users/role/${userID}`
    const roleResponse = await request
        .get(roleURL)
        .set({
            Authorization: `Bearer ${keycloak.token}`
        })
        .ok(() => true)
    let userRole = "unknown"
    if (roleResponse.status === 200) {
        userRole = roleResponse.text
    }
    return {response, userRole}
}

function ShowUser() {
    const backendURL = import.meta.env.VITE_BACKEND_URL || window.process.env.VITE_BACKEND_URL
    // Hooks
    const loaderData = Route.useLoaderData()
    const navigate = useNavigate()
    const [reservationsPage, setReservationsPage] = useState(1)
    const [reservationsSortStatus, setReservationsSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: "startTime",
        direction: "asc",
    })
    const [resourcesPage, setResourcesPage] = useState(1)
    const [resourcesSortStatus, setResourcesSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: "_count.reservations",
        direction: "desc",
    })
    const {role, username} = useAuthStore()
    const [deletePopup, {open:openDelete, close:closeDelete}] = useDisclosure(false)
    const [changeRolePopup, {open:openChangeRole, close:closeChangeRole}] = useDisclosure(false)

    // Load error handling
    console.log("Loader:")
    console.log(loaderData)
    const loaderError = LoaderHandler(loaderData)
    console.log("Loader error:")
    console.log(loaderError)
    if (loaderError) {return (
        <ErrorHandler error={loaderError}/>
    )}
    const user = loaderData.response.body
    const userIsAdmin = loaderData.userRole === 'admin'
    const userRole = loaderData.userRole

    // Reservations table clientside sorting and pagination logic
    const reservationsSortedRecords = [...user.reservations].sort((a, b) => {
        const { columnAccessor, direction } = reservationsSortStatus
        const multiplier = direction === "asc" ? 1 : -1
        return (a[columnAccessor] > b[columnAccessor] ? 1 : -1) * multiplier
    })
    const reservationsFrom = (reservationsPage - 1) * 10
    const reservationsTo = reservationsFrom + 10
    const reservationsPaginatedRecords = reservationsSortedRecords.slice(reservationsFrom, reservationsTo)

    // Resources table clientside sorting and pagination logic
    const resourcesSortedRecords = [...user.resources].sort((a, b) => {
        const { columnAccessor, direction } = resourcesSortStatus
        const multiplier = direction === "asc" ? 1 : -1
        return (a[columnAccessor] > b[columnAccessor] ? 1 : -1) * multiplier
    })
    const resourcesFrom = (resourcesPage - 1) * 10
    const resourcesTo = resourcesFrom + 10
    const resourcesPaginatedRecords = resourcesSortedRecords.slice(resourcesFrom, resourcesTo)

    // Edit and delete privilege determining logic
    const isAdmin = (role === 'admin')
    const canDelete = (user.userName !== username) && isAdmin

    // User deletion logic
    const handleDelete = async () => {
        const deleteResponse = await request
            .delete(`${backendURL}v1/users/${user.userID}`)
            .set({
                Authorization: `Bearer ${keycloak.token}`
            })
            .ok(() => true)
        if (deleteResponse.status === 200) {
            navigate({to: "/users"})
        } else {
            notifications.show({
                title: 'Error',
                message: deleteResponse.text,
            })
        }
    }

    // User role change logic
    const handleChangeRole = async () => {
        let newRole = 'admin'
        if (userRole === 'admin') {
            newRole = 'user'
        }
        const changeRoleResponse = await request
            .patch(`${backendURL}v1/users/role/${user.userID}`)
            .set({
                Authorization: `Bearer ${keycloak.token}`,
                'Access-Control-Allow-Origin': '*'
            })
            .send({role: newRole})
            .ok(() => true)
        if (changeRoleResponse.status === 200) {
            navigate({to: `/user/${user.userID}`})
        } else {
            notifications.show({
                title: 'Error',
                message: changeRoleResponse.text,
            })
        }
    }
    try {
        return (
            <>
                {/* Delete user confirmation pop-up */}
                <Modal
                    opened={deletePopup}
                    onClose={closeDelete} size="auto"
                    withCloseButton={false}
                    radius="md"
                >
                    <Stack px="md">
                        <div>Are you sure you wish to delete <b>{user.userName}</b> along with all of their reservations and resources?</div>
                        <Grid justify="center">
                            <Grid.Col span="content">
                                <Button
                                    onClick={() => {handleDelete(); closeDelete()}}
                                    variant="filled"
                                    color="pink"
                                    radius="md"
                                >
                                    Yes
                                </Button>
                            </Grid.Col>
                            <Grid.Col span="content">
                                <Button
                                    onClick={closeDelete}
                                    variant="default"
                                    radius="md"
                                >
                                    No
                                </Button>
                            </Grid.Col>
                        </Grid>
                    </Stack>
                </Modal>
                {/* Change user role confirmation pop-up */}
                <Modal
                    opened={changeRolePopup}
                    onClose={closeChangeRole} size="auto"
                    withCloseButton={false}
                    radius="md"
                >
                    <Stack px="md">
                        {userRole === 'user' && (
                            <div>Are you sure you wish to promote <b>{user.userName}</b> to admin?</div>
                        )}
                        {userRole === 'admin' && (
                            <div>Are you sure you wish to demote <b>{user.userName}</b> to user?</div>
                        )}
                        <Grid justify="center">
                            <Grid.Col span="content">
                                <Button
                                    onClick={() => {handleChangeRole(); closeChangeRole()}}
                                    variant="filled"
                                    color="pink"
                                    radius="md"
                                >
                                    Yes
                                </Button>
                            </Grid.Col>
                            <Grid.Col span="content">
                                <Button
                                    onClick={closeChangeRole}
                                    variant="default"
                                    radius="md"
                                >
                                    No
                                </Button>
                            </Grid.Col>
                        </Grid>
                    </Stack>
                </Modal>
                <Text fw={700}> User details: </Text>
                <Space h="xs"/>
                {/* User details table */}
                <Table variant="vertical" withTableBorder>
                    <Table.Tbody>
                        <Table.Tr>
                            <Table.Th>Name</Table.Th>
                            <Table.Td>
                                {user.userName}
                            </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Th>ID</Table.Th>
                            <Table.Td>
                                <IDButton ID={user.userID} position="left" />
                            </Table.Td>
                        </Table.Tr>
                        {isAdmin && (
                            <Table.Tr>
                                <Table.Th>Role</Table.Th>
                                <Table.Td>
                                    {userRole}
                                </Table.Td>
                            </Table.Tr>
                        )}
                        <Table.Tr>
                            <Table.Th>Resources</Table.Th>
                            <Table.Td>
                                <Link to={`/resources/?userID=${user.userID}`}>{user._count.resources}</Link>
                            </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Th>Reservations</Table.Th>
                            <Table.Td>
                                <Link to={`/reservations/?userID=${user.userID}`}>{user._count.reservations}</Link>
                            </Table.Td>
                        </Table.Tr>
                    </Table.Tbody>
                </Table>
                <Space h = "xs"/>
                {/* Delete and change role buttons */}
                {canDelete && (
                    <Group>
                        <Button
                            onClick={openDelete}
                            justify="space-between"
                            rightSection={<IconUserX size={16}/>}
                            variant="filled"
                            color="pink"
                            radius="md"
                        >
                            Delete user
                        </Button>
                        {!userIsAdmin && (
                            <Button
                                onClick={openChangeRole}
                                justify="space-between"
                                rightSection={<IconUserUp size={16}/>}
                                variant="default"
                                radius="md"
                            >
                                Promote to admin
                            </Button>
                        )}
                        {userIsAdmin && (
                            <Button
                                onClick={openChangeRole}
                                justify="space-between"
                                rightSection={<IconUserDown size={16}/>}
                                variant="default"
                                radius="md"
                            >
                                Demote to user
                            </Button>
                        )}
                    </Group>
                )}
                <Space h="md"/>
                <Text fw={700}> User resources: </Text>
                <Text> Displaying up to 100 most reserved resources. For more results or options, use the sidebar search function or links in the table above. </Text>
                <Space h="xs"/>
                <DataTable
                    withTableBorder
                    withColumnBorders
                    striped
                    highlightOnHover
                    totalRecords={user.resources.length}
                    recordsPerPage={10}
                    page = {resourcesPage}
                    onPageChange={(p) => setResourcesPage(p)}
                    sortStatus={resourcesSortStatus}
                    onSortStatusChange={setResourcesSortStatus}
                    paginationActiveBackgroundColor="pink"
                    records={resourcesPaginatedRecords}
                    columns={[
                        {accessor: 'resourceID', title: 'ID', render: (record) =>
                                // @ts-expect-error because Mantine DataTable's type inference breaks after sorting
                                <IDButton ID={record.resourceID} position="left" />
                        },
                        {accessor: 'resourceName', title: 'Name', sortable: true, render: (record) =>
                                // @ts-expect-error because Mantine DataTable's type inference breaks after sorting
                                <Link to={`/resource/${record.resourceID}`}>{record.resourceName}</Link>
                        },
                        {accessor: 'description', title: 'Description', ellipsis: true},
                        {accessor: '_count.reservations', title: 'Reservations', sortable: true, render: (record) =>
                                // @ts-expect-error because Mantine DataTable's type inference breaks after sorting
                                <Link to={`/reservations/?resourceID=${record.resourceID}`}>{record._count.reservations}</Link>
                        }
                    ]}
                />
                <Space h="md"/>
                <Text fw={700}> User reservations: </Text>
                <Text> Displaying up to 100 current or upcoming reservations by start time. For more results or options, use the sidebar search function or links in the details table above. </Text>
                <Space h="xs"/>
                <DataTable
                    withTableBorder
                    withColumnBorders
                    striped
                    highlightOnHover
                    totalRecords={user.reservations.length}
                    recordsPerPage={10}
                    page = {reservationsPage}
                    onPageChange={(p) => setReservationsPage(p)}
                    sortStatus={reservationsSortStatus}
                    onSortStatusChange={setReservationsSortStatus}
                    paginationActiveBackgroundColor="pink"
                    records={reservationsPaginatedRecords}
                    columns={[
                        {accessor: 'reservationID', title: 'ID', render: (record) =>
                                // @ts-expect-error because Mantine DataTable's type inference breaks after sorting
                                <IDButton ID={record.reservationID} position="left" />
                        },
                        {accessor: 'reservationID', title: 'Details', render: (record) =>
                                <Link to={`/reservation/${record.reservationID}`}>{'View'}</Link>
                        },
                        {accessor: 'startTime', title: 'Start time', sortable: true, render: (record) =>
                                // @ts-expect-error because Mantine DataTable's type inference breaks after sorting
                                <>{new Date(record.startTime).toLocaleString()}</>
                        },
                        {accessor: 'endTime', title: 'End time', sortable: true, render: (record) =>
                                // @ts-expect-error because Mantine DataTable's type inference breaks after sorting
                                <>{new Date(record.endTime).toLocaleString()}</>
                        },
                        {accessor: 'reservedResource.resourceID', hidden:true},
                        {accessor: 'reservedResource.resourceName', title: 'Resource', sortable: true, render: (record) =>
                                // @ts-expect-error because Mantine DataTable's type inference breaks after sorting
                                <><Link to={`/resource/${record.reservedResource.resourceID}`}>{record.reservedResource.resourceName}</Link></>
                        }
                    ]}
                />
            </>
        )
    } catch (error) {
        return (
            <ErrorHandler error={error}/>
        )
    }
}