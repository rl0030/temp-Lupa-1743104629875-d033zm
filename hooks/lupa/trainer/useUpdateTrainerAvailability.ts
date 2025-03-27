import { useMutation } from "@tanstack/react-query";
import { updateTrainerAvailability } from "../../../api/trainer";

type UpdateTrainerAvailabilityVariables = {
    trainerUid: string;
    availableSlots: any[];
  };

  
export const useUpdateTrainerAvailability = () => {
    return useMutation<void, Error, UpdateTrainerAvailabilityVariables>({
      mutationFn: async ({trainerUid, availableSlots}) => {
        try {
          await updateTrainerAvailability(trainerUid, availableSlots);
        } catch (error) {
          console.error('Error in useUpdateTrainerAvailability:', error);
          throw error; // Re-throw the error to be caught by the mutation
        }
      },
    });
  };