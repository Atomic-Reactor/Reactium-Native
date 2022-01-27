import component from './';
import domain from './domain';
import Reactium from 'reactium-core/sdk';
import { StyleSheet } from 'react-native';

(() => {
    Reactium.Route.register(domain.name, {
        component,
        name: domain.name,
        options: {
            headerShown: false,
        },
    });

    Reactium.Style.register(
        domain.name,
        StyleSheet.create({
            container: {
                flex: 1,
                color: '#FFFFFF',
                alignItems: 'center',
                backgroundColor: '#4F82BA',
                justifyContent: 'center',
                padding: 24,
            },
            text: {
                color: 'white',
                fontSize: 24,
                fontWeight: 'bold',
                textAlign: 'center',
            },
        }),
    );
})();
