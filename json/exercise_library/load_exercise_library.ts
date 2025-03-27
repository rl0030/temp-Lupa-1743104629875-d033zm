import library from './exercise_library.json'
type Exercise = string;

export type ExerciseCategory = {
  name: string;
  category: string;
  exercises: Exercise[];
};

type ExerciseLibrary = {
  [key: string]: ExerciseCategory[];
};

export  function loadExerciseLibrary(): ExerciseCategory[] {
  try {
    // Convert to expected format
    const data: ExerciseLibrary = library;

    // Flatten and sort
    const flattenedData: ExerciseCategory[] = Object.values(data).flat();
    flattenedData.sort((a, b) => a.name.localeCompare(b.name));

    return flattenedData;
  } catch (error) {
    console.error('Error loading exercise library:', error);
    return [];
  }
}

// Function to render the exercise library as a list
export function renderExerciseList(exerciseLibrary: ExerciseCategory[]): string {
  let output = '';

  for (const category of exerciseLibrary) {
    output += `${category.name}\n`;
    for (const exercise of category.exercises) {
      output += `  ${exercise}\n`;
    }
    output += '\n';
  }

  return output;
}