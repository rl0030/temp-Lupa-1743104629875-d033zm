import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface OutlinedTextProps {
  children: React.ReactNode;
  textColor?: string;
  outlineColor?: string;
  fontSize?: number;
  style?: any;
}

const OutlinedText: React.FC<OutlinedTextProps> = ({ 
  children, 
  textColor = 'white', 
  outlineColor = 'black', 
  fontSize = 16, 
  style 
}) => {
  const offset = 1; // Adjust
  return (
    <View style={{ position: 'relative' }}>
     <Text style={[styles.outlineText, { left: -offset, top: 0, color: outlineColor, fontSize }, style]}>
        {children}
      </Text>
      <Text style={[styles.outlineText, { left: offset, top: 0, color: outlineColor, fontSize }, style]}>
        {children}
      </Text>
      <Text style={[styles.outlineText, { left: 0, top: -offset, color: outlineColor, fontSize }, style]}>
        {children}
      </Text>
      <Text style={[styles.outlineText, { left: 0, top: offset, color: outlineColor, fontSize }, style]}>
        {children}
      </Text>
      <Text style={[styles.mainText, { color: textColor, fontSize }, style]}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  outlineText: {
    position: 'absolute',
  },
  mainText: {
    position: 'relative',
  },
});

export default OutlinedText;