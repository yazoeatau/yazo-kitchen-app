import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SplashScreen = () => {
    const navigation = useNavigation();
    const fadeAnim = useRef(new Animated.Value(0)).current;


    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

        const timer = setTimeout(() => {
            navigation.replace('Home');
        }, 2000);

        return () => clearTimeout(timer);
    }, [navigation]);


    return (
        <View style={styles.container}>
            <Animated.Image
                source={require('../assets/images/icon.png')}
                style={[styles.logo, { opacity: fadeAnim }]}
                resizeMode="contain"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 220,
        height: 220,
    },
});

export default SplashScreen;
