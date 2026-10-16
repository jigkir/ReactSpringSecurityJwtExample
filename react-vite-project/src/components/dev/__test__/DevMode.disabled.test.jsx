import {fireEvent, render, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {DevModeProvider, DevModeToggle, useDevMode} from '../DevMode.jsx';

vi.mock('../../config/Config.jsx', () => ({
    DEV_MODE_ENABLED: false,
    default: 'http://localhost:8080/api/',
}));

function DevModeStatus() {
    const {devAvailable, devMode, toggleDevMode} = useDevMode();
    return (
        <div>
            <span data-testid="available">{String(devAvailable)}</span>
            <span data-testid="mode">{String(devMode)}</span>
            <button onClick={toggleDevMode} data-testid="force-toggle">force</button>
        </div>
    );
}

beforeEach(() => {
    localStorage.clear();
});

describe('DevMode (Dev Mode disabled in Config.jsx)', () => {
    it('shouldReportUnavailableAndOffEvenWhenLocalStorageSaysOn', () => {
        localStorage.setItem('devMode', 'true');

        render(<DevModeProvider><DevModeStatus/></DevModeProvider>);

        expect(screen.getByTestId('available')).toHaveTextContent('false');
        expect(screen.getByTestId('mode')).toHaveTextContent('false');
    });

    it('shouldRenderNoToggleButton', () => {
        render(<DevModeProvider><DevModeToggle dark={false}/></DevModeProvider>);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('shouldNotWriteToLocalStorage', () => {
        render(<DevModeProvider><DevModeStatus/></DevModeProvider>);

        fireEvent.click(screen.getByTestId('force-toggle'));

        expect(localStorage.getItem('devMode')).toBeNull();
    });
});