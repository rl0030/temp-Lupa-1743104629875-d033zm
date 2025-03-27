import { PlaceResult } from "../pages/Settings/UpdateHomeGym";
import { LupaStudioInterface, LupaStudioLocation } from "../types/studio";
import uuid from 'react-native-uuid';

export const convertPlacesResultToLupaStudioInterface = (place: PlaceResult) => {
    return {
        name: place.name,
        description: place.business_status,
        id: place.place_id,
        uid: uuid.v4(),
        trainers: [],
        hours_of_operation: [],
        owner_lupa_uid: "",
        pricing: {
            leasing_fee: 0
        },
        formatted_address: place.formatted_address,
        geometry: {
            ...place.geometry
        },
        photos_formatted: place.photos,
        photos: []
    } as unknown as LupaStudioInterface
}

export const getLupaStudioLocationFromPlaceResult = (place: PlaceResult) => {
    return {
        name: place.name,
        formatted_address: place.formatted_address,
        photos: place.photos,
        geometry: {
            location: {
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng
            }
        }
    } as unknown as LupaStudioLocation
}