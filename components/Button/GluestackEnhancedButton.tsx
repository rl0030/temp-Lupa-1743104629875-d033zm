import React from 'react';
import {View} from 'react-native';
import {
  Button,
  ButtonProps,
  ButtonText,
  ButtonIcon,
  ButtonSpinner,
} from '@gluestack-ui/themed';
import OutlinedText from '../Typography/OutlinedText';

interface EnhancedButtonProps extends ButtonProps {
  leftIcon?: React.ReactElement;
  rightIcon?: React.ReactElement;
  isLoading?: boolean;
  outlineText?: boolean;
  children: React.ReactNode;
  leftIconColor: string;
  textColor?: string;
  fontSize?: string | number;
  outlineColor?: string;
}

const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  children,
  leftIcon,
  rightIcon,
  isLoading,
  outlineText,
  leftIconColor,
  textColor = 'white',
  outlineColor = 'black',
  fontSize,
  ...props
}) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          <ButtonSpinner mr="$1" />
          <ButtonText fontWeight="$medium" fontSize="$sm">
            Please wait...
          </ButtonText>
        </>
      );
    }

    const textContent = (
      <>
        {leftIcon && <ButtonIcon as={leftIcon} backgroundColor='transparent' size='lg' fill={leftIconColor} mr="$2" />}
        {outlineText ? (
          <View style={{position: 'relative'}}>
            <OutlinedText
              style={{
                fontWeight: '800',
                fontSize: fontSize
              }}
              fontSize={fontSize}
              textColor={textColor}
              outlineColor={outlineColor}>
              {children}
            </OutlinedText>
          </View>
        ) : (
          <ButtonText size={fontSize}>{children}</ButtonText>
        )}
        {rightIcon && <ButtonIcon as={rightIcon} ml="$2" />}
      </>
    );

    return textContent;
  };

  return <Button {...props}>{renderContent()}</Button>;
};

export default EnhancedButton;
