import { useQuery } from "@tanstack/react-query"
import { auth } from "../../services/firebase"
import { fetchPayoutReports } from "../../api/firestore-httpsCallable/stripe"

const usePayoutReports = () => {
    return useQuery({
        queryKey: ['use_payout_reports', auth?.currentUser?.uid as string],
        queryFn: fetchPayoutReports
    })
}

export default usePayoutReports