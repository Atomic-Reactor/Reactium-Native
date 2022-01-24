import React from 'react';
import AnimatedSplash from 'react-native-animated-splash-screen';

export default ({ children, isLoaded = false }) => {
    return (
        <AnimatedSplash
            translucent
            logoWidth={96}
            logoHeight={96}
            isLoaded={isLoaded}
            backgroundColor={'#262626'}
            logoImage={require('./assets/logo.png')}>
            {children}
        </AnimatedSplash>
    );
};
