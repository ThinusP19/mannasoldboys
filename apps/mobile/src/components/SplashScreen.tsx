import { View, Text, Image, StyleSheet } from 'react-native';

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/adaptive-icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.text}>Potch Gim Alumni</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f0e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 24,
  },
  text: {
    color: '#000000',
    fontSize: 24,
    fontWeight: '600',
  },
});
