import {ActionIcon, CopyButton, Text, FloatingPosition, Group, Tooltip} from '@mantine/core'
import { IconCopy, IconCheck } from '@tabler/icons-react'

function IDButton({ID, position}: {ID:string, position:FloatingPosition}) {
    return (
        <Group gap="xs">
            <CopyButton value={ID}>
                {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position={position}>
                        <ActionIcon
                            variant={copied ? 'filled' : 'default'}
                            color='pink'
                            onClick={copy}
                        >
                            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                        </ActionIcon>
                    </Tooltip>
                )}
            </CopyButton>
            <Text visibleFrom='xl'>
                {ID}
            </Text>
        </Group>
    )
}

export default IDButton