import component from './';
import domain from './domain';
import Reactium from 'reactium-core/sdk';

Reactium.Hook.registerSync('init', () => {
    console.log(
        `\tInit hook called on domain: ${domain.id} reactium-hooks.js file`,
    );
});

Reactium.Route.register(domain.id, {
    component,
    name: domain.id,
    options: {
        headerShown: false,
    },
});

Reactium.Style.register(domain.id, {
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
