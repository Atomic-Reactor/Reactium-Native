import op from 'object-path';
import React, { forwardRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Reactium, { useHandle, useHookComponent } from 'reactium-core/sdk';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

let Navigator = ({ route = 'home', ...props }, ref) => {
    const app = useHandle('app');
    const Splash = useHookComponent('Splash');

    const validateRoute = route => {
        const perms = op.get(route, 'permission');
        return !perms ? true : app.User.can(perms);
    };

    return (
        <Splash isLoaded={props.isLoaded}>
            <NavigationContainer ref={ref}>
                <Stack.Navigator
                    initialRouteName={route}
                    screenListeners={{ focus: app.routeChanged }}>
                    {Reactium.Route.list
                        .filter(validateRoute)
                        .map((route, i) => (
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
