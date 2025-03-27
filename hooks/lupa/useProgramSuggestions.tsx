import {useEffect, useState} from 'react';
import {collection, getDocs, query, where} from 'firebase/firestore';
import {auth, db} from '../../services/firebase';
import {LupaUser} from '../../types/user';
import {Program} from '../../types/program';

type ProgramSuggestion = {
  program: Program;
  matchingCategories: string[];
  trainer: {
    name: string;
    uid: string;
    picture: string;
  };
};

const useProgramSuggestions = (currentUser: LupaUser) => {
  const [programSuggestions, setProgramSuggestions] = useState<
    ProgramSuggestion[]
  >([]);

  useEffect(() => {
    const fetchProgramSuggestions = async () => {
      try {
        const programsQuery = query(
          collection(db, 'programs'),
          where('metadata.is_published', '==', true),
        );
        const programsSnapshot = await getDocs(programsQuery);
        const programsData = programsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as Program[];

        const userInterests = currentUser?.interest || [];

        const suggestedPrograms: ProgramSuggestion[] = await Promise.all(
          programsData.map(async (program) => {
           
    
            const matchingCategories = program?.metadata?.categories?.filter(
              category => userInterests.includes(category),
            ) ?? []

            // fetch trainere data
            const trainerQuery = query(
              collection(db, 'users'),
              where('uid', '==', program.metadata.owner)
            );
            const trainerSnapshot = await getDocs(trainerQuery);
            let trainerData: LupaUser | null = null;
            if (!trainerSnapshot.empty) {
              trainerData = trainerSnapshot.docs[0].data() as LupaUser;
            }

            return {
              program,
              matchingCategories,
              trainer: {
                name: trainerData?.name|| '',
                uid: trainerData?.uid || '',
                picture: trainerData?.picture || '',
              },
            };
          })
        );

        const sortedSuggestions = suggestedPrograms.sort(
          (a, b) => b.matchingCategories.length - a.matchingCategories.length,
        );

        const filteredSuggestions = sortedSuggestions.filter((suggestion) => suggestion.program.metadata.owner != auth?.currentUser?.uid as string)

        setProgramSuggestions(filteredSuggestions);
      } catch (error) {
        console.error('Error fetching program suggestions:', error);
        return [];
      }
    };

    fetchProgramSuggestions();
  }, [currentUser]);

  return programSuggestions;
};

export default useProgramSuggestions;
