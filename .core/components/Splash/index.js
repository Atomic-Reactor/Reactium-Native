import _ from 'underscore';
import React, { useEffect } from 'react';
import SplashScreen from 'react-native-splash-screen';
import AnimatedSplash from 'react-native-animated-splash-screen';

import Reactium, {
    useHandle,
    useEventEffect,
    useSyncState,
} from 'reactium-core/sdk';

const Component = ({ children, ...props }) => {
    const app = useHandle('app');
    const newProps = { ...props };

    Reactium.Hook.runSync('splash-screen', newProps);

    const state = useSyncState({
        ...newProps,
        isLoaded: false,
    });

    const onRendered = () => {
        state.set('isLoaded', true);
    };

    useEffect(() => {
        if (state.get('isLoaded') === true) {
            SplashScreen.hide();
        }
    }, [state.get('isLoaded')]);

    useEventEffect(app, { rendered: onRendered });

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
