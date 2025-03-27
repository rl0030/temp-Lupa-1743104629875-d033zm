import {isPast, isSameDay} from 'date-fns';
import {doc, getDoc} from 'firebase/firestore';
import {useEffect, useState} from 'react';
import {db} from '../../../services/firebase';
import {useQuery} from '@tanstack/react-query';

export const isSessionToday = session => {
  const sessionDate = new Date(session?.start_time);
  const currentDate = new Date();
  return isSameDay(sessionDate, currentDate);
};

export const hasSessionPassed = session => {
  const sessionEndTime = new Date(session?.end_time);
  return isPast(sessionEndTime);
};

const getPurchasedPackage = async (packageId: string) => {
  try {
    const packageRef = doc(db, 'purchased_packages', packageId);
    const packageSnap = await getDoc(packageRef);

    if (packageSnap.exists()) {
      return packageSnap.data();
    } else {
      console.log('No such package!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching purchased package:', error);
    return null;
  }
};

export const usePackageInfo = packageId => {
  return useQuery({
    queryKey: ['use_package_info', packageId],
    queryFn: () => getPurchasedPackage(packageId),
    enabled: !!packageId,
  });
};
