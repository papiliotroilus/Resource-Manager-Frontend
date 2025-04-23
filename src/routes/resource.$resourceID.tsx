import {createFileRoute, Link, useNavigate} from '@tanstack/react-router'
import {keycloak} from "../main.tsx";
import request from 'superagent'
import ErrorHandler from '../components/ErrorHandler.tsx'
import LoaderHandler from '../components/LoaderHandler.tsx'
import {Text, Table, Space, Stack, Grid, Button, Modal, Group, TextInput, Textarea, Flex} from '@mantine/core'
import IDButton from '../components/IDButton.tsx'
import {DataTable, DataTableSortStatus} from 'mantine-datatable'
import {useState} from 'react'
import {useDisclosure} from '@mantine/hooks'
import {
    IconCalendarPlus,
    IconPencil,
    IconPencilCheck,
    IconPencilPlus,
    IconPencilX,
    IconTrash
} from '@tabler/icons-react'
import {notifications} from '@mantine/notifications'
import useAuthStore from '../hooks/authStore.tsx'
import {useForm} from '@mantine/form'
import {DateTimePicker} from '@mantine/dates'

export const Route = createFileRoute('/resource/$resourceID')({
    beforeLoad: async() => {await keycloak.updateToken()},
    loader: ({ params }) => fetchData(params.resourceID),
    component: ShowResource,
})

const fetchData = async (resourceID:string) => {
    const backendURL = import.meta.env.VITE_BACKEND_URL || window.process.env.VITE_BACKEND_URL
    const requestURL = `${backendURL}v1/resources/${resourceID}`
    const response = await request
        .get(requestURL)
        .set({
            Authorization: `Bearer ${keycloak.token}`
        })
        .ok(() => true)
    return {response}
}

