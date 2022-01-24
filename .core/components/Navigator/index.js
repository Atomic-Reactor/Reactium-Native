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
        <Splash isLoaded={props.isLoaded}>
            <NavigationContainer ref={ref}>
                <Stack.Navigator
                    screenListeners={{ focus: app.routeChanged }}
                    initialRouteName={app.get('route.current')}>
                    {Reactium.Route.list.map((route, i) => (
                        <Stack.Screen
                            {...route}
                            key={`route-${i}-${route.id}`}
                        />
                    ))}
                </Stack.Navigator>
            </NavigationContainer>
        </Splash>
    );
};

Navigator = forwardRef(Navigator);

export { Navigator, Navigator as default };
