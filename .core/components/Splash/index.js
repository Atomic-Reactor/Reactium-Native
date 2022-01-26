import React, { useEffect } from 'react';
import SplashScreen from 'react-native-splash-screen';
import Reactium, { useSyncState } from 'reactium-core/sdk';
import AnimatedSplash from 'react-native-animated-splash-screen';

const Component = ({ children, ...props }) => {
    const state = useSyncState({
        ...props,
    });

    useEffect(() => {
        SplashScreen.hide();

        const newProps = { ...state.get() };

        Reactium.Hook.runSync('splash-screen', newProps);

        delete newProps.isLoaded;

        state.set(newProps);
    }, []);

    useEffect(() => {
        const isLoaded = state.get('isLoaded');
        if (isLoaded !== props.isLoaded) {
            state.set('isLoaded', props.isLoaded);
        }
    }, [props.isLoaded]);

    return <AnimatedSplash {...state.get()} children={children} />;
};

Component.defaultProps = {
    backgroundColor: '#FFFFFF',
    isLoaded: false,
    logoWidth: 96,
    logoHeight: 96,
    logoImage: require('./assets/logo.png'),
    translucent: true,
};

export default Component;
