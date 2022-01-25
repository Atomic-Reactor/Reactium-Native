import domain from './domain';
import Component from './index';
import Reactium from 'reactium-core/sdk';
// import { StyleSheet } from 'react-native';

(() => {
    Reactium.Component.register(
        domain.name,
        Component,
        Reactium.Enums.priority.highest,
    );

    Reactium.Style.register('StatusBar', {
        hidden: true,
        translucent: true,
        backgroundColor: 'transparent',
        barStyle: 'dark-content',
        networkActivityIndicatorVisible: true,
    });
})();
