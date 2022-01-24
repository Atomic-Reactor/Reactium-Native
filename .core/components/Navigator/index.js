import React, { forwardRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Reactium, { useHandle, useHookComponent } from 'reactium-core/sdk';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

let Navigator = (props, ref) => {
    const app = useHandle('AppState');
    const Splash = useHookComponent('Splash');

    const splashProps = {
        name: 'splash',
        component: Splash,
        options: { headerShown: false },
    };

    return (
        <NavigationContainer ref={ref}>
            <Stack.Navigator
                initialRouteName={app.get('route.current')}
                screenListeners={{ focus: app.routeChanged }}>
                <Stack.Screen {...splashProps} />
                {app.shouldRender()
                    ? Reactium.Route.list.map((route, i) => (
                          <Stack.Screen
                              {...route}
                              key={`route-${route.name}-${i}`}
                          />
                      ))
                    : null}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

Navigator = forwardRef(Navigator);

export { Navigator, Navigator as default };