function ShowResource() {
    const backendURL = import.meta.env.VITE_BACKEND_URL || window.process.env.VITE_BACKEND_URL
    // Hooks
    const loaderData = Route.useLoaderData()
    const [page, setPage] = useState(1)
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: "startTime",
        direction: "asc",
    })
    const {username, role} = useAuthStore()
    const [editToggle, {open:editOn, close:editOff}] = useDisclosure(false)
    const editResource = useForm({
        mode: 'uncontrolled',
        initialValues: {
            resourceName: '',
            description: '',
        },
        validate: {
            resourceName: (value) => ((value.length < 1 || value.length > 30) ? "Name must between 1 and 30 characters long" : null),
            description: (value) => (value.length > 280 ? "Description cannot exceed 280 characters" : null),
        }
    })
    const reserveResource = useForm({
        mode: 'uncontrolled',
        initialValues: {
            resourceID: '',
            startTime: new Date(),
            endTime: new Date()
        },
        validate: {
            startTime: (value, values) => {
                if (!value) return 'Start time is required'
                if (values.endTime && value >= values.endTime) return 'Start time must be before end time'
                return null
            },
            endTime: (value, values) => {
                if (!value) return 'End time is required'
                if (values.startTime && value <= values.startTime) return 'End time must be after start time'
                return null
            }
        }
    })
    const navigate = useNavigate()
    const [deletePopup, {open:openDelete, close:closeDelete}] = useDisclosure(false)
    const [reserveResourcePopup, {open:openReserve, close:closeReserve}] = useDisclosure(false)

    // Load error handling
    const loaderError = LoaderHandler(loaderData)
    if (loaderError) {return (
        <ErrorHandler error={loaderError}/>
    )}
    const resource = loaderData.response.body

    // Set initial values for form
    editResource.setInitialValues({
        resourceName: resource.resourceName,
        description: resource.description,
    })

    // Reservations table clientside sorting and pagination logic
    const sortedRecords = [...resource.reservations].sort((a, b) => {
        const { columnAccessor, direction } = sortStatus
        const multiplier = direction === "asc" ? 1 : -1
        return (a[columnAccessor] > b[columnAccessor] ? 1 : -1) * multiplier
    })
    const from = (page - 1) * 10
    const to = from + 10
    const paginatedRecords = sortedRecords.slice(from, to)

    // Edit and delete privilege determining logic
    const isOwner = (username === resource.owner.userName) || (role === 'admin')

    // Resource deletion logic
    const handleDelete = async () => {
        const deleteResponse = await request
            .delete(`${backendURL}v1/resources/${resource.resourceID}`)
            .set({
                Authorization: `Bearer ${keycloak.token}`
            })
            .ok(() => true)
        if (deleteResponse.status === 200) {
            navigate({to: "/resources"})
        } else {
            notifications.show({
                title: 'Error',
                message: deleteResponse.text,
            })
        }
    }

    // Resource editing logic
    const handleEdit = async (values: { description: string; resourceName: string }) => {
        const editResponse = await request
            .patch(`${backendURL}v1/resources/${resource.resourceID}`)
            .set({
                Authorization: `Bearer ${keycloak.token}`
            })
            .send(values)
            .ok(() => true)
        if (editResponse.status === 200) {
            editOff()
            navigate({to: `/resource/${editResponse.text}`})
        } else {
            notifications.show({
                title: 'Error',
                message: editResponse.text,
            })
        }
    }

    // Resource reservation logic
    const handleResourceReservation = async (values: { resourceID: string; startTime: Date; endTime: Date }) => {
        const formattedData = {
            resourceID: resource.resourceID,
            startTime: values.startTime.toISOString(),
            endTime: values.endTime.toISOString(),
        }
        const reserveResponse = await request
            .post(`${backendURL}v1/reservations/`)
            .set({
                Authorization: `Bearer ${keycloak.token}`
            })
            .send(formattedData)
            .ok(() => true)
        if (reserveResponse.status === 201) {
            closeReserve()
            navigate({to: `/reservation/${reserveResponse.text}`})
        } else {
            notifications.show({
                title: 'Error',
                message: reserveResponse.text,
            })
        }
    }
    try {
        return (
            <>
                {/* Delete resource confirmation pop-up */}
                <Modal
                    opened={deletePopup}
                    onClose={closeDelete} size="auto"
                    withCloseButton={false}
                    radius="md"
                >
                    <Stack px="md">
                        <div>Are you sure you wish to delete <b>{resource.resourceName}</b> along with all of its reservations?</div>
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
                <Text fw={700}> Resource details: </Text>
                <Space h="xs"/>
                {/* Edit form integrated in resource details table */}
                <form onSubmit={editResource.onSubmit((values) => handleEdit(values))}>
                    <Table variant="vertical" withTableBorder>
                        <Table.Tbody>
                            <Table.Tr>
                                <Table.Th>Name</Table.Th>
                                <Table.Td>
                                    {!editToggle && (
                                        resource.resourceName
                                    )}
                                    {editToggle && (
                                        <TextInput
                                            radius="md"
                                            placeholder="Resource name"
                                            key={editResource.key('resourceName')}
                                            {...editResource.getInputProps('resourceName')}
                                        />
                                    )}
                                </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Th>ID</Table.Th>
                                <Table.Td>
                                    <IDButton ID={resource.resourceID} position="left" />
                                </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Th>Description</Table.Th>
                                <Table.Td>
                                    {!editToggle && (
                                        resource.description
                                    )}
                                    {editToggle && (
                                        <Textarea
                                            withAsterisk
                                            autosize
                                            radius="md"
                                            placeholder="Resource description"
                                            key={editResource.key('description')}
                                            {...editResource.getInputProps('description')}
                                        />
                                    )}
                                </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Th>Owner</Table.Th>
                                <Table.Td>
                                    <Link to={`/user/${resource.owner.userID}`}>{resource.owner.userName}</Link>
                                </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Th>Reservations</Table.Th>
                                <Table.Td>
                                    <Link to={`/reservations/?resourceID=${resource.resourceID}`}>{resource._count.reservations}</Link>
                                </Table.Td>
                            </Table.Tr>
                        </Table.Tbody>
                    </Table>
                    <Space h = "xs"/>
                    {/* Delete and edit buttons */}
                    {isOwner && (
                        <Group>
                            <Button
                                onClick={openDelete}
                                justify="space-between"
                                rightSection={<IconTrash size={16}/>}
                                variant="filled"
                                color="pink"
                                radius="md"
                            >
                                Delete resource
                            </Button>
                            {!editToggle && (
                                <Button
                                    onClick={() => {
                                        editOn()
                                        editResource.reset()
                                    }}
                                    justify="space-between"
                                    rightSection={<IconPencil size={16}/>}
                                    variant="default"
                                    radius="md"
                                >
                                    Edit resource
                                </Button>
                            )}
                            {editToggle && (
                                <Group>
                                    <Button
                                        onClick={editOff}
                                        justify="space-between"
                                        rightSection={<IconPencilX size={16}/>}
                                        variant="default"
                                        radius="md"
                                    >
                                        Cancel edit
                                    </Button>
                                    <Button
                                        type="submit"
                                        justify="space-between"
                                        rightSection={<IconPencilCheck size={16}/>}
                                        variant="filled"
                                        color="pink"
                                        radius="md"
                                    >
                                        Save edit
                                    </Button>
                                </Group>
                            )}
                        </Group>
                    )}
                </form>
                <Space h="md"/>
                <Text fw={700}> Resource reservations: </Text>
                <Text> Displaying up to 100 current or upcoming reservations by start time. For more results or options, use the sidebar search function or links in the table above. </Text>
                <Space h="xs"/>
                <DataTable
                    withTableBorder
                    withColumnBorders
                    striped
                    highlightOnHover
                    totalRecords={resource.reservations.length}
                    recordsPerPage={10}
                    page = {page}
                    onPageChange={(p) => setPage(p)}
                    sortStatus={sortStatus}
                    onSortStatusChange={setSortStatus}
                    paginationActiveBackgroundColor="pink"
                    records={paginatedRecords}
                    columns={[
                        {accessor: 'reservationID', title: 'ID', sortable: true, render: (record) =>
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
                        {accessor: 'reservee.userID', hidden:true},
                        {accessor: 'reservee.userName', title: 'Reservee', sortable: true, render: (record) =>
                                // @ts-expect-error because Mantine DataTable's type inference breaks after sorting
                                <><Link to={`/user/${record.reservee.userID}`}>{record.reservee.userName}</Link></>
                        }
                    ]}
                />
                <Space h="xs"/>
                {/* Resource reservation form pop-up */}
                <Modal
                    opened={reserveResourcePopup}
                    onClose={closeReserve} size="auto"
                    title="Create a reservation for this resource"
                    radius="md"
                >
                    <form onSubmit={reserveResource.onSubmit((values) => handleResourceReservation(values))}>
                        <Stack px="md" gap="xs">
                            <DateTimePicker
                                withAsterisk
                                radius="md"
                                label="Reservation start time"
                                placeholder="Select reservation start time"
                                key={reserveResource.key('startTime')}
                                {...reserveResource.getInputProps('startTime')}
                            />
                            <DateTimePicker
                                withAsterisk
                                radius="md"
                                label="Reservation end time"
                                placeholder="Select reservation end time"
                                key={reserveResource.key('endTime')}
                                {...reserveResource.getInputProps('endTime')}
                            />
                            <Flex justify="center">
                                <Button
                                    type="submit"
                                    justify="space-between"
                                    rightSection={<IconPencilPlus size={16}/>}
                                    variant="filled"
                                    color="pink"
                                    radius="md"
                                >
                                    Submit reservation
                                </Button>
                            </Flex>
                        </Stack>
                    </form>
                </Modal>
                {/* Reserve resource */}
                <Button
                    onClick={openReserve}
                    justify="space-between"
                    rightSection={<IconCalendarPlus size={16}/>}
                    variant="filled"
                    color="pink"
                    radius="md"
                >
                    Reserve resource
                </Button>
            </>
        )
    } catch (error) {
        return (
            <ErrorHandler error={error}/>
        )
    }
}