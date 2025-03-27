import { Program } from "../../types/program"
import { LupaUser } from "../../types/user"

type ProgramWithTrainerDetails = {
    program: Program,
    trainer: Pick<LupaUser, 'name' | 'uid' | 'picture'>
}

export { type ProgramWithTrainerDetails }