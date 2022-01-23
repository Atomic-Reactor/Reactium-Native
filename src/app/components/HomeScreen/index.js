import React from 'react';
import Reactium from 'reactium-core/sdk';
import { Text, View } from 'react-native';

export default () => {
    return (
        <View style={[Reactium.Style.get('home').container]}>
            <View>
                <Text style={[Reactium.Style.get('home').text]}>
                    Reactium Native has arrived!
                </Text>
            </View>
        </View>
    );
};
