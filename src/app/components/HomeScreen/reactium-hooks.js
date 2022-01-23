import component from './';
import domain from './domain';
import Reactium from 'reactium-core/sdk';

Reactium.Hook.registerSync('init', () => {
    console.log(
        `\tInit hook called on domain: ${domain.name} reactium-hooks.js file`,
    );
});

Reactium.Route.register(domain.name, {
    component,
    name: domain.name,
    options: {
        headerShown: false,
    },
});

Reactium.Style.register(domain.name, {
    container: {
        flex: 1,
        color: '#FFFFFF',
        backgroundColor: '#4F82BA',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 24,
    },
    text: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
