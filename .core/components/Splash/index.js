import React, { useEffect } from 'react';
import SplashScreen from 'react-native-splash-screen';
import AnimatedSplash from 'react-native-animated-splash-screen';

export default ({ children, isLoaded = false }) => {
    useEffect(() => {
        SplashScreen.hide();
    }, []);

    return (
        <AnimatedSplash
            translucent
            logoWidth={96}
            logoHeight={96}
            isLoaded={isLoaded}
            backgroundColor={'#FFFFFF'}
            logoImage={require('./assets/logo.png')}>
            {children}
        </AnimatedSplash>
    );
};
