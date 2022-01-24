import React, { forwardRef } from 'react';
import Reactium, { useHandle } from 'reactium-sdk/core';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

let Navigator = (props, ref) => {
    const app = useHandle('AppState');
    return (
        <NavigationContainer ref={ref}>
            {app.shouldRender() ? (
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
            ) : null}
        </NavigationContainer>
    );
};

Navigator = forwardRef(Navigator);

export { Navigator, Navigator as default };
