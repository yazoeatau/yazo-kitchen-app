import React from 'react';
import { ActivityIndicator, Modal, View, StyleSheet } from 'react-native';

interface LoaderProps {
    visible: boolean;
    color?: string;
    backgroundColor?: string;
}

const Loader: React.FC<LoaderProps> = ({
    visible,
    color = '#2151ffff',
    backgroundColor = 'rgba(255, 255, 255, 0.82)',
}) => {
    return (
        <Modal transparent animationType="fade" visible={visible}>
            <View style={[styles.container, { backgroundColor }]}>
                <ActivityIndicator size={42} color={color} />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Loader;
