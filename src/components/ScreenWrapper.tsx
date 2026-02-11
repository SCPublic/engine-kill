import React, { useState } from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function ScreenWrapper({ children, style }: ScreenWrapperProps) {
  const [textureError, setTextureError] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {/* Layer 1: Pure black background */}
      <View style={styles.background} />

      {/* Layer 2: Texture overlay (optional; hide after load error to avoid console spam) */}
      {!textureError && (
        <Image
          source={require('../../assets/images/texture-overlay.png')}
          style={styles.textureLayer}
          resizeMode="cover"
          onError={() => setTextureError(true)}
          onLoad={() => {}}
        />
      )}

      {/* Layer 3: Metal frame border (disabled) */}
      {/* <ImageBackground
        source={require('../../assets/images/metal-frame.png')}
        style={styles.frameLayer}
        resizeMode="stretch"
        imageStyle={styles.frameImage}
        onError={(e) => console.error('Metal frame failed to load:', e.nativeEvent.error)}
        onLoad={() => console.log('Metal frame loaded successfully')}
      /> */}

      {/* Layer 4: Content area */}
      <View style={styles.contentArea}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    position: 'relative',
  },

  // Layer 1: Black background (green + black)
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },

  // Layer 2: Texture overlay
  textureLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.5, // Make texture more visible
    zIndex: 1,
  },

  // Layer 3: Metal frame
  frameLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20, // Above content to create visible border
    pointerEvents: 'none', // Allow touches to pass through to content
  },

  // Force the frame image to stretch to fill the entire container
  frameImage: {
    width: '100%',
    height: '100%',
  },

  // Layer 4: Content area
  contentArea: {
    flex: 1,
    position: 'relative',
    zIndex: 10, // Below metal frame but above texture
  },
});
