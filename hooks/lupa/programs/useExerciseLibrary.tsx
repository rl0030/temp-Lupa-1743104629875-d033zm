import { useQuery } from "@tanstack/react-query"
import { addExerciseToExerciseLibrary, getExerciseLibrary } from "../../../api/program/program"
import { auth } from "../../../services/firebase"
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchExerciseLibrary } from "../../../services/redux/exerciseLibrarySlice";
import { AppDispatch, RootState } from "../../../services/redux/store";
import { loadExerciseLibrary } from "../../../json/exercise_library/load_exercise_library";

const useFetchExerciseLibrary = (categories: Array<string> = []) => {
    const authUserUid = auth?.currentUser?.uid as string;
    return useQuery({
        queryFn: () => getExerciseLibrary(authUserUid, categories),
        queryKey: [authUserUid, 'use_fetch_exercise_library'],
    })
}

const useExerciseLibrary = () => {
    return {
        addExercise: addExerciseToExerciseLibrary,
        fetchExerciseLibrary: getExerciseLibrary
    }
}

interface LupaExercise {
  name: string;
  category: string;
  exercises: string[];
}

interface UserExercise {
  name: string;
  uid: string;
  category: string;
  media_uri_as_base64?: string;
  unique_uid?: string;
}

export const useFetchExerciseLibraryWithRedux = (includeLupaExercises: boolean = false) => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector((state: RootState) => state.exerciseLibrary);

  const refetch = () => dispatch(fetchExerciseLibrary());

  useEffect(() => {
    if (!data && !loading && !error) {
      dispatch(fetchExerciseLibrary());
    }
  }, [dispatch, data, loading, error]);

  const flattenedExercises = useMemo(() => {
    let exercises: UserExercise[] = [];

    // Add user exercises if they exist
    if (data) {
      exercises = Object.values(data).flat().map(exercise => ({
        name: exercise.name,
        uid: exercise.uid,
        category: exercise.category,
        media_uri_as_base64: exercise?.media_uri_as_base64,
        unique_uid: exercise?.unique_uid
      }));
    }

    // Add Lupa exercises if requested
    if (includeLupaExercises) {
      const lupaExercises = loadExerciseLibrary().then(lupaData => 
        lupaData.flatMap(category => 
          category.exercises.map(exercise => ({
            name: exercise,
            uid: `lupa_${category.category}_${exercise}`.replace(/\s+/g, '_').toLowerCase(),
            category: category.category,
            media_uri_as_base64: undefined,
            unique_uid: undefined
          }))
        )
      );

      // Combine both arrays and remove duplicates based on name
      const combinedExercises = [...exercises, ...lupaExercises];
      const uniqueExercises = Array.from(
        new Map(combinedExercises.map(item => [item.name, item])).values()
      );

      return uniqueExercises;
    }

    return exercises;
  }, [data, includeLupaExercises]);

  return { data, refetch, loading, error, flattenedExercises };
};

export { useFetchExerciseLibrary }
export default useExerciseLibrary