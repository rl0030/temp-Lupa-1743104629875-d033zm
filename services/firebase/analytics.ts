import { getAnalytics } from "firebase/analytics";
import app from ".";

const analyticsInstance = getAnalytics(app)

enum ViewItemCategory {
    FITNESS_PROGRAM
}

export { ViewItemCategory }
export default analyticsInstance

