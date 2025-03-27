import React from 'react';
import {View, Image, StyleSheet} from 'react-native';
import {Avatar, AvatarImage, Box as GlueBox} from '@gluestack-ui/themed';
import {LupaUser} from '../../types/user';
import LinearGradient from 'react-native-linear-gradient';

const PackMemberHeader = ({members}: {members: LupaUser[]}) => {
    const getTopAndBottom = (index) => {
        switch(index) {
            case 0:
                return { top: 14, left: 10 }
            case 1:
                return { top: 14, right: 14 }
            case 2:
                return { bottom: 20, right: 6}
            case 3: 
                return { bottom: 5, left: 24 }
            default:
        }
    }

    const getWidthAndHeight = (index) => {
        switch(index) {
            case 0:
                return { width: 45, height: 45 }
            case 1:
                return { width: 23, height: 23 }
            case 2:
                return { width: 35, height: 35 }
            case 3: 
                return { width: 29, height: 29  }
            default:
        }
    }

  return (
      <LinearGradient
      colors={['rgba(252, 255, 106, 1)', 'rgba(226, 227, 228, 1)']}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        width: '100%',
        position: 'relative',
        height: '100%',
      }} style={styles.group}>
          <View style={styles.overlapGroup}>
            {members.map((member, idx) => {
              return (
                <Avatar style={{ ...getWidthAndHeight(idx), position: 'absolute', ...getTopAndBottom(idx) }}>
                    <AvatarImage source={{ uri: member?.picture }} />
                </Avatar>
              );
            })}
          </View>
      </LinearGradient>
  );
};

const styles = StyleSheet.create({
  box: {
    height: 95,
    width: 95,
    backgroundColor: 'rgba(252, 255, 106, 1)',
    borderRadius: 200
  },
  group: {

    height: 95,
    width: 95,
    backgroundColor: 'rgba(252, 255, 106, 1)',
    borderRadius: 200,
    borderRadius: 50,
    shadowColor: '#a5a5a5',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  avatars: {
    height: 75,
    width: 78,
    position: 'absolute',
    left: 9,
    top: 12,
  },
  overlapGroup: {
    height: 95,
    width: 95,
    position: 'relative',
  },
  ellipse: {
    height: 75,
    width: 75,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  img: {
    height: 65,
    width: 65,
    position: 'absolute',
    left: 43,
    top: 26,
  },
  ellipse2: {
    height: 53,
    width: 53,
    position: 'absolute',
    left: 47,
    top: 0,
  },
  ellipse3: {
    height: 59,
    width: 59,
    position: 'absolute',
    left: 16,
    top: 46,
  },
});

export default PackMemberHeader;