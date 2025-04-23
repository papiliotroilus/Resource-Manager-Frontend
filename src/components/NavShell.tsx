import {
    AppShell,
    Burger,
    Button,
    Divider,
    Grid,
    NativeSelect,
    TextInput,
    Menu,
    Group, ActionIcon, Flex, Modal, Stack, ScrollArea,
    Tooltip, SimpleGrid,
    Tabs, Textarea,
    useMantineColorScheme, Autocomplete
} from '@mantine/core'
import {useField, useForm} from '@mantine/form'
import {useDisclosure} from '@mantine/hooks'
import { Notifications, notifications } from '@mantine/notifications'
import {Link, Outlet, useNavigate} from '@tanstack/react-router'
import useAuthStore from '../hooks/authStore.tsx'
import {keycloak} from '../main.tsx'
import {
    IconBox,
    IconSearch,
    IconPencilPlus,
    IconHome,
    IconLogout,
    IconUser,
    IconCalendarTime,
    IconUsersGroup,
    IconPackages,
    IconEye,
    IconCubePlus,
    IconCalendarPlus,
    IconCalendarUser, IconBulb, IconBulbOff
} from '@tabler/icons-react'
import request from 'superagent'
import {DateTimePicker} from '@mantine/dates'

export function NavShell() {
    const backendURL = import.meta.env.VITE_BACKEND_URL || window.process.env.VITE_BACKEND_URL
    // Hooks
    const [navbarOpen, {toggle}] = useDisclosure()
    const [logoutPopup, {open:openLogout, close:closeLogout}] = useDisclosure(false)
    const { setColorScheme } = useMantineColorScheme()
    const navigate = useNavigate()

    // Logged-in user display
    const {username, id, role} = useAuthStore()
    let roleDisplay = ''
    if (role === 'admin') {
        roleDisplay = '(ADMIN)'
    }
    const title = <p><b>Resource Manager</b></p>
    const welcome = <div>Welcome, <b>{username}</b>! <i>{roleDisplay}</i></div>

    // Resource creation logic
    const [createResourcePopup, {open:openResource, close:closeResource}] = useDisclosure(false)
    const createResource = useForm({
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
    const handleResourceCreation = async (values: { resourceName: string; description: string}) => {
        const createResourceResponse = await request
            .post(`${backendURL}v1/resources/`)
            .set({
                Authorization: `Bearer ${keycloak.token}`
            })
            .send(values)
            .ok(() => true)
        if (createResourceResponse.status === 201) {
            closeResource()
            toggle()
            navigate({to: `/resource/${createResourceResponse.text}`})
        } else {
            notifications.show({
                title: 'Error',
                message: createResourceResponse.text,
            })
        }
    }

    // Resource search logic
    const resourceSearch = useForm({
        mode: 'uncontrolled',
        initialValues: {
            resource: undefined,
            description: undefined,
            user: undefined,
            userID: undefined,
            col: 'resourceName',
            dir: 'asc',
            size: 10,
            page: 1,
        }
    })
    const handleResourceSort = (event: { target: { value: string } }) => {
        const selectedOption = event.target.value
        const deconstructedOption: Record<string, { col: string; dir: string }> = {
            'Name ascending': {col: 'resourceName', dir: 'asc'},
            'Name descending': {col: 'resourceName', dir: 'desc'},
            'Reservations ascending': {col: 'reservationCount', dir: 'asc'},
            'Reservations descending': {col: 'reservationCount', dir: 'desc'}
        }
        resourceSearch.setValues({
            col: deconstructedOption[selectedOption]?.col,
            dir: deconstructedOption[selectedOption]?.dir
        })
    }

    // Resource seek logic
    const resourceGoTo = useField({
        initialValue: ''
    })

    // Reservation creation logic
    const [createReservationPopup, {open:openReservation, close:closeReservation}] = useDisclosure(false)
    const createReservation = useForm({
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
    const handleReservationCreation = async (values: { resourceID: string; startTime: Date; endTime: Date }) => {
        const formattedData = {
            resourceID: values.resourceID,
            startTime: values.startTime.toISOString(),
            endTime: values.endTime.toISOString(),
        }
        const createReservationResponse = await request
            .post(`${backendURL}v1/reservations/`)
            .set({
                Authorization: `Bearer ${keycloak.token}`
            })
            .send(formattedData)
            .ok(() => true)
        if (createReservationResponse.status === 201) {
            closeResource()
            toggle()
            navigate({to: `/reservation/${createReservationResponse.text}`})
        } else {
            notifications.show({
                title: 'Error',
                message: createReservationResponse.text,
            })
        }
    }

    // Reservation search logic
    const reservationSearch = useForm({
        mode: 'uncontrolled',
        initialValues: {
            resource: undefined,
            resourceID: undefined,
            user: undefined,
            userID: undefined,
            startsBefore: undefined,
            startsAfter: undefined,
            endsBefore: undefined,
            endsAfter: undefined,
            col: 'startTime',
            dir: 'asc',
            size: 10,
            page: 1,
        }
    })
    const handleReservationSort = (event: { target: { value: string } }) => {
        const selectedOption = event.target.value
        const deconstructedOption: Record<string, { col: string; dir: string }> = {
            'Start time ascending': {col: 'startTime', dir: 'asc'},
            'Start time descending': {col: 'startTime', dir: 'desc'},
            'End time ascending': {col: 'endTime', dir: 'asc'},
            'End time descending': {col: 'endTime', dir: 'desc'}
        }
        reservationSearch.setValues({
            col: deconstructedOption[selectedOption]?.col,
            dir: deconstructedOption[selectedOption]?.dir
        })
    }

    // Reservation seek logic
    const reservationGoTo = useField({
        initialValue: ''
    })

    // User search logic
    const userSearch = useForm({
        mode: 'uncontrolled',
        initialValues: {
            user: undefined,
            col: 'userName',
            dir: 'asc',
            size: 10,
            page: 1,
        }
    })
    const handleUserSort = (event: { target: { value: string } }) => {
        const selectedOption = event.target.value
        const deconstructedOption: Record<string, { col: string; dir: string }> = {
            'Name ascending': {col: 'userName', dir: 'asc'},
            'Name descending': {col: 'userName', dir: 'desc'},
            'Resource count ascending': {col: 'resourceCount', dir: 'asc'},
            'Resource count descending': {col: 'resourceCount', dir: 'desc'},
            'Reservation count ascending': {col: 'reservationCount', dir: 'asc'},
            'Reservation count descending': {col: 'reservationCount', dir: 'desc'}
        }
        userSearch.setValues({
            col: deconstructedOption[selectedOption]?.col,
            dir: deconstructedOption[selectedOption]?.dir
        })
    }

    // User seek logic
    const userGoTo = useField({
        initialValue: ''
    })

    return (
        <AppShell
            header={{height: 60}}
            navbar={{width: 382, breakpoint: 'sm', collapsed: {mobile: !navbarOpen}}}
            padding="md"
        >
            <AppShell.Header>
                {/* Logout confirmation popup */}
                <Modal
                    opened={logoutPopup}
                    onClose={closeLogout} size="auto"
                    withCloseButton={false}
                    radius="md"
                >
                    <Stack px="md" gap="xs">
                        <div>Are you sure you wish to log out?</div>
                        <Grid justify="center">
                            <Grid.Col span="content">
                                <Button
                                    onClick={() => navigate({to: "/logout"})}
                                    variant="filled"
                                    color="pink"
                                    radius="md"
                                >
                                    Yes
                                </Button>
                            </Grid.Col>
                            <Grid.Col span="content">
                                <Button
                                    onClick={closeLogout}
                                    variant="default"
                                    radius="md"
                                >
                                    No
                                </Button>
                            </Grid.Col>
                        </Grid>
                    </Stack>
                </Modal>
                <Grid>
                    {/* Burger button and title */}
                    <Grid.Col span={{ base: "auto", md: "content" }}>
                        {/* Left title for desktop */}
                        <Flex h="100%" px="md" visibleFrom="sm" align="center">
                            {title}
                        </Flex>
                        {/* Burger button for mobile */}
                        <Flex h="100%" px="md" hiddenFrom="sm" align="center">
                            <Burger opened={navbarOpen} onClick={toggle} size="sm"/>
                        </Flex>
                    </Grid.Col>
                    <Grid.Col span="content" hiddenFrom="sm">
                        {/* Center title for mobile */}
                        <Flex h="100%" px="md" align="center">
                            {title}
                        </Flex>
                    </Grid.Col>
                    {/* Logged-in user section  */}
                    <Grid.Col span="auto">
                        {/* Home, theme, and log out buttons for desktop  */}
                        <Group h="100%" px="md" visibleFrom="md" justify="flex-end" align="center">
                            {welcome}
                            <Button
                                component={Link} to="/"
                                justify="space-between"
                                rightSection={<IconHome size={16}/>}
                                variant="default"
                                radius="md"
                            >
                                Home
                            </Button>
                            <Button
                                lightHidden
                                onClick={() => setColorScheme('light')}
                                justify="space-between"
                                rightSection={
                                    <IconBulb size={16}/>
                                }
                                variant="default"
                                radius="md"
                            >
                                Light mode
                            </Button>
                            <Button
                                darkHidden
                                onClick={() => setColorScheme('dark')}
                                justify="space-between"
                                rightSection={
                                    <IconBulbOff size={16}/>
                                }
                                variant="default"
                                radius="md"
                            >
                                Dark mode
                            </Button>
                            <Button
                                onClick={openLogout}
                                justify="space-between"
                                rightSection={<IconLogout size={16}/>}
                                variant="filled"
                                color="pink"
                                radius="md"
                            >
                                Log out
                            </Button>
                        </Group>
                        {/* User button with dropdown menu for mobile and theme button*/}
                        <Group h="100%" px="md" hiddenFrom="md" justify="flex-end" align="center">
                            <Menu
                                shadow="md"
                                width={120}
                                position="bottom"
                            >
                                <Menu.Target>
                                    <Tooltip label="User menu" withArrow position="left">
                                        <ActionIcon
                                            variant="default"
                                            radius="md"
                                        >
                                            <IconUser/>
                                        </ActionIcon>
                                    </Tooltip>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    <Menu.Label>
                                        {welcome}
                                    </Menu.Label>
                                    <Menu.Item
                                        component={Link} to="/"
                                        leftSection={<IconHome size={16}/>}>
                                        Home
                                    </Menu.Item>
                                    <Menu.Item
                                        onClick={openLogout}
                                        color="pink"
                                        leftSection={<IconLogout size={16}/>}
                                    >
                                        Log out
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                            <Tooltip label="Light mode" withArrow position="top">
                                <ActionIcon
                                    lightHidden
                                    onClick={() => setColorScheme('light')}
                                    variant="default"
                                >
                                    <IconBulb/>
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Dark mode" withArrow position="top">
                                <ActionIcon
                                    darkHidden
                                    onClick={() => setColorScheme('dark')}
                                    variant="default"
                                >
                                    <IconBulbOff/>
                                </ActionIcon>
                            </Tooltip>
                        </Group>
                    </Grid.Col>
                </Grid>
            </AppShell.Header>
            <AppShell.Navbar>
                <AppShell.Section grow>
                    {/* Sidebar tabs  */}
                    <Tabs color="pink" defaultValue="resources">
                        <Tabs.List grow>
                            <Tabs.Tab value="resources" leftSection={<IconBox size={16} />}>
                                Resources
                            </Tabs.Tab>
                            <Tabs.Tab value="reservations" leftSection={<IconCalendarTime size={16} />}>
                                Reservations
                            </Tabs.Tab>
                            <Tabs.Tab value="users" leftSection={<IconUsersGroup size={16} />}>
                                Users
                            </Tabs.Tab>
                        </Tabs.List>
                        {/* Resources tab */}
                        <Tabs.Panel value="resources">
                            <ScrollArea type="auto" style={{ height: 'calc(100vh - 100px)' }} offsetScrollbars>
                                {/* Resource creation form pop-up */}
                                <Modal
                                    opened={createResourcePopup}
                                    onClose={closeResource} size="auto"
                                    title="Create a new resource"
                                    radius="md"
                                >
                                    <form onSubmit={createResource.onSubmit((values) => handleResourceCreation(values))}>
                                        <Stack px="md" gap="xs">
                                            <TextInput
                                                withAsterisk
                                                radius="md"
                                                label="Resource name"
                                                placeholder="Enter name"
                                                key={createResource.key('resourceName')}
                                                {...createResource.getInputProps('resourceName')}
                                            />
                                            <Textarea
                                                autosize
                                                radius="md"
                                                label="Resource description"
                                                placeholder="Enter description"
                                                key={createResource.key('description')}
                                                {...createResource.getInputProps('description')}
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
                                                    Submit resource
                                                </Button>
                                            </Flex>
                                        </Stack>
                                    </form>
                                </Modal>
                                <Stack gap="xs" p='md'>
                                    <SimpleGrid cols={2}>
                                        {/* Create resource button */}
                                        <Button
                                            onClick={openResource}
                                            fullWidth
                                            justify="space-between"
                                            rightSection={<IconCubePlus size={16}/>}
                                            variant="filled"
                                            color="pink"
                                            radius="md"
                                        >
                                            New resource
                                        </Button>
                                        {/* See own resources button */}
                                        <Button
                                            onClick={() => {
                                                toggle();
                                                navigate({
                                                    to: '/resources',
                                                    search: {size: 10, page: 1, userID: id, col: 'resourceName', dir: 'asc'}
                                                })
                                            }}
                                            fullWidth
                                            justify="space-between"
                                            rightSection={<IconPackages size={16}/>}
                                            variant="default"
                                            radius="md"
                                        >
                                            My resources
                                        </Button>
                                    </SimpleGrid>
                                    {/* Go to specific resource section */}
                                    <Divider label="or go to a specific resource" labelPosition="center"/>
                                    <TextInput
                                        {...resourceGoTo.getInputProps()}
                                        radius="md"
                                        description="Seek resource by exact ID"
                                        placeholder="Resource ID"
                                    />
                                    <Flex justify="center">
                                        <Button
                                            onClick={() => {
                                                toggle();
                                                navigate({
                                                    to: "/resource/$resourceID",
                                                    params: {resourceID: resourceGoTo.getValue()},
                                                })
                                            }}
                                            justify="space-between"
                                            rightSection={<IconEye size={16}/>}
                                            variant="filled"
                                            color="pink"
                                            radius="md"
                                        >
                                            View resource
                                        </Button>
                                    </Flex>
                                    {/* Search resources section */}
                                    <Divider label="or browse resources" labelPosition="center"/>
                                    <form onSubmit={resourceSearch.onSubmit((values) => {
                                        toggle();
                                        navigate({
                                            to: '/resources',
                                            search: values
                                        })
                                    })}>
                                        <Stack gap="xs">
                                            <TextInput
                                                radius="md"
                                                description="Filter by resource name"
                                                placeholder="Resource name"
                                                key={resourceSearch.key('resource')}
                                                {...resourceSearch.getInputProps('resource')}
                                            />
                                            <TextInput
                                                radius="md"
                                                description="Filter by description"
                                                placeholder="Description"
                                                key={resourceSearch.key('description')}
                                                {...resourceSearch.getInputProps('description')}
                                            />
                                            <SimpleGrid cols={2} spacing="xs">
                                                <TextInput
                                                    radius="md"
                                                    description="Filter by owner name"
                                                    placeholder="Owner name"
                                                    key={resourceSearch.key('user')}
                                                    {...resourceSearch.getInputProps('user')}
                                                />
                                                <TextInput
                                                    radius="md"
                                                    description="or exact ID"
                                                    placeholder="Owner ID"
                                                    key={resourceSearch.key('userID')}
                                                    {...resourceSearch.getInputProps('userID')}
                                                />
                                            </SimpleGrid>
                                            <NativeSelect
                                                radius="md"
                                                description="Sort by"
                                                data={[
                                                    'Name ascending', 'Name descending',
                                                    'Reservations ascending', 'Reservations descending'
                                                ]}
                                                onChange={handleResourceSort}
                                            />
                                            <Autocomplete
                                                radius="md"
                                                description="Results per page"
                                                placeholder="Select or type number"
                                                data={['10', '20', '50', '100']}
                                                key={resourceSearch.key('size')}
                                                {...resourceSearch.getInputProps('size')}
                                            />
                                            <Flex justify="center">
                                                <Button
                                                    type="submit"
                                                    justify="space-between"
                                                    rightSection={<IconSearch size={16}/>}
                                                    variant="filled"
                                                    color="pink"
                                                    radius="md"
                                                >
                                                    Search resources
                                                </Button>
                                            </Flex>
                                        </Stack>
                                    </form>
                                </Stack>
                            </ScrollArea>
                        </Tabs.Panel>

                        {/* Reservations tab */}
                        <Tabs.Panel value="reservations">
                            <ScrollArea type="auto" style={{ height: 'calc(100vh - 100px)' }} offsetScrollbars>
                                {/* Reservation creation form pop-up */}
                                <Modal
                                    opened={createReservationPopup}
                                    onClose={closeReservation} size="auto"
                                    title="Create a new reservation"
                                    radius="md"
                                >
                                    <form onSubmit={
                                        createReservation.onSubmit((values) => handleReservationCreation(values))
                                    }>
                                        <Stack px="md" gap="xs">
                                            <TextInput
                                                withAsterisk
                                                radius="md"
                                                label="Resource ID"
                                                placeholder="Enter ID of resource to reserve"
                                                key={createReservation.key('resourceID')}
                                                {...createReservation.getInputProps('resourceID')}
                                            />
                                            <DateTimePicker
                                                withAsterisk
                                                radius="md"
                                                label="Reservation start time"
                                                placeholder="Select reservation start time"
                                                key={createReservation.key('startTime')}
                                                {...createReservation.getInputProps('startTime')}
                                            />
                                            <DateTimePicker
                                                withAsterisk
                                                radius="md"
                                                label="Reservation end time"
                                                placeholder="Select reservation end time"
                                                key={createReservation.key('endTime')}
                                                {...createReservation.getInputProps('endTime')}
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
                                <Stack gap="xs" p='md'>
                                    <SimpleGrid cols={2}>
                                        {/* Create reservation button */}
                                        <Button
                                            onClick={openReservation}
                                            fullWidth
                                            justify="space-between"
                                            rightSection={<IconCalendarPlus size={16}/>}
                                            variant="filled"
                                            color="pink"
                                            radius="md"
                                        >
                                            New reservation
                                        </Button>
                                        {/* See own reservations button */}
                                        <Button
                                            onClick={() => {
                                                toggle();
                                                navigate({
                                                    to: '/reservations',
                                                    search: {size: 10, page: 1, userID: id, col: 'startTime', dir: 'asc'}
                                                })
                                            }}
                                            fullWidth
                                            justify="space-between"
                                            rightSection={<IconCalendarUser size={16}/>}
                                            variant="default"
                                            radius="md"
                                        >
                                            My reservations
                                        </Button>
                                    </SimpleGrid>
                                    {/* Go to specific reservation section */}
                                    <Divider label="or go to a specific reservation" labelPosition="center"/>
                                    <TextInput
                                        {...reservationGoTo.getInputProps()}
                                        radius="md"
                                        description="Seek reservation by exact ID"
                                        placeholder="Reservation ID"
                                    />
                                    <Flex justify="center">
                                        <Button
                                            onClick={() => {
                                                toggle();
                                                navigate({
                                                    to: "/reservation/$reservationID",
                                                    params: {reservationID: reservationGoTo.getValue()},
                                                })
                                            }}
                                            justify="space-between"
                                            rightSection={<IconEye size={16}/>}
                                            variant="filled"
                                            color="pink"
                                            radius="md"
                                        >
                                            View reservation
                                        </Button>
                                    </Flex>
                                    {/* Search reservations section */}
                                    <Divider label="or browse reservations" labelPosition="center"/>
                                    <form onSubmit={reservationSearch.onSubmit((values) => {
                                        toggle();
                                        navigate({
                                            to: '/reservations',
                                            search: values
                                        })
                                    })}>
                                        <Stack gap='xs'>
                                            <SimpleGrid cols={2} spacing="xs">
                                                <TextInput
                                                    radius="md"
                                                    description="Filter by resource name"
                                                    placeholder="Resource name"
                                                    key={reservationSearch.key('resource')}
                                                    {...reservationSearch.getInputProps('resource')}
                                                />
                                                <TextInput
                                                    radius="md"
                                                    description="or exact ID"
                                                    placeholder="Resource ID"
                                                    key={reservationSearch.key('resourceID')}
                                                    {...reservationSearch.getInputProps('resourceID')}
                                                />
                                            </SimpleGrid>
                                            <SimpleGrid cols={2} spacing="xs">
                                                <TextInput
                                                    radius="md"
                                                    description="Filter by reservee name"
                                                    placeholder="Reservee name"
                                                    key={reservationSearch.key('user')}
                                                    {...reservationSearch.getInputProps('user')}
                                                />
                                                <TextInput
                                                    radius="md"
                                                    description="or exact ID"
                                                    placeholder="Reservee ID"
                                                    key={reservationSearch.key('userID')}
                                                    {...reservationSearch.getInputProps('userID')}
                                                />
                                            </SimpleGrid>
                                            <SimpleGrid cols={2} spacing="xs">
                                                <DateTimePicker
                                                    clearable
                                                    radius="md"
                                                    description="Filter by start time before"
                                                    placeholder="Start before"
                                                    key={reservationSearch.key('startsBefore')}
                                                    {...reservationSearch.getInputProps('startsBefore')}
                                                />
                                                <DateTimePicker
                                                    clearable
                                                    radius="md"
                                                    description="or after"
                                                    placeholder="Start after"
                                                    key={reservationSearch.key('startsAfter')}
                                                    {...reservationSearch.getInputProps('startsAfter')}
                                                />
                                            </SimpleGrid>
                                            <SimpleGrid cols={2} spacing="xs">
                                                <DateTimePicker
                                                    clearable
                                                    radius="md"
                                                    description="Filter by end time before"
                                                    placeholder="End before"
                                                    key={reservationSearch.key('endsBefore')}
                                                    {...reservationSearch.getInputProps('endsBefore')}
                                                />
                                                <DateTimePicker
                                                    clearable
                                                    radius="md"
                                                    description="or after"
                                                    placeholder="End after"
                                                    key={reservationSearch.key('endsAfter')}
                                                    {...reservationSearch.getInputProps('endsAfter')}
                                                />
                                            </SimpleGrid>
                                            <NativeSelect
                                                radius="md"
                                                description="Sort by"
                                                data={[
                                                    'Start time ascending', 'Start time descending',
                                                    'End time ascending', 'End time descending'
                                                ]}
                                                onChange={handleReservationSort}
                                            />
                                            <Autocomplete
                                                radius="md"
                                                description="Results per page"
                                                placeholder="Select or type number"
                                                data={['10', '20', '50', '100']}
                                                key={reservationSearch.key('size')}
                                                {...reservationSearch.getInputProps('size')}
                                            />
                                            <Flex justify="center">
                                                <Button
                                                    type="submit"
                                                    justify="space-between"
                                                    rightSection={<IconSearch size={16}/>}
                                                    variant="filled"
                                                    color="pink"
                                                    radius="md"
                                                >
                                                    Search reservations
                                                </Button>
                                            </Flex>
                                        </Stack>
                                    </form>
                                </Stack>
                            </ScrollArea>
                        </Tabs.Panel>

                        {/* Users tab */}
                        <Tabs.Panel value="users">
                            <ScrollArea type="auto" style={{ height: 'calc(100vh - 100px)' }} offsetScrollbars>
                                <Stack gap="xs" p='md'>
                                    {/* Go to specific user section */}
                                    <TextInput
                                        {...userGoTo.getInputProps()}
                                        radius="md"
                                        description="Seek user by exact ID"
                                        placeholder="User ID"
                                    />
                                    <Flex justify="center">
                                        <Button
                                            onClick={() => {
                                                toggle();
                                                navigate({
                                                    to: "/user/$userID",
                                                    params: {userID: userGoTo.getValue()},
                                                })
                                            }}
                                            justify="space-between"
                                            rightSection={<IconEye size={16}/>}
                                            variant="filled"
                                            color="pink"
                                            radius="md"
                                        >
                                            View user
                                        </Button>
                                    </Flex>
                                    {/* Search users section */}
                                    <Divider label="or browse users" labelPosition="center"/>
                                    <form onSubmit={userSearch.onSubmit((values) => {
                                        toggle();
                                        navigate({
                                            to: '/users',
                                            search: values
                                        })
                                    })}>
                                        <Stack gap="xs">
                                            <TextInput
                                                radius="md"
                                                description="Filter by user name"
                                                placeholder="User name"
                                                key={userSearch.key('user')}
                                                {...userSearch.getInputProps('user')}
                                            />
                                            <NativeSelect
                                                radius="md"
                                                description="Sort by"
                                                data={[
                                                    'Name ascending', 'Name descending',
                                                    'Resource count ascending', 'Resource count descending',
                                                    'Reservation count ascending', 'Reservation count descending'
                                                ]}
                                                onChange={handleUserSort}
                                            />
                                            <Autocomplete
                                                radius="md"
                                                description="Results per page"
                                                placeholder="Select or type number"
                                                data={['10', '20', '50', '100']}
                                                key={userSearch.key('size')}
                                                {...userSearch.getInputProps('size')}
                                            />
                                            <Flex justify="center">
                                                <Button
                                                    type="submit"
                                                    justify="space-between"
                                                    rightSection={<IconSearch size={16}/>}
                                                    variant="filled"
                                                    color="pink"
                                                    radius="md"
                                                >
                                                    Search users
                                                </Button>
                                            </Flex>
                                        </Stack>
                                    </form>
                                </Stack>
                            </ScrollArea>
                        </Tabs.Panel>
                    </Tabs>
                </AppShell.Section>
            </AppShell.Navbar>
            <AppShell.Main>
                {/* Main body where child routes and notifications are rendered*/}
                <Outlet/>
                <Notifications/>
            </AppShell.Main>
        </AppShell>
    )
}