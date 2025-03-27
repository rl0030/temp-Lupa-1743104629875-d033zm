import { Dimensions } from "react-native";

const screenWidth = Dimensions.get('screen').width
const screenHeight = Dimensions.get('screen').height

const windowWidth = Dimensions.get('window').width
const windowHeight = Dimensions.get('window').height

export { screenHeight, screenWidth, windowHeight, windowWidth }