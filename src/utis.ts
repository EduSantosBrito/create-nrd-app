import Spinnies from 'spinnies';
import { Spinner } from './types';

const bouncingBarEffect: Spinner = {
    interval: 80,
    frames: [
        '[    ]',
        '[=   ]',
        '[==  ]',
        '[=== ]',
        '[ ===]',
        '[  ==]',
        '[   =]',
        '[    ]',
        '[   =]',
        '[  ==]',
        '[ ===]',
        '[====]',
        '[=== ]',
        '[==  ]',
        '[=   ]',
    ],
};

export const spinnies = new Spinnies({
    spinner: bouncingBarEffect,
});
