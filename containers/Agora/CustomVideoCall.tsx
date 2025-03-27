import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Draggable from 'react-native-draggable';
import {
  createAgoraRtcEngine,
  RtcSurfaceView,
  ChannelProfileType,
  ClientRoleType,
} from 'react-native-agora';
import { screenWidth } from '../../constant/size';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DraggableAgoraVideoCall = ({ connectionData, rtcCallbacks, isDraggable = true, style }) => {
  const [localUid, setLocalUid] = useState(null);
  const [remoteUid, setRemoteUid] = useState(null);
  const engineRef = useRef(null);

  useEffect(() => {
    const initializeAgora = async () => {
      engineRef.current = createAgoraRtcEngine();
      await engineRef.current.initialize({
        appId: connectionData.appId,
      });

      engineRef.current.registerEventHandler({
        onJoinChannelSuccess: (connection, elapsed) => {
          console.log('Local user joined', connection.localUid);
          setLocalUid(connection.localUid);
        },
        onUserJoined: (connection, remoteUid, elapsed) => {
          console.log('Remote user joined', remoteUid);
          setRemoteUid(remoteUid);
        },
        onUserOffline: (connection, remoteUid, reason) => {
          console.log('Remote user left', remoteUid);
          setRemoteUid(null);
        },
        onError: (err, msg) => {
          console.error('Agora error', err, msg);
          if (rtcCallbacks.Error) rtcCallbacks.Error(err);
        },
      });

      await engineRef.current.enableVideo();
      await engineRef.current.startPreview();
      await engineRef.current.joinChannel(
        connectionData.rtcToken,
        connectionData.channel,
        connectionData.rtcUid,
        {
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        }
      );
    };

    initializeAgora();

    return () => {
      if (engineRef.current) {
        engineRef.current.leaveChannel();
        engineRef.current.release();
      }
    };
  }, [connectionData, rtcCallbacks]);

  const videoContent = (
    <View style={[styles.container, style]}>
      {remoteUid && (
        <RtcSurfaceView
          style={styles.remoteVideo}
          canvas={{ uid: remoteUid }}
        />
      )}
      {localUid && (
        <RtcSurfaceView
          style={styles.localVideo}
          canvas={{ uid: localUid }}
          zOrderMediaOverlay={true}
        />
      )}
    </View>
  );

  if (isDraggable) {
    return (
      <Draggable
        x={SCREEN_WIDTH - 220}
        y={20}
        minX={0}
        minY={0}
        maxX={SCREEN_WIDTH - 200}
        maxY={SCREEN_HEIGHT - 220}
      >
        {videoContent}
      </Draggable>
    );
  }

  return videoContent;
};

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
  localVideo: {
    width: 80,
    height: 136,
    position: 'absolute',
    top: screenWidth / 1.2,
    right: 10,
    zIndex: 1,
  },
});

export default DraggableAgoraVideoCall;