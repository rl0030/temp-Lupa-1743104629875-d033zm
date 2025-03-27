import { StyleSheet } from "react-native"

const container = {
    flex: 1
}

const globalStyles = StyleSheet.create({
    bottomSheetContainer: {
        flex: 1
    },
    container: {
        flex: 1
    },
    center: {
        alignItems: 'center', justifyContent: 'center'
    },
    containerWithSeparatedContent: {
        flex: 1,
        justifyContent: 'space-between'
    },
    paddedContainer: {
        flex: 1,
        marginTop: 85
    }
})

export default globalStyles