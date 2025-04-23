import {useLocation, useNavigate} from "@tanstack/react-router"
import {Button, Group, TextInput} from "@mantine/core"
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react"
import {useForm} from "@mantine/form"

function PageNavigator({lastPage, queries}: {lastPage:number, queries: { page: string }}) {
    const currentLocation = useLocation().pathname
    const currentPage = Number(queries.page)
    const navigate = useNavigate()

    function FirstButton() {
        if (currentPage > 1) {
            return (
                <Button
                    onClick={() =>
                        navigate({
                            to: currentLocation,
                            search: (queries: object) => ({ ...queries, page: 1 }),
                        })
                    }
                    variant="default"
                    radius="md"
                    leftSection={<IconChevronsLeft size={16}/>}
                >
                    1
                </Button>
            )
        } else {
            return (
                <Button
                    disabled
                    variant="default"
                    radius="md"
                    leftSection={<IconChevronsLeft size={16}/>}
                >
                </Button>
            )
        }
    }

    function BackButton() {
        if (currentPage > 1) {
            return (
                <Button
                    onClick={() =>
                        navigate({
                            to: currentLocation,
                            search: (queries: object) => ({ ...queries, page: currentPage - 1 }),
                        })
                    }
                    variant="default"
                    radius="md"
                    leftSection={<IconChevronLeft size={16}/>}
                >
                    {currentPage - 1}
                </Button>
            )
        } else {
            return (
                <Button
                    disabled
                    variant="default"
                    radius="md"
                    leftSection={<IconChevronLeft size={16}/>}
                >
                </Button>
            )
        }
    }

    function NextButton() {
        if (currentPage < lastPage) {
            return (
                <Button
                    onClick={() =>
                        navigate({
                            to: currentLocation,
                            search: (queries: object) => ({ ...queries, page: currentPage + 1 }),
                        })
                    }
                    variant="default"
                    radius="md"
                    rightSection={<IconChevronRight size={16}/>}
                >
                    {currentPage + 1}
                </Button>
            )
        } else {
            return (
                <Button
                    disabled
                    variant="default"
                    radius="md"
                    rightSection={<IconChevronRight size={16}/>}
                >
                </Button>
            )
        }
    }

    function LastButton() {
        if (currentPage < lastPage) {
            return (
                <Button
                    onClick={() =>
                        navigate({
                            to: currentLocation,
                            search: (queries: object) => ({ ...queries, page: lastPage }),
                        })
                    }
                    variant="default"
                    radius="md"
                    rightSection={<IconChevronsRight size={16}/>}
                >
                    {lastPage}
                </Button>
            )
        } else {
            return (
                <Button
                    disabled
                    variant="default"
                    radius="md"
                    rightSection={<IconChevronsRight size={16}/>}
                >
                </Button>
            )
        }
    }

    function PageSelector() {
        const pageForm = useForm({
            mode: 'uncontrolled',
            initialValues: { page: currentPage },
            validate: {
                page: (value) => (value < 1 || value > lastPage ? "Page invalid" : null),
            },
        });
        return (
            <form onSubmit={pageForm.onSubmit((values) => navigate({
                to: currentLocation,
                search: (queries: object) => ({ ...queries, page: values.page }),
            }))}>
                <TextInput
                    w={60}
                    placeholder={String(currentPage)}
                    key={pageForm.key('page')}
                    {...pageForm.getInputProps('page')}
                />
            </form>
        )
    }

    return (
        <Group>
            <FirstButton/>
            <BackButton/>
            <PageSelector/>
            <NextButton/>
            <LastButton/>
        </Group>
    )
}

export default PageNavigator