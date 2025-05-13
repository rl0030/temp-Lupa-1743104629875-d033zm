import { supabase } from '../../services/supabase';
import { Program, ProgramDetailsWithTrainerName } from '../../types/program';
import { LupaUser } from '../../types/user';

export const getProgram = async (
  uid: string,
  includeTrainerDetails: boolean = false,
): Promise<Program | ProgramDetailsWithTrainerName> => {
  try {
    const { data: program, error } = await supabase
      .from('programs')
      .select('*')
      .eq('uid', uid)
      .single();

    if (error) {
      throw error;
    }

    if (!program) {
      throw new Error(`Unable to find program with uid: ${uid}`);
    }

    if (includeTrainerDetails) {
      const { data: trainer, error: trainerError } = await supabase
        .from('users')
        .select('name, uid, picture')
        .eq('uid', program.metadata.owner)
        .single();

      if (trainerError) {
        throw trainerError;
      }

      return {
        program,
        trainer: {
          name: trainer?.name,
          picture: trainer?.picture,
          uid: trainer?.uid,
        },
      };
    }

    return program as Program;
  } catch (error) {
    console.error('Error in getProgram:', error);
    throw error;
  }
};

export const saveOrUpdateProgram = async (program: Program): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('programs')
      .upsert({
        ...program,
        updated_at: new Date(),
      })
      .select();

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error saving program to Supabase:', error);
    return false;
  }
};

export const getUserPrograms = async (uid: string): Promise<Program[]> => {
  try {
    const { data, error } = await supabase
      .from('purchased_programs')
      .select('programs')
      .eq('lupa_user_uid', uid)
      .single();

    if (error) {
      console.log('Error getting user programs:', error);
      return [];
    }

    return data?.programs || [];
  } catch (error) {
    console.log('Error getting user programs:', error);
    return [];
  }
};

export const getPurchasedPrograms = async (
  uid: string,
): Promise<ProgramDetailsWithTrainerName[]> => {
  try {
    const { data, error } = await supabase
      .from('purchased_programs')
      .select('programs')
      .eq('lupa_user_uid', uid)
      .single();

    if (error || !data) {
      return [];
    }

    const purchasedPrograms = data.programs as Program[];

    const programsWithTrainers = await Promise.all(
      purchasedPrograms.map(async program => {
        const { data: trainer, error: trainerError } = await supabase
          .from('users')
          .select('name, uid, picture')
          .eq('uid', program.metadata.owner)
          .single();

        if (trainerError) {
          return { program, trainer: '' };
        }

        return {
          program,
          trainer: { name: trainer.name, uid: trainer.uid, picture: trainer.picture },
        };
      }),
    );

    return programsWithTrainers;
  } catch (error) {
    console.log('Error getting purchased programs:', error);
    return [];
  }
};

export const isUserProgramPurchaser = async (
  uid: string,
  program_uid: string,
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('purchased_programs')
      .select('programs')
      .eq('lupa_user_uid', uid)
      .single();

    if (error || !data) {
      return false;
    }

    const userPrograms = data.programs;
    const isProgramPurchased = userPrograms.some(
      (program: Program) => program.uid === program_uid,
    );
    
    return isProgramPurchased;
  } catch (error) {
    console.log('Error checking if user purchased program:', error);
    return false;
  }
};

export const getProgramSuggestions = async (
  userInterests: string[],
): Promise<Program[]> => {
  try {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .contains('metadata->categories', userInterests);

    if (error) {
      throw error;
    }

    return data as Program[];
  } catch (error) {
    console.log('Error getting program suggestions:', error);
    return [];
  }
};

export const getExerciseLibrary = async (userId: string, categories = [] as Array<string>) => {
  try {
    const { data, error } = await supabase
      .from('exercise_library')
      .select('exercises')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Record not found, create a new one
        const { data: newData, error: insertError } = await supabase
          .from('exercise_library')
          .insert({ user_id: userId, exercises: {} })
          .select()
          .single();
          
        if (insertError) {
          throw insertError;
        }
        
        return {};
      }
      throw error;
    }

    if (categories && Array.isArray(categories) && categories.length > 0) {
      return Object.fromEntries(
        Object.entries(data.exercises).filter(([category]) => categories.includes(category))
      );
    }

    return data.exercises;
  } catch (error) {
    console.error('Error fetching exercise library:', error);
    throw error;
  }
};

export const addExerciseToExerciseLibrary = async (
  userId: string, 
  category: string, 
  name: string, 
  description: string, 
  media: string, 
  unique_uid: string
) => {
  try {
    // First get the current exercise library
    const { data, error } = await supabase
      .from('exercise_library')
      .select('exercises')
      .eq('user_id', userId)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    // Prepare the exercise object
    const exercise = {
      name,
      description,
      media_uri_as_base64: media,
      category,
      unique_uid
    };
    
    // Update or create the exercise library
    let exercises = data?.exercises || {};
    if (!exercises[category]) {
      exercises[category] = [];
    }
    
    exercises[category] = [...(exercises[category] || []), exercise];
    
    const { error: updateError } = await supabase
      .from('exercise_library')
      .upsert({ 
        user_id: userId, 
        exercises,
        updated_at: new Date()
      });
      
    if (updateError) {
      throw updateError;
    }
  } catch (error) {
    console.error("Error adding exercise to library: ", error);
    throw error;
  }
};