import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import Svg, {Circle, Path, Ellipse} from 'react-native-svg';

interface LogoProps {
  size?: number;
  style?: ViewStyle;
  color?: string;
}

// Camera logo exactly matching your provided image
const Logo: React.FC<LogoProps> = ({size = 60, style, color = '#000000'}) => {
  return (
    <View style={[styles.container, style]}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {/* Outer camera ring */}
        <Circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke={color}
          strokeWidth="5"
        />
        
        {/* Inner white ring */}
        <Circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4"
        />
        
        {/* Main camera lens (black circle) */}
        <Circle
          cx="100"
          cy="100"
          r="55"
          fill={color}
        />
        
        {/* Lens highlight (white dot) */}
        <Circle
          cx="80"
          cy="75"
          r="10"
          fill="#FFFFFF"
        />
        
        {/* Camera button/flash on top */}
        <Circle
          cx="130"
          cy="45"
          r="8"
          fill={color}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Logo;
