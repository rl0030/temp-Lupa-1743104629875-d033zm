import {getDatabase} from '@firebase/database';
import app from '.';

export const realtime_db = getDatabase(app);
