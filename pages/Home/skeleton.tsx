import React from 'react'
import {Skeleton} from '@rneui/themed';
import { screenWidth } from '../../constant/size';

export const CityNameSkeleton = () => (
    <Skeleton
      animation="wave"
      width={150}
      height={30}
      style={{
        borderRadius: 4,
        marginBottom: 10,
      }}
    />
  );
  

export const MapSkeleton = () => (
    <Skeleton
      animation="wave"
      width={screenWidth - 40}
      height={230}
      style={{
        alignSelf: 'center',
        borderRadius: 20,
        marginVertical: 15,
      }}
    />
  );
  