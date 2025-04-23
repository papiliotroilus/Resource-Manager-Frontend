import {createFileRoute, Link, useNavigate} from '@tanstack/react-router'
import {keycloak} from "../main.tsx";
import request from 'superagent'
import LoaderHandler from '../components/LoaderHandler.tsx';
import useAuthStore from '../hooks/authStore.tsx';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import {Button, Grid, Group, Modal, Space, Stack, Table, Text} from '@mantine/core'
import IDButton from '../components/IDButton.tsx';
import {DateTimePicker} from '@mantine/dates'
import {IconPencil, IconPencilCheck, IconPencilX, IconTrash } from '@tabler/icons-react';
import ErrorHandler from '../components/ErrorHandler.tsx'

export const Route = createFileRoute('/reservation/$reservationID')({
    beforeLoad: async() => {await keycloak.updateToken()},
    loader: ({ params }) => fetchData(params.reservationID),
    component: ShowReservation,
})

const fetchData = async (reservationID:string) => {
    const backendURL = import.meta.env.VITE_BACKEND_URL || window.process.env.VITE_BACKEND_URL
    const response = await request
        .get(`${backendURL}v1/reservations/${reservationID}`)
        .set({
            Authorization: `Bearer ${keycloak.token}`
        })
        .ok(() => true)
    return {response}
}

function ShowReservation() {
    const backendURL = import.meta.env.VITE_BACKEND_URL || window.process.env.VITE_BACKEND_URL
    // Hooks
    const loaderData = Route.useLoaderData()
    const {username, role} = useAuthStore()
    const navigate = useNavigate()
    const [deletePopup, {open:openDelete, close:closeDelete}] = useDisclosure(false)
    const [editToggle, {open:editOn, close:editOff}] = useDisclosure(false)
    const editReservation = useForm({
        mode: 'uncontrolled',
        initialValues: {
            resourceID: '',
            startTime: new Date(),
            endTime: new Date()
        },
        validate: {
            resourceID: (value) => (value.length < 1 ? "ID of resource to reserve is required" : null),
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

    // Load error handling
    const loaderError = LoaderHandler(loaderData)
    if (loaderError) {return (
        <ErrorHandler error={loaderError}/>
    )}
    const reservation = loaderData.response.body

    // Set initial values for form
    editReservation.setInitialValues({
        resourceID: reservation.reservedResource.resourceID,
        startTime: new Date(reservation.startTime),
        endTime: new Date(reservation.endTime)
    })

    // Logic for determining edit and delete privileges
    const isOwner = (username === reservation.reservee.userName) || (role === 'admin')

    // Logic for deleting reservation
    const handleDelete = async () => {
        const deleteResponse = await request
            .delete(`${backendURL}v1/reservations/${reservation.reservationID}`)
            .set({
                Authorization: `Bearer ${keycloak.token}`
            })
            .ok(() => true)
        if (deleteResponse.status === 200) {
            navigate({to: "/reservations"})
        } else {
            notifications.show({
                title: 'Error',
                message: deleteResponse.text,
            })
        }
    }

    // Logic for editing reservation
    const handleEdit = async (values: { resourceID: string; startTime: Date; endTime: Date }) => {
        const formattedData = {
            resourceID: values.resourceID,
            startTime: values.startTime.toISOString(),
            endTime: values.endTime.toISOString(),
        }
        const editResponse = await request
            .patch(`${backendURL}v1/reservations/${reservation.reservationID}`)
            .set({
                Authorization: `Bearer ${keycloak.token}`
            })
            .send(formattedData)
            .ok(() => true)
        if (editResponse.status === 200) {
            editOff()
            navigate({to: `/reservation/${editResponse.text}`})
        } else {
            notifications.show({
                title: 'Error',
                message: editResponse.text,
            })
        }
    }

    try {
        return (
            <>
                {/* Delete reservation confirmation pop-up */}
                <Modal
                    opened={deletePopup}
                    onClose={closeDelete} size="auto"
                    withCloseButton={false}
                    radius="md"
                >
                    <Stack px="md">
                        <div>Are you sure you wish to delete this reservation?</div>
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
                <Text fw={700}> Reservation details: </Text>
                <Space h="xs"/>
                {/* Edit form integrated in reservation details table */}
                <form onSubmit={editReservation.onSubmit((values) => handleEdit(values))}>
                    <Table variant="vertical" withTableBorder>
                        <Table.Tbody>
                            <Table.Tr>
                                <Table.Th>ID</Table.Th>
                                <Table.Td>
                                    <IDButton ID={reservation.reservationID} position="left" />
                                </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Th>Resource</Table.Th>
                                <Table.Td>
                                    <Link to={`/resource/${reservation.reservedResource.resourceID}`}>
                                        {reservation.reservedResource.resourceName}
                                    </Link>
                                </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Th>Reservee</Table.Th>
                                <Table.Td>
                                    <Link to={`/user/${reservation.reservee.userID}`}>{reservation.reservee.userName}</Link>
                                </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Th>Start time</Table.Th>
                                <Table.Td>
                                    {!editToggle && (
                                        <>{new Date(reservation.startTime).toLocaleString()}</>
                                    )}
                                    {editToggle && (
                                        <DateTimePicker
                                            radius="md"
                                            placeholder="Select reservation start time"
                                            key={editReservation.key('startTime')}
                                            {...editReservation.getInputProps('startTime')}
                                        />
                                    )}
                                </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Th>End time</Table.Th>
                                <Table.Td>
                                    {!editToggle && (
                                        <>{new Date(reservation.endTime).toLocaleString()}</>
                                    )}
                                    {editToggle && (
                                        <DateTimePicker
                                            radius="md"
                                            placeholder="Select reservation end time"
                                            key={editReservation.key('endTime')}
                                            {...editReservation.getInputProps('endTime')}
                                        />
                                    )}
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
                                Delete reservation
                            </Button>
                            {!editToggle && (
                                <Button
                                    onClick={() => {
                                        editOn()
                                        editReservation.reset()
                                    }}
                                    justify="space-between"
                                    rightSection={<IconPencil size={16}/>}
                                    variant="default"
                                    radius="md"
                                >
                                    Edit reservation
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
            </>
        )
    } catch (error) {
        return (
            <ErrorHandler error={error}/>
        )
    }
}