import { doc, updateDoc } from 'firebase/firestore';
import React, { useState, useContext, useEffect, createContext, useMemo, useCallback } from 'react';
import { auth, db } from '../services/firebase';
import { Exercise, Program, SessionItem } from '../types/program';
import { getProgram, saveOrUpdateProgram } from '../api/program/program';
import { ProgramWithTrainerDetails } from '../api/program/types';
import { produce, WritableDraft } from 'immer';
import { LupaUser } from '../types/user';
import uuid from 'react-native-uuid'
import { UID } from '../types/common';

export const changeProgramMetadata = async (
  programId: string,
  metadata: any
): Promise<void> => {
  try {
    const programRef = doc(db, 'programs', programId);
    const updateData = Object.entries(metadata).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[`metadata.${key}`] = value;
      }
      return acc;
    }, {} as { [key: string]: any });

    if (Object.keys(updateData).length > 0) {
      await updateDoc(programRef, updateData);
      console.log(`Program ${programId} metadata updated successfully.`);
    } else {
      console.log('No valid fields to update.');
    }
  } catch (error) {
    console.error('Error updating program metadata:', error);
    throw error;
  }
};

const ProgramContext = createContext<any>();

export const ProgramProvider = ({ children }) => {
  const [program, setProgram] = useState<Program>({
    version: 0,
    id: '',
    uid: '',
    weeks: [
      {
        sessions: [
          { items: [] },
          { items: [] },
          { items: [] }
        ]
      }
    ],
    metadata: {
      is_published: false,
      name: '',
      description: '',
      owner: auth?.currentUser?.uid as string,
      categories: [],
      media: ''
    },
    sessionMetadata: {
      averageWorkoutDuration: null
    },
    pricing: {
      value: 0
    }
  });

  const [trainerDetails, setTrainerDetails] = useState<Pick<LupaUser, 'name' | 'uid' | 'picture'>>({
    name: '',
    uid: '',
    picture: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateProgram = (updater: (draft: WritableDraft<Program>) => void | WritableDraft<Program> | undefined) => {
    setProgram(produce(updater));
  }

  const loadProgram = useCallback(async (programId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const programDetails: ProgramWithTrainerDetails = await getProgram(programId, true) as ProgramWithTrainerDetails;
      const { program: fetchedProgram, trainer } = programDetails;
  
      setProgram(fetchedProgram);

      setTrainerDetails(trainer);
    } catch (err) {
      setError(err?.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveProgram = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {

      const result = await saveOrUpdateProgram(program);
      return result;
    } catch (err) {
      setError("Unable to save or update program. Try again in a few minutes.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [program]);

  const value = useMemo(() => ({
    program,
    trainerDetails,
    updateProgram,
    loadProgram,
    saveProgram,
    isLoading,
    error
  }), [program, trainerDetails, isLoading, error]);

  return (
    <ProgramContext.Provider value={value}>
      {children}
    </ProgramContext.Provider>
  );
};

export const useProgram = () => {
  const context = useContext(ProgramContext);
  if (context === undefined) {
    throw new Error('useProgram must be used within a ProgramProvider');
  }
  return context;
};

export const useProgramOperations = () => {
  const { program, loadProgram, updateProgram, saveProgram, isLoading, error, programTrainerData } = useProgram();

  const updateExercise = useCallback((weekIndex: number, sessionIndex: number, exerciseId: UID, updates: any) => {
    updateProgram((draft: Program) => {
      const exercise = draft.weeks[weekIndex].sessions[sessionIndex].items.find(
        item => item.type === 'exercise' && item.data?.unique_uid === exerciseId
      );
      if (exercise) {
        Object.assign(exercise.data, updates);
      }
    });
  }, [updateProgram]);

  const addExercise = (weekIndex: number, sessionIndex: number, newExercise: Exercise | { base64: string; uri: string; downloadUrl: string; id: string; }) => {
    updateProgram((draft: Program) => {
      draft.weeks[weekIndex]?.sessions[sessionIndex]?.items.push({
        type: 'exercise',
        data: {
          ...newExercise,
          unique_uid: String(uuid.v4()),
        },
        position: draft.weeks[weekIndex].sessions[sessionIndex].items.length
      });
    });
  }

  const removeExercise = useCallback((weekIndex: number, sessionIndex: number, exerciseId: any) => {
    updateProgram((draft: Program) => {
      const items = draft.weeks[weekIndex].sessions[sessionIndex].items;
      const index = items.findIndex((item: SessionItem) => item.type === 'exercise' && item.data.unique_uid === exerciseId);
      if (index !== -1) {
        items.splice(index, 1);
        items.forEach((item, i) => {
          item.position = i;
        });
      }
    });
  }, [updateProgram]);

  const addSuperset = useCallback((weekIndex: number, sessionIndex: number, parentExerciseId: any, supersetExercise: any) => {
    updateProgram((draft: Program) => {
      const parentExercise = draft.weeks[weekIndex].sessions[sessionIndex].items.find(
        (item: SessionItem) => item.type === 'exercise' && item.data.unique_uid === parentExerciseId
      );
      if (parentExercise) {
        parentExercise.data.superset = {
          ...supersetExercise,
          unique_uid: String(uuid.v4()),
        };
      }
    });
  }, [updateProgram]);

  const removeSuperset = useCallback((weekIndex: number, sessionIndex: number, exerciseId: any) => {
    updateProgram((draft: Program) => {
      const exercise = draft.weeks[weekIndex].sessions[sessionIndex].items.find(
        item => item.type === 'exercise' && item.data.unique_uid === exerciseId
      );
      if (exercise && exercise.data.superset) {
        delete exercise.data.superset;
      }
    });
  }, [updateProgram]);

  const addSession = useCallback((weekIndex: number) => {
    updateProgram((draft: Program) => {
      draft.weeks[weekIndex].sessions.push({
        items: []
      });
    });
  }, [updateProgram]);

  const removeSession = useCallback((weekIndex: number, sessionIndex: number) => {
    updateProgram((draft: Program) => {
      if (draft.weeks[weekIndex].sessions.length > 1) {
        draft.weeks[weekIndex].sessions.splice(sessionIndex, 1);
        draft.weeks[weekIndex].sessions.forEach((session, i) => {
          session.name = String.fromCharCode(97 + i);
        });
      }
    });
  }, [updateProgram]);

  const addWeek = useCallback(() => {
    updateProgram((draft: Program) => {
      draft.weeks.push({
        sessions: [{ items: [], name: 'A' }]
      });
    });
  }, [updateProgram]);

  const updateProgramMetadata = useCallback((updates: any) => {
    updateProgram((draft: Program) => {
      if (!draft?.metadata) {
        return;
      }
      Object.assign(draft.metadata, updates);
    });
  }, [updateProgram]);

  const updateSessionMetadata = useCallback((updates: any) => {
    updateProgram((draft: Program) => {
      Object.assign(draft.sessionMetadata, updates);
    });
  }, [updateProgram]);

  const updatePricing = useCallback((value: number) => {
    updateProgram((draft: Program) => {
      draft.pricing.value = value;
    });
  }, [updateProgram]);

  const addAsset = useCallback((weekIndex: number, sessionIndex: number, assetData: Exercise | { base64: string; uri: string; downloadUrl: string; id: string; }) => {
    updateProgram((draft: Program) => {
      const session = draft.weeks[weekIndex].sessions[sessionIndex];
      session.items.push({
        type: 'asset',
        data: {
          ...assetData,
          id: String(uuid.v4()),
        },
        position: session.items.length
      });
    });
  }, [updateProgram]);

  const removeAsset = useCallback((weekIndex: number, sessionIndex: number, assetId: any) => {
    updateProgram((draft: Program) => {
      const session = draft.weeks[weekIndex].sessions[sessionIndex];
      const index = session.items.findIndex(item => item.type === 'asset' && item.data.id === assetId);
      if (index !== -1) {
        session.items.splice(index, 1);
        session.items.forEach((item, i) => {
          item.position = i;
        });
      }
    });
  }, [updateProgram]);

  const createNewProgram = () => {
    const newProgram = {
      version: 1,
      uid: String(uuid.v4()),
      weeks: [
        {
          sessions: [
            { items: [], name: 'A' },
            { items: [], name: 'B' },
            { items: [], name: 'C' }
          ]
        }
      ],
      metadata: {
        is_published: true,
        name: '',
        description: '',
        owner: auth?.currentUser?.uid || '',
        categories: [],
        media: '',
      },
      sessionMetadata: { averageWorkoutDuration: 0 },
      pricing: { value: 0 }
    };

    updateProgram(() => newProgram);
  }

  return useMemo(() => ({
    program,
    isLoading,
    error,
    loadProgram,
    saveProgram,
    updateExercise,
    addExercise,
    removeExercise,
    addSuperset,
    removeSuperset,
    addSession,
    removeSession,
    addWeek,
    updateProgramMetadata,
    updateSessionMetadata,
    updatePricing,
    addAsset,
    removeAsset,
    updateProgram,
    createNewProgram
  }), [
    program,
    isLoading,
    error,
    loadProgram,
    saveProgram,
    updateExercise,
    addExercise,
    removeExercise,
    addSuperset,
    removeSuperset,
    addSession,
    removeSession,
    addWeek,
    updateProgramMetadata,
    updateSessionMetadata,
    updatePricing,
    addAsset,
    removeAsset,
    updateProgram,
    createNewProgram
  ]);
};