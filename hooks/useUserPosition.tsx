import { useQuery } from '@tanstack/react-query'
import React from 'react'
import getLocation from '../util/location'

export default function useUserPosition() {
    return useQuery({
        queryKey: ['get_coords'],
        queryFn: getLocation,
        enabled: false
    })
}