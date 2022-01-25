import React, { useEffect } from 'react';
import Reactium from 'reactium-core/sdk';
import { StatusBar, Text, View } from 'react-native';

export default () => {
    useEffect(() => {
        setTimeout(() => {
            StatusBar.setHidden(false);
        }, 250);
    }, []);

    return (
        <View style={[Reactium.Style.get('home').container]}>
            <StatusBar {...Reactium.Style.get('StatusBar')} />
            <Text style={[Reactium.Style.get('home').text]}>
                Hello Hoomans!
            </Text>
        </View>
    );
};
