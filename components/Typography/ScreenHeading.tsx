import { Heading } from '@gluestack-ui/themed'
import React from 'react'

export default function ScreenHeading(props) {
    const { children } = props;
    return <Heading {...props}>{children}</Heading>
}